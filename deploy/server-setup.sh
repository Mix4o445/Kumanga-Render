#!/usr/bin/env bash
# One-time server setup for Ubuntu 22.04 on Oracle Cloud Free Tier.
# Run as a user with sudo:  bash server-setup.sh
set -euo pipefail

echo ">>> Updating system..."
sudo apt update && sudo apt -y upgrade

echo ">>> Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo ">>> Installing Nginx, git, and PM2..."
sudo apt install -y nginx git
sudo npm install -g pm2

echo ">>> Opening firewall for HTTP/HTTPS (Oracle's host firewall)..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT  || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
sudo netfilter-persistent save || sudo apt install -y iptables-persistent

echo ">>> Done. Next: clone your app into /var/www/manga and run deploy.sh"
