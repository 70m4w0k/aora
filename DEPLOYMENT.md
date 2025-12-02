# 🚀 Tipi v0.1 Deployment Guide

## Quick Start: Deploy to TestFlight & Internal Testing

### Prerequisites
1. **EAS CLI installed**: `npm install -g eas-cli`
2. **Expo account**: Already configured (owner: neonzed)
3. **Apple Developer Account** (for iOS) - $99/year
4. **Google Play Console** (for Android) - $25 one-time

---

## Step 1: Install EAS CLI & Login

```bash
npm install -g eas-cli
eas login
```

---

## Step 2: Configure Build Profiles

Create/update `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Step 3: Build for iOS (TestFlight)

### First Time Setup:
1. **Register your Apple Developer account**:
   ```bash
   eas build:configure
   ```

2. **Build for iOS**:
   ```bash
   eas build --platform ios --profile preview
   ```

3. **Submit to TestFlight** (after build completes):
   ```bash
   eas submit --platform ios
   ```

### Adding Testers:
- Go to [App Store Connect](https://appstoreconnect.apple.com)
- Navigate to your app → TestFlight
- Add internal testers (up to 100) or external testers
- Share TestFlight link with roommates

---

## Step 4: Build for Android (Internal Testing)

### First Time Setup:
1. **Create Google Play Console account** ($25 one-time fee)
2. **Create app** in Play Console
3. **Generate keystore** (EAS handles this automatically)

### Build & Submit:
```bash
# Build APK/AAB
eas build --platform android --profile preview

# Submit to Play Console
eas submit --platform android
```

### Adding Testers:
- Go to [Google Play Console](https://play.google.com/console)
- Navigate to your app → Testing → Internal testing
- Add testers via email
- Share internal testing link

---

## Step 5: Quick Testing Alternative (Expo Go)

For **immediate testing** without building:

```bash
# Start dev server
npm start

# Scan QR code with Expo Go app
# Share QR code with roommates
```

**Limitations**: Some native features (camera, barcode scanner) may not work perfectly in Expo Go.

---

## Step 6: Version Management

Update version before each release:

```json
// app.json
{
  "expo": {
    "version": "0.1.0",  // Semantic versioning
    "ios": {
      "buildNumber": "1"  // Increment for each iOS build
    },
    "android": {
      "versionCode": 1    // Increment for each Android build
    }
  }
}
```

---

## Recommended Workflow for v0.1

### Option A: TestFlight + Internal Testing (Recommended)
✅ **Best for real-world testing**
- Professional distribution
- Easy updates
- Crash reporting
- **Time**: ~2-3 hours first time, 30min per update

### Option B: Expo Go (Quick & Dirty)
✅ **Fastest to share**
- Instant testing
- No build required
- **Time**: 5 minutes
- ⚠️ Some features may not work

### Option C: Development Build (Best of Both)
✅ **Full features + easy updates**
```bash
# Build development client
eas build --profile development --platform ios
eas build --profile development --platform android

# Install on devices
# Updates via OTA (over-the-air)
```

---

## Pre-Launch Checklist

- [ ] Update `app.json` version to `0.1.0`
- [ ] Test all core features:
  - [ ] User signup/login
  - [ ] Household creation/joining
  - [ ] Shopping list
  - [ ] Expenses & settlements
  - [ ] Chores tracker
  - [ ] Documents upload
  - [ ] Price tracker
- [ ] Test on both iOS and Android devices
- [ ] Verify Appwrite backend is accessible
- [ ] Check all permissions work (camera, photos)
- [ ] Test invite code sharing
- [ ] Prepare feedback collection method (Google Form, Discord, etc.)

---

## Post-Launch Monitoring

1. **Monitor crashes**: EAS provides crash reports
2. **Collect feedback**: Set up a simple form or Discord channel
3. **Track usage**: Consider adding analytics (optional)
4. **Quick fixes**: Use EAS Update for OTA patches

---

## Cost Estimate

- **Apple Developer**: $99/year
- **Google Play**: $25 one-time
- **EAS Build**: Free tier (limited builds/month)
- **Appwrite**: Free tier (generous limits)

**Total**: ~$124 first year, $99/year after

---

## Quick Commands Reference

```bash
# Build iOS
eas build --platform ios --profile preview

# Build Android  
eas build --platform android --profile preview

# Submit to stores
eas submit --platform ios
eas submit --platform android

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

---

## Need Help?

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [TestFlight Guide](https://docs.expo.dev/submit/ios/)
- [Play Console Guide](https://docs.expo.dev/submit/android/)

---

## Next Steps After v0.1

1. Collect feedback from roommates
2. Fix critical bugs
3. Plan v0.2 features
4. Consider public beta if stable

Good luck! 🎉

