import { describe, expect, it } from "vitest";
import { users } from "../drizzle/schema";
import { completeFounderBootstrap } from "./founderBootstrap";

describe("founder bootstrap endpoint security", () => {
  it("rejects an ordinary account before reading or saving identity data", async () => {
    const ordinaryUser = {
      id: 42,
      openId: "ordinary-test-account",
      role: "user",
    } as typeof users.$inferSelect;

    await expect(
      completeFounderBootstrap(ordinaryUser, {
        legalName: "Test Only",
        nationalId: "not-used",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
