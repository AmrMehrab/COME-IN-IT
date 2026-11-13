import { describe, expect, it } from "vitest";
import {
  createInitialSimulationState,
  demoScenarios,
  executeSimulationCommand,
  evaluateDemoPermission,
  type SimulationState,
} from "../client/src/data/liveSimulationData";
import { investorTourStages } from "../client/src/data/investorTourData";

const runScenario = (scenarioId: string) => {
  const scenario = demoScenarios.find(item => item.id === scenarioId);
  if (!scenario) throw new Error(`Missing scenario: ${scenarioId}`);

  return scenario.steps.reduce(
    (current, command) => executeSimulationCommand(current, command).state,
    createInitialSimulationState(),
  );
};

describe("محرك المحاكاة الحية", () => {
  it("ينفذ سلسلة B2B بعد جميع بوابات الثقة فقط", () => {
    const state = runScenario("b2b-trust-chain");

    expect(state.personas.find(person => person.id === "lina")?.kycStatus).toBe("verified");
    expect(state.businesses.find(business => business.id === "nile-factory")).toMatchObject({
      kybStatus: "verified",
      membershipActive: true,
    });
    expect(state.offerings).toHaveLength(1);
    expect(state.offerings[0]?.status).toBe("verified");
    expect(state.demands).toHaveLength(1);
    expect(state.matches).toEqual([expect.objectContaining({ status: "eligible", score: 92 })]);
    expect(state.audit).toHaveLength(10);
    expect(state.audit.every(event => event.result === "allowed")).toBe(true);
  });

  it("يرفض إنشاء عرض تجاري قبل استيفاء KYC وKYB والعضوية", () => {
    const state = createInitialSimulationState();
    const command = { action: "create_offering" as const, actorId: "lina", mode: "b2b" as const, label: "اختبار عرض مبكر" };

    const decision = evaluateDemoPermission(state, command);
    const result = executeSimulationCommand(state, command);

    expect(decision).toMatchObject({ allowed: false, rule: "SIM-TRADE-001" });
    expect(result.state.offerings).toHaveLength(0);
    expect(result.state.audit[0]).toMatchObject({ result: "denied", classification: "verified" });
  });

  it("يقصر رؤية المؤشرات المجمعة على الدور الحكومي أو مراجعة الامتثال", () => {
    const state = createInitialSimulationState();
    const governmentView = evaluateDemoPermission(state, { action: "view_aggregate", actorId: "gov", mode: "b2g", label: "عرض مجمع" });
    const marketView = evaluateDemoPermission(state, { action: "view_aggregate", actorId: "samir", mode: "b2g", label: "محاولة عرض" });

    expect(governmentView.allowed).toBe(true);
    expect(marketView).toMatchObject({ allowed: false, rule: "SIM-VISIBILITY-001" });
  });

  it("يبدأ كل تشغيل بحالة مستقلة ولا ينشئ أي محتوى سريري أو مفاتيح Healthcare", () => {
    const first = createInitialSimulationState();
    const second = createInitialSimulationState();
    const mutated = executeSimulationCommand(first, { action: "create_demand", actorId: "huda", mode: "c2b", label: "طلب خيالي" }).state;
    const serialized = JSON.stringify(mutated satisfies SimulationState).toLowerCase();

    expect(second.demands).toHaveLength(0);
    expect(serialized).not.toContain("health");
    expect(serialized).not.toContain("clinical");
    expect(serialized).not.toContain("patient");
  });

  it("يربط عرض المستثمر بمسارات المحاكاة المحلية فقط ولا يقدم ادعاءات مالية", () => {
    const scenarioIds = new Set(demoScenarios.map(item => item.id));
    const serialized = JSON.stringify(investorTourStages).toLowerCase();

    expect(investorTourStages).toHaveLength(4);
    expect(investorTourStages.every(stage => scenarioIds.has(stage.scenarioId))).toBe(true);
    expect(serialized).not.toContain("revenue");
    expect(serialized).not.toContain("healthcare");
  });
});
