# Spec: EventsController Test Fixes

## Capability

Fix 4 failing tests in `events.controller.spec.ts` by properly configuring mock service and updating filter expectations.

## Requirements

### REQ-1: Fix Controller Instantiation
**Test**: "should be defined"

**Current Issue**: Mock service not properly configured

**Changes**:
- Mock EventsService with all required methods
- Ensure proper return types for each method
- Add EventEmitter2 mock if needed

**Acceptance**:
- Test passes, controller instantiates successfully

### REQ-2: Fix Filter Test (Basic)
**Test**: "should call service with valid filters"

**Current Issue**: Filter expectations don't match controller implementation

**Changes**:
- Verify actual filter parameters passed to service
- Update spy assertions to match
- Ensure query params are correctly transformed

**Acceptance**:
- Test passes, filters are correctly passed to service

### REQ-3: Fix Type Filter Test
**Test**: "should handle type filter correctly"

**Current Issue**: Type filter transformation mismatch

**Changes**:
- Verify how controller transforms `type` query param
- Update mock service expectations
- Ensure EventType enum is handled correctly

**Acceptance**:
- Test passes, type filter works as expected

### REQ-4: Fix Combined Filters Test
**Test**: "should handle combined date and type filters"

**Current Issue**: Multiple filter combination not matching expectations

**Changes**:
- Verify controller combines filters correctly
- Update assertions for combined filter object
- Ensure date parsing works correctly

**Acceptance**:
- Test passes, combined filters work correctly

## Test Scenarios

### Scenario 1: Controller Instantiates with Mocked Service
**Given**: Test module with mocked EventsService  
**When**: Controller is created  
**Then**: Controller is defined without errors

### Scenario 2: Basic Filters Are Passed Through
**Given**: Request with query params  
**When**: `findAll()` is called  
**Then**: Service receives correct filter object

### Scenario 3: Type Filter Is Transformed
**Given**: Request with `type` query param  
**When**: `findAll()` is called  
**Then**: Service receives EventType enum value

### Scenario 4: Date and Type Filters Combine
**Given**: Request with both date and type params  
**When**: `findAll()` is called  
**Then**: Service receives combined filter object with both

## Implementation Notes

- Read actual controller code to understand filter transformation
- Mock service should return FEN-formatted responses
- Use `jest.spyOn()` to verify service method calls
- Don't change controller logic, only test expectations
- Ensure query param types match controller expectations
