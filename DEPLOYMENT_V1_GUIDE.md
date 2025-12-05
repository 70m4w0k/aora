# 🚀 Tipi v0.1 - Deployment Guide for Roommates

## Quick Overview

This guide will help you build and share the Tipi app with your roommates. We'll use **EAS Build** to create installable apps that can be shared via TestFlight (iOS) and Google Play Internal Testing (Android).

---

## 📋 Pre-Deployment Checklist

Before building, make sure:

- [ ] All translations are complete (✅ Done!)
- [ ] App version is set correctly in `app.json` (currently `0.1.0`)
- [ ] **Backend is set up and accessible** (see `BACKEND_SETUP_GUIDE.md` or `SELF_HOST_BACKEND_GUIDE.md`)
- [ ] You have an Expo account (owner: `tomawok`)
- [ ] EAS CLI is installed
- [ ] You're logged into EAS

---

## 🛠️ Step 1: Install & Setup EAS CLI

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login
```

**Verify login:**
```bash
eas whoami
# Should show: tomawok
```

---

## 🍎 Step 2: Build for iOS (TestFlight)

### Option A: First Time Setup (if you have Apple Developer Account)

1. **Configure Apple credentials:**
   ```bash
   eas build:configure
   ```
   - Follow prompts to set up Apple Developer account
   - EAS will handle certificates automatically

2. **Build iOS app:**
   ```bash
   npm run build:ios
   # OR
   eas build --platform ios --profile preview
   ```

3. **Wait for build** (15-30 minutes):
   ```bash
   # Check build status
   eas build:list
   ```

4. **Submit to TestFlight:**
   ```bash
   npm run submit:ios
   # OR
   eas submit --platform ios
   ```

5. **Add Testers:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Navigate to your app → **TestFlight**
   - Add internal testers (up to 100 people)
   - Share TestFlight link with roommates

### Option B: Quick Share (No Apple Developer Account)

If you don't have an Apple Developer account yet ($99/year):

1. **Build for iOS Simulator** (for testing on Mac):
   ```bash
   eas build --platform ios --profile preview --local
   ```

2. **Or use Expo Go** (see Step 4 below)

---

## 🤖 Step 3: Build for Android (Google Play Internal Testing)

### First Time Setup:

1. **Create Google Play Console account** ($25 one-time fee):
   - Go to [Google Play Console](https://play.google.com/console)
   - Create account and pay $25 registration fee
   - Create a new app in Play Console

2. **Build Android app:**
   ```bash
   npm run build:android
   # OR
   eas build --platform android --profile preview
   ```

3. **Wait for build** (10-20 minutes):
   ```bash
   eas build:list
   ```

4. **Submit to Play Console:**
   ```bash
   npm run submit:android
   # OR
   eas submit --platform android
   ```

5. **Add Testers:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Navigate to your app → **Testing** → **Internal testing**
   - Click **Create release**
   - Upload the AAB file from EAS
   - Add testers via email addresses
   - Share internal testing link with roommates

---

## ⚡ Step 4: Quick Testing with Expo Go (Fastest Option)

**For immediate testing without building:**

1. **Start development server:**
   ```bash
   npm start
   ```

2. **Share QR code:**
   - Roommates install [Expo Go](https://expo.dev/client) app
   - Scan QR code from terminal
   - App loads instantly

**⚠️ Limitations:**
- Some native features may not work perfectly (camera, barcode scanner)
- Requires internet connection
- Not ideal for long-term testing

**✅ Best for:**
- Quick demos
- UI/UX testing
- Feature validation

---

## 📱 Step 5: Development Build (Recommended for Testing)

**Best of both worlds** - Full features + easy updates:

1. **Build development client:**
   ```bash
   eas build --profile development --platform ios
   eas build --profile development --platform android
   ```

2. **Install on devices:**
   - Download and install the build
   - App works like production build

3. **Update over-the-air (OTA):**
   ```bash
   # Make code changes, then:
   eas update --branch development
   ```
   - Users get updates instantly without reinstalling

---

## 🎯 Recommended Workflow for v0.1

### For Sharing with Roommates:

**Option 1: TestFlight + Play Internal Testing** ⭐ **RECOMMENDED**
- ✅ Professional distribution
- ✅ Easy to add/remove testers
- ✅ Automatic updates
- ✅ Crash reporting
- ⏱️ Setup time: 2-3 hours first time, 30min per update

**Option 2: Development Build**
- ✅ Full native features
- ✅ OTA updates (no rebuild needed)
- ✅ Good for active development
- ⏱️ Setup time: 1-2 hours first time

**Option 3: Expo Go**
- ✅ Instant sharing
- ✅ No build required
- ⚠️ Limited native features
- ⏱️ Setup time: 5 minutes

---

## 📝 Version Management

Before each new build, update version in `app.json`:

```json
{
  "expo": {
    "version": "0.1.0",  // Semantic version (major.minor.patch)
    "ios": {
      "buildNumber": "1"  // Increment for each iOS build
    },
    "android": {
      "versionCode": 1    // Increment for each Android build
    }
  }
}
```

**Versioning strategy:**
- `0.1.0` → `0.1.1` (bug fixes)
- `0.1.0` → `0.2.0` (new features)
- `0.1.0` → `1.0.0` (stable release)

---

## ✅ Pre-Launch Checklist

Before sharing with roommates:

- [x] Translations complete (English + French)
- [ ] Test all core features:
  - [ ] User signup/login
  - [ ] Household creation/joining
  - [ ] Shopping list (add, complete, delete)
  - [ ] Expenses & settlements
  - [ ] Chores tracker
  - [ ] Calendar/Events
  - [ ] Documents upload
  - [ ] Price tracker (barcode scanning)
- [ ] Test on both iOS and Android devices
- [ ] Verify Appwrite backend is accessible
- [ ] Check all permissions work (camera, photos)
- [ ] Test invite code sharing
- [ ] Prepare feedback collection (Google Form, Discord, etc.)

---

## 🚨 Common Issues & Solutions

### Build Fails

**Issue:** Build fails with credential errors
```bash
# Solution: Reconfigure credentials
eas build:configure
```

**Issue:** Build takes too long
```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

### TestFlight Issues

**Issue:** Can't add testers
- Make sure app is submitted to TestFlight first
- Check Apple Developer account status

**Issue:** Testers can't install
- Verify they're added to TestFlight
- Check iOS version compatibility

### Android Issues

**Issue:** Can't submit to Play Console
- Verify Google Play account is set up
- Check app is created in Play Console
- Ensure AAB file is uploaded (not APK)

---

## 📊 Monitoring & Feedback

### 1. Crash Reports
- EAS provides automatic crash reporting
- Check: [Expo Dashboard](https://expo.dev)

### 2. Collect Feedback
- Set up Google Form or Discord channel
- Ask roommates to report:
  - Bugs
  - Feature requests
  - UX issues

### 3. Quick Fixes
- Use EAS Update for OTA patches:
  ```bash
  eas update --branch production
  ```

---

## 💰 Cost Breakdown

- **Apple Developer**: $99/year (for iOS)
- **Google Play**: $25 one-time (for Android)
- **EAS Build**: Free tier (limited builds/month)
- **Appwrite**: Free tier (generous limits)

**Total First Year**: ~$124
**Annual After**: $99/year (iOS only)

---

## 🎯 Quick Commands Reference

```bash
# Build
npm run build:ios          # iOS build
npm run build:android      # Android build
npm run build:both          # Both platforms

# Submit
npm run submit:ios         # Submit to TestFlight
npm run submit:android     # Submit to Play Console

# Status
npm run build:list         # Check build status
eas build:view [ID]         # View build logs

# Updates (Development builds)
eas update --branch development
```

---

## 📚 Next Steps After v0.1

1. **Collect feedback** from roommates (1-2 weeks)
2. **Fix critical bugs** based on feedback
3. **Plan v0.2 features** based on needs
4. **Consider public beta** if stable enough

---

## 🆘 Need Help?

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [TestFlight Guide](https://docs.expo.dev/submit/ios/)
- [Play Console Guide](https://docs.expo.dev/submit/android/)
- [Expo Discord](https://chat.expo.dev/)

---

## 🎉 Ready to Deploy?

**Recommended first-time workflow:**

1. Start with **Expo Go** for quick testing (5 min)
2. Build **Development builds** for full testing (1-2 hours)
3. Move to **TestFlight/Play Internal** for stable sharing (2-3 hours)

---

## 🔧 Backend Options

**Before deploying, choose your backend:**

1. **Cloud Appwrite** (Easiest)
   - See `BACKEND_SETUP_GUIDE.md`
   - Free tier available
   - Quick setup (~30 minutes)

2. **Self-Hosted Appwrite** (Recommended for Privacy/Cost)
   - See `SELF_HOST_BACKEND_GUIDE.md`
   - Full control over data
   - No monthly costs (~$5-10/month electricity)
   - Use old computer (~2-3 hours setup)

**Good luck! 🚀**

