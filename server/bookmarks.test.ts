import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  listSpecificationBookmarks: vi.fn(),
  toggleSpecificationBookmark: vi.fn(),
  listBusinessEntitiesForUser: vi.fn(),
  createBusinessEntityForUser: vi.fn(),
  updateBusinessEntityForUser: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "persistent-user",
      email: "owner@example.com",
      name: "Persistent User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("bookmarks router", () => {
  it("returns only the caller's persisted specification bookmarks", async () => {
    vi.mocked(db.listSpecificationBookmarks).mockResolvedValue([1, 7, 25]);
    const caller = appRouter.createCaller(createAuthenticatedContext());

    await expect(caller.bookmarks.list()).resolves.toEqual([1, 7, 25]);
    expect(db.listSpecificationBookmarks).toHaveBeenCalledWith(42);
  });

  it("toggles a bookmark with the authenticated user as its owner", async () => {
    vi.mocked(db.toggleSpecificationBookmark).mockResolvedValue({ bookmarked: true });
    const caller = appRouter.createCaller(createAuthenticatedContext());

    await expect(caller.bookmarks.toggle({ sectionId: 8 })).resolves.toEqual({ bookmarked: true });
    expect(db.toggleSpecificationBookmark).toHaveBeenCalledWith(42, 8);
  });

  it("creates a business entity under the authenticated account only", async () => {
    vi.mocked(db.createBusinessEntityForUser).mockResolvedValue({ id: 9 } as never);
    const caller = appRouter.createCaller(createAuthenticatedContext());

    await caller.businesses.create({ legalName: "منشأة الاختبار", entityType: "factory" });
    expect(db.createBusinessEntityForUser).toHaveBeenCalledWith(42, {
      legalName: "منشأة الاختبار",
      entityType: "factory",
    });
  });
});
