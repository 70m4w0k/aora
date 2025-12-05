# 🔧 Backend Setup Guide - Appwrite

## Overview

Tipi uses **Appwrite** as its backend (BaaS - Backend as a Service). This guide will help you set up and verify your Appwrite backend before deploying the app.

---

## 📋 Current Backend Configuration

**Endpoint:** `https://cloud.appwrite.io/v1`  
**Project ID:** `66cc7b47003a18bd5600`  
**Database ID:** `66cc7c760013e5170042`

**Status:** ✅ Core collections exist, some collections need to be created

---

## ✅ Step 1: Verify Appwrite Project

1. **Login to Appwrite Console:**
   - Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
   - Login with your account

2. **Verify Project Access:**
   - Check if you have access to project `66cc7b47003a18bd5600`
   - If not, you'll need to create a new project or get access

3. **Check Project Status:**
   - Ensure project is **active** and not suspended
   - Verify you have admin/owner permissions

---

## 📦 Step 2: Verify Existing Collections

The following collections should already exist:

### ✅ Core Collections (Already Created)
- ✅ `users` (ID: `66cc7c930038937612d7`)
- ✅ `households` (ID: `692d9aa3002cdbc240cc`)
- ✅ `tasks` (ID: `66daeaba0012bea61d31`)
- ✅ `tasksDone` (ID: `66daebd5003dbbdb0beb`)
- ✅ `shoppingItems` (ID: `67c5f73b003091bc520c`)
- ✅ `expenses` (ID: `67c5f84e0011953452e2`)
- ✅ `expenseSettlements` (ID: `67c637aa002f0ba982dc`)
- ✅ `storage` (ID: `66cc7dd9000d1e1e11e0`)

### ⚠️ Collections That Need to Be Created

These collections are marked as "TODO" in the code:

1. **`documents`** - Document storage
2. **`products`** - Price tracker products
3. **`priceHistory`** - Price history entries
4. **`stores`** - Store information
5. **`events`** - Calendar events
6. **`habits_arcs`** - Habits tracker arcs
7. **`habits_quests`** - Habits tracker quests
8. **`habits_quests_completions`** - Quest completions
9. **`habits_tiers`** - Habits tracker tiers
10. **`habits_tiers_completions`** - Tier completions
11. **`habits_user_progress`** - User progress tracking
12. **`habits_xp_history`** - XP gain history

---

## 🛠️ Step 3: Create Missing Collections

### Quick Setup Script

You can create collections manually in Appwrite Console, or use the Appwrite CLI. Here's what each collection needs:

### 3.1 Documents Collection

**Collection ID:** `documents`

**Attributes:**
- `name` (String, 255, required)
- `category` (String, 50, required) - Values: "bills", "insurance", "contracts", "receipts", "other"
- `description` (String, 1000, optional)
- `amount` (Double, optional)
- `date` (String, 255, required) - ISO date string
- `fileId` (String, 255, optional)
- `fileUrl` (String, 500, optional)
- `fileName` (String, 255, optional)
- `householdId` (String, 255, required) - Relationship to households
- `userId` (String, 255, required) - Relationship to users

**Indexes:**
- `householdId` (ascending)
- `date` (descending)
- `category` (ascending)

**Permissions:**
- Create: Users (authenticated)
- Read: Users (authenticated) - Only their household
- Update: Users (authenticated) - Only their documents
- Delete: Users (authenticated) - Only their documents

---

### 3.2 Products Collection (Price Tracker)

**Collection ID:** `products`

**Attributes:**
- `barcode` (String, 255, optional)
- `name` (String, 255, required)
- `brand` (String, 255, optional)
- `category` (String, 50, required) - Values: "groceries", "dairy", "meat", "produce", "frozen", "beverages", "snacks", "household", "personal_care", "other"
- `unit` (String, 10, required) - Default: "g"
- `weight` (Integer, optional) - Weight in grams or mL
- `imageUrl` (String, 500, optional)
- `householdId` (String, 255, required) - Relationship to households
- `createdBy` (String, 255, required) - Relationship to users

**Indexes:**
- `householdId` (ascending)
- `barcode` (ascending) - Unique per household
- `name` (ascending)

**Permissions:**
- Create: Users (authenticated)
- Read: Users (authenticated) - Only their household
- Update: Users (authenticated) - Only their household
- Delete: Users (authenticated) - Only their household

---

### 3.3 Price History Collection

**Collection ID:** `priceHistory`

**Attributes:**
- `productId` (String, 255, required) - Relationship to products
- `storeId` (String, 255, required) - Relationship to stores
- `price` (Double, required)
- `quantity` (Double, required) - Default: 1
- `weight` (Integer, optional) - Weight in grams
- `pricePerUnit` (Double, required) - Calculated
- `pricePerKg` (Double, optional) - Calculated
- `date` (String, 255, required) - ISO date string
- `notes` (String, 500, optional)
- `userId` (String, 255, required) - Relationship to users
- `householdId` (String, 255, required) - Relationship to households

**Indexes:**
- `productId` (ascending)
- `storeId` (ascending)
- `householdId` (ascending)
- `date` (descending)
- `pricePerUnit` (ascending)

**Permissions:**
- Create: Users (authenticated)
- Read: Users (authenticated) - Only their household
- Update: Users (authenticated) - Only their household
- Delete: Users (authenticated) - Only their household

---

### 3.4 Stores Collection

**Collection ID:** `stores`

**Attributes:**
- `name` (String, 255, required)
- `address` (String, 500, optional)
- `householdId` (String, 255, required) - Relationship to households
- `createdBy` (String, 255, required) - Relationship to users

**Indexes:**
- `householdId` (ascending)
- `name` (ascending)

**Permissions:**
- Create: Users (authenticated)
- Read: Users (authenticated) - Only their household
- Update: Users (authenticated) - Only their household
- Delete: Users (authenticated) - Only their household

---

### 3.5 Events Collection (Calendar)

**Collection ID:** `events`

**Attributes:**
- `title` (String, 255, required)
- `description` (String, 1000, optional)
- `startDate` (String, 255, required) - ISO date string
- `endDate` (String, 255, required) - ISO date string
- `allDay` (Boolean, required) - Default: false
- `category` (String, 50, required) - Values: "chore", "meeting", "social", "work", "personal", "reminder", "other"
- `householdId` (String, 255, required) - Relationship to households
- `createdBy` (String, 255, required) - Relationship to users
- `assignedTo` (String, 255, optional) - Relationship to users
- `color` (String, 20, optional) - Hex color code

**Indexes:**
- `householdId` (ascending)
- `startDate` (ascending)
- `endDate` (ascending)
- `category` (ascending)

**Permissions:**
- Create: Users (authenticated)
- Read: Users (authenticated) - Only their household
- Update: Users (authenticated) - Only their household
- Delete: Users (authenticated) - Only their household

---

### 3.6 Habits Tracker Collections

For detailed setup instructions, see: `APPWRITE_HABITS_COLLECTIONS.md`

**Collections needed:**
- `habits_arcs`
- `habits_quests`
- `habits_quests_completions`
- `habits_tiers`
- `habits_tiers_completions`
- `habits_user_progress`
- `habits_xp_history`

---

## 🔐 Step 4: Configure Permissions

### General Permission Rules

For all collections, use these permission patterns:

**Create Permission:**
```
role:users
```

**Read Permission:**
```
role:users
```
*Note: Filter by householdId in queries to ensure data isolation*

**Update Permission:**
```
role:users
```
*Note: Validate ownership in your app logic*

**Delete Permission:**
```
role:users
```
*Note: Validate ownership in your app logic*

### Storage Bucket Permissions

**Storage ID:** `66cc7dd9000d1e1e11e0`

**File Upload:**
- Create: `role:users`
- Read: `role:users`
- Delete: `role:users`

**File Access:**
- Make sure files are accessible to authenticated users
- Consider using signed URLs for sensitive documents

---

## 🧪 Step 5: Test Backend Connection

### Test Script

Create a test file to verify backend connectivity:

```javascript
// test-backend.js
import { Client, Databases, Account } from "react-native-appwrite";

const client = new Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("66cc7b47003a18bd5600")
  .setPlatform("com.wok.aora");

const databases = new Databases(client);
const account = new Account(client);

// Test connection
async function testConnection() {
  try {
    // Test authentication
    const session = await account.get();
    console.log("✅ Authentication works:", session.email);
    
    // Test database access
    const users = await databases.listDocuments(
      "66cc7c760013e5170042", // databaseId
      "66cc7c930038937612d7"  // userCollectionId
    );
    console.log("✅ Database access works:", users.documents.length, "users");
    
    return true;
  } catch (error) {
    console.error("❌ Backend test failed:", error);
    return false;
  }
}

testConnection();
```

### Manual Testing Checklist

- [ ] Can login to Appwrite Console
- [ ] Can access project dashboard
- [ ] All core collections exist
- [ ] Can create a test user account
- [ ] Can create a test household
- [ ] Storage bucket is accessible
- [ ] Can upload a test file
- [ ] Permissions are correctly set

---

## 🔒 Step 6: Security Checklist

Before deploying, ensure:

- [ ] **API Keys are secure:**
  - Never commit API keys to git
  - Use environment variables for sensitive data
  - Rotate keys if exposed

- [ ] **Permissions are restrictive:**
  - Users can only access their household data
  - Validate ownership in app logic
  - Use Appwrite's permission system

- [ ] **Storage is secure:**
  - Files are only accessible to authenticated users
  - Consider file size limits
  - Validate file types

- [ ] **Rate limiting:**
  - Appwrite free tier has rate limits
  - Monitor usage in Appwrite Console
  - Consider upgrading if needed

---

## 📊 Step 7: Monitor Backend Health

### Appwrite Console Dashboard

Monitor these metrics:
- **API Requests:** Track usage
- **Storage Usage:** Monitor file storage
- **Database Size:** Track data growth
- **Error Logs:** Check for issues

### Free Tier Limits

**Appwrite Cloud Free Tier:**
- 50,000 API requests/month
- 5GB storage
- 5GB bandwidth
- 1 project

**If you exceed limits:**
- Upgrade to paid plan
- Optimize API calls
- Clean up old data

---

## 🚨 Common Issues & Solutions

### Issue: "Collection not found"

**Solution:**
1. Verify collection ID in `lib/appwrite.js`
2. Check collection exists in Appwrite Console
3. Verify database ID is correct

### Issue: "Permission denied"

**Solution:**
1. Check user is authenticated
2. Verify permissions in collection settings
3. Check user has access to household

### Issue: "Storage upload fails"

**Solution:**
1. Verify storage bucket exists
2. Check file size limits
3. Verify file type is allowed
4. Check storage permissions

### Issue: "Can't access data from other household"

**Solution:**
- This is expected! Data is isolated per household
- Verify `householdId` in queries
- Check user's `householdId` matches

---

## 📝 Step 8: Update Collection IDs

After creating collections, update `lib/appwrite.js`:

```javascript
export const appwriteConfig = {
  // ... existing config ...
  documentsCollectionId: "YOUR_COLLECTION_ID",
  productsCollectionId: "YOUR_COLLECTION_ID",
  priceHistoryCollectionId: "YOUR_COLLECTION_ID",
  storesCollectionId: "YOUR_COLLECTION_ID",
  eventsCollectionId: "YOUR_COLLECTION_ID",
  // ... habits collections ...
};
```

---

## ✅ Pre-Deployment Backend Checklist

Before deploying the app:

- [ ] All collections created
- [ ] All collection IDs updated in code
- [ ] Permissions configured correctly
- [ ] Storage bucket accessible
- [ ] Test user account created
- [ ] Test household created
- [ ] Can create/read/update/delete test data
- [ ] Backend connection tested
- [ ] Error handling verified
- [ ] Rate limits understood

---

## 🔄 Post-Deployment Monitoring

After deploying:

1. **Monitor API usage:**
   - Check Appwrite Console daily
   - Watch for unusual spikes
   - Monitor error rates

2. **Monitor storage:**
   - Track file uploads
   - Clean up old files if needed
   - Monitor storage quota

3. **Monitor errors:**
   - Check Appwrite error logs
   - Monitor app crash reports
   - Fix issues quickly

---

## 📚 Additional Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Console](https://cloud.appwrite.io)
- [Collection Setup Guides](./APPWRITE_*.md)

---

## 🆘 Need Help?

If you encounter issues:

1. Check Appwrite Console for error messages
2. Verify collection IDs match
3. Test with a simple API call
4. Check Appwrite status page
5. Review Appwrite documentation

---

**Next Steps:** Once backend is verified, proceed with app deployment using `DEPLOYMENT_V1_GUIDE.md`


