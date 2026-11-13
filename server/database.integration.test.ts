import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  auditEvents,
  biometricConsents,
  businessEntities,
  businessMemberships,
  kycVerifications,
  kybVerifications,
  persons,
  specificationBookmarks,
  users,
} from "../drizzle/schema";
import {
  createBusinessEntityForUser,
  getBiometricVerificationForUser,
  getDb,
  getKycVerificationForUser,
  listKybVerificationsForUser,
  listSpecificationBookmarks,
  reviewKycVerification,
  reviewKybVerification,
  submitKycVerificationForUser,
  submitKybVerificationForUser,
  toggleSpecificationBookmark,
  grantBiometricConsentForUser,
  revokeAllBiometricConsentsForUser,
} from "./db";

describe("database persistence schema", () => {
  it("connects to the configured database and exposes durable-storage tables", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();

    const database = db!;
    const [personRows, businessRows, bookmarkRows] = await Promise.all([
      database.select({ id: persons.id }).from(persons).limit(1),
      database.select({ id: businessEntities.id }).from(businessEntities).limit(1),
      database.select({ id: specificationBookmarks.id }).from(specificationBookmarks).limit(1),
    ]);

    expect(Array.isArray(personRows)).toBe(true);
    expect(Array.isArray(businessRows)).toBe(true);
    expect(Array.isArray(bookmarkRows)).toBe(true);
  });

  it("writes and retrieves a bookmarked section from the actual database", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();

    const database = db!;
    const openId = `persistence-${randomUUID()}`;
    const inserted = await database.insert(users).values({
      openId,
      name: "Persistence integration test",
      loginMethod: "integration-test",
    });
    const userId = Number(inserted[0].insertId);

    try {
      await toggleSpecificationBookmark(userId, 25);
      const restored = await listSpecificationBookmarks(userId);
      expect(restored).toContain(25);

      const directRead = await database
        .select({ sectionId: specificationBookmarks.sectionId })
        .from(specificationBookmarks)
        .where(eq(specificationBookmarks.userId, userId));
      expect(directRead.map(row => row.sectionId)).toContain(25);
    } finally {
      await database.delete(auditEvents).where(eq(auditEvents.actorUserId, userId));
      await database.delete(users).where(eq(users.id, userId));
    }
  });

  it("persists biometric consent evidence without storing raw biometric data", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const database = db!;
    const openId = `biometric-consent-${randomUUID()}`;
    const inserted = await database.insert(users).values({
      openId,
      name: "Biometric consent integration test",
      loginMethod: "integration-test",
    });
    const userId = Number(inserted[0].insertId);

    try {
      const initial = await getBiometricVerificationForUser(userId);
      expect(initial.faceVerificationStatus).toBe("unverified");
      expect(initial.livenessStatus).toBe("unverified");
      expect(initial.biometricConsentStatus).toBe("not_granted");

      await grantBiometricConsentForUser(userId, {
        consentType: "face_verification",
        purpose: "التحقق من الهوية ومنع انتحال الشخصية",
        policyVersion: "biometric-consent.v1",
        consentTextHash: "sha256:come-in-it-biometric-consent-v1",
      });
      const granted = await grantBiometricConsentForUser(userId, {
        consentType: "liveness_detection",
        purpose: "التحقق من الحيوية ومنع الانتحال",
        policyVersion: "biometric-consent.v1",
        consentTextHash: "sha256:come-in-it-biometric-consent-v1",
      });
      expect(granted.biometricConsentStatus).toBe("granted");
      expect(granted.consents).toHaveLength(2);
      expect(granted.consents[0]).not.toHaveProperty("consentTextHash");
      expect(granted.consents[0]).not.toHaveProperty("providerReference");

      const revoked = await revokeAllBiometricConsentsForUser(userId);
      expect(revoked.biometricConsentStatus).toBe("revoked");
      expect(revoked.consents.every(consent => consent.status === "revoked")).toBe(true);
      const rows = await database
        .select({ status: biometricConsents.status })
        .from(biometricConsents)
        .where(eq(biometricConsents.personId, revoked.personId));
      expect(rows).toHaveLength(2);
      expect(rows.every(row => row.status === "revoked")).toBe(true);
    } finally {
      await database.delete(auditEvents).where(eq(auditEvents.actorUserId, userId));
      const person = await database.select({ id: persons.id }).from(persons).where(eq(persons.userId, userId)).limit(1);
      if (person[0]) await database.delete(biometricConsents).where(eq(biometricConsents.personId, person[0].id));
      await database.delete(users).where(eq(users.id, userId));
    }
  }, 20_000);

  it("persists the KYC-to-KYB sequence against a person and an authorised business", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();

    const database = db!;
    const openId = `verification-${randomUUID()}`;
    const inserted = await database.insert(users).values({
      openId,
      name: "Verification integration test",
      loginMethod: "integration-test",
    });
    const userId = Number(inserted[0].insertId);

    try {
      const initialKyc = await getKycVerificationForUser(userId);
      expect(initialKyc.lifecycleStatus).toBe("unverified");

      await expect(
        createBusinessEntityForUser(userId, {
          legalName: `Pre-KYC Trade Entity ${randomUUID().slice(0, 8)}`,
          entityType: "factory",
        }),
      ).rejects.toThrow("A verified KYC identity is required before creating a business entity");

      const submittedKyc = await submitKycVerificationForUser(userId, {
        countryCode: "EG",
        providerReference: "test-kyc-reference",
      });
      expect(submittedKyc.latest?.status).toBe("pending");
      expect(submittedKyc.latest).not.toHaveProperty("providerReference");
      expect(submittedKyc.latest).not.toHaveProperty("identityReference");
      await expect(submitKycVerificationForUser(userId, { countryCode: "EG" })).rejects.toThrow(
        "KYC submission is not allowed while the current lifecycle state is pending",
      );

      await reviewKycVerification(userId, submittedKyc.latest!.id, "verified", "integration approval");
      const verifiedKyc = await getKycVerificationForUser(userId);
      expect(verifiedKyc.lifecycleStatus).toBe("verified");
      await expect(
        reviewKycVerification(userId, submittedKyc.latest!.id, "verified", "duplicate approval"),
      ).rejects.toThrow("KYC transition from verified to verified is not allowed");
      await expect(submitKycVerificationForUser(userId, { countryCode: "EG" })).rejects.toThrow(
        "KYC submission is not allowed while the current lifecycle state is verified",
      );

      const business = await createBusinessEntityForUser(userId, {
        legalName: `Integration Trade Entity ${randomUUID().slice(0, 8)}`,
        entityType: "factory",
      });
      const submittedKyb = await submitKybVerificationForUser(userId, business.id, {
        registrationReference: "test-kyb-reference",
      });
      expect(submittedKyb?.status).toBe("pending");
      expect(submittedKyb).not.toHaveProperty("registrationReference");
      expect(submittedKyb).not.toHaveProperty("providerReference");
      await expect(submitKybVerificationForUser(userId, business.id, {})).rejects.toThrow(
        "KYB submission is not allowed while the current lifecycle state is pending",
      );

      await reviewKybVerification(userId, submittedKyb!.id, "verified", "integration approval");
      const kybHistory = await listKybVerificationsForUser(userId);
      expect(kybHistory.find(row => row.id === submittedKyb!.id)?.status).toBe("verified");
      await expect(
        reviewKybVerification(userId, submittedKyb!.id, "verified", "duplicate approval"),
      ).rejects.toThrow("KYB transition from verified to verified is not allowed");
      const kybAfterRejectedTransition = await listKybVerificationsForUser(userId);
      expect(kybAfterRejectedTransition.find(row => row.id === submittedKyb!.id)?.status).toBe("verified");
      await expect(submitKybVerificationForUser(userId, business.id, {})).rejects.toThrow(
        "KYB submission is not allowed while the current lifecycle state is verified",
      );

      const verificationAuditEvents = await database
        .select({
          actorUserId: auditEvents.actorUserId,
          action: auditEvents.action,
          resourceType: auditEvents.resourceType,
          resourceId: auditEvents.resourceId,
          dataClassification: auditEvents.dataClassification,
        })
        .from(auditEvents)
        .where(eq(auditEvents.actorUserId, userId));
      expect(verificationAuditEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            actorUserId: userId,
            action: "kyc_verification_submitted",
            resourceType: "kyc_verification",
            resourceId: String(submittedKyc.personId),
            dataClassification: "confidential_sovereign",
          }),
          expect.objectContaining({
            actorUserId: userId,
            action: "kyc_verification_reviewed",
            resourceType: "kyc_verification",
            resourceId: String(submittedKyc.latest!.id),
            dataClassification: "confidential_sovereign",
          }),
          expect.objectContaining({
            actorUserId: userId,
            action: "kyb_verification_submitted",
            resourceType: "kyb_verification",
            resourceId: String(submittedKyb!.id),
            dataClassification: "restricted",
          }),
          expect.objectContaining({
            actorUserId: userId,
            action: "kyb_verification_reviewed",
            resourceType: "kyb_verification",
            resourceId: String(submittedKyb!.id),
            dataClassification: "restricted",
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

  it("rejects business creation before KYC and KYB when membership is no longer active", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();

    const database = db!;
    const inserted = await database.insert(users).values({
      openId: `kyb-eligibility-${randomUUID()}`,
      name: "KYB eligibility integration test",
      loginMethod: "integration-test",
    });
    const userId = Number(inserted[0].insertId);

    try {
      await expect(
        createBusinessEntityForUser(userId, {
          legalName: `Pre-KYC Eligibility Entity ${randomUUID().slice(0, 8)}`,
          entityType: "factory",
        }),
      ).rejects.toThrow("A verified KYC identity is required before creating a business entity");

      const submittedKyc = await submitKycVerificationForUser(userId, { countryCode: "EG" });
      await reviewKycVerification(userId, submittedKyc.latest!.id, "verified", "eligibility approval");
      const business = await createBusinessEntityForUser(userId, {
        legalName: `Eligibility Trade Entity ${randomUUID().slice(0, 8)}`,
        entityType: "factory",
      });
      await database
        .update(businessMemberships)
        .set({ status: "inactive" })
        .where(eq(businessMemberships.businessId, business.id));

      await expect(submitKybVerificationForUser(userId, business.id, {})).rejects.toThrow(
        "An active authorised business membership is required for KYB submission",
      );
    } finally {
      await database.delete(auditEvents).where(eq(auditEvents.actorUserId, userId));
      await database.delete(kybVerifications).where(eq(kybVerifications.submittedByUserId, userId));
      await database.delete(kycVerifications).where(
        eq(kycVerifications.personId, (await database.select({ id: persons.id }).from(persons).where(eq(persons.userId, userId)).limit(1))[0]?.id ?? -1),
      );
      await database.delete(businessEntities).where(eq(businessEntities.ownerUserId, userId));
      await database.delete(users).where(eq(users.id, userId));
    }
  }, 20_000);
});
