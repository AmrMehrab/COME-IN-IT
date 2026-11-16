import { and, eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  createBusinessEntityForUser,
  getBusinessContextForUser,
  getDb,
  grantBusinessPermissionForAdministrator,
  listBusinessMembershipsForAdministrator,
  provisionBusinessMembershipForAdministrator,
  revokeBusinessPermissionForAdministrator,
  reviewKybVerification,
  reviewKycVerification,
  setBusinessMembershipStatusForAdministrator,
  submitBusinessActivityVerificationForUser,
  submitKybVerificationForUser,
  submitKycVerificationForUser,
} from "./db";
import {
  auditEvents,
  businessActivityVerifications,
  businessEntities,
  businessMembershipPermissions,
  businessMemberships,
  kybVerifications,
  kycVerifications,
  persons,
  users,
} from "../drizzle/schema";

describe("business membership administration integration", () => {
  it("limits management to platform admins and denies expired KYC, KYB and grants", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const database = db!;
    const [adminInsert, managerInsert, outsiderInsert, platformOwnerInsert] =
      await Promise.all([
        database.insert(users).values({
          openId: `membership-admin-${crypto.randomUUID()}`,
          name: "Membership admin",
          loginMethod: "integration-test",
          role: "admin",
        }),
        database.insert(users).values({
          openId: `membership-manager-${crypto.randomUUID()}`,
          name: "Membership manager",
          loginMethod: "integration-test",
        }),
        database.insert(users).values({
          openId: `membership-outsider-${crypto.randomUUID()}`,
          name: "Membership outsider",
          loginMethod: "integration-test",
        }),
        database.insert(users).values({
          openId: `membership-owner-${crypto.randomUUID()}`,
          name: "Platform owner",
          loginMethod: "integration-test",
          role: "owner",
        }),
      ]);
    const adminUserId = Number(adminInsert[0].insertId);
    const managerUserId = Number(managerInsert[0].insertId);
    const outsiderUserId = Number(outsiderInsert[0].insertId);
    const platformOwnerUserId = Number(platformOwnerInsert[0].insertId);
    let businessId: number | undefined;
    let membershipId: number | undefined;

    try {
      const kyc = await submitKycVerificationForUser(managerUserId, {
        countryCode: "EG",
      });
      await reviewKycVerification(
        adminUserId,
        kyc.latest!.id,
        "verified",
        "membership integration KYC approval"
      );
      const business = await createBusinessEntityForUser(managerUserId, {
        legalName: `Membership administration ${crypto.randomUUID().slice(0, 8)}`,
        entityType: "factory",
      });
      businessId = business.id;

      await expect(
        getBusinessContextForUser(outsiderUserId, businessId)
      ).rejects.toThrow("Business operation is not authorized");
      await expect(
        listBusinessMembershipsForAdministrator(platformOwnerUserId, businessId)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        listBusinessMembershipsForAdministrator(outsiderUserId, businessId)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      const provisioned = await provisionBusinessMembershipForAdministrator(
        adminUserId,
        {
          businessId,
          userId: managerUserId,
          membershipRole: "operations_manager",
          reviewReference: "approved case IAM-1001",
        }
      );
      membershipId = provisioned.membershipId;
      await expect(
        provisionBusinessMembershipForAdministrator(adminUserId, {
          businessId,
          userId: managerUserId,
          membershipRole: "owner" as "operations_manager",
          reviewReference: "unapproved owner transfer",
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      const readGrant = await grantBusinessPermissionForAdministrator(
        adminUserId,
        {
          membershipId,
          permissionCode: "business.read",
          expiresAt: null,
          reviewReference: "approved case IAM-1002",
        }
      );
      await grantBusinessPermissionForAdministrator(adminUserId, {
        membershipId,
        permissionCode: "business.kyb.submit",
        expiresAt: null,
        reviewReference: "approved case IAM-1003",
      });
      await grantBusinessPermissionForAdministrator(adminUserId, {
        membershipId,
        permissionCode: "business.activity.submit",
        expiresAt: null,
        reviewReference: "approved case IAM-1004",
      });
      expect(
        await listBusinessMembershipsForAdministrator(adminUserId, businessId)
      ).toHaveLength(1);
      await expect(
        getBusinessContextForUser(managerUserId, businessId)
      ).resolves.toMatchObject({ membershipRole: "operations_manager" });

      await database
        .update(businessMembershipPermissions)
        .set({ expiresAt: new Date(Date.now() - 60_000) })
        .where(eq(businessMembershipPermissions.id, readGrant.grantId));
      await expect(
        getBusinessContextForUser(managerUserId, businessId)
      ).rejects.toThrow("Business operation is not authorized");
      await grantBusinessPermissionForAdministrator(adminUserId, {
        membershipId,
        permissionCode: "business.read",
        expiresAt: null,
        reviewReference: "approved renewal IAM-1005",
      });

      await database
        .update(kycVerifications)
        .set({ expiresAt: new Date(Date.now() - 60_000) })
        .where(eq(kycVerifications.id, kyc.latest!.id));
      await expect(
        getBusinessContextForUser(managerUserId, businessId)
      ).rejects.toThrow("Business operation is not authorized");
      await database
        .update(kycVerifications)
        .set({ expiresAt: null })
        .where(eq(kycVerifications.id, kyc.latest!.id));

      const kyb = await submitKybVerificationForUser(
        managerUserId,
        businessId,
        { registrationReference: "membership-kyb-test" }
      );
      await reviewKybVerification(
        adminUserId,
        kyb!.id,
        "verified",
        "membership integration KYB approval"
      );
      await database
        .update(kybVerifications)
        .set({ expiresAt: new Date(Date.now() - 60_000) })
        .where(eq(kybVerifications.id, kyb!.id));
      await expect(
        submitBusinessActivityVerificationForUser(managerUserId, businessId, {
          activityType: "factory",
        })
      ).rejects.toThrow("Business operation is not authorized");
      await database
        .update(kybVerifications)
        .set({ expiresAt: null })
        .where(eq(kybVerifications.id, kyb!.id));

      const status = await setBusinessMembershipStatusForAdministrator(
        adminUserId,
        {
          membershipId,
          status: "suspended",
          reviewReference: "approved suspension IAM-1006",
        }
      );
      expect(status.status).toBe("suspended");
      await expect(
        getBusinessContextForUser(managerUserId, businessId)
      ).rejects.toThrow("Business operation is not authorized");
      await setBusinessMembershipStatusForAdministrator(adminUserId, {
        membershipId,
        status: "active",
        reviewReference: "approved reinstatement IAM-1007",
      });
      await grantBusinessPermissionForAdministrator(adminUserId, {
        membershipId,
        permissionCode: "business.read",
        expiresAt: null,
        reviewReference: "approved regrant IAM-1007A",
      });
      await expect(
        getBusinessContextForUser(managerUserId, businessId)
      ).resolves.toMatchObject({ membershipRole: "operations_manager" });

      const grantRows = await database
        .select({
          id: businessMembershipPermissions.id,
          permissionCode: businessMembershipPermissions.permissionCode,
        })
        .from(businessMembershipPermissions)
        .where(
          and(
            eq(businessMembershipPermissions.membershipId, membershipId),
            eq(businessMembershipPermissions.permissionCode, "business.read")
          )
        );
      const revoked = await revokeBusinessPermissionForAdministrator(
        adminUserId,
        {
          grantId: grantRows[0].id,
          reviewReference: "approved revocation IAM-1008",
        }
      );
      expect(revoked.status).toBe("revoked");
      await expect(
        getBusinessContextForUser(managerUserId, businessId)
      ).rejects.toThrow("Business operation is not authorized");
    } finally {
      const createdMemberships = businessId
        ? await database
            .select({ id: businessMemberships.id })
            .from(businessMemberships)
            .where(eq(businessMemberships.businessId, businessId))
        : [];
      for (const membership of createdMemberships) {
        await database
          .delete(businessMembershipPermissions)
          .where(eq(businessMembershipPermissions.membershipId, membership.id));
      }
      if (businessId) {
        await database
          .delete(businessMemberships)
          .where(eq(businessMemberships.businessId, businessId));
        await database
          .delete(kybVerifications)
          .where(eq(kybVerifications.businessId, businessId));
        await database
          .delete(businessActivityVerifications)
          .where(eq(businessActivityVerifications.businessId, businessId));
      }
      const personsRows = await database
        .select({ id: persons.id })
        .from(persons)
        .where(
          inArray(persons.userId, [
            adminUserId,
            managerUserId,
            outsiderUserId,
            platformOwnerUserId,
          ])
        );
      for (const person of personsRows)
        await database
          .delete(kycVerifications)
          .where(eq(kycVerifications.personId, person.id));
      await database
        .delete(auditEvents)
        .where(
          inArray(auditEvents.actorUserId, [
            adminUserId,
            managerUserId,
            outsiderUserId,
            platformOwnerUserId,
          ])
        );
      if (businessId)
        await database
          .delete(businessEntities)
          .where(eq(businessEntities.id, businessId));
      await database
        .delete(users)
        .where(
          inArray(users.id, [
            adminUserId,
            managerUserId,
            outsiderUserId,
            platformOwnerUserId,
          ])
        );
    }
  }, 60_000);
});
