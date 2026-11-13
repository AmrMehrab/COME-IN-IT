import { describe, expect, it } from "vitest";
import { relationshipModeOptions, rolePermissionMatrix } from "../client/src/data/permissionsMatrix";

const getAssignment = (role: string, permissionId: string) =>
  rolePermissionMatrix
    .find((definition) => definition.role === role)
    ?.permissions.find((assignment) => assignment.permission.id === permissionId);

describe("commercial permissions matrix", () => {
  it("requires active membership, activity verification, and offering verification for an owner offering", () => {
    const assignment = getAssignment("OWNER", "create_trade_offering");

    expect(assignment).toMatchObject({
      requiresKYC: true,
      requiresKYB: true,
      requiresVerifiedBusiness: true,
      requiresActiveMembership: true,
      requiresBusinessActivityVerification: true,
      requiresOfferingVerification: true,
      allowedRelationshipModes: ["b2b", "b2c"],
    });
  });

  it("limits individual activity holders to C2B and C2C commercial paths", () => {
    const relationshipAssignment = getAssignment("INDIVIDUAL_ACTIVITY_HOLDER", "evaluate_commercial_relationship");
    const offeringAssignment = getAssignment("INDIVIDUAL_ACTIVITY_HOLDER", "create_trade_offering");

    expect(relationshipAssignment?.requiresIndividualActivity).toBe(true);
    expect(relationshipAssignment?.allowedRelationshipModes).toEqual(["c2b", "c2c"]);
    expect(offeringAssignment?.allowedRelationshipModes).toEqual(["c2b", "c2c"]);
  });

  it("keeps B2G on a manual-review route in every displayed commercial role", () => {
    const b2gAssignments = rolePermissionMatrix.flatMap((definition) =>
      definition.permissions.filter((assignment) => assignment.allowedRelationshipModes?.includes("b2g")),
    );

    expect(b2gAssignments.length).toBeGreaterThan(0);
    expect(b2gAssignments.every((assignment) => assignment.manualReviewForModes?.includes("b2g"))).toBe(true);
  });

  it("provides all five commercial relationship modes and no trade-creation capability to the compliance reviewer", () => {
    expect(relationshipModeOptions.map((mode) => mode.value)).toEqual(["b2b", "b2c", "c2b", "c2c", "b2g"]);

    const compliancePermissions = rolePermissionMatrix.find((definition) => definition.role === "COMPLIANCE_REVIEWER")?.permissions ?? [];
    expect(compliancePermissions.some((assignment) => ["create_trade_offering", "create_trade_demand"].includes(assignment.permission.id))).toBe(false);
  });
});
