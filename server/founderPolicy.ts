export type OAuthRegistrationDecision = {
  existingUser: boolean;
  founderSetupComplete: boolean;
  isConfiguredBootstrapAccount: boolean;
};

export function shouldAllowOAuthRegistration(
  decision: OAuthRegistrationDecision
): boolean {
  return (
    decision.existingUser ||
    decision.founderSetupComplete ||
    decision.isConfiguredBootstrapAccount
  );
}

export type KycExemptionPurpose =
  | "initial_onboarding"
  | "regulated_transaction";

export function canCompleteFounderBootstrap(input: {
  isConfiguredBootstrapAccount: boolean;
  isOwnerRole: boolean;
  founderSetupAlreadyComplete: boolean;
  isFirstUser: boolean;
  isFirstPerson: boolean;
}): boolean {
  return (
    input.isConfiguredBootstrapAccount &&
    input.isOwnerRole &&
    !input.founderSetupAlreadyComplete &&
    input.isFirstUser &&
    input.isFirstPerson
  );
}

export function canUseFounderKycExemption(input: {
  isFounder: boolean;
  exemptionScope: string | null;
  requestedPurpose: KycExemptionPurpose;
}): boolean {
  return (
    input.isFounder &&
    input.exemptionScope === "initial_onboarding" &&
    input.requestedPurpose === "initial_onboarding"
  );
}
