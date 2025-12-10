#!/bin/bash

# Deployment Verification Script
# Tests that Tipi app can connect to self-hosted Appwrite via Cloudflare Tunnel

set -e

echo "🔍 Tipi Deployment Verification"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Create .env file from ENV_TEMPLATE.md"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Load environment variables
source .env 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not source .env file${NC}"
    echo "Reading values manually..."
}

# Get endpoint from .env or use default
ENDPOINT=${EXPO_PUBLIC_APPWRITE_ENDPOINT:-"http://192.168.1.46/v1"}
PROJECT_ID=${EXPO_PUBLIC_APPWRITE_PROJECT_ID:-""}

echo "📋 Configuration:"
echo "  Endpoint: $ENDPOINT"
echo "  Project ID: ${PROJECT_ID:0:20}..." # Show first 20 chars
echo ""

# Test 1: Check endpoint is HTTPS (for production)
if [[ "$ENDPOINT" == https://* ]]; then
    echo -e "${GREEN}✅ Endpoint uses HTTPS${NC}"
else
    echo -e "${YELLOW}⚠️  Endpoint uses HTTP (OK for local development)${NC}"
fi

# Test 2: Health check
echo ""
echo "Test 1: Appwrite Health Check"
echo "-----------------------------"
HEALTH_URL="${ENDPOINT%/v1}/v1/health"

if curl -s -f "$HEALTH_URL" > /dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s "$HEALTH_URL")
    if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
        echo -e "${GREEN}✅ Appwrite is accessible${NC}"
        echo "   Response: $HEALTH_RESPONSE"
    else
        echo -e "${RED}❌ Appwrite health check failed${NC}"
        echo "   Response: $HEALTH_RESPONSE"
    fi
else
    echo -e "${RED}❌ Cannot reach Appwrite endpoint${NC}"
    echo "   URL: $HEALTH_URL"
    echo "   Check:"
    echo "   1. Cloudflare Tunnel is running"
    echo "   2. Appwrite is running"
    echo "   3. Endpoint URL is correct"
fi

# Test 3: Check Project ID is set
echo ""
echo "Test 2: Configuration Check"
echo "---------------------------"
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "your_project_id_here" ]; then
    echo -e "${RED}❌ Project ID not configured${NC}"
    echo "   Update EXPO_PUBLIC_APPWRITE_PROJECT_ID in .env"
else
    echo -e "${GREEN}✅ Project ID is configured${NC}"
fi

# Test 4: Verify endpoint format
echo ""
echo "Test 3: Endpoint Format Check"
echo "-----------------------------"
if [[ "$ENDPOINT" == */v1 ]]; then
    echo -e "${GREEN}✅ Endpoint format is correct${NC}"
else
    echo -e "${YELLOW}⚠️  Endpoint should end with /v1${NC}"
    echo "   Current: $ENDPOINT"
    echo "   Expected: ${ENDPOINT%/v1}/v1"
fi

# Test 5: Test from different network (if possible)
echo ""
echo "Test 4: Network Connectivity"
echo "----------------------------"
if command -v curl &> /dev/null; then
    # Try to reach endpoint
    if curl -s -f --max-time 5 "$HEALTH_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Endpoint is reachable from this network${NC}"
    else
        echo -e "${YELLOW}⚠️  Cannot reach endpoint from this network${NC}"
        echo "   This might be normal if testing from different network"
        echo "   Test from mobile device on cellular network"
    fi
else
    echo -e "${YELLOW}⚠️  curl not available, skipping network test${NC}"
fi

# Summary
echo ""
echo "================================"
echo "Verification Summary"
echo "================================"
echo ""
echo "Next steps:"
echo "1. If all tests passed, build the app:"
echo "   npm run build:android"
echo "   npm run build:ios"
echo ""
echo "2. Install on device and test:"
echo "   - Sign up/login"
echo "   - Create household"
echo "   - Test CRUD operations"
echo ""
echo "3. Test from different networks:"
echo "   - WiFi network"
echo "   - Cellular network"
echo "   - Different location"
echo ""



