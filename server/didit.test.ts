import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDiditSessionForPerson,
  mapDiditStatusToKycStatus,
  verifyDiditWebhookSignature,
} from "./didit";

const TEST_API_KEY = "sk_test_unit-test-key";
const TEST_WORKFLOW_ID = "11111111-2222-4333-8444-555555555555";
const TEST_WEBHOOK_SECRET = "unit-test-webhook-secret";

function canonicalize(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map(item => canonicalize(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)
    );
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function signPayload(payload: unknown, secret: string): string {
  return createHmac("sha256", secret)
    .update(canonicalize(payload), "utf8")
    .digest("hex");
}

function configureSandbox() {
  vi.stubEnv("DIDIT_MODE", "sandbox");
  vi.stubEnv("DIDIT_API_KEY", TEST_API_KEY);
  vi.stubEnv("DIDIT_WORKFLOW_ID", TEST_WORKFLOW_ID);
  vi.stubEnv("DIDIT_WEBHOOK_SECRET", TEST_WEBHOOK_SECRET);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Didit KYC integration", () => {
  it("creates a server-side sandbox session and returns only the hosted URL", async () => {
    configureSandbox();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          session_id: "e2b8d774-6a44-42de-bfc5-080305f84439",
          url: "https://verify.didit.me/en/session/test-token",
          session_token: "must-not-be-returned",
        }),
        { status: 201, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createDiditSessionForPerson(42);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://verification.didit.me/v3/session/");
    expect(request.headers).toEqual({
      "content-type": "application/json",
      "x-api-key": TEST_API_KEY,
    });
    expect(JSON.parse(String(request.body))).toEqual({
      workflow_id: TEST_WORKFLOW_ID,
      vendor_data: "42",
      language: "ar",
    });
    expect(result).toEqual({
      sessionId: "e2b8d774-6a44-42de-bfc5-080305f84439",
      verificationUrl: "https://verify.didit.me/en/session/test-token",
    });
    expect(JSON.stringify(result)).not.toContain("must-not-be-returned");
  });

  it("rejects a live API key while sandbox mode is selected", async () => {
    vi.stubEnv("DIDIT_MODE", "sandbox");
    vi.stubEnv("DIDIT_API_KEY", "sk_live_not-for-use");
    vi.stubEnv("DIDIT_WORKFLOW_ID", TEST_WORKFLOW_ID);
    vi.stubEnv("DIDIT_WEBHOOK_SECRET", TEST_WEBHOOK_SECRET);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(createDiditSessionForPerson(42)).rejects.toThrow(
      "A Didit live key cannot be used in sandbox mode."
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("verifies the canonical V2 HMAC and rejects altered or stale requests", () => {
    const payload = {
      event_id: "test-event",
      metadata: { z: "مرحبا", a: 1.0 },
      status: "Approved",
    };
    const nowMs = 1_800_000_000_000;
    const timestamp = String(Math.floor(nowMs / 1000));
    const signature = signPayload(payload, TEST_WEBHOOK_SECRET);

    expect(
      verifyDiditWebhookSignature(
        payload,
        signature,
        timestamp,
        TEST_WEBHOOK_SECRET,
        nowMs
      )
    ).toBe(true);
    expect(
      verifyDiditWebhookSignature(
        { ...payload, status: "Declined" },
        signature,
        timestamp,
        TEST_WEBHOOK_SECRET,
        nowMs
      )
    ).toBe(false);
    expect(
      verifyDiditWebhookSignature(
        payload,
        signature,
        String(Number(timestamp) - 301),
        TEST_WEBHOOK_SECRET,
        nowMs
      )
    ).toBe(false);
    expect(
      verifyDiditWebhookSignature(
        payload,
        "not-a-signature",
        timestamp,
        TEST_WEBHOOK_SECRET,
        nowMs
      )
    ).toBe(false);
  });

  it.each([
    ["Approved", "verified"],
    ["Declined", "rejected"],
    ["Expired", "expired"],
    ["Kyc Expired", "expired"],
    ["In Review", "pending"],
    ["In Progress", "pending"],
    ["Abandoned", "pending"],
    ["Resubmitted", "pending"],
  ] as const)("maps Didit status %s to KYC state %s", (input, expected) => {
    expect(mapDiditStatusToKycStatus(input)).toBe(expected);
  });
});
