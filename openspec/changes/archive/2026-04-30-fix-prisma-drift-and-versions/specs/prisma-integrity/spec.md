# Spec: Prisma Integrity

## ADDED Requirements

### Requirement: Prisma versions SHALL be synchronized

The Prisma CLI and @prisma/client packages SHALL be at the same version to prevent incompatibilities in client generation and migration handling.

#### Scenario: Prisma CLI matches client version
- **WHEN** checking installed versions with `npm list prisma @prisma/client`
- **THEN** both packages SHALL be at version 7.8.0
- **AND** no version mismatch warnings SHALL appear

#### Scenario: Prisma Client regenerates successfully
- **WHEN** running `npx prisma generate` after version update
- **THEN** the command SHALL complete without errors
- **AND** the generated client SHALL be compatible with the schema

### Requirement: Foreign key constraint SHALL exist for pending_owner_id

The `group` table SHALL have a foreign key constraint linking `pending_owner_id` to `user.id_user` to ensure referential integrity.

#### Scenario: Foreign key constraint is created
- **WHEN** the migration is applied to the database
- **THEN** the constraint `group_pending_owner_id_fkey` SHALL exist
- **AND** the constraint SHALL reference `user(id_user)`
- **AND** the constraint SHALL have `ON DELETE SET NULL` behavior

#### Scenario: Invalid pending_owner_id values are rejected
- **WHEN** attempting to insert a `pending_owner_id` that doesn't exist in `user` table
- **THEN** the database SHALL reject the operation with a foreign key violation error

#### Scenario: NULL values are allowed
- **WHEN** inserting or updating a group with `pending_owner_id = NULL`
- **THEN** the operation SHALL succeed
- **AND** no foreign key constraint SHALL be violated

### Requirement: Migration SHALL be created via Prisma CLI

All database schema changes SHALL be managed through Prisma migrations, not manual SQL scripts.

#### Scenario: Migration file is generated
- **WHEN** running `npx prisma migrate dev --name add_pending_owner_fk --create-only`
- **THEN** a new directory SHALL be created in `prisma/migrations/`
- **AND** the directory name SHALL match pattern `[timestamp]_add_pending_owner_fk`
- **AND** the directory SHALL contain a `migration.sql` file

#### Scenario: Migration SQL contains correct ALTER TABLE
- **WHEN** reviewing the generated `migration.sql` file
- **THEN** it SHALL contain `ALTER TABLE "group"`
- **AND** it SHALL contain `ADD CONSTRAINT "group_pending_owner_id_fkey"`
- **AND** it SHALL contain `FOREIGN KEY ("pending_owner_id") REFERENCES "user"("id_user")`

### Requirement: Migration SHALL be applied to production database

The migration SHALL be deployed to the Aiven Cloud production database without causing downtime.

#### Scenario: Migration deploys successfully
- **WHEN** running `npx prisma migrate deploy`
- **THEN** the command SHALL complete without errors
- **AND** the migration SHALL be recorded in `_prisma_migrations` table
- **AND** the foreign key constraint SHALL exist in the database

#### Scenario: No data loss occurs
- **WHEN** the migration is applied
- **THEN** all existing rows in `group` table SHALL remain unchanged
- **AND** no data SHALL be deleted or modified

### Requirement: Schema drift SHALL be eliminated

After applying the migration, there SHALL be no differences between the Prisma schema and the actual database schema.

#### Scenario: Migrate status shows no pending migrations
- **WHEN** running `npx prisma migrate status`
- **THEN** the output SHALL contain "Database schema is up to date!"
- **AND** no pending migrations SHALL be listed

#### Scenario: Migrate diff shows no differences
- **WHEN** running `npx prisma migrate diff --from-schema prisma/schema --to-config-datasource`
- **THEN** the output SHALL be empty or show no differences
- **AND** no "Changed" or "Removed" messages SHALL appear

#### Scenario: Validation passes
- **WHEN** running `npx prisma validate`
- **THEN** the output SHALL contain "The schemas at prisma/schema are valid"
- **AND** no validation errors SHALL be reported

### Requirement: Changes SHALL be committed to version control

All changes including package.json updates and new migration files SHALL be committed to git.

#### Scenario: Package.json is updated
- **WHEN** checking git status after version update
- **THEN** `package.json` SHALL show as modified
- **AND** the diff SHALL show `prisma` version changed to 7.8.0

#### Scenario: Migration files are tracked
- **WHEN** checking git status after migration creation
- **THEN** the new migration directory SHALL be untracked
- **AND** the migration SHALL be added to git before committing

#### Scenario: Commit message is descriptive
- **WHEN** committing the changes
- **THEN** the commit message SHALL mention "prisma" and "foreign key"
- **AND** the commit message SHALL reference the `pending_owner_id` field
