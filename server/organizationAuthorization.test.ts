import { describe, expect, it } from "vitest";
import { evaluateBusinessAuthorization, type BusinessAuthorizationInput } from "./organizationAuthorization";

const allowedCase: BusinessAuthorizationInput = {
  requestedBusinessId: 10,
  membershipBusinessId: 10,
  membershipUserId: 7,
  expectedUserId: 7,
  membershipStatus: "active",
  membershipRole: "authorized_representative",
  personKycStatus: "verified",
  businessVerificationStatus: "verified",
  requiredPermission: "commerce.purchase_order.create",
  grantedPermission: "commerce.purchase_order.create",
  permissionStatus: "active",
  requireVerifiedBusiness: true,
};

describe("organization authorization", () => {
  it("allows only an exact active membership with an explicit permission", () => {
    expect(evaluateBusinessAuthorization(allowedCase)).toEqual({ allowed: true, reasonCode: "PERMISSION_GRANTED" });
  });

  it("fails closed when the business context or membership is absent or mismatched", () => {
    expect(evaluateBusinessAuthorization({ ...allowedCase, requestedBusinessId: undefined })).toMatchObject({ allowed: false, reasonCode: "BUSINESS_CONTEXT_REQUIRED" });
    expect(evaluateBusinessAuthorization({ ...allowedCase, requestedBusinessId: 0 })).toMatchObject({ allowed: false, reasonCode: "BUSINESS_CONTEXT_REQUIRED" });
    expect(evaluateBusinessAuthorization({ ...allowedCase, membershipBusinessId: 11 })).toMatchObject({ allowed: false, reasonCode: "BUSINESS_CONTEXT_MISMATCH" });
    expect(evaluateBusinessAuthorization({ ...allowedCase, membershipBusinessId: undefined })).toMatchObject({ allowed: false, reasonCode: "BUSINESS_CONTEXT_MISMATCH" });
    expect(evaluateBusinessAuthorization({ ...allowedCase, membershipUserId: 8 })).toMatchObject({ allowed: false, reasonCode: "ACTIVE_MEMBERSHIP_REQUIRED" });
  });

  it("denies inactive, suspended, or revoked memberships even if a grant row remains", () => {
    expect(evaluateBusinessAuthorization({ ...allowedCase, membershipStatus: "inactive" })).toMatchObject({ allowed: false, reasonCode: "ACTIVE_MEMBERSHIP_REQUIRED" });
    expect(evaluateBusinessAuthorization({ ...allowedCase, membershipStatus: "suspended" })).toMatchObject({ allowed: false, reasonCode: "ACTIVE_MEMBERSHIP_REQUIRED" });
  });

  it("never treats an owner or manager role as an implicit permission grant", () => {
    expect(evaluateBusinessAuthorization({ ...allowedCase, membershipRole: "owner", grantedPermission: null, permissionStatus: null })).toMatchObject({ allowed: false, reasonCode: "EXPLICIT_PERMISSION_REQUIRED" });
    expect(evaluateBusinessAuthorization({ ...allowedCase, membershipRole: "operations_manager", grantedPermission: null, permissionStatus: null })).toMatchObject({ allowed: false, reasonCode: "EXPLICIT_PERMISSION_REQUIRED" });
    expect(evaluateBusinessAuthorization({ ...allowedCase, membershipRole: "viewer" })).toMatchObject({ allowed: false, reasonCode: "ROLE_NOT_AUTHORIZED" });
  });

  it("requires verified KYC and KYB when the operation opts into those gates", () => {
    expect(evaluateBusinessAuthorization({ ...allowedCase, personKycStatus: "pending" })).toMatchObject({ allowed: false, reasonCode: "KYC_REQUIRED" });
    expect(evaluateBusinessAuthorization({ ...allowedCase, businessVerificationStatus: "pending" })).toMatchObject({ allowed: false, reasonCode: "KYB_REQUIRED" });
  });

  it("denies absent, mismatched, or revoked permission codes", () => {
    expect(evaluateBusinessAuthorization({ ...allowedCase, grantedPermission: null })).toMatchObject({ allowed: false, reasonCode: "EXPLICIT_PERMISSION_REQUIRED" });
    expect(evaluateBusinessAuthorization({ ...allowedCase, grantedPermission: "business.read" })).toMatchObject({ allowed: false, reasonCode: "EXPLICIT_PERMISSION_REQUIRED" });
    expect(evaluateBusinessAuthorization({ ...allowedCase, permissionStatus: "revoked" })).toMatchObject({ allowed: false, reasonCode: "EXPLICIT_PERMISSION_REQUIRED" });
  });

  it("denies a permission at or past its expiry instant", () => {
    const expiry = new Date("2026-01-01T00:00:00Z");
    expect(evaluateBusinessAuthorization({ ...allowedCase, permissionExpiresAt: expiry, now: new Date(expiry.getTime() - 1) })).toMatchObject({ allowed: true });
    expect(evaluateBusinessAuthorization({ ...allowedCase, permissionExpiresAt: expiry, now: expiry })).toMatchObject({ allowed: false, reasonCode: "PERMISSION_EXPIRED" });
    expect(evaluateBusinessAuthorization({ ...allowedCase, permissionExpiresAt: expiry, now: new Date(expiry.getTime() + 1) })).toMatchObject({ allowed: false, reasonCode: "PERMISSION_EXPIRED" });
  });

  it("does not require KYB unless the operation explicitly opts into that gate", () => {
    expect(evaluateBusinessAuthorization({ ...allowedCase, businessVerificationStatus: "pending", requireVerifiedBusiness: false })).toMatchObject({ allowed: true });
  });
});
