export type BusinessCreationPath = "verified_kyc" | "founder_initial_kyc_exemption";

/** The founder is the exact configured OAuth subject and must carry the platform-owner role. */
export function isConfiguredFounder(
  openId: string,
  configuredFounderOpenId: string,
  hasPlatformOwnerRole: boolean,
): boolean {
  return Boolean(
    openId &&
      configuredFounderOpenId &&
      openId === configuredFounderOpenId &&
      hasPlatformOwnerRole,
  );
}

/** Return null when the caller must not create a business yet. */
export function selectBusinessCreationPath(input: {
  hasCurrentVerifiedKyc: boolean;
  isFounder: boolean;
  founderExemptionAlreadyUsed: boolean;
}): BusinessCreationPath | null {
  if (input.hasCurrentVerifiedKyc) return "verified_kyc";
  if (input.isFounder && !input.founderExemptionAlreadyUsed) {
    return "founder_initial_kyc_exemption";
  }
  return null;
}
