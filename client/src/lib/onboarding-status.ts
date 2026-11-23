export type KycDisplayState =
  | "not_started"
  | "in_progress"
  | "awaiting_result"
  | "verified"
  | "failed"
  | "retry_required";

type KycSnapshot = {
  lifecycleStatus?: string | null;
  latest?: {
    status?: string | null;
    reviewReason?: string | null;
  } | null;
} | null | undefined;

export function getProfileCompletion(hasAuthenticatedAccount: boolean, personId?: number | null) {
  if (!hasAuthenticatedAccount) return 0;
  return personId ? 100 : 50;
}

/**
 * This derives only a presentation label from trusted server state. A browser
 * return from Didit is never an input and can never produce "verified".
 */
export function getKycDisplayState(snapshot: KycSnapshot): KycDisplayState {
  if (!snapshot) return "not_started";

  const lifecycle = snapshot.lifecycleStatus;
  const latestStatus = snapshot.latest?.status;

  if (lifecycle === "verified") return "verified";
  if (latestStatus === "verified") return "in_progress";
  if (lifecycle === "expired" || latestStatus === "expired") return "retry_required";
  if (lifecycle === "rejected" || latestStatus === "rejected" || lifecycle === "suspended" || latestStatus === "suspended") {
    return "failed";
  }
  if (latestStatus === "pending" || lifecycle === "pending") {
    return snapshot.latest?.reviewReason === "Didit status: In Review" ? "awaiting_result" : "in_progress";
  }
  return "not_started";
}
