#!/bin/bash
# Répondly Privacy Policy Deployment Script
# Run as root or with sudo on your VPS

set -e

DOMAIN="repondly.com"
PRIVACY_DIR="/var/www/repondly-privacy"
NGINX_CONF="/etc/nginx/sites-available/repondly-privacy"
NGINX_ENABLED="/etc/nginx/sites-enabled/repondly-privacy"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "▸ Creating directory $PRIVACY_DIR..."
mkdir -p "$PRIVACY_DIR"

echo "▸ Copying index.html..."
cp "$SCRIPT_DIR/index.html" "$PRIVACY_DIR/index.html"
chmod 644 "$PRIVACY_DIR/index.html"
chown -R www-data:www-data "$PRIVACY_DIR"

echo "▸ Writing Nginx config..."
cat > "$NGINX_CONF" <<EOF
# Répondly Privacy Policy
# Serves at: https://privacy.$DOMAIN

server {
    listen 80;
    listen [::]:80;
    server_name privacy.$DOMAIN;

    root $PRIVACY_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
    }

    # Optional: redirect /privacy path on main domain
    # Uncomment if you prefer repondly.com/privacy instead of subdomain
    # location /privacy {
    #     alias $PRIVACY_DIR;
    #     try_files \$uri \$uri/ =404;
    # }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
EOF

echo "▸ Enabling site..."
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

echo "▸ Testing Nginx config..."
nginx -t

echo "▸ Reloading Nginx..."
systemctl reload nginx

echo ""
echo "✓ Done. Privacy policy is live at: http://privacy.$DOMAIN"
echo ""
echo "  Next step — enable HTTPS with Certbot:"
echo "  certbot --nginx -d privacy.$DOMAIN"
