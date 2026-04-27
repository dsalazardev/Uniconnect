# Spec: AppController Test Fix

## Capability

Fix 1 failing test in `app.controller.spec.ts` by identifying and using the correct method name.

## Requirements

### REQ-1: Identify Actual Method Name
**Action**: Read `src/app.controller.ts`

**Steps**:
1. Check if `getHello()` exists
2. Check if method was renamed (e.g., `getRoot()`, `index()`, `health()`)
3. Verify method signature and return type

**Acceptance**:
- Actual method name identified

### REQ-2: Update Test to Use Correct Method
**Test**: "should return 'Hello World!'"

**Current Issue**: `getHello()` is not a function

**Changes**:
- Update test to call actual method name
- Update expectation if return value changed
- Ensure mock service (if any) is configured correctly

**Acceptance**:
- Test passes with correct method call

### REQ-3: Verify Return Value
**Action**: Ensure expected return value matches actual

**Steps**:
1. Check what the method actually returns
2. Update expectation if needed
3. Verify test assertion is correct

**Acceptance**:
- Test assertion matches actual return value

## Test Scenarios

### Scenario 1: Method Exists and Returns Expected Value
**Given**: AppController with root method  
**When**: Method is called  
**Then**: Returns expected string or object

### Scenario 2: Method Name Changed
**Given**: Method was renamed from `getHello()`  
**When**: Test uses new method name  
**Then**: Test passes without errors

## Implementation Notes

- This is likely a simple method name mismatch
- Check if AppController was refactored recently
- Preserve test intent (verify root endpoint works)
- Update test name if method name changed significantly
