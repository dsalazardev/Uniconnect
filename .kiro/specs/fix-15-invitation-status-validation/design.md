# FIX-15: Invitation Status Validation Bugfix Design

## Overview

This design document addresses the invitation status inconsistency bug where invitations remain in `status !== 'pending'` without a corresponding membership record. The bug prevents users from accepting invitations that should be processable, resulting in HTTP 400 errors with the message "Esta invitación ya fue respondida anteriormente".

The fix implements atomic transactions using Prisma's `$transaction` API, adds membership existence validation before rejecting requests, and implements idempotent behavior to handle edge cases gracefully. The solution ensures data consistency while maintaining backward compatibility with existing functionality.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when `invitation.status !== 'pending'` but no corresponding membership exists for the user in the group
- **Property (P)**: The desired behavior - invitations with inconsistent state should be processed successfully or return descriptive error messages (not generic HTTP 400)
- **Preservation**: Existing behavior for legitimate cases (pending invitations, already-responded with membership, permission checks) that must remain unchanged
- **respondToInvitation**: The function in `src/group-invitations/group-invitations.service.ts` (line 164) that processes invitation acceptance/rejection
- **Atomic Transaction**: A database operation that either completes entirely or rolls back completely, ensuring data consistency
- **Idempotency**: The property where multiple identical requests produce the same result without side effects
- **Inconsistent State**: When `invitation.status = 'accepted'` but no membership record exists, indicating a partial transaction failure

## Bug Details

### Bug Condition

The bug manifests when a user attempts to accept an invitation that has `status !== 'pending'` but lacks a corresponding membership record. The `respondToInvitation` function validates status at line 201 and rejects the request without checking if the membership was actually created.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type InvitationRespondInput
  OUTPUT: boolean
  
  invitation ← database.findInvitation(input.invitationId)
  membership ← database.findMembership(input.userId, invitation.id_group)
  
  RETURN invitation EXISTS
         AND invitation.invitee_id = input.userId
         AND invitation.status ≠ 'pending'
         AND input.status = 'accepted'
         AND membership DOES_NOT_EXIST
END FUNCTION
```

### Examples

- **Example 1**: Invitation ID 3 has `status = 'accepted'` and `responded_at = '2025-01-15T10:05:00Z'`, but no membership exists for user 1 in group 5. User attempts to accept → HTTP 400 error
- **Example 2**: Transaction fails after updating invitation status but before creating membership due to database connection timeout → Invitation stuck in 'accepted' state without membership
- **Example 3**: Concurrent requests process the same invitation simultaneously → One creates membership, other fails, leaving inconsistent state
- **Edge Case**: User manually modified invitation status in database without creating membership → System should detect and correct the inconsistency

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Invitations in legitimate 'pending' state must continue to process normally with HTTP 200
- Invitations already responded with existing membership must continue to return HTTP 400 "Esta invitación ya fue respondida anteriormente"
- Permission validation (invitee_id check) must continue to return HTTP 403 for unauthorized users
- Non-existent invitations must continue to return HTTP 404
- Rejection operations (status: 'rejected') must continue to work identically without creating membership
- WebSocket events (GROUP_INVITATION_ACCEPTED, USER_JOINED_GROUP, GROUP_INVITATION_REJECTED) must continue to emit correctly
- Other endpoints (GET pending, POST send, DELETE cancel) must function without regressions

**Scope:**
All inputs that do NOT involve the bug condition (inconsistent invitation state) should be completely unaffected by this fix. This includes:
- Normal invitation acceptance flow (pending → accepted with membership creation)
- Invitation rejection flow (pending → rejected without membership)
- Permission checks for wrong user attempting to respond
- Queries for pending invitations
- Invitation sending and cancellation operations

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Non-Atomic Operations**: The current implementation (lines 207-230) performs two separate database operations:
   - Line 207-213: Update invitation status
   - Line 217-224: Create membership
   - If the second operation fails, the first persists, creating inconsistent state

2. **Missing Rollback Mechanism**: No transaction wrapper ensures both operations succeed or both fail together

3. **Lack of Idempotency Check**: The function doesn't check if membership already exists before rejecting non-pending invitations, preventing recovery from partial failures

4. **Race Condition Vulnerability**: Concurrent requests can both pass the `status === 'pending'` check (line 201) and attempt to create duplicate memberships, with one failing and leaving inconsistent state

5. **No State Recovery Logic**: The system has no mechanism to detect and correct inconsistent states that may have been created by previous failures

## Correctness Properties

Property 1: Bug Condition - Inconsistent Invitation State Recovery

_For any_ invitation where the bug condition holds (status is not 'pending' but no membership exists), the fixed respondToInvitation function SHALL either create the missing membership and return HTTP 200 with success message, or return HTTP 409 with a descriptive error message indicating the actual state conflict.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Preservation - Non-Buggy Input Behavior

_For any_ input where the bug condition does NOT hold (pending invitations, already-responded with membership, permission violations, non-existent invitations), the fixed function SHALL produce exactly the same HTTP status codes, error messages, and side effects as the original function, preserving all existing validation logic and business rules.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/group-invitations/group-invitations.service.ts`

**Function**: `respondToInvitation` (lines 164-260)

**Specific Changes**:

1. **Add Membership Existence Check Before Status Validation**:
   - After line 195 (invitation not found check), add query to check if membership already exists
   - If membership exists and invitation status is 'accepted', return idempotent success response
   - If membership exists but invitation status is 'rejected' or 'pending', return HTTP 409 conflict error

2. **Wrap Status Update and Membership Creation in Atomic Transaction**:
   - Replace lines 207-230 with `prisma.$transaction()` wrapper
   - Ensure both invitation update and membership creation succeed or both fail
   - Use Prisma's transaction API: `await this.prisma.$transaction([updateOp, createOp])`

3. **Add Defensive Logging for Debugging**:
   - Log invitation state before validation (already exists at line 188)
   - Log membership existence check result
   - Log transaction start and completion
   - Log any errors with full context (invitation ID, user ID, status)

4. **Implement Idempotent Behavior for Acceptance**:
   - If user is already a member (membership exists), return success message instead of error
   - Message: "Ya eres miembro de este grupo" with HTTP 200
   - Emit events only if membership was newly created (not if already existed)

5. **Add Unique Constraint Handling for Race Conditions**:
   - Wrap transaction in try/catch for Prisma error P2002 (unique constraint violation)
   - If P2002 occurs on membership creation, query membership and return idempotent success
   - This handles concurrent requests attempting to create the same membership

### Pseudocode for Fixed Implementation

```typescript
async respondToInvitation(invitationId, userId, respondDto) {
  // 0. Defensive type validation (already exists)
  validateUserId(userId);
  
  // 1. Fetch invitation (already exists)
  invitation ← findInvitation(invitationId);
  if (!invitation) throw NotFoundException;
  
  // 2. Permission check (already exists)
  if (invitation.invitee_id ≠ userId) throw ForbiddenException;
  
  // 3. NEW: Check if membership already exists (idempotency)
  existingMembership ← findMembership(userId, invitation.id_group);
  
  if (existingMembership EXISTS) {
    if (invitation.status = 'accepted') {
      // Idempotent success - user is already a member
      return { statusCode: 200, message: "Ya eres miembro de este grupo" };
    } else {
      // Conflict - membership exists but invitation not accepted
      return { statusCode: 409, message: "Estado inconsistente detectado" };
    }
  }
  
  // 4. MODIFIED: Status validation with better error message
  if (invitation.status ≠ 'pending') {
    // No membership exists but status is not pending - inconsistent state
    if (respondDto.status = 'accepted') {
      // Allow recovery by processing as if pending
      log.warn("Inconsistent state detected, attempting recovery");
    } else {
      throw BadRequestException("Esta invitación ya fue respondida anteriormente");
    }
  }
  
  // 5. NEW: Atomic transaction for acceptance
  if (respondDto.status = 'accepted') {
    try {
      result ← prisma.$transaction([
        // Update invitation status
        prisma.group_invitation.update({
          where: { id_invitation: invitationId },
          data: { status: 'accepted', responded_at: now() }
        }),
        // Create membership
        prisma.membership.create({
          data: { id_user: userId, id_group: invitation.id_group, is_admin: false }
        })
      ]);
      
      // Emit events
      emit(GROUP_INVITATION_ACCEPTED);
      emit(USER_JOINED_GROUP);
      
      return { statusCode: 200, message: "Invitación aceptada" };
      
    } catch (error) {
      if (error.code = 'P2002') {
        // Race condition - membership was created by concurrent request
        membership ← findMembership(userId, invitation.id_group);
        if (membership EXISTS) {
          return { statusCode: 200, message: "Ya eres miembro de este grupo" };
        }
      }
      throw error;
    }
  }
  
  // 6. Rejection flow (unchanged)
  if (respondDto.status = 'rejected') {
    updateInvitation(invitationId, { status: 'rejected', responded_at: now() });
    emit(GROUP_INVITATION_REJECTED);
    return { statusCode: 200, message: "Invitación rechazada" };
  }
}
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Create invitations with inconsistent state (status = 'accepted' without membership) in test database, then attempt to accept them using the UNFIXED code. Observe failures and understand the root cause.

**Test Cases**:
1. **Inconsistent Accepted State Test**: Create invitation with status='accepted', responded_at set, but no membership. Attempt to accept → Should fail with HTTP 400 on unfixed code
2. **Inconsistent Rejected State Test**: Create invitation with status='rejected' but no membership. Attempt to accept → Should fail with HTTP 400 on unfixed code
3. **Concurrent Request Simulation**: Send two simultaneous accept requests for same pending invitation → One should succeed, other may create inconsistent state on unfixed code
4. **Transaction Failure Simulation**: Mock Prisma to fail membership creation after status update → Should leave invitation in 'accepted' state without membership on unfixed code

**Expected Counterexamples**:
- HTTP 400 "Esta invitación ya fue respondida anteriormente" when invitation has non-pending status but no membership
- Possible causes: non-atomic operations, missing rollback, lack of idempotency check, race conditions

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result ← respondToInvitation_fixed(input.invitationId, input.userId, { status: 'accepted' })
  
  ASSERT (
    (result.statusCode = 200 OR result.statusCode = 409) AND
    
    // If recovered successfully, membership must exist
    (result.statusCode = 200 IMPLIES 
      EXISTS membership WHERE 
        membership.id_user = input.userId AND 
        membership.id_group = input.id_group
    ) AND
    
    // If conflict detected, error message must be descriptive
    (result.statusCode = 409 IMPLIES 
      result.message CONTAINS "inconsistente" OR
      result.message CONTAINS "ya es miembro"
    )
  )
END FOR
```

**Test Cases**:
1. **Inconsistent State Recovery**: Invitation with status='accepted' but no membership → Fixed code should create membership and return HTTP 200
2. **Idempotent Acceptance**: Invitation with status='accepted' and membership exists → Fixed code should return HTTP 200 "Ya eres miembro"
3. **Race Condition Handling**: Concurrent requests → Fixed code should handle P2002 error gracefully and return idempotent success
4. **Transaction Atomicity**: Mock failure in membership creation → Fixed code should rollback invitation status update

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT respondToInvitation_original(input) = respondToInvitation_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for normal invitation flows, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Pending Invitation Acceptance**: Observe that pending invitations process correctly on unfixed code, then verify fixed code produces identical behavior (HTTP 200, membership created, events emitted)
2. **Pending Invitation Rejection**: Observe that rejection works correctly on unfixed code, then verify fixed code produces identical behavior (HTTP 200, no membership, rejection event)
3. **Permission Validation**: Observe that wrong user gets HTTP 403 on unfixed code, then verify fixed code produces identical error
4. **Non-Existent Invitation**: Observe that missing invitation gets HTTP 404 on unfixed code, then verify fixed code produces identical error
5. **Already Responded with Membership**: Observe that legitimate already-responded invitations get HTTP 400 on unfixed code, then verify fixed code produces identical error
6. **Other Endpoints**: Verify GET pending, POST send, DELETE cancel continue to work identically

### Unit Tests

- Test invitation acceptance with pending status creates membership and updates status atomically
- Test invitation rejection with pending status updates status without creating membership
- Test permission validation rejects unauthorized users with HTTP 403
- Test non-existent invitation returns HTTP 404
- Test idempotent acceptance when membership already exists returns HTTP 200
- Test inconsistent state recovery creates missing membership
- Test race condition handling with P2002 error returns idempotent success

### Property-Based Tests

- Generate random invitation states and verify acceptance behavior is correct for all valid inputs
- Generate random user IDs and verify permission checks work correctly across many scenarios
- Generate concurrent request scenarios and verify no inconsistent states are created
- Test that all non-buggy inputs produce identical results between original and fixed code

### Integration Tests

- Test full invitation flow: send → accept → verify membership exists and events emitted
- Test full rejection flow: send → reject → verify no membership and rejection event emitted
- Test concurrent acceptance attempts from multiple clients
- Test transaction rollback when database errors occur during membership creation
- Test idempotent behavior when user attempts to accept already-accepted invitation multiple times
