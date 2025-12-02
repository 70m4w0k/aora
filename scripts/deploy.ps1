# Tipi v0.1 Deployment Script (PowerShell)
# Usage: .\scripts\deploy.ps1 [ios|android|both]

param(
    [string]$Platform = "both"
)

Write-Host "🏕️  Tipi v0.1 Deployment" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
try {
    $null = Get-Command eas -ErrorAction Stop
} catch {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g eas-cli
}

# Login check
Write-Host "🔐 Checking EAS login..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to EAS..." -ForegroundColor Yellow
    eas login
}

Write-Host ""
Write-Host "📦 Building for: $Platform" -ForegroundColor Cyan
Write-Host ""

# Build based on platform
if ($Platform -eq "ios" -or $Platform -eq "both") {
    Write-Host "🍎 Building iOS..." -ForegroundColor Green
    eas build --platform ios --profile preview --non-interactive
    Write-Host ""
    Write-Host "✅ iOS build started! Check status: eas build:list" -ForegroundColor Green
    Write-Host ""
}

if ($Platform -eq "android" -or $Platform -eq "both") {
    Write-Host "🤖 Building Android..." -ForegroundColor Green
    eas build --platform android --profile preview --non-interactive
    Write-Host ""
    Write-Host "✅ Android build started! Check status: eas build:list" -ForegroundColor Green
    Write-Host ""
}

Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Wait for builds to complete (check: eas build:list)"
Write-Host "2. Submit to stores:"
Write-Host "   - iOS: eas submit --platform ios"
Write-Host "   - Android: eas submit --platform android"
Write-Host ""
Write-Host "🎉 Happy testing!" -ForegroundColor Green

