import { describe, expect, it } from "vitest";
import { ONBOARDING_STORAGE_KEY, onboardingSteps } from "../client/src/data/onboardingData";

describe("new customer onboarding", () => {
  it("keeps the first three steps in the trust-first order", () => {
    expect(onboardingSteps.map(step => step.id)).toEqual([
      "identity",
      "verification",
      "commercial-access",
    ]);
    expect(onboardingSteps.map(step => step.number)).toEqual([1, 2, 3]);
  });

  it("links onboarding steps only to supported, non-healthcare destinations", () => {
    const supportedDestinations = new Set([
      "verification",
      "commercial-capabilities",
      "trade-operations",
      "prototype",
    ]);

    expect(onboardingSteps.every(step => supportedDestinations.has(step.destination))).toBe(true);
    expect(JSON.stringify(onboardingSteps).toLowerCase()).not.toContain("healthcare");
    expect(ONBOARDING_STORAGE_KEY).toContain("onboarding-seen");
  });
});
