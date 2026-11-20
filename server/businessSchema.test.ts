import { describe, expect, it } from "vitest";
import { businessEntities, businessMemberships, persons, users } from "../drizzle/schema";

describe("business identity schema invariants", () => {
  it("uses the same signed INT type for user, person, business, and membership keys", () => {
    const foreignKeyColumns = [
      users.id,
      persons.id,
      persons.userId,
      businessEntities.id,
      businessEntities.ownerUserId,
      businessEntities.ownerPersonId,
      businessMemberships.id,
      businessMemberships.businessId,
      businessMemberships.userId,
      businessMemberships.personId,
    ];

    expect(foreignKeyColumns.map(column => column.getSQLType())).toEqual(Array(10).fill("int"));
  });
});
