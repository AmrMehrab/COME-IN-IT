import {
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** OAuth account used for authentication; it is not itself a commercial entity. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "owner"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * PERSON is the identity layer. It stores only lifecycle state; identity
 * evidence and documents intentionally remain out of this initial database.
 */
export const persons = mysqlTable(
  "persons",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kycStatus: mysqlEnum("kycStatus", [
      "unverified",
      "pending",
      "verified",
      "suspended",
      "expired",
      "rejected",
    ])
      .default("unverified")
      .notNull(),
    faceVerificationStatus: mysqlEnum("faceVerificationStatus", [
      "unverified",
      "pending",
      "verified",
      "manual_review",
      "suspended",
      "expired",
      "rejected",
    ])
      .default("unverified")
      .notNull(),
    livenessStatus: mysqlEnum("livenessStatus", [
      "unverified",
      "pending",
      "passed",
      "manual_review",
      "failed",
      "suspended",
      "expired",
    ])
      .default("unverified")
      .notNull(),
    biometricConsentStatus: mysqlEnum("biometricConsentStatus", [
      "not_granted",
      "granted",
      "revoked",
    ])
      .default("not_granted")
      .notNull(),
    biometricProvider: varchar("biometricProvider", { length: 120 }),
    faceVerificationReference: varchar("faceVerificationReference", { length: 180 }),
    livenessVerificationReference: varchar("livenessVerificationReference", { length: 180 }),
    biometricVerifiedAt: timestamp("biometricVerifiedAt"),
    dataClassification: mysqlEnum("dataClassification", [
      "public",
      "verified",
      "restricted",
      "confidential_sovereign",
    ])
      .default("restricted")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("persons_user_unique").on(table.userId)],
);

/** A commercial entity is separate from its owner/representative PERSON. */
export const businessEntities = mysqlTable(
  "business_entities",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerUserId: int("ownerUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ownerPersonId: int("ownerPersonId")
      .notNull()
      .references(() => persons.id, { onDelete: "restrict" }),
    legalName: varchar("legalName", { length: 255 }).notNull(),
    tradeName: varchar("tradeName", { length: 255 }),
    registrationNumber: varchar("registrationNumber", { length: 120 }),
    entityType: mysqlEnum("entityType", [
      "factory",
      "importer",
      "exporter",
      "store",
      "service_provider",
      "government_entity",
      "other",
    ]).notNull(),
    verificationStatus: mysqlEnum("verificationStatus", [
      "unverified",
      "pending",
      "verified",
      "suspended",
      "expired",
      "rejected",
    ])
      .default("unverified")
      .notNull(),
    dataClassification: mysqlEnum("dataClassification", [
      "public",
      "verified",
      "restricted",
      "confidential_sovereign",
    ])
      .default("restricted")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("business_entities_owner_idx").on(table.ownerUserId),
    index("business_entities_owner_person_idx").on(table.ownerPersonId),
    uniqueIndex("business_entities_registration_unique").on(table.registrationNumber),
  ],
);

/** One business can have multiple authorised representatives. */
export const businessMemberships = mysqlTable(
  "business_memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    businessId: int("businessId")
      .notNull()
      .references(() => businessEntities.id, { onDelete: "cascade" }),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    personId: int("personId")
      .notNull()
      .references(() => persons.id, { onDelete: "restrict" }),
    membershipRole: mysqlEnum("membershipRole", [
      "owner",
      "authorized_representative",
      "operations_manager",
      "viewer",
    ]).notNull(),
    status: mysqlEnum("status", ["active", "suspended", "inactive"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("business_memberships_business_idx").on(table.businessId),
    index("business_memberships_user_idx").on(table.userId),
    index("business_memberships_person_idx").on(table.personId),
    uniqueIndex("business_memberships_business_user_unique").on(table.businessId, table.userId),
  ],
);

/**
 * KYC submissions are tied to PERSON, never directly to an OAuth account or a
 * commercial entity. Document bytes are intentionally excluded; only opaque
 * provider/document references and controlled metadata are persisted here.
 */
export const kycVerifications = mysqlTable(
  "kyc_verifications",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: int("personId")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ["pending", "verified", "suspended", "expired", "rejected"])
      .default("pending")
      .notNull(),
    providerReference: varchar("providerReference", { length: 180 }),
    identityReference: varchar("identityReference", { length: 180 }),
    countryCode: varchar("countryCode", { length: 2 }),
    documentMetadataJson: text("documentMetadataJson"),
    reviewReason: text("reviewReason"),
    reviewedByUserId: int("reviewedByUserId").references(() => users.id, { onDelete: "set null" }),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("kyc_verifications_person_idx").on(table.personId),
    index("kyc_verifications_status_idx").on(table.status),
  ],
);

/**
 * Consent ledger for biometric processing. Raw face, liveness, and fingerprint
 * data are never stored here; only consent evidence and opaque provider refs.
 */
export const biometricConsents = mysqlTable(
  "biometric_consents",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: int("personId")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    consentType: mysqlEnum("consentType", ["face_verification", "liveness_detection"]).notNull(),
    status: mysqlEnum("status", ["granted", "revoked"]).default("granted").notNull(),
    purpose: varchar("purpose", { length: 180 }).notNull(),
    policyVersion: varchar("policyVersion", { length: 80 }).notNull(),
    consentTextHash: varchar("consentTextHash", { length: 128 }).notNull(),
    providerReference: varchar("providerReference", { length: 180 }),
    grantedAt: timestamp("grantedAt").defaultNow().notNull(),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("biometric_consents_person_idx").on(table.personId),
    index("biometric_consents_type_status_idx").on(table.consentType, table.status),
  ],
);

/**
 * KYB submissions are tied to BUSINESS_ENTITY and can only be submitted by an
 * active, authorised business member. Stored references are metadata, not raw
 * company documents or government-gateway responses.
 */
export const kybVerifications = mysqlTable(
  "kyb_verifications",
  {
    id: int("id").autoincrement().primaryKey(),
    businessId: int("businessId")
      .notNull()
      .references(() => businessEntities.id, { onDelete: "cascade" }),
    submittedByUserId: int("submittedByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: mysqlEnum("status", ["pending", "verified", "suspended", "expired", "rejected"])
      .default("pending")
      .notNull(),
    providerReference: varchar("providerReference", { length: 180 }),
    registrationReference: varchar("registrationReference", { length: 180 }),
    documentMetadataJson: text("documentMetadataJson"),
    reviewReason: text("reviewReason"),
    reviewedByUserId: int("reviewedByUserId").references(() => users.id, { onDelete: "set null" }),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("kyb_verifications_business_idx").on(table.businessId),
    index("kyb_verifications_submitter_idx").on(table.submittedByUserId),
    index("kyb_verifications_status_idx").on(table.status),
  ],
);

/** Persisted, user-owned bookmarks for the current specification experience. */
export const specificationBookmarks = mysqlTable(
  "specification_bookmarks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sectionId: int("sectionId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("specification_bookmarks_user_idx").on(table.userId),
    uniqueIndex("specification_bookmarks_user_section_unique").on(table.userId, table.sectionId),
  ],
);

/** Append-only application events; infrastructure WORM retention is separate. */
export const auditEvents = mysqlTable(
  "audit_events",
  {
    id: int("id").autoincrement().primaryKey(),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 120 }).notNull(),
    resourceType: varchar("resourceType", { length: 120 }).notNull(),
    resourceId: varchar("resourceId", { length: 120 }).notNull(),
    dataClassification: mysqlEnum("dataClassification", [
      "public",
      "verified",
      "restricted",
      "confidential_sovereign",
      "highly_sensitive_health",
    ])
      .default("verified")
      .notNull(),
    metadataJson: text("metadataJson"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("audit_events_actor_idx").on(table.actorUserId),
    index("audit_events_resource_idx").on(table.resourceType, table.resourceId),
  ],
);

/**
 * The health domain is intentionally isolated from commerce. A health provider
 * is not a BUSINESS_ENTITY and has its own verification lifecycle; any future
 * legal/operational mapping must be consent- and purpose-bound at the service
 * layer rather than a direct relational link.
 */
export const healthProviders = mysqlTable(
  "health_providers",
  {
    id: int("id").autoincrement().primaryKey(),
    legalName: varchar("legalName", { length: 255 }).notNull(),
    providerType: mysqlEnum("providerType", [
      "hospital",
      "clinic",
      "laboratory",
      "pharmacy",
      "diagnostic_center",
      "emergency_service",
      "other",
    ]).notNull(),
    verificationStatus: mysqlEnum("verificationStatus", [
      "unverified",
      "pending",
      "verified",
      "suspended",
      "expired",
      "rejected",
    ])
      .default("unverified")
      .notNull(),
    licenseReference: varchar("licenseReference", { length: 180 }),
    dataClassification: mysqlEnum("dataClassification", ["restricted", "confidential_sovereign"])
      .default("confidential_sovereign")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("health_providers_status_idx").on(table.verificationStatus),
    uniqueIndex("health_providers_license_unique").on(table.licenseReference),
  ],
);

/** A verified identity may have one health profile; raw health records never live here. */
export const healthProfiles = mysqlTable(
  "health_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: int("personId")
      .notNull()
      .references(() => persons.id, { onDelete: "restrict" }),
    status: mysqlEnum("status", ["active", "suspended", "closed"])
      .default("active")
      .notNull(),
    healthIdentityReference: varchar("healthIdentityReference", { length: 180 }).notNull(),
    dataClassification: mysqlEnum("dataClassification", ["confidential_sovereign"])
      .default("confidential_sovereign")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("health_profiles_person_unique").on(table.personId),
    uniqueIndex("health_profiles_reference_unique").on(table.healthIdentityReference),
  ],
);

/**
 * Immutable provenance for an externally-held health event. This table never
 * stores clinical values, record content, document bytes, access tokens, or
 * image data; the two hashes are opaque integrity/reference values only.
 */
export const healthRecordReferences = mysqlTable(
  "health_record_references",
  {
    id: int("id").autoincrement().primaryKey(),
    healthProfileId: int("healthProfileId")
      .notNull()
      .references(() => healthProfiles.id, { onDelete: "restrict" }),
    sourceProviderId: int("sourceProviderId").references(() => healthProviders.id, { onDelete: "set null" }),
    submittedByUserId: int("submittedByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    sourceType: mysqlEnum("sourceType", [
      "patient_statement",
      "professional_encounter",
      "laboratory_result",
      "radiology_report",
      "hospital_encounter",
      "medication_dispense",
      "medical_document",
    ]).notNull(),
    externalReferenceHash: varchar("externalReferenceHash", { length: 180 }).notNull(),
    integrityHash: varchar("integrityHash", { length: 180 }).notNull(),
    provenanceStatus: mysqlEnum("provenanceStatus", ["submitted", "verified", "rejected", "superseded"])
      .default("submitted")
      .notNull(),
    occurredAt: timestamp("occurredAt").notNull(),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
    lockedAt: timestamp("lockedAt").defaultNow().notNull(),
    amendsRecordId: int("amendsRecordId"),
    amendmentReason: varchar("amendmentReason", { length: 240 }),
    dataClassification: mysqlEnum("dataClassification", ["confidential_sovereign", "highly_sensitive_health"])
      .default("highly_sensitive_health")
      .notNull(),
  },
  table => [
    foreignKey({
      columns: [table.amendsRecordId],
      foreignColumns: [table.id],
      name: "health_record_refs_amends_fk",
    }).onDelete("restrict"),
    index("health_record_references_profile_idx").on(table.healthProfileId),
    index("health_record_references_provider_idx").on(table.sourceProviderId),
    index("health_record_references_status_idx").on(table.provenanceStatus),
    index("health_record_references_amends_idx").on(table.amendsRecordId),
  ],
);

/** Health-specific professional roles; commercial memberships never grant this role. */
export const healthProviderRoles = mysqlTable(
  "health_provider_roles",
  {
    id: int("id").autoincrement().primaryKey(),
    healthProviderId: int("healthProviderId")
      .notNull()
      .references(() => healthProviders.id, { onDelete: "cascade" }),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["provider_admin", "health_professional", "emergency_clinician", "compliance_reviewer"])
      .notNull(),
    status: mysqlEnum("status", ["active", "suspended", "inactive"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("health_provider_roles_provider_idx").on(table.healthProviderId),
    index("health_provider_roles_user_idx").on(table.userId),
    uniqueIndex("health_provider_roles_unique").on(table.healthProviderId, table.userId, table.role),
  ],
);

/** Scope- and time-limited grants. Evidence is a hash/reference, not consent text. */
export const healthConsents = mysqlTable(
  "health_consents",
  {
    id: int("id").autoincrement().primaryKey(),
    healthProfileId: int("healthProfileId")
      .notNull()
      .references(() => healthProfiles.id, { onDelete: "cascade" }),
    beneficiaryProviderId: int("beneficiaryProviderId")
      .notNull()
      .references(() => healthProviders.id, { onDelete: "restrict" }),
    purposeCode: varchar("purposeCode", { length: 80 }).notNull(),
    scopeJson: text("scopeJson").notNull(),
    status: mysqlEnum("status", ["draft", "active", "revoked", "expired"])
      .default("draft")
      .notNull(),
    evidenceHash: varchar("evidenceHash", { length: 180 }).notNull(),
    issuedAt: timestamp("issuedAt"),
    expiresAt: timestamp("expiresAt").notNull(),
    revokedAt: timestamp("revokedAt"),
    revocationReason: text("revocationReason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("health_consents_profile_idx").on(table.healthProfileId),
    index("health_consents_provider_idx").on(table.beneficiaryProviderId),
    index("health_consents_status_expires_idx").on(table.status, table.expiresAt),
  ],
);

/** A restricted audit of every decision. No clinical content, tokens or raw references are stored. */
export const healthAccessLogs = mysqlTable(
  "health_access_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    healthProfileId: int("healthProfileId")
      .notNull()
      .references(() => healthProfiles.id, { onDelete: "restrict" }),
    providerId: int("providerId").references(() => healthProviders.id, { onDelete: "set null" }),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    consentId: int("consentId").references(() => healthConsents.id, { onDelete: "set null" }),
    purposeCode: varchar("purposeCode", { length: 80 }).notNull(),
    requestedScopeHash: varchar("requestedScopeHash", { length: 180 }).notNull(),
    decision: mysqlEnum("decision", ["allowed", "denied", "emergency_allowed"]).notNull(),
    denialCode: varchar("denialCode", { length: 100 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("health_access_logs_profile_idx").on(table.healthProfileId),
    index("health_access_logs_actor_idx").on(table.actorUserId),
    index("health_access_logs_decision_idx").on(table.decision),
  ],
);

/** Break-glass is a short-lived, reviewable request; it never creates standing access. */
export const healthEmergencyAccessRequests = mysqlTable(
  "health_emergency_access_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    healthProfileId: int("healthProfileId").notNull(),
    providerId: int("providerId").notNull(),
    requesterUserId: int("requesterUserId")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reasonCode: varchar("reasonCode", { length: 100 }).notNull(),
    status: mysqlEnum("status", ["requested", "granted", "expired", "reviewed", "rejected"])
      .default("requested")
      .notNull(),
    grantedAt: timestamp("grantedAt"),
    expiresAt: timestamp("expiresAt"),
    reviewedByUserId: int("reviewedByUserId").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewedAt"),
    reviewNote: text("reviewNote"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.healthProfileId],
      foreignColumns: [healthProfiles.id],
      name: "health_emergency_profile_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.providerId],
      foreignColumns: [healthProviders.id],
      name: "health_emergency_provider_fk",
    }).onDelete("restrict"),
    index("health_emergency_profile_idx").on(table.healthProfileId),
    index("health_emergency_requester_idx").on(table.requesterUserId),
    index("health_emergency_status_idx").on(table.status),
  ],
);

/**
 * Commercial activity profiles accumulate a person's verified commercial
 * capacities without turning the person into a business entity. They contain
 * status and opaque references only; no identity documents are stored here.
 */
export const individualActivityProfiles = mysqlTable(
  "individual_activity_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: int("personId")
      .notNull()
      .references(() => persons.id, { onDelete: "restrict" }),
    activityType: mysqlEnum("activityType", [
      "consumer",
      "individual_producer",
      "used_asset_seller",
      "service_provider",
    ]).notNull(),
    verificationStatus: mysqlEnum("verificationStatus", [
      "unverified",
      "pending",
      "verified",
      "suspended",
      "expired",
      "rejected",
    ])
      .default("unverified")
      .notNull(),
    capabilitiesJson: text("capabilitiesJson"),
    evidenceReference: varchar("evidenceReference", { length: 180 }),
    dataClassification: mysqlEnum("dataClassification", ["public", "verified", "restricted"])
      .default("verified")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("individual_activity_person_type_unique").on(table.personId, table.activityType),
    index("individual_activity_status_idx").on(table.verificationStatus),
  ],
);

/**
 * Operational activity verification is deliberately distinct from legal KYB.
 * A KYB-verified company still needs an eligible activity to trade in that role.
 */
export const businessActivityVerifications = mysqlTable(
  "business_activity_verifications",
  {
    id: int("id").autoincrement().primaryKey(),
    businessId: int("businessId").notNull(),
    activityType: mysqlEnum("activityType", ["factory", "importer", "exporter", "store", "service_provider"])
      .notNull(),
    verificationStatus: mysqlEnum("verificationStatus", [
      "unverified",
      "pending",
      "verified",
      "suspended",
      "expired",
      "rejected",
    ])
      .default("unverified")
      .notNull(),
    evidenceReference: varchar("evidenceReference", { length: 180 }),
    reviewedByUserId: int("reviewedByUserId").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewedAt"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.businessId],
      foreignColumns: [businessEntities.id],
      name: "business_activity_business_fk",
    }).onDelete("restrict"),
    uniqueIndex("business_activity_business_type_unique").on(table.businessId, table.activityType),
    index("business_activity_status_idx").on(table.verificationStatus),
  ],
);

/**
 * Trade offering is the operational identity of a product, service, or used
 * asset available for matching. It is intentionally separate from Healthcare
 * and is not a substitute for a full product catalogue or document store.
 */
export const tradeOfferings = mysqlTable(
  "trade_offerings",
  {
    id: int("id").autoincrement().primaryKey(),
    businessId: int("businessId")
      .references(() => businessEntities.id, { onDelete: "restrict" }),
    individualProfileId: int("individualProfileId"),
    supplierKind: mysqlEnum("supplierKind", ["business", "individual"]).default("business").notNull(),
    createdByUserId: int("createdByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    offeringType: mysqlEnum("offeringType", ["product", "service", "used_asset"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    categoryCode: varchar("categoryCode", { length: 100 }),
    descriptionJson: text("descriptionJson"),
    dataClassification: mysqlEnum("dataClassification", [
      "public",
      "verified",
      "restricted",
      "confidential_sovereign",
    ])
      .default("verified")
      .notNull(),
    verificationStatus: mysqlEnum("verificationStatus", [
      "draft",
      "pending",
      "verified",
      "rejected",
      "suspended",
      "expired",
    ])
      .default("draft")
      .notNull(),
    lifecycleStatus: mysqlEnum("lifecycleStatus", ["draft", "published", "archived"])
      .default("draft")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.individualProfileId],
      foreignColumns: [individualActivityProfiles.id],
      name: "trade_offerings_individual_fk",
    }).onDelete("restrict"),
    index("trade_offerings_business_idx").on(table.businessId),
    index("trade_offerings_individual_profile_idx").on(table.individualProfileId),
    index("trade_offerings_creator_idx").on(table.createdByUserId),
    index("trade_offerings_verification_idx").on(table.verificationStatus),
  ],
);

/** Persistent purchase orders created from the commerce portal catalog. */
export const commercePurchaseOrders = mysqlTable(
  "commerce_purchase_orders",
  {
    id: int("id").autoincrement().primaryKey(),
    buyerUserId: int("buyerUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    partnerKey: varchar("partnerKey", { length: 120 }).notNull(),
    partnerName: varchar("partnerName", { length: 255 }).notNull(),
    productKey: varchar("productKey", { length: 120 }).notNull(),
    productName: varchar("productName", { length: 255 }).notNull(),
    category: varchar("category", { length: 120 }).notNull(),
    quantity: int("quantity").notNull(),
    quantityUnit: varchar("quantityUnit", { length: 32 }).notNull(),
    moq: int("moq").notNull(),
    unitPriceMinor: int("unitPriceMinor").notNull(),
    currencyCode: varchar("currencyCode", { length: 3 }).default("EGP").notNull(),
    message: text("message").notNull(),
    status: mysqlEnum("status", ["draft", "submitted", "acknowledged", "cancelled"]).default("submitted").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("commerce_orders_buyer_idx").on(table.buyerUserId), index("commerce_orders_partner_idx").on(table.partnerKey), index("commerce_orders_status_idx").on(table.status)],
);

/** A trust-gated B2B demand that may be evaluated against verified offerings. */
export const tradeDemands = mysqlTable(
  "trade_demands",
  {
    id: int("id").autoincrement().primaryKey(),
    requesterBusinessId: int("requesterBusinessId")
      .references(() => businessEntities.id, { onDelete: "restrict" }),
    requesterIndividualProfileId: int("requesterIndividualProfileId"),
    requesterKind: mysqlEnum("requesterKind", ["business", "individual"]).default("business").notNull(),
    createdByUserId: int("createdByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    demandType: mysqlEnum("demandType", ["product", "service", "used_asset"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    geographyJson: text("geographyJson"),
    requirementsJson: text("requirementsJson").notNull(),
    status: mysqlEnum("status", ["draft", "published", "matching", "fulfilled", "cancelled", "expired"])
      .default("draft")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.requesterIndividualProfileId],
      foreignColumns: [individualActivityProfiles.id],
      name: "trade_demands_individual_fk",
    }).onDelete("restrict"),
    index("trade_demands_requester_idx").on(table.requesterBusinessId),
    index("trade_demands_individual_profile_idx").on(table.requesterIndividualProfileId),
    index("trade_demands_creator_idx").on(table.createdByUserId),
    index("trade_demands_status_idx").on(table.status),
  ],
);

/**
 * A deterministic eligibility result, not an automated contracting decision.
 * Healthcare identifiers are intentionally absent from this trade-only record.
 */
export const tradeMatches = mysqlTable(
  "trade_matches",
  {
    id: int("id").autoincrement().primaryKey(),
    demandId: int("demandId")
      .notNull()
      .references(() => tradeDemands.id, { onDelete: "cascade" }),
    offeringId: int("offeringId")
      .notNull()
      .references(() => tradeOfferings.id, { onDelete: "cascade" }),
    evaluatedByUserId: int("evaluatedByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    score: int("score").notNull(),
    relationshipMode: mysqlEnum("relationshipMode", ["b2b", "b2c", "c2b", "c2c"])
      .default("b2b")
      .notNull(),
    status: mysqlEnum("status", ["candidate", "eligible", "manual_review", "ineligible", "declined", "expired"])
      .default("candidate")
      .notNull(),
    decisionReason: varchar("decisionReason", { length: 500 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("trade_matches_demand_offering_unique").on(table.demandId, table.offeringId),
    index("trade_matches_demand_idx").on(table.demandId),
    index("trade_matches_offering_idx").on(table.offeringId),
    index("trade_matches_status_idx").on(table.status),
  ],
);

/** RFQ opens a controlled negotiation after a trust-gated match. */
export const tradeRfqs = mysqlTable(
  "trade_rfqs",
  {
    id: int("id").autoincrement().primaryKey(),
    matchId: int("matchId").notNull().references(() => tradeMatches.id, { onDelete: "restrict" }),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    requestedQuantity: int("requestedQuantity").notNull(),
    quantityUnit: varchar("quantityUnit", { length: 32 }).notNull(),
    deliveryTermsJson: text("deliveryTermsJson").notNull(),
    paymentTermsJson: text("paymentTermsJson").notNull(),
    status: mysqlEnum("status", ["draft", "open", "quoted", "accepted", "expired", "cancelled"]).default("open").notNull(),
    validUntil: timestamp("validUntil"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("trade_rfqs_match_idx").on(table.matchId), index("trade_rfqs_creator_idx").on(table.createdByUserId), index("trade_rfqs_status_idx").on(table.status)],
);

/** Supplier response to an RFQ; acceptance creates the transaction atomically. */
export const tradeQuotations = mysqlTable(
  "trade_quotations",
  {
    id: int("id").autoincrement().primaryKey(),
    rfqId: int("rfqId").notNull().references(() => tradeRfqs.id, { onDelete: "cascade" }),
    supplierUserId: int("supplierUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    quantity: int("quantity").notNull(),
    unitPriceMinor: int("unitPriceMinor").notNull(),
    currencyCode: varchar("currencyCode", { length: 3 }).default("EGP").notNull(),
    leadTimeDays: int("leadTimeDays").notNull(),
    termsJson: text("termsJson").notNull(),
    status: mysqlEnum("status", ["submitted", "countered", "accepted", "rejected", "expired"]).default("submitted").notNull(),
    validUntil: timestamp("validUntil"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("trade_quotations_rfq_idx").on(table.rfqId), index("trade_quotations_supplier_idx").on(table.supplierUserId), index("trade_quotations_status_idx").on(table.status)],
);

/** Transaction is the commercial system of record after quotation acceptance. */
export const tradeTransactions = mysqlTable(
  "trade_transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    rfqId: int("rfqId").notNull().references(() => tradeRfqs.id, { onDelete: "restrict" }),
    quotationId: int("quotationId").notNull().references(() => tradeQuotations.id, { onDelete: "restrict" }),
    matchId: int("matchId").notNull().references(() => tradeMatches.id, { onDelete: "restrict" }),
    offeringId: int("offeringId").notNull().references(() => tradeOfferings.id, { onDelete: "restrict" }),
    demandId: int("demandId").notNull().references(() => tradeDemands.id, { onDelete: "restrict" }),
    buyerBusinessId: int("buyerBusinessId").references(() => businessEntities.id, { onDelete: "restrict" }),
    sellerBusinessId: int("sellerBusinessId").references(() => businessEntities.id, { onDelete: "restrict" }),
    buyerIndividualProfileId: int("buyerIndividualProfileId"),
    sellerIndividualProfileId: int("sellerIndividualProfileId"),
    quantity: int("quantity").notNull(),
    quantityUnit: varchar("quantityUnit", { length: 32 }).notNull(),
    unitPriceMinor: int("unitPriceMinor").notNull(),
    totalPriceMinor: int("totalPriceMinor").notNull(),
    currencyCode: varchar("currencyCode", { length: 3 }).default("EGP").notNull(),
    deliveryTermsJson: text("deliveryTermsJson").notNull(),
    paymentTermsJson: text("paymentTermsJson").notNull(),
    status: mysqlEnum("status", ["accepted", "processing", "ready_for_pickup", "in_transit", "delivered", "received", "closed", "cancelled", "disputed"]).default("accepted").notNull(),
    paymentStatus: mysqlEnum("paymentStatus", ["unrecorded", "cash_pending", "bank_transfer_pending", "credit_terms", "external_recorded", "settled"]).default("unrecorded").notNull(),
    ownerBusinessId: int("ownerBusinessId").references(() => businessEntities.id, { onDelete: "set null" }),
    ownerIndividualProfileId: int("ownerIndividualProfileId"),
    custodianBusinessId: int("custodianBusinessId").references(() => businessEntities.id, { onDelete: "set null" }),
    acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
    closedAt: timestamp("closedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.buyerIndividualProfileId],
      foreignColumns: [individualActivityProfiles.id],
      name: "trade_tx_buyer_individual_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.sellerIndividualProfileId],
      foreignColumns: [individualActivityProfiles.id],
      name: "trade_tx_seller_individual_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.ownerIndividualProfileId],
      foreignColumns: [individualActivityProfiles.id],
      name: "trade_tx_owner_individual_fk",
    }).onDelete("set null"),
    index("trade_transactions_rfq_idx").on(table.rfqId),
    index("trade_transactions_status_idx").on(table.status),
    index("trade_transactions_buyer_idx").on(table.buyerBusinessId),
    index("trade_transactions_seller_idx").on(table.sellerBusinessId),
  ],
);

/** A transport provider is a custodian only; it never becomes the owner. */
export const transportJobs = mysqlTable(
  "transport_jobs",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: int("transactionId").notNull().references(() => tradeTransactions.id, { onDelete: "cascade" }),
    providerBusinessId: int("providerBusinessId").notNull().references(() => businessEntities.id, { onDelete: "restrict" }),
    driverReference: varchar("driverReference", { length: 180 }),
    vehicleReference: varchar("vehicleReference", { length: 180 }),
    pickupLocationJson: text("pickupLocationJson").notNull(),
    deliveryLocationJson: text("deliveryLocationJson").notNull(),
    status: mysqlEnum("status", ["assigned", "ready", "picked_up", "in_transit", "delivered", "failed", "cancelled"]).default("assigned").notNull(),
    pickupAt: timestamp("pickupAt"),
    deliveryAt: timestamp("deliveryAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("transport_jobs_transaction_idx").on(table.transactionId), index("transport_jobs_provider_idx").on(table.providerBusinessId), index("transport_jobs_status_idx").on(table.status)],
);

export const transactionDeliveries = mysqlTable(
  "transaction_deliveries",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: int("transactionId").notNull().references(() => tradeTransactions.id, { onDelete: "cascade" }),
    transportJobId: int("transportJobId").notNull().references(() => transportJobs.id, { onDelete: "restrict" }),
    deliveredQuantity: int("deliveredQuantity").notNull(),
    acceptanceStatus: mysqlEnum("acceptanceStatus", ["pending", "accepted_full", "accepted_partial", "rejected", "damaged", "shortage"]).default("pending").notNull(),
    receivedByUserId: int("receivedByUserId").references(() => users.id, { onDelete: "set null" }),
    proofReference: varchar("proofReference", { length: 180 }),
    notes: text("notes"),
    deliveredAt: timestamp("deliveredAt"),
    receivedAt: timestamp("receivedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("transaction_deliveries_transaction_idx").on(table.transactionId), index("transaction_deliveries_transport_idx").on(table.transportJobId)],
);

export const transactionEvidence = mysqlTable(
  "transaction_evidence",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: int("transactionId").notNull().references(() => tradeTransactions.id, { onDelete: "cascade" }),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    evidenceType: mysqlEnum("evidenceType", ["quotation", "agreement", "proof_of_delivery", "receipt", "invoice", "quality_certificate", "other"]).notNull(),
    reference: varchar("reference", { length: 180 }).notNull(),
    metadataJson: text("metadataJson"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("transaction_evidence_transaction_idx").on(table.transactionId)],
);

export const transactionDisputes = mysqlTable(
  "transaction_disputes",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: int("transactionId").notNull().references(() => tradeTransactions.id, { onDelete: "cascade" }),
    filedByUserId: int("filedByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    reason: varchar("reason", { length: 500 }).notNull(),
    status: mysqlEnum("status", ["open", "under_review", "resolved", "rejected"]).default("open").notNull(),
    resolution: text("resolution"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  table => [index("transaction_disputes_transaction_idx").on(table.transactionId), index("transaction_disputes_status_idx").on(table.status)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Person = typeof persons.$inferSelect;
export type BusinessEntity = typeof businessEntities.$inferSelect;
export type BusinessMembership = typeof businessMemberships.$inferSelect;
export type KycVerification = typeof kycVerifications.$inferSelect;
export type KybVerification = typeof kybVerifications.$inferSelect;
export type SpecificationBookmark = typeof specificationBookmarks.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type HealthProvider = typeof healthProviders.$inferSelect;
export type HealthProfile = typeof healthProfiles.$inferSelect;
export type HealthRecordReference = typeof healthRecordReferences.$inferSelect;
export type HealthProviderRole = typeof healthProviderRoles.$inferSelect;
export type HealthConsent = typeof healthConsents.$inferSelect;
export type HealthAccessLog = typeof healthAccessLogs.$inferSelect;
export type HealthEmergencyAccessRequest = typeof healthEmergencyAccessRequests.$inferSelect;
export type IndividualActivityProfile = typeof individualActivityProfiles.$inferSelect;
export type BusinessActivityVerification = typeof businessActivityVerifications.$inferSelect;
export type TradeOffering = typeof tradeOfferings.$inferSelect;
export type TradeDemand = typeof tradeDemands.$inferSelect;
export type TradeMatch = typeof tradeMatches.$inferSelect;
