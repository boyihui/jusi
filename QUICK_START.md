# 快速启动指南

## 系统要求
- Node.js 22.x
- pnpm 10.x
- MySQL 数据库

## 启动步骤

### 1. 安装依赖
```bash
cd /home/ubuntu
pnpm install
```

### 2. 配置环境变量
确保 `.env` 文件中配置了 `DATABASE_URL`:
```
DATABASE_URL=mysql://user:password@host:port/database
```

### 3. 启动开发服务器
```bash
pnpm run dev
```

服务器将在 http://localhost:3000 启动

### 4. 构建生产版本
```bash
pnpm run build
pnpm run start
```

## 主要功能

### 1. 实时排名 (/)
- 查看各平台股票实时排名
- 支持日期选择
- 自动/手动刷新
- 市场统计面板
- 热门板块分析

### 2. 日期对比 (/compare)
- 多日期横向对比
- 支持选择不同平台
- 股票hover高亮

### 3. 综合评分 (/score)
- 按综合得分排序
- 显示平台详情
- 评分规则说明

## 新增功能

### 市场统计
- 涨停/跌停数量
- 上涨/下跌分布
- 连板梯队统计
- 昨涨停表现

### 实时时钟
- 当前时间显示
- 市场状态指示
- 开盘/休市自动识别

### 视觉优化
- 现代渐变设计
- 玻璃态效果
- 响应式布局
- 移动端优化

## 技术栈
- **前端**: React 19 + TypeScript + Vite + TailwindCSS
- **后端**: Express + tRPC + Drizzle ORM
- **数据库**: MySQL
- **UI组件**: Radix UI + shadcn/ui

## 目录结构
```
/home/ubuntu/
├── client/          # 前端代码
│   └── src/
│       ├── pages/   # 页面组件
│       └── components/  # 通用组件
├── server/          # 后端代码
│   └── routers/     # API路由
├── shared/          # 共享代码
├── drizzle/         # 数据库schema
└── scripts/         # 工具脚本
```

## 常见问题

### Q: 端口被占用怎么办?
A: 修改 `vite.config.ts` 中的端口配置

### Q: 数据库连接失败?
A: 检查 `.env` 中的 `DATABASE_URL` 配置

### Q: 页面显示异常?
A: 清除浏览器缓存,重新加载页面

## 升级说明
本版本已完成以下升级:
- ✓ Bug修复
- ✓ 页面美化
- ✓ 移动端优化
- ✓ 新增市场统计功能
- ✓ 实时时钟和状态显示

详细升级内容请查看 `UPGRADE_SUMMARY.md`

## 备份文件
原始页面已备份为:
- `client/src/pages/Home_backup.tsx`
- `client/src/pages/ScoreRanking_backup.tsx`
- `client/src/pages/MultiDateView_backup.tsx`

如需恢复原版本,可将备份文件重命名回原文件名。

## 联系支持
- 项目文档: README.md
- Bug报告: bug_report.md
- 升级计划: upgrade_plan.md
- 升级总结: UPGRADE_SUMMARY.md
