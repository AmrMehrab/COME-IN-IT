import { describe, expect, it } from "vitest";
import {
  canCompleteFounderBootstrap,
  canUseFounderKycExemption,
  shouldAllowOAuthRegistration,
} from "./founderPolicy";

describe("founder bootstrap policy", () => {
  it("keeps public registration closed until founder setup is complete", () => {
    expect(
      shouldAllowOAuthRegistration({
        existingUser: false,
        founderSetupComplete: false,
        isConfiguredBootstrapAccount: false,
      })
    ).toBe(false);
  });

  it("allows only the configured bootstrap account before setup", () => {
    expect(
      shouldAllowOAuthRegistration({
        existingUser: false,
        founderSetupComplete: false,
        isConfiguredBootstrapAccount: true,
      })
    ).toBe(true);
  });

  it("rejects a second founder record even for the configured owner", () => {
    expect(
      canCompleteFounderBootstrap({
        isConfiguredBootstrapAccount: true,
        isOwnerRole: true,
        founderSetupAlreadyComplete: true,
        isFirstUser: true,
        isFirstPerson: true,
      })
    ).toBe(false);
  });

  it("requires the configured account to be the first user and first person", () => {
    const eligible = {
      isConfiguredBootstrapAccount: true,
      isOwnerRole: true,
      founderSetupAlreadyComplete: false,
      isFirstUser: true,
      isFirstPerson: true,
    };
    expect(canCompleteFounderBootstrap(eligible)).toBe(true);
    expect(
      canCompleteFounderBootstrap({ ...eligible, isFirstUser: false })
    ).toBe(false);
    expect(
      canCompleteFounderBootstrap({ ...eligible, isFirstPerson: false })
    ).toBe(false);
  });

  it("keeps existing accounts usable and opens registration after setup", () => {
    expect(
      shouldAllowOAuthRegistration({
        existingUser: true,
        founderSetupComplete: false,
        isConfiguredBootstrapAccount: false,
      })
    ).toBe(true);
    expect(
      shouldAllowOAuthRegistration({
        existingUser: false,
        founderSetupComplete: true,
        isConfiguredBootstrapAccount: false,
      })
    ).toBe(true);
  });

  it("does not let an ordinary user bypass KYC", () => {
    expect(
      canUseFounderKycExemption({
        isFounder: false,
        exemptionScope: "initial_onboarding",
        requestedPurpose: "initial_onboarding",
      })
    ).toBe(false);
  });

  it("limits the founder exception to initial onboarding, never regulated transactions", () => {
    expect(
      canUseFounderKycExemption({
        isFounder: true,
        exemptionScope: "initial_onboarding",
        requestedPurpose: "initial_onboarding",
      })
    ).toBe(true);
    expect(
      canUseFounderKycExemption({
        isFounder: true,
        exemptionScope: "initial_onboarding",
        requestedPurpose: "regulated_transaction",
      })
    ).toBe(false);
  });
});
