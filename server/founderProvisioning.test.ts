import { describe, expect, it } from "vitest";
import { isConfiguredFounder, selectBusinessCreationPath } from "./founderProvisioning";

describe("founder business provisioning", () => {
  it("recognizes only the exact configured OAuth founder with owner role", () => {
    expect(isConfiguredFounder("founder-open-id", "founder-open-id", true)).toBe(true);
    expect(isConfiguredFounder("other-open-id", "founder-open-id", true)).toBe(false);
    expect(isConfiguredFounder("founder-open-id", "", true)).toBe(false);
    expect(isConfiguredFounder("founder-open-id", "founder-open-id", false)).toBe(false);
    expect(isConfiguredFounder("", "founder-open-id", true)).toBe(false);
  });

  it("requires verified KYC for ordinary users", () => {
    expect(
      selectBusinessCreationPath({
        hasCurrentVerifiedKyc: false,
        isFounder: false,
        founderExemptionAlreadyUsed: false,
      }),
    ).toBeNull();
  });

  it("allows one initial business for the configured founder without marking KYC verified", () => {
    expect(
      selectBusinessCreationPath({
        hasCurrentVerifiedKyc: false,
        isFounder: true,
        founderExemptionAlreadyUsed: false,
      }),
    ).toBe("founder_initial_kyc_exemption");
  });

  it("does not reuse the initial exception after it has been consumed", () => {
    expect(
      selectBusinessCreationPath({
        hasCurrentVerifiedKyc: false,
        isFounder: true,
        founderExemptionAlreadyUsed: true,
      }),
    ).toBeNull();
  });

  it("uses current verified KYC normally, regardless of founder status", () => {
    expect(
      selectBusinessCreationPath({
        hasCurrentVerifiedKyc: true,
        isFounder: false,
        founderExemptionAlreadyUsed: true,
      }),
    ).toBe("verified_kyc");
  });
});
