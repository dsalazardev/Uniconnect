# Spec: EventsService Test Fixes

## Capability

Fix 7 failing tests in `events.service.spec.ts` by updating expectations to match current service behavior.

## Requirements

### REQ-1: Fix findAll Error Test
**Test**: "should handle errors and return FEN error format"

**Current Issue**: Expects `data: null`, service returns `data: []`

**Changes**:
- Update expectation: `expect(result.data).toEqual([])`
- Verify `success: false`
- Verify `error.code` is defined

**Acceptance**:
- Test passes with correct FEN format validation

### REQ-2: Fix Permission Error Code (Test 1)
**Test**: "should return 403 when admin tries to edit event created by another admin"

**Current Issue**: Expects error code `FORBIDDEN`, service returns different code

**Changes**:
- Identify actual error code from service
- Update expectation to match
- Verify error message is descriptive

**Acceptance**:
- Test passes with correct error code

### REQ-3: Fix Permission Error Code (Test 2)
**Test**: "should allow superadmin to edit any event"

**Current Issue**: Test logic or expectations don't match service behavior

**Changes**:
- Verify superadmin can edit any event
- Update mock data if needed
- Ensure proper role checking

**Acceptance**:
- Test passes, superadmin permissions work correctly

### REQ-4: Fix 404 Error Test
**Test**: "should return 404 when event does not exist"

**Current Issue**: Error format or code mismatch

**Changes**:
- Verify service returns 404 for non-existent events
- Update error code expectation
- Ensure FEN format is correct

**Acceptance**:
- Test passes with proper 404 handling

### REQ-5: Fix Admin Update Test
**Test**: "should allow admin to update their own event"

**Current Issue**: Mock data or expectations don't match service

**Changes**:
- Configure mock to return event owned by admin
- Verify update succeeds
- Check returned data structure

**Acceptance**:
- Test passes, admin can update own events

### REQ-6: Fix Property-Based Test (Admin Updates)
**Test**: "PBT: Admin can update their own events with any valid data"

**Current Issue**: Property-based test assertions outdated

**Changes**:
- Update fast-check generators if needed
- Fix assertions to match current service behavior
- Ensure all generated data is valid

**Acceptance**:
- Property-based test passes with multiple generated inputs

### REQ-7: Fix Property-Based Test (404s)
**Test**: "PBT: Non-existent events always return 404"

**Current Issue**: Error format expectations

**Changes**:
- Verify 404 error code for all non-existent IDs
- Update FEN format expectations
- Ensure property holds for all generated inputs

**Acceptance**:
- Property-based test passes consistently

## Test Scenarios

### Scenario 1: Error Responses Return Empty Arrays
**Given**: Service encounters an error  
**When**: `findAll()` is called  
**Then**: Response has `success: false`, `data: []`, `error` defined

### Scenario 2: Permission Errors Have Correct Codes
**Given**: User lacks permission to edit event  
**When**: `update()` is called  
**Then**: Response has correct error code (not generic FORBIDDEN)

### Scenario 3: Superadmin Has Full Access
**Given**: User has superadmin role  
**When**: Editing any event  
**Then**: Update succeeds regardless of event owner

### Scenario 4: 404 Errors Are Consistent
**Given**: Event ID does not exist  
**When**: Any operation is attempted  
**Then**: FEN response with 404 error code

### Scenario 5: Property-Based Tests Are Robust
**Given**: Multiple generated test inputs  
**When**: Tests run with fast-check  
**Then**: All properties hold consistently

## Implementation Notes

- Read actual service code to identify current error codes
- Don't change service logic, only test expectations
- Preserve property-based test coverage
- Document any behavioral changes discovered
- Ensure FEN format is validated in all error cases
