#!/bin/bash

echo "🧪 Testing API Endpoints with Personal Token..."
echo ""

# Primero necesitamos crear un personal token
# Para esto necesitamos hacer login primero desde el origen correcto
echo "1️⃣ Creating Personal Token..."

# Login desde el origen correcto para obtener JWT
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://send-api.messengerbrain.com" \
  -d '{
    "email": "admin@messengerbrain.com",
    "password": "messengerbrain!@."
  }')

JWT_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "✅ JWT obtained for admin"
echo ""

# Crear personal token usando JWT
echo "2️⃣ Creating personal access token..."
PERSONAL_TOKEN_RESPONSE=$(curl -s -X POST http://localhost:9000/api/tokens \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Origin: https://send-api.messengerbrain.com" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test Token"
  }')

echo $PERSONAL_TOKEN_RESPONSE | jq .
PERSONAL_TOKEN=$(echo $PERSONAL_TOKEN_RESPONSE | jq -r '.data.token.value // .data.value // empty')

if [ -z "$PERSONAL_TOKEN" ]; then
  echo "❌ Failed to create personal token"
  exit 1
fi

echo ""
echo "✅ Personal Token created: ${PERSONAL_TOKEN:0:50}..."
echo ""

# Ahora probamos endpoints con personal token (sin Origin header)
echo "3️⃣ Testing GET /api/auth/me (with Personal Token)..."
curl -s -X GET http://localhost:9000/api/auth/me \
  -H "Authorization: Bearer $PERSONAL_TOKEN" | jq .
echo ""

echo "4️⃣ Testing GET /api/users (with Personal Token)..."
curl -s -X GET "http://localhost:9000/api/users?page=1&limit=5" \
  -H "Authorization: Bearer $PERSONAL_TOKEN" | jq .
echo ""

echo "5️⃣ Testing GET /api/users/1 (with Personal Token)..."
curl -s -X GET http://localhost:9000/api/users/1 \
  -H "Authorization: Bearer $PERSONAL_TOKEN" | jq .
echo ""

echo "6️⃣ Testing POST /api/whatsapp-sessions (with Personal Token)..."
curl -s -X POST http://localhost:9000/api/whatsapp-sessions \
  -H "Authorization: Bearer $PERSONAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+50612345678",
    "accountProtection": true,
    "logMessages": true,
    "webhookUrl": "https://example.com/webhook",
    "webhookEnabled": true
  }' | jq .
echo ""

echo "7️⃣ Testing GET /api/whatsapp-sessions (with Personal Token)..."
curl -s -X GET http://localhost:9000/api/whatsapp-sessions \
  -H "Authorization: Bearer $PERSONAL_TOKEN" | jq .
echo ""

echo "✨ All tests completed!"
