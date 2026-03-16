#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
BACKEND_ENV="${BACKEND_ENV:-${PROJECT_DIR}/drsmith-backend/.env}"

cd "${PROJECT_DIR}"

if [[ ! -f "${BACKEND_ENV}" ]]; then
  echo "错误: 未找到后端 env 文件: ${BACKEND_ENV}"
  echo "请先创建它，例如：cp drsmith-backend/.env.example drsmith-backend/.env"
  exit 1
fi

# 从 backend .env 导出前端构建需要的 VITE_* 变量
set -a
source "${BACKEND_ENV}" 2>/dev/null || true
export VITE_TURNSTILE_SITE_KEY="${VITE_TURNSTILE_SITE_KEY:-${TURNSTILE_SITE_KEY:-}}"
set +a

if command -v docker-compose &>/dev/null && docker-compose version &>/dev/null; then
  docker-compose build frontend
  docker-compose up -d --force-recreate frontend
elif docker compose version &>/dev/null; then
  docker compose build frontend
  docker compose up -d --force-recreate frontend
else
  echo "错误: 未找到 docker-compose 或 docker compose"
  exit 1
fi

echo "前端已重建并重启完成。"

