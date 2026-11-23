import { describe, expect, it } from "vitest";
import { getKycDisplayState, getProfileCompletion } from "../client/src/lib/onboarding-status";

describe("onboarding presentation state", () => {
  it("measures profile completion from the current schema link", () => {
    expect(getProfileCompletion(false)).toBe(0);
    expect(getProfileCompletion(true)).toBe(50);
    expect(getProfileCompletion(true, 41)).toBe(100);
  });

  it("represents not-started KYC from server state", () => {
    expect(getKycDisplayState({ lifecycleStatus: "unverified", latest: null })).toBe("not_started");
  });

  it("distinguishes an active session from a provider review awaiting a result", () => {
    expect(getKycDisplayState({ lifecycleStatus: "pending", latest: { status: "pending", reviewReason: null } })).toBe("in_progress");
    expect(getKycDisplayState({ lifecycleStatus: "pending", latest: { status: "pending", reviewReason: "Didit status: In Review" } })).toBe("awaiting_result");
  });

  it("uses only trusted server state to show verification success", () => {
    expect(getKycDisplayState({ lifecycleStatus: "verified", latest: { status: "verified" } })).toBe("verified");
    expect(getKycDisplayState({ lifecycleStatus: "pending", latest: { status: "pending" } })).not.toBe("verified");
    expect(getKycDisplayState({ lifecycleStatus: "pending", latest: { status: "verified" } })).toBe("in_progress");
  });

  it("shows failure and retry states from the stored verification result", () => {
    expect(getKycDisplayState({ lifecycleStatus: "rejected", latest: { status: "rejected" } })).toBe("failed");
    expect(getKycDisplayState({ lifecycleStatus: "expired", latest: { status: "expired" } })).toBe("retry_required");
  });
});
