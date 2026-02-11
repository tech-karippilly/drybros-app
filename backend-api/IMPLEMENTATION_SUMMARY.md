# Online Status Feature - Implementation Summary

## ✅ Completed Changes

### 1. Database Schema Updates
- **File**: `prisma/schema.prisma`
- **Changes**:
  - Added `onlineStatus` (Boolean, default: false) to Driver model
  - Added `lastStatusChange` (DateTime, nullable) to Driver model
  - Added `onlineStatus` (Boolean, default: false) to Staff model
  - Added `lastStatusChange` (DateTime, nullable) to Staff model
- **Migration**: `20260209074928_add_online_status_to_staff_and_driver` ✅ Applied

### 2. Repository Layer
**driver.repository.ts**
- ✅ `updateDriverOnlineStatus(driverId, onlineStatus)` - Updates driver online status
- ✅ `getOnlineDrivers(franchiseId?)` - Returns list of online drivers with filtering

**staff.repository.ts**
- ✅ `updateStaffOnlineStatus(staffId, onlineStatus)` - Updates staff online status
- ✅ `getOnlineStaff(franchiseId?)` - Returns list of online staff with filtering

### 3. Service Layer
**activity.service.ts**
- ✅ Added imports for `updateDriverOnlineStatus` and `updateStaffOnlineStatus`
- ✅ Modified `logActivity()` to automatically update online status when:
  - `DRIVER_CLOCK_IN` / `STAFF_CLOCK_IN` → sets onlineStatus = true
  - `DRIVER_CLOCK_OUT` / `STAFF_CLOCK_OUT` → sets onlineStatus = false
- ✅ Emits socket events for status changes via `socketService.emitStaffStatusChange()` and `socketService.emitDriverStatusChange()`

### 4. Socket Layer
**socket.service.ts**
- ✅ Added `StatusChangePayload` interface
- ✅ Added imports for `getOnlineDrivers` and `getOnlineStaff`
- ✅ Added `emitStaffStatusChange(staffId, isOnline, franchiseId)` method
- ✅ Added `emitDriverStatusChange(driverId, isOnline, franchiseId)` method
- ✅ Added socket event handler for `GET_ONLINE_STAFF`
- ✅ Added socket event handler for `GET_ONLINE_DRIVERS`
- ✅ Role-based access control in socket handlers (ADMIN sees all, MANAGER/STAFF see only their franchise)

**constants/socket.ts**
- ✅ Added new socket events:
  - `STAFF_STATUS_CHANGED: "staff:status-changed"`
  - `DRIVER_STATUS_CHANGED: "driver:status-changed"`
  - `ONLINE_STAFF_LIST: "online:staff-list"`
  - `ONLINE_DRIVERS_LIST: "online:drivers-list"`
  - `GET_ONLINE_STAFF: "/online/staff"`
  - `GET_ONLINE_DRIVERS: "/online/drivers"`

## 📋 How It Works

### Clock-In Flow
```
1. User calls clock-in endpoint (attendance controller)
2. Attendance record created in database
3. logActivity() called with STAFF_CLOCK_IN/DRIVER_CLOCK_IN
4. activity.service.ts:
   - Creates activity log
   - Calls updateStaffOnlineStatus(staffId, true)
   - Emits socket event via emitStaffStatusChange()
5. Socket broadcasts to:
   - Individual's room
   - Franchise room
   - All admins room
   - All managers room
6. Connected clients receive real-time update
```

### Clock-Out Flow
```
Same as clock-in, but sets onlineStatus = false
```

### Getting Online Staff/Drivers
```
Client → socket.emit("/online/staff", { franchiseId })
      → Socket handler validates role and franchiseId
      → Calls getOnlineStaff(franchiseId)
      → Returns list via acknowledgment callback
      → Client receives: { data: [...online staff] }
```

### Real-Time Updates
```
When status changes:
  Socket Server → Emits to rooms:
    - driver:{driverId} / staff:{staffId}
    - franchise:{franchiseId}
    - room:all_admins
    - room:all_managers

Clients listening → Receive payload:
  {
    id: string,
    onlineStatus: boolean,
    lastStatusChange: Date,
    franchiseId?: string
  }
```

## 🧪 Testing Status

### TypeScript Compilation
- ✅ All modified files have no TypeScript errors
- ✅ Database migration applied successfully
- ✅ Prisma Client regenerated

### Files Modified
1. ✅ `prisma/schema.prisma`
2. ✅ `src/repositories/driver.repository.ts`
3. ✅ `src/repositories/staff.repository.ts`
4. ✅ `src/services/activity.service.ts`
5. ✅ `src/services/socket.service.ts`
6. ✅ `src/constants/socket.ts`

### Documentation Created
1. ✅ `ONLINE_STATUS_IMPLEMENTATION.md` - Complete implementation guide
2. ✅ `EXAMPLE_ATTENDANCE_CONTROLLER.ts` - Reference implementation

## 🚀 Next Steps for Frontend/Mobile

### Frontend (React/Next.js)
```typescript
// Hook to get online staff
const { onlineStaff } = useOnlineStaff(franchiseId);

// Listen for status changes
socket.on("staff:status-changed", (payload) => {
  // Update UI
});
```

### Mobile (React Native)
```typescript
// Request online drivers
socket.emit("/online/drivers", { franchiseId }, (response) => {
  if (response.data) {
    setOnlineDrivers(response.data);
  }
});
```

## 📝 Notes

- No breaking changes to existing API
- Backward compatible with existing attendance system
- Automatically updates status on clock-in/out
- Role-based filtering ensures data security
- Real-time updates via WebSocket
- Efficient room-based broadcasting

## 🔍 Verification Commands

```bash
# Check database schema
npx prisma db pull

# View online staff
psql -d drybros -c "SELECT id, name, onlineStatus, lastStatusChange FROM \"Staff\" WHERE onlineStatus = true;"

# View online drivers
psql -d drybros -c "SELECT id, firstName, lastName, driverCode, onlineStatus, lastStatusChange FROM \"Driver\" WHERE onlineStatus = true;"
```

## ⚠️ Important

- Ensure your attendance controller calls `logActivity()` with the correct action types:
  - Use `ActivityAction.STAFF_CLOCK_IN` for staff
  - Use `ActivityAction.DRIVER_CLOCK_IN` for drivers
  - Use `ActivityAction.STAFF_CLOCK_OUT` for staff clock-out
  - Use `ActivityAction.DRIVER_CLOCK_OUT` for driver clock-out

The system will automatically handle the rest!
