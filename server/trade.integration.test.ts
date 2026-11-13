import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  createBusinessEntityForUser,
  acceptTradeDeliveryForUser,
  acceptTradeQuotationForUser,
  advanceTradeTransportForUser,
  closeTradeTransactionForUser,
  createTradeDemandForUser,
  createTradeRfqForUser,
  createTransportJobForUser,
  createTradeOfferingForUser,
  evaluateTradeMatchForUser,
  fileTradeDisputeForUser,
  getDb,
  recordTradeDeliveryForUser,
  reviewKybVerification,
  reviewKycVerification,
  reviewBusinessActivityVerification,
  reviewTradeOffering,
  submitTradeQuotationForUser,
  updateTradeTransactionPaymentForUser,
  submitBusinessActivityVerificationForUser,
  submitKybVerificationForUser,
  submitKycVerificationForUser,
} from "./db";
import {
  auditEvents,
  businessActivityVerifications,
  businessEntities,
  kybVerifications,
  tradeDemands,
  tradeMatches,
  tradeOfferings,
  tradeQuotations,
  tradeRfqs,
  tradeTransactions,
  transportJobs,
  transactionDeliveries,
  transactionDisputes,
  users,
} from "../drizzle/schema";

describe("trade operations foundation", () => {
  it("enforces KYC → KYB → membership → offering verification before an eligible B2B match", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const database = db!;
    const adminInsert = await database.insert(users).values({
      openId: `trade-admin-${crypto.randomUUID()}`,
      name: "Trade integration reviewer",
      loginMethod: "integration-test",
      role: "admin",
    });
    const supplierInsert = await database.insert(users).values({
      openId: `trade-supplier-${crypto.randomUUID()}`,
      name: "Trade integration supplier",
      loginMethod: "integration-test",
    });
    const buyerInsert = await database.insert(users).values({
      openId: `trade-buyer-${crypto.randomUUID()}`,
      name: "Trade integration buyer",
      loginMethod: "integration-test",
    });
    const adminUserId = Number(adminInsert[0].insertId);
    const supplierUserId = Number(supplierInsert[0].insertId);
    const buyerUserId = Number(buyerInsert[0].insertId);
    let supplierBusinessId: number | undefined;
    let buyerBusinessId: number | undefined;
    let offeringId: number | undefined;
    let pendingDemandId: number | undefined;
    let eligibleDemandId: number | undefined;

    try {
      await expect(
        createTradeOfferingForUser(supplierUserId, {
          businessId: 999_999_999,
          offeringType: "product",
          title: "Unverified trade offering",
        }),
      ).rejects.toThrow("A verified KYC identity is required before trade access");

      const supplierKyc = await submitKycVerificationForUser(supplierUserId, { countryCode: "EG" });
      const buyerKyc = await submitKycVerificationForUser(buyerUserId, { countryCode: "EG" });
      await reviewKycVerification(adminUserId, supplierKyc.latest!.id, "verified", "trade integration KYC approval");
      await reviewKycVerification(adminUserId, buyerKyc.latest!.id, "verified", "trade integration KYC approval");

      const supplierBusiness = await createBusinessEntityForUser(supplierUserId, {
        legalName: `Trade Supplier ${crypto.randomUUID().slice(0, 8)}`,
        entityType: "factory",
      });
      const buyerBusiness = await createBusinessEntityForUser(buyerUserId, {
        legalName: `Trade Buyer ${crypto.randomUUID().slice(0, 8)}`,
        entityType: "importer",
      });
      supplierBusinessId = supplierBusiness.id;
      buyerBusinessId = buyerBusiness.id;

      const supplierKyb = await submitKybVerificationForUser(supplierUserId, supplierBusinessId, { registrationReference: "trade-supplier-kyb" });
      const buyerKyb = await submitKybVerificationForUser(buyerUserId, buyerBusinessId, { registrationReference: "trade-buyer-kyb" });
      await reviewKybVerification(adminUserId, supplierKyb!.id, "verified", "trade integration supplier KYB approval");
      await reviewKybVerification(adminUserId, buyerKyb!.id, "verified", "trade integration buyer KYB approval");

      const supplierActivity = await submitBusinessActivityVerificationForUser(supplierUserId, supplierBusinessId, {
        activityType: "factory",
      });
      const buyerActivity = await submitBusinessActivityVerificationForUser(buyerUserId, buyerBusinessId, {
        activityType: "importer",
      });
      await reviewBusinessActivityVerification(adminUserId, supplierActivity.id, "verified");
      await reviewBusinessActivityVerification(adminUserId, buyerActivity.id, "verified");

      const offering = await createTradeOfferingForUser(supplierUserId, {
        businessId: supplierBusinessId,
        offeringType: "product",
        title: "Industrial component",
        categoryCode: "IND-COMP",
        descriptionJson: JSON.stringify({ origin: "Egypt" }),
      });
      offeringId = offering.id;
      expect(offering.verificationStatus).toBe("pending");

      const pendingDemand = await createTradeDemandForUser(buyerUserId, {
        businessId: buyerBusinessId,
        demandType: "product",
        title: "Industrial component requirement",
        requirementsJson: JSON.stringify({ requiredOrigin: "Egypt" }),
      });
      pendingDemandId = pendingDemand.id;
      const ineligibleMatch = await evaluateTradeMatchForUser(buyerUserId, pendingDemandId, offeringId);
      expect(ineligibleMatch.status).toBe("ineligible");
      expect(ineligibleMatch.decisionReason).toContain("offering_not_independently_verified_and_published");

      await reviewTradeOffering(adminUserId, offeringId, "verified");
      const eligibleDemand = await createTradeDemandForUser(buyerUserId, {
        businessId: buyerBusinessId,
        demandType: "product",
        title: "Verified industrial component requirement",
        requirementsJson: JSON.stringify({ requiredOrigin: "Egypt" }),
      });
      eligibleDemandId = eligibleDemand.id;
      const eligibleMatch = await evaluateTradeMatchForUser(buyerUserId, eligibleDemandId, offeringId);
      expect(eligibleMatch.status).toBe("eligible");
      expect(eligibleMatch.score).toBe(100);
      expect(eligibleMatch.decisionReason).toBe("relationship_trust_gates_satisfied");

      const auditRows = await database
        .select({ action: auditEvents.action, resourceType: auditEvents.resourceType })
        .from(auditEvents)
        .where(eq(auditEvents.resourceId, String(eligibleMatch.id)));
      expect(auditRows).toEqual(expect.arrayContaining([expect.objectContaining({ action: "trade_match_evaluated", resourceType: "trade_match" })]));
    } finally {
      if (pendingDemandId) await database.delete(tradeMatches).where(eq(tradeMatches.demandId, pendingDemandId));
      if (eligibleDemandId) await database.delete(tradeMatches).where(eq(tradeMatches.demandId, eligibleDemandId));
      if (pendingDemandId) await database.delete(tradeDemands).where(eq(tradeDemands.id, pendingDemandId));
      if (eligibleDemandId) await database.delete(tradeDemands).where(eq(tradeDemands.id, eligibleDemandId));
      if (offeringId) await database.delete(tradeOfferings).where(eq(tradeOfferings.id, offeringId));
      for (const userId of [adminUserId, supplierUserId, buyerUserId]) {
        await database.delete(auditEvents).where(eq(auditEvents.actorUserId, userId));
        await database.delete(kybVerifications).where(eq(kybVerifications.submittedByUserId, userId));
      }
      if (supplierBusinessId) await database.delete(businessActivityVerifications).where(eq(businessActivityVerifications.businessId, supplierBusinessId));
      if (buyerBusinessId) await database.delete(businessActivityVerifications).where(eq(businessActivityVerifications.businessId, buyerBusinessId));
      if (supplierBusinessId) await database.delete(businessEntities).where(eq(businessEntities.id, supplierBusinessId));
      if (buyerBusinessId) await database.delete(businessEntities).where(eq(businessEntities.id, buyerBusinessId));
      for (const userId of [adminUserId, supplierUserId, buyerUserId]) {
        await database.delete(users).where(eq(users.id, userId));
      }
    }
  }, 60_000);

  it("keeps Healthcare foreign keys out of activity profiles and operational trade tables", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const rawResult = await db!.execute(sql`
      SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, REFERENCED_TABLE_NAME AS referencedTableName
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND (
          (TABLE_NAME IN ('individual_activity_profiles', 'business_activity_verifications', 'trade_offerings', 'trade_demands', 'trade_matches') AND REFERENCED_TABLE_NAME LIKE 'health_%')
          OR (TABLE_NAME LIKE 'health_%' AND REFERENCED_TABLE_NAME IN ('individual_activity_profiles', 'business_activity_verifications', 'trade_offerings', 'trade_demands', 'trade_matches'))
        )
    `);
    const rows = Array.isArray(rawResult) && Array.isArray(rawResult[0]) ? rawResult[0] : rawResult;
    expect(rows).toEqual([]);
  });
});


  it("completes an end-to-end transaction from RFQ through payment, delivery, receipt and closure", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const database = db!;
    const insertedUsers = await Promise.all([
      database.insert(users).values({ openId: `trade-e2e-admin-${crypto.randomUUID()}`, name: "Trade E2E reviewer", loginMethod: "integration-test", role: "admin" }),
      database.insert(users).values({ openId: `trade-e2e-supplier-${crypto.randomUUID()}`, name: "Trade E2E supplier", loginMethod: "integration-test" }),
      database.insert(users).values({ openId: `trade-e2e-buyer-${crypto.randomUUID()}`, name: "Trade E2E buyer", loginMethod: "integration-test" }),
    ]);
    const adminUserId = Number(insertedUsers[0][0].insertId);
    const supplierUserId = Number(insertedUsers[1][0].insertId);
    const buyerUserId = Number(insertedUsers[2][0].insertId);
    let supplierBusinessId: number | undefined;
    let buyerBusinessId: number | undefined;
    let offeringId: number | undefined;
    let demandId: number | undefined;
    let matchId: number | undefined;
    let rfqId: number | undefined;
    let quotationId: number | undefined;
    let transactionId: number | undefined;
    let transportJobId: number | undefined;
    let deliveryId: number | undefined;

    try {
      for (const userId of [supplierUserId, buyerUserId]) {
        const kyc = await submitKycVerificationForUser(userId, { countryCode: "EG" });
        await reviewKycVerification(adminUserId, kyc.latest!.id, "verified", "trade E2E KYC approval");
      }

      const supplierBusiness = await createBusinessEntityForUser(supplierUserId, {
        legalName: `E2E supplier ${crypto.randomUUID().slice(0, 8)}`,
        entityType: "factory",
      });
      const buyerBusiness = await createBusinessEntityForUser(buyerUserId, {
        legalName: `E2E buyer ${crypto.randomUUID().slice(0, 8)}`,
        entityType: "importer",
      });
      supplierBusinessId = supplierBusiness.id;
      buyerBusinessId = buyerBusiness.id;

      const supplierKyb = await submitKybVerificationForUser(supplierUserId, supplierBusinessId, { registrationReference: "trade-e2e-supplier-kyb" });
      const buyerKyb = await submitKybVerificationForUser(buyerUserId, buyerBusinessId, { registrationReference: "trade-e2e-buyer-kyb" });
      await reviewKybVerification(adminUserId, supplierKyb!.id, "verified", "trade E2E supplier KYB approval");
      await reviewKybVerification(adminUserId, buyerKyb!.id, "verified", "trade E2E buyer KYB approval");

      const supplierFactoryActivity = await submitBusinessActivityVerificationForUser(supplierUserId, supplierBusinessId, { activityType: "factory" });
      const supplierServiceActivity = await submitBusinessActivityVerificationForUser(supplierUserId, supplierBusinessId, { activityType: "service_provider" });
      const buyerActivity = await submitBusinessActivityVerificationForUser(buyerUserId, buyerBusinessId, { activityType: "importer" });
      await reviewBusinessActivityVerification(adminUserId, supplierFactoryActivity.id, "verified");
      await reviewBusinessActivityVerification(adminUserId, supplierServiceActivity.id, "verified");
      await reviewBusinessActivityVerification(adminUserId, buyerActivity.id, "verified");

      const offering = await createTradeOfferingForUser(supplierUserId, {
        businessId: supplierBusinessId,
        offeringType: "product",
        title: "E2E verified component",
        categoryCode: "E2E-COMPONENT",
        descriptionJson: JSON.stringify({ origin: "Egypt", traceability: "batch-001" }),
      });
      offeringId = offering.id;
      await reviewTradeOffering(adminUserId, offeringId, "verified");

      const demand = await createTradeDemandForUser(buyerUserId, {
        businessId: buyerBusinessId,
        demandType: "product",
        title: "E2E component demand",
        requirementsJson: JSON.stringify({ requiredOrigin: "Egypt", quantity: 10 }),
      });
      demandId = demand.id;
      const match = await evaluateTradeMatchForUser(buyerUserId, demandId, offeringId);
      matchId = match.id;
      expect(match.status).toBe("eligible");

      const rfq = await createTradeRfqForUser(buyerUserId, {
        matchId,
        requestedQuantity: 10,
        quantityUnit: "unit",
        deliveryTermsJson: JSON.stringify({ incoterm: "DAP", destination: "Cairo" }),
        paymentTermsJson: JSON.stringify({ method: "bank_transfer" }),
      });
      rfqId = rfq.id;
      expect(rfq.status).toBe("open");

      const quotation = await submitTradeQuotationForUser(supplierUserId, {
        rfqId,
        quantity: 10,
        unitPriceMinor: 125_000,
        leadTimeDays: 7,
        termsJson: JSON.stringify({ warrantyDays: 30 }),
      });
      quotationId = quotation.id;
      expect(quotation.status).toBe("submitted");

      const transaction = await acceptTradeQuotationForUser(buyerUserId, quotationId);
      transactionId = transaction.id;
      expect(transaction.status).toBe("accepted");
      expect(transaction.totalPriceMinor).toBe(1_250_000);

      await expect(closeTradeTransactionForUser(buyerUserId, transactionId)).rejects.toThrow("Transaction must be received before closure");
      await updateTradeTransactionPaymentForUser(buyerUserId, transactionId, "settled");

      const transport = await createTransportJobForUser(supplierUserId, {
        transactionId,
        providerBusinessId: supplierBusinessId,
        pickupLocationJson: JSON.stringify({ city: "Cairo", site: "Factory A" }),
        deliveryLocationJson: JSON.stringify({ city: "Cairo", site: "Buyer B" }),
        driverReference: "driver-e2e-001",
        vehicleReference: "vehicle-e2e-001",
      });
      transportJobId = transport.id;
      expect(transport.status).toBe("assigned");

      await advanceTradeTransportForUser(supplierUserId, transportJobId, "ready");
      await advanceTradeTransportForUser(supplierUserId, transportJobId, "picked_up");
      const inTransit = await advanceTradeTransportForUser(supplierUserId, transportJobId, "in_transit");
      expect(inTransit.status).toBe("in_transit");

      const delivery = await recordTradeDeliveryForUser(buyerUserId, {
        transactionId,
        transportJobId,
        deliveredQuantity: 10,
        proofReference: "proof://e2e-delivery-001",
        notes: "Delivery evidence recorded for acceptance test",
      });
      deliveryId = delivery.deliveryId;
      expect(delivery.status).toBe("delivered");

      const received = await acceptTradeDeliveryForUser(buyerUserId, deliveryId, "accepted_full", "Quantity and condition accepted");
      expect(received.acceptanceStatus).toBe("accepted_full");
      const closed = await closeTradeTransactionForUser(buyerUserId, transactionId);
      expect(closed.status).toBe("closed");

      const persisted = await database.select().from(tradeTransactions).where(eq(tradeTransactions.id, transactionId));
      expect(persisted[0]).toMatchObject({ status: "closed", paymentStatus: "settled", quantity: 10, totalPriceMinor: 1_250_000 });
      const lifecycleAudit = await database
        .select({ action: auditEvents.action, resourceType: auditEvents.resourceType })
        .from(auditEvents)
        .where(eq(auditEvents.resourceId, String(transactionId)));
      expect(lifecycleAudit).toEqual(expect.arrayContaining([
        expect.objectContaining({ action: "trade_transaction_accepted", resourceType: "trade_transaction" }),
        expect.objectContaining({ action: "trade_payment_status_updated", resourceType: "trade_transaction" }),
        expect.objectContaining({ action: "trade_transaction_closed", resourceType: "trade_transaction" }),
      ]));
    } finally {
      if (deliveryId) await database.delete(transactionDeliveries).where(eq(transactionDeliveries.id, deliveryId));
      if (transportJobId) await database.delete(transportJobs).where(eq(transportJobs.id, transportJobId));
      if (transactionId) await database.delete(transactionDisputes).where(eq(transactionDisputes.transactionId, transactionId));
      if (transactionId) await database.delete(tradeTransactions).where(eq(tradeTransactions.id, transactionId));
      if (quotationId) await database.delete(tradeQuotations).where(eq(tradeQuotations.id, quotationId));
      if (rfqId) await database.delete(tradeRfqs).where(eq(tradeRfqs.id, rfqId));
      if (matchId) await database.delete(tradeMatches).where(eq(tradeMatches.id, matchId));
      if (demandId) await database.delete(tradeDemands).where(eq(tradeDemands.id, demandId));
      if (offeringId) await database.delete(tradeOfferings).where(eq(tradeOfferings.id, offeringId));
      for (const userId of [adminUserId, supplierUserId, buyerUserId]) {
        await database.delete(auditEvents).where(eq(auditEvents.actorUserId, userId));
        await database.delete(kybVerifications).where(eq(kybVerifications.submittedByUserId, userId));
      }
      if (supplierBusinessId) await database.delete(businessActivityVerifications).where(eq(businessActivityVerifications.businessId, supplierBusinessId));
      if (buyerBusinessId) await database.delete(businessActivityVerifications).where(eq(businessActivityVerifications.businessId, buyerBusinessId));
      if (supplierBusinessId) await database.delete(businessEntities).where(eq(businessEntities.id, supplierBusinessId));
      if (buyerBusinessId) await database.delete(businessEntities).where(eq(businessEntities.id, buyerBusinessId));
      for (const userId of [adminUserId, supplierUserId, buyerUserId]) await database.delete(users).where(eq(users.id, userId));
    }
  }, 180_000);
