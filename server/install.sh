#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"
ROOT="$(pwd)"
RUN_USER="$(id -un)"

if ! python3 -c "import ensurepip" >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y python3-venv
fi

rm -rf .venv
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

sudo tee /etc/systemd/system/guestbook.service >/dev/null <<EOF
[Unit]
Description=鱼姫留言板
After=network.target

[Service]
User=$RUN_USER
Group=$RUN_USER
WorkingDirectory=$ROOT
ExecStart=$ROOT/.venv/bin/gunicorn -w 1 -b 127.0.0.1:5000 app:app
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable guestbook
sudo systemctl restart guestbook

sleep 1
curl -sS -m 3 http://127.0.0.1:5000/api/messages
echo
