# Online Status Implementation

## Overview
This implementation adds real-time online/offline status tracking for Staff and Drivers with clock-in/clock-out functionality.

## Database Changes

### Added Fields
**Driver Model:**
- `onlineStatus: Boolean` (default: false)
- `lastStatusChange: DateTime?`

**Staff Model:**
- `onlineStatus: Boolean` (default: false)
- `lastStatusChange: DateTime?`

**Migration:** `20260209074928_add_online_status_to_staff_and_driver`

## Backend Implementation

### 1. Repository Functions

**driver.repository.ts:**
- `updateDriverOnlineStatus(driverId, onlineStatus)` - Updates driver status
- `getOnlineDrivers(franchiseId?)` - Gets list of online drivers

**staff.repository.ts:**
- `updateStaffOnlineStatus(staffId, onlineStatus)` - Updates staff status
- `getOnlineStaff(franchiseId?)` - Gets list of online staff

### 2. Activity Service Updates

**activity.service.ts:**
- Modified `logActivity()` to automatically update online status on clock-in/out
- Emits socket events for status changes
- Actions handled:
  - `DRIVER_CLOCK_IN` → sets onlineStatus = true
  - `DRIVER_CLOCK_OUT` → sets onlineStatus = false
  - `STAFF_CLOCK_IN` → sets onlineStatus = true
  - `STAFF_CLOCK_OUT` → sets onlineStatus = false

### 3. Socket Service Updates

**New Socket Events:**
- `staff:status-changed` - Emitted when staff status changes
- `driver:status-changed` - Emitted when driver status changes
- `online:staff-list` - Response event with online staff list
- `online:drivers-list` - Response event with online drivers list
- `/online/staff` - Request to get online staff
- `/online/drivers` - Request to get online drivers

**New Methods:**
- `emitStaffStatusChange(staffId, isOnline, franchiseId?)` - Broadcasts staff status change
- `emitDriverStatusChange(driverId, isOnline, franchiseId?)` - Broadcasts driver status change

**Socket Event Handlers:**
- `GET_ONLINE_STAFF` - Returns list of online staff (role-based filtering)
- `GET_ONLINE_DRIVERS` - Returns list of online drivers (role-based filtering)

## Client Usage

### Socket.IO Client Example

```typescript
// Get online staff
socket.emit("/online/staff", { franchiseId: "123" }, (response) => {
  if (response.data) {
    console.log("Online staff:", response.data);
    // response.data contains array of staff with:
    // { id, name, email, phone, onlineStatus, lastStatusChange, franchiseId }
  }
});

// Get online drivers
socket.emit("/online/drivers", { franchiseId: "123" }, (response) => {
  if (response.data) {
    console.log("Online drivers:", response.data);
    // response.data contains array of drivers with:
    // { id, firstName, lastName, driverCode, phone, onlineStatus, 
    //   lastStatusChange, franchiseId, driverTripStatus, currentLat, currentLng }
  }
});

// Listen for staff status changes
socket.on("staff:status-changed", (payload) => {
  console.log("Staff status changed:", payload);
  // payload: { id, onlineStatus, lastStatusChange, franchiseId }
  // Update UI to show staff online/offline
});

// Listen for driver status changes
socket.on("driver:status-changed", (payload) => {
  console.log("Driver status changed:", payload);
  // payload: { id, onlineStatus, lastStatusChange, franchiseId }
  // Update UI to show driver online/offline
});
```

### REST API Integration

When staff/driver clocks in via your attendance endpoint:

```typescript
// Your attendance controller/service should call:
await logActivity({
  action: ActivityAction.STAFF_CLOCK_IN, // or DRIVER_CLOCK_IN
  entityType: ActivityEntityType.ATTENDANCE,
  entityId: attendanceId,
  staffId: staffId, // or driverId for drivers
  franchiseId: franchiseId,
  description: 'Staff clocked in',
});

// This automatically:
// 1. Creates activity log
// 2. Updates onlineStatus = true in database
// 3. Emits socket event to all connected clients
```

## Role-Based Access Control

### Permissions
- **ADMIN**: Can view all online staff/drivers across all franchises
- **MANAGER**: Can only view online staff/drivers in their own franchise
- **STAFF/OFFICE_STAFF**: Can only view online staff/drivers in their own franchise
- **DRIVER**: (Not applicable for this feature)

The socket handlers automatically enforce franchise filtering based on user role.

## Real-Time Updates

When a staff member or driver clocks in/out:
1. Database is updated with new status
2. Socket event is emitted to:
   - The individual (their own room)
   - Their franchise room
   - All admins room
   - All managers room
3. Connected clients receive real-time updates

## Frontend Integration Tips

### React Hook Example

```typescript
function useOnlineStaff(franchiseId?: string) {
  const [onlineStaff, setOnlineStaff] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    // Get initial list
    socket.emit("/online/staff", { franchiseId }, (response) => {
      if (response.data) {
        setOnlineStaff(response.data);
      }
    });

    // Listen for changes
    const handleStatusChange = (payload) => {
      setOnlineStaff((prev) => {
        if (payload.onlineStatus) {
          // Staff came online - add if not exists
          return prev.find(s => s.id === payload.id) 
            ? prev 
            : [...prev, payload];
        } else {
          // Staff went offline - remove
          return prev.filter(s => s.id !== payload.id);
        }
      });
    };

    socket.on("staff:status-changed", handleStatusChange);

    return () => {
      socket.off("staff:status-changed", handleStatusChange);
    };
  }, [franchiseId]);

  return onlineStaff;
}
```

## Testing

### Test Scenarios
1. Staff clocks in → verify onlineStatus becomes true
2. Staff clocks out → verify onlineStatus becomes false
3. Socket client requests online staff → verify correct list returned
4. Status change → verify socket event received by connected clients
5. Franchise filtering → verify managers only see their franchise
6. Multiple clocks in/out → verify lastStatusChange updates correctly

### Manual Testing

```bash
# In one terminal - watch database
psql -d drybros -c "SELECT id, name, onlineStatus, lastStatusChange FROM \"Staff\" WHERE onlineStatus = true;"

# In another terminal - test socket connection
# Use a socket.io client or Postman with WebSocket support
```

## Notes
- Status automatically updates on clock-in/out
- No need to manually call status update endpoints
- Offline status may need periodic cleanup for crashed apps
- Consider implementing heartbeat mechanism for production
- Socket rooms ensure efficient message delivery
- lastStatusChange helps track activity patterns
