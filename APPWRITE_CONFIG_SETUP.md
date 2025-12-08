# Appwrite Configuration Setup

This guide explains how to configure your Appwrite environment variables for the Aora/Tipi application.

## Environment Variables

Create a `.env` file in the root of your project with the following variables:

```env
# Appwrite Endpoint (self-hosted or cloud)
# Example for self-hosted: http://192.168.1.46/v1
# Example for cloud: https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_ENDPOINT=http://192.168.1.46/v1

# Appwrite Project ID
# Get this from your Appwrite console after creating a project
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here

# Appwrite Database ID
# Get this from your Appwrite console after creating a database
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here

# Appwrite Platform
# This should match your app's bundle identifier
EXPO_PUBLIC_APPWRITE_PLATFORM=com.wok.tipi

# Appwrite Storage ID (optional)
# Get this from your Appwrite console after creating a storage bucket
EXPO_PUBLIC_APPWRITE_STORAGE_ID=your_storage_id_here
```

## Important Notes

1. **EXPO_PUBLIC_ Prefix**: Expo requires the `EXPO_PUBLIC_` prefix for all client-side environment variables. This ensures they are bundled into your app.

2. **API Key**: The `APPWRITE_API_KEY` is only needed for server-side scripts (like `init-appwrite-db.js`). Never expose API keys in client-side code. For client-side authentication, use session-based authentication.

3. **Security**: Never commit your `.env` file to version control. It should be in your `.gitignore` file.

## Getting Your IDs

1. **Project ID**: 
   - Go to your Appwrite console
   - Select your project
   - The Project ID is displayed in the project settings

2. **Database ID**:
   - Go to Databases in your Appwrite console
   - Select your database
   - The Database ID is displayed in the database settings

3. **Storage ID**:
   - Go to Storage in your Appwrite console
   - Select your storage bucket
   - The Storage ID is displayed in the bucket settings

4. **API Key** (for server-side scripts only):
   - Go to Settings > API Keys in your Appwrite console
   - Create a new API key with the required scopes (Databases, Collections, etc.)
   - Copy the key and add it to your `.env` file as `APPWRITE_API_KEY`

## After Configuration

1. Restart your Expo development server to load the new environment variables
2. Run `npm run init:db` to initialize your database schema
3. Update the collection IDs in `lib/appwrite.js` if they differ from the default snake_case names

## Collection IDs

The application uses the following collection IDs (matching `DB_SCHEMA_CORRECTED.md`):

- `users`
- `households`
- `tasks`
- `tasks_done`
- `shopping_items`
- `expenses`
- `expense_settlements`
- `documents`
- `products`
- `price_history`
- `stores`
- `events`
- `habits_arcs`
- `habits_quests`
- `habits_quests_completions`
- `habits_tiers`
- `habits_tiers_completions`
- `habits_user_progress`
- `habits_xp_history`

If you used different collection IDs when running `init-appwrite-db.js`, update them in `lib/appwrite.js`.

