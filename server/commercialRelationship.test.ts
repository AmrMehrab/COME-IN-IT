import { describe, expect, it } from "vitest";
import { calculateRelationshipEvaluation, type ResolvedTradeParty } from "./db";

function businessParty(
  overrides: Partial<ResolvedTradeParty> = {}
): ResolvedTradeParty {
  return {
    kind: "business",
    identityKey: "business:1",
    activityType: null,
    businessActivities: ["factory"],
    entityType: "factory",
    legalVerificationStatus: "verified",
    kycStatus: null,
    activityVerificationStatus: "verified",
    ...overrides,
  };
}

function individualParty(
  overrides: Partial<ResolvedTradeParty> = {}
): ResolvedTradeParty {
  return {
    kind: "individual",
    identityKey: "individual:1",
    activityType: "individual_producer",
    businessActivities: [],
    entityType: null,
    legalVerificationStatus: null,
    kycStatus: "verified",
    activityVerificationStatus: "verified",
    ...overrides,
  };
}

describe("commercial relationship eligibility", () => {
  it("allows B2B only after both business trust and activity gates are satisfied", () => {
    expect(
      calculateRelationshipEvaluation(
        businessParty({ identityKey: "business:supplier" }),
        businessParty({
          identityKey: "business:buyer",
          entityType: "importer",
          businessActivities: ["importer"],
        })
      )
    ).toMatchObject({
      decision: "allow",
      relationshipMode: "b2b",
      decisionReason: "relationship_trust_gates_satisfied",
      score: 100,
    });
  });

  it("denies a self-relationship", () => {
    const party = businessParty();
    expect(calculateRelationshipEvaluation(party, party)).toMatchObject({
      decision: "deny",
      decisionReason: "self_relationship_not_allowed",
      score: 0,
    });
  });

  it("denies an unverified business party", () => {
    expect(
      calculateRelationshipEvaluation(
        businessParty({ legalVerificationStatus: "pending" }),
        businessParty({ identityKey: "business:buyer", entityType: "importer" })
      )
    ).toMatchObject({
      decision: "deny",
      decisionReason: "supplier_business_not_kyb_verified",
      score: 0,
    });
  });

  it("returns manual_review for an unverified operational activity", () => {
    expect(
      calculateRelationshipEvaluation(
        businessParty({ activityVerificationStatus: "pending" }),
        businessParty({ identityKey: "business:buyer", entityType: "importer" })
      )
    ).toMatchObject({
      decision: "manual_review",
      decisionReason: "supplier_operational_activity_pending_or_unverified",
      score: 50,
    });
  });

  it("returns manual_review for government relationships, not an operational approval", () => {
    expect(
      calculateRelationshipEvaluation(
        businessParty({ entityType: "government_entity" }),
        businessParty({ identityKey: "business:buyer", entityType: "importer" })
      )
    ).toMatchObject({
      decision: "manual_review",
      decisionReason: "government_relationship_out_of_operational_scope",
      score: 50,
    });
  });

  it("denies unsupported Consumer to Factory and Importer relationships", () => {
    const consumer = individualParty({
      activityType: "consumer",
      identityKey: "individual:consumer",
    });
    expect(
      calculateRelationshipEvaluation(
        businessParty({ entityType: "factory" }),
        consumer
      )
    ).toMatchObject({
      decision: "deny",
      relationshipMode: "b2c",
      decisionReason: "consumer_to_factory_not_supported",
      score: 0,
    });
    expect(
      calculateRelationshipEvaluation(
        businessParty({ entityType: "importer" }),
        consumer
      )
    ).toMatchObject({
      decision: "deny",
      relationshipMode: "b2c",
      decisionReason: "consumer_to_importer_not_supported",
      score: 0,
    });
  });

  it("denies every individual commercial relationship until its policy is approved", () => {
    const producer = individualParty({
      activityType: "individual_producer",
      identityKey: "individual:producer",
    });
    const consumer = individualParty({
      activityType: "consumer",
      identityKey: "individual:consumer",
    });
    expect(
      calculateRelationshipEvaluation(
        businessParty({ identityKey: "business:supplier" }),
        producer
      )
    ).toMatchObject({
      decision: "deny",
      relationshipMode: "b2c",
      decisionReason: "individual_commerce_policy_unapproved",
      score: 0,
    });
    expect(
      calculateRelationshipEvaluation(
        producer,
        businessParty({ identityKey: "business:requester" })
      )
    ).toMatchObject({
      decision: "deny",
      relationshipMode: "c2b",
      decisionReason: "individual_commerce_policy_unapproved",
      score: 0,
    });
    expect(calculateRelationshipEvaluation(producer, consumer)).toMatchObject({
      decision: "deny",
      relationshipMode: "c2c",
      decisionReason: "individual_commerce_policy_unapproved",
      score: 0,
    });
  });

  it("denies an individual without verified KYC", () => {
    expect(
      calculateRelationshipEvaluation(
        individualParty({ kycStatus: "pending" }),
        individualParty({
          identityKey: "individual:requester",
          activityType: "consumer",
        })
      )
    ).toMatchObject({
      decision: "deny",
      decisionReason: "supplier_identity_not_kyc_verified",
      score: 0,
    });
  });
});
