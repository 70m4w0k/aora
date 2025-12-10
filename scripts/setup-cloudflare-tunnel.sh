#!/bin/bash

# Cloudflare Tunnel Setup Script for Tipi Appwrite
# This script sets up Cloudflare Tunnel on your self-hosted computer
# to expose Appwrite to the internet without port forwarding

set -e

echo "🌐 Cloudflare Tunnel Setup for Tipi Appwrite"
echo "=============================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "❌ Please do not run this script as root"
   exit 1
fi

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

echo "📋 Detected OS: $OS"
echo ""

# Step 1: Install cloudflared
echo "Step 1: Installing cloudflared..."
if command -v cloudflared &> /dev/null; then
    echo "✅ cloudflared is already installed"
    cloudflared --version
else
    if [ "$OS" == "linux" ]; then
        # Linux installation
        echo "Installing cloudflared for Linux..."
        cd /tmp
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb || sudo apt-get install -f -y
        rm cloudflared-linux-amd64.deb
    elif [ "$OS" == "macos" ]; then
        # macOS installation
        echo "Installing cloudflared for macOS..."
        if command -v brew &> /dev/null; then
            brew install cloudflared
        else
            echo "❌ Homebrew not found. Please install Homebrew first or install cloudflared manually."
            exit 1
        fi
    fi
    echo "✅ cloudflared installed successfully"
fi

echo ""
echo "Step 2: Login to Cloudflare..."
echo "This will open your browser to authenticate with Cloudflare."
echo "Press Enter to continue..."
read

cloudflared tunnel login

echo ""
echo "Step 3: Creating tunnel..."
echo "Enter a name for your tunnel (e.g., 'tipi-appwrite'):"
read TUNNEL_NAME

if [ -z "$TUNNEL_NAME" ]; then
    TUNNEL_NAME="tipi-appwrite"
fi

cloudflared tunnel create "$TUNNEL_NAME"

echo ""
echo "Step 4: Configuring tunnel..."
TUNNEL_DIR="$HOME/.cloudflared"
mkdir -p "$TUNNEL_DIR"

# Get tunnel UUID
TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')

if [ -z "$TUNNEL_ID" ]; then
    echo "❌ Failed to get tunnel ID. Please check tunnel name."
    exit 1
fi

echo "Tunnel ID: $TUNNEL_ID"

# Create config file
CONFIG_FILE="$TUNNEL_DIR/config.yml"
cat > "$CONFIG_FILE" << EOF
tunnel: $TUNNEL_ID
credentials-file: $TUNNEL_DIR/$TUNNEL_ID.json

ingress:
  - hostname: appwrite.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
EOF

echo ""
echo "⚠️  IMPORTANT: Update the config file with your actual domain:"
echo "   File: $CONFIG_FILE"
echo "   Replace 'appwrite.yourdomain.com' with your actual domain"
echo ""

echo "Step 5: Setting up DNS route..."
echo "Do you want to use a custom domain or Cloudflare's free domain?"
echo "1) Custom domain (requires DNS management)"
echo "2) Free Cloudflare domain (*.trycloudflare.com)"
read -p "Choice [1/2]: " DNS_CHOICE

if [ "$DNS_CHOICE" == "1" ]; then
    echo "Enter your domain (e.g., appwrite.yourdomain.com):"
    read DOMAIN
    cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN"
    echo "✅ DNS route created for $DOMAIN"
elif [ "$DNS_CHOICE" == "2" ]; then
    echo "Starting tunnel to get free domain..."
    echo "Run this command to start the tunnel and get your free domain:"
    echo "  cloudflared tunnel run $TUNNEL_NAME"
    echo ""
    echo "The output will show a URL like: https://xxxxx.trycloudflare.com"
    echo "Use this URL as your Appwrite endpoint"
else
    echo "Invalid choice. You can set up DNS later."
fi

echo ""
echo "Step 6: Creating system service..."
if [ "$OS" == "linux" ]; then
    # Create systemd service
    sudo tee /etc/systemd/system/cloudflared.service > /dev/null << EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=/usr/local/bin/cloudflared tunnel run $TUNNEL_NAME
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable cloudflared
    echo "✅ Systemd service created"
    echo ""
    echo "To start the tunnel: sudo systemctl start cloudflared"
    echo "To check status: sudo systemctl status cloudflared"
    echo "To view logs: sudo journalctl -u cloudflared -f"

elif [ "$OS" == "macos" ]; then
    # Create launchd plist
    PLIST_FILE="$HOME/Library/LaunchAgents/com.cloudflare.cloudflared.$TUNNEL_NAME.plist"
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.cloudflared.$TUNNEL_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
        <string>$TUNNEL_NAME</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/.cloudflared/tunnel.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.cloudflared/tunnel.error.log</string>
</dict>
</plist>
EOF

    launchctl load "$PLIST_FILE"
    echo "✅ LaunchAgent created"
    echo ""
    echo "To start the tunnel: launchctl load $PLIST_FILE"
    echo "To stop the tunnel: launchctl unload $PLIST_FILE"
    echo "To check status: launchctl list | grep cloudflared"
fi

echo ""
echo "✅ Cloudflare Tunnel setup complete!"
echo ""
echo "Next steps:"
echo "1. Update $CONFIG_FILE with your domain"
echo "2. Start the tunnel service"
echo "3. Test access: curl https://your-domain.com/v1/health"
echo "4. Update Appwrite configuration (see SELF_HOST_DEPLOYMENT.md)"
echo "5. Update Tipi app .env file with the tunnel endpoint"



