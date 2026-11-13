export type PolicyEffect = "allow" | "deny" | "manual_review";

export type PolicyReason = {
  code: string;
  message: string;
  severity: "info" | "warning" | "blocking";
};

export type PolicyDecision = {
  effect: PolicyEffect;
  policyVersion: string;
  ruleIds: string[];
  reasons: PolicyReason[];
  evaluatedAt: string;
};

export type PolicyAction =
  | "trade.rfq.open"
  | "trade.quotation.submit"
  | "trade.quotation.accept"
  | "trade.payment.update"
  | "trade.transport.assign"
  | "trade.transport.advance"
  | "trade.delivery.record"
  | "trade.delivery.accept"
  | "trade.transaction.close"
  | "trade.dispute.open";

export type PolicyContext = {
  action: PolicyAction;
  actorUserId: number;
  actorIsParticipant?: boolean;
  actorControlsDemand?: boolean;
  actorControlsOffering?: boolean;
  actorIsOwner?: boolean;
  actorIsBuyer?: boolean;
  actorIsSeller?: boolean;
  actorIsCustodian?: boolean;
  kycVerified?: boolean;
  kybVerified?: boolean;
  membershipActive?: boolean;
  operationalActivityVerified?: boolean;
  matchStatus?: string;
  offeringVerificationStatus?: string;
  offeringLifecycleStatus?: string;
  rfqStatus?: string;
  quotationStatus?: string;
  transactionStatus?: string;
  paymentStatus?: string;
  transportStatus?: string;
  deliveryStatus?: string;
  deliveryTransactionMatches?: boolean;
  transportProviderVerified?: boolean;
  requestedTransition?: string;
  relationshipMode?: "b2b" | "b2c" | "c2b" | "c2c" | "b2g";
};

const POLICY_VERSION = "policy-engine.v1";

function decision(effect: PolicyEffect, ruleIds: string[], reasons: PolicyReason[]): PolicyDecision {
  return {
    effect,
    policyVersion: POLICY_VERSION,
    ruleIds,
    reasons,
    evaluatedAt: new Date().toISOString(),
  };
}

function deny(ruleId: string, code: string, message: string): PolicyDecision {
  return decision("deny", [ruleId], [{ code, message, severity: "blocking" }]);
}

function allow(ruleIds: string[], message: string): PolicyDecision {
  return decision("allow", ruleIds, [{ code: "POLICY_ALLOW", message, severity: "info" }]);
}

function requireTrust(context: PolicyContext): PolicyDecision | null {
  if (context.kycVerified === false) return deny("TRUST_KYC_REQUIRED", "KYC_REQUIRED", "Verified KYC is required before commercial action");
  if (context.kybVerified === false) return deny("TRUST_KYB_REQUIRED", "KYB_REQUIRED", "Verified KYB is required for the applicable business identity");
  if (context.membershipActive === false) return deny("TRUST_MEMBERSHIP_REQUIRED", "ACTIVE_MEMBERSHIP_REQUIRED", "An active membership or authorized activity profile is required");
  return null;
}

function evaluateRfqOpen(context: PolicyContext): PolicyDecision {
  const trust = requireTrust(context);
  if (trust) return trust;
  if (!context.actorControlsDemand) return deny("RFQ_DEMAND_CONTROLLER", "DEMAND_CONTROL_REQUIRED", "Only the verified demand controller may open an RFQ");
  if (context.matchStatus !== "eligible") return deny("RFQ_ELIGIBLE_MATCH", "ELIGIBLE_MATCH_REQUIRED", "RFQ requires an eligible match");
  if (context.offeringVerificationStatus !== "verified" || context.offeringLifecycleStatus !== "published") {
    return deny("RFQ_ACTIVE_OFFERING", "ACTIVE_OFFERING_REQUIRED", "RFQ requires a verified and published offering");
  }
  return allow(["TRUST_KYC_KYB_MEMBERSHIP", "RFQ_DEMAND_CONTROLLER", "RFQ_ELIGIBLE_MATCH", "RFQ_ACTIVE_OFFERING"], "RFQ may be opened");
}

function evaluateQuotationSubmit(context: PolicyContext): PolicyDecision {
  const trust = requireTrust(context);
  if (trust) return trust;
  if (!context.actorControlsOffering) return deny("QUOTATION_OFFERING_CONTROLLER", "OFFERING_CONTROL_REQUIRED", "Only the verified offering controller may submit a quotation");
  if (!context.actorIsParticipant) return deny("QUOTATION_PARTICIPANT", "PARTICIPANT_REQUIRED", "Quotation actor must participate in the matched commercial relationship");
  if (!(["open", "quoted"] as string[]).includes(context.rfqStatus ?? "")) return deny("QUOTATION_RFQ_OPEN", "RFQ_NOT_OPEN", "Quotation requires an open RFQ");
  if (context.matchStatus !== "eligible") return deny("QUOTATION_ELIGIBLE_MATCH", "ELIGIBLE_MATCH_REQUIRED", "Quotation requires an eligible match");
  return allow(["TRUST_KYC_KYB_MEMBERSHIP", "QUOTATION_OFFERING_CONTROLLER", "QUOTATION_RFQ_OPEN", "QUOTATION_ELIGIBLE_MATCH"], "Quotation may be submitted");
}

function evaluateQuotationAccept(context: PolicyContext): PolicyDecision {
  const trust = requireTrust(context);
  if (trust) return trust;
  if (!context.actorControlsDemand) return deny("ACCEPT_DEMAND_CONTROLLER", "DEMAND_CONTROL_REQUIRED", "Only the verified demand controller may accept a quotation");
  if (!(["submitted", "countered"] as string[]).includes(context.quotationStatus ?? "")) return deny("ACCEPT_QUOTATION_OPEN", "QUOTATION_NOT_ACCEPTABLE", "Quotation is not available for acceptance");
  if (!(["open", "quoted"] as string[]).includes(context.rfqStatus ?? "")) return deny("ACCEPT_RFQ_OPEN", "RFQ_NOT_ACCEPTABLE", "RFQ is not available for acceptance");
  if (context.matchStatus !== "eligible") return deny("ACCEPT_ELIGIBLE_MATCH", "ELIGIBLE_MATCH_REQUIRED", "Transaction requires an eligible match");
  if (context.offeringVerificationStatus !== "verified" || context.offeringLifecycleStatus !== "published") return deny("ACCEPT_ACTIVE_OFFERING", "ACTIVE_OFFERING_REQUIRED", "Offering is not commercially active");
  return allow(["TRUST_KYC_KYB_MEMBERSHIP", "ACCEPT_DEMAND_CONTROLLER", "ACCEPT_QUOTATION_OPEN", "ACCEPT_RFQ_OPEN", "ACCEPT_ELIGIBLE_MATCH", "ACCEPT_ACTIVE_OFFERING"], "Quotation may create a transaction");
}

function evaluatePaymentUpdate(context: PolicyContext): PolicyDecision {
  if (!context.actorIsParticipant) return deny("PAYMENT_PARTICIPANT", "PARTICIPANT_REQUIRED", "Only a transaction participant may update payment status");
  if (["closed", "cancelled"].includes(context.transactionStatus ?? "")) return deny("PAYMENT_OPEN_TRANSACTION", "TRANSACTION_CLOSED", "Closed or cancelled transactions cannot change payment status");
  return allow(["PAYMENT_PARTICIPANT", "PAYMENT_OPEN_TRANSACTION"], "Payment status may be updated");
}

function evaluateTransportAssign(context: PolicyContext): PolicyDecision {
  if (!context.actorIsParticipant) return deny("TRANSPORT_PARTICIPANT", "PARTICIPANT_REQUIRED", "Only a transaction participant may assign transport");
  if (!(context.operationalActivityVerified && context.transportProviderVerified)) return deny("TRANSPORT_PROVIDER_ACTIVITY", "VERIFIED_TRANSPORT_PROVIDER_REQUIRED", "Transport requires verified operational activity");
  if (!( ["accepted", "processing", "ready_for_pickup"] as string[]).includes(context.transactionStatus ?? "")) return deny("TRANSPORT_ASSIGNABLE_TRANSACTION", "TRANSACTION_NOT_ASSIGNABLE", "Transport can only be assigned before transit");
  return allow(["TRANSPORT_PARTICIPANT", "TRANSPORT_PROVIDER_ACTIVITY", "TRANSPORT_ASSIGNABLE_TRANSACTION"], "Transport may be assigned");
}

function evaluateTransportAdvance(context: PolicyContext): PolicyDecision {
  if (!context.actorIsParticipant) return deny("TRANSPORT_ADVANCE_PARTICIPANT", "PARTICIPANT_REQUIRED", "Only a transaction participant may advance transport");
  const allowed: Record<string, string[]> = { assigned: ["ready"], ready: ["picked_up"], picked_up: ["in_transit"] };
  if (!allowed[context.transportStatus ?? ""]?.includes(context.requestedTransition ?? "")) {
    return deny("TRANSPORT_STATE_MACHINE", "TRANSPORT_TRANSITION_NOT_ALLOWED", "Requested transport transition is not allowed");
  }
  return allow(["TRANSPORT_ADVANCE_PARTICIPANT", "TRANSPORT_STATE_MACHINE"], "Transport transition is allowed");
}

function evaluateDeliveryRecord(context: PolicyContext): PolicyDecision {
  if (!context.actorIsParticipant) return deny("DELIVERY_RECORD_PARTICIPANT", "PARTICIPANT_REQUIRED", "Only a transaction participant may record delivery");
  if (!( ["in_transit", "ready_for_pickup"] as string[]).includes(context.transactionStatus ?? "")) return deny("DELIVERY_IN_TRANSIT", "TRANSACTION_NOT_DELIVERABLE", "Delivery requires an in-transit transaction");
  if (context.deliveryTransactionMatches === false) return deny("DELIVERY_JOB_OWNERSHIP", "TRANSPORT_JOB_MISMATCH", "Transport job does not belong to this transaction");
  return allow(["DELIVERY_RECORD_PARTICIPANT", "DELIVERY_IN_TRANSIT", "DELIVERY_JOB_OWNERSHIP"], "Delivery may be recorded");
}

function evaluateDeliveryAccept(context: PolicyContext): PolicyDecision {
  if (!context.actorIsOwner && !context.actorIsBuyer) return deny("DELIVERY_ACCEPT_RECEIVER", "RECEIVING_PARTY_REQUIRED", "Only the receiving owner or buyer may accept delivery");
  if (context.transactionStatus !== "delivered") return deny("DELIVERY_ACCEPT_DELIVERED", "DELIVERY_NOT_READY", "Only delivered transactions may be accepted");
  return allow(["DELIVERY_ACCEPT_RECEIVER", "DELIVERY_ACCEPT_DELIVERED"], "Delivery may be accepted");
}

function evaluateClose(context: PolicyContext): PolicyDecision {
  if (!context.actorIsOwner && !context.actorIsBuyer) return deny("CLOSE_OWNER", "OWNER_REQUIRED", "Only the current owner or buyer may close the transaction");
  if (context.transactionStatus !== "received") return deny("CLOSE_RECEIVED", "RECEIPT_REQUIRED", "Transaction must be received before closure");
  if (!( ["settled", "external_recorded", "credit_terms"] as string[]).includes(context.paymentStatus ?? "")) return deny("CLOSE_PAYMENT", "PAYMENT_CONFIRMATION_REQUIRED", "Payment must be settled, externally recorded, or covered by credit terms");
  return allow(["CLOSE_OWNER", "CLOSE_RECEIVED", "CLOSE_PAYMENT"], "Transaction may be closed");
}

function evaluateDispute(context: PolicyContext): PolicyDecision {
  if (!context.actorIsParticipant) return deny("DISPUTE_PARTICIPANT", "PARTICIPANT_REQUIRED", "Only a transaction participant may open a dispute");
  if (["closed", "cancelled"].includes(context.transactionStatus ?? "")) return deny("DISPUTE_OPEN_TRANSACTION", "TRANSACTION_CLOSED", "Closed or cancelled transactions cannot open a new dispute");
  return allow(["DISPUTE_PARTICIPANT", "DISPUTE_OPEN_TRANSACTION"], "Dispute may be opened");
}

export function evaluatePolicy(context: PolicyContext): PolicyDecision {
  switch (context.action) {
    case "trade.rfq.open": return evaluateRfqOpen(context);
    case "trade.quotation.submit": return evaluateQuotationSubmit(context);
    case "trade.quotation.accept": return evaluateQuotationAccept(context);
    case "trade.payment.update": return evaluatePaymentUpdate(context);
    case "trade.transport.assign": return evaluateTransportAssign(context);
    case "trade.transport.advance": return evaluateTransportAdvance(context);
    case "trade.delivery.record": return evaluateDeliveryRecord(context);
    case "trade.delivery.accept": return evaluateDeliveryAccept(context);
    case "trade.transaction.close": return evaluateClose(context);
    case "trade.dispute.open": return evaluateDispute(context);
  }
}

export function assertPolicy(decisionResult: PolicyDecision): void {
  if (decisionResult.effect !== "allow") {
    const reason = decisionResult.reasons.find(item => item.severity === "blocking") ?? decisionResult.reasons[0];
    throw new Error(`${decisionResult.effect.toUpperCase()}: ${reason.code}: ${reason.message}`);
  }
}
