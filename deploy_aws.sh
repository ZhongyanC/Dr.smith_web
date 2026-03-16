#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="/home/zyc-pc/drsmith-website"
DOMAIN="scottmcbridesmith.com"
EMAIL="zycao@ku.edu"
START_PORT=8000
END_PORT=9000

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir)
      PROJECT_DIR="$2"
      shift 2
      ;;
    --domain)
      DOMAIN="$2"
      shift 2
      ;;
    --email)
      EMAIL="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ "$EUID" -ne 0 ]]; then
  echo "Please run as root, e.g. sudo ./deploy_aws.sh"
  exit 1
fi

echo "Using PROJECT_DIR=${PROJECT_DIR}, DOMAIN=${DOMAIN}, EMAIL=${EMAIL}"

apt-get update
apt-get install -y curl git ufw nginx certbot python3-certbot-nginx docker.io docker-compose-plugin

systemctl enable --now docker

mkdir -p "${PROJECT_DIR}"

cd "${PROJECT_DIR}"

if [[ ! -f docker-compose.yml ]]; then
  echo "docker-compose.yml not found in ${PROJECT_DIR}"
  exit 1
fi

# 检查 backend .env，不存在则从 example 创建并提示
BACKEND_ENV="${PROJECT_DIR}/drsmith-backend/.env"
if [[ ! -f "${BACKEND_ENV}" ]]; then
  if [[ -f "${PROJECT_DIR}/drsmith-backend/.env.example" ]]; then
    cp "${PROJECT_DIR}/drsmith-backend/.env.example" "${BACKEND_ENV}"
    echo "已从 .env.example 创建 drsmith-backend/.env，请编辑后重新运行部署"
    echo "  nano ${BACKEND_ENV}"
    exit 1
  else
    echo "错误: drsmith-backend/.env 不存在，请创建并填入 TURNSTILE_SITE_KEY、TURNSTILE_SECRET_KEY"
    exit 1
  fi
fi

# 从 backend .env 导出 VITE_TURNSTILE_SITE_KEY 供 frontend 构建使用
set -a
source "${BACKEND_ENV}" 2>/dev/null || true
# 若 .env 无 VITE_ 则用 TURNSTILE_SITE_KEY
export VITE_TURNSTILE_SITE_KEY="${VITE_TURNSTILE_SITE_KEY:-$TURNSTILE_SITE_KEY}"
set +a

BACKEND_PORT=$(/bin/bash "${PROJECT_DIR}/scripts/choose_port.sh" "${START_PORT}" "${END_PORT}")
echo "Selected backend host port: ${BACKEND_PORT}"

sed -i "s/BACKEND_HOST_PORT/${BACKEND_PORT}/g" "${PROJECT_DIR}/docker-compose.yml"

NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
NGINX_TEMPLATE="${PROJECT_DIR}/nginx_site_template.conf"

mkdir -p /var/www/certbot

cp "${NGINX_TEMPLATE}" "${NGINX_CONF}"
sed -i "s/scottmcbridesmith.com/${DOMAIN}/g" "${NGINX_CONF}"
sed -i "s/BACKEND_HOST_PORT_PLACEHOLDER/${BACKEND_PORT}/g" "${NGINX_CONF}"

ln -sf "${NGINX_CONF}" "/etc/nginx/sites-enabled/${DOMAIN}"
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl reload nginx

cd "${PROJECT_DIR}"
docker compose build
docker compose up -d

certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect || true

echo "Deployment finished. Please check https://${DOMAIN}"

