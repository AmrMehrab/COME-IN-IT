import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const businessEntityType = z.enum([
  "factory",
  "importer",
  "exporter",
  "store",
  "service_provider",
  "government_entity",
  "other",
]);

const verificationReviewStatus = z.enum(["verified", "suspended", "expired", "rejected"]);
const referenceField = z.string().trim().min(2).max(180).optional();
const metadataField = z.string().trim().min(2).max(12_000).optional();
const reviewInput = z.object({
  verificationId: z.number().int().positive(),
  status: verificationReviewStatus,
  reviewReason: z.string().trim().min(2).max(2_000).optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});
const biometricConsentType = z.enum(["face_verification", "liveness_detection"]);
const healthProviderType = z.enum([
  "hospital",
  "clinic",
  "laboratory",
  "pharmacy",
  "diagnostic_center",
  "emergency_service",
  "other",
]);
const healthProviderRole = z.enum(["provider_admin", "health_professional", "emergency_clinician", "compliance_reviewer"]);
const healthScopeCodes = z.array(z.string().trim().min(2).max(80)).min(1).max(12);
const tradeObjectType = z.enum(["product", "service", "used_asset"]);
const tradeClassification = z.enum(["public", "verified", "restricted", "confidential_sovereign"]);
const tradeOfferingReviewStatus = z.enum(["verified", "suspended", "expired", "rejected"]);
const individualActivityType = z.enum(["consumer", "individual_producer", "used_asset_seller", "service_provider"]);
const businessActivityType = z.enum(["factory", "importer", "exporter", "store", "service_provider"]);
const tradePartyKind = z.enum(["business", "individual"]);
const jsonTextField = z
  .string()
  .trim()
  .min(2)
  .max(12_000)
  .refine(value => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, "A valid JSON value is required");

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  bookmarks: router({
    list: protectedProcedure.query(({ ctx }) => db.listSpecificationBookmarks(ctx.user.id)),
    toggle: protectedProcedure
      .input(z.object({ sectionId: z.number().int().positive().max(10_000) }))
      .mutation(({ ctx, input }) => db.toggleSpecificationBookmark(ctx.user.id, input.sectionId)),
  }),

  commerceOrders: router({
    list: protectedProcedure.query(({ ctx }) => db.listCommercePurchaseOrdersForUser(ctx.user.id)),
    catalog: protectedProcedure.query(({ ctx }) => db.listVerifiedCommerceCatalogForUser(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        offeringId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        message: z.string().trim().min(5).max(4_000),
      }))
      .mutation(({ ctx, input }) => db.createCommercePurchaseOrderForUser(ctx.user.id, input)),
  }),

  businesses: router({
    list: protectedProcedure.query(({ ctx }) => db.listBusinessEntitiesForUser(ctx.user.id)),
    create: protectedProcedure
      .input(
        z.object({
          legalName: z.string().trim().min(2).max(255),
          tradeName: z.string().trim().min(2).max(255).optional(),
          registrationNumber: z.string().trim().min(2).max(120).optional(),
          entityType: businessEntityType,
        }),
      )
      .mutation(({ ctx, input }) => db.createBusinessEntityForUser(ctx.user.id, input)),
    update: protectedProcedure
      .input(
        z.object({
          businessId: z.number().int().positive(),
          legalName: z.string().trim().min(2).max(255).optional(),
          tradeName: z.string().trim().min(2).max(255).nullable().optional(),
          entityType: businessEntityType.optional(),
        }),
      )
      .mutation(({ ctx, input }) => {
        const { businessId, ...fields } = input;
        return db.updateBusinessEntityForUser(ctx.user.id, businessId, fields);
      }),
  }),

  verification: router({
    kyc: router({
      me: protectedProcedure.query(({ ctx }) => db.getKycVerificationForUser(ctx.user.id)),
      submit: protectedProcedure
        .input(
          z.object({
            providerReference: referenceField,
            identityReference: referenceField,
            countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).optional(),
            documentMetadataJson: metadataField,
          }),
        )
        .mutation(({ ctx, input }) => db.submitKycVerificationForUser(ctx.user.id, input)),
      review: adminProcedure
        .input(reviewInput)
        .mutation(({ ctx, input }) =>
          db.reviewKycVerification(
            ctx.user.id,
            input.verificationId,
            input.status,
            input.reviewReason,
            input.expiresAt,
          ),
        ),
    }),
    biometric: router({
      me: protectedProcedure.query(({ ctx }) => db.getBiometricVerificationForUser(ctx.user.id)),
      grantConsent: protectedProcedure
        .input(
          z.object({
            consentType: biometricConsentType,
            purpose: z.string().trim().min(8).max(180),
            policyVersion: z.string().trim().min(1).max(80),
            consentTextHash: z.string().trim().min(16).max(128),
            providerReference: referenceField,
          }),
        )
        .mutation(({ ctx, input }) => db.grantBiometricConsentForUser(ctx.user.id, input)),
      revokeConsent: protectedProcedure
        .mutation(({ ctx }) => db.revokeAllBiometricConsentsForUser(ctx.user.id)),
    }),
    kyb: router({
      list: protectedProcedure.query(({ ctx }) => db.listKybVerificationsForUser(ctx.user.id)),
      submit: protectedProcedure
        .input(
          z.object({
            businessId: z.number().int().positive(),
            providerReference: referenceField,
            registrationReference: referenceField,
            documentMetadataJson: metadataField,
          }),
        )
        .mutation(({ ctx, input }) => {
          const { businessId, ...verification } = input;
          return db.submitKybVerificationForUser(ctx.user.id, businessId, verification);
        }),
      review: adminProcedure
        .input(reviewInput)
        .mutation(({ ctx, input }) =>
          db.reviewKybVerification(
            ctx.user.id,
            input.verificationId,
            input.status,
            input.reviewReason,
            input.expiresAt,
          ),
        ),
    }),
  }),

  trade: router({
    offerings: router({
      list: protectedProcedure.query(({ ctx }) => db.listTradeOfferingsForUser(ctx.user.id)),
      create: protectedProcedure
        .input(
          z
            .object({
              businessId: z.number().int().positive().optional(),
              individualProfileId: z.number().int().positive().optional(),
              offeringType: tradeObjectType,
              title: z.string().trim().min(2).max(255),
              categoryCode: z.string().trim().min(2).max(100).optional(),
              descriptionJson: jsonTextField.optional(),
              dataClassification: tradeClassification.optional(),
            })
            .refine(value => Boolean(value.businessId) !== Boolean(value.individualProfileId), {
              message: "Exactly one business or individual activity source is required",
            }),
        )
        .mutation(({ ctx, input }) => db.createTradeOfferingForUser(ctx.user.id, input)),
      review: adminProcedure
        .input(z.object({ offeringId: z.number().int().positive(), status: tradeOfferingReviewStatus }))
        .mutation(({ ctx, input }) => db.reviewTradeOffering(ctx.user.id, input.offeringId, input.status)),
    }),
    demands: router({
      list: protectedProcedure.query(({ ctx }) => db.listTradeDemandsForUser(ctx.user.id)),
      create: protectedProcedure
        .input(
          z
            .object({
              businessId: z.number().int().positive().optional(),
              individualProfileId: z.number().int().positive().optional(),
              demandType: tradeObjectType,
              title: z.string().trim().min(2).max(255),
              geographyJson: jsonTextField.optional(),
              requirementsJson: jsonTextField,
            })
            .refine(value => Boolean(value.businessId) !== Boolean(value.individualProfileId), {
              message: "Exactly one business or individual activity source is required",
            }),
        )
        .mutation(({ ctx, input }) => db.createTradeDemandForUser(ctx.user.id, input)),
    }),
    matches: router({
      list: protectedProcedure.query(({ ctx }) => db.listTradeMatchesForUser(ctx.user.id)),
      evaluate: protectedProcedure
        .input(z.object({ demandId: z.number().int().positive(), offeringId: z.number().int().positive() }))
        .mutation(({ ctx, input }) => db.evaluateTradeMatchForUser(ctx.user.id, input.demandId, input.offeringId)),
    }),
    transactions: router({
      list: protectedProcedure.query(({ ctx }) => db.listTradeTransactionsForUser(ctx.user.id)),
      rfqs: protectedProcedure.query(({ ctx }) => db.listTradeRfqsForUser(ctx.user.id)),
      quotations: protectedProcedure.query(({ ctx }) => db.listTradeQuotationsForUser(ctx.user.id)),
      openRfq: protectedProcedure
        .input(z.object({
          matchId: z.number().int().positive(),
          requestedQuantity: z.number().int().positive(),
          quantityUnit: z.string().trim().min(1).max(32),
          deliveryTermsJson: jsonTextField,
          paymentTermsJson: jsonTextField,
          validUntil: z.coerce.date().optional(),
        }))
        .mutation(({ ctx, input }) => db.createTradeRfqForUser(ctx.user.id, input)),
      submitQuotation: protectedProcedure
        .input(z.object({
          rfqId: z.number().int().positive(),
          quantity: z.number().int().positive(),
          unitPriceMinor: z.number().int().nonnegative(),
          currencyCode: z.string().trim().length(3).optional(),
          leadTimeDays: z.number().int().nonnegative(),
          termsJson: jsonTextField,
          validUntil: z.coerce.date().optional(),
        }))
        .mutation(({ ctx, input }) => db.submitTradeQuotationForUser(ctx.user.id, input)),
      acceptQuotation: protectedProcedure
        .input(z.object({ quotationId: z.number().int().positive() }))
        .mutation(({ ctx, input }) => db.acceptTradeQuotationForUser(ctx.user.id, input.quotationId)),
      updatePayment: protectedProcedure
        .input(z.object({
          transactionId: z.number().int().positive(),
          paymentStatus: z.enum(["cash_pending", "bank_transfer_pending", "credit_terms", "external_recorded", "settled"]),
        }))
        .mutation(({ ctx, input }) => db.updateTradeTransactionPaymentForUser(ctx.user.id, input.transactionId, input.paymentStatus)),
      assignTransport: protectedProcedure
        .input(z.object({
          transactionId: z.number().int().positive(),
          providerBusinessId: z.number().int().positive(),
          pickupLocationJson: jsonTextField,
          deliveryLocationJson: jsonTextField,
          driverReference: referenceField,
          vehicleReference: referenceField,
        }))
        .mutation(({ ctx, input }) => db.createTransportJobForUser(ctx.user.id, input)),
      advanceTransport: protectedProcedure
        .input(z.object({ jobId: z.number().int().positive(), status: z.enum(["ready", "picked_up", "in_transit"]) }))
        .mutation(({ ctx, input }) => db.advanceTradeTransportForUser(ctx.user.id, input.jobId, input.status)),
      recordDelivery: protectedProcedure
        .input(z.object({
          transactionId: z.number().int().positive(),
          transportJobId: z.number().int().positive(),
          deliveredQuantity: z.number().int().positive(),
          proofReference: z.string().trim().min(2).max(180),
          notes: z.string().trim().max(4_000).optional(),
        }))
        .mutation(({ ctx, input }) => db.recordTradeDeliveryForUser(ctx.user.id, input)),
      receiveDelivery: protectedProcedure
        .input(z.object({
          deliveryId: z.number().int().positive(),
          acceptanceStatus: z.enum(["accepted_full", "accepted_partial", "rejected", "damaged", "shortage"]),
          notes: z.string().trim().max(4_000).optional(),
        }))
        .mutation(({ ctx, input }) => db.acceptTradeDeliveryForUser(ctx.user.id, input.deliveryId, input.acceptanceStatus, input.notes)),
      close: protectedProcedure
        .input(z.object({ transactionId: z.number().int().positive() }))
        .mutation(({ ctx, input }) => db.closeTradeTransactionForUser(ctx.user.id, input.transactionId)),
      dispute: protectedProcedure
        .input(z.object({ transactionId: z.number().int().positive(), reason: z.string().trim().min(5).max(500) }))
        .mutation(({ ctx, input }) => db.fileTradeDisputeForUser(ctx.user.id, input)),
    }),
  }),

  commercial: router({
    individualProfiles: router({
      list: protectedProcedure.query(({ ctx }) => db.listIndividualActivityProfilesForUser(ctx.user.id)),
      submit: protectedProcedure
        .input(
          z.object({
            activityType: individualActivityType,
            capabilitiesJson: jsonTextField.optional(),
            evidenceReference: referenceField,
          }),
        )
        .mutation(({ ctx, input }) => db.submitIndividualActivityProfileForUser(ctx.user.id, input)),
      review: adminProcedure
        .input(z.object({ profileId: z.number().int().positive(), status: tradeOfferingReviewStatus }))
        .mutation(({ ctx, input }) => db.reviewIndividualActivityProfile(ctx.user.id, input.profileId, input.status)),
    }),
    businessActivities: router({
      list: protectedProcedure.query(({ ctx }) => db.listBusinessActivityVerificationsForUser(ctx.user.id)),
      submit: protectedProcedure
        .input(
          z.object({
            businessId: z.number().int().positive(),
            activityType: businessActivityType,
            evidenceReference: referenceField,
          }),
        )
        .mutation(({ ctx, input }) => {
          const { businessId, ...activity } = input;
          return db.submitBusinessActivityVerificationForUser(ctx.user.id, businessId, activity);
        }),
      review: adminProcedure
        .input(
          z.object({
            verificationId: z.number().int().positive(),
            status: tradeOfferingReviewStatus,
            expiresAt: z.coerce.date().nullable().optional(),
          }),
        )
        .mutation(({ ctx, input }) =>
          db.reviewBusinessActivityVerification(ctx.user.id, input.verificationId, input.status, input.expiresAt),
        ),
    }),
    relationships: router({
      evaluate: protectedProcedure
        .input(
          z.object({
            supplierKind: tradePartyKind,
            supplierBusinessId: z.number().int().positive().optional(),
            supplierIndividualProfileId: z.number().int().positive().optional(),
            requesterKind: tradePartyKind,
            requesterBusinessId: z.number().int().positive().optional(),
            requesterIndividualProfileId: z.number().int().positive().optional(),
          }),
        )
        .mutation(({ ctx, input }) => db.checkCommercialRelationshipForUser(ctx.user.id, input)),
    }),
  }),

  health: router({
    profile: router({
      me: protectedProcedure.query(({ ctx }) => db.getHealthProfileSummaryForUser(ctx.user.id)),
      create: protectedProcedure
        .input(z.object({ healthIdentityReference: z.string().trim().min(8).max(180) }))
        .mutation(({ ctx, input }) => db.createHealthProfileForUser(ctx.user.id, input.healthIdentityReference)),
    }),
    providers: router({
      listVerified: protectedProcedure.query(() => db.listVerifiedHealthProviders()),
      create: adminProcedure
        .input(
          z.object({
            legalName: z.string().trim().min(2).max(255),
            providerType: healthProviderType,
            licenseReference: referenceField,
          }),
        )
        .mutation(({ ctx, input }) => db.createHealthProvider(ctx.user.id, input)),
      review: adminProcedure
        .input(z.object({ providerId: z.number().int().positive(), status: verificationReviewStatus }))
        .mutation(({ ctx, input }) => db.updateHealthProviderVerification(ctx.user.id, input.providerId, input.status)),
      assignRole: adminProcedure
        .input(
          z.object({
            healthProviderId: z.number().int().positive(),
            userId: z.number().int().positive(),
            role: healthProviderRole,
          }),
        )
        .mutation(({ ctx, input }) => db.assignHealthProviderRole(ctx.user.id, input)),
    }),
    consents: router({
      grant: protectedProcedure
        .input(
          z.object({
            beneficiaryProviderId: z.number().int().positive(),
            purposeCode: z.string().trim().min(2).max(100),
            scopeCodes: healthScopeCodes,
            evidenceHash: z.string().trim().regex(/^[a-fA-F0-9]{64}$/),
            expiresAt: z.coerce.date(),
          }),
        )
        .mutation(({ ctx, input }) => db.createHealthConsentForUser(ctx.user.id, input)),
      revoke: protectedProcedure
        .input(
          z.object({
            consentId: z.number().int().positive(),
            revocationReason: z.string().trim().min(2).max(2_000).optional(),
          }),
        )
        .mutation(({ ctx, input }) => db.revokeHealthConsentForUser(ctx.user.id, input.consentId, input.revocationReason)),
    }),
    records: router({
      listMine: protectedProcedure.query(({ ctx }) => db.listHealthRecordReferencesForUser(ctx.user.id)),
      submitReference: protectedProcedure
        .input(
          z.object({
            sourceType: z.enum([
              "patient_statement",
              "professional_encounter",
              "laboratory_result",
              "radiology_report",
              "hospital_encounter",
              "medication_dispense",
              "medical_document",
            ]),
            externalReferenceHash: z.string().trim().regex(/^[a-fA-F0-9]{64}$/),
            integrityHash: z.string().trim().regex(/^[a-fA-F0-9]{64}$/),
            occurredAt: z.coerce.date(),
            sourceProviderId: z.number().int().positive().nullable().optional(),
            amendsRecordId: z.number().int().positive().nullable().optional(),
            amendmentReason: z.string().trim().min(2).max(240).optional(),
          }),
        )
        .mutation(({ ctx, input }) => db.submitHealthRecordReferenceForUser(ctx.user.id, input)),
      reviewReference: adminProcedure
        .input(
          z.object({
            recordReferenceId: z.number().int().positive(),
            provenanceStatus: z.enum(["verified", "rejected"]),
          }),
        )
        .mutation(({ ctx, input }) => db.reviewHealthRecordReference(ctx.user.id, input.recordReferenceId, input.provenanceStatus)),
    }),
    access: router({
      listMine: protectedProcedure.query(({ ctx }) => db.listHealthAccessLogsForUser(ctx.user.id)),
      request: protectedProcedure
        .input(
          z.object({
            healthProfileId: z.number().int().positive(),
            healthProviderId: z.number().int().positive(),
            purposeCode: z.string().trim().min(2).max(100),
            scopeCodes: healthScopeCodes,
          }),
        )
        .mutation(({ ctx, input }) => db.requestHealthAccess(ctx.user.id, input)),
      emergencyRequest: protectedProcedure
        .input(
          z.object({
            healthProfileId: z.number().int().positive(),
            healthProviderId: z.number().int().positive(),
            reasonCode: z.string().trim().min(2).max(100),
          }),
        )
        .mutation(({ ctx, input }) => db.requestEmergencyHealthAccess(ctx.user.id, input)),
      emergencyReview: adminProcedure
        .input(
          z.object({
            requestId: z.number().int().positive(),
            status: z.enum(["granted", "rejected", "reviewed"]),
            expiresAt: z.coerce.date().nullable().optional(),
            reviewNote: z.string().trim().min(2).max(2_000).optional(),
          }),
        )
        .mutation(({ ctx, input }) => db.reviewEmergencyHealthAccess(ctx.user.id, input.requestId, input.status, input.expiresAt, input.reviewNote)),
    }),
  }),
});

export type AppRouter = typeof appRouter;
