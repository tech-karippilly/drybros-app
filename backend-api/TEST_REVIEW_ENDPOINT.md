# Test Review Submission Endpoint

## Endpoint: POST /reviews/submit

### ✅ Backend Implementation Status

**Route:** `/reviews/submit` (Public endpoint - no authentication required)  
**Method:** POST  
**File:** `src/routes/review.routes.ts`

### Request Format

```json
{
  "token": "string",
  "tripRating": 5,
  "overallRating": 5,
  "driverRating": 5,
  "comment": "string"
}
```

### Validation Rules

- **token**: Required, non-empty string (JWT token)
- **tripRating**: Required, integer, 1-5
- **overallRating**: Required, integer, 1-5
- **driverRating**: Required, integer, 1-5
- **comment**: Required, 1-2000 characters, trimmed

### Response Format

**Success (200 OK):**
```json
{
  "message": "Review submitted successfully",
  "reviewId": "uuid-string"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid token, expired token, validation error, or review already submitted
- `404 Not Found` - Trip, driver, customer, or franchise not found

### Backend Flow

1. ✅ **Route registered:** `/reviews/submit`
2. ✅ **Validation:** `submitReviewWithTokenSchema` validates request body
3. ✅ **Controller:** `submitReviewWithTokenHandler` handles request
4. ✅ **Service:** `submitReviewWithToken` processes the review:
   - Verifies JWT token
   - Validates token type = "review_link"
   - Extracts tripId, driverId, customerId, franchiseId from token
   - Checks if entities exist
   - Prevents duplicate reviews
   - Creates TripReview record with all 3 ratings
   - Updates franchise average rating (using overallRating)
   - Updates driver current rating (using driverRating)

### Database Schema

```prisma
model TripReview {
  id            String   @id @default(uuid())
  tripId        String   @db.Uuid
  driverId      String   @db.Uuid
  franchiseId   String   @db.Uuid
  customerId    String   @db.Uuid
  tripRating    Int      // 1-5
  overallRating Int      // 1-5
  driverRating  Int      // 1-5
  comment       String
  createdAt     DateTime @default(now())
}
```

### Test with cURL

First, create a review link (requires authentication):
```bash
curl -X POST http://localhost:4000/reviews/link/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "tripId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

Then submit the review (public endpoint):
```bash
curl -X POST http://localhost:4000/reviews/submit \
  -H "Content-Type: application/json" \
  -d '{
    "token": "REVIEW_TOKEN_FROM_PREVIOUS_STEP",
    "tripRating": 5,
    "overallRating": 5,
    "driverRating": 4,
    "comment": "Great trip! Driver was professional and the vehicle was clean."
  }'
```

### Frontend Integration

**URL:** `http://localhost:3000/review?token={token}`

**API Call:**
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const response = await fetch(`${apiUrl}/reviews/submit`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token,
    tripRating,
    driverRating,
    overallRating,
    comment: comment.trim(),
  }),
});
```

### Security Features

- ✅ JWT token validation (verifies signature)
- ✅ Token expiration check (30 days)
- ✅ Token type validation ("review_link")
- ✅ Entity existence validation
- ✅ Duplicate submission prevention
- ✅ Public endpoint (no authentication required - token authenticates)

### Implementation Files

- **Route:** `src/routes/review.routes.ts`
- **Controller:** `src/controllers/review.controller.ts`
- **Service:** `src/services/review.service.ts`
- **DTO/Schema:** `src/types/review.dto.ts`
- **Frontend:** `app/review/page.tsx`

---

## ✅ Status: READY FOR TESTING

The endpoint is fully implemented and ready to accept review submissions!
