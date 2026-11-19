import { createConnection, type RowDataPacket } from "mysql2/promise";

const legacyKeys = [
  {
    table: "business_activity_verifications",
    oldName: "business_activity_verifications_businessId_business_entities_id_fk",
    newName: "business_activity_business_fk",
    column: "businessId",
    parent: "business_entities",
    parentColumn: "id",
    onDelete: "RESTRICT",
  },
  {
    table: "health_emergency_access_requests",
    oldName: "health_emergency_access_requests_healthProfileId_health_profiles_id_fk",
    newName: "health_emergency_profile_fk",
    column: "healthProfileId",
    parent: "health_profiles",
    parentColumn: "id",
    onDelete: "RESTRICT",
  },
  {
    table: "health_emergency_access_requests",
    oldName: "health_emergency_access_requests_providerId_health_providers_id_fk",
    newName: "health_emergency_provider_fk",
    column: "providerId",
    parent: "health_providers",
    parentColumn: "id",
    onDelete: "RESTRICT",
  },
  {
    table: "health_record_references",
    oldName: "health_record_references_amendsRecordId_health_record_references_id_fk",
    newName: "health_record_refs_amends_fk",
    column: "amendsRecordId",
    parent: "health_record_references",
    parentColumn: "id",
    onDelete: "RESTRICT",
  },
  {
    table: "trade_demands",
    oldName: "trade_demands_requesterIndividualProfileId_individual_activity_profiles_id_fk",
    newName: "trade_demands_individual_fk",
    column: "requesterIndividualProfileId",
    parent: "individual_activity_profiles",
    parentColumn: "id",
    onDelete: "RESTRICT",
  },
  {
    table: "trade_offerings",
    oldName: "trade_offerings_individualProfileId_individual_activity_profiles_id_fk",
    newName: "trade_offerings_individual_fk",
    column: "individualProfileId",
    parent: "individual_activity_profiles",
    parentColumn: "id",
    onDelete: "RESTRICT",
  },
  {
    table: "trade_transactions",
    oldName: "trade_transactions_buyerIndividualProfileId_individual_activity_profiles_id_fk",
    newName: "trade_tx_buyer_individual_fk",
    column: "buyerIndividualProfileId",
    parent: "individual_activity_profiles",
    parentColumn: "id",
    onDelete: "RESTRICT",
  },
  {
    table: "trade_transactions",
    oldName: "trade_transactions_sellerIndividualProfileId_individual_activity_profiles_id_fk",
    newName: "trade_tx_seller_individual_fk",
    column: "sellerIndividualProfileId",
    parent: "individual_activity_profiles",
    parentColumn: "id",
    onDelete: "RESTRICT",
  },
  {
    table: "trade_transactions",
    oldName: "trade_transactions_ownerIndividualProfileId_individual_activity_profiles_id_fk",
    newName: "trade_tx_owner_individual_fk",
    column: "ownerIndividualProfileId",
    parent: "individual_activity_profiles",
    parentColumn: "id",
    onDelete: "SET NULL",
  },
] as const;

async function main() {
  if (process.env.DATABASE_TARGET !== "development") {
    throw new Error("Refusing to connect: set DATABASE_TARGET=development only after verifying the target database");
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const apply = process.argv.includes("--apply");
  const connection = await createConnection(databaseUrl);

  try {
    for (const fk of legacyKeys) {
      const [tables] = await connection.execute<RowDataPacket[]>(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
        [fk.table],
      );
      if (tables.length === 0) continue;

      const [constraints] = await connection.execute<RowDataPacket[]>(
        "SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME IN (?, ?)",
        [fk.table, fk.oldName, fk.newName],
      );
      const names = new Set(constraints.map(row => String(row.CONSTRAINT_NAME)));
      const hasLegacy = names.has(fk.oldName);
      const hasCanonical = names.has(fk.newName);
      if (!hasLegacy) continue;

      console.log(`${apply ? "APPLY" : "DRY RUN"}: ${fk.table}.${fk.oldName} -> ${fk.newName}`);
      if (!apply) continue;

      await connection.execute(`ALTER TABLE \`${fk.table}\` DROP FOREIGN KEY \`${fk.oldName}\``);
      if (!hasCanonical) {
        await connection.execute(
          `ALTER TABLE \`${fk.table}\` ADD CONSTRAINT \`${fk.newName}\` FOREIGN KEY (\`${fk.column}\`) REFERENCES \`${fk.parent}\`(\`${fk.parentColumn}\`) ON DELETE ${fk.onDelete} ON UPDATE NO ACTION`,
        );
      }
    }
    if (!apply) console.log("No changes made. Re-run with --apply only for a confirmed development database.");
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : "Legacy FK normalization failed");
  process.exitCode = 1;
});
