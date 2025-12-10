# Environment Variables Template

Create a `.env` file in the root of your project with the following variables:

```env
# Tipi App Environment Variables
# Copy these values and create a .env file

# Appwrite Endpoint
# For self-hosted: Use your Cloudflare Tunnel domain (e.g., https://appwrite.yourdomain.com/v1)
# For local development: Use http://192.168.1.46/v1 (or your local IP)
# For cloud: Use https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://appwrite.yourdomain.com/v1

# Appwrite Project ID
# Get this from your Appwrite console → Settings → General
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here

# Appwrite Database ID
# Get this from your Appwrite console → Databases → Your Database → Settings
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here

# Appwrite Platform
# Should match your app's bundle identifier (com.tipi.app)
EXPO_PUBLIC_APPWRITE_PLATFORM=com.tipi.app

# Appwrite Storage ID (optional)
# Get this from your Appwrite console → Storage → Your Bucket → Settings
EXPO_PUBLIC_APPWRITE_STORAGE_ID=your_storage_id_here

# Server-side API Key (for init-appwrite-db.js script only)
# Never expose this in client-side code!
# Get this from Appwrite console → Settings → API Keys
APPWRITE_API_KEY=your_api_key_here
```

## Quick Setup

1. Copy the template above
2. Create `.env` file in project root
3. Replace `your_*_here` values with your actual values
4. Restart Expo dev server: `npm start`

## Important Notes

- The `.env` file is gitignored - never commit it to version control
- Use `https://` for production/self-hosted endpoints (Cloudflare Tunnel)
- Use `http://` only for local development on same network
- `EXPO_PUBLIC_` prefix is required for Expo to bundle these variables
- After updating `.env`, restart your Expo dev server

## Getting Your Values

### Project ID
1. Log into Appwrite console
2. Go to Settings → General
3. Copy the Project ID

### Database ID
1. Go to Databases in Appwrite console
2. Select your database
3. Go to Settings tab
4. Copy the Database ID

### Storage ID
1. Go to Storage in Appwrite console
2. Select your storage bucket
3. Go to Settings tab
4. Copy the Storage ID

### API Key (Server-side only)
1. Go to Settings → API Keys
2. Create new API key with required scopes
3. Copy the key (you can only see it once!)

## Self-Hosted Setup

For self-hosted Appwrite via Cloudflare Tunnel:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://appwrite.yourdomain.com/v1
```

Replace `appwrite.yourdomain.com` with your actual Cloudflare Tunnel domain.

See `SELF_HOST_DEPLOYMENT.md` for complete setup instructions.



