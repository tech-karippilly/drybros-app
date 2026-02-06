# Driver Penalty Deductions

This document describes the standard penalty deduction system for drivers.

## Penalty Types and Amounts

| Detection ID | Violation | Amount | Description |
|--------------|-----------|---------|-------------|
| 1 | Late report | ₹100 | Penalty for reporting late to work |
| 2 | Trip cancelled | ₹200 | Penalty for cancelling an assigned trip |
| 3 | Phone not answered | ₹50 | Penalty for not answering phone calls |
| 4 | Money not submitted before 10 PM | ₹50 | Penalty for not submitting money before 10 PM |
| 5 | Uninformed leave | ₹720 | Penalty for taking leave without prior notice |
| 6 | Not reporting office | ₹50 | Penalty for not reporting to office when required |
| 7 | Customer complaint | ₹250 | Penalty for receiving a customer complaint |

✅ **Status:** All 7 penalties have been seeded to the database!

## Quick Start

### Database Structure

Penalties are saved in the database with:
- **id** (UUID): Unique identifier for each penalty type
- **name** (string): Name of the penalty (e.g., "Late report")
- **amount** (integer): Penalty amount in Rupees
- **description** (string): Detailed description
- **type** (enum): PENALTY or DEDUCTION
- **isActive** (boolean): Whether penalty is currently active

### API Endpoints Available

✅ **POST** `/penalties` - Create new penalty deduction
✅ **GET** `/penalties` - Get all penalty deductions  
✅ **GET** `/penalties/:id` - Get specific penalty by ID
✅ **PATCH** `/penalties/:id` - Update penalty deduction
✅ **DELETE** `/penalties/:id` - Delete (deactivate) penalty deduction
✅ **POST** `/penalties/apply/driver/:driverId` - Apply penalty to driver
✅ **POST** `/penalties/apply/drivers` - Apply penalty to multiple drivers

**Full API Documentation:** See [PENALTY_DEDUCTION_API.md](./PENALTY_DEDUCTION_API.md)

**Testing Guide:** See [TEST_PENALTY_API.md](./TEST_PENALTY_API.md)

### 2. Using Penalties in Code

#### Backend

Import the constants in your services or controllers:

```typescript
import { DRIVER_PENALTY_DEDUCTIONS, PENALTY_DEDUCTION_LIST } from '../constants/penalty';

// Get a specific penalty
const lateReportPenalty = DRIVER_PENALTY_DEDUCTIONS.LATE_REPORT;
console.log(lateReportPenalty.name); // "Late report"
console.log(lateReportPenalty.amount); // 100

// Get all penalties as an array
const allPenalties = PENALTY_DEDUCTION_LIST;
```

#### Frontend

Import the constants in your components:

```typescript
import { DRIVER_PENALTY_DEDUCTIONS, formatPenaltyAmount } from '@/lib/constants/penalty';

// Display penalty amount
const amount = formatPenaltyAmount(DRIVER_PENALTY_DEDUCTIONS.TRIP_CANCELLED.amount);
console.log(amount); // "₹200"
```

## API Usage

### Applying a Penalty to a Driver

Use the existing penalty API endpoints to apply these penalties:

```typescript
POST /api/penalties/apply-to-driver
{
  "driverId": "driver-uuid",
  "penaltyId": "penalty-uuid", // ID from the Penalty table
  "amount": 100, // Can override default amount
  "reason": "Driver reported 30 minutes late",
  "violationDate": "2026-02-06T09:30:00Z"
}
```

### Getting All Available Penalties

```typescript
GET /api/penalties?type=PENALTY&isActive=true
```

This returns all active penalty types that can be applied to drivers.

## Notes

- All amounts are in Indian Rupees (₹)
- Penalties are deducted from driver earnings
- Each penalty application is tracked in the `DriverPenalty` table
- Penalties can be viewed in driver transaction history
- The penalty system supports both standard penalties (these deductions) and custom penalties

## Database Schema

The system uses two main tables:

1. **Penalty**: Defines penalty types and default amounts
2. **DriverPenalty**: Records of penalties applied to specific drivers

See the Prisma schema for complete details.
