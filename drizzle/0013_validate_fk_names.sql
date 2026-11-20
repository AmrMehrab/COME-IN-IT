-- Legacy FK-name normalization is handled by scripts/normalizeLegacyForeignKeys.ts
-- when explicitly run against a verified development database. The source migrations
-- now create canonical short names directly, so this migration is a no-op on clean installs.
SELECT 1;
