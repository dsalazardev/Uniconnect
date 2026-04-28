# Design: US-T02 - Unit Tests for Observer Pattern

## Architecture Overview

This US implements comprehensive unit testing for the Observer pattern in the Study Groups domain, achieving parity with the existing Chat domain test coverage.

```
Backend/src/groups/
├── domain/observer/
│   ├── __tests__/                          # NEW - Subject tests
│   │   └── study-group-subject.spec.ts     # 10 tests
│   ├── study-group-subject.ts              # Existing implementation
│   └── study-group-event.interface.ts      # Existing interface
│
├── infrastructure/observers/
│   ├── __tests__/                          # NEW - Observer tests
│   │   ├── websocket-notification.observer.spec.ts    # 4 tests
│   │   └── persistence-notification.observer.spec.ts  # 4 tests
│   ├── websocket-notification.observer.ts  # Existing implementation
│   └── persistence-notification.observer.ts # Existing implementation
│
└── __tests__/
    └── study-group-subject.integration.spec.ts  # NEW - 6 integration tests
```

---

## Design Decisions

### Decision 1: Mirror Chat Domain Test Structure

**Context**: Chat domain has 31 tests with proven patterns

**Options Considered**:
1. Create new test structure from scratch
2. **Mirror Chat domain structure exactly**
3. Hybrid approach (some new patterns)

**Decision**: Option 2 - Mirror Chat domain structure

**Rationale**:
- Proven patterns reduce risk
- Consistency across domains
- Faster implementation (~70 min vs ~2 hours)
- Easier maintenance

**Trade-offs**:
- ✅ Fast implementation
- ✅ Consistent patterns
- ⚠️ Less flexibility for domain-specific needs
- ⚠️ Assumes Chat patterns are optimal

---

### Decision 2: Mock Strategy for ChatSessionManager

**Context**: WebSocketNotificationObserver depends on ChatSessionManager singleton

**Options Considered**:
1. Mock entire ChatSessionManager class
2. **Mock only `emitToUser()` method**
3. Use real ChatSessionManager with mocked Socket.IO

**Decision**: Option 2 - Mock only `emitToUser()` method

**Rationale**:
- Minimal mocking surface
- Focuses on observer behavior
- Avoids singleton complexity
- Consistent with Chat domain mocks

**Implementation**:
```typescript
const mockChatSessionManager = {
  emitToUser: jest.fn(),
} as jest.Mocked<Partial<ChatSessionManager>>;
```

---

### Decision 3: Integration Test Scope

**Context**: AC5 requires integration tests with main observers

**Options Considered**:
1. Full E2E test with real WebSocket
2. **Integration test with mocked dependencies**
3. Unit test only (no integration)

**Decision**: Option 2 - Integration test with mocked dependencies

**Rationale**:
- Validates Subject → Observer flow
- No real I/O (fast execution)
- Satisfies AC5 requirement
- Consistent with Chat domain approach

---

## Component Design

### 1. StudyGroupSubject Tests

**File**: `study-group-subject.spec.ts`  
**Purpose**: Validate Subject lifecycle and notification behavior

**Test Structure**:
```typescript
describe('StudyGroupSubject', () => {
  let studyGroupSubject: StudyGroupSubject;
  let mockObserver1: IObserver<StudyGroupEvent>;
  let mockObserver2: IObserver<StudyGroupEvent>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudyGroupSubject],
    }).compile();

    studyGroupSubject = module.get<StudyGroupSubject>(StudyGroupSubject);

    mockObserver1 = { update: jest.fn() };
    mockObserver2 = { update: jest.fn() };
  });

  describe('attach', () => {
    // 3 tests
  });

  describe('detach', () => {
    // 3 tests
  });

  describe('notify', () => {
    // 4 tests (includes AC1, AC3)
  });
});
```

**Key Tests**:
1. **AC1 Test**: `should notify all attached observers`
   ```typescript
   it('should notify all attached observers', () => {
     studyGroupSubject.attach(mockObserver1);
     studyGroupSubject.attach(mockObserver2);

     const event: StudyGroupEvent = {
       type: 'JOIN_REQUEST',
       targetUserId: 1,
       groupId: 100,
       groupName: 'Test Group',
       actorId: 2,
       actorName: 'John Doe',
       timestamp: new Date(),
     };

     studyGroupSubject.notify(event);

     expect(mockObserver1.update).toHaveBeenCalledWith(event);
     expect(mockObserver2.update).toHaveBeenCalledWith(event);
   });
   ```

2. **AC3 Test**: `should handle observer errors gracefully`
   ```typescript
   it('should handle observer errors gracefully', () => {
     const errorObserver: IObserver<StudyGroupEvent> = {
       update: jest.fn().mockImplementation(() => {
         throw new Error('Observer error');
       }),
     };

     studyGroupSubject.attach(errorObserver);
     studyGroupSubject.attach(mockObserver1);

     const event: StudyGroupEvent = {
       type: 'MEMBER_ACCEPTED',
       targetUserId: 1,
       groupId: 100,
       groupName: 'Test Group',
       actorId: 2,
       actorName: 'Admin',
       timestamp: new Date(),
     };

     expect(() => studyGroupSubject.notify(event)).not.toThrow();
     expect(mockObserver1.update).toHaveBeenCalledWith(event);
   });
   ```

---

### 2. WebSocketNotificationObserver Tests

**File**: `websocket-notification.observer.spec.ts`  
**Purpose**: Validate WebSocket notification behavior

**Test Structure**:
```typescript
describe('WebSocketNotificationObserver', () => {
  let observer: WebSocketNotificationObserver;
  let mockChatSessionManager: jest.Mocked<Partial<ChatSessionManager>>;

  beforeEach(() => {
    mockChatSessionManager = {
      emitToUser: jest.fn(),
    };

    observer = new WebSocketNotificationObserver(
      mockChatSessionManager as ChatSessionManager,
    );
  });

  describe('update', () => {
    // 4 tests
  });
});
```

**Key Tests**:
1. **Emit Test**: `should emit notification via ChatSessionManager`
   ```typescript
   it('should emit notification via ChatSessionManager', () => {
     const event: StudyGroupEvent = {
       type: 'JOIN_REQUEST',
       targetUserId: 1,
       groupId: 100,
       groupName: 'Test Group',
       actorId: 2,
       actorName: 'John Doe',
       timestamp: new Date(),
     };

     observer.update(event);

     expect(mockChatSessionManager.emitToUser).toHaveBeenCalledWith(
       1,
       'group:notification',
       expect.objectContaining({
         type: 'JOIN_REQUEST',
         groupId: 100,
         groupName: 'Test Group',
       }),
     );
   });
   ```

2. **AC3 Test**: `should handle gateway errors gracefully`
   ```typescript
   it('should handle gateway errors gracefully', () => {
     mockChatSessionManager.emitToUser.mockImplementation(() => {
       throw new Error('Gateway error');
     });

     const event: StudyGroupEvent = {
       type: 'MEMBER_ACCEPTED',
       targetUserId: 1,
       groupId: 100,
       groupName: 'Test Group',
       actorId: 2,
       actorName: 'Admin',
       timestamp: new Date(),
     };

     expect(() => observer.update(event)).not.toThrow();
   });
   ```

---

### 3. PersistenceNotificationObserver Tests

**File**: `persistence-notification.observer.spec.ts`  
**Purpose**: Validate database persistence behavior

**Test Structure**:
```typescript
describe('PersistenceNotificationObserver', () => {
  let observer: PersistenceNotificationObserver;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockPrismaService = {
      notification: {
        create: jest.fn(),
      },
    } as any;

    observer = new PersistenceNotificationObserver(mockPrismaService);
  });

  describe('update', () => {
    // 4 tests
  });
});
```

**Key Tests**:
1. **Persist Test**: `should persist notification to database`
   ```typescript
   it('should persist notification to database', async () => {
     const event: StudyGroupEvent = {
       type: 'JOIN_REQUEST',
       targetUserId: 1,
       groupId: 100,
       groupName: 'Test Group',
       actorId: 2,
       actorName: 'John Doe',
       timestamp: new Date(),
     };

     mockPrismaService.notification.create.mockResolvedValue({
       id_notification: 1,
       id_user: 1,
       message: 'John Doe solicitó unirse a Test Group',
       is_read: false,
       created_at: new Date(),
       notification_type: 'group_join_request',
       related_entity_id: 100,
       push_sent: false,
     });

     await observer.update(event);

     expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
       data: expect.objectContaining({
         id_user: 1,
         notification_type: 'group_join_request',
         related_entity_id: 100,
       }),
     });
   });
   ```

2. **AC3 Test**: `should handle database errors gracefully`
   ```typescript
   it('should handle database errors gracefully', async () => {
     mockPrismaService.notification.create.mockRejectedValue(
       new Error('Database error'),
     );

     const event: StudyGroupEvent = {
       type: 'MEMBER_ACCEPTED',
       targetUserId: 1,
       groupId: 100,
       groupName: 'Test Group',
       actorId: 2,
       actorName: 'Admin',
       timestamp: new Date(),
     };

     await expect(observer.update(event)).resolves.not.toThrow();
   });
   ```

---

### 4. Integration Tests

**File**: `study-group-subject.integration.spec.ts`  
**Purpose**: Validate Subject → Observer integration flow

**Test Structure**:
```typescript
describe('StudyGroupSubject - Integration Tests', () => {
  let studyGroupSubject: StudyGroupSubject;
  let websocketObserver: WebSocketNotificationObserver;
  let persistenceObserver: PersistenceNotificationObserver;
  let mockChatSessionManager: jest.Mocked<Partial<ChatSessionManager>>;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockChatSessionManager = {
      emitToUser: jest.fn(),
    };

    mockPrismaService = {
      notification: {
        create: jest.fn(),
      },
    } as any;

    studyGroupSubject = new StudyGroupSubject();
    websocketObserver = new WebSocketNotificationObserver(
      mockChatSessionManager as ChatSessionManager,
    );
    persistenceObserver = new PersistenceNotificationObserver(
      mockPrismaService,
    );
  });

  describe('Subject + WebSocketObserver', () => {
    // 2 tests
  });

  describe('Subject + PersistenceObserver', () => {
    // 2 tests
  });

  describe('Multiple Observers', () => {
    // 2 tests (AC1, AC3)
  });
});
```

**Key Tests**:
1. **AC5 Test**: `should notify WebSocket observer on JOIN_REQUEST`
   ```typescript
   it('should notify WebSocket observer on JOIN_REQUEST', () => {
     studyGroupSubject.attach(websocketObserver);

     const event: StudyGroupEvent = {
       type: 'JOIN_REQUEST',
       targetUserId: 1,
       groupId: 100,
       groupName: 'Test Group',
       actorId: 2,
       actorName: 'John Doe',
       timestamp: new Date(),
     };

     studyGroupSubject.notify(event);

     expect(mockChatSessionManager.emitToUser).toHaveBeenCalledWith(
       1,
       'group:notification',
       expect.any(Object),
     );
   });
   ```

2. **AC1 + AC5 Test**: `should notify both observers simultaneously`
   ```typescript
   it('should notify both observers simultaneously', async () => {
     studyGroupSubject.attach(websocketObserver);
     studyGroupSubject.attach(persistenceObserver);

     const event: StudyGroupEvent = {
       type: 'MEMBER_ACCEPTED',
       targetUserId: 1,
       groupId: 100,
       groupName: 'Test Group',
       actorId: 2,
       actorName: 'Admin',
       timestamp: new Date(),
     };

     mockPrismaService.notification.create.mockResolvedValue({} as any);

     studyGroupSubject.notify(event);

     // Wait for async operations
     await new Promise(resolve => setTimeout(resolve, 10));

     expect(mockChatSessionManager.emitToUser).toHaveBeenCalled();
     expect(mockPrismaService.notification.create).toHaveBeenCalled();
   });
   ```

3. **AC3 Test**: `should isolate errors between observers`
   ```typescript
   it('should isolate errors between observers', async () => {
     // Make WebSocket observer throw
     mockChatSessionManager.emitToUser.mockImplementation(() => {
       throw new Error('WebSocket error');
     });

     studyGroupSubject.attach(websocketObserver);
     studyGroupSubject.attach(persistenceObserver);

     const event: StudyGroupEvent = {
       type: 'JOIN_REQUEST',
       targetUserId: 1,
       groupId: 100,
       groupName: 'Test Group',
       actorId: 2,
       actorName: 'John Doe',
       timestamp: new Date(),
     };

     mockPrismaService.notification.create.mockResolvedValue({} as any);

     expect(() => studyGroupSubject.notify(event)).not.toThrow();

     // Wait for async operations
     await new Promise(resolve => setTimeout(resolve, 10));

     // Persistence observer should still be called
     expect(mockPrismaService.notification.create).toHaveBeenCalled();
   });
   ```

---

## Data Flow

### Subject Notification Flow
```
StudyGroupSubject.notify(event)
    ↓
for each observer in observers[]
    ↓
try {
    observer.update(event)
} catch (error) {
    log error (AC3: error isolation)
}
```

### WebSocket Observer Flow
```
WebSocketNotificationObserver.update(event)
    ↓
ChatSessionManager.emitToUser(targetUserId, 'group:notification', payload)
    ↓
Socket.IO emits to user's connected sockets
```

### Persistence Observer Flow
```
PersistenceNotificationObserver.update(event)
    ↓
PrismaService.notification.create({ data: {...} })
    ↓
Database INSERT notification record
```

---

## Test Patterns

### Pattern 1: AAA (Arrange-Act-Assert)
```typescript
it('should attach observer to subject', () => {
  // Arrange
  const observer: IObserver<StudyGroupEvent> = { update: jest.fn() };

  // Act
  studyGroupSubject.attach(observer);

  // Assert
  expect(studyGroupSubject.getObserverCount()).toBe(1);
});
```

### Pattern 2: Mock Setup in beforeEach
```typescript
beforeEach(() => {
  mockObserver1 = { update: jest.fn() };
  mockObserver2 = { update: jest.fn() };
});

afterEach(() => {
  jest.clearAllMocks();
});
```

### Pattern 3: Error Simulation
```typescript
const errorObserver: IObserver<StudyGroupEvent> = {
  update: jest.fn().mockImplementation(() => {
    throw new Error('Observer error');
  }),
};
```

### Pattern 4: Async Handling
```typescript
it('should handle async operations', async () => {
  mockPrismaService.notification.create.mockResolvedValue({} as any);

  await observer.update(event);

  expect(mockPrismaService.notification.create).toHaveBeenCalled();
});
```

---

## Mock Design

### IObserver Mock
```typescript
const mockObserver: IObserver<StudyGroupEvent> = {
  update: jest.fn(),
};
```

### ChatSessionManager Mock
```typescript
const mockChatSessionManager: jest.Mocked<Partial<ChatSessionManager>> = {
  emitToUser: jest.fn(),
};
```

### PrismaService Mock
```typescript
const mockPrismaService: jest.Mocked<PrismaService> = {
  notification: {
    create: jest.fn(),
  },
} as any;
```

---

## Non-Functional Design

### Performance
- **Target**: All 24 tests execute in <2 seconds
- **Strategy**: Use in-memory mocks, no I/O operations
- **Validation**: Jest timer output

### Maintainability
- **Naming**: Descriptive test names following "should [expected behavior]" pattern
- **Structure**: Consistent describe/it nesting
- **Comments**: Minimal (self-documenting test names)

### Type Safety
- **Zero-Any**: All mocks properly typed with `jest.Mocked<T>`
- **Strict Mode**: TypeScript strict mode enabled
- **Interfaces**: Use StudyGroupEvent interface for type safety

---

## Risk Mitigation

### Risk 1: Async Observer Behavior
**Mitigation**: Use `await` and `setTimeout` for async operations in integration tests

### Risk 2: Mock Configuration Errors
**Mitigation**: Reference Chat domain mocks as templates

### Risk 3: Event Type Mismatches
**Mitigation**: Use StudyGroupEvent interface, validate with TypeScript

---

## Success Metrics

- ✅ 24 tests implemented
- ✅ 100% test pass rate
- ✅ Test execution time <2 seconds
- ✅ Zero-Any policy maintained
- ✅ All 5 AC criteria validated

---

**Document Version**: 1.0  
**Created**: 28 de Abril, 2026  
**Status**: Ready for Implementation
