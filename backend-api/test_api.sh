#!/bin/bash

echo "=== Testing Trip Type Creation API ==="
echo ""

# First, login to get a token
echo "1. Logging in to get auth token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@drybros.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Got token successfully"
echo ""

# Test 1: Create DISTANCE type
echo "2. Creating DISTANCE type trip config..."
DISTANCE_RESPONSE=$(curl -s -X POST http://localhost:4000/trip-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "carCategory": "NORMAL",
    "type": "DISTANCE",
    "baseAmount": 500,
    "baseHour": 3,
    "baseDistance": 50,
    "extraPerDistance": 10
  }')

echo "Response: $DISTANCE_RESPONSE"
echo ""

# Test 2: Create TIME type
echo "3. Creating TIME type trip config..."
TIME_RESPONSE=$(curl -s -X POST http://localhost:4000/trip-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "carCategory": "PREMIUM",
    "type": "TIME",
    "baseAmount": 800,
    "baseHour": 3,
    "extraPerHour": 150,
    "extraPerHalfHour": 75
  }')

echo "Response: $TIME_RESPONSE"
echo ""

# Test 3: Create SLAB type with distance
echo "4. Creating SLAB type (distance) trip config..."
SLAB_DIST_RESPONSE=$(curl -s -X POST http://localhost:4000/trip-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "carCategory": "LUXURY",
    "type": "SLAB",
    "slabType": "distance",
    "distanceSlab": [
      {"from": 0, "to": 100, "price": 3000},
      {"from": 101, "to": 200, "price": 5000},
      {"from": 201, "to": 300, "price": 7000}
    ]
  }')

echo "Response: $SLAB_DIST_RESPONSE"
echo ""

# Test 4: Create SLAB type with time
echo "5. Creating SLAB type (time) trip config..."
SLAB_TIME_RESPONSE=$(curl -s -X POST http://localhost:4000/trip-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "carCategory": "SPORTS",
    "type": "SLAB",
    "slabType": "time",
    "timeSlab": [
      {"from": "00:00", "to": "06:00", "price": 500},
      {"from": "06:00", "to": "12:00", "price": 800},
      {"from": "12:00", "to": "18:00", "price": 1000},
      {"from": "18:00", "to": "23:59", "price": 1200}
    ]
  }')

echo "Response: $SLAB_TIME_RESPONSE"
echo ""

# Test 5: Get all trip types
echo "6. Getting all trip types..."
LIST_RESPONSE=$(curl -s -X GET http://localhost:4000/trip-types \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $LIST_RESPONSE"
echo ""

echo "=== Testing Complete ==="
