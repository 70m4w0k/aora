#!/bin/bash

# Tipi v0.1 Deployment Script
# Usage: ./scripts/deploy.sh [ios|android|both]

set -e

PLATFORM=${1:-both}

echo "🏕️  Tipi v0.1 Deployment"
echo "=========================="
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Login check
echo "🔐 Checking EAS login..."
eas whoami || eas login

echo ""
echo "📦 Building for: $PLATFORM"
echo ""

# Build based on platform
if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "both" ]; then
    echo "🍎 Building iOS..."
    eas build --platform ios --profile preview --non-interactive
    echo ""
    echo "✅ iOS build started! Check status: eas build:list"
    echo ""
fi

if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "both" ]; then
    echo "🤖 Building Android..."
    eas build --platform android --profile preview --non-interactive
    echo ""
    echo "✅ Android build started! Check status: eas build:list"
    echo ""
fi

echo ""
echo "📋 Next steps:"
echo "1. Wait for builds to complete (check: eas build:list)"
echo "2. Submit to stores:"
echo "   - iOS: eas submit --platform ios"
echo "   - Android: eas submit --platform android"
echo ""
echo "🎉 Happy testing!"

