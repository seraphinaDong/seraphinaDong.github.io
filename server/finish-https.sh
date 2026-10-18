#!/bin/bash
# 证书已经签好。这一步只把它装进 nginx，并让 443 反代到本机留言服务。
set -euo pipefail

IP="103.218.241.251"
ACME="/root/.acme.sh/acme.sh"

sudo mkdir -p /etc/guestbook
sudo "$ACME" --force --install-cert -d "$IP" --ecc \
  --fullchain-file /etc/guestbook/fullchain.pem \
  --key-file /etc/guestbook/privkey.pem \
  --reloadcmd "systemctl reload nginx"

sudo tee /etc/nginx/sites-available/guestbook >/dev/null <<'EOF'
server {
    listen 80 default_server;
    server_name _;
    location ^~ /.well-known/acme-challenge/ {
        default_type text/plain;
        root /var/www/letsencrypt;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl default_server;
    server_name _;
    ssl_certificate     /etc/guestbook/fullchain.pem;
    ssl_certificate_key /etc/guestbook/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF

sudo ln -sfn /etc/nginx/sites-available/guestbook /etc/nginx/sites-enabled/guestbook
sudo nginx -t
sudo systemctl reload nginx

sudo sed -i 's/-b 0.0.0.0:5000/-b 127.0.0.1:5000/' /etc/systemd/system/guestbook.service
sudo systemctl daemon-reload
sudo systemctl restart guestbook

echo "本机 HTTPS："
curl -fsS --max-time 10 --resolve "${IP}:443:127.0.0.1" "https://${IP}/api/messages"
echo
