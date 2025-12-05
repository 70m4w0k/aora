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
   - Enter email and password
   - This is your admin account

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

**1. Port Forwarding (Router):**
- Forward ports 80, 443, 9500 to your computer
- Use your public IP or dynamic DNS

**2. Dynamic DNS (if IP changes):**
- Use services like DuckDNS, No-IP, or Cloudflare
- Point domain to your IP

**3. Reverse Proxy (Recommended):**
```bash
# Install Nginx
sudo apt install nginx -y

# Configure reverse proxy
sudo nano /etc/nginx/sites-available/appwrite

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/appwrite /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**4. SSL Certificate (Let's Encrypt):**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (already configured)
```

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

### Export Data (if needed)

1. **Export from Cloud Appwrite:**
   - Use Appwrite CLI or API
   - Export collections as JSON
   - Download storage files

2. **Import to Self-Hosted:**
   - Create same collections
   - Import JSON data
   - Upload files to storage

### Update App

1. Update endpoint in `lib/appwrite.js`
2. Update project ID
3. Test thoroughly
4. Deploy new version

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


