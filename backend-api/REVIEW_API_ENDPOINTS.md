# Review Link API Documentation

## Overview
This API allows managers and staff to create review links for trips and send them to customers. Customers can then submit reviews using these links.

## Workflow
1. **Manager/Staff creates review link** → Gets a shareable URL with token
2. **Link sent to customer** → Via email, SMS, or any channel
3. **Customer clicks link** → Opens frontend review form
4. **Customer submits review** → Review saved to database

---

## API Endpoints

### 1. Create Review Link (Manager/Staff Only)
**Endpoint:** `POST /reviews/link/create`

**Authentication:** Required (Bearer Token)

**Roles:** ADMIN, MANAGER, OFFICE_STAFF

**Request Body:**
```json
{
  "tripId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "message": "Review link created successfully",
  "data": {
    "reviewLink": "http://localhost:3000/review/submit?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2026-03-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Trip does not have driver or customer assigned
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User doesn't have required permissions
- `404 Not Found` - Trip not found

**Token Details:**
- Token contains: tripId, driverId, customerId, franchiseId
- Token type: "review_link"
- Expires in: 30 days

---

### 2. Submit Review with Token (Public Endpoint)
**Endpoint:** `POST /reviews/submit`

**Authentication:** None (Public endpoint)

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tripRating": 5,
  "overallRating": 5,
  "driverRating": 5,
  "comment": "Excellent service! The driver was very professional and courteous."
}
```

**Response (200 OK):**
```json
{
  "message": "Review submitted successfully",
  "reviewId": "660e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid/expired token, validation error, or review already submitted
- `404 Not Found` - Trip, driver, customer, or franchise not found

**Validations:**
- All ratings must be between 1 and 5
- Comment is required (1-2000 characters)
- Token must be valid and not expired
- Review can only be submitted once per trip

**Side Effects:**
- Updates franchise average rating based on overallRating
- Updates driver current rating based on driverRating

---

## Database Schema

The review is saved in the `TripReview` table with the following structure:

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

---

## Testing with cURL

### 1. Create Review Link
```bash
curl -X POST http://localhost:4000/reviews/link/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "tripId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### 2. Submit Review
```bash
curl -X POST http://localhost:4000/reviews/submit \
  -H "Content-Type: application/json" \
  -d '{
    "token": "REVIEW_LINK_TOKEN",
    "tripRating": 5,
    "overallRating": 5,
    "driverRating": 5,
    "comment": "Great service!"
  }'
```

---

## Frontend Integration

### Token-Based Review Link
When creating a review link, the API returns:
```
http://localhost:3000/review?token={JWT_TOKEN}
```

Example:
```
http://localhost:3000/review?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Frontend Implementation Checklist
1. ✅ Route created: `/review` (token-based)
2. ✅ Parse token from URL query parameter
3. ✅ Beautiful gradient design with colorful sections
4. ✅ Header with title "Share Your Experience" and description
5. ✅ Review form with three rating fields:
   - **Trip Rating** (1-5 stars) 🚗 - "How was your trip?"
   - **Driver Rating** (1-5 stars) 👤 - "How was your driver?"
   - **Overall Rating** (1-5 stars) ⭐ - "Overall experience"
6. ✅ Comment field (text area) 💬 - "Tell us more about your experience"
7. ✅ Character counter (max 2000 characters)
8. ✅ On submit, call `POST /reviews/submit` with token and ratings
9. ✅ Show success/error messages with icons
10. ✅ Interactive star rating component with hover effects
11. ✅ No authentication required - public access via token

**Note:** This page has no navigation links and is only accessible via direct URL with a valid token.

---

## Security Notes

- Review link tokens expire after 30 days
- Tokens are signed with JWT_SECRET
- Each trip can only be reviewed once
- Token validation happens server-side
- Public endpoint doesn't require authentication (token itself authenticates the request)

---

## Swagger Documentation

Both endpoints are documented in Swagger under the **Reviews** tag:
- Access Swagger UI at: `http://localhost:4000/docs`
- Tag: Reviews
- Endpoints visible with request/response examples
