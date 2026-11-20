import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { auditEvents, businessEntities, businessMemberships, persons, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import {
  createBusinessEntityForUser,
  getDb,
  getUserByOpenId,
  listBusinessEntitiesForUser,
  updateBusinessEntityForUser,
  upsertUser,
} from "./db";

describe("business owner bootstrap integration", () => {
  it("creates an atomic owner membership and permits only the configured founder's one-time KYC exception", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const database = db!;
    const founderOpenId = `cit-dev-founder-${randomUUID()}`;
    const memberOpenId = `cit-dev-member-${randomUUID()}`;
    const previousOwnerOpenId = ENV.ownerOpenId;
    ENV.ownerOpenId = founderOpenId;

    let founderUserId: number | undefined;
    let memberUserId: number | undefined;
    let businessId: number | undefined;

    try {
      await upsertUser({ openId: founderOpenId, name: "Synthetic founder", loginMethod: "integration-test" });
      const founder = await getUserByOpenId(founderOpenId);
      expect(founder).toBeDefined();
      expect(founder!.role).toBe("owner");
      founderUserId = founder!.id;

      const created = await createBusinessEntityForUser(founderUserId, {
        legalName: `Synthetic Business ${randomUUID()}`,
        entityType: "other",
      });
      businessId = created.id;
      expect(created.ownerUserId).toBe(founderUserId);

      const founderPerson = await database
        .select({ id: persons.id, kycStatus: persons.kycStatus, exemptionAt: persons.founderInitialKycExemptionUsedAt })
        .from(persons)
        .where(eq(persons.userId, founderUserId))
        .limit(1);
      expect(founderPerson[0]?.kycStatus).toBe("unverified");
      expect(founderPerson[0]?.exemptionAt).toBeInstanceOf(Date);
      expect(created.ownerPersonId).toBe(founderPerson[0]?.id);

      const founderMembership = await database
        .select()
        .from(businessMemberships)
        .where(and(eq(businessMemberships.businessId, businessId), eq(businessMemberships.userId, founderUserId)))
        .limit(1);
      expect(founderMembership[0]?.membershipRole).toBe("owner");
      expect(founderMembership[0]?.status).toBe("active");

      const visible = await listBusinessEntitiesForUser(founderUserId);
      expect(visible.some(row => row.id === businessId && row.membershipRole === "owner")).toBe(true);

      await upsertUser({ openId: memberOpenId, name: "Synthetic member", loginMethod: "integration-test" });
      const member = await getUserByOpenId(memberOpenId);
      expect(member).toBeDefined();
      memberUserId = member!.id;

      const memberPersonInsert = await database.insert(persons).values({ userId: memberUserId });
      const memberPersonId = Number(memberPersonInsert[0].insertId);

      await expect(
        database.insert(businessMemberships).values({
          businessId,
          userId: memberUserId,
          personId: founderPerson[0]!.id,
          membershipRole: "viewer",
        }),
      ).rejects.toThrow();

      await database.insert(businessMemberships).values({
        businessId,
        userId: memberUserId,
        personId: memberPersonId,
        membershipRole: "viewer",
        status: "active",
      });
      await expect(
        updateBusinessEntityForUser(memberUserId, businessId, { legalName: "Unauthorized change" }),
      ).rejects.toThrow();

      const afterDeniedUpdate = await database
        .select({ legalName: businessEntities.legalName })
        .from(businessEntities)
        .where(eq(businessEntities.id, businessId))
        .limit(1);
      expect(afterDeniedUpdate[0]?.legalName).toBe(created.legalName);

      await updateBusinessEntityForUser(founderUserId, businessId, { legalName: "Synthetic Business Updated" });
      const restored = await listBusinessEntitiesForUser(founderUserId);
      expect(restored.find(row => row.id === businessId)?.legalName).toBe("Synthetic Business Updated");

      await expect(
        createBusinessEntityForUser(founderUserId, {
          legalName: `Founder second unverified business ${randomUUID()}`,
          entityType: "other",
        }),
      ).rejects.toThrow(/verified KYC/i);

      const createdCount = await database
        .select({ id: businessEntities.id })
        .from(businessEntities)
        .where(eq(businessEntities.ownerUserId, founderUserId));
      expect(createdCount).toHaveLength(1);

      const exemptionEvents = await database
        .select({ id: auditEvents.id })
        .from(auditEvents)
        .where(and(eq(auditEvents.actorUserId, founderUserId), eq(auditEvents.action, "founder_initial_kyc_exemption_used")));
      expect(exemptionEvents).toHaveLength(1);
    } finally {
      ENV.ownerOpenId = previousOwnerOpenId;
      if (founderUserId !== undefined) {
        await database.delete(auditEvents).where(eq(auditEvents.actorUserId, founderUserId));
      }
      if (memberUserId !== undefined) {
        await database.delete(auditEvents).where(eq(auditEvents.actorUserId, memberUserId));
        await database.delete(businessMemberships).where(eq(businessMemberships.userId, memberUserId));
      }
      if (businessId !== undefined) {
        await database.delete(businessMemberships).where(eq(businessMemberships.businessId, businessId));
        await database.delete(businessEntities).where(eq(businessEntities.id, businessId));
      }
      if (founderUserId !== undefined) {
        await database.delete(persons).where(eq(persons.userId, founderUserId));
        await database.delete(users).where(eq(users.id, founderUserId));
      }
      if (memberUserId !== undefined) {
        await database.delete(persons).where(eq(persons.userId, memberUserId));
        await database.delete(users).where(eq(users.id, memberUserId));
      }
    }
  }, 30_000);
});
