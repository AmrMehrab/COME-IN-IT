import { describe, expect, it } from "vitest";
import { businessEntities, businessMemberships, persons, users } from "../drizzle/schema";

describe("business identity schema invariants", () => {
  it("matches every foreign-key column type to its referenced primary key", () => {
    expect(persons.userId.getSQLType()).toBe(users.id.getSQLType());
    expect(businessEntities.ownerUserId.getSQLType()).toBe(users.id.getSQLType());
    expect(businessMemberships.userId.getSQLType()).toBe(users.id.getSQLType());

    expect(businessEntities.ownerPersonId.getSQLType()).toBe(persons.id.getSQLType());
    expect(businessMemberships.personId.getSQLType()).toBe(persons.id.getSQLType());

    expect(businessMemberships.businessId.getSQLType()).toBe(businessEntities.id.getSQLType());
  });
});
