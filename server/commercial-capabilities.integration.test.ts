import { and, eq } from "drizzle-orm";
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
  businessMembershipPermissions,
  businessMemberships,
  individualActivityProfiles,
  kybVerifications,
  persons,
  users,
} from "../drizzle/schema";

async function grantRelationshipPermission(
  database: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  businessId: number,
) {
  const person = await database.select({ id: persons.id }).from(persons).where(eq(persons.userId, userId)).limit(1);
  if (!person[0]) throw new Error(`Person record missing for user ${userId}`);
  const inserted = await database.insert(businessMemberships).values({
    businessId,
    userId,
    personId: person[0].id,
    membershipRole: "authorized_representative",
    status: "active",
  });
  const membershipId = Number(inserted[0].insertId);
  await database.insert(businessMembershipPermissions).values({
    membershipId,
    permissionCode: "trade.match.evaluate",
    status: "active",
  });
  return membershipId;
}

describe("commercial capabilities and relationship rules", () => {
  it("evaluates verified activity profiles across B2B, B2C, C2B and C2C while enforcing requester authority", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const database = db!;
    const ids: number[] = [];
    const membershipIds: number[] = [];
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
      membershipIds.push(await grantRelationshipPermission(database, factoryOwnerId, factoryBusinessId));
      membershipIds.push(await grantRelationshipPermission(database, importerOwnerId, importerBusinessId));

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

      await expect(checkCommercialRelationshipForUser(adminUserId, {
        supplierKind: "business",
        supplierBusinessId: factoryBusinessId,
        requesterKind: "business",
        requesterBusinessId: importerBusinessId,
      })).rejects.toThrow("Business operation is not authorized");
      await expect(checkCommercialRelationshipForUser(producerUserId, {
        supplierKind: "individual",
        supplierIndividualProfileId: producerProfileId,
        requesterKind: "individual",
        requesterIndividualProfileId: consumerProfileId,
      })).rejects.toThrow("requester activity profile is not owned");

      await expect(
        checkCommercialRelationshipForUser(importerOwnerId, {
          supplierKind: "business",
          supplierBusinessId: factoryBusinessId,
          requesterKind: "business",
          requesterBusinessId: importerBusinessId,
        }),
      ).resolves.toMatchObject({ decision: "allow", relationshipMode: "b2b", score: 100 });

      await expect(
        checkCommercialRelationshipForUser(consumerUserId, {
          supplierKind: "business",
          supplierBusinessId: factoryBusinessId,
          requesterKind: "individual",
          requesterIndividualProfileId: consumerProfileId,
        }),
      ).resolves.toMatchObject({ decision: "allow", relationshipMode: "b2c", score: 100 });

      await expect(
        checkCommercialRelationshipForUser(importerOwnerId, {
          supplierKind: "individual",
          supplierIndividualProfileId: producerProfileId,
          requesterKind: "business",
          requesterBusinessId: importerBusinessId,
        }),
      ).resolves.toMatchObject({ decision: "allow", relationshipMode: "c2b", score: 100 });

      await expect(
        checkCommercialRelationshipForUser(consumerUserId, {
          supplierKind: "individual",
          supplierIndividualProfileId: producerProfileId,
          requesterKind: "individual",
          requesterIndividualProfileId: consumerProfileId,
        }),
      ).resolves.toMatchObject({ decision: "allow", relationshipMode: "c2c", score: 100 });

      await expect(
        checkCommercialRelationshipForUser(factoryOwnerId, {
          supplierKind: "individual",
          supplierIndividualProfileId: consumerProfileId,
          requesterKind: "business",
          requesterBusinessId: factoryBusinessId,
        }),
      ).resolves.toMatchObject({ decision: "deny", decisionReason: "consumer_to_factory_not_supported", score: 0 });

      await expect(
        checkCommercialRelationshipForUser(importerOwnerId, {
          supplierKind: "individual",
          supplierIndividualProfileId: consumerProfileId,
          requesterKind: "business",
          requesterBusinessId: importerBusinessId,
        }),
      ).resolves.toMatchObject({ decision: "deny", decisionReason: "consumer_to_importer_not_supported", score: 0 });

      const relationshipAuditRows = await database
        .select({ resourceId: auditEvents.resourceId, decision: auditEvents.decision, metadataJson: auditEvents.metadataJson })
        .from(auditEvents)
        .where(and(
          eq(auditEvents.actorUserId, importerOwnerId),
          eq(auditEvents.action, "commercial_relationship_evaluated"),
        ));
      const b2bAudit = relationshipAuditRows.find(row => row.resourceId === `business:${factoryBusinessId}|business:${importerBusinessId}`);
      expect(b2bAudit?.decision).toBe("allow");
      expect(JSON.parse(b2bAudit?.metadataJson ?? "{}").membershipRole).toBe("authorized_representative");

      const authorizationRows = await database
        .select({ decision: auditEvents.decision, metadataJson: auditEvents.metadataJson })
        .from(auditEvents)
        .where(and(
          eq(auditEvents.actorUserId, importerOwnerId),
          eq(auditEvents.businessId, importerBusinessId),
          eq(auditEvents.action, "business_authorization_decided"),
        ));
      const allowedAuthorization = authorizationRows.find(row => row.decision === "allow");
      expect(JSON.parse(allowedAuthorization?.metadataJson ?? "{}").membershipRole).toBe("authorized_representative");
    } finally {
      for (const userId of ids) await database.delete(auditEvents).where(eq(auditEvents.actorUserId, userId));
      for (const membershipId of membershipIds) {
        await database.delete(businessMembershipPermissions).where(eq(businessMembershipPermissions.membershipId, membershipId));
        await database.delete(businessMemberships).where(eq(businessMemberships.id, membershipId));
      }
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
