#!/bin/bash
# 在云服务器上更新网站：拉取代码 → 安装依赖 → 迁移数据库 → 构建 → 重启
set -e

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "错误：找不到 .env 文件。请先在项目目录创建 .env（含 SESSION_SECRET 等）。"
  exit 1
fi

echo ">>> 拉取最新代码..."
git pull

echo ">>> 安装依赖..."
npm install

echo ">>> 数据库迁移..."
npx prisma migrate deploy

echo ">>> 构建（需要 .env 中的 SESSION_SECRET）..."
npm run build

echo ">>> 重启应用..."
pm2 restart zaxia

echo ">>> 更新完成！请在浏览器刷新页面测试。"
