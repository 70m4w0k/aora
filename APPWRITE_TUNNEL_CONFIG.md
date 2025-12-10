# Appwrite Configuration for Cloudflare Tunnel

This guide explains how to configure your self-hosted Appwrite instance to work with Cloudflare Tunnel.

## Prerequisites

- Appwrite running via Docker Compose
- Cloudflare Tunnel set up and running
- Tunnel domain (e.g., `appwrite.yourdomain.com` or `xxxxx.trycloudflare.com`)

## Configuration Steps

### 1. Update Docker Compose Environment Variables

Edit your `docker-compose.yml` file (usually in `~/appwrite/`):

**Find the Appwrite service section and update environment variables:**

```yaml
services:
  appwrite:
    image: appwrite/appwrite:latest
    environment:
      # ... existing variables ...
      
      # Set domain to your Cloudflare Tunnel domain
      - _APP_DOMAIN=https://appwrite.yourdomain.com
      
      # Production environment
      - _APP_ENV=production
      
      # Console access restrictions (recommended)
      - _APP_CONSOLE_WHITELIST_ROOT=enabled
      - _APP_CONSOLE_WHITELIST_EMAILS=your-email@example.com
      
      # Optional: Disable usage stats
      - _APP_USAGE_STATS=disabled
      
      # Ensure HTTPS is used
      - _APP_FUNCTIONS_TIMEOUT=900
      - _APP_FUNCTIONS_BUILD_TIMEOUT=900
```

**Important Notes:**
- Use `https://` prefix (Cloudflare Tunnel provides HTTPS automatically)
- Don't include `/v1` in the domain (Appwrite adds it automatically)
- Use your actual tunnel domain

### 2. Update Appwrite Console Settings

After restarting Appwrite, log into the console and verify:

1. **Go to Settings → General**
   - Verify the domain matches your tunnel domain
   - Check that HTTPS is enabled

2. **Go to Settings → API**
   - Note your Project ID (you'll need this for the app)
   - Verify API endpoints are accessible

### 3. Configure CORS (If Needed)

If you encounter CORS errors from the mobile app, you may need to configure CORS in Appwrite:

**Option A: Via Appwrite Console**
1. Go to Settings → Security
2. Add your app's origin if needed
3. For mobile apps, CORS is usually not required (they use native HTTP)

**Option B: Via Environment Variables**

Add to `docker-compose.yml`:

```yaml
environment:
  - _APP_DOMAIN_ALLOW_LIST=https://appwrite.yourdomain.com,https://yourdomain.com
```

### 4. Restart Appwrite

After making changes:

```bash
cd ~/appwrite  # or your Appwrite directory
docker compose down
docker compose up -d
```

Wait for Appwrite to fully start (check logs):

```bash
docker compose logs -f appwrite
```

Look for: `Appwrite is ready`

### 5. Verify Configuration

**Test API Endpoint:**

```bash
curl https://appwrite.yourdomain.com/v1/health
```

Expected response:
```json
{"status":"ok"}
```

**Test Console Access:**

Open in browser:
```
https://appwrite.yourdomain.com
```

You should see the Appwrite login/console.

**Test from External Network:**

Use a device on a different network (or mobile data) to verify:
- Console is accessible
- API responds correctly
- Authentication works

### 6. Security Considerations

**Restrict Console Access:**

In `docker-compose.yml`:

```yaml
environment:
  # Only allow your email to create projects
  - _APP_CONSOLE_WHITELIST_EMAILS=your-email@example.com
  
  # Optional: Restrict by IP (if you have static IP)
  - _APP_CONSOLE_WHITELIST_IPS=YOUR_IP_ADDRESS
```

**API Key Security:**

- Never commit API keys to git
- Use environment variables for API keys
- Rotate API keys regularly
- Use keys with minimal required permissions

**Database Security:**

- Ensure database is not exposed directly
- Use Appwrite's built-in authentication
- Set proper collection permissions
- Regular backups (see `SELF_HOST_BACKEND_GUIDE.md`)

### 7. Troubleshooting

**Issue: Appwrite not accessible via tunnel**

- Verify tunnel is running: `cloudflared tunnel list`
- Check tunnel logs for errors
- Verify domain DNS is configured correctly
- Test tunnel connectivity: `curl https://your-domain.com/v1/health`

**Issue: CORS errors**

- Mobile apps typically don't need CORS configuration
- If using web app, add origin to CORS settings
- Check browser console for specific error messages

**Issue: Authentication fails**

- Verify `_APP_DOMAIN` matches tunnel domain exactly
- Check Appwrite logs: `docker compose logs appwrite`
- Ensure HTTPS is used (not HTTP)
- Verify project ID is correct

**Issue: API returns 404**

- Check endpoint URL includes `/v1`
- Verify project ID is correct
- Check Appwrite logs for errors
- Test with curl/Postman first

### 8. Performance Optimization

**For Better Performance:**

1. **Enable Caching:**
   ```yaml
   environment:
     - _APP_REDIS_HOST=redis
   ```

2. **Optimize Database:**
   - Regular database maintenance
   - Monitor query performance
   - Index frequently queried fields

3. **Monitor Resources:**
   ```bash
   docker stats appwrite
   ```

### 9. Backup Configuration

Ensure backups are configured (see `SELF_HOST_BACKEND_GUIDE.md`):

- Regular database backups
- Backup Appwrite volumes
- Test restore procedures
- Store backups securely

## Configuration Checklist

Before deploying the mobile app:

- [ ] `_APP_DOMAIN` set to tunnel domain with `https://`
- [ ] Appwrite restarted and running
- [ ] API endpoint responds: `/v1/health`
- [ ] Console accessible via tunnel domain
- [ ] Tested from external network
- [ ] Security settings configured
- [ ] Backups configured
- [ ] Monitoring set up

## Next Steps

After configuring Appwrite:

1. Update Tipi app `.env` file with tunnel endpoint
2. Build mobile app with new endpoint
3. Test app connectivity
4. Deploy to devices

See `SELF_HOST_DEPLOYMENT.md` for complete deployment guide.



