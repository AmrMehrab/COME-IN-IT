import { createHash } from "node:crypto";
import { and, desc, eq, ne, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditEvents,
  biometricConsents,
  businessActivityVerifications,
  businessEntities,
  businessMemberships,
  commercePurchaseOrders,
  healthAccessLogs,
  healthConsents,
  healthEmergencyAccessRequests,
  healthProfiles,
  healthProviderRoles,
  healthProviders,
  healthRecordReferences,
  InsertUser,
  individualActivityProfiles,
  kycVerifications,
  kybVerifications,
  persons,
  specificationBookmarks,
  tradeDemands,
  tradeMatches,
  tradeOfferings,
  tradeRfqs,
  tradeQuotations,
  tradeTransactions,
  transactionDeliveries,
  transactionDisputes,
  transactionEvidence,
  transportJobs,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { assertPolicy, evaluatePolicy, PolicyAction, PolicyContext, PolicyDecision } from "./policyEngine";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach(field => {
    if (user[field] !== undefined) {
      const value = user[field] ?? null;
      values[field] = value;
      updateSet[field] = value;
    }
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "owner";
    updateSet.role = "owner";
  }

  if (!values.lastSignedIn) {
    values.lastSignedIn = new Date();
  }

  if (Object.keys(updateSet).length === 0) {
    updateSet.lastSignedIn = new Date();
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
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

function requireDatabase<T>(database: T | null): T {
  if (!database) {
    throw new Error("Database connection is not available");
  }
  return database;
}

export async function listSpecificationBookmarks(userId: number): Promise<number[]> {
  const db = requireDatabase(await getDb());
  const rows = await db
    .select({ sectionId: specificationBookmarks.sectionId })
    .from(specificationBookmarks)
    .where(eq(specificationBookmarks.userId, userId));

  return rows.map(row => row.sectionId);
}

async function enforceTradePolicy(userId: number, action: PolicyAction, resourceType: string, resourceId: string, context: Omit<PolicyContext, "action" | "actorUserId">): Promise<PolicyDecision> {
  const decision = evaluatePolicy({ ...context, action, actorUserId: userId });
  await appendAuditEvent({
    actorUserId: userId,
    action: "policy_decision_evaluated",
    resourceType,
    resourceId,
    dataClassification: "verified",
    metadata: {
      policyVersion: decision.policyVersion,
      effect: decision.effect,
      ruleIds: decision.ruleIds.join(","),
      reasonCodes: decision.reasons.map(reason => reason.code).join(","),
    },
  });
  assertPolicy(decision);
  return decision;
}

async function appendAuditEvent(input: {
  actorUserId: number;
  action: string;
  resourceType?: string;
  resourceId: string;
  dataClassification?: "public" | "verified" | "restricted" | "confidential_sovereign" | "highly_sensitive_health";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const db = requireDatabase(await getDb());
  await db.insert(auditEvents).values({
    actorUserId: input.actorUserId,
    action: input.action,
    resourceType: input.resourceType ?? "specification_section",
    resourceId: input.resourceId,
    dataClassification: input.dataClassification ?? "verified",
    metadataJson: JSON.stringify({ retention: "application_append_only", ...input.metadata }),
  });
}

export async function toggleSpecificationBookmark(userId: number, sectionId: number) {
  const db = requireDatabase(await getDb());
  const existing = await db
    .select({ id: specificationBookmarks.id })
    .from(specificationBookmarks)
    .where(
      and(
        eq(specificationBookmarks.userId, userId),
        eq(specificationBookmarks.sectionId, sectionId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db.delete(specificationBookmarks).where(eq(specificationBookmarks.id, existing[0].id));
    await appendAuditEvent({
      actorUserId: userId,
      action: "specification_bookmark_removed",
      resourceId: String(sectionId),
    });
    return { bookmarked: false } as const;
  }

  await db.insert(specificationBookmarks).values({ userId, sectionId });
  await appendAuditEvent({
    actorUserId: userId,
    action: "specification_bookmark_added",
    resourceId: String(sectionId),
  });
  return { bookmarked: true } as const;
}

type CommercePurchaseOrderInput = {
  partnerKey: string;
  partnerName: string;
  productKey: string;
  productName: string;
  category: string;
  quantity: number;
  quantityUnit: string;
  moq: number;
  unitPriceMinor: number;
  message: string;
};

export async function listCommercePurchaseOrdersForUser(userId: number) {
  const db = requireDatabase(await getDb());
  return db.select().from(commercePurchaseOrders).where(eq(commercePurchaseOrders.buyerUserId, userId)).orderBy(desc(commercePurchaseOrders.createdAt));
}

export async function createCommercePurchaseOrderForUser(userId: number, input: CommercePurchaseOrderInput) {
  const db = requireDatabase(await getDb());
  if (input.quantity < input.moq) throw new Error(`الكمية يجب ألا تقل عن MOQ (${input.moq})`);
  const inserted = await db.insert(commercePurchaseOrders).values({
    buyerUserId: userId,
    partnerKey: input.partnerKey,
    partnerName: input.partnerName,
    productKey: input.productKey,
    productName: input.productName,
    category: input.category,
    quantity: input.quantity,
    quantityUnit: input.quantityUnit,
    moq: input.moq,
    unitPriceMinor: input.unitPriceMinor,
    message: input.message,
  });
  const orderId = Number(inserted[0].insertId);
  await appendAuditEvent({ actorUserId: userId, action: "commerce_purchase_order_created", resourceType: "commerce_purchase_order", resourceId: String(orderId), metadata: { partnerKey: input.partnerKey, productKey: input.productKey, quantity: input.quantity } });
  const created = await db.select().from(commercePurchaseOrders).where(eq(commercePurchaseOrders.id, orderId)).limit(1);
  if (!created[0]) throw new Error("تعذر تحميل أمر الشراء بعد الحفظ");
  return created[0];
}

type BusinessEntityInput = {
  legalName: string;
  tradeName?: string;
  registrationNumber?: string;
  entityType:
    | "factory"
    | "importer"
    | "exporter"
    | "store"
    | "service_provider"
    | "government_entity"
    | "other";
};

export async function listBusinessEntitiesForUser(userId: number) {
  const db = requireDatabase(await getDb());
  return db
    .select({
      id: businessEntities.id,
      legalName: businessEntities.legalName,
      tradeName: businessEntities.tradeName,
      registrationNumber: businessEntities.registrationNumber,
      entityType: businessEntities.entityType,
      verificationStatus: businessEntities.verificationStatus,
      dataClassification: businessEntities.dataClassification,
      membershipRole: businessMemberships.membershipRole,
      membershipStatus: businessMemberships.status,
      createdAt: businessEntities.createdAt,
      updatedAt: businessEntities.updatedAt,
    })
    .from(businessMemberships)
    .innerJoin(businessEntities, eq(businessMemberships.businessId, businessEntities.id))
    .where(and(eq(businessMemberships.userId, userId), eq(businessMemberships.status, "active")));
}

export async function createBusinessEntityForUser(userId: number, input: BusinessEntityInput) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  if (person.kycStatus !== "verified") {
    throw new Error("A verified KYC identity is required before creating a business entity");
  }
  const inserted = await db.insert(businessEntities).values({
    ownerUserId: userId,
    ownerPersonId: person.id,
    legalName: input.legalName,
    tradeName: input.tradeName || null,
    registrationNumber: input.registrationNumber || null,
    entityType: input.entityType,
  });
  const businessId = Number(inserted[0].insertId);

  await db.insert(businessMemberships).values({
    businessId,
    userId,
    personId: person.id,
    membershipRole: "owner",
  });
  await appendAuditEvent({
    actorUserId: userId,
    action: "business_entity_created",
    resourceType: "business_entity",
    resourceId: String(businessId),
  });

  const created = await db.select().from(businessEntities).where(eq(businessEntities.id, businessId)).limit(1);
  if (!created[0]) throw new Error("Failed to load the created business entity");
  return created[0];
}

type BusinessEntityUpdate = Partial<{
  legalName: string;
  tradeName: string | null;
  entityType: BusinessEntityInput["entityType"];
}>;

export async function updateBusinessEntityForUser(
  userId: number,
  businessId: number,
  input: BusinessEntityUpdate,
) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  const membership = await db
    .select({ membershipRole: businessMemberships.membershipRole })
    .from(businessMemberships)
    .where(
      and(
        eq(businessMemberships.businessId, businessId),
        eq(businessMemberships.userId, userId),
        eq(businessMemberships.personId, person.id),
        eq(businessMemberships.status, "active"),
        ne(businessMemberships.membershipRole, "viewer"),
      ),
    )
    .limit(1);

  if (!membership[0]) throw new Error("You do not have permission to update this business entity");
  if (Object.keys(input).length === 0) throw new Error("No business fields were provided for update");

  await db.update(businessEntities).set(input).where(eq(businessEntities.id, businessId));
  await appendAuditEvent({
    actorUserId: userId,
    action: "business_entity_updated",
    resourceType: "business_entity",
    resourceId: String(businessId),
  });

  const updated = await db.select().from(businessEntities).where(eq(businessEntities.id, businessId)).limit(1);
  if (!updated[0]) throw new Error("Business entity not found after update");
  return updated[0];
}

type KycSubmissionInput = {
  providerReference?: string;
  identityReference?: string;
  countryCode?: string;
  documentMetadataJson?: string;
};

type ReviewStatus = "verified" | "suspended" | "expired" | "rejected";
type VerificationRecordStatus = "pending" | ReviewStatus;
type VerificationLifecycleStatus = "unverified" | VerificationRecordStatus;

/**
 * Review transitions remain server-controlled. A new submission is required
 * after rejection; a verified identity may only later become suspended/expired.
 */
const allowedReviewTransitions: Record<VerificationRecordStatus, readonly ReviewStatus[]> = {
  pending: ["verified", "rejected"],
  verified: ["suspended", "expired"],
  suspended: ["verified", "rejected"],
  expired: ["verified", "rejected"],
  rejected: [],
};

function assertSubmissionAllowed(status: VerificationLifecycleStatus, verificationType: "KYC" | "KYB") {
  if (status === "unverified" || status === "rejected" || status === "expired") return;
  throw new Error(`${verificationType} submission is not allowed while the current lifecycle state is ${status}`);
}

function assertReviewTransition(
  currentStatus: VerificationRecordStatus,
  nextStatus: ReviewStatus,
  verificationType: "KYC" | "KYB",
) {
  if (allowedReviewTransitions[currentStatus].includes(nextStatus)) return;
  throw new Error(`${verificationType} transition from ${currentStatus} to ${nextStatus} is not allowed`);
}

type KycVerificationSummary = {
  id: number;
  status: "pending" | ReviewStatus;
  submittedAt: Date;
  reviewedAt: Date | null;
  expiresAt: Date | null;
  reviewReason: string | null;
};

async function getLatestKycVerificationForPerson(personId: number): Promise<KycVerificationSummary | undefined> {
  const db = requireDatabase(await getDb());
  const rows = await db
    .select({
      id: kycVerifications.id,
      status: kycVerifications.status,
      submittedAt: kycVerifications.submittedAt,
      reviewedAt: kycVerifications.reviewedAt,
      expiresAt: kycVerifications.expiresAt,
      reviewReason: kycVerifications.reviewReason,
    })
    .from(kycVerifications)
    .where(eq(kycVerifications.personId, personId))
    .orderBy(desc(kycVerifications.submittedAt), desc(kycVerifications.id))
    .limit(1);

  return rows[0];
}

export async function getKycVerificationForUser(userId: number) {
  const person = await getOrCreatePersonForUser(userId);
  const latest = await getLatestKycVerificationForPerson(person.id);
  return { personId: person.id, lifecycleStatus: person.kycStatus, latest };
}

export async function submitKycVerificationForUser(userId: number, input: KycSubmissionInput) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  assertSubmissionAllowed(person.kycStatus, "KYC");

  await db.insert(kycVerifications).values({
    personId: person.id,
    providerReference: input.providerReference || null,
    identityReference: input.identityReference || null,
    countryCode: input.countryCode || null,
    documentMetadataJson: input.documentMetadataJson || null,
  });
  await db.update(persons).set({ kycStatus: "pending" }).where(eq(persons.id, person.id));
  await appendAuditEvent({
    actorUserId: userId,
    action: "kyc_verification_submitted",
    resourceType: "kyc_verification",
    resourceId: String(person.id),
    dataClassification: "confidential_sovereign",
    metadata: { lifecycleStatus: "pending" },
  });

  return getKycVerificationForUser(userId);
}

type BiometricConsentType = "face_verification" | "liveness_detection";

type BiometricConsentInput = {
  consentType: BiometricConsentType;
  purpose: string;
  policyVersion: string;
  consentTextHash: string;
  providerReference?: string;
};

export async function getBiometricVerificationForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  const consents = await db
    .select({
      id: biometricConsents.id,
      consentType: biometricConsents.consentType,
      status: biometricConsents.status,
      purpose: biometricConsents.purpose,
      policyVersion: biometricConsents.policyVersion,
      grantedAt: biometricConsents.grantedAt,
      revokedAt: biometricConsents.revokedAt,
    })
    .from(biometricConsents)
    .where(eq(biometricConsents.personId, person.id))
    .orderBy(desc(biometricConsents.createdAt), desc(biometricConsents.id));

  return {
    personId: person.id,
    faceVerificationStatus: person.faceVerificationStatus,
    livenessStatus: person.livenessStatus,
    biometricConsentStatus: person.biometricConsentStatus,
    biometricProvider: person.biometricProvider,
    biometricVerifiedAt: person.biometricVerifiedAt,
    consents,
  };
}

export async function grantBiometricConsentForUser(userId: number, input: BiometricConsentInput) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  const inserted = await db.insert(biometricConsents).values({
    personId: person.id,
    consentType: input.consentType,
    purpose: input.purpose,
    policyVersion: input.policyVersion,
    consentTextHash: input.consentTextHash,
    providerReference: input.providerReference || null,
    status: "granted",
  });
  await db
    .update(persons)
    .set({ biometricConsentStatus: "granted" })
    .where(eq(persons.id, person.id));
  await appendAuditEvent({
    actorUserId: userId,
    action: "biometric_consent_granted",
    resourceType: "biometric_consent",
    resourceId: String(inserted[0].insertId),
    dataClassification: "confidential_sovereign",
    metadata: { personId: person.id, consentType: input.consentType, policyVersion: input.policyVersion },
  });
  return getBiometricVerificationForUser(userId);
}

export async function revokeBiometricConsentForUser(userId: number, consentType: BiometricConsentType) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  const now = new Date();
  await db
    .update(biometricConsents)
    .set({ status: "revoked", revokedAt: now })
    .where(
      and(
        eq(biometricConsents.personId, person.id),
        eq(biometricConsents.consentType, consentType),
        eq(biometricConsents.status, "granted"),
      ),
    );
  const remainingGranted = await db
    .select({ id: biometricConsents.id })
    .from(biometricConsents)
    .where(
      and(
        eq(biometricConsents.personId, person.id),
        eq(biometricConsents.status, "granted"),
      ),
    )
    .limit(1);
  await db
    .update(persons)
    .set({ biometricConsentStatus: remainingGranted[0] ? "granted" : "revoked" })
    .where(eq(persons.id, person.id));
  await appendAuditEvent({
    actorUserId: userId,
    action: "biometric_consent_revoked",
    resourceType: "person",
    resourceId: String(person.id),
    dataClassification: "confidential_sovereign",
    metadata: { consentType },
  });
  return getBiometricVerificationForUser(userId);
}

export async function revokeAllBiometricConsentsForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  const now = new Date();
  await db
    .update(biometricConsents)
    .set({ status: "revoked", revokedAt: now })
    .where(and(eq(biometricConsents.personId, person.id), eq(biometricConsents.status, "granted")));
  await db
    .update(persons)
    .set({ biometricConsentStatus: "revoked" })
    .where(eq(persons.id, person.id));
  await appendAuditEvent({
    actorUserId: userId,
    action: "biometric_consent_revoked",
    resourceType: "person",
    resourceId: String(person.id),
    dataClassification: "confidential_sovereign",
    metadata: { consentType: "all" },
  });
  return getBiometricVerificationForUser(userId);
}

export async function reviewKycVerification(
  reviewerUserId: number,
  verificationId: number,
  status: ReviewStatus,
  reviewReason?: string,
  expiresAt?: Date | null,
) {
  const db = requireDatabase(await getDb());
  const current = await db
    .select({ personId: kycVerifications.personId, status: kycVerifications.status })
    .from(kycVerifications)
    .where(eq(kycVerifications.id, verificationId))
    .limit(1);
  if (!current[0]) throw new Error("KYC verification was not found");
  assertReviewTransition(current[0].status, status, "KYC");

  const now = new Date();
  await db
    .update(kycVerifications)
    .set({
      status,
      reviewReason: reviewReason || null,
      reviewedByUserId: reviewerUserId,
      reviewedAt: now,
      expiresAt: expiresAt ?? null,
    })
    .where(eq(kycVerifications.id, verificationId));
  await db.update(persons).set({ kycStatus: status }).where(eq(persons.id, current[0].personId));
  await appendAuditEvent({
    actorUserId: reviewerUserId,
    action: "kyc_verification_reviewed",
    resourceType: "kyc_verification",
    resourceId: String(verificationId),
    dataClassification: "confidential_sovereign",
    metadata: { lifecycleStatus: status },
  });

  return getLatestKycVerificationForPerson(current[0].personId);
}

type KybSubmissionInput = {
  providerReference?: string;
  registrationReference?: string;
  documentMetadataJson?: string;
};

export async function listKybVerificationsForUser(userId: number) {
  const db = requireDatabase(await getDb());
  return db
    .select({
      id: kybVerifications.id,
      businessId: businessEntities.id,
      legalName: businessEntities.legalName,
      entityType: businessEntities.entityType,
      status: kybVerifications.status,
      submittedAt: kybVerifications.submittedAt,
      reviewedAt: kybVerifications.reviewedAt,
      expiresAt: kybVerifications.expiresAt,
      reviewReason: kybVerifications.reviewReason,
    })
    .from(kybVerifications)
    .innerJoin(businessEntities, eq(kybVerifications.businessId, businessEntities.id))
    .innerJoin(
      businessMemberships,
      and(
        eq(businessMemberships.businessId, businessEntities.id),
        eq(businessMemberships.userId, userId),
        eq(businessMemberships.status, "active"),
      ),
    )
    .orderBy(desc(kybVerifications.submittedAt), desc(kybVerifications.id));
}

export async function submitKybVerificationForUser(
  userId: number,
  businessId: number,
  input: KybSubmissionInput,
) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  if (person.kycStatus !== "verified") {
    throw new Error("A verified KYC identity is required before KYB submission");
  }

  const membership = await db
    .select({ membershipRole: businessMemberships.membershipRole })
    .from(businessMemberships)
    .where(
      and(
        eq(businessMemberships.businessId, businessId),
        eq(businessMemberships.userId, userId),
        eq(businessMemberships.personId, person.id),
        eq(businessMemberships.status, "active"),
        ne(businessMemberships.membershipRole, "viewer"),
      ),
    )
    .limit(1);
  if (!membership[0]) throw new Error("An active authorised business membership is required for KYB submission");

  const business = await db
    .select({ verificationStatus: businessEntities.verificationStatus })
    .from(businessEntities)
    .where(eq(businessEntities.id, businessId))
    .limit(1);
  if (!business[0]) throw new Error("Business entity was not found for KYB submission");
  assertSubmissionAllowed(business[0].verificationStatus, "KYB");

  const inserted = await db.insert(kybVerifications).values({
    businessId,
    submittedByUserId: userId,
    providerReference: input.providerReference || null,
    registrationReference: input.registrationReference || null,
    documentMetadataJson: input.documentMetadataJson || null,
  });
  const verificationId = Number(inserted[0].insertId);
  await db.update(businessEntities).set({ verificationStatus: "pending" }).where(eq(businessEntities.id, businessId));
  await appendAuditEvent({
    actorUserId: userId,
    action: "kyb_verification_submitted",
    resourceType: "kyb_verification",
    resourceId: String(verificationId),
    dataClassification: "restricted",
    metadata: { businessId, lifecycleStatus: "pending" },
  });

  const rows = await listKybVerificationsForUser(userId);
  return rows.find(row => row.id === verificationId);
}

export async function reviewKybVerification(
  reviewerUserId: number,
  verificationId: number,
  status: ReviewStatus,
  reviewReason?: string,
  expiresAt?: Date | null,
) {
  const db = requireDatabase(await getDb());
  const current = await db
    .select({ businessId: kybVerifications.businessId, status: kybVerifications.status })
    .from(kybVerifications)
    .where(eq(kybVerifications.id, verificationId))
    .limit(1);
  if (!current[0]) throw new Error("KYB verification was not found");
  assertReviewTransition(current[0].status, status, "KYB");

  const now = new Date();
  await db
    .update(kybVerifications)
    .set({
      status,
      reviewReason: reviewReason || null,
      reviewedByUserId: reviewerUserId,
      reviewedAt: now,
      expiresAt: expiresAt ?? null,
    })
    .where(eq(kybVerifications.id, verificationId));
  await db
    .update(businessEntities)
    .set({ verificationStatus: status })
    .where(eq(businessEntities.id, current[0].businessId));
  await appendAuditEvent({
    actorUserId: reviewerUserId,
    action: "kyb_verification_reviewed",
    resourceType: "kyb_verification",
    resourceId: String(verificationId),
    dataClassification: "restricted",
    metadata: { businessId: current[0].businessId, lifecycleStatus: status },
  });

  return { verificationId, businessId: current[0].businessId, status };
}

type TradeOfferingType = "product" | "service" | "used_asset";
type TradeDataClassification = "public" | "verified" | "restricted" | "confidential_sovereign";
type TradeOfferingReviewStatus = "verified" | "suspended" | "expired" | "rejected";
type IndividualActivityType = "consumer" | "individual_producer" | "used_asset_seller" | "service_provider";
type BusinessActivityType = "factory" | "importer" | "exporter" | "store" | "service_provider";
type ActivityReviewStatus = "verified" | "suspended" | "expired" | "rejected";
type ActivityLifecycleStatus = "unverified" | "pending" | ActivityReviewStatus;
type TradePartyKind = "business" | "individual";
type RelationshipDecision = "allow" | "deny" | "manual_review";
type RelationshipMode = "b2b" | "b2c" | "c2b" | "c2c";

type TradeOfferingInput = {
  businessId?: number;
  individualProfileId?: number;
  offeringType: TradeOfferingType;
  title: string;
  categoryCode?: string;
  descriptionJson?: string;
  dataClassification?: TradeDataClassification;
};

type TradeDemandInput = {
  businessId?: number;
  individualProfileId?: number;
  demandType: TradeOfferingType;
  title: string;
  geographyJson?: string;
  requirementsJson: string;
};

type IndividualActivityProfileInput = {
  activityType: IndividualActivityType;
  capabilitiesJson?: string;
  evidenceReference?: string;
};

type BusinessActivityVerificationInput = {
  activityType: BusinessActivityType;
  evidenceReference?: string;
};

type ResolvedTradeParty = {
  kind: TradePartyKind;
  identityKey: string;
  activityType: IndividualActivityType | null;
  businessActivities: BusinessActivityType[];
  entityType: BusinessActivityType | "government_entity" | "other" | null;
  legalVerificationStatus: string | null;
  kycStatus: string | null;
  activityVerificationStatus: string;
};

type RelationshipEvaluation = {
  decision: RelationshipDecision;
  relationshipMode: RelationshipMode;
  decisionReason: string;
  score: number;
};

async function assertVerifiedTradeEligibility(userId: number, businessId: number) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  if (person.kycStatus !== "verified") {
    throw new Error("A verified KYC identity is required before trade access");
  }

  const membership = await db
    .select({ role: businessMemberships.membershipRole, businessStatus: businessEntities.verificationStatus })
    .from(businessMemberships)
    .innerJoin(businessEntities, eq(businessMemberships.businessId, businessEntities.id))
    .where(
      and(
        eq(businessMemberships.businessId, businessId),
        eq(businessMemberships.userId, userId),
        eq(businessMemberships.personId, person.id),
        eq(businessMemberships.status, "active"),
        ne(businessMemberships.membershipRole, "viewer"),
      ),
    )
    .limit(1);

  if (!membership[0]) {
    throw new Error("An active authorised business membership is required for trade access");
  }
  if (membership[0].businessStatus !== "verified") {
    throw new Error("A verified KYB business is required for trade access");
  }
  return { personId: person.id, membershipRole: membership[0].role };
}

function assertActivitySubmissionAllowed(status: ActivityLifecycleStatus, scope: "Individual activity" | "Business activity") {
  if (status === "unverified" || status === "rejected" || status === "expired") return;
  throw new Error(`${scope} submission is not allowed while the current lifecycle state is ${status}`);
}

const allowedActivityReviewTransitions: Record<"pending" | ActivityReviewStatus, readonly ActivityReviewStatus[]> = {
  pending: ["verified", "rejected"],
  verified: ["suspended", "expired"],
  suspended: ["verified", "rejected"],
  expired: ["verified", "rejected"],
  rejected: [],
};

function assertActivityReviewTransition(
  currentStatus: "pending" | ActivityReviewStatus,
  nextStatus: ActivityReviewStatus,
  scope: "Individual activity" | "Business activity",
) {
  if (allowedActivityReviewTransitions[currentStatus].includes(nextStatus)) return;
  throw new Error(`${scope} transition from ${currentStatus} to ${nextStatus} is not allowed`);
}

export async function listIndividualActivityProfilesForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  return db
    .select()
    .from(individualActivityProfiles)
    .where(eq(individualActivityProfiles.personId, person.id))
    .orderBy(desc(individualActivityProfiles.updatedAt), desc(individualActivityProfiles.id));
}

export async function submitIndividualActivityProfileForUser(userId: number, input: IndividualActivityProfileInput) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  if (person.kycStatus !== "verified") {
    throw new Error("A verified KYC identity is required before submitting an individual activity profile");
  }

  const existing = await db
    .select()
    .from(individualActivityProfiles)
    .where(
      and(
        eq(individualActivityProfiles.personId, person.id),
        eq(individualActivityProfiles.activityType, input.activityType),
      ),
    )
    .limit(1);

  if (existing[0]) {
    assertActivitySubmissionAllowed(existing[0].verificationStatus, "Individual activity");
    await db
      .update(individualActivityProfiles)
      .set({
        verificationStatus: "pending",
        capabilitiesJson: input.capabilitiesJson || null,
        evidenceReference: input.evidenceReference || null,
      })
      .where(eq(individualActivityProfiles.id, existing[0].id));
  } else {
    await db.insert(individualActivityProfiles).values({
      personId: person.id,
      activityType: input.activityType,
      verificationStatus: "pending",
      capabilitiesJson: input.capabilitiesJson || null,
      evidenceReference: input.evidenceReference || null,
    });
  }

  const profile = await db
    .select()
    .from(individualActivityProfiles)
    .where(
      and(
        eq(individualActivityProfiles.personId, person.id),
        eq(individualActivityProfiles.activityType, input.activityType),
      ),
    )
    .limit(1);
  if (!profile[0]) throw new Error("Failed to load the submitted individual activity profile");
  await appendAuditEvent({
    actorUserId: userId,
    action: "individual_activity_profile_submitted",
    resourceType: "individual_activity_profile",
    resourceId: String(profile[0].id),
    dataClassification: "verified",
    metadata: { activityType: input.activityType, verificationStatus: "pending" },
  });
  return profile[0];
}

export async function reviewIndividualActivityProfile(
  reviewerUserId: number,
  profileId: number,
  status: ActivityReviewStatus,
) {
  const db = requireDatabase(await getDb());
  const current = await db
    .select({ status: individualActivityProfiles.verificationStatus, activityType: individualActivityProfiles.activityType })
    .from(individualActivityProfiles)
    .where(eq(individualActivityProfiles.id, profileId))
    .limit(1);
  if (!current[0]) throw new Error("Individual activity profile was not found");
  if (current[0].status === "unverified") {
    throw new Error("An unverified individual activity profile must be submitted before review");
  }
  assertActivityReviewTransition(current[0].status, status, "Individual activity");
  await db.update(individualActivityProfiles).set({ verificationStatus: status }).where(eq(individualActivityProfiles.id, profileId));
  await appendAuditEvent({
    actorUserId: reviewerUserId,
    action: "individual_activity_profile_reviewed",
    resourceType: "individual_activity_profile",
    resourceId: String(profileId),
    dataClassification: "verified",
    metadata: { activityType: current[0].activityType, verificationStatus: status },
  });
  return { profileId, status };
}

export async function listBusinessActivityVerificationsForUser(userId: number) {
  const db = requireDatabase(await getDb());
  return db
    .select({
      id: businessActivityVerifications.id,
      businessId: businessActivityVerifications.businessId,
      businessName: businessEntities.legalName,
      activityType: businessActivityVerifications.activityType,
      verificationStatus: businessActivityVerifications.verificationStatus,
      evidenceReference: businessActivityVerifications.evidenceReference,
      reviewedAt: businessActivityVerifications.reviewedAt,
      expiresAt: businessActivityVerifications.expiresAt,
      updatedAt: businessActivityVerifications.updatedAt,
    })
    .from(businessActivityVerifications)
    .innerJoin(businessEntities, eq(businessActivityVerifications.businessId, businessEntities.id))
    .innerJoin(
      businessMemberships,
      and(
        eq(businessMemberships.businessId, businessActivityVerifications.businessId),
        eq(businessMemberships.userId, userId),
        eq(businessMemberships.status, "active"),
      ),
    )
    .orderBy(desc(businessActivityVerifications.updatedAt), desc(businessActivityVerifications.id));
}

export async function submitBusinessActivityVerificationForUser(
  userId: number,
  businessId: number,
  input: BusinessActivityVerificationInput,
) {
  const db = requireDatabase(await getDb());
  await assertVerifiedTradeEligibility(userId, businessId);
  const existing = await db
    .select()
    .from(businessActivityVerifications)
    .where(
      and(
        eq(businessActivityVerifications.businessId, businessId),
        eq(businessActivityVerifications.activityType, input.activityType),
      ),
    )
    .limit(1);

  if (existing[0]) {
    assertActivitySubmissionAllowed(existing[0].verificationStatus, "Business activity");
    await db
      .update(businessActivityVerifications)
      .set({ verificationStatus: "pending", evidenceReference: input.evidenceReference || null, reviewedByUserId: null, reviewedAt: null })
      .where(eq(businessActivityVerifications.id, existing[0].id));
  } else {
    await db.insert(businessActivityVerifications).values({
      businessId,
      activityType: input.activityType,
      verificationStatus: "pending",
      evidenceReference: input.evidenceReference || null,
    });
  }

  const verification = await db
    .select()
    .from(businessActivityVerifications)
    .where(
      and(
        eq(businessActivityVerifications.businessId, businessId),
        eq(businessActivityVerifications.activityType, input.activityType),
      ),
    )
    .limit(1);
  if (!verification[0]) throw new Error("Failed to load the submitted business activity verification");
  await appendAuditEvent({
    actorUserId: userId,
    action: "business_activity_verification_submitted",
    resourceType: "business_activity_verification",
    resourceId: String(verification[0].id),
    dataClassification: "verified",
    metadata: { businessId, activityType: input.activityType, verificationStatus: "pending" },
  });
  return verification[0];
}

export async function reviewBusinessActivityVerification(
  reviewerUserId: number,
  verificationId: number,
  status: ActivityReviewStatus,
  expiresAt?: Date | null,
) {
  const db = requireDatabase(await getDb());
  const current = await db
    .select({
      businessId: businessActivityVerifications.businessId,
      status: businessActivityVerifications.verificationStatus,
      activityType: businessActivityVerifications.activityType,
    })
    .from(businessActivityVerifications)
    .where(eq(businessActivityVerifications.id, verificationId))
    .limit(1);
  if (!current[0]) throw new Error("Business activity verification was not found");
  if (current[0].status === "unverified") {
    throw new Error("An unverified business activity must be submitted before review");
  }
  assertActivityReviewTransition(current[0].status, status, "Business activity");
  await db
    .update(businessActivityVerifications)
    .set({ verificationStatus: status, reviewedByUserId: reviewerUserId, reviewedAt: new Date(), expiresAt: expiresAt ?? null })
    .where(eq(businessActivityVerifications.id, verificationId));
  await appendAuditEvent({
    actorUserId: reviewerUserId,
    action: "business_activity_verification_reviewed",
    resourceType: "business_activity_verification",
    resourceId: String(verificationId),
    dataClassification: "verified",
    metadata: { businessId: current[0].businessId, activityType: current[0].activityType, verificationStatus: status },
  });
  return { verificationId, businessId: current[0].businessId, status };
}

async function listCurrentVerifiedBusinessActivities(businessId: number): Promise<BusinessActivityType[]> {
  const db = requireDatabase(await getDb());
  const now = new Date();
  const rows = await db
    .select({ activityType: businessActivityVerifications.activityType, expiresAt: businessActivityVerifications.expiresAt })
    .from(businessActivityVerifications)
    .where(
      and(
        eq(businessActivityVerifications.businessId, businessId),
        eq(businessActivityVerifications.verificationStatus, "verified"),
      ),
    );
  return rows.filter(row => !row.expiresAt || row.expiresAt > now).map(row => row.activityType);
}

function businessActivitySupportsOffering(activityType: BusinessActivityType, offeringType: TradeOfferingType) {
  if (activityType === "service_provider") return offeringType === "service";
  return offeringType === "product" || offeringType === "used_asset";
}

function individualActivitySupportsOffering(activityType: IndividualActivityType, offeringType: TradeOfferingType) {
  if (activityType === "individual_producer") return offeringType === "product";
  if (activityType === "used_asset_seller") return offeringType === "used_asset";
  if (activityType === "service_provider") return offeringType === "service";
  return false;
}

async function assertVerifiedBusinessOperationalActivityForUser(
  userId: number,
  businessId: number,
  offeringType?: TradeOfferingType,
) {
  await assertVerifiedTradeEligibility(userId, businessId);
  const activities = await listCurrentVerifiedBusinessActivities(businessId);
  if (activities.length === 0) {
    throw new Error("A verified operational business activity is required before commercial access");
  }
  if (offeringType && !activities.some(activity => businessActivitySupportsOffering(activity, offeringType))) {
    throw new Error("The verified business activity does not permit this offering type");
  }
  return activities;
}

async function assertVerifiedIndividualActivityProfileForUser(
  userId: number,
  profileId: number,
  offeringType?: TradeOfferingType,
) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  if (person.kycStatus !== "verified") {
    throw new Error("A verified KYC identity is required before commercial access");
  }
  const profile = await db
    .select()
    .from(individualActivityProfiles)
    .where(and(eq(individualActivityProfiles.id, profileId), eq(individualActivityProfiles.personId, person.id)))
    .limit(1);
  if (!profile[0]) throw new Error("The individual activity profile is not owned by the current verified identity");
  if (profile[0].verificationStatus !== "verified") {
    throw new Error("A verified individual activity profile is required before commercial access");
  }
  if (offeringType && !individualActivitySupportsOffering(profile[0].activityType, offeringType)) {
    throw new Error("The verified individual activity profile does not permit this offering type");
  }
  return profile[0];
}

async function resolveTradeParty(input: { kind: TradePartyKind; businessId?: number; individualProfileId?: number }) {
  const db = requireDatabase(await getDb());
  if (input.kind === "business") {
    if (!input.businessId || input.individualProfileId) throw new Error("A business party requires exactly one business identity");
    const business = await db.select().from(businessEntities).where(eq(businessEntities.id, input.businessId)).limit(1);
    if (!business[0]) throw new Error("Business party was not found");
    const businessActivities = await listCurrentVerifiedBusinessActivities(input.businessId);
    return {
      kind: "business" as const,
      identityKey: `business:${input.businessId}`,
      activityType: null,
      businessActivities,
      entityType: business[0].entityType,
      legalVerificationStatus: business[0].verificationStatus,
      kycStatus: null,
      activityVerificationStatus: businessActivities.length > 0 ? "verified" : "unverified",
    } satisfies ResolvedTradeParty;
  }

  if (!input.individualProfileId || input.businessId) throw new Error("An individual party requires exactly one activity profile");
  const profile = await db
    .select({
      id: individualActivityProfiles.id,
      activityType: individualActivityProfiles.activityType,
      verificationStatus: individualActivityProfiles.verificationStatus,
      kycStatus: persons.kycStatus,
    })
    .from(individualActivityProfiles)
    .innerJoin(persons, eq(individualActivityProfiles.personId, persons.id))
    .where(eq(individualActivityProfiles.id, input.individualProfileId))
    .limit(1);
  if (!profile[0]) throw new Error("Individual activity profile was not found");
  return {
    kind: "individual" as const,
    identityKey: `individual:${profile[0].id}`,
    activityType: profile[0].activityType,
    businessActivities: [],
    entityType: null,
    legalVerificationStatus: null,
    kycStatus: profile[0].kycStatus,
    activityVerificationStatus: profile[0].verificationStatus,
  } satisfies ResolvedTradeParty;
}

function calculateRelationshipEvaluation(supplier: ResolvedTradeParty, requester: ResolvedTradeParty): RelationshipEvaluation {
  const relationshipMode: RelationshipMode =
    supplier.kind === "business" && requester.kind === "business"
      ? "b2b"
      : supplier.kind === "business"
        ? "b2c"
        : requester.kind === "business"
          ? "c2b"
          : "c2c";

  if (supplier.identityKey === requester.identityKey) {
    return { decision: "deny", relationshipMode, decisionReason: "self_relationship_not_allowed", score: 0 };
  }
  if (supplier.kind === "individual" && supplier.activityType === "consumer" && requester.entityType === "factory") {
    return { decision: "deny", relationshipMode, decisionReason: "consumer_to_factory_not_supported", score: 0 };
  }
  if (supplier.kind === "individual" && supplier.activityType === "consumer" && requester.entityType === "importer") {
    return { decision: "deny", relationshipMode, decisionReason: "consumer_to_importer_not_supported", score: 0 };
  }
  if (supplier.kind === "business" && supplier.legalVerificationStatus !== "verified") {
    return { decision: "deny", relationshipMode, decisionReason: "supplier_business_not_kyb_verified", score: 0 };
  }
  if (requester.kind === "business" && requester.legalVerificationStatus !== "verified") {
    return { decision: "deny", relationshipMode, decisionReason: "requester_business_not_kyb_verified", score: 0 };
  }
  if (supplier.kind === "individual" && supplier.kycStatus !== "verified") {
    return { decision: "deny", relationshipMode, decisionReason: "supplier_identity_not_kyc_verified", score: 0 };
  }
  if (requester.kind === "individual" && requester.kycStatus !== "verified") {
    return { decision: "deny", relationshipMode, decisionReason: "requester_identity_not_kyc_verified", score: 0 };
  }
  if (supplier.entityType === "government_entity" || requester.entityType === "government_entity") {
    return { decision: "manual_review", relationshipMode, decisionReason: "government_relationship_out_of_operational_scope", score: 50 };
  }
  if (supplier.activityVerificationStatus !== "verified") {
    return { decision: "manual_review", relationshipMode, decisionReason: "supplier_operational_activity_pending_or_unverified", score: 50 };
  }
  if (requester.activityVerificationStatus !== "verified") {
    return { decision: "manual_review", relationshipMode, decisionReason: "requester_operational_activity_pending_or_unverified", score: 50 };
  }
  return { decision: "allow", relationshipMode, decisionReason: "relationship_trust_gates_satisfied", score: 100 };
}

export async function checkCommercialRelationshipForUser(
  userId: number,
  input: { supplierKind: TradePartyKind; supplierBusinessId?: number; supplierIndividualProfileId?: number; requesterKind: TradePartyKind; requesterBusinessId?: number; requesterIndividualProfileId?: number },
) {
  const supplier = await resolveTradeParty({
    kind: input.supplierKind,
    businessId: input.supplierBusinessId,
    individualProfileId: input.supplierIndividualProfileId,
  });
  const requester = await resolveTradeParty({
    kind: input.requesterKind,
    businessId: input.requesterBusinessId,
    individualProfileId: input.requesterIndividualProfileId,
  });
  const evaluation = calculateRelationshipEvaluation(supplier, requester);
  await appendAuditEvent({
    actorUserId: userId,
    action: "commercial_relationship_evaluated",
    resourceType: "commercial_relationship",
    resourceId: `${supplier.identityKey}|${requester.identityKey}`,
    dataClassification: "verified",
    metadata: { relationshipMode: evaluation.relationshipMode, decision: evaluation.decision, reason: evaluation.decisionReason },
  });
  return evaluation;
}

const allowedOfferingReviewTransitions: Record<
  "pending" | TradeOfferingReviewStatus,
  readonly TradeOfferingReviewStatus[]
> = {
  pending: ["verified", "rejected"],
  verified: ["suspended", "expired"],
  suspended: ["verified", "rejected"],
  expired: ["verified", "rejected"],
  rejected: [],
};

export async function listTradeOfferingsForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  return db
    .select({
      id: tradeOfferings.id,
      businessId: tradeOfferings.businessId,
      individualProfileId: tradeOfferings.individualProfileId,
      supplierKind: tradeOfferings.supplierKind,
      businessName: businessEntities.legalName,
      individualActivityType: individualActivityProfiles.activityType,
      offeringType: tradeOfferings.offeringType,
      title: tradeOfferings.title,
      categoryCode: tradeOfferings.categoryCode,
      dataClassification: tradeOfferings.dataClassification,
      verificationStatus: tradeOfferings.verificationStatus,
      lifecycleStatus: tradeOfferings.lifecycleStatus,
      createdAt: tradeOfferings.createdAt,
      updatedAt: tradeOfferings.updatedAt,
    })
    .from(tradeOfferings)
    .leftJoin(businessEntities, eq(tradeOfferings.businessId, businessEntities.id))
    .leftJoin(
      businessMemberships,
      and(
        eq(businessMemberships.businessId, tradeOfferings.businessId),
        eq(businessMemberships.userId, userId),
        eq(businessMemberships.status, "active"),
      ),
    )
    .leftJoin(individualActivityProfiles, eq(tradeOfferings.individualProfileId, individualActivityProfiles.id))
    .where(
      or(
        and(eq(tradeOfferings.supplierKind, "business"), eq(businessMemberships.userId, userId)),
        and(eq(tradeOfferings.supplierKind, "individual"), eq(individualActivityProfiles.personId, person.id)),
      ),
    )
    .orderBy(desc(tradeOfferings.createdAt), desc(tradeOfferings.id));
}

export async function createTradeOfferingForUser(userId: number, input: TradeOfferingInput) {
  const db = requireDatabase(await getDb());
  const isBusinessSource = typeof input.businessId === "number" && !input.individualProfileId;
  const isIndividualSource = typeof input.individualProfileId === "number" && !input.businessId;
  if (!isBusinessSource && !isIndividualSource) {
    throw new Error("A trade offering requires exactly one verified business or individual activity source");
  }
  if (isBusinessSource) {
    await assertVerifiedBusinessOperationalActivityForUser(userId, input.businessId!, input.offeringType);
  } else {
    await assertVerifiedIndividualActivityProfileForUser(userId, input.individualProfileId!, input.offeringType);
  }
  const inserted = await db.insert(tradeOfferings).values({
    businessId: input.businessId ?? null,
    individualProfileId: input.individualProfileId ?? null,
    supplierKind: isBusinessSource ? "business" : "individual",
    createdByUserId: userId,
    offeringType: input.offeringType,
    title: input.title,
    categoryCode: input.categoryCode || null,
    descriptionJson: input.descriptionJson || null,
    dataClassification: input.dataClassification ?? "verified",
    verificationStatus: "pending",
  });
  const offeringId = Number(inserted[0].insertId);
  await appendAuditEvent({
    actorUserId: userId,
    action: "trade_offering_registered",
    resourceType: "trade_offering",
    resourceId: String(offeringId),
    dataClassification: input.dataClassification ?? "verified",
    metadata: {
      sourceKind: isBusinessSource ? "business" : "individual",
      sourceId: input.businessId ?? input.individualProfileId ?? null,
      offeringType: input.offeringType,
      verificationStatus: "pending",
    },
  });
  const created = await db.select().from(tradeOfferings).where(eq(tradeOfferings.id, offeringId)).limit(1);
  if (!created[0]) throw new Error("Failed to load the created trade offering");
  return created[0];
}

export async function reviewTradeOffering(
  reviewerUserId: number,
  offeringId: number,
  status: TradeOfferingReviewStatus,
) {
  const db = requireDatabase(await getDb());
  const current = await db
    .select({
      status: tradeOfferings.verificationStatus,
      businessId: tradeOfferings.businessId,
      individualProfileId: tradeOfferings.individualProfileId,
      supplierKind: tradeOfferings.supplierKind,
    })
    .from(tradeOfferings)
    .where(eq(tradeOfferings.id, offeringId))
    .limit(1);
  if (!current[0]) throw new Error("Trade offering was not found");
  if (current[0].status === "draft") {
    throw new Error("A draft trade offering must be submitted before review");
  }
  if (!allowedOfferingReviewTransitions[current[0].status].includes(status)) {
    throw new Error(`Trade offering transition from ${current[0].status} to ${status} is not allowed`);
  }

  await db
    .update(tradeOfferings)
    .set({ verificationStatus: status, lifecycleStatus: status === "verified" ? "published" : "draft" })
    .where(eq(tradeOfferings.id, offeringId));
  await appendAuditEvent({
    actorUserId: reviewerUserId,
    action: "trade_offering_reviewed",
    resourceType: "trade_offering",
    resourceId: String(offeringId),
    dataClassification: "verified",
    metadata: {
      sourceKind: current[0].supplierKind,
      sourceId: current[0].businessId ?? current[0].individualProfileId,
      verificationStatus: status,
    },
  });
  return { offeringId, businessId: current[0].businessId, individualProfileId: current[0].individualProfileId, status };
}

export async function listTradeDemandsForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  return db
    .select({
      id: tradeDemands.id,
      requesterBusinessId: tradeDemands.requesterBusinessId,
      requesterIndividualProfileId: tradeDemands.requesterIndividualProfileId,
      requesterKind: tradeDemands.requesterKind,
      businessName: businessEntities.legalName,
      individualActivityType: individualActivityProfiles.activityType,
      demandType: tradeDemands.demandType,
      title: tradeDemands.title,
      status: tradeDemands.status,
      createdAt: tradeDemands.createdAt,
      updatedAt: tradeDemands.updatedAt,
    })
    .from(tradeDemands)
    .leftJoin(businessEntities, eq(tradeDemands.requesterBusinessId, businessEntities.id))
    .leftJoin(
      businessMemberships,
      and(
        eq(businessMemberships.businessId, tradeDemands.requesterBusinessId),
        eq(businessMemberships.userId, userId),
        eq(businessMemberships.status, "active"),
      ),
    )
    .leftJoin(individualActivityProfiles, eq(tradeDemands.requesterIndividualProfileId, individualActivityProfiles.id))
    .where(
      or(
        and(eq(tradeDemands.requesterKind, "business"), eq(businessMemberships.userId, userId)),
        and(eq(tradeDemands.requesterKind, "individual"), eq(individualActivityProfiles.personId, person.id)),
      ),
    )
    .orderBy(desc(tradeDemands.createdAt), desc(tradeDemands.id));
}

export async function createTradeDemandForUser(userId: number, input: TradeDemandInput) {
  const db = requireDatabase(await getDb());
  const isBusinessRequester = typeof input.businessId === "number" && !input.individualProfileId;
  const isIndividualRequester = typeof input.individualProfileId === "number" && !input.businessId;
  if (!isBusinessRequester && !isIndividualRequester) {
    throw new Error("A trade demand requires exactly one verified business or individual activity source");
  }
  if (isBusinessRequester) {
    await assertVerifiedBusinessOperationalActivityForUser(userId, input.businessId!);
  } else {
    await assertVerifiedIndividualActivityProfileForUser(userId, input.individualProfileId!);
  }
  const inserted = await db.insert(tradeDemands).values({
    requesterBusinessId: input.businessId ?? null,
    requesterIndividualProfileId: input.individualProfileId ?? null,
    requesterKind: isBusinessRequester ? "business" : "individual",
    createdByUserId: userId,
    demandType: input.demandType,
    title: input.title,
    geographyJson: input.geographyJson || null,
    requirementsJson: input.requirementsJson,
    status: "published",
  });
  const demandId = Number(inserted[0].insertId);
  await appendAuditEvent({
    actorUserId: userId,
    action: "trade_demand_published",
    resourceType: "trade_demand",
    resourceId: String(demandId),
    dataClassification: "verified",
    metadata: {
      requesterKind: isBusinessRequester ? "business" : "individual",
      requesterId: input.businessId ?? input.individualProfileId ?? null,
      demandType: input.demandType,
    },
  });
  const created = await db.select().from(tradeDemands).where(eq(tradeDemands.id, demandId)).limit(1);
  if (!created[0]) throw new Error("Failed to load the created trade demand");
  return created[0];
}

export async function evaluateTradeMatchForUser(userId: number, demandId: number, offeringId: number) {
  const db = requireDatabase(await getDb());
  const demand = await db.select().from(tradeDemands).where(eq(tradeDemands.id, demandId)).limit(1);
  if (!demand[0]) throw new Error("Trade demand was not found");
  if (demand[0].requesterKind === "business") {
    if (!demand[0].requesterBusinessId) throw new Error("Business demand is missing its requester identity");
    await assertVerifiedBusinessOperationalActivityForUser(userId, demand[0].requesterBusinessId);
  } else {
    if (!demand[0].requesterIndividualProfileId) throw new Error("Individual demand is missing its activity profile");
    await assertVerifiedIndividualActivityProfileForUser(userId, demand[0].requesterIndividualProfileId);
  }

  const offering = await db
    .select({
      id: tradeOfferings.id,
      businessId: tradeOfferings.businessId,
      individualProfileId: tradeOfferings.individualProfileId,
      supplierKind: tradeOfferings.supplierKind,
      offeringType: tradeOfferings.offeringType,
      verificationStatus: tradeOfferings.verificationStatus,
      lifecycleStatus: tradeOfferings.lifecycleStatus,
    })
    .from(tradeOfferings)
    .where(eq(tradeOfferings.id, offeringId))
    .limit(1);
  if (!offering[0]) throw new Error("Trade offering was not found");

  const existing = await db
    .select()
    .from(tradeMatches)
    .where(and(eq(tradeMatches.demandId, demandId), eq(tradeMatches.offeringId, offeringId)))
    .limit(1);
  if (existing[0]) return existing[0];

  const reasons: string[] = [];
  if (demand[0].demandType !== offering[0].offeringType) reasons.push("offering_type_mismatch");
  if (offering[0].verificationStatus !== "verified" || offering[0].lifecycleStatus !== "published") {
    reasons.push("offering_not_independently_verified_and_published");
  }

  const supplier = await resolveTradeParty({
    kind: offering[0].supplierKind,
    businessId: offering[0].businessId ?? undefined,
    individualProfileId: offering[0].individualProfileId ?? undefined,
  });
  const requester = await resolveTradeParty({
    kind: demand[0].requesterKind,
    businessId: demand[0].requesterBusinessId ?? undefined,
    individualProfileId: demand[0].requesterIndividualProfileId ?? undefined,
  });
  const relationship = calculateRelationshipEvaluation(supplier, requester);
  if (relationship.decision !== "allow") reasons.push(relationship.decisionReason);

  const status = reasons.length > 0 ? (relationship.decision === "manual_review" ? "manual_review" : "ineligible") : "eligible";
  const score = status === "eligible" ? 100 : relationship.score;
  const inserted = await db.insert(tradeMatches).values({
    demandId,
    offeringId,
    evaluatedByUserId: userId,
    score,
    relationshipMode: relationship.relationshipMode,
    status,
    decisionReason: reasons.length === 0 ? relationship.decisionReason : reasons.join(";"),
  });
  const matchId = Number(inserted[0].insertId);
  if (status === "eligible") {
    await db.update(tradeDemands).set({ status: "matching" }).where(eq(tradeDemands.id, demandId));
  }
  await appendAuditEvent({
    actorUserId: userId,
    action: "trade_match_evaluated",
    resourceType: "trade_match",
    resourceId: String(matchId),
    dataClassification: "verified",
    metadata: { demandId, offeringId, status, score },
  });
  const created = await db.select().from(tradeMatches).where(eq(tradeMatches.id, matchId)).limit(1);
  if (!created[0]) throw new Error("Failed to load the evaluated trade match");
  return created[0];
}

export async function listTradeMatchesForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  return db
    .select({
      id: tradeMatches.id,
      demandId: tradeMatches.demandId,
      demandTitle: tradeDemands.title,
      offeringId: tradeMatches.offeringId,
      offeringTitle: tradeOfferings.title,
      score: tradeMatches.score,
      relationshipMode: tradeMatches.relationshipMode,
      status: tradeMatches.status,
      decisionReason: tradeMatches.decisionReason,
      createdAt: tradeMatches.createdAt,
    })
    .from(tradeMatches)
    .innerJoin(tradeDemands, eq(tradeMatches.demandId, tradeDemands.id))
    .innerJoin(tradeOfferings, eq(tradeMatches.offeringId, tradeOfferings.id))
    .leftJoin(
      businessMemberships,
      and(
        eq(businessMemberships.businessId, tradeDemands.requesterBusinessId),
        eq(businessMemberships.userId, userId),
        eq(businessMemberships.status, "active"),
      ),
    )
    .leftJoin(individualActivityProfiles, eq(tradeDemands.requesterIndividualProfileId, individualActivityProfiles.id))
    .where(
      or(
        and(eq(tradeDemands.requesterKind, "business"), eq(businessMemberships.userId, userId)),
        and(eq(tradeDemands.requesterKind, "individual"), eq(individualActivityProfiles.personId, person.id)),
      ),
    )
    .orderBy(desc(tradeMatches.createdAt), desc(tradeMatches.id));
}

type CommercialPartyRef = { businessId?: number; individualProfileId?: number };

type TradeLifecycleStatus =
  | "accepted"
  | "processing"
  | "ready_for_pickup"
  | "in_transit"
  | "delivered"
  | "received"
  | "closed"
  | "cancelled"
  | "disputed";

function assertExactlyOneCommercialParty(input: CommercialPartyRef, label: string) {
  const count = Number(typeof input.businessId === "number") + Number(typeof input.individualProfileId === "number");
  if (count !== 1) throw new Error(`${label} requires exactly one business or individual activity identity`);
}

async function assertTradeDemandController(userId: number, demandId: number) {
  const db = requireDatabase(await getDb());
  const demand = await db.select().from(tradeDemands).where(eq(tradeDemands.id, demandId)).limit(1);
  if (!demand[0]) throw new Error("Trade demand was not found");
  if (demand[0].requesterKind === "business") {
    if (!demand[0].requesterBusinessId) throw new Error("Business demand is missing its requester identity");
    await assertVerifiedBusinessOperationalActivityForUser(userId, demand[0].requesterBusinessId);
  } else {
    if (!demand[0].requesterIndividualProfileId) throw new Error("Individual demand is missing its activity profile");
    await assertVerifiedIndividualActivityProfileForUser(userId, demand[0].requesterIndividualProfileId);
  }
  return demand[0];
}

async function assertTradeOfferingController(userId: number, offeringId: number) {
  const db = requireDatabase(await getDb());
  const offering = await db.select().from(tradeOfferings).where(eq(tradeOfferings.id, offeringId)).limit(1);
  if (!offering[0]) throw new Error("Trade offering was not found");
  if (offering[0].supplierKind === "business") {
    if (!offering[0].businessId) throw new Error("Business offering is missing its supplier identity");
    await assertVerifiedBusinessOperationalActivityForUser(userId, offering[0].businessId, offering[0].offeringType);
  } else {
    if (!offering[0].individualProfileId) throw new Error("Individual offering is missing its activity profile");
    await assertVerifiedIndividualActivityProfileForUser(userId, offering[0].individualProfileId, offering[0].offeringType);
  }
  return offering[0];
}

async function assertTradeTransactionParticipant(userId: number, transactionId: number) {
  const db = requireDatabase(await getDb());
  const transaction = await db.select().from(tradeTransactions).where(eq(tradeTransactions.id, transactionId)).limit(1);
  if (!transaction[0]) throw new Error("Trade transaction was not found");
  const memberships = await db
    .select({ businessId: businessMemberships.businessId })
    .from(businessMemberships)
    .where(and(eq(businessMemberships.userId, userId), eq(businessMemberships.status, "active")));
  const membershipIds = new Set(memberships.map(item => item.businessId));
  const businessAllowed = [transaction[0].buyerBusinessId, transaction[0].sellerBusinessId, transaction[0].ownerBusinessId, transaction[0].custodianBusinessId]
    .filter((value): value is number => typeof value === "number")
    .some(value => membershipIds.has(value));
  const person = await getOrCreatePersonForUser(userId);
  const profiles = await db.select({ id: individualActivityProfiles.id }).from(individualActivityProfiles).where(eq(individualActivityProfiles.personId, person.id));
  const profileIds = new Set(profiles.map(item => item.id));
  const individualAllowed = [transaction[0].buyerIndividualProfileId, transaction[0].sellerIndividualProfileId, transaction[0].ownerIndividualProfileId]
    .filter((value): value is number => typeof value === "number")
    .some(value => profileIds.has(value));
  if (!businessAllowed && !individualAllowed) throw new Error("User is not authorized for this trade transaction");
  return transaction[0];
}

export async function createTradeRfqForUser(
  userId: number,
  input: { matchId: number; requestedQuantity: number; quantityUnit: string; deliveryTermsJson: string; paymentTermsJson: string; validUntil?: Date },
) {
  const db = requireDatabase(await getDb());
  if (input.requestedQuantity <= 0) throw new Error("Requested quantity must be positive");
  const match = await db.select().from(tradeMatches).where(eq(tradeMatches.id, input.matchId)).limit(1);
  if (!match[0] || match[0].status !== "eligible") throw new Error("RFQ requires an eligible trade match");
  const demand = await assertTradeDemandController(userId, match[0].demandId);
  const offeringRows = await db.select().from(tradeOfferings).where(eq(tradeOfferings.id, match[0].offeringId)).limit(1);
  const offering = offeringRows[0];
  if (!offering || offering.verificationStatus !== "verified" || offering.lifecycleStatus !== "published") throw new Error("RFQ requires a verified and published offering");
  await enforceTradePolicy(userId, "trade.rfq.open", "trade_rfq", `match:${input.matchId}`, {
    actorControlsDemand: true,
    kycVerified: true,
    kybVerified: true,
    membershipActive: true,
    matchStatus: match[0].status,
    offeringVerificationStatus: offering.verificationStatus,
    offeringLifecycleStatus: offering.lifecycleStatus,
  });
  const inserted = await db.insert(tradeRfqs).values({
    matchId: input.matchId,
    createdByUserId: userId,
    requestedQuantity: input.requestedQuantity,
    quantityUnit: input.quantityUnit,
    deliveryTermsJson: input.deliveryTermsJson,
    paymentTermsJson: input.paymentTermsJson,
    status: "open",
    validUntil: input.validUntil ?? null,
  });
  const rfqId = Number(inserted[0].insertId);
  await appendAuditEvent({ actorUserId: userId, action: "trade_rfq_opened", resourceType: "trade_rfq", resourceId: String(rfqId), dataClassification: "verified", metadata: { matchId: input.matchId, demandId: demand.id, offeringId: offering.id } });
  const created = await db.select().from(tradeRfqs).where(eq(tradeRfqs.id, rfqId)).limit(1);
  if (!created[0]) throw new Error("Failed to load created RFQ");
  return created[0];
}

export async function submitTradeQuotationForUser(
  userId: number,
  input: { rfqId: number; quantity: number; unitPriceMinor: number; currencyCode?: string; leadTimeDays: number; termsJson: string; validUntil?: Date },
) {
  const db = requireDatabase(await getDb());
  if (input.quantity <= 0 || input.unitPriceMinor < 0 || input.leadTimeDays < 0) throw new Error("Quotation commercial values are invalid");
  const rfq = await db.select().from(tradeRfqs).where(eq(tradeRfqs.id, input.rfqId)).limit(1);
  if (!rfq[0] || !["open", "quoted"].includes(rfq[0].status)) throw new Error("RFQ is not open for quotations");
  const match = await db.select().from(tradeMatches).where(eq(tradeMatches.id, rfq[0].matchId)).limit(1);
  if (!match[0] || match[0].status !== "eligible") throw new Error("Quotation requires an eligible match");
  await assertTradeOfferingController(userId, match[0].offeringId);
  const offering = await db.select().from(tradeOfferings).where(eq(tradeOfferings.id, match[0].offeringId)).limit(1);
  await enforceTradePolicy(userId, "trade.quotation.submit", "trade_quotation", `rfq:${input.rfqId}`, {
    actorControlsOffering: true,
    actorIsParticipant: true,
    kycVerified: true,
    kybVerified: true,
    membershipActive: true,
    matchStatus: match[0].status,
    rfqStatus: rfq[0].status,
    offeringVerificationStatus: offering[0]?.verificationStatus,
    offeringLifecycleStatus: offering[0]?.lifecycleStatus,
  });
  const inserted = await db.insert(tradeQuotations).values({
    rfqId: input.rfqId,
    supplierUserId: userId,
    quantity: input.quantity,
    unitPriceMinor: input.unitPriceMinor,
    currencyCode: input.currencyCode ?? "EGP",
    leadTimeDays: input.leadTimeDays,
    termsJson: input.termsJson,
    status: "submitted",
    validUntil: input.validUntil ?? null,
  });
  const quotationId = Number(inserted[0].insertId);
  await db.update(tradeRfqs).set({ status: "quoted" }).where(eq(tradeRfqs.id, input.rfqId));
  await appendAuditEvent({ actorUserId: userId, action: "trade_quotation_submitted", resourceType: "trade_quotation", resourceId: String(quotationId), dataClassification: "verified", metadata: { rfqId: input.rfqId, matchId: rfq[0].matchId } });
  const created = await db.select().from(tradeQuotations).where(eq(tradeQuotations.id, quotationId)).limit(1);
  if (!created[0]) throw new Error("Failed to load created quotation");
  return created[0];
}

export async function acceptTradeQuotationForUser(userId: number, quotationId: number) {
  const db = requireDatabase(await getDb());
  const quotation = await db.select().from(tradeQuotations).where(eq(tradeQuotations.id, quotationId)).limit(1);
  if (!quotation[0] || !["submitted", "countered"].includes(quotation[0].status)) throw new Error("Quotation is not available for acceptance");
  const rfq = await db.select().from(tradeRfqs).where(eq(tradeRfqs.id, quotation[0].rfqId)).limit(1);
  if (!rfq[0] || !["open", "quoted"].includes(rfq[0].status)) throw new Error("RFQ is not available for acceptance");
  const match = await db.select().from(tradeMatches).where(eq(tradeMatches.id, rfq[0].matchId)).limit(1);
  if (!match[0] || match[0].status !== "eligible") throw new Error("Transaction requires an eligible match");
  const demand = await assertTradeDemandController(userId, match[0].demandId);
  const offering = await db.select().from(tradeOfferings).where(eq(tradeOfferings.id, match[0].offeringId)).limit(1);
  if (!offering[0] || offering[0].verificationStatus !== "verified" || offering[0].lifecycleStatus !== "published") throw new Error("Offering is not commercially active");
  await enforceTradePolicy(userId, "trade.quotation.accept", "trade_transaction", `quotation:${quotationId}`, {
    actorControlsDemand: true,
    kycVerified: true,
    kybVerified: true,
    membershipActive: true,
    matchStatus: match[0].status,
    rfqStatus: rfq[0].status,
    quotationStatus: quotation[0].status,
    offeringVerificationStatus: offering[0].verificationStatus,
    offeringLifecycleStatus: offering[0].lifecycleStatus,
  });
  const totalPriceMinor = quotation[0].quantity * quotation[0].unitPriceMinor;
  const transaction = await db.transaction(async tx => {
    const inserted = await tx.insert(tradeTransactions).values({
      rfqId: rfq[0].id,
      quotationId: quotation[0].id,
      matchId: match[0].id,
      offeringId: offering[0].id,
      demandId: demand.id,
      buyerBusinessId: demand.requesterBusinessId,
      buyerIndividualProfileId: demand.requesterIndividualProfileId,
      sellerBusinessId: offering[0].businessId,
      sellerIndividualProfileId: offering[0].individualProfileId,
      quantity: quotation[0].quantity,
      quantityUnit: rfq[0].quantityUnit,
      unitPriceMinor: quotation[0].unitPriceMinor,
      totalPriceMinor,
      currencyCode: quotation[0].currencyCode,
      deliveryTermsJson: rfq[0].deliveryTermsJson,
      paymentTermsJson: rfq[0].paymentTermsJson,
      status: "accepted",
      paymentStatus: "unrecorded",
      ownerBusinessId: demand.requesterBusinessId,
      ownerIndividualProfileId: demand.requesterIndividualProfileId,
    });
    const transactionId = Number(inserted[0].insertId);
    await tx.update(tradeQuotations).set({ status: "accepted" }).where(eq(tradeQuotations.id, quotationId));
    await tx.update(tradeRfqs).set({ status: "accepted" }).where(eq(tradeRfqs.id, rfq[0].id));
    return transactionId;
  });
  await appendAuditEvent({ actorUserId: userId, action: "trade_transaction_accepted", resourceType: "trade_transaction", resourceId: String(transaction), dataClassification: "verified", metadata: { quotationId, rfqId: rfq[0].id, matchId: match[0].id, totalPriceMinor } });
  const created = await db.select().from(tradeTransactions).where(eq(tradeTransactions.id, transaction)).limit(1);
  if (!created[0]) throw new Error("Failed to load created transaction");
  return created[0];
}

export async function updateTradeTransactionPaymentForUser(userId: number, transactionId: number, paymentStatus: "cash_pending" | "bank_transfer_pending" | "credit_terms" | "external_recorded" | "settled") {
  const db = requireDatabase(await getDb());
  const transaction = await assertTradeTransactionParticipant(userId, transactionId);
  await enforceTradePolicy(userId, "trade.payment.update", "trade_transaction", String(transactionId), {
    actorIsParticipant: true,
    transactionStatus: transaction.status,
  });
  if (transaction.status === "closed" || transaction.status === "cancelled") throw new Error("Closed or cancelled transactions cannot change payment status");
  await db.update(tradeTransactions).set({ paymentStatus }).where(eq(tradeTransactions.id, transactionId));
  await appendAuditEvent({ actorUserId: userId, action: "trade_payment_status_updated", resourceType: "trade_transaction", resourceId: String(transactionId), dataClassification: "verified", metadata: { paymentStatus } });
  return { transactionId, paymentStatus };
}

export async function createTransportJobForUser(userId: number, input: { transactionId: number; providerBusinessId: number; pickupLocationJson: string; deliveryLocationJson: string; driverReference?: string; vehicleReference?: string }) {
  const db = requireDatabase(await getDb());
  const transaction = await assertTradeTransactionParticipant(userId, input.transactionId);
  if (!["accepted", "processing", "ready_for_pickup"].includes(transaction.status)) throw new Error("Transport can only be assigned before transit");
  await assertVerifiedBusinessOperationalActivityForUser(userId, input.providerBusinessId, "service");
  await enforceTradePolicy(userId, "trade.transport.assign", "transport_job", `transaction:${input.transactionId}`, {
    actorIsParticipant: true,
    operationalActivityVerified: true,
    transportProviderVerified: true,
    transactionStatus: transaction.status,
  });
  const inserted = await db.insert(transportJobs).values({ transactionId: input.transactionId, providerBusinessId: input.providerBusinessId, pickupLocationJson: input.pickupLocationJson, deliveryLocationJson: input.deliveryLocationJson, driverReference: input.driverReference ?? null, vehicleReference: input.vehicleReference ?? null, status: "assigned" });
  const jobId = Number(inserted[0].insertId);
  await db.update(tradeTransactions).set({ status: "processing", custodianBusinessId: input.providerBusinessId }).where(eq(tradeTransactions.id, input.transactionId));
  await appendAuditEvent({ actorUserId: userId, action: "trade_transport_assigned", resourceType: "transport_job", resourceId: String(jobId), dataClassification: "verified", metadata: { transactionId: transaction.id, providerBusinessId: input.providerBusinessId } });
  const created = await db.select().from(transportJobs).where(eq(transportJobs.id, jobId)).limit(1);
  if (!created[0]) throw new Error("Failed to load created transport job");
  return created[0];
}

export async function advanceTradeTransportForUser(userId: number, jobId: number, status: "ready" | "picked_up" | "in_transit") {
  const db = requireDatabase(await getDb());
  const job = await db.select().from(transportJobs).where(eq(transportJobs.id, jobId)).limit(1);
  if (!job[0]) throw new Error("Transport job was not found");
  await assertTradeTransactionParticipant(userId, job[0].transactionId);
  const allowed: Record<string, string[]> = { assigned: ["ready"], ready: ["picked_up"], picked_up: ["in_transit"] };
  if (!allowed[job[0].status]?.includes(status)) throw new Error(`Transport transition from ${job[0].status} to ${status} is not allowed`);
  await enforceTradePolicy(userId, "trade.transport.advance", "transport_job", String(jobId), {
    actorIsParticipant: true,
    transportStatus: job[0].status,
    requestedTransition: status,
  });
  await db.update(transportJobs).set({ status, pickupAt: status === "picked_up" ? new Date() : undefined }).where(eq(transportJobs.id, jobId));
  await db.update(tradeTransactions).set({ status: status === "in_transit" ? "in_transit" : "ready_for_pickup" }).where(eq(tradeTransactions.id, job[0].transactionId));
  await appendAuditEvent({ actorUserId: userId, action: "trade_transport_advanced", resourceType: "transport_job", resourceId: String(jobId), dataClassification: "verified", metadata: { transactionId: job[0].transactionId, status } });
  return { jobId, transactionId: job[0].transactionId, status };
}

export async function recordTradeDeliveryForUser(userId: number, input: { transactionId: number; transportJobId: number; deliveredQuantity: number; proofReference: string; notes?: string }) {
  const db = requireDatabase(await getDb());
  const transaction = await assertTradeTransactionParticipant(userId, input.transactionId);
  if (!["in_transit", "ready_for_pickup"].includes(transaction.status)) throw new Error("Delivery requires an in-transit transaction");
  const job = await db.select().from(transportJobs).where(and(eq(transportJobs.id, input.transportJobId), eq(transportJobs.transactionId, input.transactionId))).limit(1);
  if (!job[0]) throw new Error("Transport job does not belong to this transaction");
  await enforceTradePolicy(userId, "trade.delivery.record", "transaction_delivery", `transaction:${input.transactionId}`, {
    actorIsParticipant: true,
    transactionStatus: transaction.status,
    deliveryTransactionMatches: true,
  });
  const inserted = await db.insert(transactionDeliveries).values({ transactionId: input.transactionId, transportJobId: input.transportJobId, deliveredQuantity: input.deliveredQuantity, acceptanceStatus: "pending", proofReference: input.proofReference, notes: input.notes ?? null, deliveredAt: new Date() });
  const deliveryId = Number(inserted[0].insertId);
  await db.update(transportJobs).set({ status: "delivered", deliveryAt: new Date() }).where(eq(transportJobs.id, input.transportJobId));
  await db.update(tradeTransactions).set({ status: "delivered" }).where(eq(tradeTransactions.id, input.transactionId));
  await appendAuditEvent({ actorUserId: userId, action: "trade_delivery_recorded", resourceType: "transaction_delivery", resourceId: String(deliveryId), dataClassification: "verified", metadata: { transactionId: input.transactionId, transportJobId: input.transportJobId, deliveredQuantity: input.deliveredQuantity } });
  return { deliveryId, transactionId: input.transactionId, status: "delivered" as const };
}

export async function acceptTradeDeliveryForUser(userId: number, deliveryId: number, acceptanceStatus: "accepted_full" | "accepted_partial" | "rejected" | "damaged" | "shortage", notes?: string) {
  const db = requireDatabase(await getDb());
  const delivery = await db.select().from(transactionDeliveries).where(eq(transactionDeliveries.id, deliveryId)).limit(1);
  if (!delivery[0]) throw new Error("Transaction delivery was not found");
  const transaction = await assertTradeTransactionParticipant(userId, delivery[0].transactionId);
  await enforceTradePolicy(userId, "trade.delivery.accept", "transaction_delivery", String(deliveryId), {
    actorIsParticipant: true,
    actorIsBuyer: true,
    transactionStatus: transaction.status,
  });
  if (transaction.status !== "delivered") throw new Error("Only delivered transactions can be received");
  if (acceptanceStatus === "accepted_full" || acceptanceStatus === "accepted_partial") {
    await db.update(transactionDeliveries).set({ acceptanceStatus, receivedByUserId: userId, receivedAt: new Date(), notes: notes ?? delivery[0].notes }).where(eq(transactionDeliveries.id, deliveryId));
    await db.update(tradeTransactions).set({ status: "received" }).where(eq(tradeTransactions.id, transaction.id));
  } else {
    await db.update(transactionDeliveries).set({ acceptanceStatus, receivedByUserId: userId, receivedAt: new Date(), notes: notes ?? delivery[0].notes }).where(eq(transactionDeliveries.id, deliveryId));
    await db.update(tradeTransactions).set({ status: "disputed" }).where(eq(tradeTransactions.id, transaction.id));
  }
  await appendAuditEvent({ actorUserId: userId, action: "trade_delivery_received", resourceType: "transaction_delivery", resourceId: String(deliveryId), dataClassification: "verified", metadata: { transactionId: transaction.id, acceptanceStatus } });
  return { deliveryId, transactionId: transaction.id, acceptanceStatus };
}

export async function closeTradeTransactionForUser(userId: number, transactionId: number) {
  const db = requireDatabase(await getDb());
  const transaction = await assertTradeTransactionParticipant(userId, transactionId);
  await enforceTradePolicy(userId, "trade.transaction.close", "trade_transaction", String(transactionId), {
    actorIsParticipant: true,
    actorIsBuyer: true,
    transactionStatus: transaction.status,
    paymentStatus: transaction.paymentStatus,
  });
  if (transaction.status !== "received") throw new Error("Transaction must be received before closure");
  if (!["settled", "external_recorded", "credit_terms"].includes(transaction.paymentStatus)) throw new Error("Transaction payment must be settled, externally recorded, or under approved credit terms");
  await db.update(tradeTransactions).set({ status: "closed", closedAt: new Date() }).where(eq(tradeTransactions.id, transactionId));
  await db.update(tradeDemands).set({ status: "fulfilled" }).where(eq(tradeDemands.id, transaction.demandId));
  // The offering remains published as a reusable product identity; fulfillment is recorded on the demand and transaction.
  await appendAuditEvent({ actorUserId: userId, action: "trade_transaction_closed", resourceType: "trade_transaction", resourceId: String(transactionId), dataClassification: "verified", metadata: { demandId: transaction.demandId, offeringId: transaction.offeringId, paymentStatus: transaction.paymentStatus } });
  return { transactionId, status: "closed" as const };
}

export async function fileTradeDisputeForUser(userId: number, input: { transactionId: number; reason: string }) {
  const db = requireDatabase(await getDb());
  const transaction = await assertTradeTransactionParticipant(userId, input.transactionId);
  await enforceTradePolicy(userId, "trade.dispute.open", "transaction_dispute", `transaction:${input.transactionId}`, {
    actorIsParticipant: true,
    transactionStatus: transaction.status,
  });
  if (["closed", "cancelled"].includes(transaction.status)) throw new Error("Closed or cancelled transactions cannot be disputed");
  const inserted = await db.insert(transactionDisputes).values({ transactionId: input.transactionId, filedByUserId: userId, reason: input.reason, status: "open" });
  const disputeId = Number(inserted[0].insertId);
  await db.update(tradeTransactions).set({ status: "disputed" }).where(eq(tradeTransactions.id, input.transactionId));
  await appendAuditEvent({ actorUserId: userId, action: "trade_dispute_filed", resourceType: "transaction_dispute", resourceId: String(disputeId), dataClassification: "restricted", metadata: { transactionId: input.transactionId } });
  return { disputeId, transactionId: input.transactionId, status: "open" as const };
}

export async function listTradeRfqsForUser(userId: number) {
  const db = requireDatabase(await getDb());
  return db.select().from(tradeRfqs).where(eq(tradeRfqs.createdByUserId, userId)).orderBy(desc(tradeRfqs.updatedAt), desc(tradeRfqs.id));
}

export async function listTradeQuotationsForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const rows = await db
    .select({ quotation: tradeQuotations, rfq: tradeRfqs })
    .from(tradeQuotations)
    .innerJoin(tradeRfqs, eq(tradeQuotations.rfqId, tradeRfqs.id))
    .where(or(eq(tradeQuotations.supplierUserId, userId), eq(tradeRfqs.createdByUserId, userId)))
    .orderBy(desc(tradeQuotations.updatedAt), desc(tradeQuotations.id));
  return rows;
}

export async function listTradeTransactionsForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const memberships = await db.select({ businessId: businessMemberships.businessId }).from(businessMemberships).where(and(eq(businessMemberships.userId, userId), eq(businessMemberships.status, "active")));
  const businessIds = memberships.map(item => item.businessId);
  const person = await getOrCreatePersonForUser(userId);
  const profiles = await db.select({ id: individualActivityProfiles.id }).from(individualActivityProfiles).where(eq(individualActivityProfiles.personId, person.id));
  const profileIds = profiles.map(item => item.id);
  const rows = await db.select().from(tradeTransactions).orderBy(desc(tradeTransactions.updatedAt), desc(tradeTransactions.id));
  return rows.filter(row => businessIds.some(id => [row.buyerBusinessId, row.sellerBusinessId, row.ownerBusinessId, row.custodianBusinessId].includes(id)) || profileIds.some(id => [row.buyerIndividualProfileId, row.sellerIndividualProfileId, row.ownerIndividualProfileId].includes(id)));
}

 type HealthProviderType =
  | "hospital"
  | "clinic"
  | "laboratory"
  | "pharmacy"
  | "diagnostic_center"
  | "emergency_service"
  | "other";

type HealthProviderRole = "provider_admin" | "health_professional" | "emergency_clinician" | "compliance_reviewer";

type HealthConsentStatus = "draft" | "active" | "revoked" | "expired";

type HealthRecordSourceType =
  | "patient_statement"
  | "professional_encounter"
  | "laboratory_result"
  | "radiology_report"
  | "hospital_encounter"
  | "medication_dispense"
  | "medical_document";

type HealthRecordProvenanceStatus = "submitted" | "verified" | "rejected" | "superseded";

function hashHealthScope(scopeCodes: string[]) {
  return createHash("sha256")
    .update(JSON.stringify(Array.from(new Set(scopeCodes)).sort()))
    .digest("hex");
}

function normaliseScopeCodes(scopeCodes: string[]) {
  const values = Array.from(new Set(scopeCodes.map(value => value.trim()).filter(Boolean)));
  if (values.length === 0) throw new Error("At least one health access scope is required");
  return values.sort();
}

function consentCoversScope(scopeJson: string, requestedScopeCodes: string[]) {
  try {
    const parsed = JSON.parse(scopeJson) as { scopeCodes?: unknown };
    const allowed = Array.isArray(parsed.scopeCodes)
      ? parsed.scopeCodes.filter((value): value is string => typeof value === "string")
      : [];
    return requestedScopeCodes.every(scope => allowed.includes(scope));
  } catch {
    return false;
  }
}

async function getHealthProfileForUserOrThrow(userId: number) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  const profile = await db
    .select()
    .from(healthProfiles)
    .where(eq(healthProfiles.personId, person.id))
    .limit(1);
  if (!profile[0]) throw new Error("A health profile has not been created for this verified identity");
  return { person, profile: profile[0] };
}

async function getActiveHealthRole(userId: number, healthProviderId: number) {
  const db = requireDatabase(await getDb());
  const role = await db
    .select({ role: healthProviderRoles.role, providerStatus: healthProviders.verificationStatus })
    .from(healthProviderRoles)
    .innerJoin(healthProviders, eq(healthProviderRoles.healthProviderId, healthProviders.id))
    .where(
      and(
        eq(healthProviderRoles.userId, userId),
        eq(healthProviderRoles.healthProviderId, healthProviderId),
        eq(healthProviderRoles.status, "active"),
      ),
    )
    .limit(1);
  return role[0];
}

export async function listVerifiedHealthProviders() {
  const db = requireDatabase(await getDb());
  return db
    .select({
      id: healthProviders.id,
      legalName: healthProviders.legalName,
      providerType: healthProviders.providerType,
      verificationStatus: healthProviders.verificationStatus,
    })
    .from(healthProviders)
    .where(eq(healthProviders.verificationStatus, "verified"))
    .orderBy(healthProviders.legalName);
}

export async function getHealthProfileSummaryForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  const profile = await db
    .select({ id: healthProfiles.id, status: healthProfiles.status, createdAt: healthProfiles.createdAt, updatedAt: healthProfiles.updatedAt })
    .from(healthProfiles)
    .where(eq(healthProfiles.personId, person.id))
    .limit(1);

  if (!profile[0]) {
    return { kycStatus: person.kycStatus, profile: null, consents: [] as const };
  }

  const consents = await db
    .select({
      id: healthConsents.id,
      providerId: healthProviders.id,
      providerName: healthProviders.legalName,
      providerType: healthProviders.providerType,
      purposeCode: healthConsents.purposeCode,
      status: healthConsents.status,
      issuedAt: healthConsents.issuedAt,
      expiresAt: healthConsents.expiresAt,
      revokedAt: healthConsents.revokedAt,
    })
    .from(healthConsents)
    .innerJoin(healthProviders, eq(healthConsents.beneficiaryProviderId, healthProviders.id))
    .where(eq(healthConsents.healthProfileId, profile[0].id))
    .orderBy(desc(healthConsents.createdAt));

  return { kycStatus: person.kycStatus, profile: profile[0], consents };
}

export async function createHealthProfileForUser(userId: number, healthIdentityReference: string) {
  const db = requireDatabase(await getDb());
  const person = await getOrCreatePersonForUser(userId);
  if (person.kycStatus !== "verified") {
    throw new Error("A verified KYC identity is required before creating a health profile");
  }

  const existing = await db.select({ id: healthProfiles.id }).from(healthProfiles).where(eq(healthProfiles.personId, person.id)).limit(1);
  if (existing[0]) throw new Error("A health profile already exists for this verified identity");

  const inserted = await db.insert(healthProfiles).values({ personId: person.id, healthIdentityReference });
  const profileId = Number(inserted[0].insertId);
  await appendAuditEvent({
    actorUserId: userId,
    action: "health_profile_created",
    resourceType: "health_profile",
    resourceId: String(profileId),
    dataClassification: "confidential_sovereign",
    metadata: { purpose: "health_identity_registration" },
  });
  return getHealthProfileSummaryForUser(userId);
}

export async function createHealthConsentForUser(
  userId: number,
  input: { beneficiaryProviderId: number; purposeCode: string; scopeCodes: string[]; evidenceHash: string; expiresAt: Date },
) {
  const db = requireDatabase(await getDb());
  const { profile } = await getHealthProfileForUserOrThrow(userId);
  if (profile.status !== "active") throw new Error("The health profile is not active");
  if (input.expiresAt <= new Date()) throw new Error("Health consent expiry must be in the future");

  const provider = await db
    .select({ verificationStatus: healthProviders.verificationStatus })
    .from(healthProviders)
    .where(eq(healthProviders.id, input.beneficiaryProviderId))
    .limit(1);
  if (!provider[0] || provider[0].verificationStatus !== "verified") {
    throw new Error("Health consent can only be granted to a verified health provider");
  }

  const scopeCodes = normaliseScopeCodes(input.scopeCodes);
  const inserted = await db.insert(healthConsents).values({
    healthProfileId: profile.id,
    beneficiaryProviderId: input.beneficiaryProviderId,
    purposeCode: input.purposeCode,
    scopeJson: JSON.stringify({ scopeCodes }),
    status: "active",
    evidenceHash: input.evidenceHash,
    issuedAt: new Date(),
    expiresAt: input.expiresAt,
  });
  const consentId = Number(inserted[0].insertId);
  await appendAuditEvent({
    actorUserId: userId,
    action: "health_consent_granted",
    resourceType: "health_consent",
    resourceId: String(consentId),
    dataClassification: "confidential_sovereign",
    metadata: { purposeCode: input.purposeCode, providerId: input.beneficiaryProviderId, scopeHash: hashHealthScope(scopeCodes) },
  });
  return { consentId, status: "active" as const };
}

export async function revokeHealthConsentForUser(userId: number, consentId: number, revocationReason?: string) {
  const db = requireDatabase(await getDb());
  const { profile } = await getHealthProfileForUserOrThrow(userId);
  const consent = await db
    .select({ id: healthConsents.id, status: healthConsents.status })
    .from(healthConsents)
    .where(and(eq(healthConsents.id, consentId), eq(healthConsents.healthProfileId, profile.id)))
    .limit(1);
  if (!consent[0]) throw new Error("Health consent was not found for this identity");
  if (consent[0].status !== "active") throw new Error("Only an active health consent can be revoked");

  await db
    .update(healthConsents)
    .set({ status: "revoked", revokedAt: new Date(), revocationReason: revocationReason || null })
    .where(eq(healthConsents.id, consentId));
  await appendAuditEvent({
    actorUserId: userId,
    action: "health_consent_revoked",
    resourceType: "health_consent",
    resourceId: String(consentId),
    dataClassification: "confidential_sovereign",
  });
  return { consentId, status: "revoked" as const };
}

/**
 * Returns only immutable provenance metadata owned by the health-profile
 * subject. The external reference and integrity hashes remain internal and
 * are deliberately not returned to the browser.
 */
export async function listHealthRecordReferencesForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const { profile } = await getHealthProfileForUserOrThrow(userId);
  return db
    .select({
      id: healthRecordReferences.id,
      sourceType: healthRecordReferences.sourceType,
      sourceProviderName: healthProviders.legalName,
      provenanceStatus: healthRecordReferences.provenanceStatus,
      occurredAt: healthRecordReferences.occurredAt,
      submittedAt: healthRecordReferences.submittedAt,
      amendsRecordId: healthRecordReferences.amendsRecordId,
      amendmentReason: healthRecordReferences.amendmentReason,
    })
    .from(healthRecordReferences)
    .leftJoin(healthProviders, eq(healthRecordReferences.sourceProviderId, healthProviders.id))
    .where(eq(healthRecordReferences.healthProfileId, profile.id))
    .orderBy(desc(healthRecordReferences.submittedAt), desc(healthRecordReferences.id));
}

/** The profile subject can inspect access decisions, but never receives raw scope values or clinical content. */
export async function listHealthAccessLogsForUser(userId: number) {
  const db = requireDatabase(await getDb());
  const { profile } = await getHealthProfileForUserOrThrow(userId);
  return db
    .select({
      id: healthAccessLogs.id,
      providerName: healthProviders.legalName,
      purposeCode: healthAccessLogs.purposeCode,
      decision: healthAccessLogs.decision,
      denialCode: healthAccessLogs.denialCode,
      createdAt: healthAccessLogs.createdAt,
    })
    .from(healthAccessLogs)
    .leftJoin(healthProviders, eq(healthAccessLogs.providerId, healthProviders.id))
    .where(eq(healthAccessLogs.healthProfileId, profile.id))
    .orderBy(desc(healthAccessLogs.createdAt), desc(healthAccessLogs.id));
}

export async function submitHealthRecordReferenceForUser(
  userId: number,
  input: {
    sourceType: HealthRecordSourceType;
    externalReferenceHash: string;
    integrityHash: string;
    occurredAt: Date;
    sourceProviderId?: number | null;
    amendsRecordId?: number | null;
    amendmentReason?: string | null;
  },
) {
  const db = requireDatabase(await getDb());
  const { profile } = await getHealthProfileForUserOrThrow(userId);
  if (profile.status !== "active") throw new Error("The health profile is not active");
  if (input.occurredAt > new Date()) throw new Error("A health event reference cannot be dated in the future");

  const needsVerifiedProvider = input.sourceType !== "patient_statement";
  const sourceProviderId = input.sourceProviderId ?? null;
  if (needsVerifiedProvider) {
    if (!sourceProviderId) throw new Error("A verified source provider is required for a professional health event reference");
    const role = await getActiveHealthRole(userId, sourceProviderId);
    if (!role || role.providerStatus !== "verified" || !["provider_admin", "health_professional"].includes(role.role)) {
      throw new Error("An active professional role at a verified health provider is required");
    }
  } else if (sourceProviderId) {
    throw new Error("A patient statement must not name a health provider as its source");
  }

  if (input.amendsRecordId) {
    const original = await db
      .select({ id: healthRecordReferences.id, healthProfileId: healthRecordReferences.healthProfileId })
      .from(healthRecordReferences)
      .where(eq(healthRecordReferences.id, input.amendsRecordId))
      .limit(1);
    if (!original[0] || original[0].healthProfileId !== profile.id) {
      throw new Error("Only a record reference owned by the same health profile can be amended");
    }
    await db
      .update(healthRecordReferences)
      .set({ provenanceStatus: "superseded" })
      .where(eq(healthRecordReferences.id, input.amendsRecordId));
  }

  const inserted = await db.insert(healthRecordReferences).values({
    healthProfileId: profile.id,
    sourceProviderId,
    submittedByUserId: userId,
    sourceType: input.sourceType,
    externalReferenceHash: input.externalReferenceHash,
    integrityHash: input.integrityHash,
    occurredAt: input.occurredAt,
    amendsRecordId: input.amendsRecordId ?? null,
    amendmentReason: input.amendmentReason?.trim() || null,
  });
  const recordReferenceId = Number(inserted[0].insertId);
  await appendAuditEvent({
    actorUserId: userId,
    action: "health_record_reference_submitted",
    resourceType: "health_record_reference",
    resourceId: String(recordReferenceId),
    dataClassification: "highly_sensitive_health",
    metadata: { sourceType: input.sourceType, sourceProviderId, amendsRecordId: input.amendsRecordId ?? null },
  });
  return { recordReferenceId, provenanceStatus: "submitted" as const };
}

export async function reviewHealthRecordReference(
  adminUserId: number,
  recordReferenceId: number,
  provenanceStatus: Extract<HealthRecordProvenanceStatus, "verified" | "rejected">,
) {
  const db = requireDatabase(await getDb());
  const current = await db
    .select({ provenanceStatus: healthRecordReferences.provenanceStatus })
    .from(healthRecordReferences)
    .where(eq(healthRecordReferences.id, recordReferenceId))
    .limit(1);
  if (!current[0] || current[0].provenanceStatus !== "submitted") {
    throw new Error("Only a submitted health record reference can be reviewed");
  }
  await db
    .update(healthRecordReferences)
    .set({ provenanceStatus })
    .where(eq(healthRecordReferences.id, recordReferenceId));
  await appendAuditEvent({
    actorUserId: adminUserId,
    action: "health_record_reference_reviewed",
    resourceType: "health_record_reference",
    resourceId: String(recordReferenceId),
    dataClassification: "highly_sensitive_health",
    metadata: { provenanceStatus },
  });
  return { recordReferenceId, provenanceStatus };
}

export async function requestHealthAccess(
  userId: number,
  input: { healthProfileId: number; healthProviderId: number; purposeCode: string; scopeCodes: string[] },
) {
  const db = requireDatabase(await getDb());
  const scopeCodes = normaliseScopeCodes(input.scopeCodes);
  const scopeHash = hashHealthScope(scopeCodes);
  const role = await getActiveHealthRole(userId, input.healthProviderId);
  const profile = await db
    .select({ id: healthProfiles.id, status: healthProfiles.status })
    .from(healthProfiles)
    .where(eq(healthProfiles.id, input.healthProfileId))
    .limit(1);

  let decision: "allowed" | "denied" = "denied";
  let denialCode: string | null = null;
  let consentId: number | null = null;
  if (!profile[0] || profile[0].status !== "active") {
    denialCode = "profile_unavailable";
  } else if (!role || role.providerStatus !== "verified") {
    denialCode = "provider_role_not_eligible";
  } else {
    const consents = await db
      .select({ id: healthConsents.id, scopeJson: healthConsents.scopeJson, expiresAt: healthConsents.expiresAt })
      .from(healthConsents)
      .where(
        and(
          eq(healthConsents.healthProfileId, input.healthProfileId),
          eq(healthConsents.beneficiaryProviderId, input.healthProviderId),
          eq(healthConsents.purposeCode, input.purposeCode),
          eq(healthConsents.status, "active"),
        ),
      );
    const matchingConsent = consents.find(consent => consent.expiresAt > new Date() && consentCoversScope(consent.scopeJson, scopeCodes));
    if (matchingConsent) {
      decision = "allowed";
      consentId = matchingConsent.id;
    } else {
      denialCode = "consent_missing_or_out_of_scope";
    }
  }

  await db.insert(healthAccessLogs).values({
    healthProfileId: input.healthProfileId,
    providerId: input.healthProviderId,
    actorUserId: userId,
    consentId,
    purposeCode: input.purposeCode,
    requestedScopeHash: scopeHash,
    decision,
    denialCode,
  });
  await appendAuditEvent({
    actorUserId: userId,
    action: decision === "allowed" ? "health_access_allowed" : "health_access_denied",
    resourceType: "health_profile",
    resourceId: String(input.healthProfileId),
    dataClassification: "confidential_sovereign",
    metadata: { purposeCode: input.purposeCode, scopeHash, providerId: input.healthProviderId, denialCode },
  });
  return { decision, reasonCode: denialCode };
}

export async function createHealthProvider(
  adminUserId: number,
  input: { legalName: string; providerType: HealthProviderType; licenseReference?: string },
) {
  const db = requireDatabase(await getDb());
  const inserted = await db.insert(healthProviders).values({
    legalName: input.legalName,
    providerType: input.providerType,
    licenseReference: input.licenseReference || null,
  });
  const providerId = Number(inserted[0].insertId);
  await appendAuditEvent({
    actorUserId: adminUserId,
    action: "health_provider_created",
    resourceType: "health_provider",
    resourceId: String(providerId),
    dataClassification: "restricted",
  });
  return { providerId, verificationStatus: "unverified" as const };
}

export async function updateHealthProviderVerification(
  adminUserId: number,
  providerId: number,
  verificationStatus: "verified" | "suspended" | "expired" | "rejected",
) {
  const db = requireDatabase(await getDb());
  await db.update(healthProviders).set({ verificationStatus }).where(eq(healthProviders.id, providerId));
  await appendAuditEvent({
    actorUserId: adminUserId,
    action: "health_provider_verification_reviewed",
    resourceType: "health_provider",
    resourceId: String(providerId),
    dataClassification: "restricted",
    metadata: { verificationStatus },
  });
  return { providerId, verificationStatus };
}

export async function assignHealthProviderRole(
  adminUserId: number,
  input: { healthProviderId: number; userId: number; role: HealthProviderRole },
) {
  const db = requireDatabase(await getDb());
  await db
    .insert(healthProviderRoles)
    .values({ healthProviderId: input.healthProviderId, userId: input.userId, role: input.role })
    .onDuplicateKeyUpdate({ set: { status: "active" } });
  await appendAuditEvent({
    actorUserId: adminUserId,
    action: "health_provider_role_assigned",
    resourceType: "health_provider_role",
    resourceId: `${input.healthProviderId}:${input.userId}:${input.role}`,
    dataClassification: "restricted",
  });
  return { assigned: true as const };
}

export async function requestEmergencyHealthAccess(
  userId: number,
  input: { healthProfileId: number; healthProviderId: number; reasonCode: string },
) {
  const db = requireDatabase(await getDb());
  const role = await getActiveHealthRole(userId, input.healthProviderId);
  if (!role || role.role !== "emergency_clinician" || role.providerStatus !== "verified") {
    throw new Error("An active emergency clinician role at a verified health provider is required");
  }
  const inserted = await db.insert(healthEmergencyAccessRequests).values({
    healthProfileId: input.healthProfileId,
    providerId: input.healthProviderId,
    requesterUserId: userId,
    reasonCode: input.reasonCode,
  });
  const requestId = Number(inserted[0].insertId);
  await appendAuditEvent({
    actorUserId: userId,
    action: "health_emergency_access_requested",
    resourceType: "health_emergency_access_request",
    resourceId: String(requestId),
    dataClassification: "confidential_sovereign",
    metadata: { providerId: input.healthProviderId, reasonCode: input.reasonCode },
  });
  return { requestId, status: "requested" as const };
}

export async function reviewEmergencyHealthAccess(
  adminUserId: number,
  requestId: number,
  status: "granted" | "rejected" | "reviewed",
  expiresAt?: Date | null,
  reviewNote?: string,
) {
  const db = requireDatabase(await getDb());
  const current = await db
    .select({ status: healthEmergencyAccessRequests.status })
    .from(healthEmergencyAccessRequests)
    .where(eq(healthEmergencyAccessRequests.id, requestId))
    .limit(1);
  if (!current[0] || current[0].status !== "requested") throw new Error("Only a requested emergency access record can be reviewed");
  if (status === "granted" && (!expiresAt || expiresAt <= new Date())) {
    throw new Error("Emergency access grant requires a future expiry time");
  }
  const now = new Date();
  await db
    .update(healthEmergencyAccessRequests)
    .set({ status, grantedAt: status === "granted" ? now : null, expiresAt: status === "granted" ? expiresAt! : null, reviewedByUserId: adminUserId, reviewedAt: now, reviewNote: reviewNote || null })
    .where(eq(healthEmergencyAccessRequests.id, requestId));
  await appendAuditEvent({
    actorUserId: adminUserId,
    action: "health_emergency_access_reviewed",
    resourceType: "health_emergency_access_request",
    resourceId: String(requestId),
    dataClassification: "confidential_sovereign",
    metadata: { status },
  });
  return { requestId, status };
}
