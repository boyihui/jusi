# Railway 部署指南 (推荐)

Railway 是最简单的部署方案,提供免费套餐,内置 MySQL 数据库,自动 HTTPS。

---

## 🚀 快速部署步骤

### 1. 准备 GitHub 仓库

首先需要将代码上传到 GitHub:

```bash
# 在本地解压项目
tar -xzf deploy_package.tar.gz
cd stock_ranking_monitor

# 初始化 git 仓库
git init
git add .
git commit -m "Initial commit: Stock Ranking Monitor"

# 创建 GitHub 仓库并推送
# 方法1: 使用 GitHub 网页创建仓库,然后:
git remote add origin https://github.com/YOUR_USERNAME/stock-ranking-monitor.git
git branch -M main
git push -u origin main

# 方法2: 使用 GitHub CLI (如果已安装)
gh repo create stock-ranking-monitor --public --source=. --push
```

### 2. 注册 Railway 账号

1. 访问 https://railway.app
2. 点击 "Login" 或 "Start a New Project"
3. 使用 GitHub 账号登录
4. 授权 Railway 访问您的 GitHub 仓库

### 3. 创建新项目

1. 登录后点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 在列表中找到 `stock-ranking-monitor` 仓库
4. 点击仓库名称开始部署

### 4. 添加 MySQL 数据库

1. 在项目页面点击 "+ New"
2. 选择 "Database"
3. 选择 "Add MySQL"
4. Railway 会自动创建数据库并生成连接信息

### 5. 配置环境变量

Railway 会自动设置 `DATABASE_URL`,但您需要确认:

1. 点击项目中的 Web Service
2. 进入 "Variables" 标签
3. 确认以下变量存在:
   - `DATABASE_URL` (自动生成)
   - `NODE_ENV=production` (手动添加)

如果 `NODE_ENV` 不存在,点击 "New Variable" 添加:
- Variable: `NODE_ENV`
- Value: `production`

### 6. 等待部署完成

1. Railway 会自动检测项目类型
2. 运行构建命令: `pnpm install && pnpm run build`
3. 运行启动命令: `pnpm run start`
4. 等待 3-5 分钟完成部署

### 7. 获取公开 URL

1. 部署成功后,点击 "Settings" 标签
2. 找到 "Domains" 部分
3. 点击 "Generate Domain"
4. Railway 会生成一个 `.up.railway.app` 域名
5. 复制此域名即可访问您的网站

---

## 🎯 部署后配置

### 初始化数据库

部署成功后,需要初始化数据库表结构:

1. 在 Railway 项目页面,点击 Web Service
2. 进入 "Deployments" 标签
3. 点击最新的部署
4. 点击 "View Logs"
5. 确认没有数据库错误

如果需要手动运行迁移:
1. 在本地连接到 Railway 数据库
2. 运行: `pnpm run db:push`

### 绑定自定义域名 (可选)

如果您有自己的域名:

1. 在 Railway 项目的 "Settings" → "Domains"
2. 点击 "Custom Domain"
3. 输入您的域名 (如 `stock.yourdomain.com`)
4. 按照提示在域名提供商处添加 CNAME 记录:
   - Type: `CNAME`
   - Name: `stock` (或您的子域名)
   - Value: Railway 提供的目标地址
5. 等待 DNS 生效 (通常 5-30 分钟)

---

## 📊 Railway 免费套餐限额

Railway 提供非常慷慨的免费套餐:

- **计算时间**: 每月 500 小时 (约 20 天)
- **内存**: 512 MB RAM
- **存储**: 1 GB
- **数据库**: MySQL 免费
- **带宽**: 100 GB/月
- **自动 HTTPS**: 包含
- **自定义域名**: 支持

对于个人项目和中小流量网站完全够用!

---

## 🔧 常见问题

### Q: 部署失败,提示构建错误?
**A**: 检查以下几点:
1. 确保 `package.json` 中的构建脚本正确
2. 查看构建日志,找到具体错误信息
3. 确认 Node.js 版本兼容 (Railway 默认使用最新 LTS)

### Q: 网站可以访问,但显示数据库连接错误?
**A**: 
1. 确认 MySQL 数据库已添加到项目
2. 检查 `DATABASE_URL` 环境变量是否正确
3. 在 Variables 标签中查看数据库连接字符串
4. 确保数据库和 Web Service 在同一个项目中

### Q: 如何查看应用日志?
**A**:
1. 点击 Web Service
2. 进入 "Deployments" 标签
3. 点击最新的部署
4. 点击 "View Logs"
5. 实时查看应用输出

### Q: 如何重新部署?
**A**: 
方法1: 推送新代码到 GitHub,Railway 会自动重新部署
方法2: 在 Railway 控制台点击 "Deploy" → "Redeploy"

### Q: 数据会丢失吗?
**A**: 
- 数据库数据会持久化保存
- 应用重启不会影响数据库
- 建议定期备份数据库

### Q: 如何备份数据库?
**A**:
1. 在 Railway 项目中点击 MySQL 数据库
2. 进入 "Data" 标签查看数据
3. 或使用 MySQL 客户端连接并导出:
   ```bash
   mysqldump -h [HOST] -u [USER] -p[PASSWORD] [DATABASE] > backup.sql
   ```

### Q: 超出免费额度怎么办?
**A**:
- Railway 会发送邮件通知
- 可以升级到付费计划 (从 $5/月起)
- 或优化应用减少资源使用

---

## 🎨 自动部署

配置好后,每次推送代码到 GitHub,Railway 会自动:
1. 检测到新提交
2. 拉取最新代码
3. 运行构建
4. 部署新版本
5. 自动切换流量

整个过程约 3-5 分钟,无需手动操作!

---

## 📈 监控和维护

### 查看应用状态
- 在 Railway 控制台实时查看 CPU、内存使用情况
- 查看请求数量和响应时间
- 监控数据库连接数

### 设置通知
1. 进入项目 "Settings"
2. 配置 Webhook 或邮件通知
3. 在部署失败时收到提醒

### 性能优化
- 启用 Railway 的 CDN (自动)
- 优化数据库查询
- 添加缓存层 (Redis)

---

## 🌟 优势总结

✅ **零配置**: 自动检测项目类型
✅ **免费额度充足**: 适合个人项目
✅ **内置数据库**: 无需单独配置
✅ **自动 HTTPS**: 开箱即用
✅ **自动部署**: 推送即部署
✅ **易于扩展**: 随时升级配置
✅ **永久在线**: 不会自动休眠

---

## 📞 需要帮助?

- Railway 文档: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- 项目文档: `DEPLOYMENT.md`

---

**开始部署吧!从注册到上线只需 10 分钟!** 🚀
