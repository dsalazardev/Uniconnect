# Tasks: Fix Prisma Drift and Versions

## 1. Pre-flight Validation

- [x] 1.1 Verify current Prisma versions with `npm list prisma @prisma/client`
- [x] 1.2 Run `npx prisma migrate status` to confirm current state
- [x] 1.3 Run `npx prisma migrate diff --from-schema prisma/schema --to-config-datasource` to confirm drift
- [x] 1.4 Check for orphaned data: `SELECT pending_owner_id FROM "group" WHERE pending_owner_id IS NOT NULL AND pending_owner_id NOT IN (SELECT id_user FROM "user")`

## 2. Update Prisma CLI Version

- [x] 2.1 Update Prisma CLI to 7.8.0: `npm install prisma@7.8.0 --save-dev`
- [x] 2.2 Verify installation: `npx prisma --version` should show 7.8.0
- [x] 2.3 Verify package.json shows `"prisma": "^7.8.0"` in devDependencies

## 3. Create Migration for Foreign Key

- [x] 3.1 Create migration: `npx prisma migrate dev --name add_pending_owner_fk --create-only`
- [x] 3.2 Locate generated migration file in `prisma/migrations/[timestamp]_add_pending_owner_fk/`
- [x] 3.3 Review `migration.sql` to verify it contains correct ALTER TABLE statement
- [x] 3.4 Verify SQL includes: `ADD CONSTRAINT "group_pending_owner_id_fkey"`
- [x] 3.5 Verify SQL includes: `FOREIGN KEY ("pending_owner_id") REFERENCES "user"("id_user")`
- [x] 3.6 Verify SQL includes: `ON DELETE SET NULL ON UPDATE CASCADE`

## 4. Apply Migration to Production

- [x] 4.1 Apply migration to Aiven Cloud: `npx prisma migrate deploy`
- [x] 4.2 Verify migration was applied: check command output for success message
- [x] 4.3 Verify migration is recorded: `npx prisma migrate status` should show "up to date"

## 5. Regenerate Prisma Client

- [x] 5.1 Regenerate Prisma Client: `npx prisma generate`
- [x] 5.2 Verify client generation completed without errors
- [x] 5.3 Check timestamp of generated client: `stat node_modules/.prisma/client/index.js`

## 6. Validation

- [x] 6.1 Run `npx prisma migrate status` - should show "Database schema is up to date!"
- [x] 6.2 Run `npx prisma migrate diff --from-schema prisma/schema --to-config-datasource` - should show no differences
- [x] 6.3 Run `npx prisma validate` - should show "schemas are valid"
- [x] 6.4 Verify foreign key exists in database (optional manual check via SQL client)

## 7. Testing

- [x] 7.1 Run backend tests: `npm test`
- [x] 7.2 Verify all 316 tests pass
- [x] 7.3 Test group creation with pending_owner_id in development
- [x] 7.4 Test that invalid pending_owner_id is rejected by database

## 8. Commit Changes

- [x] 8.1 Stage package.json: `git add package.json package-lock.json`
- [x] 8.2 Stage migration files: `git add prisma/migrations/`
- [x] 8.3 Commit with descriptive message: `git commit -m "fix(prisma): sync versions to 7.8.0 and add pending_owner_id foreign key"`
- [x] 8.4 Push to remote: `git push origin dev`
