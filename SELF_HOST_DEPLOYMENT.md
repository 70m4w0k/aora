# Self-Hosted Tipi App Deployment Guide

This guide walks you through deploying the Tipi app to work with your self-hosted Appwrite instance from anywhere using Cloudflare Tunnel.

## Prerequisites

- Self-hosted computer running Appwrite (already set up)
- Cloudflare account (free account works)
- Domain name (optional - can use Cloudflare's free `.trycloudflare.com` domain)
- Router access (only if using port forwarding alternative)

## Overview

The deployment uses Cloudflare Tunnel to expose your Appwrite instance to the internet without requiring:
- Port forwarding on your router
- Public IP address
- Complex firewall configuration

## Step-by-Step Deployment

### Phase 1: Set Up Cloudflare Tunnel

#### Option A: Automated Setup (Recommended)

Run the setup script on your self-hosted computer:

```bash
cd ~/tipi-deployment  # or wherever you cloned the repo
chmod +x scripts/setup-cloudflare-tunnel.sh
./scripts/setup-cloudflare-tunnel.sh
```

The script will:
1. Install `cloudflared` if not already installed
2. Authenticate with Cloudflare
3. Create a tunnel
4. Configure DNS routing
5. Set up auto-start service

#### Option B: Manual Setup

If you prefer manual setup, follow these steps:

**1. Install cloudflared**

```bash
# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# macOS
brew install cloudflared
```

**2. Login to Cloudflare**

```bash
cloudflared tunnel login
```

This opens your browser to authenticate.

**3. Create Tunnel**

```bash
cloudflared tunnel create tipi-appwrite
```

**4. Configure Tunnel**

Create config file at `~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /home/user/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: appwrite.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
```

Replace `<tunnel-id>` with your actual tunnel ID (from `cloudflared tunnel list`).

**5. Set Up DNS**

For custom domain:
```bash
cloudflared tunnel route dns tipi-appwrite appwrite.yourdomain.com
```

For free Cloudflare domain:
```bash
cloudflared tunnel run tipi-appwrite
# Note the URL shown (e.g., https://xxxxx.trycloudflare.com)
```

**6. Set Up Auto-Start Service**

**Linux (systemd):**

Create `/etc/systemd/system/cloudflared.service`:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=your-username
ExecStart=/usr/local/bin/cloudflared tunnel run tipi-appwrite
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

**macOS (launchd):**

Create `~/Library/LaunchAgents/com.cloudflare.cloudflared.tipi-appwrite.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.cloudflared.tipi-appwrite</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
        <string>tipi-appwrite</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load the service:
```bash
launchctl load ~/Library/LaunchAgents/com.cloudflare.cloudflared.tipi-appwrite.plist
```

### Phase 2: Configure Appwrite for Public Access

**1. Update Appwrite Environment Variables**

Edit your `docker-compose.yml` (or Appwrite config) and add/update:

```yaml
environment:
  - _APP_DOMAIN=https://appwrite.yourdomain.com  # Your tunnel domain
  - _APP_ENV=production
```

**2. Restart Appwrite**

```bash
cd ~/appwrite  # or wherever your docker-compose.yml is
docker compose down
docker compose up -d
```

**3. Verify Accessibility**

Test from external network:
```bash
curl https://appwrite.yourdomain.com/v1/health
```

Should return: `{"status":"ok"}`

### Phase 3: Update Tipi App Configuration

**1. Create/Update `.env` File**

In your Tipi app directory, create or update `.env`:

```env
# Appwrite Endpoint (use your Cloudflare Tunnel domain)
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://appwrite.yourdomain.com/v1

# Appwrite Project ID (from Appwrite console)
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here

# Appwrite Database ID (from Appwrite console)
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here

# Appwrite Platform
EXPO_PUBLIC_APPWRITE_PLATFORM=com.tipi.app

# Appwrite Storage ID (optional)
EXPO_PUBLIC_APPWRITE_STORAGE_ID=your_storage_id_here
```

**2. Verify Configuration**

Test connection from development:
```bash
npm start
```

Check the console logs for:
```
[Appwrite Config] Environment variables check: { hasProjectId: true, ... }
```

**3. Update Default Endpoint (Optional)**

If you want to change the default fallback endpoint in `lib/appwrite.js`, update line 35:

```javascript
endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || "https://appwrite.yourdomain.com/v1",
```

### Phase 4: Build and Deploy Mobile App

**1. Build iOS App**

```bash
npm run build:ios
# Or for production:
eas build --platform ios --profile production
```

**2. Build Android App**

```bash
npm run build:android
# Or for production:
eas build --platform android --profile production
```

**3. Install on Devices**

- **iOS**: Install via TestFlight or direct install
- **Android**: Install APK or distribute via Google Play Internal Testing

**4. Test Connectivity**

- Test from WiFi network
- Test from cellular network
- Test from different locations
- Verify authentication works
- Test CRUD operations (create household, tasks, etc.)

### Phase 5: Security and Maintenance

**1. Security Checklist**

- [ ] HTTPS is enforced (Cloudflare Tunnel provides this automatically)
- [ ] Appwrite console access is restricted (use `_APP_CONSOLE_WHITELIST_EMAILS`)
- [ ] API keys are secure (never commit to git)
- [ ] Regular backups are set up (see `SELF_HOST_BACKEND_GUIDE.md`)

**2. Monitoring**

**Check Tunnel Status:**

```bash
# Linux
sudo systemctl status cloudflared

# macOS
launchctl list | grep cloudflared
```

**View Tunnel Logs:**

```bash
# Linux
sudo journalctl -u cloudflared -f

# macOS
tail -f ~/.cloudflared/tunnel.log
```

**3. Backup Procedures**

Follow the backup guide in `SELF_HOST_BACKEND_GUIDE.md` to set up regular Appwrite backups.

**4. Troubleshooting**

**Tunnel Not Connecting:**
- Check tunnel is running: `cloudflared tunnel list`
- Verify DNS is configured correctly
- Check firewall isn't blocking cloudflared

**Appwrite Not Accessible:**
- Verify Appwrite is running: `docker ps`
- Check Appwrite logs: `docker compose logs appwrite`
- Verify `_APP_DOMAIN` matches tunnel domain

**Mobile App Can't Connect:**
- Verify endpoint URL is correct in `.env`
- Check environment variables are loaded (check console logs)
- Test endpoint from browser: `https://your-domain.com/v1/health`
- Verify CORS settings in Appwrite if needed

## Testing Checklist

Before considering deployment complete:

- [ ] Cloudflare Tunnel is running and accessible
- [ ] Appwrite console accessible via tunnel domain
- [ ] Appwrite API responds at `/v1/health`
- [ ] Mobile app connects to Appwrite via tunnel
- [ ] Authentication works from mobile app
- [ ] Data operations work (create household, tasks, etc.)
- [ ] App works from different networks (WiFi, cellular)
- [ ] Tunnel auto-restarts on server reboot
- [ ] Backups are configured
- [ ] Monitoring is set up

## Alternative Options

If Cloudflare Tunnel doesn't work for your use case:

**1. Tailscale VPN**
- Set up Tailscale on self-hosted computer
- Install Tailscale on mobile devices
- Connect devices to same Tailnet
- Use Tailscale IP as Appwrite endpoint

**2. Port Forwarding**
- Forward router ports 80/443 to self-hosted computer
- Set up dynamic DNS if IP changes
- Configure SSL certificate (Let's Encrypt)
- Use public IP/domain as Appwrite endpoint

**3. ngrok (Testing Only)**
- Quick testing solution
- Not recommended for production
- Free tier has limitations

## Notes

- Cloudflare Tunnel is free and doesn't require port forwarding
- HTTPS is automatically provided by Cloudflare
- Tunnel domain can be custom domain or Cloudflare's free `.trycloudflare.com` domain
- Mobile app builds bundle environment variables, so endpoint is baked into app
- Consider using different endpoints for dev/staging/production builds
- Keep tunnel credentials secure (they're stored in `~/.cloudflared/`)

## Support

If you encounter issues:
1. Check tunnel logs
2. Verify Appwrite is running
3. Test endpoint accessibility
4. Review Cloudflare Tunnel documentation: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/



