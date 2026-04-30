# Proposal: Fix Backend Notification Duplication and Home Grid Layout

**Change ID**: `fix-backend-duplication-and-home-grid`  
**Date**: 2026-04-29  
**Priority**: CRITICAL  
**Estimated Effort**: 8 hours

---

## 🎯 Problem Statement

### 1. Backend Notification Duplication (CRITICAL)
**Symptom**: Users receive duplicate notifications when a join request is accepted.

**Root Cause**: Two separate event listeners create notifications for the same action:
- `GROUP_JOIN_REQUEST_ACCEPTED` → Creates notification "Tu solicitud fue aceptada"
- `USER_JOINED_GROUP` → Creates notification "X se unió al grupo"

Both events fire when `acceptJoinRequest()` is called, resulting in:
- **2 notifications to the requester** (one acceptance, one join)
- **N notifications to existing members** (one per member about the new user)

**Evidence from Code**:
```typescript
// group-invitations.service.ts - acceptJoinRequest()
this.eventEmitter.emit('group.join_request.accepted', payload1);  // ← Notification 1
this.eventEmitter.emit('user.joined.group', payload2);            // ← Notification 2
```

### 2. Home Screen Desktop Layout Issues
**Symptom**: Desktop layout has empty center space, poor visual hierarchy.

**Current Issues**:
- Sidebar (240px) is correct
- **Center content area is empty/minimal** - only shows events carousel
- Right panel (300px) is correct but positioned incorrectly
- No proper max-width constraint on center feed
- Background color creates visual gaps

**User Expectation**: 3-column layout with rich center content (events + groups + filters).

---

## 🎯 Objectives

### Backend (Priority 1)
1. **Consolidate Event Listeners**: Remove redundant `USER_JOINED_GROUP` listener for join requests
2. **Implement Idempotency**: Prevent duplicate notifications via DB-level deduplication
3. **Preserve Existing Behavior**: Keep `USER_JOINED_GROUP` for invitation acceptances

### Frontend (Priority 2)
4. **Rebuild Desktop Grid**: Fix 3-column layout with proper spacing and max-widths
5. **Enrich Center Content**: Move events carousel and filters to center feed
6. **Fix Visual Hierarchy**: Ensure no empty spaces, proper background colors

---

## 📋 Proposed Changes

### Backend Changes

#### 1. Remove Redundant Event Emission
**File**: `Backend/src/group-invitations/group-invitations.service.ts`

**Current**:
```typescript
// Emits BOTH events
this.eventEmitter.emit('group.join_request.accepted', {...});
this.eventEmitter.emit('user.joined.group', {...});
```

**Proposed**:
```typescript
// Only emit join_request.accepted
this.eventEmitter.emit('group.join_request.accepted', {
  id_request,
  id_group,
  group_name,
  requester_id,
  requester_name,
  responded_at: new Date(),
});
// Remove user.joined.group emission for join requests
```

#### 2. Add Idempotency Check to NotificationsService
**File**: `Backend/src/notifications/notifications.service.ts`

**New Method**:
```typescript
async createNotificationIdempotent(data: {
  id_user: number;
  message: string;
  notification_type: string;
  related_entity_id: number;
}): Promise<void> {
  // Check for duplicate in last 5 seconds
  const fiveSecondsAgo = new Date(Date.now() - 5000);
  
  const existing = await this.prisma.notification.findFirst({
    where: {
      id_user: data.id_user,
      related_entity_id: data.related_entity_id,
      notification_type: data.notification_type,
      created_at: { gte: fiveSecondsAgo },
    },
  });
  
  if (existing) {
    this.logger.warn(`Duplicate notification prevented for user ${data.id_user}`);
    return;
  }
  
  await this.prisma.notification.create({ data: { ...data, is_read: false, created_at: new Date() } });
}
```

#### 3. Update Notification Listener
**File**: `Backend/src/notifications/listeners/notification-event.listener.ts`

**Changes**:
- Use `createNotificationIdempotent()` instead of direct `prisma.notification.create()`
- Keep `handleGroupJoinRequestAccepted()` for requester notification
- Keep `handleUserJoinedGroup()` for member notifications (invitations only)

### Frontend Changes

#### 4. Rebuild Desktop Grid Layout
**File**: `Frontend/app/(tabs)/index.tsx`

**Current Structure**:
```tsx
<View style={styles.container}>
  <Sidebar />           {/* 240px */}
  <ScrollView />        {/* Flex 1 - TOO WIDE */}
  <RightPanel />        {/* 300px */}
</View>
```

**Proposed Structure**:
```tsx
<View style={styles.container}>
  <Sidebar />           {/* 240px fixed */}
  <ScrollView style={styles.centerFeed}>  {/* max-width: 800px, centered */}
    <Header />
    <EventsCarousel />
    <GroupsSection />
  </ScrollView>
  <RightPanel />        {/* 300px fixed */}
</View>
```

**Style Changes**:
```typescript
centerFeed: {
  flex: 1,
  maxWidth: 800,
  alignSelf: 'center',
  backgroundColor: '#000000',
},
container: {
  flex: 1,
  flexDirection: 'row',
  backgroundColor: '#000000',
},
```

---

## ✅ Success Criteria

### Backend
- [ ] Only ONE notification created when join request is accepted
- [ ] Idempotency check prevents duplicates within 5-second window
- [ ] All 316 backend tests still pass
- [ ] Zero-Any policy maintained

### Frontend
- [ ] Desktop layout shows 3 distinct columns (240px + 800px + 300px)
- [ ] Center feed is properly centered with max-width constraint
- [ ] No empty spaces or visual gaps
- [ ] Events carousel and groups section visible in center
- [ ] Mobile layout unchanged

---

## 🚨 Risks and Mitigations

### Risk 1: Breaking Invitation Flow
**Mitigation**: Keep `USER_JOINED_GROUP` event for invitation acceptances, only remove for join requests.

### Risk 2: Layout Regression on Mobile
**Mitigation**: Use `useResponsive()` hook to conditionally apply desktop styles only.

### Risk 3: Existing Notifications in DB
**Mitigation**: Idempotency check is forward-looking only, doesn't affect historical data.

---

## 📊 Impact Analysis

### Performance
- **Reduced DB writes**: 50% fewer notification inserts for join requests
- **Reduced API calls**: No change (frontend already optimized)

### User Experience
- **No duplicate notifications**: Users see one clear notification per action
- **Better desktop UX**: Professional 3-column layout with rich content

### Code Quality
- **Cleaner event flow**: One event per business action
- **Defensive programming**: Idempotency prevents race conditions
- **Zero-Any policy**: All changes strictly typed

---

## 📝 Implementation Order

1. **Backend Idempotency** (2 hours) - Add `createNotificationIdempotent()` method
2. **Backend Event Consolidation** (2 hours) - Remove redundant event emission
3. **Backend Testing** (1 hour) - Verify all tests pass, no regressions
4. **Frontend Grid Rebuild** (2 hours) - Fix desktop layout structure
5. **Frontend Testing** (1 hour) - Verify mobile and desktop layouts

**Total Estimated Time**: 8 hours
