export const businessPermissionCodes = [
  "business.read",
  "business.profile.update",
  "business.kyb.read",
  "business.kyb.submit",
  "business.activity.read",
  "business.activity.submit",
  "trade.offering.read",
  "trade.offering.create",
  "trade.rfq.read",
  "trade.demand.read",
  "trade.demand.create",
  "trade.match.read",
  "trade.match.evaluate",
  "trade.quotation.read",
  "trade.rfq.create",
  "trade.quotation.submit",
  "trade.quotation.accept",
  "trade.payment.update",
  "trade.transport.assign",
  "trade.transport.advance",
  "trade.delivery.record",
  "trade.delivery.accept",
  "trade.transaction.read",
  "trade.transaction.close",
  "trade.dispute.open",
  "commerce.purchase_order.read",
  "commerce.purchase_order.create",
] as const;

export type BusinessPermissionCode = (typeof businessPermissionCodes)[number];

export type BusinessAuthorizationInput = {
  requestedBusinessId?: number | null;
  membershipBusinessId?: number | null;
  membershipUserId?: number | null;
  expectedUserId: number;
  membershipStatus?: string | null;
  membershipRole?: string | null;
  personKycStatus?: string | null;
  businessVerificationStatus?: string | null;
  requiredPermission: BusinessPermissionCode;
  grantedPermission?: string | null;
  permissionStatus?: string | null;
  permissionExpiresAt?: Date | null;
  requireKyc?: boolean;
  requireVerifiedBusiness?: boolean;
  now?: Date;
};

export type BusinessAuthorizationDecision = {
  allowed: boolean;
  reasonCode: string;
};

/** Permission checks are scoped to the exact business and are deny-by-default. */
export function evaluateBusinessAuthorization(input: BusinessAuthorizationInput): BusinessAuthorizationDecision {
  if (!input.requestedBusinessId || !Number.isInteger(input.requestedBusinessId) || input.requestedBusinessId <= 0) {
    return { allowed: false, reasonCode: "BUSINESS_CONTEXT_REQUIRED" };
  }
  if (input.membershipBusinessId !== input.requestedBusinessId) {
    return { allowed: false, reasonCode: "BUSINESS_CONTEXT_MISMATCH" };
  }
  if (input.membershipUserId !== input.expectedUserId) {
    return { allowed: false, reasonCode: "ACTIVE_MEMBERSHIP_REQUIRED" };
  }
  if (input.membershipStatus !== "active") {
    return { allowed: false, reasonCode: "ACTIVE_MEMBERSHIP_REQUIRED" };
  }
  if (input.membershipRole === "viewer") {
    return { allowed: false, reasonCode: "ROLE_NOT_AUTHORIZED" };
  }
  if (input.requireKyc !== false && input.personKycStatus !== "verified") {
    return { allowed: false, reasonCode: "KYC_REQUIRED" };
  }
  if (input.requireVerifiedBusiness && input.businessVerificationStatus !== "verified") {
    return { allowed: false, reasonCode: "KYB_REQUIRED" };
  }
  if (input.grantedPermission !== input.requiredPermission || input.permissionStatus !== "active") {
    return { allowed: false, reasonCode: "EXPLICIT_PERMISSION_REQUIRED" };
  }
  if (input.permissionExpiresAt && input.permissionExpiresAt.getTime() <= (input.now ?? new Date()).getTime()) {
    return { allowed: false, reasonCode: "PERMISSION_EXPIRED" };
  }
  return { allowed: true, reasonCode: "PERMISSION_GRANTED" };
}
