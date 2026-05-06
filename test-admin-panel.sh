#!/bin/bash
# Test du Back Office Admin Mokine

echo "🧪 TEST DU BACK OFFICE ADMIN MOKINE"
echo "===================================="
echo ""

# Couleurs pour le formatage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:5000/api"
FRONTEND_URL="http://localhost:3000"

# Test 1: Vérifier que le backend est accessible
echo -e "${YELLOW}[1/6]${NC} Vérification du backend..."
if curl -s ${API_URL}/health > /dev/null; then
    echo -e "${GREEN}✅ Backend accessible sur port 5000${NC}"
else
    echo -e "${RED}❌ Backend inaccessible sur port 5000${NC}"
    echo "   → Assurez-vous que le serveur Node.js est lancé"
    echo "   → Commande: cd server && npm start"
fi
echo ""

# Test 2: Tenter une connexion
echo -e "${YELLOW}[2/6]${NC} Test de connexion administrateur..."
LOGIN_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mokine.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    echo -e "${GREEN}✅ Connexion réussie${NC}"
    echo "   Token: ${TOKEN:0:20}..."
else
    echo -e "${YELLOW}⚠️  Compte admin par défaut inexistant${NC}"
    echo "   Créez un compte avec role: 'admin'"
fi
echo ""

# Test 3: Vérifier les endpoints admin (si token disponible)
if [ ! -z "$TOKEN" ]; then
    echo -e "${YELLOW}[3/6]${NC} Test des endpoints admin..."
    
    # Dashboard
    echo -n "   Dashboard... "
    DASHBOARD=$(curl -s -H "Authorization: Bearer $TOKEN" ${API_URL}/admin/dashboard)
    if echo $DASHBOARD | grep -q "totalUsers"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
    
    # Users
    echo -n "   Users... "
    USERS=$(curl -s -H "Authorization: Bearer $TOKEN" ${API_URL}/admin/users)
    if echo $USERS | grep -q "id"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
    
    # Veterinarians
    echo -n "   Veterinarians... "
    VETS=$(curl -s -H "Authorization: Bearer $TOKEN" ${API_URL}/admin/veterinarians)
    if echo $VETS | grep -q "id"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
    
    # Payments
    echo -n "   Payments... "
    PAYMENTS=$(curl -s -H "Authorization: Bearer $TOKEN" ${API_URL}/admin/payments)
    if echo $PAYMENTS | grep -q "id"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
    
    # Products
    echo -n "   Products... "
    PRODUCTS=$(curl -s -H "Authorization: Bearer $TOKEN" ${API_URL}/admin/products)
    if echo $PRODUCTS | grep -q "id"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
    
    # Settings
    echo -n "   Settings... "
    SETTINGS=$(curl -s -H "Authorization: Bearer $TOKEN" ${API_URL}/admin/settings)
    if echo $SETTINGS | grep -q "siteName"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
else
    echo -e "${YELLOW}[3/6]${NC} Endpoints admin (test skippé - pas de token)${NC}"
fi
echo ""

# Test 4: Vérifier que le frontend est accessible
echo -e "${YELLOW}[4/6]${NC} Vérification du frontend..."
if curl -s ${FRONTEND_URL} > /dev/null; then
    echo -e "${GREEN}✅ Frontend accessible sur port 3000${NC}"
else
    echo -e "${RED}❌ Frontend inaccessible sur port 3000${NC}"
    echo "   → Assurez-vous que le serveur React est lancé"
    echo "   → Commande: npm start"
fi
echo ""

# Test 5: Informations de l'utilisateur
if [ ! -z "$TOKEN" ]; then
    echo -e "${YELLOW}[5/6]${NC} Informations de connexion..."
    PROFILE=$(curl -s -H "Authorization: Bearer $TOKEN" ${API_URL}/auth/profile)
    echo "   User ID: $(echo $PROFILE | grep -o '"id":"[^"]*' | cut -d'"' -f4)"
    echo "   Email: $(echo $PROFILE | grep -o '"email":"[^"]*' | cut -d'"' -f4)"
    echo "   Role: $(echo $PROFILE | grep -o '"role":"[^"]*' | cut -d'"' -f4)"
else
    echo -e "${YELLOW}[5/6]${NC} Vérification du profil (skippé)${NC}"
fi
echo ""

# Test 6: URLs d'accès
echo -e "${YELLOW}[6/6]${NC} URLs d'accès au back office..."
echo ""
echo "📍 ADMIN PANEL URLS:"
echo -e "   ${GREEN}Dashboard:${NC}        http://localhost:3000/admin/dashboard"
echo -e "   ${GREEN}Users:${NC}            http://localhost:3000/admin/users"
echo -e "   ${GREEN}Veterinarians:${NC}    http://localhost:3000/admin/veterinarians"
echo -e "   ${GREEN}Payments:${NC}         http://localhost:3000/admin/payments"
echo -e "   ${GREEN}Products:${NC}         http://localhost:3000/admin/products"
echo -e "   ${GREEN}Settings:${NC}         http://localhost:3000/admin/settings"
echo ""

echo "🎯 IMPORTANT: Vous devez être connecté avec un compte admin!"
echo "   → Allez sur http://localhost:3000/login"
echo "   → Connectez-vous avec l'email et mot de passe admin"
echo ""

echo -e "${GREEN}✅ Tests complétés!${NC}"
