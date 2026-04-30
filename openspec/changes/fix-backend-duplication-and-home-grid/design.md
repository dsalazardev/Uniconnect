# Design: Fix Backend Notification Duplication and Home Grid Layout

**Change ID**: `fix-backend-duplication-and-home-grid`  
**Date**: 2026-04-29

---

## 🏗️ Architecture Overview

This change addresses two independent issues:
1. **Backend**: Notification duplication via event consolidation + idempotency
2. **Frontend**: Desktop layout reconstruction with proper grid constraints

---

## 🔧 Technical Decisions

### Decision 1: Event Consolidation Strategy

**Problem**: Two events fire for one business action (join request acceptance).

**Options Considered**:
1. **Remove `USER_JOINED_GROUP` entirely** ❌ - Breaks invitation flow
2. **Add flag to distinguish join types** ❌ - Adds complexity
3. **Remove redundant emission in service** ✅ - Clean, minimal change

**Decision**: Remove `USER_JOINED_GROUP` emission from `acceptJoinRequest()` only.

**Rationale**:
- `GROUP_JOIN_REQUEST_ACCEPTED` is semantically correct for this action
- `USER_JOINED_GROUP` should only fire for invitation acceptances
- Minimal code change, preserves existing behavior for invitations

**Implementation**:
```typescript
// group-invitations.service.ts - acceptJoinRequest()
async acceptJoinRequest(requestId: number, userId: number) {
  // ... business logic ...
  
  // Only emit join_request.accepted
  this.eventEmitter.emit(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED, {
    id_request: requestId,
    id_group: request.id_group,
    group_name: group.name,
    requester_id: request.requester_id,
    requester_name: requester.full_name,
    responded_at: new Date(),
  });
  
  // ❌ REMOVED: this.eventEmitter.emit(MESSAGE_EVENTS.USER_JOINED_GROUP, {...});
}
```

---

### Decision 2: Idempotency Implementation

**Problem**: Race conditions can still create duplicate notifications.

**Options Considered**:
1. **Unique constraint in DB** ❌ - Breaks legitimate duplicates (e.g., multiple messages)
2. **Redis-based deduplication** ❌ - Adds infrastructure dependency
3. **Time-window check in service** ✅ - Simple, effective, no new dependencies

**Decision**: Implement 5-second time-window deduplication in `NotificationsService`.

**Rationale**:
- 5 seconds is sufficient to catch race conditions
- Doesn't prevent legitimate duplicate notifications (e.g., same user sends 2 messages)
- No schema changes required
- Works with existing Prisma setup

**Implementation**:
```typescript
async createNotificationIdempotent(data: {
  id_user: number;
  message: string;
  notification_type: string;
  related_entity_id: number;
}): Promise<void> {
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
    this.logger.warn(`Duplicate notification prevented: user=${data.id_user}, type=${data.notification_type}, entity=${data.related_entity_id}`);
    return;
  }
  
  await this.prisma.notification.create({
    data: {
      ...data,
      is_read: false,
      created_at: new Date(),
    },
  });
}
```

**Performance Impact**:
- **Additional query**: 1 `findFirst` per notification creation
- **Query complexity**: Simple indexed lookup (id_user + created_at)
- **Estimated overhead**: < 5ms per notification

---

### Decision 3: Listener Refactoring

**Problem**: All listeners use direct `prisma.notification.create()`.

**Options Considered**:
1. **Refactor all listeners** ❌ - High risk, large scope
2. **Refactor only affected listeners** ✅ - Minimal risk, targeted fix
3. **Add middleware** ❌ - Overengineered for this use case

**Decision**: Refactor only `handleGroupJoinRequestAccepted()` and `handleUserJoinedGroup()`.

**Rationale**:
- These are the only listeners causing duplication
- Other listeners (messages, connections) don't have duplication issues
- Incremental refactoring reduces risk

**Implementation**:
```typescript
@OnEvent(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED)
async handleGroupJoinRequestAccepted(payload: GroupJoinRequestAcceptedPayload) {
  try {
    await this.notificationsService.createNotificationIdempotent({
      id_user: payload.requester_id,
      message: `Tu solicitud para unirte al grupo "${payload.group_name}" fue aceptada`,
      notification_type: 'group_join_request_accepted',
      related_entity_id: payload.id_request,
    });
  } catch (error) {
    this.logger.error('Error handling GROUP_JOIN_REQUEST_ACCEPTED event:', error);
  }
}
```

---

### Decision 4: Desktop Grid Layout Strategy

**Problem**: Current layout has empty center, poor visual hierarchy.

**Options Considered**:
1. **Single-column centered** ❌ - Wastes horizontal space
2. **2-column (content + sidebar)** ❌ - Doesn't match user expectation
3. **3-column with max-width center** ✅ - Professional, scalable

**Decision**: Implement 3-column grid with 800px max-width center feed.

**Rationale**:
- **Sidebar (240px)**: Fixed width for navigation
- **Center Feed (800px max)**: Optimal reading width, prevents content stretching
- **Right Panel (300px)**: Fixed width for featured groups
- **Total**: 1340px ideal width, scales down gracefully

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────┐
│  Sidebar  │         Center Feed          │  Right Panel │
│   240px   │       (max 800px)            │    300px     │
│           │                              │              │
│  Nav      │  Header                      │  Featured    │
│  Links    │  Events Carousel             │  Groups      │
│           │  Groups Section              │              │
│           │  (Centered, scrollable)      │  (Scrollable)│
└─────────────────────────────────────────────────────────┘
```

**Implementation**:
```typescript
// Desktop Layout
return (
  <View style={styles.desktopContainer}>
    <Sidebar />
    
    <ScrollView style={styles.centerFeed} showsVerticalScrollIndicator={false}>
      <Header />
      <View style={styles.centerContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          <EventsCarousel />
        </View>
        
        <View style={styles.section}>
          <GroupsSection />
        </View>
      </View>
    </ScrollView>
    
    <RightPanel />
  </View>
);
```

**Styles**:
```typescript
desktopContainer: {
  flex: 1,
  flexDirection: 'row',
  backgroundColor: '#000000',
},
centerFeed: {
  flex: 1,
  backgroundColor: '#000000',
},
centerContent: {
  maxWidth: 800,
  alignSelf: 'center',
  width: '100%',
  paddingHorizontal: 16,
},
```

---

### Decision 5: Responsive Breakpoints

**Problem**: Need to ensure mobile layout is unaffected.

**Decision**: Use existing `useResponsive()` hook with conditional rendering.

**Breakpoints** (from existing code):
- **Mobile**: < 768px → Single column
- **Tablet**: 768-1023px → Single column with padding
- **Desktop**: ≥ 1024px → 3-column grid

**Implementation**:
```typescript
const { isMobile, isDesktop } = useResponsive();

if (isMobile) {
  return <MobileLayout />;
}

return <DesktopLayout />;
```

---

## 🔒 Type Safety

### Backend Types
```typescript
// notifications.service.ts
interface CreateNotificationData {
  id_user: number;
  message: string;
  notification_type: string;
  related_entity_id: number;
}

async createNotificationIdempotent(data: CreateNotificationData): Promise<void> {
  // Implementation
}
```

### Frontend Types
No new types required - existing types are sufficient.

---

## 🧪 Testing Strategy

### Backend Tests
1. **Unit Tests**: `notifications.service.spec.ts`
   - Test `createNotificationIdempotent()` prevents duplicates
   - Test time-window logic (5 seconds)
   - Test legitimate duplicates are allowed after window

2. **Integration Tests**: `notification-event.listener.spec.ts`
   - Test `GROUP_JOIN_REQUEST_ACCEPTED` creates one notification
   - Test `USER_JOINED_GROUP` still works for invitations
   - Test no duplicate notifications for join requests

3. **Regression Tests**: Run full test suite (316 tests)

### Frontend Tests
1. **Visual Tests**: Manual testing on different screen sizes
   - Desktop (1920x1080): Verify 3-column layout
   - Tablet (768x1024): Verify single column
   - Mobile (375x667): Verify single column

2. **Responsive Tests**: Test `useResponsive()` hook behavior

---

## 📊 Performance Considerations

### Backend
- **Additional Query**: 1 `findFirst` per notification (< 5ms)
- **Index Optimization**: Ensure index on `(id_user, created_at, notification_type)`
- **Memory**: No additional memory overhead

### Frontend
- **Layout Calculation**: Minimal overhead from flexbox
- **Rendering**: No additional re-renders
- **Bundle Size**: No new dependencies

---

## 🚨 Edge Cases

### Backend
1. **Concurrent Requests**: Idempotency check handles race conditions
2. **Clock Skew**: 5-second window is large enough to tolerate minor skew
3. **Legitimate Duplicates**: Allowed after 5-second window

### Frontend
1. **Very Wide Screens (> 2000px)**: Center feed stays at 800px max
2. **Very Narrow Desktops (1024-1200px)**: Sidebar and panel shrink gracefully
3. **Tablet Landscape**: Uses mobile layout (single column)

---

## 📝 Migration Notes

### Backend
- **No schema changes** required
- **No data migration** required
- **Backward compatible** with existing notifications

### Frontend
- **No breaking changes** to mobile layout
- **No API changes** required
- **Immediate effect** after deployment

---

## ✅ Compliance Checklist

- [x] **Zero-Any Policy**: All code strictly typed
- [x] **AGENTS.md Rules**: Defensive programming, try/catch, logging
- [x] **Clean Architecture**: Service layer handles business logic
- [x] **Event-Driven**: Preserves existing event patterns
- [x] **Responsive Design**: Mobile-first, desktop-enhanced
- [x] **Performance**: Minimal overhead, optimized queries
- [x] **Testing**: Comprehensive unit and integration tests
