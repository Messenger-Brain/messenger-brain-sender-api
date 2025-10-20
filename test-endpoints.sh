#!/bin/bash

echo "🧪 Testing API Endpoints..."
echo ""

# 1. Login y guardar token
echo "1️⃣ Testing LOGIN..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@messengerbrain.com",
    "password": "messengerbrain!@."
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "✅ Login successful! Token obtained."
echo ""

# 2. Get current user
echo "2️⃣ Testing GET /api/auth/me (with JWT)..."
curl -s -X GET http://localhost:9000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin: https://send-api.messengerbrain.com" | jq .
echo ""

# 3. Get all users
echo "3️⃣ Testing GET /api/users (with JWT)..."
curl -s -X GET "http://localhost:9000/api/users?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin: https://send-api.messengerbrain.com" | jq .
echo ""

# 4. Get user by ID
echo "4️⃣ Testing GET /api/users/1 (with JWT)..."
curl -s -X GET http://localhost:9000/api/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin: https://send-api.messengerbrain.com" | jq .
echo ""

# 5. Create WhatsApp Session
echo "5️⃣ Testing POST /api/whatsapp-sessions (with JWT)..."
curl -s -X POST http://localhost:9000/api/whatsapp-sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin: https://send-api.messengerbrain.com" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+50612345678",
    "accountProtection": true,
    "logMessages": true,
    "webhookUrl": "https://example.com/webhook",
    "webhookEnabled": true
  }' | jq .
echo ""

echo "✨ Tests completed!"
