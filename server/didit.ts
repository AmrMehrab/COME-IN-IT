import { createHmac, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

type DiditMode = "sandbox" | "live";
type KycStatus = "pending" | "verified" | "rejected" | "expired";

type DiditConfig = {
  apiKey: string;
  workflowId: string;
  webhookSecret: string;
  mode: DiditMode;
};

export class DiditWebhookError extends Error {
  constructor(
    readonly statusCode: number,
    readonly publicCode: string
  ) {
    super(publicCode);
    this.name = "DiditWebhookError";
  }
}

const diditWebhookSchema = z
  .object({
    event_id: z.string().trim().min(1).max(180),
    session_id: z.string().trim().min(1).max(180),
    status: z.enum([
      "Approved",
      "Declined",
      "In Review",
      "In Progress",
      "Not Started",
      "Abandoned",
      "Expired",
      "Kyc Expired",
      "Resubmitted",
      "Awaiting User",
    ]),
    webhook_type: z.string().trim().min(1).max(120),
    environment: z.enum(["sandbox", "live"]),
    workflow_id: z.string().trim().min(1).max(180),
  })
  .passthrough();

const diditSessionResponseSchema = z.object({
  session_id: z.string().trim().min(1).max(180),
  url: z.string().url(),
});

function getDiditConfig(): DiditConfig {
  const apiKey = process.env.DIDIT_API_KEY?.trim();
  const workflowId = process.env.DIDIT_WORKFLOW_ID?.trim();
  const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET?.trim();
  const modeValue = process.env.DIDIT_MODE?.trim().toLowerCase() || "sandbox";

  if (!apiKey || !workflowId || !webhookSecret) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Didit KYC is not configured for this environment.",
    });
  }
  if (modeValue !== "sandbox" && modeValue !== "live") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Didit mode must be sandbox or live.",
    });
  }
  if (apiKey.startsWith("sk_test_") && modeValue !== "sandbox") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "A Didit sandbox key cannot be used in live mode.",
    });
  }
  if (apiKey.startsWith("sk_live_") && modeValue !== "live") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "A Didit live key cannot be used in sandbox mode.",
    });
  }

  return { apiKey, workflowId, webhookSecret, mode: modeValue };
}

function normalizeDiditError(error: unknown): TRPCError {
  if (error instanceof TRPCError) return error;
  return new TRPCError({
    code: "BAD_GATEWAY",
    message:
      "Didit could not start the verification session. Please try again later.",
  });
}

async function requestDiditSession(config: DiditConfig, personId: number) {
  let response: Response;

  try {
    response = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify({
        workflow_id: config.workflowId,
        vendor_data: String(personId),
        language: "ar",
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw normalizeDiditError(error);
  }

  if (!response.ok) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Didit rejected the verification-session request.",
    });
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Didit returned an invalid verification-session response.",
    });
  }

  const parsed = diditSessionResponseSchema.safeParse(responseBody);
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Didit returned an invalid verification-session response.",
    });
  }

  const verificationUrl = new URL(parsed.data.url);
  if (
    verificationUrl.protocol !== "https:" ||
    verificationUrl.hostname !== "verify.didit.me"
  ) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Didit returned an untrusted verification URL.",
    });
  }

  return {
    sessionId: parsed.data.session_id,
    verificationUrl: verificationUrl.toString(),
  };
}

export async function createDiditSessionForPerson(personId: number) {
  return requestDiditSession(getDiditConfig(), personId);
}

export async function startDiditKycVerificationForUser(userId: number) {
  const config = getDiditConfig();
  const context = await db.getKycSubmissionContextForUser(userId);
  const currentStatus = context.lifecycleStatus;
  const existing = context.latest;
  const canResume =
    currentStatus === "pending" &&
    existing?.status === "pending" &&
    Boolean(existing.providerReference);

  if (currentStatus === "pending" && !canResume) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A KYC submission is already pending manual review.",
    });
  }
  if (
    !canResume &&
    !["unverified", "rejected", "expired"].includes(currentStatus)
  ) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "The current KYC state does not allow a new verification session.",
    });
  }

  const session = await requestDiditSession(config, context.personId);
  if (canResume && existing) {
    if (existing.providerReference !== session.sessionId) {
      await db.updatePendingKycProviderReferenceForUser(
        userId,
        existing.id,
        session.sessionId
      );
    }
  } else {
    await db.submitKycVerificationForUser(userId, {
      providerReference: session.sessionId,
    });
  }

  return {
    status: "pending" as const,
    provider: "didit" as const,
    mode: config.mode,
    verificationUrl: session.verificationUrl,
  };
}

function canonicalizeDiditPayload(value: unknown): string {
  const sortRecursively = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(sortRecursively);
    if (item && typeof item === "object") {
      const object = item as Record<string, unknown>;
      return Object.fromEntries(
        Object.keys(object)
          .sort()
          .map(key => [key, sortRecursively(object[key])])
      );
    }
    return item;
  };

  return JSON.stringify(sortRecursively(value));
}

export function verifyDiditWebhookSignature(
  payload: unknown,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined,
  secret: string,
  nowMs = Date.now()
): boolean {
  if (
    !signatureHeader ||
    !timestampHeader ||
    !secret ||
    !payload ||
    typeof payload !== "object"
  )
    return false;

  const timestampSeconds = Number(timestampHeader);
  if (
    !Number.isInteger(timestampSeconds) ||
    Math.abs(Math.floor(nowMs / 1000) - timestampSeconds) > 300
  ) {
    return false;
  }

  const signature = signatureHeader.trim().replace(/^sha256=/i, "");
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;

  const expected = createHmac("sha256", secret)
    .update(canonicalizeDiditPayload(payload), "utf8")
    .digest();
  const provided = Buffer.from(signature, "hex");
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

export function mapDiditStatusToKycStatus(status: string): KycStatus | null {
  switch (status) {
    case "Approved":
      return "verified";
    case "Declined":
      return "rejected";
    case "Expired":
    case "Kyc Expired":
      return "expired";
    case "In Review":
    case "In Progress":
    case "Not Started":
    case "Abandoned":
    case "Resubmitted":
    case "Awaiting User":
      return "pending";
    default:
      return null;
  }
}

export async function handleDiditWebhook(
  payload: unknown,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined
) {
  let config: DiditConfig;
  try {
    config = getDiditConfig();
  } catch {
    throw new DiditWebhookError(503, "didit_not_configured");
  }

  if (
    !verifyDiditWebhookSignature(
      payload,
      signatureHeader,
      timestampHeader,
      config.webhookSecret
    )
  ) {
    throw new DiditWebhookError(401, "invalid_signature");
  }

  const parsed = diditWebhookSchema.safeParse(payload);
  if (!parsed.success) throw new DiditWebhookError(400, "invalid_payload");
  if (
    parsed.data.workflow_id !== config.workflowId ||
    parsed.data.environment !== config.mode
  ) {
    throw new DiditWebhookError(403, "workflow_or_environment_mismatch");
  }
  if (parsed.data.webhook_type !== "status.updated") return "ignored" as const;

  const mappedStatus = mapDiditStatusToKycStatus(parsed.data.status);
  if (!mappedStatus) return "ignored" as const;

  return db.applyDiditKycStatus(
    parsed.data.session_id,
    mappedStatus,
    parsed.data.status,
    parsed.data.event_id
  );
}
