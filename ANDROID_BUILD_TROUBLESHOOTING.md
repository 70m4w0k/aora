# Android Build Troubleshooting Guide

## Recent Build Failure

The Android build failed with: "Gradle build failed with unknown error"

## Steps to Fix

### 1. Check Build Logs

The error message points to detailed logs. Check them at:
```
https://expo.dev/accounts/tomawok/projects/tipi-app/builds/9686c5f1-3ab0-4cf4-9b97-36243cd9c4fa#run-gradlew
```

Look for specific error messages in the "Run gradlew" phase.

### 2. Common Fixes Applied

✅ **Removed `versionCode` from app.json**
- Since `appVersionSource` is set to "remote" in eas.json, versionCode is managed remotely
- This was causing a warning (not the error, but good to fix)

✅ **Added Android build configuration to eas.json**
- Added `buildType: "apk"` for preview builds
- Added `gradleCommand` specification

### 3. Additional Troubleshooting Steps

#### Option A: Try Building Again
Sometimes builds fail due to temporary EAS issues:
```bash
npm run build:android
```

#### Option B: Check for Native Module Issues

Some native modules might have compatibility issues. Check if any of these are causing problems:
- `react-native-appwrite` - May need specific Android configuration
- `expo-camera` - Requires proper permissions setup
- `react-native-bouncy-checkbox` - May need additional Android dependencies

#### Option C: Clear Build Cache and Retry

```bash
# Clear EAS build cache
eas build --platform android --profile preview --clear-cache
```

#### Option D: Check Expo SDK Compatibility

Ensure all packages are compatible with Expo SDK 52:
```bash
npx expo-doctor
```

#### Option E: Try Development Build First

Development builds are often more forgiving:
```bash
eas build --platform android --profile development
```

### 4. Common Gradle Errors and Fixes

#### Error: "Could not resolve all dependencies"
**Fix:** Add to `eas.json`:
```json
"android": {
  "buildType": "apk",
  "gradleCommand": ":app:assembleRelease"
}
```

#### Error: "Java version mismatch"
**Fix:** EAS Build uses Java 17 by default. If you see Java version errors, ensure your native modules support Java 17.

#### Error: "Missing Android SDK"
**Fix:** EAS Build handles this automatically, but if you see SDK errors, check the build logs for specific SDK versions needed.

#### Error: "Native module not found"
**Fix:** Ensure all native modules are properly linked. Run:
```bash
npx expo prebuild --clean
```

### 5. Check Specific Error in Logs

The most important step is to check the actual error in the build logs. Common patterns:

1. **Dependency resolution errors** - Check `package.json` for version conflicts
2. **Gradle version errors** - EAS handles this, but check logs
3. **Native module compilation errors** - Check if native modules need updates
4. **Memory errors** - EAS Build should handle this, but check logs
5. **Permission errors** - Check `app.json` Android permissions

### 6. Next Steps

1. **Check the build logs** at the URL provided in the error
2. **Look for the specific Gradle error** in the "Run gradlew" phase
3. **Share the specific error** if you need more help
4. **Try a clean build** with `--clear-cache` flag

### 7. Alternative: Build Locally

If EAS Build continues to fail, you can try building locally:

```bash
# Install EAS Build locally (requires Android Studio)
eas build --platform android --profile preview --local
```

**Note:** This requires Android Studio and Android SDK to be installed locally.

## Quick Fix Checklist

- [x] Removed `versionCode` from app.json
- [x] Added Android build configuration to eas.json
- [ ] Checked actual Gradle error in build logs
- [ ] Verified all dependencies are compatible with Expo SDK 52
- [ ] Tried building again with fixes applied
- [ ] Considered development build as alternative

## Still Having Issues?

1. Copy the specific error from the build logs
2. Check Expo SDK 52 release notes for known issues
3. Check GitHub issues for your native modules
4. Try building with `--clear-cache` flag



