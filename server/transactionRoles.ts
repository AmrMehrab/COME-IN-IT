import { and, eq } from "drizzle-orm";
import {
  businessMemberships,
  individualActivityProfiles,
  persons,
} from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Minimal shape of a trade transaction required to resolve a user's operational roles.
 * Only the identity foreign keys are needed; full transaction status is not required here.
 */
export type TransactionRoleSource = {
  /** Primary key of the trade transaction. */
  id: number;
  /** Business entity acting as buyer (null when the buyer is an individual). */
  buyerBusinessId: number | null;
  /** Individual activity profile acting as buyer (null when the buyer is a business). */
  buyerIndividualProfileId: number | null;
  /** Business entity acting as seller (null when the seller is an individual). */
  sellerBusinessId: number | null;
  /** Individual activity profile acting as seller (null when the seller is a business). */
  sellerIndividualProfileId: number | null;
  /** Current owner of the goods/service (business side). */
  ownerBusinessId: number | null;
  /** Current owner of the goods/service (individual side). */
  ownerIndividualProfileId: number | null;
  /** Business currently holding physical custody (e.g. transport provider). */
  custodianBusinessId: number | null;
};

/**
 * Resolved operational roles of a user against a specific trade transaction.
 * All flags are derived from authoritative database relationships and must never be hardcoded by callers.
 */
export type TransactionActorRoles = {
  /** True when the user controls any side of the transaction (buyer, seller, owner, or custodian). */
  isParticipant: boolean;
  /** True when the user controls the buyer side (via active non-viewer membership or individual profile). */
  isBuyer: boolean;
  /** True when the user controls the seller side. */
  isSeller: boolean;
  /** True when the user controls the current owner side. */
  isOwner: boolean;
  /** True when the user controls the current custodian (transport/holder) side. */
  isCustodian: boolean;
  /**
   * Highest-privilege active membership role the user holds on any business
   * involved in this transaction. `viewer` is excluded from operational power
   * and will never appear here when the user only has viewer access.
   */
  membershipRole: "owner" | "authorized_representative" | "operations_manager" | "viewer" | null;
};

function requireDatabase<T>(database: T | null): T {
  if (!database) {
    throw new Error("Database connection is not available");
  }
  return database;
}

async function getOrCreatePersonForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const existing = await db.select().from(persons).where(eq(persons.userId, userId)).limit(1);
  if (existing[0]) return existing[0];

  await db.insert(persons).values({ userId });
  const created = await db.select().from(persons).where(eq(persons.userId, userId)).limit(1);
  if (!created[0]) throw new Error("Failed to create person identity");
  return created[0];
}

/**
 * Resolves the real operational roles of a user against a trade transaction.
 * All flags are derived from authoritative DB relationships — never hardcoded.
 *
 * Rules:
 * - A user is a participant if they control (via active non-viewer membership or individual profile)
 *   the buyer, seller, owner, or custodian side.
 * - "viewer" membership never grants operational roles.
 * - Individual-side roles are resolved through the person's activity profiles.
 */
export async function resolveTransactionActorRoles(
  userId: number,
  transaction: TransactionRoleSource,
): Promise<TransactionActorRoles> {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);

  const memberships = await db
    .select({
      businessId: businessMemberships.businessId,
      role: businessMemberships.membershipRole,
    })
    .from(businessMemberships)
    .where(
      and(
        eq(businessMemberships.userId, userId),
        eq(businessMemberships.status, "active"),
      ),
    );

  const operationalMemberships = memberships.filter(m => m.role !== "viewer");
  const operationalBusinessIds = new Set(operationalMemberships.map(m => m.businessId));

  const individualProfiles = await db
    .select({ id: individualActivityProfiles.id })
    .from(individualActivityProfiles)
    .where(eq(individualActivityProfiles.personId, person.id));

  const individualProfileIds = new Set(individualProfiles.map(p => p.id));

  const isBuyer =
    (transaction.buyerBusinessId != null && operationalBusinessIds.has(transaction.buyerBusinessId)) ||
    (transaction.buyerIndividualProfileId != null &&
      individualProfileIds.has(transaction.buyerIndividualProfileId));

  const isSeller =
    (transaction.sellerBusinessId != null && operationalBusinessIds.has(transaction.sellerBusinessId)) ||
    (transaction.sellerIndividualProfileId != null &&
      individualProfileIds.has(transaction.sellerIndividualProfileId));

  const isOwner =
    (transaction.ownerBusinessId != null && operationalBusinessIds.has(transaction.ownerBusinessId)) ||
    (transaction.ownerIndividualProfileId != null &&
      individualProfileIds.has(transaction.ownerIndividualProfileId));

  const isCustodian =
    transaction.custodianBusinessId != null &&
    operationalBusinessIds.has(transaction.custodianBusinessId);

  const isParticipant = isBuyer || isSeller || isOwner || isCustodian;

  const involvedBusinessIds = new Set(
    [
      transaction.buyerBusinessId,
      transaction.sellerBusinessId,
      transaction.ownerBusinessId,
      transaction.custodianBusinessId,
    ].filter((id): id is number => id != null),
  );

  const relevantMembership = operationalMemberships.find(m =>
    involvedBusinessIds.has(m.businessId),
  );

  return {
    isParticipant,
    isBuyer,
    isSeller,
    isOwner,
    isCustodian,
    membershipRole: relevantMembership?.role ?? null,
  };
}