#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="/home/ec2-user/Dr.smith_web"
DOMAIN="scottmcbridesmith.com"
EMAIL="zycao@ku.edu"
START_PORT=8000
END_PORT=9000

UPDATE_NGINX_ONLY=false

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
    --update-nginx-only)
      UPDATE_NGINX_ONLY=true
      shift
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
[[ "$UPDATE_NGINX_ONLY" == "true" ]] && echo "模式: 仅更新 nginx 配置"

# 仅更新 nginx 时跳过安装和构建
if [[ "$UPDATE_NGINX_ONLY" != "true" ]]; then
# 根据系统选择包管理器（Amazon Linux 用 yum/dnf，Ubuntu 用 apt）
if command -v apt-get &>/dev/null; then
  apt-get update
  apt-get install -y curl git nginx certbot python3-certbot-nginx docker.io docker-compose-plugin
elif command -v dnf &>/dev/null; then
  dnf update -y
  dnf install -y --allowerasing curl git nginx docker
  dnf install -y --allowerasing certbot python3-certbot-nginx 2>/dev/null || true
  if ! command -v certbot &>/dev/null; then
    pip3 install certbot certbot-nginx 2>/dev/null || pip3 install --user certbot certbot-nginx 2>/dev/null || true
  fi
  if ! docker compose version &>/dev/null 2>&1; then
    DCC="docker-compose-$(uname -s)-$(uname -m)"
    curl -sL "https://github.com/docker/compose/releases/latest/download/${DCC}" -o /tmp/docker-compose
    mv /tmp/docker-compose /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
  fi
elif command -v yum &>/dev/null; then
  yum update -y
  yum install -y curl git nginx
  amazon-linux-extras install docker -y 2>/dev/null || yum install -y docker 2>/dev/null || true
  yum install -y certbot python3-certbot-nginx 2>/dev/null || true
  if ! command -v certbot &>/dev/null; then
    pip3 install certbot certbot-nginx 2>/dev/null || true
  fi
  if ! docker compose version &>/dev/null 2>&1; then
    DCC="docker-compose-$(uname -s)-$(uname -m)"
    curl -sL "https://github.com/docker/compose/releases/latest/download/${DCC}" -o /tmp/docker-compose
    mv /tmp/docker-compose /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
  fi
else
  echo "错误: 未检测到 apt-get、dnf 或 yum，请手动安装 docker、nginx、certbot"
  exit 1
fi

systemctl enable --now docker

# 安装 buildx（docker compose build 需要 0.17.0+）
BUILDX_VER="v0.18.0"
ARCH=$(uname -m); [[ "$ARCH" == "x86_64" ]] && ARCH="amd64"; [[ "$ARCH" == "aarch64" ]] && ARCH="arm64"
BUILDX_URL="https://github.com/docker/buildx/releases/download/${BUILDX_VER}/buildx-${BUILDX_VER}.linux-${ARCH}"
for PLUGIN_DIR in /usr/lib/docker/cli-plugins /usr/local/lib/docker/cli-plugins; do
  mkdir -p "$PLUGIN_DIR" 2>/dev/null
  if curl -sLf "${BUILDX_URL}" -o "${PLUGIN_DIR}/docker-buildx" 2>/dev/null; then
    chmod +x "${PLUGIN_DIR}/docker-buildx"
    echo "已安装 buildx 到 ${PLUGIN_DIR}"
    break
  fi
done

fi

mkdir -p "${PROJECT_DIR}"

cd "${PROJECT_DIR}"

if [[ ! -f docker-compose.yml ]]; then
  echo "docker-compose.yml not found in ${PROJECT_DIR}"
  exit 1
fi

# 仅更新 nginx 时跳过 env 检查
if [[ "$UPDATE_NGINX_ONLY" != "true" ]]; then
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
fi

# 获取 backend 端口（用于 nginx 配置）
if [[ "$UPDATE_NGINX_ONLY" == "true" ]]; then
  BACKEND_PORT=$(grep -E '"[0-9]+:8000"' "${PROJECT_DIR}/docker-compose.yml" 2>/dev/null | grep -oE '[0-9]+' | head -1)
  [[ -z "$BACKEND_PORT" || "$BACKEND_PORT" == "0" ]] && BACKEND_PORT="8000"
else
  BACKEND_PORT=$(/bin/bash "${PROJECT_DIR}/scripts/choose_port.sh" "${START_PORT}" "${END_PORT}")
  sed -i "s/BACKEND_HOST_PORT/${BACKEND_PORT}/g" "${PROJECT_DIR}/docker-compose.yml"
fi
echo "Backend port: ${BACKEND_PORT}"

NGINX_TEMPLATE="${PROJECT_DIR}/nginx_site_template.conf"

# Amazon Linux 用 conf.d，Ubuntu 用 sites-available
if [[ -d /etc/nginx/conf.d ]]; then
  NGINX_CONF="/etc/nginx/conf.d/${DOMAIN}.conf"
else
  mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
  NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
fi

mkdir -p /var/www/certbot

cp "${NGINX_TEMPLATE}" "${NGINX_CONF}"
sed -i "s/scottmcbridesmith.com/${DOMAIN}/g" "${NGINX_CONF}"
sed -i "s/BACKEND_HOST_PORT_PLACEHOLDER/${BACKEND_PORT}/g" "${NGINX_CONF}"

# 仅 Ubuntu 风格需要 symlink
if [[ -d /etc/nginx/sites-enabled ]]; then
  ln -sf "${NGINX_CONF}" "/etc/nginx/sites-enabled/${DOMAIN}"
  [[ -f /etc/nginx/sites-enabled/default ]] && rm -f /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl enable nginx 2>/dev/null || true
systemctl is-active --quiet nginx && systemctl reload nginx || systemctl start nginx

if [[ "$UPDATE_NGINX_ONLY" == "true" ]]; then
  echo "Nginx 配置已更新并重载"
  exit 0
fi

cd "${PROJECT_DIR}"
# 优先使用 docker-compose（EC2 等环境常用），其次 docker compose 插件
if command -v docker-compose &>/dev/null && docker-compose version &>/dev/null; then
  docker-compose build
  docker-compose up -d
  # 运行数据库迁移，保证 auth_user 等表存在
  docker-compose exec backend python manage.py migrate --noinput || docker-compose run --rm backend python manage.py migrate --noinput
elif docker compose version &>/dev/null; then
  docker compose build
  docker compose up -d
  docker compose exec backend python manage.py migrate --noinput || docker compose run --rm backend python manage.py migrate --noinput
else
  echo "错误: 未找到 docker-compose 或 docker compose"
  exit 1
fi

certbot --nginx \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --expand \
  --non-interactive --agree-tos -m "${EMAIL}" --redirect 2>/dev/null || true

echo "Deployment finished. Please check https://${DOMAIN}"

