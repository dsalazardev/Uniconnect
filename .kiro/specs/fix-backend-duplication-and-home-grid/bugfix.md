# Bugfix Requirements Document

## Introduction

This document addresses two critical bugs affecting the Uniconnect platform:

1. **Backend Notification Duplication**: Physical duplicate notifications in the database (IDs 287, 288) created within a short time window, violating idempotency principles and causing duplicate notifications to users.

2. **Frontend Desktop Layout Collapse**: The central feed container on desktop (PC) is collapsed with `flex: 0`, preventing proper display of the home feed and breaking the three-column layout (Sidebar | Feed | Right Panel).

Both bugs must be fixed while preserving existing Observer/Decorator patterns and maintaining strict type safety (Zero-Any policy).

---

## Bug Analysis

### Current Behavior (Defect)

#### Backend Notification Duplication

1.1 WHEN a user action triggers multiple notification events (e.g., group join request acceptance) within the same millisecond THEN the system creates multiple physical notification records in the database with identical `id_user`, `related_entity_id`, and `notification_type` fields

1.2 WHEN the same user and entity combination generates notifications with different `notification_type` values (e.g., `member_accepted` vs `group_join_request_accepted`) within 5 seconds THEN the system creates duplicate notification records instead of consolidating them

1.3 WHEN the PersistenceNotificationObserver listener processes events THEN it calls `prisma.notification.create()` directly without idempotency checks, allowing duplicates to persist in the database

#### Frontend Desktop Layout Collapse

1.4 WHEN the app renders on desktop (PC) with a wide viewport THEN the central Feed container has `flex: 0` (collapsed) instead of `flex: 1`, causing the feed to disappear or shrink to zero width

1.5 WHEN the desktop layout renders THEN the three-column structure (Sidebar 240px | Feed 800px max | Right Panel 300px) is not properly established, breaking the intended layout hierarchy

1.6 WHEN the parent container of the Feed component renders THEN the backgroundColor is not set to `#000000`, causing visual inconsistency with the intended unified black background

### Expected Behavior (Correct)

#### Backend Notification Idempotency

2.1 WHEN a user action triggers notification events for the same user and entity within 5 seconds THEN the system SHALL create only ONE notification record, ignoring subsequent duplicate attempts regardless of `notification_type` variation

2.2 WHEN the `createNotificationIdempotent()` method is called with collision key `[userId + related_entity_id]` THEN the system SHALL check for existing notifications in the 5-second window and skip creation if a duplicate is detected

2.3 WHEN the PersistenceNotificationObserver listener processes events THEN it SHALL use the `createNotificationIdempotent()` method instead of direct `prisma.notification.create()` to prevent duplicates

2.4 WHEN duplicate notification creation is prevented THEN the system SHALL log a diagnostic message indicating the duplicate was blocked, enabling production debugging

#### Frontend Desktop Layout Restoration

2.5 WHEN the app renders on desktop (PC) THEN the central Feed container SHALL have `flex: 1` with `alignSelf: center` to occupy available space and center content vertically

2.6 WHEN the desktop layout renders THEN the three-column structure SHALL be properly established with: Sidebar (240px fixed) | Feed (800px max, flex: 1) | Right Panel (300px fixed)

2.7 WHEN the parent container of the Feed component renders THEN the backgroundColor SHALL be set to `#000000` to unify the background across all sections

### Unchanged Behavior (Regression Prevention)

#### Backend Notification System

3.1 WHEN a user action triggers a notification event THEN the system SHALL CONTINUE TO emit the event through EventEmitter2 without modification (Observer pattern preserved)

3.2 WHEN the WebSocketNotificationObserver listener processes events THEN the system SHALL CONTINUE TO emit real-time notifications via Socket.IO to all user devices (WebSocket functionality preserved)

3.3 WHEN the notification system processes events THEN the system SHALL CONTINUE TO apply Decorator patterns for message formatting without interference (Decorator pattern preserved)

3.4 WHEN a user creates a group, accepts an invitation, or performs other notification-triggering actions THEN the system SHALL CONTINUE TO create exactly one notification per action (not zero, not multiple)

#### Frontend Layout System

3.5 WHEN the app renders on mobile (narrow viewport) THEN the layout SHALL CONTINUE TO display single-column view without changes (mobile layout preserved)

3.6 WHEN the app renders on tablet (medium viewport) THEN the layout SHALL CONTINUE TO display two-column view without changes (tablet layout preserved)

3.7 WHEN the Sidebar component renders THEN it SHALL CONTINUE TO display with 240px fixed width (Sidebar functionality preserved)

3.8 WHEN the Right Panel component renders THEN it SHALL CONTINUE TO display with 300px fixed width (Right Panel functionality preserved)

3.9 WHEN users interact with feed components (scroll, load more, etc.) THEN the system SHALL CONTINUE TO function identically (feed interaction preserved)

---

## Bug Condition Methodology

### Backend Notification Duplication - Bug Condition Function

```pascal
FUNCTION isBugCondition_NotificationDuplication(X)
  INPUT: X of type NotificationCreationRequest
  OUTPUT: boolean
  
  // Returns true when duplicate notification condition is met
  RETURN (
    X.id_user = previous_notification.id_user AND
    X.related_entity_id = previous_notification.related_entity_id AND
    (now() - previous_notification.created_at) < 5000 milliseconds
  )
END FUNCTION
```

**Property Specification - Fix Checking**:
```pascal
// Property: Idempotency - Zero Duplicates
FOR ALL X WHERE isBugCondition_NotificationDuplication(X) DO
  result ← createNotificationIdempotent'(X)
  ASSERT result.duplicate_prevented = true
  ASSERT count(notifications WHERE id_user = X.id_user AND related_entity_id = X.related_entity_id) = 1
END FOR
```

**Property Specification - Preservation Checking**:
```pascal
// Property: Non-Buggy Behavior Preserved
FOR ALL X WHERE NOT isBugCondition_NotificationDuplication(X) DO
  result_original ← createNotification(X)
  result_fixed ← createNotificationIdempotent'(X)
  ASSERT result_original.success = result_fixed.success
  ASSERT result_original.notification_id = result_fixed.notification_id
END FOR
```

### Frontend Desktop Layout - Bug Condition Function

```pascal
FUNCTION isBugCondition_DesktopLayoutCollapse(X)
  INPUT: X of type ViewportDimensions
  OUTPUT: boolean
  
  // Returns true when desktop viewport triggers layout collapse
  RETURN (
    X.width >= 800 AND  // Desktop breakpoint
    feedContainer.flex = 0 AND  // Collapsed state
    feedContainer.alignSelf != 'center'  // Not centered
  )
END FUNCTION
```

**Property Specification - Fix Checking**:
```pascal
// Property: Desktop Layout Restoration
FOR ALL X WHERE isBugCondition_DesktopLayoutCollapse(X) DO
  result ← renderLayout'(X)
  ASSERT result.feedContainer.flex = 1
  ASSERT result.feedContainer.alignSelf = 'center'
  ASSERT result.parentContainer.backgroundColor = '#000000'
  ASSERT result.layout.structure = [Sidebar(240px) | Feed(800px max) | RightPanel(300px)]
END FOR
```

**Property Specification - Preservation Checking**:
```pascal
// Property: Mobile/Tablet Layout Preserved
FOR ALL X WHERE X.width < 800 DO
  result_original ← renderLayout(X)
  result_fixed ← renderLayout'(X)
  ASSERT result_original.layout = result_fixed.layout
  ASSERT result_original.columnCount = result_fixed.columnCount
END FOR
```

---

## Implementation Scope

### Backend Changes Required
- **File**: `Backend/src/notifications/notifications.service.ts`
- **Method**: Create `createNotificationIdempotent()` with 5-second collision detection
- **Collision Key**: `[userId + related_entity_id]`
- **Integration**: Update `PersistenceNotificationObserver` to use new method

### Frontend Changes Required
- **File**: `Frontend/app/(tabs)/index.tsx`
- **Changes**: 
  - Fix Feed container `flex: 0` → `flex: 1`
  - Add `alignSelf: center` to Feed container
  - Set parent container `backgroundColor: #000000`
  - Verify three-column layout structure

### Preservation Requirements
- ✅ Observer pattern events continue to emit
- ✅ WebSocket notifications continue to broadcast
- ✅ Decorator patterns continue to format messages
- ✅ Mobile/tablet layouts remain unchanged
- ✅ All existing functionality preserved
