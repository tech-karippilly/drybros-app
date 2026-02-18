# Socket.IO Implementation Guide

## Overview

This document explains how the Socket.IO real-time communication system is implemented in the DryBros platform and how to add new events.

## Architecture

### System Components

1. **Backend Server** (`backend-api/src/services/socket.service.ts`)
   - Uses `socket.io` package (v4.8.3)
   - Integrated with Express HTTP server
   - Handles authentication via JWT tokens
   - Manages room-based event broadcasting

2. **Web Client** (`web/services/socketService.ts`)
   - Uses `socket.io-client` package
   - Singleton service pattern
   - Automatic reconnection with debouncing
   - Event listener management

3. **Mobile Client** (`mobile/src/services/realtime/socket.ts`)
   - Uses `socket.io-client` package
   - Connection management with AsyncStorage
   - Driver-specific event handling

## Event Structure

### Constants Files

All socket events are defined in constants files for consistency:

- **Backend**: `backend-api/src/constants/socket.ts`
- **Web**: `web/lib/constants/socket.ts`
- **Mobile**: `mobile/src/constants/socket.ts`

### Current Event Categories

1. **Connection Events**
   - `connect`, `disconnect`, `connection_error`

2. **Trip Dispatch Events** (Driver app)
   - `trip_offer`, `trip_offer_accept`, `trip_offer_reject`
   - `trip_offer_result`, `trip_assigned`, `trip_offer_cancelled`

3. **Online Status Events**
   - `staff:status-changed`, `driver:status-changed`
   - `online:staff-list`, `online:drivers-list`

4. **Attendance Events**
   - `attendance:clock-in`, `attendance:clock-out`
   - `attendance:login`, `attendance:logout`

5. **Activity & Notification Events**
   - `activity_log_created`, `notification_created`

## Adding a New Event

### Step 1: Define Event Name

Add your event to all constants files:

**Backend** (`backend-api/src/constants/socket.ts`):
```typescript
export const SOCKET_EVENTS = {
  // ... existing events
  YOUR_NEW_EVENT: "your_new_event",
} as const;
```

**Web** (`web/lib/constants/socket.ts`):
```typescript
export const SOCKET_EVENTS = {
  // ... existing events
  YOUR_NEW_EVENT: "your_new_event",
} as const;
```

**Mobile** (`mobile/src/constants/socket.ts`):
```typescript
export const SOCKET_EVENTS = {
  // ... existing events
  YOUR_NEW_EVENT: 'your_new_event',
} as const;
```

### Step 2: Define Payload Interface (Backend)

Add your event payload interface in `backend-api/src/services/socket.service.ts`:

```typescript
// Your new event payload
export interface YourNewEventPayload {
  id: string;
  message: string;
  timestamp: Date;
  // Add your fields here
}
```

### Step 3: Add Event Handler (Backend)

Add your event listener in the socket service:

```typescript
// Handle your new event
socket.on(SOCKET_EVENTS.YOUR_NEW_EVENT, async (payload: YourNewEventPayload) => {
  try {
    this.consoleLog("your_new_event_received", {
      socketId: socket.id,
      payload,
      ...SocketService.getSocketIdentity(socket)
    });
    
    // Handle your event logic here
    // Example: Process the payload and emit response
    
    // Emit response to relevant rooms
    if (userData.franchiseId) {
      this.io?.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${userData.franchiseId}`).emit(
        SOCKET_EVENTS.YOUR_NEW_EVENT,
        {
          ...payload,
          processed: true,
          processedAt: new Date().toISOString()
        }
      );
    }
    
    logger.debug("Your new event processed", { eventId: payload.id });
  } catch (error) {
    logger.error("Error processing your new event", {
      error: error instanceof Error ? error.message : String(error),
      socketId: socket.id,
      payload
    });
    socket.emit(SOCKET_EVENTS.ERROR, { message: "Failed to process your event" });
  }
});
```

### Step 4: Add Emit Method (Backend)

Add a method to emit your event from services:

```typescript
/**
 * Emit your new event
 */
emitYourNewEvent(franchiseId: string, payload: YourNewEventPayload): void {
  if (!this.io) return;
  
  // Emit to franchise room
  this.io.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${franchiseId}`).emit(
    SOCKET_EVENTS.YOUR_NEW_EVENT,
    payload
  );
  
  // Emit to admins for monitoring
  this.io.to(SOCKET_ROOMS.ALL_ADMINS).emit(SOCKET_EVENTS.YOUR_NEW_EVENT, payload);
  
  logger.debug("Your new event emitted", { 
    eventId: payload.id,
    franchiseId 
  });
}
```

### Step 5: Add Listener (Web Frontend)

Add your event listener to the web socket service:

```typescript
// Your new event
this.socket.on(SOCKET_EVENTS.YOUR_NEW_EVENT, (payload: any) => {
  this.emitEvent(SOCKET_EVENTS.YOUR_NEW_EVENT, payload);
});
```

## Usage Examples

### Backend Service (Emit from anywhere)

```typescript
import { socketService } from '../services/socket.service';

// Emit your event
socketService.emitYourNewEvent('franchise-123', {
  id: 'event-1',
  message: 'Hello from backend',
  timestamp: new Date()
});
```

### Web Frontend (Listen for events)

```typescript
import { socketService, SOCKET_EVENTS } from '../services/socketService';

// Listen for your event
const handleYourEvent = (payload) => {
  console.log('Received new event:', payload);
  // Handle the event
};

socketService.on(SOCKET_EVENTS.YOUR_NEW_EVENT, handleYourEvent);

// Don't forget to remove listener when component unmounts
// socketService.off(SOCKET_EVENTS.YOUR_NEW_EVENT, handleYourEvent);
```

### Mobile App (Emit event)

```typescript
import { getDriverSocket } from '../services/realtime/socket';
import { SOCKET_EVENTS } from '../constants/socket';

const socket = getDriverSocket();
if (socket) {
  socket.emit(SOCKET_EVENTS.YOUR_NEW_EVENT, {
    id: 'event-1',
    message: 'Hello from mobile',
    timestamp: new Date().toISOString()
  });
}
```

## Room System

### Room Types

1. **User-specific rooms**: `user:{id}`
2. **Driver-specific rooms**: `driver:{id}`
3. **Staff-specific rooms**: `staff:{id}`
4. **Franchise-specific rooms**: `franchise:{id}`
5. **Role-based rooms**: 
   - `room:all_admins`
   - `room:all_managers`
   - `room:all_drivers`
   - `room:all_staff`

### Joining Rooms

```typescript
// Backend - automatically joins appropriate rooms on connection
socket.join(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${franchiseId}`);
socket.join(SOCKET_ROOMS.ALL_ADMINS);

// Web/Mobile - manually join rooms
socketService.joinRoom('franchise:123');
```

## Authentication

All socket connections require JWT authentication:

```typescript
// Web client
const token = localStorage.getItem('accessToken');
const socket = io(apiUrl, {
  auth: { token }
});

// Mobile client
const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
const socket = io(baseUrl, {
  transports: ['websocket'],
  auth: { token }
});
```

## Error Handling

Always include proper error handling:

```typescript
try {
  // Your socket logic
} catch (error) {
  logger.error("Error processing event", {
    error: error instanceof Error ? error.message : String(error),
    socketId: socket.id
  });
  socket.emit(SOCKET_EVENTS.ERROR, { message: "Failed to process event" });
}
```

## Debugging

### Development Logging

The system includes built-in logging for development:

```typescript
// Enable/disable console logs
private shouldConsoleLog(): boolean {
  return config.nodeEnv === "development" || config.nodeEnv === "DEVELOPMENT";
}

// Log events
this.consoleLog("event_name", { metadata });
```

### Monitoring Connections

```typescript
// Get connected users count
const count = socketService.getConnectedUsersCount();

// Check connection status
if (socketService.isConnected()) {
  // Connection is active
}
```

## Best Practices

1. **Consistency**: Keep event names and payload structures consistent across platforms
2. **Types**: Define proper TypeScript interfaces for all payloads
3. **Rooms**: Use appropriate rooms for targeted broadcasting
4. **Error Handling**: Always wrap event handlers in try-catch blocks
5. **Cleanup**: Remove event listeners when components unmount
6. **Validation**: Validate payloads before processing
7. **Logging**: Use appropriate log levels (debug, info, warn, error)
8. **Performance**: Avoid sending large payloads; consider pagination for lists

## Testing

### Manual Testing

1. Start the backend server
2. Connect from web/mobile client
3. Emit the event from one client
4. Listen for it on another client

### Automated Testing

```typescript
// Example test structure
describe('Socket Events', () => {
  test('should handle your new event', async () => {
    // Test implementation
  });
});
```

## Common Patterns

### 1. Request-Response Pattern

```typescript
// Client sends request
socket.emit('get_data', { id: '123' }, (response) => {
  // Handle response
});

// Server handles and responds
socket.on('get_data', (payload, callback) => {
  // Process and respond
  callback({ data: result });
});
```

### 2. Broadcast Pattern

```typescript
// Emit to specific room
socketService.getIO()?.to('room:franchise-123').emit('event', payload);

// Emit to all connected clients
socketService.getIO()?.emit('event', payload);
```

### 3. Acknowledgment Pattern

```typescript
// Client
socket.emit('event', data, (ack) => {
  if (ack.success) {
    // Handle success
  }
});

// Server
socket.on('event', (data, callback) => {
  // Process
  callback({ success: true });
});
```

## Troubleshooting

### Common Issues

1. **Connection fails**: Check JWT token validity and CORS configuration
2. **Events not received**: Verify room membership and event names match
3. **Authentication errors**: Ensure token format is correct (should start with 'eyJ')
4. **Memory leaks**: Always remove event listeners when components unmount

### Debug Checklist

- [ ] Event names match across all platforms
- [ ] Payload structure is consistent
- [ ] Authentication token is valid
- [ ] Client is connected to the correct room
- [ ] Server is emitting to the correct room
- [ ] Event listeners are properly added/removed
- [ ] Error handling is implemented

## Version Information

- **Socket.IO Server**: v4.8.3
- **Socket.IO Client**: Latest compatible version
- **Node.js**: v18+ recommended