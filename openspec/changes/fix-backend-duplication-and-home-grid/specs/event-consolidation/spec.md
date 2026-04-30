# Spec: Event Consolidation for Join Requests

**Capability**: `event-consolidation`  
**Type**: Modified  
**Priority**: CRITICAL

---

## Overview

Remove redundant `USER_JOINED_GROUP` event emission from join request acceptance flow to prevent duplicate notifications.

---

## Requirements

### Functional Requirements

**FR1**: `acceptJoinRequest()` emits only `GROUP_JOIN_REQUEST_ACCEPTED` event.

**FR2**: `USER_JOINED_GROUP` event is NOT emitted for join request acceptances.

**FR3**: `USER_JOINED_GROUP` event is STILL emitted for invitation acceptances.

**FR4**: Event payload includes all required fields for notification creation.

**FR5**: Existing event listeners continue to work without modification.

---

## Current Behavior (BEFORE)

### Join Request Acceptance Flow

```typescript
// group-invitations.service.ts - acceptJoinRequest()
async acceptJoinRequest(requestId: number, userId: number) {
  // ... business logic ...
  
  // ❌ PROBLEM: Emits TWO events
  this.eventEmitter.emit(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED, {
    id_request: requestId,
    id_group: request.id_group,
    group_name: group.name,
    requester_id: request.requester_id,
    requester_name: requester.full_name,
    responded_at: new Date(),
  });
  
  this.eventEmitter.emit(MESSAGE_EVENTS.USER_JOINED_GROUP, {
    id_user: request.requester_id,
    id_group: request.id_group,
    full_name: requester.full_name,
    joined_at: new Date(),
  });
}
```

**Result**: 
- Requester receives 2 notifications (one from each event)
- Existing members receive 1 notification each (from USER_JOINED_GROUP)

---

## Proposed Behavior (AFTER)

### Join Request Acceptance Flow

```typescript
// group-invitations.service.ts - acceptJoinRequest()
async acceptJoinRequest(requestId: number, userId: number) {
  // ... business logic ...
  
  // ✅ SOLUTION: Emit only one event
  this.eventEmitter.emit(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED, {
    id_request: requestId,
    id_group: request.id_group,
    group_name: group.name,
    requester_id: request.requester_id,
    requester_name: requester.full_name,
    responded_at: new Date(),
  });
  
  // ❌ REMOVED: USER_JOINED_GROUP emission
}
```

**Result**:
- Requester receives 1 notification (from GROUP_JOIN_REQUEST_ACCEPTED)
- Existing members receive 0 notifications (join requests are silent for members)

---

## Invitation Acceptance Flow (UNCHANGED)

### Invitation Acceptance

```typescript
// group-invitations.service.ts - respondToInvitation()
async respondToInvitation(invitationId: number, userId: number, status: string) {
  // ... business logic ...
  
  if (status === 'accepted') {
    // ✅ KEEP: Emit both events for invitations
    this.eventEmitter.emit(MESSAGE_EVENTS.GROUP_INVITATION_ACCEPTED, {
      id_invitation: invitationId,
      id_group: invitation.id_group,
      group_name: group.name,
      invitee_id: userId,
      invitee_name: user.full_name,
      accepted_at: new Date(),
    });
    
    this.eventEmitter.emit(MESSAGE_EVENTS.USER_JOINED_GROUP, {
      id_user: userId,
      id_group: invitation.id_group,
      full_name: user.full_name,
      joined_at: new Date(),
    });
  }
}
```

**Result**:
- Invitee receives 1 notification (from GROUP_INVITATION_ACCEPTED)
- Inviter receives 1 notification (from GROUP_INVITATION_ACCEPTED listener)
- Existing members receive 1 notification each (from USER_JOINED_GROUP)

---

## Event Payloads

### GROUP_JOIN_REQUEST_ACCEPTED

```typescript
interface GroupJoinRequestAcceptedPayload {
  id_request: number;
  id_group: number;
  group_name: string;
  requester_id: number;
  requester_name: string;
  responded_at: Date;
}
```

**Listener**: `handleGroupJoinRequestAccepted()`  
**Notification**: "Tu solicitud para unirte al grupo '{group_name}' fue aceptada"  
**Recipient**: Requester only

### USER_JOINED_GROUP

```typescript
interface UserJoinedGroupPayload {
  id_user: number;
  id_group: number;
  full_name: string;
  joined_at: Date;
}
```

**Listener**: `handleUserJoinedGroup()`  
**Notification**: "{full_name} se unió al grupo {group_name}"  
**Recipients**: All existing members (except the new member)

---

## Listener Updates

### handleGroupJoinRequestAccepted (UPDATED)

```typescript
@OnEvent(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED)
async handleGroupJoinRequestAccepted(payload: GroupJoinRequestAcceptedPayload) {
  try {
    this.logger.log(`Handling GROUP_JOIN_REQUEST_ACCEPTED for request ${payload.id_request}`);
    
    // Use idempotent creation
    await this.notificationsService.createNotificationIdempotent({
      id_user: payload.requester_id,
      message: `Tu solicitud para unirte al grupo "${payload.group_name}" fue aceptada`,
      notification_type: 'group_join_request_accepted',
      related_entity_id: payload.id_request,
    });
    
    this.logger.log(`Created notification for requester ${payload.requester_id}`);
  } catch (error) {
    this.logger.error('Error handling GROUP_JOIN_REQUEST_ACCEPTED event:', error);
  }
}
```

### handleUserJoinedGroup (UNCHANGED)

```typescript
@OnEvent(MESSAGE_EVENTS.USER_JOINED_GROUP)
async handleUserJoinedGroup(payload: UserJoinedGroupPayload) {
  try {
    this.logger.log(`Handling USER_JOINED_GROUP for group ${payload.id_group}`);
    
    // Get all members except the new member
    const members = await this.prisma.membership.findMany({
      where: {
        id_group: payload.id_group,
        id_user: { not: payload.id_user },
      },
      include: {
        group: { select: { name: true } },
      },
    });
    
    // Create notifications for each member
    const notifications = members.map((member) => ({
      id_user: member.id_user!,
      message: `${payload.full_name} se unió al grupo ${member.group?.name || 'el grupo'}`,
      is_read: false,
      created_at: new Date(),
      related_entity_id: payload.id_group,
      notification_type: 'user_joined_group',
    }));
    
    if (notifications.length > 0) {
      await this.prisma.notification.createMany({ data: notifications });
      this.logger.log(`Created ${notifications.length} notifications for user ${payload.id_user} joining group`);
    }
  } catch (error) {
    this.logger.error('Error handling USER_JOINED_GROUP event:', error);
  }
}
```

---

## Testing

### Unit Tests

```typescript
describe('acceptJoinRequest', () => {
  it('should emit only GROUP_JOIN_REQUEST_ACCEPTED event', async () => {
    // Arrange
    const eventEmitterSpy = jest.spyOn(eventEmitter, 'emit');
    
    // Act
    await service.acceptJoinRequest(requestId, userId);
    
    // Assert
    expect(eventEmitterSpy).toHaveBeenCalledWith(
      MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED,
      expect.objectContaining({ id_request: requestId })
    );
    expect(eventEmitterSpy).not.toHaveBeenCalledWith(
      MESSAGE_EVENTS.USER_JOINED_GROUP,
      expect.anything()
    );
  });
});

describe('respondToInvitation', () => {
  it('should emit both events when invitation is accepted', async () => {
    // Arrange
    const eventEmitterSpy = jest.spyOn(eventEmitter, 'emit');
    
    // Act
    await service.respondToInvitation(invitationId, userId, 'accepted');
    
    // Assert
    expect(eventEmitterSpy).toHaveBeenCalledWith(
      MESSAGE_EVENTS.GROUP_INVITATION_ACCEPTED,
      expect.anything()
    );
    expect(eventEmitterSpy).toHaveBeenCalledWith(
      MESSAGE_EVENTS.USER_JOINED_GROUP,
      expect.anything()
    );
  });
});
```

### Integration Tests

```typescript
describe('Notification Creation', () => {
  it('should create only one notification for join request acceptance', async () => {
    // Arrange
    const initialCount = await prisma.notification.count({ where: { id_user: requesterId } });
    
    // Act
    await service.acceptJoinRequest(requestId, ownerId);
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async listeners
    
    // Assert
    const finalCount = await prisma.notification.count({ where: { id_user: requesterId } });
    expect(finalCount - initialCount).toBe(1);
  });
});
```

---

## Acceptance Criteria

- [x] AC1: `acceptJoinRequest()` emits only `GROUP_JOIN_REQUEST_ACCEPTED`
- [x] AC2: `acceptJoinRequest()` does NOT emit `USER_JOINED_GROUP`
- [x] AC3: `respondToInvitation()` still emits both events for accepted invitations
- [x] AC4: Requester receives exactly 1 notification for join request acceptance
- [x] AC5: Existing members receive 0 notifications for join request acceptance
- [x] AC6: Existing members receive 1 notification each for invitation acceptance
- [x] AC7: All unit tests pass
- [x] AC8: All integration tests pass
- [x] AC9: Zero-Any policy maintained
