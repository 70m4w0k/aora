# Database Initialization Scripts

## 🚀 Quick Start

### Prerequisites

1. **Node.js installed** (v14 or higher)
2. **Appwrite instance running** (self-hosted or cloud)
3. **API Key** with Databases scope

### Installation

```bash
# Install dependencies
npm install node-appwrite dotenv

# Or if you're in the project root
npm install
```

**Note:** The script will automatically load variables from a `.env` file in the project root if `dotenv` is installed.  

### Usage

```bash
# Run the initialization script
node scripts/init-appwrite-db.js
```

The script will prompt you for:
- Appwrite endpoint (defaults to `http://192.168.1.46/v1`)
- Project ID
- API Key
- Database ID

### Using Environment Variables

You can also set these as environment variables:

```bash
export APPWRITE_ENDPOINT="http://192.168.1.46/v1"
export APPWRITE_PROJECT_ID="your-project-id"
export APPWRITE_API_KEY="your-api-key"
export APPWRITE_DATABASE_ID="your-database-id"

node scripts/init-appwrite-db.js
```

---

## 📋 What the Script Does

The script automatically:

1. ✅ Creates all 19 collections
2. ✅ Adds all attributes (with correct types)
3. ✅ Creates all indexes (including composite indexes)
4. ✅ Sets all permissions
5. ✅ Handles relationships properly

**Collections Created:**
- `users`
- `households`
- `tasks`
- `tasks_done`
- `shopping_items`
- `expenses`
- `expense_settlements`
- `documents`
- `products`
- `stores`
- `price_history`
- `events`
- `habits_arcs`
- `habits_quests`
- `habits_quests_completions`
- `habits_tiers`
- `habits_tiers_completions`
- `habits_user_progress`
- `habits_xp_history`

---

## 🔑 Getting Your API Key

1. Go to your Appwrite Console (`http://192.168.1.46` or cloud URL)
2. Login → Your Project → Settings → API Keys
3. Create a new API key with:
   - **Scopes:** `databases.read`, `databases.write`, `collections.read`, `collections.write`
4. Copy the key (you won't see it again!)

---

## ⚠️ Important Notes

- **The script is idempotent:** Running it multiple times is safe (it skips existing collections/attributes)
- **Dependencies:** Collections are created in order to respect relationships
- **Time:** Full initialization takes ~5-10 minutes (due to Appwrite attribute/index creation delays)
- **Errors:** If a collection already exists, it will be skipped (not an error)

---

## 🐛 Troubleshooting

### "Collection already exists"
- This is normal if you've run the script before
- The script will skip existing collections and continue

### "Attribute creation failed"
- Wait a few seconds and try again
- Appwrite needs time to process attribute creation
- The script includes delays, but sometimes more time is needed

### "Permission denied"
- Check your API key has the correct scopes
- Verify you're using the correct Project ID
- Make sure you're logged in as admin

### "Database not found"
- Create the database first in Appwrite Console
- Use the Database ID (not name) in the script

---

## 📝 After Running

After the script completes:

1. **Copy Collection IDs:**
   - The script outputs collection IDs as it creates them
   - Or get them from Appwrite Console → Databases → Collections

2. **Update `lib/appwrite.js`:**
   ```javascript
   export const appwriteConfig = {
     // ... existing config ...
     userCollectionId: "YOUR_NEW_COLLECTION_ID",
     householdCollectionId: "YOUR_NEW_COLLECTION_ID",
     // ... etc
   };
   ```

3. **Test:**
   - Try creating a test document
   - Verify relationships work
   - Test queries with indexes

---

## 🔄 Manual Alternative

If you prefer to create collections manually:

1. Use `DB_SCHEMA_CORRECTED.md` as reference
2. Create each collection in Appwrite Console
3. Add attributes, indexes, and permissions as documented

The script is faster and less error-prone, but manual creation works too!

---

## 📚 Related Documentation

- `DB_SCHEMA_CORRECTED.md` - Complete schema reference
- `APPWRITE_DB_BEST_PRACTICES.md` - Best practices guide
- `BACKEND_SETUP_GUIDE.md` - Manual setup guide

