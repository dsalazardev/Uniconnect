# Visual Diagrams: Backend Duplication and Home Grid

**Change ID**: `fix-backend-duplication-and-home-grid`

---

## 🔄 Backend Event Flow

### BEFORE (Current - Duplicate Notifications)

```mermaid
sequenceDiagram
    participant Owner
    participant Service as GroupInvitationsService
    participant EventEmitter
    participant Listener as NotificationListener
    participant DB as Database
    participant Requester

    Owner->>Service: acceptJoinRequest(requestId)
    Service->>EventEmitter: emit(GROUP_JOIN_REQUEST_ACCEPTED)
    Service->>EventEmitter: emit(USER_JOINED_GROUP)
    
    EventEmitter->>Listener: handleGroupJoinRequestAccepted()
    Listener->>DB: create notification (type: join_request_accepted)
    DB-->>Requester: Notification 1: "Tu solicitud fue aceptada"
    
    EventEmitter->>Listener: handleUserJoinedGroup()
    Listener->>DB: create notification (type: user_joined_group)
    DB-->>Requester: Notification 2: "X se unió al grupo"
    
    Note over Requester: ❌ PROBLEM: 2 notifications for 1 action
```

### AFTER (Proposed - Single Notification)

```mermaid
sequenceDiagram
    participant Owner
    participant Service as GroupInvitationsService
    participant EventEmitter
    participant Listener as NotificationListener
    participant NotifService as NotificationsService
    participant DB as Database
    participant Requester

    Owner->>Service: acceptJoinRequest(requestId)
    Service->>EventEmitter: emit(GROUP_JOIN_REQUEST_ACCEPTED)
    Note over Service: ✅ USER_JOINED_GROUP removed
    
    EventEmitter->>Listener: handleGroupJoinRequestAccepted()
    Listener->>NotifService: createNotificationIdempotent()
    NotifService->>DB: Check for duplicate (5-second window)
    DB-->>NotifService: No duplicate found
    NotifService->>DB: create notification (type: join_request_accepted)
    DB-->>Requester: Notification: "Tu solicitud fue aceptada"
    
    Note over Requester: ✅ SOLUTION: 1 notification for 1 action
```

---

## 🛡️ Idempotency Flow

### Duplicate Prevention Logic

```mermaid
flowchart TD
    Start([createNotificationIdempotent called]) --> CheckWindow{Check last 5 seconds}
    
    CheckWindow -->|Duplicate found| LogWarn[Log warning]
    LogWarn --> Skip[Skip creation]
    Skip --> End([Return])
    
    CheckWindow -->|No duplicate| Create[Create notification]
    Create --> Success[Log success]
    Success --> End
    
    CheckWindow -->|Error| Catch[Catch error]
    Catch --> LogError[Log error]
    LogError --> End
    
    style Start fill:#4CAF50
    style End fill:#4CAF50
    style Skip fill:#FFC107
    style Create fill:#2196F3
    style LogWarn fill:#FF9800
    style LogError fill:#F44336
```

### Database Query Flow

```mermaid
flowchart LR
    A[Notification Request] --> B{Query: Find duplicate}
    B -->|WHERE| C[id_user = X]
    C --> D[related_entity_id = Y]
    D --> E[notification_type = Z]
    E --> F[created_at >= 5 seconds ago]
    
    F -->|Found| G[Skip creation]
    F -->|Not found| H[Create notification]
    
    style A fill:#4CAF50
    style G fill:#FFC107
    style H fill:#2196F3
```

---

## 🖥️ Frontend Layout Transformation

### BEFORE (Current - Empty Center)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────┐  ┌────────────────────────────┐  ┌──────────────┐  │
│  │         │  │                            │  │              │  │
│  │ Sidebar │  │      ❌ EMPTY CENTER       │  │ Right Panel  │  │
│  │ 240px   │  │      (No max-width)        │  │ 300px        │  │
│  │         │  │                            │  │              │  │
│  │ Nav     │  │  Header                    │  │ Featured     │  │
│  │ Links   │  │                            │  │ Groups       │  │
│  │         │  │  Events Carousel           │  │              │  │
│  │ • Home  │  │  (Stretched too wide)      │  │ • Group 1    │  │
│  │ • Events│  │                            │  │ • Group 2    │  │
│  │ • Groups│  │  ⚠️ Visual gaps            │  │ • Group 3    │  │
│  │ • Comm. │  │  ⚠️ Poor hierarchy         │  │              │  │
│  │         │  │                            │  │              │  │
│  │         │  │                            │  │              │  │
│  └─────────┘  └────────────────────────────┘  └──────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### AFTER (Proposed - Centered Content)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────┐  ┌────────────────────────────┐  ┌──────────────┐  │
│  │         │  │                            │  │              │  │
│  │ Sidebar │  │  ✅ CENTERED FEED          │  │ Right Panel  │  │
│  │ 240px   │  │  (max-width: 800px)        │  │ 300px        │  │
│  │         │  │                            │  │              │  │
│  │ Nav     │  │  ┌──────────────────────┐  │  │ Featured     │  │
│  │ Links   │  │  │ Header               │  │  │ Groups       │  │
│  │         │  │  └──────────────────────┘  │  │              │  │
│  │ • Home  │  │  ┌──────────────────────┐  │  │ • Group 1    │  │
│  │ • Events│  │  │ Events Carousel      │  │  │ • Group 2    │  │
│  │ • Groups│  │  │ (Optimal width)      │  │  │ • Group 3    │  │
│  │ • Comm. │  │  └──────────────────────┘  │  │ • Group 4    │  │
│  │ • Conn. │  │  ┌──────────────────────┐  │  │ • Group 5    │  │
│  │ • Notif.│  │  │ Groups Section       │  │  │ • Group 6    │  │
│  │ • Prof. │  │  │ (4 cards grid)       │  │  │ • Group 7    │  │
│  │         │  │  └──────────────────────┘  │  │ • Group 8    │  │
│  │         │  │                            │  │              │  │
│  └─────────┘  └────────────────────────────┘  └──────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📐 Layout Dimensions

### Desktop Grid Breakdown

```
┌─────────────────────────────────────────────────────────┐
│                    Total Width: 1340px                  │
├──────────┬──────────────────────────────┬───────────────┤
│ Sidebar  │       Center Feed            │  Right Panel  │
│ 240px    │       max 800px              │  300px        │
│ (Fixed)  │       (Flexible)             │  (Fixed)      │
└──────────┴──────────────────────────────┴───────────────┘

Responsive Breakpoints:
┌─────────────┬──────────┬─────────────────────────────────┐
│ Screen Size │ Layout   │ Columns                         │
├─────────────┼──────────┼─────────────────────────────────┤
│ < 768px     │ Mobile   │ Single (full width)             │
│ 768-1023px  │ Mobile   │ Single (full width)             │
│ ≥ 1024px    │ Desktop  │ 3-column (240 + 800 + 300)      │
└─────────────┴──────────┴─────────────────────────────────┘
```

---

## 🔄 Component Hierarchy

### Desktop Layout Structure

```mermaid
graph TD
    Root[HomeScreen] --> Responsive{useResponsive}
    
    Responsive -->|isMobile| Mobile[MobileLayout]
    Responsive -->|isDesktop| Desktop[DesktopLayout]
    
    Desktop --> Container[desktopContainer View]
    Container --> Sidebar[Sidebar Component]
    Container --> CenterFeed[centerFeed ScrollView]
    Container --> RightPanel[RightPanel Component]
    
    CenterFeed --> Header[Header Component]
    CenterFeed --> CenterContent[centerContent View]
    
    CenterContent --> EventsSection[Events Section]
    CenterContent --> GroupsSection[Groups Section]
    
    EventsSection --> EventsCarousel[EventsCarousel Component]
    GroupsSection --> GroupCards[Group Cards Grid]
    
    style Root fill:#4CAF50
    style Desktop fill:#2196F3
    style Mobile fill:#2196F3
    style Container fill:#9C27B0
    style CenterContent fill:#FF9800
```

---

## 📊 Notification Flow Comparison

### Current Flow (Duplicate Notifications)

```
Join Request Acceptance:
┌─────────────────────────────────────────────────────────┐
│ Owner accepts request                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─► Event 1: GROUP_JOIN_REQUEST_ACCEPTED
                 │   └─► Notification 1 to Requester ✅
                 │
                 └─► Event 2: USER_JOINED_GROUP
                     └─► Notification 2 to Requester ❌ (DUPLICATE)
                     └─► Notification to each Member ✅

Result: Requester gets 2 notifications (1 duplicate)
```

### Proposed Flow (Single Notification)

```
Join Request Acceptance:
┌─────────────────────────────────────────────────────────┐
│ Owner accepts request                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 └─► Event: GROUP_JOIN_REQUEST_ACCEPTED
                     └─► Notification to Requester ✅
                     └─► Idempotency check prevents duplicates ✅

Result: Requester gets 1 notification (no duplicates)
```

---

## 🎯 Success Metrics

### Backend Improvements

```
┌─────────────────────────────────────────────────────────┐
│ Metric                    │ Before  │ After  │ Change   │
├───────────────────────────┼─────────┼────────┼──────────┤
│ Notifications per join    │ 2       │ 1      │ -50%     │
│ DB writes per join        │ 2       │ 1      │ -50%     │
│ Duplicate rate            │ 100%    │ 0%     │ -100%    │
│ Query overhead            │ 0ms     │ <5ms   │ +5ms     │
└─────────────────────────────────────────────────────────┘
```

### Frontend Improvements

```
┌─────────────────────────────────────────────────────────┐
│ Metric                    │ Before  │ After  │ Change   │
├───────────────────────────┼─────────┼────────┼──────────┤
│ Center content width      │ Flex    │ 800px  │ Fixed    │
│ Empty space               │ Yes     │ No     │ ✅       │
│ Visual hierarchy          │ Poor    │ Good   │ ✅       │
│ Mobile layout             │ Good    │ Good   │ No change│
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Backend Testing Flow

```mermaid
flowchart TD
    Start([Start Testing]) --> Unit[Unit Tests]
    Unit --> Integration[Integration Tests]
    Integration --> Regression[Regression Tests]
    Regression --> Manual[Manual Testing]
    Manual --> Performance[Performance Testing]
    Performance --> End([All Tests Pass])
    
    Unit -.->|Fail| Fix1[Fix Issues]
    Integration -.->|Fail| Fix2[Fix Issues]
    Regression -.->|Fail| Fix3[Fix Issues]
    Manual -.->|Fail| Fix4[Fix Issues]
    Performance -.->|Fail| Fix5[Fix Issues]
    
    Fix1 --> Unit
    Fix2 --> Integration
    Fix3 --> Regression
    Fix4 --> Manual
    Fix5 --> Performance
    
    style Start fill:#4CAF50
    style End fill:#4CAF50
    style Unit fill:#2196F3
    style Integration fill:#2196F3
    style Regression fill:#2196F3
    style Manual fill:#FF9800
    style Performance fill:#FF9800
```

---

**Diagrams Complete** ✅  
**Ready for Implementation** ✅
