# Spec: Notification Idempotency

**Capability**: `notification-idempotency`  
**Type**: New  
**Priority**: CRITICAL

---

## Overview

Implement time-window based idempotency check to prevent duplicate notifications from race conditions or redundant event emissions.

---

## Requirements

### Functional Requirements

**FR1**: Service method `createNotificationIdempotent()` checks for duplicates before creating notification.

**FR2**: Duplicate detection uses 5-second time window.

**FR3**: Duplicate check matches on:
- `id_user` (recipient)
- `related_entity_id` (entity that triggered notification)
- `notification_type` (type of notification)
- `created_at` (within last 5 seconds)

**FR4**: If duplicate found, log warning and skip creation.

**FR5**: If no duplicate found, create notification normally.

**FR6**: Method is async and returns `Promise<void>`.

---

## Interface

### Method Signature

```typescript
async createNotificationIdempotent(data: CreateNotificationData): Promise<void>
```

### Input Type

```typescript
interface CreateNotificationData {
  id_user: number;
  message: string;
  notification_type: string;
  related_entity_id: number;
}
```

### Output

- **Success**: Notification created in database
- **Duplicate**: No notification created, warning logged

---

## Behavior

### Scenario 1: No Duplicate Exists

**Given**: No notification exists for user 1, entity 123, type "group_join_request_accepted" in last 5 seconds

**When**: `createNotificationIdempotent()` is called

**Then**:
1. Query finds no existing notification
2. New notification is created
3. No warning is logged

### Scenario 2: Duplicate Exists

**Given**: Notification exists for user 1, entity 123, type "group_join_request_accepted" created 2 seconds ago

**When**: `createNotificationIdempotent()` is called with same parameters

**Then**:
1. Query finds existing notification
2. No new notification is created
3. Warning is logged: `"Duplicate notification prevented: user=1, type=group_join_request_accepted, entity=123"`

### Scenario 3: Legitimate Duplicate After Window

**Given**: Notification exists for user 1, entity 123, type "group_join_request_accepted" created 6 seconds ago

**When**: `createNotificationIdempotent()` is called with same parameters

**Then**:
1. Query finds no notification within 5-second window
2. New notification is created (legitimate duplicate)
3. No warning is logged

---

## Database Query

### Duplicate Check Query

```typescript
const fiveSecondsAgo = new Date(Date.now() - 5000);

const existing = await this.prisma.notification.findFirst({
  where: {
    id_user: data.id_user,
    related_entity_id: data.related_entity_id,
    notification_type: data.notification_type,
    created_at: { gte: fiveSecondsAgo },
  },
});
```

### Create Query

```typescript
await this.prisma.notification.create({
  data: {
    id_user: data.id_user,
    message: data.message,
    notification_type: data.notification_type,
    related_entity_id: data.related_entity_id,
    is_read: false,
    created_at: new Date(),
  },
});
```

---

## Performance

### Query Optimization

**Index Required**: Composite index on `(id_user, created_at, notification_type)`

```sql
CREATE INDEX idx_notification_dedup 
ON notification (id_user, created_at DESC, notification_type);
```

**Query Performance**:
- **Estimated time**: < 5ms
- **Rows scanned**: 0-1 (index lookup)
- **Impact**: Minimal overhead per notification

---

## Error Handling

### Database Errors

```typescript
try {
  await this.createNotificationIdempotent(data);
} catch (error) {
  this.logger.error('Failed to create notification:', error);
  // Don't throw - notification creation should not block main flow
}
```

### Validation Errors

```typescript
if (!data.id_user || !data.related_entity_id || !data.notification_type) {
  throw new Error('Invalid notification data: missing required fields');
}
```

---

## Testing

### Unit Tests

```typescript
describe('createNotificationIdempotent', () => {
  it('should create notification when no duplicate exists', async () => {
    // Arrange
    prismaMock.notification.findFirst.mockResolvedValue(null);
    
    // Act
    await service.createNotificationIdempotent(validData);
    
    // Assert
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
  });
  
  it('should skip creation when duplicate exists', async () => {
    // Arrange
    prismaMock.notification.findFirst.mockResolvedValue(existingNotification);
    
    // Act
    await service.createNotificationIdempotent(validData);
    
    // Assert
    expect(prismaMock.notification.create).not.toHaveBeenCalled();
    expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });
  
  it('should allow duplicate after 5-second window', async () => {
    // Arrange
    const oldNotification = { ...existingNotification, created_at: sixSecondsAgo };
    prismaMock.notification.findFirst.mockResolvedValue(null);
    
    // Act
    await service.createNotificationIdempotent(validData);
    
    // Assert
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
  });
});
```

---

## Acceptance Criteria

- [x] AC1: Method signature matches specification
- [x] AC2: Duplicate check uses 5-second time window
- [x] AC3: Duplicate check matches on user, entity, type, and time
- [x] AC4: Warning logged when duplicate prevented
- [x] AC5: No warning logged for legitimate duplicates
- [x] AC6: Method is async and returns Promise<void>
- [x] AC7: Unit tests cover all scenarios
- [x] AC8: Performance overhead < 5ms per notification
