import { describe, expect, it } from "vitest";
import { assertPolicy, evaluatePolicy } from "./policyEngine";

describe("central policy engine", () => {
  it("allows a verified demand controller to open an eligible RFQ", () => {
    const decision = evaluatePolicy({
      action: "trade.rfq.open",
      actorUserId: 10,
      actorControlsDemand: true,
      kycVerified: true,
      kybVerified: true,
      membershipActive: true,
      matchStatus: "eligible",
      offeringVerificationStatus: "verified",
      offeringLifecycleStatus: "published",
    });

    expect(decision.effect).toBe("allow");
    expect(decision.policyVersion).toBe("policy-engine.v1");
    expect(decision.ruleIds).toContain("RFQ_ELIGIBLE_MATCH");
    expect(() => assertPolicy(decision)).not.toThrow();
  });

  it("denies RFQ creation when the offering is not verified and published", () => {
    const decision = evaluatePolicy({
      action: "trade.rfq.open",
      actorUserId: 10,
      actorControlsDemand: true,
      kycVerified: true,
      kybVerified: true,
      membershipActive: true,
      matchStatus: "eligible",
      offeringVerificationStatus: "pending",
      offeringLifecycleStatus: "published",
    });

    expect(decision.effect).toBe("deny");
    expect(decision.reasons[0]?.code).toBe("ACTIVE_OFFERING_REQUIRED");
    expect(() => assertPolicy(decision)).toThrow("ACTIVE_OFFERING_REQUIRED");
  });

  it("denies acceptance when the actor does not control the demand", () => {
    const decision = evaluatePolicy({
      action: "trade.quotation.accept",
      actorUserId: 22,
      actorControlsDemand: false,
      kycVerified: true,
      kybVerified: true,
      membershipActive: true,
      matchStatus: "eligible",
      rfqStatus: "quoted",
      quotationStatus: "submitted",
      offeringVerificationStatus: "verified",
      offeringLifecycleStatus: "published",
    });

    expect(decision.effect).toBe("deny");
    expect(decision.ruleIds).toEqual(["ACCEPT_DEMAND_CONTROLLER"]);
  });

  it("rejects invalid transport state transitions", () => {
    const decision = evaluatePolicy({
      action: "trade.transport.advance",
      actorUserId: 33,
      actorIsParticipant: true,
      transportStatus: "assigned",
      requestedTransition: "in_transit",
    });

    expect(decision.effect).toBe("deny");
    expect(decision.reasons[0]?.code).toBe("TRANSPORT_TRANSITION_NOT_ALLOWED");
  });

  it("requires payment confirmation before closing a received transaction", () => {
    const decision = evaluatePolicy({
      action: "trade.transaction.close",
      actorUserId: 44,
      actorIsBuyer: true,
      transactionStatus: "received",
      paymentStatus: "unrecorded",
    });

    expect(decision.effect).toBe("deny");
    expect(decision.reasons[0]?.code).toBe("PAYMENT_CONFIRMATION_REQUIRED");
  });

  it("does not enforce manual_review as an allow decision", () => {
    const decision = { ...evaluatePolicy({
      action: "trade.dispute.open",
      actorUserId: 55,
      actorIsParticipant: true,
      transactionStatus: "delivered",
    }), effect: "manual_review" as const };

    expect(() => assertPolicy(decision)).toThrow("MANUAL_REVIEW");
  });

  it("allows a participant to dispute an open transaction", () => {
    const decision = evaluatePolicy({
      action: "trade.dispute.open",
      actorUserId: 55,
      actorIsParticipant: true,
      transactionStatus: "delivered",
    });

    expect(decision.effect).toBe("allow");
    expect(decision.ruleIds).toContain("DISPUTE_PARTICIPANT");
  });
});
