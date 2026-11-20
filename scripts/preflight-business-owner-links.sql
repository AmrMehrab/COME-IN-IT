-- CIT-DEV-001: read-only preflight for the development database only.
-- Run before applying drizzle/0016_cit_dev_001_owner_integrity.sql. Do not run against Production.
-- Any non-zero mismatch count must be resolved by repairing the relationship,
-- not by deleting business, person, user, or membership records.

-- Canonical ID / FK column types expected by drizzle/schema.ts (signed INT).
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND (
    (TABLE_NAME = 'users' AND COLUMN_NAME = 'id') OR
    (TABLE_NAME = 'persons' AND COLUMN_NAME IN ('id', 'userId')) OR
    (TABLE_NAME = 'business_entities' AND COLUMN_NAME IN ('id', 'ownerUserId', 'ownerPersonId')) OR
    (TABLE_NAME = 'business_memberships' AND COLUMN_NAME IN ('id', 'businessId', 'userId', 'personId'))
  )
ORDER BY TABLE_NAME, COLUMN_NAME;

-- An owner person must belong to the same OAuth user as business_entities.ownerUserId.
SELECT 'business_owner_person_user_mismatch' AS check_name, COUNT(*) AS invalid_rows
FROM business_entities b
JOIN persons p ON p.id = b.ownerPersonId
WHERE p.userId <> b.ownerUserId;

-- A membership person must belong to the same OAuth user as business_memberships.userId.
SELECT 'membership_person_user_mismatch' AS check_name, COUNT(*) AS invalid_rows
FROM business_memberships m
JOIN persons p ON p.id = m.personId
WHERE p.userId <> m.userId;

-- Report any active owner memberships that do not point to the entity's stored owner.
SELECT 'active_owner_membership_mismatch' AS check_name, COUNT(*) AS invalid_rows
FROM business_memberships m
JOIN business_entities b ON b.id = m.businessId
WHERE m.membershipRole = 'owner'
  AND m.status = 'active'
  AND (m.userId <> b.ownerUserId OR m.personId <> b.ownerPersonId);
