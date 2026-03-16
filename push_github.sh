#!/usr/bin/env bash

set -e

# ========= 配置区域（按需修改） =========
REMOTE_URL="https://github.com/ZhongyanC/Dr.smith_web"
BRANCH_NAME="main"                     # 如果你习惯 master，可以改成 master
DEFAULT_COMMIT_MSG="chore: initial commit"
# ===================================

# 切到脚本所在目录（通常是项目根目录）
cd "$(dirname "$0")"
echo "当前目录：$(pwd)"

# 如果还不是 git 仓库，就初始化
if [ ! -d ".git" ]; then
  echo "未检测到 .git 目录，正在初始化 git 仓库..."
  git init
  # 尝试把默认分支名改成配置的分支名（旧版 git 可能不支持，失败也没关系）
  git branch -m "$BRANCH_NAME" || true
fi

# 配置远程 origin（如果已存在则更新）
if git remote get-url origin >/dev/null 2>&1; then
  echo "已存在远程 origin，更新为：$REMOTE_URL"
  git remote set-url origin "$REMOTE_URL"
else
  echo "设置远程 origin：$REMOTE_URL"
  git remote add origin "$REMOTE_URL"
fi

# 添加所有文件（会受 .gitignore 影响）
echo "添加所有文件到暂存区..."
git add .

# 提交信息（支持传入自定义 commit 信息）
COMMIT_MSG="${1:-$DEFAULT_COMMIT_MSG}"

# 如果没有可提交的变更就跳过 commit
if git diff --cached --quiet; then
  echo "没有新的变更需要提交，跳过 git commit。"
else
  echo "正在提交，提交信息：$COMMIT_MSG"
  git commit -m "$COMMIT_MSG"
fi

# 推送到远程
echo "推送到远程分支 origin/$BRANCH_NAME..."
git push -u origin "$BRANCH_NAME"

echo "推送完成！"

