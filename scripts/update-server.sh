#!/bin/bash
# 在云服务器上更新网站：拉取代码 → 安装依赖 → 迁移数据库 → 构建 → 重启
set -e

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "错误：找不到 .env 文件。请先在项目目录创建 .env（含 SESSION_SECRET 等）。"
  exit 1
fi

if ! grep -q '^SERVER_ACTION_ALLOWED_ORIGINS=.' .env; then
  echo "警告：未设置 SERVER_ACTION_ALLOWED_ORIGINS，管理后台表单提交可能失败。"
  echo "请在 .env 添加：SERVER_ACTION_ALLOWED_ORIGINS=\"你的公网IP或域名\""
fi

echo ">>> 拉取最新代码..."
# 部分服务器访问 GitHub 时 HTTP/2 不稳定，改用 HTTP/1.1 避免 curl 16 报错
git -c http.version=HTTP/1.1 pull

echo ">>> 安装依赖..."
npm install

echo ">>> 数据库迁移..."
npx prisma migrate deploy

echo ">>> 构建（需要 .env 中的 SESSION_SECRET）..."
npm run build

echo ">>> 重启应用..."
if pm2 describe zhaxia >/dev/null 2>&1; then
  pm2 restart zhaxia
elif pm2 describe zaxia >/dev/null 2>&1; then
  echo ">>> 检测到旧进程名 zaxia，正在迁移为 zhaxia..."
  pm2 delete zaxia
  pm2 start npm --name zhaxia -- start
  pm2 save
else
  pm2 start npm --name zhaxia -- start
  pm2 save
fi

echo ">>> 更新完成！请在浏览器刷新页面测试。"
