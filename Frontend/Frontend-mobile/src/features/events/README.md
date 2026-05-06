# Events Feature - Controller Layer (BFF)

## Overview

This module implements the Controller layer (Backend for Frontend) for the academic events query feature. It follows the MVC pattern with strict separation of concerns.

## Architecture

```
events/
├── api/
│   └── endpoints.ts          # API endpoint constants
├── services/
│   └── events.service.ts     # BFF layer with Axios
├── types/
│   └── event.types.ts        # TypeScript interfaces
└── index.ts                  # Public exports
```

## Usage

### Import the service

```typescript
import { eventsService } from '@/src/features/events';
```

### Get events with filters

```typescript
// Get all events
const response = await eventsService.getEvents();

// Get events with filters
const response = await eventsService.getEvents(
  {
    date: '2024-03-15',
    type: EventType.CONFERENCIA
  },
  {
    page: 1,
    pageSize: 20
  }
);

// Handle response
if (response.success) {
  
  
} else {
  console.error('Error:', response.error);
}
```

## Features

### ✅ FEN Format Validation

The service validates that all responses follow the strict FEN (Frontend Enveloped Network) format:

```typescript
{
  success: boolean;
  data: Event[] | null;
  error: ErrorDetails | null;
  metadata: {
    total: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

### ✅ Error Handling

The service handles multiple error scenarios:

- **Network errors**: Timeout, no connection
- **HTTP 400**: Validation errors from backend
- **HTTP 401**: Authentication errors (handled by axios interceptor)
- **HTTP 500**: Server errors
- **Invalid FEN format**: Malformed responses

### ✅ Type Safety

All types are fully typed with TypeScript:

- `Event`: Event entity with all fields
- `EventType`: Enum for event types
- `EventFilters`: Filter parameters
- `PaginationParams`: Pagination parameters
- `FENResponse<T>`: Generic FEN response wrapper

## Error Messages

The service provides user-friendly error messages in Spanish:

- `"Error de conexión. Verifica tu conexión a internet."` - Network error
- `"Error de conexión. La solicitud ha excedido el tiempo de espera."` - Timeout
- `"Respuesta del servidor en formato inválido"` - Invalid FEN format
- Backend error messages are passed through when available

## Next Steps

To complete the MVC implementation:

1. **Model Layer** (Task 8): Create MobX store in `stores/events.store.ts`
2. **View Layer** (Task 9-10): Create React components in `components/`

## Requirements Validated

- ✅ 7.2: Controller layer using Axios
- ✅ 8.5: FEN format validation before updating state
- ✅ 5.1, 5.2, 5.3: Error handling (network, 400, 500)
- ✅ 1.1: getEvents() method with filters and pagination
