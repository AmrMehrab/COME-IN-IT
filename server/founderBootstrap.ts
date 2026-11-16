import { createCipheriv, createHmac, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  auditEvents,
  founderBootstrapRecords,
  founderKycExemptions,
  personIdentityProfiles,
  persons,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import {
  canCompleteFounderBootstrap,
  canUseFounderKycExemption,
  shouldAllowOAuthRegistration,
} from "./founderPolicy";

export type FounderProfileInput = {
  legalName: string;
  nationalId: string;
  phone?: string;
  email?: string;
  address?: string;
};

type PrivateProfile = {
  legalName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

function getKeyFromBase64(name: string, value: string): Buffer {
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `${name} must be configured as a base64-encoded 32-byte key.`,
    });
  }
  return key;
}

function encryptProfile(profile: PrivateProfile, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(profile), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

function hashNationalId(nationalId: string, key: Buffer): string {
  return createHmac("sha256", key).update(nationalId, "utf8").digest("hex");
}

function normalizeNationalId(value: string): string {
  const normalized = value.replace(/[\s-]/g, "").replace(/[٠-٩۰-۹]/g, digit => {
    const codePoint = digit.charCodeAt(0);
    return String(
      codePoint >= 0x06f0 ? codePoint - 0x06f0 : codePoint - 0x0660
    );
  });
  if (!/^\d{6,32}$/.test(normalized)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Enter a valid national ID using digits only.",
    });
  }
  return normalized;
}

function requireDatabase<T>(database: T | null): T {
  if (!database) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "The database is not available; founder setup is closed.",
    });
  }
  return database;
}

export async function isOAuthAccountRegistrationAllowed(
  openId: string
): Promise<boolean> {
  const database = requireDatabase(await getDb());
  const existingUser = await database
    .select({ id: users.id })
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  const founder = await database
    .select({ id: founderBootstrapRecords.id })
    .from(founderBootstrapRecords)
    .where(eq(founderBootstrapRecords.id, 1))
    .limit(1);

  return shouldAllowOAuthRegistration({
    existingUser: Boolean(existingUser[0]),
    founderSetupComplete: Boolean(founder[0]),
    isConfiguredBootstrapAccount:
      Boolean(ENV.ownerOpenId) && openId === ENV.ownerOpenId,
  });
}

export async function getFounderBootstrapStatus(openId?: string) {
  const database = await getDb();
  if (!database) {
    return {
      setupComplete: false,
      registrationOpen: false,
      canBootstrap: false,
      initialOnboardingExempt: false,
    };
  }

  const founderRows = await database
    .select({
      userId: founderBootstrapRecords.userId,
      personId: founderBootstrapRecords.personId,
    })
    .from(founderBootstrapRecords)
    .where(eq(founderBootstrapRecords.id, 1))
    .limit(1);
  const founder = founderRows[0];
  const currentUser = openId
    ? await database
        .select({ id: users.id })
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1)
    : [];
  const isFounder = Boolean(founder && currentUser[0]?.id === founder.userId);
  const exemption = isFounder
    ? await database
        .select({ scope: founderKycExemptions.scope })
        .from(founderKycExemptions)
        .where(eq(founderKycExemptions.personId, founder!.personId))
        .limit(1)
    : [];

  return {
    setupComplete: Boolean(founder),
    registrationOpen: Boolean(founder),
    canBootstrap:
      !founder && Boolean(ENV.ownerOpenId) && openId === ENV.ownerOpenId,
    initialOnboardingExempt: canUseFounderKycExemption({
      isFounder,
      exemptionScope: exemption[0]?.scope ?? null,
      requestedPurpose: "initial_onboarding",
    }),
  };
}

export async function completeFounderBootstrap(
  user: typeof users.$inferSelect,
  input: FounderProfileInput
) {
  if (
    !ENV.ownerOpenId ||
    user.openId !== ENV.ownerOpenId ||
    user.role !== "owner"
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Founder setup is limited to the configured bootstrap account.",
    });
  }

  const encryptionKey = getKeyFromBase64(
    "PERSON_IDENTITY_ENCRYPTION_KEY",
    ENV.personIdentityEncryptionKey
  );
  const hmacKey = getKeyFromBase64(
    "NATIONAL_ID_LOOKUP_HMAC_KEY",
    ENV.nationalIdLookupHmacKey
  );
  const nationalId = normalizeNationalId(input.nationalId);
  const nationalIdHmac = hashNationalId(nationalId, hmacKey);
  const maskedNationalId = `••••••••••${nationalId.slice(-4)}`;
  const encryptedProfile = encryptProfile(
    {
      legalName: input.legalName.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
    },
    encryptionKey
  );

  const database = requireDatabase(await getDb());
  try {
    await database.transaction(async tx => {
      const existingFounder = await tx
        .select({ id: founderBootstrapRecords.id })
        .from(founderBootstrapRecords)
        .where(eq(founderBootstrapRecords.id, 1))
        .limit(1);

      const firstUsers = await tx
        .select({ id: users.id })
        .from(users)
        .orderBy(users.id)
        .limit(2);

      const allPeople = await tx
        .select({ id: persons.id, userId: persons.userId })
        .from(persons)
        .limit(2);
      const isFirstPerson =
        allPeople.length === 0 ||
        (allPeople.length === 1 && allPeople[0]?.userId === user.id);
      const founderSetupEligible = canCompleteFounderBootstrap({
        isConfiguredBootstrapAccount:
          Boolean(ENV.ownerOpenId) && user.openId === ENV.ownerOpenId,
        isOwnerRole: user.role === "owner",
        founderSetupAlreadyComplete: Boolean(existingFounder[0]),
        isFirstUser: firstUsers.length === 1 && firstUsers[0]?.id === user.id,
        isFirstPerson,
      });
      if (!founderSetupEligible) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Founder setup is already complete or the bootstrap account is not the first user and person.",
        });
      }

      const initialKycExemptionApplies = canUseFounderKycExemption({
        isFounder: founderSetupEligible,
        exemptionScope: "initial_onboarding",
        requestedPurpose: "initial_onboarding",
      });
      if (!initialKycExemptionApplies) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "The founder KYC exception is limited to initial account setup.",
        });
      }

      let personId = allPeople[0]?.id;
      if (!personId) {
        await tx.insert(persons).values({ userId: user.id });
        const created = await tx
          .select({ id: persons.id })
          .from(persons)
          .where(eq(persons.userId, user.id))
          .limit(1);
        personId = created[0]?.id;
      }
      if (!personId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Founder person identity could not be created.",
        });
      }

      const duplicateNationalId = await tx
        .select({ id: personIdentityProfiles.id })
        .from(personIdentityProfiles)
        .where(eq(personIdentityProfiles.nationalIdHmac, nationalIdHmac))
        .limit(1);
      if (duplicateNationalId[0]) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This national ID is already linked to an account.",
        });
      }

      await tx.insert(personIdentityProfiles).values({
        personId,
        nationalIdHmac,
        maskedNationalId,
        encryptedProfile,
      });
      await tx.insert(founderKycExemptions).values({
        personId,
        scope: "initial_onboarding",
        actorUserId: user.id,
      });
      await tx.insert(founderBootstrapRecords).values({
        id: 1,
        userId: user.id,
        personId,
        createdByUserId: user.id,
      });
      await tx.insert(auditEvents).values({
        actorUserId: user.id,
        action: "founder_bootstrap_completed",
        resourceType: "founder_bootstrap",
        resourceId: "founder-singleton",
        decision: "allow",
        reasonCode: "founder_initial_onboarding_kyc_exemption_granted",
        dataClassification: "confidential_sovereign",
        metadataJson: JSON.stringify({
          maskedNationalId,
          exemptionScope: "initial_onboarding",
          kycStatusChanged: false,
        }),
      });
    });
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const candidate = error as {
      code?: string;
      errno?: number;
      cause?: { code?: string; errno?: number };
    };
    if (
      candidate.code === "ER_DUP_ENTRY" ||
      candidate.errno === 1062 ||
      candidate.cause?.code === "ER_DUP_ENTRY" ||
      candidate.cause?.errno === 1062
    ) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Founder setup or identity has already been recorded.",
      });
    }
    throw error;
  }

  return {
    setupComplete: true,
    registrationOpen: true,
    exemptionScope: "initial_onboarding" as const,
  };
}
