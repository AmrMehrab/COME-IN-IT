import { describe, expect, it } from "vitest";
import { getPrototypeJourney, prototypeJourneys, prototypeProgress } from "../client/src/data/prototypeData";

describe("interactive product prototype", () => {
  it("keeps every journey local, trade-scoped, and mapped to an existing dashboard tab", () => {
    const allowedDestinations = new Set([
      "verification",
      "commercial-capabilities",
      "trade-operations",
      "permissions",
      "live-simulation",
    ]);

    expect(prototypeJourneys.map((journey) => journey.id)).toEqual(["business", "individual", "review"]);
    expect(prototypeJourneys.flatMap((journey) => journey.stages).every((stage) => allowedDestinations.has(stage.destination))).toBe(true);
    expect(JSON.stringify(prototypeJourneys).toLowerCase()).not.toContain("healthcare");
  });

  it("models the business path as a verified B2B route and retains a human review decision for the individual path", () => {
    const business = getPrototypeJourney("business");
    const individual = getPrototypeJourney("individual");

    expect(business.model).toBe("B2B");
    expect(business.stages.at(-1)).toMatchObject({
      gate: "relationship decision = allow",
      decision: "ready",
    });
    expect(individual.stages.some((stage) => stage.decision === "review")).toBe(true);
  });

  it("clamps progress values to a valid journey range", () => {
    expect(prototypeProgress(-2, 4)).toBe(0);
    expect(prototypeProgress(0, 4)).toBe(0);
    expect(prototypeProgress(1, 4)).toBe(33);
    expect(prototypeProgress(10, 4)).toBe(100);
    expect(prototypeProgress(0, 1)).toBe(100);
  });
});
