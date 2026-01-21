# 部署指南

本项目可以部署到多个云平台,推荐使用以下方案:

---

## 方案一: Railway (推荐) ⭐

Railway 提供免费套餐,支持 Node.js + MySQL,部署简单。

### 步骤:

1. **注册 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 连接您的 GitHub 仓库

3. **添加 MySQL 数据库**
   - 在项目中点击 "New"
   - 选择 "Database" → "Add MySQL"
   - Railway 会自动创建数据库并设置 `DATABASE_URL`

4. **配置环境变量**
   - 在项目设置中添加环境变量
   - `NODE_ENV=production`
   - `DATABASE_URL` (自动生成)

5. **部署**
   - Railway 会自动检测并部署
   - 等待构建完成
   - 获取公开 URL

### 优点:
- ✓ 免费套餐充足
- ✓ 自动 HTTPS
- ✓ 内置 MySQL
- ✓ 自动部署
- ✓ 永久在线

---

## 方案二: Render

Render 也提供免费套餐,但数据库需要单独配置。

### 步骤:

1. **注册 Render 账号**
   - 访问 https://render.com
   - 使用 GitHub 账号登录

2. **创建 Web Service**
   - 点击 "New +"
   - 选择 "Web Service"
   - 连接 GitHub 仓库

3. **配置构建设置**
   - Build Command: `pnpm install && pnpm run build`
   - Start Command: `pnpm run start`
   - Environment: Node

4. **添加数据库**
   - 创建 PostgreSQL 数据库 (免费)
   - 或使用外部 MySQL (如 PlanetScale)

5. **配置环境变量**
   - 添加 `DATABASE_URL`
   - 添加 `NODE_ENV=production`

### 优点:
- ✓ 免费套餐
- ✓ 自动 HTTPS
- ✓ 自动部署

### 缺点:
- ✗ 免费套餐会休眠
- ✗ MySQL 需要外部服务

---

## 方案三: Vercel + PlanetScale

Vercel 适合前端,需要配合 Serverless 函数。

### 步骤:

1. **部署到 Vercel**
   ```bash
   npm i -g vercel
   cd /home/ubuntu
   vercel
   ```

2. **配置 PlanetScale 数据库**
   - 访问 https://planetscale.com
   - 创建免费 MySQL 数据库
   - 获取连接字符串

3. **设置环境变量**
   - 在 Vercel 项目设置中添加
   - `DATABASE_URL=mysql://...`

### 优点:
- ✓ 全球 CDN
- ✓ 自动 HTTPS
- ✓ 快速部署

### 缺点:
- ✗ 需要改造为 Serverless
- ✗ 数据库需要单独配置

---

## 方案四: 自托管 VPS

如果您有 VPS (如阿里云、腾讯云、AWS EC2),可以自行部署。

### 步骤:

1. **安装依赖**
   ```bash
   # 安装 Node.js 22
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 安装 pnpm
   npm install -g pnpm
   
   # 安装 MySQL
   sudo apt-get install -y mysql-server
   ```

2. **上传代码**
   ```bash
   scp stock_ranking_monitor_upgraded.tar.gz user@your-server:/home/user/
   ssh user@your-server
   tar -xzf stock_ranking_monitor_upgraded.tar.gz
   cd stock_ranking_monitor
   ```

3. **配置环境**
   ```bash
   cp .env.example .env
   nano .env  # 编辑数据库配置
   ```

4. **安装并构建**
   ```bash
   pnpm install
   pnpm run build
   ```

5. **使用 PM2 运行**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name stock-monitor
   pm2 save
   pm2 startup
   ```

6. **配置 Nginx 反向代理**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **配置 SSL (Let's Encrypt)**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 推荐配置

### 免费方案 (推荐新手)
- **平台**: Railway
- **数据库**: Railway MySQL (内置)
- **成本**: 免费
- **适合**: 个人项目、测试

### 生产方案 (推荐正式使用)
- **平台**: 自托管 VPS
- **数据库**: MySQL 8.0
- **成本**: $5-10/月
- **适合**: 正式项目、高流量

---

## 数据库迁移

部署后需要运行数据库迁移:

```bash
pnpm run db:push
```

这会创建所需的表结构。

---

## 环境变量说明

| 变量名 | 说明 | 必需 | 示例 |
|--------|------|------|------|
| `DATABASE_URL` | MySQL 连接字符串 | 是 | `mysql://user:pass@host:3306/db` |
| `NODE_ENV` | 运行环境 | 是 | `production` |
| `OAUTH_SERVER_URL` | OAuth 服务器地址 | 否 | 留空即可 |

---

## 健康检查

部署后访问以下端点检查状态:

- 首页: `https://your-domain.com/`
- API: `https://your-domain.com/api/trpc/system.health`

---

## 常见问题

### Q: 数据库连接失败?
A: 检查 `DATABASE_URL` 格式是否正确,确保数据库服务器可访问。

### Q: 构建失败?
A: 确保 Node.js 版本 >= 22,pnpm 版本 >= 10。

### Q: 页面无法访问?
A: 检查防火墙设置,确保端口 3000 (或配置的端口) 已开放。

### Q: 定时任务不运行?
A: 检查服务器时区设置,确保 cron 表达式正确。

---

## 性能优化建议

1. **启用 Gzip 压缩**
2. **配置 CDN** (如 Cloudflare)
3. **数据库索引优化**
4. **启用 Redis 缓存** (可选)
5. **配置日志轮转**

---

## 监控和维护

建议配置:
- **Uptime 监控**: UptimeRobot (免费)
- **日志管理**: PM2 logs
- **性能监控**: New Relic (免费套餐)

---

## 备份策略

1. **数据库备份**: 每日自动备份
2. **代码备份**: GitHub 仓库
3. **配置备份**: 环境变量文档

---

需要帮助?请参考:
- 项目文档: `README.md`
- 升级总结: `UPGRADE_SUMMARY.md`
- 快速启动: `QUICK_START.md`
