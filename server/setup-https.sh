#!/bin/bash
# 给留言板的公网 IP 申请 Let's Encrypt 证书，并用 nginx 在 443 反代到本机 5000。
# IP 证书只有大约 6 天有效，acme.sh 会每 3 天检查并续期。
# 跑之前，防火墙里要已经放行 TCP 80 和 TCP 443。
set -euo pipefail

IP="103.218.241.251"
ACME_EMAIL="1035843147@qq.com"
WEBROOT="/var/www/letsencrypt"
ACME="/root/.acme.sh/acme.sh"

echo "需要防火墙放行 TCP 80 和 TCP 443。没有放行的话，下面申请证书会失败。"

sudo DEBIAN_FRONTEND=noninteractive apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nginx curl openssl cron socat ca-certificates

sudo mkdir -p "$WEBROOT" /etc/guestbook
sudo chmod 755 "$WEBROOT"

write_http() {
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
EOF
}

write_https() {
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
}

write_http
sudo ln -sfn /etc/nginx/sites-available/guestbook /etc/nginx/sites-enabled/guestbook
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

if [ ! -x "$ACME" ]; then
  curl -fsSL https://get.acme.sh | sudo sh -s email="$ACME_EMAIL"
fi

if [ ! -s /etc/guestbook/fullchain.pem ] && [ ! -s "/root/.acme.sh/${IP}_ecc/fullchain.cer" ]; then
  sudo "$ACME" --force --issue --server letsencrypt -d "$IP" \
    -w "$WEBROOT" \
    --cert-profile shortlived \
    --days 3 \
    --keylength ec-256
fi

sudo "$ACME" --force --install-cert -d "$IP" --ecc \
  --fullchain-file /etc/guestbook/fullchain.pem \
  --key-file /etc/guestbook/privkey.pem \
  --reloadcmd "systemctl reload nginx"

write_https
sudo nginx -t
sudo systemctl reload nginx

sudo sed -i 's/-b 0.0.0.0:5000/-b 127.0.0.1:5000/' /etc/systemd/system/guestbook.service
sudo systemctl daemon-reload
sudo systemctl restart guestbook

echo "证书："
sudo openssl x509 -in /etc/guestbook/fullchain.pem -noout -dates -ext subjectAltName
echo "本机 HTTPS："
curl -fsS --max-time 10 --resolve "${IP}:443:127.0.0.1" "https://${IP}/api/messages"
echo
