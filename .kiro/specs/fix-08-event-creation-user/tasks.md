# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - JWT User ID Type Conversion Bug
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that POST /events with valid JWT containing string user ID fails with "Usuario no encontrado" error
  - Verify that user exists in database but query with string ID fails while numeric ID succeeds
  - Test edge case: JWT with non-numeric ID "abc" should fail appropriately
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Event Creation Operations
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for JWT authentication in other endpoints
  - Observe behavior for non-event database operations
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Fix for JWT User ID Type Conversion

  - [x] 3.1 Revisar y refactorizar la extracción del token y el paso de parámetros en `events.controller.ts`
    - Implement explicit type conversion from string to number for user ID from JWT
    - Add validation to verify converted ID is not NaN
    - Add error handling for invalid IDs (return 400 with descriptive message)
    - Validate converted ID is positive integer within valid range
    - _Bug_Condition: isBugCondition(input) where input.hasValidJWT = true AND typeof(input.userIdFromJWT) = "string"_
    - _Expected_Behavior: Successful conversion of user ID to integer before database queries_
    - _Preservation: JWT authentication in other endpoints must remain unchanged_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

  - [x] 3.2 Revisar y refactorizar la validación de usuario en el método `create` de `events.service.ts`
    - Ensure service receives user ID as number type
    - Add defensive type validation in service layer
    - Update service interface if necessary to enforce number type
    - Add documentation for type conversion requirements
    - _Bug_Condition: Service receives string ID and passes directly to Prisma_
    - _Expected_Behavior: Service processes numeric user ID correctly_
    - _Preservation: Other service operations must remain unchanged_
    - _Requirements: 2.2, 2.3, 3.1_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - JWT User ID Type Conversion Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Event Creation Operations
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Ejecutar compilación y tests del backend para asegurar que no hay regresiones
  - Run full backend compilation to check for type errors
  - Execute existing test suite to verify no regressions
  - Verify all authentication flows continue working
  - Check database integrity and referential constraints
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Actualizar `AGENTS.md` si hubo cambios en los decoradores de autenticación
  - Document any changes to authentication decorators or JWT handling
  - Update context documentation if controller or service interfaces changed
  - Add notes about type conversion requirements for future development
  - Include examples of correct JWT user ID handling
  - _Requirements: Documentation and maintenance_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.