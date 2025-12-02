# 🔐 Fix EAS Build Permissions Error

## Problem
You're getting: `Entity not authorized` because the project owner (`neonzed`) doesn't match your logged-in account.

## Solution Options

### Option 1: Login as the Correct Account (if neonzed is your account)

```bash
# Check current account
eas whoami

# Login as neonzed
eas login
# Enter neonzed credentials when prompted
```

### Option 2: Create New Project Under Your Account (Recommended)

If `neonzed` is not your account, create a new EAS project:

```bash
# 1. Remove old project ID from app.json
# (We'll update it below)

# 2. Initialize new EAS project
eas init

# 3. This will create a new projectId and update app.json automatically
```

**Then update app.json:**
- Remove or update the `"owner": "neonzed"` line
- The new projectId will be automatically added

### Option 3: Transfer Project (if you have access to neonzed account)

1. Login as neonzed: `eas login`
2. Transfer project to your account via Expo dashboard
3. Or add yourself as a collaborator

---

## Quick Fix (Create New Project)

Run these commands:

```bash
# 1. Check who you're logged in as
eas whoami

# 2. Initialize new project (creates new projectId)
eas init

# 3. Confirm the new projectId in app.json

# 4. Try building again
eas build --platform android --profile preview
```

The `eas init` command will:
- Create a new EAS project under your account
- Update `app.json` with the new `projectId`
- Set you as the owner

---

## What Changed

✅ Added `"appVersionSource": "remote"` to `eas.json` to fix the warning

Now you just need to fix the account permissions!

