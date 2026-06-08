# 炸虾格斗会赛事管理网站

格斗游戏赛事报名、积分排名与赛事管理平台。赛事对阵在 [start.gg](https://www.start.gg) 进行，本站负责报名、名次录入/同步与积分排名。

## 功能

### 选手端

- 注册 / 登录、选手中心
- 浏览并报名开放中的赛事，查看本站报名名单
- 个人资料：昵称、邮箱（选填）、QQ（选填）、start.gg 昵称、start.gg 唯一代码
- 我的赛事、积分历史

### 管理员端

- 游戏库、赛事等级与积分表配置
- 赛事 CRUD、报名名单管理（含选手联系信息与 start.gg 资料）
- 从 start.gg 拉取赛事信息 / 选手 / 结果，支持多项目赛事选择
- 手动录入名次、虚拟账号积分转移

### 公开页面

- 首页、赛事详情、按游戏独立排行榜

## 技术栈

- Next.js 15 (App Router) + TypeScript
- Prisma + SQLite
- Tailwind CSS
- iron-session + bcrypt

## 本地开发

### 1. 克隆并安装依赖

```bash
git clone https://github.com/Butterfly0v0/zhaxia-tournament.git
cd zhaxia-tournament
npm install
```

### 2. 配置环境变量

复制示例文件并编辑：

```bash
cp .env.example .env
```

`.env` 说明：

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | SQLite 路径，开发环境可用 `file:./dev.db` |
| `SESSION_SECRET` | 是 | 至少 32 位随机字符串，用于加密 Session |
| `ENCRYPTION_KEY` | 生产必填 | 至少 32 位随机字符串，用于 AES 加密邮箱 / QQ / start.gg 唯一代码 |
| `STARTGG_API_TOKEN` | 否 | start.gg API Token，同步功能需要 |
| `NODE_ENV` | 否 | 开发环境为 `development`，生产环境为 `production` |

> **切勿将 `.env` 提交到 Git。** 仓库仅包含 `.env.example` 模板。

### 3. 初始化数据库

```bash
npx prisma migrate dev
npm run db:seed
npm run db:encrypt-fields   # 加密数据库中已有的敏感字段（首次启用加密时执行）
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 种子数据默认管理员

执行 `npm run db:seed` 后会创建默认管理员账号（仅用于首次部署）：

- 用户名：`admin`
- 密码：`admin123`

**上线后请立即修改密码**，或在用户管理中创建新管理员并停用默认账号。

## 报名流程说明

1. 选手在本站「赛事报名」页面报名
2. 管理员在后台「本站报名名单」查看选手信息（含 start.gg 昵称、唯一代码、邮箱、QQ）
3. 管理员根据上述信息，在 start.gg 后台手动添加参赛选手
4. 对阵与赛程以 start.gg 为准；本站负责积分结算与排名

## start.gg API 配置与同步

1. 登录 [start.gg](https://www.start.gg) → Account Settings → Developer Settings
2. 创建 API Token，填入 `.env` 的 `STARTGG_API_TOKEN`
3. 创建赛事时填写 start.gg 链接，点击「从链接拉取」预览信息
   - 支持锦标赛链接（`/tournament/xxx`）或项目链接（含 `/event/`）
   - 单项目：标题为锦标赛名
   - 多项目：用户选择项目后，标题为 `锦标赛名 - 项目名`
4. 勾选「保存时自动从 start.gg 同步」可在保存时拉取选手与结果（不会覆盖手动设置的状态与标题）
5. 管理后台可随时「一键同步 start.gg 数据」
6. 未匹配到本站账号的成绩记入虚拟账号，赛后可将积分转移到真实账号

## 生产环境部署（云服务器）

本项目使用 SQLite 文件数据库，**推荐部署到 Linux 云服务器（VPS）**，不适合 Vercel 等 Serverless 平台。

### 部署架构

```
选手浏览器 → HTTPS (443) → Nginx 反向代理 → Next.js (3000) → SQLite 文件
```

### 简要步骤

1. 购买云服务器（Ubuntu 22.04+），安全组放行 22 / 80 / 443
2. 安装 Node.js 20+、Nginx、Git
3. 克隆仓库到服务器，例如 `/var/www/zhaxia-tournament`
4. 创建生产环境 `.env`：

```env
DATABASE_URL="file:./prod.db"
SESSION_SECRET="你的强随机字符串至少32位"
ENCRYPTION_KEY="另一个强随机字符串至少32位"
STARTGG_API_TOKEN="你的start.gg Token"
NODE_ENV="production"
```

5. 构建并启动：

```bash
npm install
npx prisma migrate deploy
npm run db:seed          # 仅首次部署
npm run db:encrypt-fields # 加密已有敏感字段（升级启用加密时执行）
npm run build
npm install -g pm2
pm2 start npm --name zaxia -- start
pm2 save && pm2 startup
```

6. 配置 Nginx 反向代理到 `http://127.0.0.1:3000`
7. 用 Certbot 申请 HTTPS 证书（Let's Encrypt）
8. 将域名 A 记录解析到服务器公网 IP

> 生产环境必须使用 HTTPS，否则登录 Cookie（`secure` 模式）无法正常工作。

### 数据备份

SQLite 数据库为单个文件，定期备份即可：

```bash
cp prisma/prod.db /backup/prod-$(date +%Y%m%d).db
```

### 更新部署

> **重要**：`npm run build` 必须在服务器上执行，且执行时项目目录下已有 `.env` 文件。`.env` 不要提交到 Git，更新代码不会覆盖服务器上的 `.env`。

**方式一：一键脚本（推荐）**

SSH 登录服务器后，进入项目目录执行：

```bash
cd /var/www/zhaxia-tournament   # 改成你实际的项目路径
bash scripts/update-server.sh
```

**方式二：手动逐步执行**

```bash
cd /var/www/zhaxia-tournament   # 改成你实际的项目路径
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart zaxia
```

**如何 SSH 登录服务器（不熟悉 Linux 可参考）**

1. Windows：打开「终端」或 PowerShell，输入：
   ```bash
   ssh root@你的服务器公网IP
   ```
   （若创建实例时用的是 `ubuntu` 用户，则把 `root` 换成 `ubuntu`）
2. 首次连接会提示确认指纹，输入 `yes` 回车
3. 输入购买/创建实例时设置的密码（输入时屏幕不显示字符，属正常）
4. 看到命令行提示符后即可执行上面的更新命令

**更新后验证**

1. 浏览器访问网站（建议用 HTTPS 或 IP）
2. 登录管理员账号
3. 点击「游戏管理」「赛事管理」等子页面，应能正常进入，不再跳回登录页

**若仍跳回登录页，请检查**

| 检查项 | 命令 / 说明 |
|--------|-------------|
| `.env` 是否存在 | `ls -la .env` |
| `SESSION_SECRET` 是否设置 | `grep SESSION_SECRET .env`（至少 32 位随机字符） |
| 应用是否在运行 | `pm2 status`（`zaxia` 状态应为 `online`） |
| 是否用了 HTTPS | 生产环境 `NODE_ENV=production` 时 Cookie 需要 HTTPS；仅用 HTTP 访问 IP 可能导致登录异常 |
| 查看错误日志 | `pm2 logs zaxia --lines 50` |

## 常用命令

```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务（需先 build）
npm run db:migrate   # 开发环境数据库迁移
npm run db:seed           # 写入种子数据
npm run db:encrypt-fields      # 加密邮箱 / QQ / 唯一代码等敏感字段
npm run db:rotate-encryption-key # 将敏感字段从旧密钥重加密到新密钥
npm run db:studio              # Prisma Studio 数据库管理
```

## 安全与隐私

### 敏感字段加密

邮箱、QQ 号、start.gg 唯一代码在数据库中以 **AES-256-GCM** 加密存储（密文前缀 `enc:v1:`）。应用读取时自动解密，管理员后台与导出 CSV 仍显示明文。

- 生产环境必须配置 `ENCRYPTION_KEY`，且与 `SESSION_SECRET` 使用不同值
- 生成示例：`openssl rand -base64 32`
- **切勿丢失 `ENCRYPTION_KEY`**，否则已加密数据无法恢复
- 从旧版本升级时，配置密钥后执行 `npm run db:encrypt-fields` 加密历史明文数据

### 轮换加密密钥

如需更换 `ENCRYPTION_KEY`，**不要**只修改 `.env`，必须先解密再重加密。

**操作前：**

1. 备份数据库：`cp prisma/prod.db prisma/prod.db.backup`
2. 停止应用（避免轮换期间有人修改资料）：`pm2 stop zhaxia`
3. 生成新密钥：`openssl rand -base64 32`

**执行轮换（Linux / macOS）：**

```bash
ENCRYPTION_KEY_OLD="旧密钥" ENCRYPTION_KEY="新密钥" npm run db:rotate-encryption-key
```

**Windows PowerShell：**

```powershell
$env:ENCRYPTION_KEY_OLD="旧密钥"
$env:ENCRYPTION_KEY="新密钥"
npm run db:rotate-encryption-key
```

**轮换后：**

1. 将 `.env` 中的 `ENCRYPTION_KEY` 更新为新密钥（删除临时的 `ENCRYPTION_KEY_OLD`）
2. 重启应用：`pm2 start zhaxia`
3. 验证选手个人资料、管理后台报名名单、导出 CSV 显示正常
4. 确认无误后再删除旧密钥备份

若轮换脚本报错，用备份数据库回滚，并用**旧密钥**恢复 `.env` 后重启。

### 不应提交到 Git 的内容

以下内容**不应提交到 Git**（已在 `.gitignore` 中排除）：

- `.env` 及所有环境变量文件
- `prisma/*.db` 数据库文件（含用户、报名、积分等数据）
- `node_modules/`、`.next/` 构建产物

## 许可证

本项目为炸虾格斗会社区内部使用，部署前请根据实际需要选择合适的开源许可证。
