import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  checkCommercialRelationshipForUser,
  createBusinessEntityForUser,
  getDb,
  reviewBusinessActivityVerification,
  reviewIndividualActivityProfile,
  reviewKybVerification,
  reviewKycVerification,
  submitBusinessActivityVerificationForUser,
  submitIndividualActivityProfileForUser,
  submitKybVerificationForUser,
  submitKycVerificationForUser,
} from "./db";
import {
  auditEvents,
  businessActivityVerifications,
  businessEntities,
  individualActivityProfiles,
  kybVerifications,
  users,
} from "../drizzle/schema";

describe("commercial capabilities and relationship rules", () => {
  it("evaluates verified activity profiles across B2B, B2C, C2B and C2C while rejecting Consumer→Factory/Importer", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const database = db!;
    const ids: number[] = [];
    let factoryBusinessId: number | undefined;
    let importerBusinessId: number | undefined;
    let producerProfileId: number | undefined;
    let consumerProfileId: number | undefined;

    try {
      for (const role of ["admin", "user", "user", "user", "user"] as const) {
        const inserted = await database.insert(users).values({
          openId: `commercial-capability-${crypto.randomUUID()}`,
          name: "Commercial capabilities integration actor",
          loginMethod: "integration-test",
          role,
        });
        ids.push(Number(inserted[0].insertId));
      }

      const [adminUserId, factoryOwnerId, importerOwnerId, producerUserId, consumerUserId] = ids;
      for (const userId of [factoryOwnerId, importerOwnerId, producerUserId, consumerUserId]) {
        const kyc = await submitKycVerificationForUser(userId, { countryCode: "EG" });
        await reviewKycVerification(adminUserId, kyc.latest!.id, "verified", "commercial capability KYC approval");
      }

      const factory = await createBusinessEntityForUser(factoryOwnerId, {
        legalName: `Verified factory ${crypto.randomUUID().slice(0, 8)}`,
        entityType: "factory",
      });
      const importer = await createBusinessEntityForUser(importerOwnerId, {
        legalName: `Verified importer ${crypto.randomUUID().slice(0, 8)}`,
        entityType: "importer",
      });
      factoryBusinessId = factory.id;
      importerBusinessId = importer.id;

      const factoryKyb = await submitKybVerificationForUser(factoryOwnerId, factoryBusinessId, { registrationReference: "factory-kyb" });
      const importerKyb = await submitKybVerificationForUser(importerOwnerId, importerBusinessId, { registrationReference: "importer-kyb" });
      await reviewKybVerification(adminUserId, factoryKyb!.id, "verified", "factory KYB approval");
      await reviewKybVerification(adminUserId, importerKyb!.id, "verified", "importer KYB approval");

      const factoryActivity = await submitBusinessActivityVerificationForUser(factoryOwnerId, factoryBusinessId, { activityType: "factory" });
      const importerActivity = await submitBusinessActivityVerificationForUser(importerOwnerId, importerBusinessId, { activityType: "importer" });
      await reviewBusinessActivityVerification(adminUserId, factoryActivity.id, "verified");
      await reviewBusinessActivityVerification(adminUserId, importerActivity.id, "verified");

      const producerProfile = await submitIndividualActivityProfileForUser(producerUserId, {
        activityType: "individual_producer",
        capabilitiesJson: JSON.stringify({ supply: ["product"] }),
      });
      const consumerProfile = await submitIndividualActivityProfileForUser(consumerUserId, {
        activityType: "consumer",
      });
      producerProfileId = producerProfile.id;
      consumerProfileId = consumerProfile.id;
      await reviewIndividualActivityProfile(adminUserId, producerProfileId, "verified");
      await reviewIndividualActivityProfile(adminUserId, consumerProfileId, "verified");

      await expect(
        checkCommercialRelationshipForUser(adminUserId, {
          supplierKind: "business",
          supplierBusinessId: factoryBusinessId,
          requesterKind: "business",
          requesterBusinessId: importerBusinessId,
        }),
      ).resolves.toMatchObject({ decision: "allow", relationshipMode: "b2b", score: 100 });

      await expect(
        checkCommercialRelationshipForUser(adminUserId, {
          supplierKind: "business",
          supplierBusinessId: factoryBusinessId,
          requesterKind: "individual",
          requesterIndividualProfileId: consumerProfileId,
        }),
      ).resolves.toMatchObject({ decision: "allow", relationshipMode: "b2c", score: 100 });

      await expect(
        checkCommercialRelationshipForUser(adminUserId, {
          supplierKind: "individual",
          supplierIndividualProfileId: producerProfileId,
          requesterKind: "business",
          requesterBusinessId: importerBusinessId,
        }),
      ).resolves.toMatchObject({ decision: "allow", relationshipMode: "c2b", score: 100 });

      await expect(
        checkCommercialRelationshipForUser(adminUserId, {
          supplierKind: "individual",
          supplierIndividualProfileId: producerProfileId,
          requesterKind: "individual",
          requesterIndividualProfileId: consumerProfileId,
        }),
      ).resolves.toMatchObject({ decision: "allow", relationshipMode: "c2c", score: 100 });

      await expect(
        checkCommercialRelationshipForUser(adminUserId, {
          supplierKind: "individual",
          supplierIndividualProfileId: consumerProfileId,
          requesterKind: "business",
          requesterBusinessId: factoryBusinessId,
        }),
      ).resolves.toMatchObject({ decision: "deny", decisionReason: "consumer_to_factory_not_supported", score: 0 });

      await expect(
        checkCommercialRelationshipForUser(adminUserId, {
          supplierKind: "individual",
          supplierIndividualProfileId: consumerProfileId,
          requesterKind: "business",
          requesterBusinessId: importerBusinessId,
        }),
      ).resolves.toMatchObject({ decision: "deny", decisionReason: "consumer_to_importer_not_supported", score: 0 });

      const relationshipAuditRows = await database
        .select({ action: auditEvents.action, resourceType: auditEvents.resourceType })
        .from(auditEvents)
        .where(eq(auditEvents.actorUserId, adminUserId));
      expect(relationshipAuditRows).toEqual(
        expect.arrayContaining([expect.objectContaining({ action: "commercial_relationship_evaluated", resourceType: "commercial_relationship" })]),
      );
    } finally {
      for (const userId of ids) await database.delete(auditEvents).where(eq(auditEvents.actorUserId, userId));
      if (factoryBusinessId) await database.delete(businessActivityVerifications).where(eq(businessActivityVerifications.businessId, factoryBusinessId));
      if (importerBusinessId) await database.delete(businessActivityVerifications).where(eq(businessActivityVerifications.businessId, importerBusinessId));
      if (producerProfileId) await database.delete(individualActivityProfiles).where(eq(individualActivityProfiles.id, producerProfileId));
      if (consumerProfileId) await database.delete(individualActivityProfiles).where(eq(individualActivityProfiles.id, consumerProfileId));
      for (const userId of ids) await database.delete(kybVerifications).where(eq(kybVerifications.submittedByUserId, userId));
      if (factoryBusinessId) await database.delete(businessEntities).where(eq(businessEntities.id, factoryBusinessId));
      if (importerBusinessId) await database.delete(businessEntities).where(eq(businessEntities.id, importerBusinessId));
      for (const userId of ids) await database.delete(users).where(eq(users.id, userId));
    }
  }, 60_000);
});
