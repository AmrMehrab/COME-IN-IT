import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  assignHealthProviderRole,
  createBusinessEntityForUser,
  createHealthConsentForUser,
  createHealthProfileForUser,
  createHealthProvider,
  getDb,
  listHealthRecordReferencesForUser,
  listBusinessEntitiesForUser,
  listKybVerificationsForUser,
  requestEmergencyHealthAccess,
  requestHealthAccess,
  reviewEmergencyHealthAccess,
  reviewKycVerification,
  reviewKybVerification,
  revokeHealthConsentForUser,
  reviewHealthRecordReference,
  submitKycVerificationForUser,
  submitKybVerificationForUser,
  submitHealthRecordReferenceForUser,
  updateHealthProviderVerification,
} from "./db";
import {
  auditEvents,
  businessEntities,
  healthAccessLogs,
  healthConsents,
  healthEmergencyAccessRequests,
  healthProfiles,
  healthProviderRoles,
  healthProviders,
  healthRecordReferences,
  kycVerifications,
  kybVerifications,
  persons,
  users,
} from "../drizzle/schema";

describe("healthcare domain isolation", () => {
  it("requires KYC and a time-scoped consent before access, while preserving a reviewable emergency path", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const database = db!;

    const insertedAdmin = await database.insert(users).values({
      openId: `health-admin-${crypto.randomUUID()}`,
      name: "Health integration admin",
      loginMethod: "integration-test",
      role: "admin",
    });
    const insertedPatient = await database.insert(users).values({
      openId: `health-patient-${crypto.randomUUID()}`,
      name: "Health integration patient",
      loginMethod: "integration-test",
    });
    const insertedClinician = await database.insert(users).values({
      openId: `health-clinician-${crypto.randomUUID()}`,
      name: "Health integration clinician",
      loginMethod: "integration-test",
    });
    const adminUserId = Number(insertedAdmin[0].insertId);
    const patientUserId = Number(insertedPatient[0].insertId);
    const clinicianUserId = Number(insertedClinician[0].insertId);
    let providerId: number | undefined;
    let profileId: number | undefined;

    try {
      await expect(
        createHealthProfileForUser(patientUserId, `health-id-${crypto.randomUUID()}`),
      ).rejects.toThrow("A verified KYC identity is required before creating a health profile");

      const kycSubmission = await submitKycVerificationForUser(patientUserId, { countryCode: "EG" });
      await reviewKycVerification(patientUserId, kycSubmission.latest!.id, "verified", "Healthcare integration test approval");

      const healthProfileSummary = await createHealthProfileForUser(patientUserId, `health-id-${crypto.randomUUID()}`);
      expect(healthProfileSummary.profile?.status).toBe("active");
      expect(healthProfileSummary.profile).not.toHaveProperty("healthIdentityReference");
      profileId = healthProfileSummary.profile!.id;

      const provider = await createHealthProvider(adminUserId, {
        legalName: `Healthcare Integration Provider ${crypto.randomUUID().slice(0, 8)}`,
        providerType: "clinic",
      });
      providerId = provider.providerId;
      await updateHealthProviderVerification(adminUserId, providerId, "verified");
      await assignHealthProviderRole(adminUserId, {
        healthProviderId: providerId,
        userId: clinicianUserId,
        role: "emergency_clinician",
      });

      const deniedBeforeConsent = await requestHealthAccess(clinicianUserId, {
        healthProfileId: profileId,
        healthProviderId: providerId,
        purposeCode: "care_delivery",
        scopeCodes: ["lab_result"],
      });
      expect(deniedBeforeConsent).toEqual({ decision: "denied", reasonCode: "consent_missing_or_out_of_scope" });

      const consent = await createHealthConsentForUser(patientUserId, {
        beneficiaryProviderId: providerId,
        purposeCode: "care_delivery",
        scopeCodes: ["lab_result"],
        evidenceHash: "health-consent-evidence-hash",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const allowedWithConsent = await requestHealthAccess(clinicianUserId, {
        healthProfileId: profileId,
        healthProviderId: providerId,
        purposeCode: "care_delivery",
        scopeCodes: ["lab_result"],
      });
      expect(allowedWithConsent).toEqual({ decision: "allowed", reasonCode: null });

      const deniedOutOfScope = await requestHealthAccess(clinicianUserId, {
        healthProfileId: profileId,
        healthProviderId: providerId,
        purposeCode: "care_delivery",
        scopeCodes: ["imaging_report"],
      });
      expect(deniedOutOfScope).toEqual({ decision: "denied", reasonCode: "consent_missing_or_out_of_scope" });

      await revokeHealthConsentForUser(patientUserId, consent.consentId, "integration test revocation");
      const deniedAfterRevocation = await requestHealthAccess(clinicianUserId, {
        healthProfileId: profileId,
        healthProviderId: providerId,
        purposeCode: "care_delivery",
        scopeCodes: ["lab_result"],
      });
      expect(deniedAfterRevocation).toEqual({ decision: "denied", reasonCode: "consent_missing_or_out_of_scope" });

      await expect(
        createHealthConsentForUser(patientUserId, {
          beneficiaryProviderId: providerId,
          purposeCode: "care_delivery",
          scopeCodes: ["lab_result"],
          evidenceHash: "health-consent-expired-input",
          expiresAt: new Date(Date.now() - 60_000),
        }),
      ).rejects.toThrow("Health consent expiry must be in the future");

      // Simulates passage of time after issuance; no clinical data is ever inserted.
      await database.insert(healthConsents).values({
        healthProfileId: profileId,
        beneficiaryProviderId: providerId,
        purposeCode: "care_delivery",
        scopeJson: JSON.stringify({ scopeCodes: ["lab_result"] }),
        status: "active",
        evidenceHash: "health-consent-expired-persistence",
        issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 60_000),
      });
      const deniedAfterExpiry = await requestHealthAccess(clinicianUserId, {
        healthProfileId: profileId,
        healthProviderId: providerId,
        purposeCode: "care_delivery",
        scopeCodes: ["lab_result"],
      });
      expect(deniedAfterExpiry).toEqual({ decision: "denied", reasonCode: "consent_missing_or_out_of_scope" });

      const emergencyRequest = await requestEmergencyHealthAccess(clinicianUserId, {
        healthProfileId: profileId,
        healthProviderId: providerId,
        reasonCode: "life_threatening_emergency",
      });
      expect(emergencyRequest.status).toBe("requested");
      const emergencyReview = await reviewEmergencyHealthAccess(
        adminUserId,
        emergencyRequest.requestId,
        "granted",
        new Date(Date.now() + 15 * 60 * 1000),
        "integration test review",
      );
      expect(emergencyReview.status).toBe("granted");

      const accessAudit = await database
        .select({ action: auditEvents.action, resourceType: auditEvents.resourceType, dataClassification: auditEvents.dataClassification })
        .from(auditEvents)
        .where(eq(auditEvents.resourceId, String(profileId)));
      expect(accessAudit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: "health_access_denied", resourceType: "health_profile", dataClassification: "confidential_sovereign" }),
          expect.objectContaining({ action: "health_access_allowed", resourceType: "health_profile", dataClassification: "confidential_sovereign" }),
        ]),
      );
    } finally {
      for (const userId of [adminUserId, patientUserId, clinicianUserId]) {
        await database.delete(auditEvents).where(eq(auditEvents.actorUserId, userId));
      }
      if (profileId) {
        await database.delete(healthAccessLogs).where(eq(healthAccessLogs.healthProfileId, profileId));
        await database.delete(healthEmergencyAccessRequests).where(eq(healthEmergencyAccessRequests.healthProfileId, profileId));
        await database.delete(healthConsents).where(eq(healthConsents.healthProfileId, profileId));
        await database.delete(healthProfiles).where(eq(healthProfiles.id, profileId));
      }
      if (providerId) {
        await database.delete(healthProviderRoles).where(eq(healthProviderRoles.healthProviderId, providerId));
        await database.delete(healthProviders).where(eq(healthProviders.id, providerId));
      }
      for (const userId of [adminUserId, patientUserId, clinicianUserId]) {
        const person = await database.select({ id: persons.id }).from(persons).where(eq(persons.userId, userId)).limit(1);
        if (person[0]) await database.delete(kycVerifications).where(eq(kycVerifications.personId, person[0].id));
        await database.delete(users).where(eq(users.id, userId));
      }
    }
  }, 30_000);

  it("keeps Healthcare foreign keys out of commerce and baseline-verification tables", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();

    const rawResult = await db!.execute(sql`
      SELECT
        TABLE_NAME AS tableName,
        COLUMN_NAME AS columnName,
        REFERENCED_TABLE_NAME AS referencedTableName
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND (
          (
            TABLE_NAME IN (
              'business_entities',
              'business_memberships',
              'kyc_verifications',
              'kyb_verifications',
              'specification_bookmarks',
              'audit_events'
            )
            AND REFERENCED_TABLE_NAME LIKE 'health_%'
          )
          OR (
            TABLE_NAME LIKE 'health_%'
            AND REFERENCED_TABLE_NAME IN (
              'business_entities',
              'business_memberships',
              'kyc_verifications',
              'kyb_verifications',
              'specification_bookmarks',
              'audit_events'
            )
          )
        )
    `);
    const rows = Array.isArray(rawResult) && Array.isArray(rawResult[0]) ? rawResult[0] : rawResult;
    expect(rows).toEqual([]);
  });

  it("stores health record provenance as immutable references and hashes only, without clinical content", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const database = db!;
    const insertedAdmin = await database.insert(users).values({
      openId: `health-provenance-admin-${crypto.randomUUID()}`,
      name: "Health provenance admin",
      loginMethod: "integration-test",
      role: "admin",
    });
    const insertedPatient = await database.insert(users).values({
      openId: `health-provenance-patient-${crypto.randomUUID()}`,
      name: "Health provenance patient",
      loginMethod: "integration-test",
    });
    const adminUserId = Number(insertedAdmin[0].insertId);
    const patientUserId = Number(insertedPatient[0].insertId);
    let profileId: number | undefined;

    try {
      const kyc = await submitKycVerificationForUser(patientUserId, { countryCode: "EG" });
      await reviewKycVerification(adminUserId, kyc.latest!.id, "verified", "provenance test KYC approval");
      const profile = await createHealthProfileForUser(patientUserId, `health-provenance-${crypto.randomUUID()}`);
      profileId = profile.profile!.id;

      await expect(
        submitHealthRecordReferenceForUser(patientUserId, {
          sourceType: "professional_encounter",
          externalReferenceHash: "a".repeat(64),
          integrityHash: "b".repeat(64),
          occurredAt: new Date(Date.now() - 60_000),
        }),
      ).rejects.toThrow("A verified source provider is required");

      const submitted = await submitHealthRecordReferenceForUser(patientUserId, {
        sourceType: "patient_statement",
        externalReferenceHash: "a".repeat(64),
        integrityHash: "b".repeat(64),
        occurredAt: new Date(Date.now() - 60_000),
      });
      expect(submitted.provenanceStatus).toBe("submitted");

      const subjectView = await listHealthRecordReferencesForUser(patientUserId);
      expect(subjectView).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: submitted.recordReferenceId, sourceType: "patient_statement", provenanceStatus: "submitted" }),
        ]),
      );
      expect(subjectView.find(row => row.id === submitted.recordReferenceId)).not.toHaveProperty("externalReferenceHash");
      expect(subjectView.find(row => row.id === submitted.recordReferenceId)).not.toHaveProperty("integrityHash");

      const reviewed = await reviewHealthRecordReference(adminUserId, submitted.recordReferenceId, "verified");
      expect(reviewed.provenanceStatus).toBe("verified");

      const amendment = await submitHealthRecordReferenceForUser(patientUserId, {
        sourceType: "patient_statement",
        externalReferenceHash: "c".repeat(64),
        integrityHash: "d".repeat(64),
        occurredAt: new Date(Date.now() - 30_000),
        amendsRecordId: submitted.recordReferenceId,
        amendmentReason: "corrected_reference",
      });
      const original = await database
        .select({ provenanceStatus: healthRecordReferences.provenanceStatus })
        .from(healthRecordReferences)
        .where(eq(healthRecordReferences.id, submitted.recordReferenceId))
        .limit(1);
      expect(original[0]?.provenanceStatus).toBe("superseded");
      expect(amendment.provenanceStatus).toBe("submitted");

      const provenanceAudit = await database
        .select({ action: auditEvents.action, dataClassification: auditEvents.dataClassification })
        .from(auditEvents)
        .where(eq(auditEvents.resourceId, String(submitted.recordReferenceId)));
      expect(provenanceAudit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: "health_record_reference_submitted", dataClassification: "highly_sensitive_health" }),
          expect.objectContaining({ action: "health_record_reference_reviewed", dataClassification: "highly_sensitive_health" }),
        ]),
      );
    } finally {
      for (const userId of [adminUserId, patientUserId]) {
        await database.delete(auditEvents).where(eq(auditEvents.actorUserId, userId));
      }
      if (profileId) {
        await database.delete(healthRecordReferences).where(eq(healthRecordReferences.healthProfileId, profileId));
        await database.delete(healthProfiles).where(eq(healthProfiles.id, profileId));
      }
      for (const userId of [adminUserId, patientUserId]) {
        const person = await database.select({ id: persons.id }).from(persons).where(eq(persons.userId, userId)).limit(1);
        if (person[0]) await database.delete(kycVerifications).where(eq(kycVerifications.personId, person[0].id));
        await database.delete(users).where(eq(users.id, userId));
      }
    }
  }, 30_000);

  it("preserves the KYC-to-KYB business eligibility sequence after Healthcare integration", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const database = db!;
    const inserted = await database.insert(users).values({
      openId: `health-regression-trade-${crypto.randomUUID()}`,
      name: "Healthcare trade-regression test",
      loginMethod: "integration-test",
    });
    const userId = Number(inserted[0].insertId);

    try {
      const kycSubmission = await submitKycVerificationForUser(userId, { countryCode: "EG" });
      await reviewKycVerification(userId, kycSubmission.latest!.id, "verified", "healthcare regression KYC approval");

      const business = await createBusinessEntityForUser(userId, {
        legalName: `Healthcare Regression Trade Entity ${crypto.randomUUID().slice(0, 8)}`,
        entityType: "factory",
      });
      const kybSubmission = await submitKybVerificationForUser(userId, business.id, {
        registrationReference: "healthcare-regression-kyb-reference",
      });
      await reviewKybVerification(userId, kybSubmission!.id, "verified", "healthcare regression KYB approval");

      const kybHistory = await listKybVerificationsForUser(userId);
      expect(kybHistory.find(row => row.id === kybSubmission!.id)?.status).toBe("verified");
      const persistedBusiness = await database
        .select({ verificationStatus: businessEntities.verificationStatus })
        .from(businessEntities)
        .where(eq(businessEntities.id, business.id))
        .limit(1);
      expect(persistedBusiness[0]?.verificationStatus).toBe("verified");

      const businessWorkspace = await listBusinessEntitiesForUser(userId);
      expect(businessWorkspace).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: business.id,
            legalName: business.legalName,
            verificationStatus: "verified",
            membershipStatus: "active",
          }),
        ]),
      );
    } finally {
      await database.delete(auditEvents).where(eq(auditEvents.actorUserId, userId));
      await database.delete(kybVerifications).where(eq(kybVerifications.submittedByUserId, userId));
      await database.delete(businessEntities).where(eq(businessEntities.ownerUserId, userId));
      await database.delete(users).where(eq(users.id, userId));
    }
  }, 20_000);
});
