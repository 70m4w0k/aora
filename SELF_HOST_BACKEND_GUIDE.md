# 🖥️ Self-Host Appwrite Backend Guide

## Overview

This guide will help you self-host Appwrite on an old computer, giving you full control over your data and eliminating cloud costs.

---

## 📋 Prerequisites

### System Requirements

**Minimum:**
- **CPU:** 2 cores
- **RAM:** 4GB (8GB recommended)
- **Storage:** 20GB free space
- **OS:** Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2

**Recommended:**
- **CPU:** 4+ cores
- **RAM:** 8GB+
- **Storage:** 50GB+ SSD
- **Network:** Static IP or dynamic DNS setup

### Software Requirements

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Git** (optional, for updates)

---

## 🚀 Step 1: Install Docker

### Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Logout and login again for group changes to take effect
```

### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker

# Open Docker Desktop from Applications
# Docker Compose is included
```

### Windows (WSL2)

```powershell
# Install WSL2 (run in PowerShell as Admin)
wsl --install

# After restart, open Ubuntu terminal and follow Ubuntu instructions above
```

---

## 📦 Step 2: Install Appwrite

### Quick Install (Recommended)

```bash
# Create appwrite directory
mkdir -p ~/appwrite
cd ~/appwrite

# Download Appwrite installation script
curl -o docker-compose.yml https://appwrite.io/install/compose

# Start Appwrite
docker compose up -d

# Check status
docker compose ps
```

### Manual Install

```bash
# Create appwrite directory
mkdir -p ~/appwrite
cd ~/appwrite

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  appwrite:
    image: appwrite/appwrite:1.5.4
    container_name: appwrite
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "9500:9500"
    volumes:
      - appwrite-config:/usr/src/code/appwrite/config
      - appwrite-uploads:/usr/src/code/appwrite/storage/uploads
      - appwrite-cache:/usr/src/code/appwrite/storage/cache
      - appwrite-certificates:/usr/src/code/appwrite/storage/certificates
      - appwrite-functions:/usr/src/code/appwrite/functions
      - appwrite-influxdb:/usr/src/code/appwrite/influxdb
      - appwrite-mariadb:/var/lib/mysql
      - appwrite-redis:/data
      - appwrite-cache:/cache
    environment:
      - _APP_ENV=production
      - _APP_WORKER_PER_CORE=6
      - _APP_LOCALE=en
      - _APP_CONSOLE_WHITELIST_ROOT=enabled
      - _APP_CONSOLE_WHITELIST_EMAILS=
      - _APP_CONSOLE_WHITELIST_IPS=
      - _APP_USAGE_STATS=enabled
      - _APP_LOGGING_PROVIDER=
      - _APP_LOGGING_CONFIG=
      - _APP_USAGE_AGGREGATION_INTERVAL=30
      - _APP_USAGE_AGGREGATION_RETENTION=30
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_REDIS_USER=
      - _APP_REDIS_PASS=
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password
      - _APP_STORAGE_LIMIT=30000000
      - _APP_STORAGE_PREVIEW_LIMIT=20000000
      - _APP_STORAGE_ANTIVIRUS=disabled
      - _APP_STORAGE_ANTIVIRUS_HOST=clamav
      - _APP_STORAGE_ANTIVIRUS_PORT=3310
      - _APP_STORAGE_DEVICE=local
      - _APP_STORAGE_S3_ACCESS_KEY=
      - _APP_STORAGE_S3_SECRET=
      - _APP_STORAGE_S3_REGION=us-east-1
      - _APP_STORAGE_S3_BUCKET=
      - _APP_STORAGE_DO_SPACES_ACCESS_KEY=
      - _APP_STORAGE_DO_SPACES_SECRET=
      - _APP_STORAGE_DO_SPACES_REGION=nyc3
      - _APP_STORAGE_DO_SPACES_BUCKET=
      - _APP_STORAGE_BACKBLAZE_ACCESS_KEY=
      - _APP_STORAGE_BACKBLAZE_SECRET=
      - _APP_STORAGE_BACKBLAZE_REGION=us-west-004
      - _APP_STORAGE_BACKBLAZE_BUCKET=
      - _APP_STORAGE_LINODE_ACCESS_KEY=
      - _APP_STORAGE_LINODE_SECRET=
      - _APP_STORAGE_LINODE_REGION=us-east-1
      - _APP_STORAGE_LINODE_BUCKET=
      - _APP_STORAGE_WASABI_ACCESS_KEY=
      - _APP_STORAGE_WASABI_SECRET=
      - _APP_STORAGE_WASABI_REGION=us-east-1
      - _APP_STORAGE_WASABI_BUCKET=
      - _APP_INFLUXDB_HOST=influxdb
      - _APP_INFLUXDB_PORT=8086
    depends_on:
      mariadb:
        condition: service_healthy
      redis:
        condition: service_started
      influxdb:
        condition: service_healthy
      clamav:
        condition: service_started

  mariadb:
    image: appwrite/mariadb:1.5.4
    container_name: appwrite-mariadb
    restart: unless-stopped
    volumes:
      - appwrite-mariadb:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=appwrite
      - MYSQL_USER=user
      - MYSQL_PASSWORD=password
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 3s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: appwrite-redis
    restart: unless-stopped
    volumes:
      - appwrite-redis:/data

  influxdb:
    image: appwrite/influxdb:1.5.4
    container_name: appwrite-influxdb
    restart: unless-stopped
    volumes:
      - appwrite-influxdb:/var/lib/influxdb2
    environment:
      - DOCKER_INFLUXDB_INIT_MODE=setup
      - DOCKER_INFLUXDB_INIT_USERNAME=appwrite-influxdb-user
      - DOCKER_INFLUXDB_INIT_PASSWORD=appwrite-influxdb-password
      - DOCKER_INFLUXDB_INIT_ORG=appwrite
      - DOCKER_INFLUXDB_INIT_BUCKET=appwrite
      - DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=appwrite-influxdb-token
    healthcheck:
      test: ["CMD", "influx", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  clamav:
    image: appwrite/clamav:1.5.4
    container_name: appwrite-clamav
    restart: unless-stopped

volumes:
  appwrite-config:
  appwrite-uploads:
  appwrite-cache:
  appwrite-certificates:
  appwrite-functions:
  appwrite-influxdb:
  appwrite-mariadb:
  appwrite-redis:
EOF

# Start Appwrite
docker compose up -d

# Check logs
docker compose logs -f appwrite
```

---

## ⚙️ Step 3: Initial Setup

### Access Appwrite Console

1. **Open browser:**
   ```
   http://localhost
   ```
   Or if on a different machine:
   ```
   http://YOUR_COMPUTER_IP
   ```

2. **Create Admin Account:**
   - Enter **email** and password
   - **Important:** Appwrite requires an email address (not a username)
   - The first user you create becomes the admin account
   - Make sure to use a valid email address you can access

3. **Create Project:**
   - Click "Create Project"
   - Name: "Tipi" (or your choice)
   - Copy the **Project ID** (you'll need this)

### Get Your Endpoint

Your Appwrite endpoint will be:
```
http://YOUR_COMPUTER_IP/v1
```

Or if you set up a domain:
```
https://your-domain.com/v1
```

---

## 🔧 Step 4: Configure for Production

### Update Environment Variables

Edit `docker-compose.yml` and update these critical settings:

```yaml
environment:
  - _APP_ENV=production
  - _APP_CONSOLE_WHITELIST_ROOT=enabled
  - _APP_CONSOLE_WHITELIST_EMAILS=your-email@example.com
  - _APP_CONSOLE_WHITELIST_IPS=YOUR_IP_ADDRESS
```

**Security Settings:**
- `_APP_CONSOLE_WHITELIST_EMAILS`: Only allow your email to create projects
- `_APP_CONSOLE_WHITELIST_IPS`: Restrict console access to your IP
- `_APP_USAGE_STATS`: Set to `disabled` if you don't want usage stats sent

### Restart Appwrite

```bash
cd ~/appwrite
docker compose down
docker compose up -d
```

---

## 🌐 Step 5: Make It Accessible (Optional)

### Option A: Local Network Only (Recommended for Testing)

**Find your computer's IP:**
```bash
# Linux/macOS
ip addr show | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

**Update app configuration:**
- Use `http://YOUR_LOCAL_IP/v1` as endpoint
- Roommates on same WiFi can access

### Option B: Internet Access (Advanced)
 
This option makes your Appwrite instance accessible from anywhere on the internet. **Note:** Your docker-compose.yml already includes Traefik as a reverse proxy, so you may not need Nginx unless you prefer it.

#### Prerequisites

- A domain name (e.g., `appwrite.yourdomain.com`) - you can get one from:
  - Namecheap, GoDaddy, Google Domains, Cloudflare, etc.
  - Or use a free subdomain from DuckDNS, No-IP, etc.
- Router admin access (for port forwarding)
- Static IP or Dynamic DNS setup

---

#### Step 1: Get Your Public IP Address

```bash
# On your Ubuntu server
curl ifconfig.me
# Or
curl ipinfo.io/ip
```

Save this IP address - you'll need it for DNS configuration.

---

#### Step 2: Configure Dynamic DNS (If Your IP Changes)

If your ISP assigns a dynamic IP that changes, use Dynamic DNS:

**Option A: DuckDNS (Free & Easy)**

1. **Sign up:** Go to https://www.duckdns.org/
2. **Create subdomain:** Choose a subdomain (e.g., `myappwrite`)
3. **Get your token:** Copy the token from your account
4. **Install DuckDNS client on server:**
```bash
# Create directory
mkdir -p ~/duckdns
cd ~/duckdns

# Create update script
cat > duck.sh << 'EOF'
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=YOUR_SUBDOMAIN&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF

# Replace YOUR_SUBDOMAIN and YOUR_TOKEN with your actual values
chmod +x duck.sh

# Test it
./duck.sh

# Add to crontab (updates every 5 minutes)
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

**Option B: No-IP (Free)**

1. Sign up at https://www.noip.com/
2. Create a hostname (e.g., `myappwrite.ddns.net`)
3. Install Dynamic Update Client:
```bash
cd /usr/local/src
sudo wget https://www.noip.com/client/linux/noip-duc-linux.tar.gz
sudo tar xzf noip-duc-linux.tar.gz
cd noip-2.1.9-1/
sudo make install
sudo /usr/local/bin/noip2 -C
# Follow the prompts to configure
```

**Option C: Cloudflare (If You Own a Domain)**

1. Add your domain to Cloudflare
2. Create an A record pointing to your public IP
3. Use Cloudflare's API for dynamic updates (more complex)

---

#### Step 3: Configure Port Forwarding on Your Router

**Important:** Forward these ports to your Ubuntu server's local IP:

- **Port 80** (HTTP) → Your server's local IP
- **Port 443** (HTTPS) → Your server's local IP
- **Port 9500** (Appwrite Realtime) → Your server's local IP (optional, only if using realtime features)

**Steps (varies by router):**

1. **Find your router's admin page:**
   - Usually `http://192.168.1.1` or `http://192.168.0.1`
   - Check router label for default gateway

2. **Log in to router admin panel**

3. **Find Port Forwarding/Virtual Server section:**
   - May be under "Advanced" → "Port Forwarding"
   - Or "Firewall" → "Port Forwarding"
   - Or "NAT" → "Port Forwarding"

4. **Add port forwarding rules:**

   **Rule 1: HTTP**
   - External Port: `80`
   - Internal Port: `80`
   - Protocol: `TCP` (or `Both`)
   - Internal IP: `192.168.1.46` (your server's local IP)
   - Description: `Appwrite HTTP`

   **Rule 2: HTTPS**
   - External Port: `443`
   - Internal Port: `443`
   - Protocol: `TCP` (or `Both`)
   - Internal IP: `192.168.1.46`
   - Description: `Appwrite HTTPS`

   **Rule 3: Realtime (Optional)**
   - External Port: `9500`
   - Internal Port: `9500`
   - Protocol: `TCP`
   - Internal IP: `192.168.1.46`
   - Description: `Appwrite Realtime`

5. **Save and apply changes**

**Note:** Some routers require you to set a static IP for the server. If so:
```bash
# On Ubuntu server, configure static IP
sudo nano /etc/netplan/01-netcfg.yaml
# Or use your network manager
```

---

#### Step 4: Configure Firewall on Ubuntu Server

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 9500/tcp  # Realtime (optional)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

#### Step 5: Update DNS Records

**If using a domain name:**

1. **Log in to your domain registrar**
2. **Add DNS records:**

   **For root domain (`yourdomain.com`):**
   - Type: `A`
   - Name: `@` (or blank)
   - Value: `YOUR_PUBLIC_IP`
   - TTL: `3600` (or auto)

   **For subdomain (`appwrite.yourdomain.com`):**
   - Type: `A`
   - Name: `appwrite`
   - Value: `YOUR_PUBLIC_IP`
   - TTL: `3600`

3. **Wait for DNS propagation** (5 minutes to 48 hours, usually 15-30 minutes)

**Test DNS:**
```bash
# Check if DNS is working
nslookup appwrite.yourdomain.com
# Or
dig appwrite.yourdomain.com
```

---

#### Step 6: Configure Appwrite for Your Domain

Update your `.env` file on the server:

```bash
cd ~/appwrite
nano .env
```

Add/update these settings:

```env
# Domain Configuration
_APP_DOMAIN=appwrite.yourdomain.com
_APP_DOMAIN_TARGET_A=YOUR_PUBLIC_IP
_APP_DOMAIN_TARGET_AAAA=
_APP_DOMAIN_TARGET_CNAME=
_APP_DOMAIN_TARGET_CAA=
_APP_DNS=8.8.8.8

# Enable HTTPS
_APP_OPTIONS_FORCE_HTTPS=enabled
_APP_OPTIONS_ROUTER_FORCE_HTTPS=enabled

# Console hostnames (allow access from your domain)
_APP_CONSOLE_HOSTNAMES=appwrite.yourdomain.com,localhost
```

**Important:** Replace `appwrite.yourdomain.com` with your actual domain.

Restart Appwrite:
```bash
docker compose down
docker compose up -d
```

---

#### Step 7: Set Up SSL Certificate (Let's Encrypt)

**Note:** Your docker-compose.yml uses Traefik, which can handle SSL automatically. However, if you want to use Nginx instead:

**Option A: Using Traefik (Already in your setup)**

Traefik should automatically handle SSL certificates. Make sure your domain is configured correctly in `.env` and Traefik will request certificates from Let's Encrypt.

**Option B: Using Nginx + Certbot**

```bash
# Install Nginx
sudo apt update
sudo apt install nginx -y

# Stop Nginx (since Appwrite/Traefik uses port 80)
sudo systemctl stop nginx
sudo systemctl disable nginx

# Actually, if Traefik is handling SSL, you may not need Nginx
# Skip to Certbot setup if using Traefik
```

**If using Nginx as reverse proxy:**

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/appwrite

# Add:
server {
    listen 80;
    server_name appwrite.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (for realtime)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/appwrite /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default if exists
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d appwrite.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

**Auto-renewal is configured automatically** - Certbot adds a cron job.

---

#### Step 8: Update App Configuration

Update `lib/appwrite.js` in your app:

```javascript
export const appwriteConfig = {
  endpoint: "https://appwrite.yourdomain.com/v1",  // Use HTTPS!
  platform: "com.wok.aora",
  projectId: "YOUR_PROJECT_ID",
  // ... rest of config
};
```

**Important:** Use `https://` not `http://` when SSL is configured.

---

#### Step 9: Test Your Setup

1. **Test HTTP access:**
   ```bash
   curl http://appwrite.yourdomain.com/v1/health
   ```

2. **Test HTTPS access:**
   ```bash
   curl https://appwrite.yourdomain.com/v1/health
   ```

3. **Test from browser:**
   - Open `https://appwrite.yourdomain.com`
   - Should see Appwrite console
   - SSL certificate should be valid (green lock icon)

4. **Test from your app:**
   - Update endpoint in `lib/appwrite.js`
   - Try to sign up/login
   - Verify connection works

---

#### Security Checklist

- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] Strong passwords for admin account
- [ ] SSL certificate installed and working
- [ ] `_APP_CONSOLE_WHITELIST_EMAILS` set to your email
- [ ] `_APP_CONSOLE_WHITELIST_IPS` set (optional, for extra security)
- [ ] Regular backups configured
- [ ] Router admin password changed from default
- [ ] Domain DNS records configured correctly

---

#### Troubleshooting

**Can't access from internet:**
- Check port forwarding is configured correctly
- Verify firewall allows ports 80/443
- Test if you can access using public IP directly
- Check router logs for blocked connections

**SSL certificate errors:**
- Ensure domain DNS points to your public IP
- Port 80 must be accessible for Let's Encrypt validation
- Check Traefik/Nginx logs: `docker compose logs traefik` or `sudo journalctl -u nginx`

**DNS not resolving:**
- Wait longer (DNS can take up to 48 hours)
- Check DNS records are correct
- Use `dig` or `nslookup` to verify

**Connection timeout:**
- Verify port forwarding rules
- Check if ISP blocks ports 80/443 (some ISPs do)
- Try different ports if blocked (requires more configuration)

---

#### Alternative: Use Cloudflare Tunnel (No Port Forwarding Needed)

If port forwarding isn't possible (e.g., behind NAT, ISP blocks ports):

1. **Sign up for Cloudflare** (free)
2. **Add your domain to Cloudflare**
3. **Install Cloudflare Tunnel:**
```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create appwrite

# Configure tunnel
cloudflared tunnel route dns appwrite appwrite.yourdomain.com

# Run tunnel
cloudflared tunnel run appwrite
```

This bypasses the need for port forwarding entirely.

---

## 📱 Step 6: Update App Configuration

### Update `lib/appwrite.js`

```javascript
export const appwriteConfig = {
  endpoint: "http://YOUR_COMPUTER_IP/v1",  // Or your domain
  platform: "com.wok.aora",
  projectId: "YOUR_NEW_PROJECT_ID",  // From Appwrite Console
  databaseId: "YOUR_DATABASE_ID",
  // ... rest of config
};
```

### Test Connection

```bash
# In your app directory
npm start

# Try to sign up/login
# Check if backend connection works
```

---

## 📊 Step 7: Create Collections

Follow the same steps as cloud setup:

1. **Login to Appwrite Console:** `http://YOUR_IP`
2. **Create Database:** Go to Databases → Create Database
3. **Create Collections:** Follow `BACKEND_SETUP_GUIDE.md`
4. **Set Permissions:** Configure as per guide
5. **Update Collection IDs:** In `lib/appwrite.js`

---

## 🔒 Step 8: Security Hardening

### Firewall Setup

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### Regular Backups

**Create backup script:**

```bash
# Create backup directory
mkdir -p ~/appwrite-backups

# Create backup script
cat > ~/backup-appwrite.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/appwrite-backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup volumes
docker run --rm \
  -v appwrite-mariadb:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/mariadb-$DATE.tar.gz -C /data .

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: mariadb-$DATE.tar.gz"
EOF

chmod +x ~/backup-appwrite.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/YOUR_USER/backup-appwrite.sh
```

### Update Appwrite Regularly

```bash
cd ~/appwrite

# Stop containers
docker compose down

# Pull latest images
docker compose pull

# Start with new images
docker compose up -d

# Clean up old images
docker image prune -a
```

---

## 🔄 Step 9: Auto-Start on Boot

### Linux (systemd)

```bash
# Create systemd service
sudo nano /etc/systemd/system/appwrite.service

# Add:
[Unit]
Description=Appwrite
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/YOUR_USER/appwrite
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=YOUR_USER
Group=docker

[Install]
WantedBy=multi-user.target

# Enable service
sudo systemctl enable appwrite
sudo systemctl start appwrite
```

### macOS

```bash
# Create launchd plist
cat > ~/Library/LaunchAgents/com.appwrite.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.appwrite</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/docker</string>
        <string>compose</string>
        <string>-f</string>
        <string>/Users/YOUR_USER/appwrite/docker-compose.yml</string>
        <string>up</string>
        <string>-d</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
EOF

# Load service
launchctl load ~/Library/LaunchAgents/com.appwrite.plist
```

---

## 🧪 Step 10: Testing & Verification

### Test Checklist

- [ ] Appwrite Console accessible
- [ ] Can create admin account
- [ ] Can create project
- [ ] Can create database
- [ ] Can create collections
- [ ] App can connect to backend
- [ ] Can sign up/login from app
- [ ] Can create household
- [ ] Can upload files
- [ ] Backups working

### Performance Test

```bash
# Check resource usage
docker stats

# Check logs
docker compose logs appwrite

# Check if all services are running
docker compose ps
```

---

## 🚨 Troubleshooting

### Database Connection Error (MariaDB)

**Error:** `Failed to connect to database: getaddrinfo for mariadb failed`

**Solution:**

```bash
cd ~/appwrite

# 1. Check if MariaDB is running
docker compose ps

# 2. Check MariaDB logs (might be initializing)
docker compose logs mariadb

# 3. Wait for MariaDB to be healthy (first start takes 30-60 seconds)
# Watch the health status:
docker compose ps mariadb

# 4. If MariaDB is unhealthy or not starting, restart it:
docker compose restart mariadb

# 5. Wait 30-60 seconds, then restart Appwrite:
docker compose restart appwrite

# 6. Check Appwrite logs again:
docker compose logs -f appwrite
```

**If still failing:**

```bash
# Stop all containers
docker compose down

# Remove MariaDB volume (WARNING: This deletes all data!)
docker volume rm appwrite-mariadb

# Start fresh
docker compose up -d

# Wait 60 seconds for MariaDB to initialize
# Then check logs
docker compose logs -f appwrite
```

**Alternative: Check network connectivity**

```bash
# Test if Appwrite can reach MariaDB
docker compose exec appwrite ping mariadb

# Check if MariaDB is listening
docker compose exec mariadb mysql -u user -ppassword -e "SELECT 1;"
```

### Appwrite won't start

```bash
# Check logs
docker compose logs appwrite

# Check if ports are in use
sudo netstat -tulpn | grep -E ':(80|443|9500)'

# Restart Docker
sudo systemctl restart docker
docker compose up -d
```

### Can't access from other devices

```bash
# Check firewall
sudo ufw status

# Check if Appwrite is listening
sudo netstat -tulpn | grep docker

# Verify IP address
hostname -I
```

### Out of disk space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Remove old backups
find ~/appwrite-backups -mtime +30 -delete
```

### Database connection errors

```bash
# Check MariaDB logs
docker compose logs mariadb

# Restart database
docker compose restart mariadb

# Check database health
docker compose exec mariadb mysql -u user -ppassword -e "SHOW DATABASES;"
```

### SSL Certificate Warning for Local IP

**Error:** `192.168.1.46 is not a publicly accessible domain. Skipping SSL certificate generation.`

**This is normal and expected** for local IP addresses. To suppress the warning, update your `.env` file:

```bash
cd ~/appwrite
nano .env
```

Add/update:
```env
# Leave domain empty for local IP
_APP_DOMAIN=
_APP_DOMAIN_TARGET_CNAME=
_APP_DOMAIN_TARGET_AAAA=
_APP_DOMAIN_TARGET_A=
_APP_DOMAIN_TARGET_CAA=
_APP_DNS=

# Disable HTTPS enforcement for local development
_APP_OPTIONS_FORCE_HTTPS=disabled
_APP_OPTIONS_ROUTER_FORCE_HTTPS=disabled
```

Then restart:
```bash
docker compose restart appwrite-worker-certificates
```

### Admin Account Setup

**Note:** Appwrite doesn't automatically create an admin account from environment variables. The first user who signs up through the web console becomes the admin.

**To configure console access for your admin email:**

1. Update `.env` file:
```bash
cd ~/appwrite
nano .env
```

Add:
```env
_APP_CONSOLE_WHITELIST_ROOT=enabled
_APP_CONSOLE_WHITELIST_EMAILS=your-email@example.com
_APP_CONSOLE_WHITELIST_IPS=YOUR_SERVER_IP
```

2. Restart Appwrite:
```bash
docker compose down
docker compose up -d
```

**Important:** Replace `your-email@example.com` with the email address you used to create your admin account.

### "Missing Scopes" Error

**Error:** `User (role: guests) missing scopes (["account"])`

**This error is normal** and occurs when:
- The app checks for an existing session on startup (before login)
- An unauthenticated request tries to access a protected endpoint
- The app is configured correctly but no user is logged in yet

**Solutions:**

1. **If you see this in logs but app works:** This is expected behavior - ignore it.

2. **If app can't connect:**
   - Verify endpoint is correct: `http://192.168.1.46/v1` (not `https://`)
   - Check project ID matches your self-hosted project
   - Ensure you've created a project in Appwrite Console

3. **CORS Issues (if accessing from browser):**
   - Self-hosted Appwrite should allow CORS by default
   - If you have CORS errors, check `.env` file:
   ```env
   _APP_CONSOLE_HOSTNAMES=192.168.1.46,localhost
   ```

4. **Test authentication:**
   ```bash
   # Try logging in through the app
   # The error should disappear once authenticated
   ```

---

## 📈 Monitoring & Maintenance

### Daily Checks

- Monitor disk space: `df -h`
- Check container status: `docker compose ps`
- Review error logs: `docker compose logs --tail=50 appwrite`

### Weekly Tasks

- Review backups
- Check for Appwrite updates
- Monitor resource usage

### Monthly Tasks

- Update Appwrite to latest version
- Review and clean old data
- Test backup restoration

---

## 💰 Cost Comparison

**Cloud Appwrite:**
- Free tier: Limited
- Paid: $15-50+/month

**Self-Hosted:**
- Hardware: $0 (using old computer)
- Electricity: ~$5-10/month
- Internet: Already have
- **Total: ~$5-10/month**

---

## 🔄 Migration from Cloud to Self-Hosted

**Note:** Since you only need to migrate the **schema** (not data), you can skip the data export/import steps and go directly to creating collections using the corrected schema.

**For Schema-Only Migration:**
- Use `DB_SCHEMA_CORRECTED.md` as your reference
- Create collections manually in self-hosted Appwrite Console
- Follow the corrected schema exactly

**For Data Migration (if needed later):**
- Use the scripts below to export/import actual documents

### Prerequisites

- Access to both cloud and self-hosted Appwrite consoles
- Appwrite CLI installed (for easier export/import)
- Node.js installed (for running scripts)

---

### Step 1: Document Current Schema

Since you only need to migrate the schema (not data), document your current schema:

**Option A: Manual Documentation (Recommended for Schema Only)**

1. **Go to Cloud Appwrite Console:**
   - Login to https://cloud.appwrite.io
   - Navigate to your project → Databases

2. **For each collection, document:**
   - Collection name and ID
   - All attributes (name, type, size, required, default)
   - All indexes
   - All permissions
   - Relationships (which collections they reference)

3. **Use the corrected schema:**
   - Reference `DB_SCHEMA_CORRECTED.md` for the corrected schema
   - This already has all collections properly documented
   - Use this as your source of truth

**Option B: Export Data (If You Need Data Migration)**

If you need to export actual data (documents), use the Node.js scripts below:

Create a script to export all documents from each collection:

```bash
# Create export script
cat > export-data.js << 'EOF'
const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('66cc7b47003a18bd5600')
    .setKey('YOUR_API_KEY'); // Get from Appwrite Console > Settings > API Keys

const databases = new Databases(client);

const collections = {
    '66cc7c760013e5170042': { // Database ID
        '66cc7c930038937612d7': 'users', // Collection ID: Collection Name
        '692d9aa3002cdbc240cc': 'households',
        '66daeaba0012bea61d31': 'tasks',
        '66daebd5003dbbdb0beb': 'tasksDone',
        '67c5f73b003091bc520c': 'shoppingItems',
        '67c5f84e0011953452e2': 'expenses',
        '67c637aa002f0ba982dc': 'expenseSettlements',
    }
};

async function exportCollection(databaseId, collectionId, collectionName) {
    try {
        console.log(`Exporting ${collectionName}...`);
        const response = await databases.listDocuments(databaseId, collectionId);
        const fs = require('fs');
        const path = require('path');
        
        const exportDir = path.join(__dirname, 'data', collectionName);
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(exportDir, `${collectionName}.json`),
            JSON.stringify(response.documents, null, 2)
        );
        
        console.log(`✅ Exported ${response.documents.length} documents from ${collectionName}`);
        return response.documents;
    } catch (error) {
        console.error(`❌ Error exporting ${collectionName}:`, error.message);
        return [];
    }
}

async function exportAll() {
    const databaseId = '66cc7c760013e5170042';
    
    for (const [collectionId, collectionName] of Object.entries(collections[databaseId])) {
        await exportCollection(databaseId, collectionId, collectionName);
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✅ Export complete!');
}

exportAll();
EOF

# Install dependencies
npm init -y
npm install node-appwrite

# Run export script
node export-data.js
```

**Get API Key:**
1. Go to https://cloud.appwrite.io
2. Login → Your Project → Settings → API Keys
3. Create a new API key with "Databases" scope
4. Copy the key and replace `YOUR_API_KEY` in the script

#### Option B: Manual Export via Console

1. **For each collection:**
   - Go to Appwrite Console → Databases → Your Collection
   - Click "..." menu → Export
   - Download as JSON
   - Save files with collection names

2. **Export Storage Files:**
   - Go to Storage → Your Bucket
   - Download files manually or use Storage API

---

### Step 3: Export Storage Files

Create a script to download all storage files:

```bash
cat > export-storage.js << 'EOF'
const { Client, Storage } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('66cc7b47003a18bd5600')
    .setKey('YOUR_API_KEY');

const storage = new Storage(client);
const bucketId = '66cc7dd9000d1e1e11e0'; // Your storage bucket ID

async function exportStorage() {
    try {
        const files = await storage.listFiles(bucketId);
        const exportDir = path.join(__dirname, 'storage');
        
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        
        console.log(`Found ${files.files.length} files`);
        
        for (const file of files.files) {
            try {
                const fileData = await storage.getFileView(bucketId, file.$id);
                const filePath = path.join(exportDir, file.name || file.$id);
                fs.writeFileSync(filePath, Buffer.from(fileData));
                console.log(`✅ Downloaded: ${file.name || file.$id}`);
            } catch (error) {
                console.error(`❌ Error downloading ${file.name}:`, error.message);
            }
        }
        
        // Save file metadata
        fs.writeFileSync(
            path.join(exportDir, 'metadata.json'),
            JSON.stringify(files.files, null, 2)
        );
        
        console.log('✅ Storage export complete!');
    } catch (error) {
        console.error('❌ Storage export error:', error.message);
    }
}

exportStorage();
EOF

node export-storage.js
```

---

### Step 4: Set Up Self-Hosted Appwrite Schema

1. **Create Project in Self-Hosted:**
   - Go to `http://192.168.1.46`
   - Login → Create Project
   - Copy the new Project ID

2. **Create Database:**
   - Go to Databases → Create Database
   - Copy the Database ID

3. **Create Collections Using Corrected Schema:**
   - **Use `DB_SCHEMA_CORRECTED.md` as your reference**
   - This document has all collections with corrected schemas
   - Follow the schema exactly:
     - Use Relationship attributes (not String IDs)
     - Follow naming conventions (snake_case)
     - Add all required indexes
     - Set proper permissions
   
   **Manual Creation Steps:**
   - For each collection in `DB_SCHEMA_CORRECTED.md`:
     1. Create collection in Appwrite Console
     2. Add all attributes (in order specified)
     3. Create all indexes
     4. Set all permissions
     5. Copy collection ID to `lib/appwrite.js`

---

### Step 5: Import Data to Self-Hosted

Create an import script:

```bash
cat > import-data.js << 'EOF'
const { Client, Databases } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Self-hosted Appwrite configuration
const client = new Client()
    .setEndpoint('http://192.168.1.46/v1') // Your self-hosted endpoint
    .setProject('YOUR_NEW_PROJECT_ID') // New project ID
    .setKey('YOUR_SELF_HOSTED_API_KEY'); // Get from self-hosted console

const databases = new Databases(client);

// Map old collection IDs to new ones
const collectionMap = {
    'users': 'YOUR_NEW_USERS_COLLECTION_ID',
    'households': 'YOUR_NEW_HOUSEHOLDS_COLLECTION_ID',
    'tasks': 'YOUR_NEW_TASKS_COLLECTION_ID',
    'tasksDone': 'YOUR_NEW_TASKS_DONE_COLLECTION_ID',
    'shoppingItems': 'YOUR_NEW_SHOPPING_COLLECTION_ID',
    'expenses': 'YOUR_NEW_EXPENSES_COLLECTION_ID',
    'expenseSettlements': 'YOUR_NEW_SETTLEMENTS_COLLECTION_ID',
};

const databaseId = 'YOUR_NEW_DATABASE_ID';

async function importCollection(collectionName, newCollectionId) {
    try {
        const dataPath = path.join(__dirname, 'data', collectionName, `${collectionName}.json`);
        
        if (!fs.existsSync(dataPath)) {
            console.log(`⚠️  No data file found for ${collectionName}`);
            return;
        }
        
        const documents = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`Importing ${documents.length} documents to ${collectionName}...`);
        
        for (const doc of documents) {
            try {
                // Remove Appwrite-specific fields that will be regenerated
                const { $id, $createdAt, $updatedAt, ...data } = doc;
                
                await databases.createDocument(
                    databaseId,
                    newCollectionId,
                    'unique()', // Auto-generate ID
                    data
                );
                
                console.log(`  ✅ Imported document: ${doc.$id || 'new'}`);
            } catch (error) {
                console.error(`  ❌ Error importing document:`, error.message);
            }
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`✅ Completed importing ${collectionName}`);
    } catch (error) {
        console.error(`❌ Error importing ${collectionName}:`, error.message);
    }
}

async function importAll() {
    for (const [collectionName, collectionId] of Object.entries(collectionMap)) {
        await importCollection(collectionName, collectionId);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✅ Import complete!');
}

importAll();
EOF

# Update the script with your actual IDs, then run:
node import-data.js
```

---

### Step 6: Import Storage Files

```bash
cat > import-storage.js << 'EOF'
const { Client, Storage } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

const client = new Client()
    .setEndpoint('http://192.168.1.46/v1')
    .setProject('YOUR_NEW_PROJECT_ID')
    .setKey('YOUR_SELF_HOSTED_API_KEY');

const storage = new Storage(client);
const bucketId = 'YOUR_NEW_STORAGE_BUCKET_ID';
const storageDir = path.join(__dirname, 'storage');

async function importStorage() {
    try {
        const metadataPath = path.join(storageDir, 'metadata.json');
        if (!fs.existsSync(metadataPath)) {
            console.log('⚠️  No storage metadata found');
            return;
        }
        
        const files = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        console.log(`Importing ${files.length} files...`);
        
        for (const fileMeta of files) {
            try {
                const filePath = path.join(storageDir, fileMeta.name || fileMeta.$id);
                
                if (!fs.existsSync(filePath)) {
                    console.log(`⚠️  File not found: ${fileMeta.name}`);
                    continue;
                }
                
                const fileBuffer = fs.readFileSync(filePath);
                
                await storage.createFile(
                    bucketId,
                    'unique()',
                    fileBuffer,
                    [fileMeta.$permissions || 'read("any")'],
                    [fileMeta.name || fileMeta.$id]
                );
                
                console.log(`✅ Imported: ${fileMeta.name || fileMeta.$id}`);
            } catch (error) {
                console.error(`❌ Error importing ${fileMeta.name}:`, error.message);
            }
        }
        
        console.log('✅ Storage import complete!');
    } catch (error) {
        console.error('❌ Storage import error:', error.message);
    }
}

importStorage();
EOF

node import-storage.js
```

---

### Step 7: Update App Configuration

Update `lib/appwrite.js` with new IDs:

```javascript
export const appwriteConfig = {
  endpoint: "http://192.168.1.46/v1",
  platform: "com.wok.aora",
  projectId: "YOUR_NEW_PROJECT_ID",
  databaseId: "YOUR_NEW_DATABASE_ID",
  userCollectionId: "YOUR_NEW_USERS_COLLECTION_ID",
  storageId: "YOUR_NEW_STORAGE_BUCKET_ID",
  // ... update all collection IDs
};
```

---

### Step 8: Verify Migration

1. **Check Data:**
   - Login to self-hosted Appwrite Console
   - Verify all collections have documents
   - Check storage bucket has files

2. **Test App:**
   - Update app configuration
   - Try logging in with existing credentials
   - Verify data appears correctly

3. **Test Functionality:**
   - Create new document
   - Update existing document
   - Upload new file
   - Verify permissions work

---

### Quick Migration Script (All-in-One)

Create a complete migration script:

```bash
cat > migrate-appwrite.sh << 'EOF'
#!/bin/bash

# Configuration
CLOUD_ENDPOINT="https://cloud.appwrite.io/v1"
CLOUD_PROJECT="66cc7b47003a18bd5600"
CLOUD_API_KEY="YOUR_CLOUD_API_KEY"

SELF_HOSTED_ENDPOINT="http://192.168.1.46/v1"
SELF_HOSTED_PROJECT="YOUR_NEW_PROJECT_ID"
SELF_HOSTED_API_KEY="YOUR_SELF_HOSTED_API_KEY"

echo "🚀 Starting Appwrite Migration..."
echo "📥 Exporting from cloud..."
node export-data.js
node export-storage.js

echo "📤 Importing to self-hosted..."
node import-data.js
node import-storage.js

echo "✅ Migration complete!"
echo "📝 Don't forget to update lib/appwrite.js with new IDs"
EOF

chmod +x migrate-appwrite.sh
./migrate-appwrite.sh
```

---

### Troubleshooting

**Export fails:**
- Check API key has correct permissions
- Verify collection IDs are correct
- Check rate limits (add delays between requests)

**Import fails:**
- Verify self-hosted Appwrite is accessible
- Check collection IDs match new project
- Ensure collections exist before importing
- Verify API key permissions

**Data missing:**
- Check export logs for errors
- Verify JSON files were created
- Check import logs for failed documents

**Storage files missing:**
- Verify files were downloaded
- Check file permissions
- Ensure storage bucket exists

---

### Alternative: Manual Copy-Paste Method

If scripts don't work, you can manually:

1. **Export each collection:**
   - Console → Database → Collection → Export → JSON
   - Copy JSON content

2. **Import via Console:**
   - Self-hosted Console → Database → Collection
   - Use "Import" feature or manually create documents

3. **Storage files:**
   - Download from cloud storage
   - Upload to self-hosted storage bucket

This is slower but more reliable for small datasets.

---

### Update App

1. Update endpoint in `lib/appwrite.js`
2. Update project ID
3. Update all collection IDs
4. Test thoroughly
5. Deploy new version

---

## ✅ Pre-Deployment Checklist

- [ ] Docker installed and working
- [ ] Appwrite running and accessible
- [ ] Admin account created
- [ ] Project created
- [ ] Database created
- [ ] All collections created
- [ ] Permissions configured
- [ ] Firewall configured
- [ ] Backups set up
- [ ] Auto-start configured
- [ ] App connects successfully
- [ ] Tested with multiple users

---

## 📚 Additional Resources

- [Appwrite Self-Hosting Docs](https://appwrite.io/docs/installation)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Reverse Proxy Guide](https://nginx.org/en/docs/)

---

## 🆘 Need Help?

**Common Issues:**
1. Check Docker logs: `docker compose logs`
2. Verify ports aren't in use
3. Check firewall settings
4. Review Appwrite documentation

**Performance Tips:**
- Use SSD for better performance
- Allocate more RAM if possible
- Close unnecessary applications
- Monitor resource usage

---

**Next Steps:** Once self-hosted backend is running, proceed with app deployment using `DEPLOYMENT_V1_GUIDE.md`


