# AssetPulse

资产日均成本追踪工具，帮助你了解每一件资产每天的真实花费。

## 核心功能

- **资产管理** — 记录资产购买价格、使用天数、回收金额，自动计算日均成本
- **多状态追踪** — 使用中 / 已回收 / 已报废，状态变更时自动重算
- **AI 估值** — 接入 OpenAI 兼容 API，一键估算资产当前二手市场价值
- **盈亏复盘** — 可视化日均成本趋势、分类排名、状态分布
- **数据导入导出** — 支持 Excel / CSV / JSON 格式
- **多用户** — 注册登录，数据按用户隔离，任何浏览器登录即可访问
- **账户管理** — 修改密码、账户信息管理
- **数据备份** — 一键导出/导入完整备份，防止数据丢失

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 状态管理 | Zustand |
| 后端 | Express + JWT 认证 |
| 数据库 | SQLite (better-sqlite3) |
| 部署 | Docker + docker-compose |

## 快速开始

### 本地开发

```bash
# 安装前端依赖
npm install

# 启动前端开发服务器 (http://localhost:5173)
npm run dev

# 安装后端依赖
cd server && npm install && cd ..

# 启动后端服务 (http://localhost:3000)
cd server && node index.js
```

前端开发服务器会自动代理 `/api` 请求到后端。

### Docker 部署

```bash
# 构建并启动
docker compose up -d

# 访问 http://localhost:3000
```

自定义端口和密钥：

```bash
# 创建 .env 文件
cp .env.example .env
# 编辑 PORT 和 JWT_SECRET
```

## 项目结构

```
AssetPulse/
├── server/                  # 后端服务
│   ├── index.js             # Express 入口
│   ├── db.js                # SQLite 数据库初始化
│   ├── middleware/
│   │   └── auth.js          # JWT 认证中间件
│   └── routes/
│       ├── auth.js          # 注册/登录/修改密码
│       ├── assets.js        # 资产 CRUD
│       ├── trash.js         # 回收站
│       ├── categories.js    # 分类管理
│       ├── locations.js     # 位置管理
│       ├── settings.js      # 用户设置（键值对）
│       └── backup.js        # 数据备份导入/导出
├── src/                     # 前端应用
│   ├── components/          # UI 组件
│   │   ├── assets/          # 资产相关组件
│   │   ├── dashboard/       # 仪表盘组件
│   │   └── layout/          # 布局组件（侧边栏/移动导航）
│   ├── pages/               # 页面
│   │   ├── Dashboard.tsx    # 仪表盘
│   │   ├── AssetList.tsx    # 资产列表
│   │   ├── AssetNew.tsx     # 添加资产
│   │   ├── AssetEdit.tsx    # 编辑资产
│   │   ├── AssetDetailPage.tsx  # 资产详情
│   │   ├── Trash.tsx        # 回收站
│   │   ├── Review.tsx       # 盈亏复盘
│   │   ├── AccountSettings.tsx  # 账户管理
│   │   ├── AISettings.tsx   # AI 估值设置
│   │   ├── DataBackup.tsx   # 数据备份
│   │   └── AuthPage.tsx     # 登录/注册
│   ├── store/               # Zustand 状态
│   │   ├── useAssetStore.ts # 资产数据
│   │   └── useAuthStore.ts  # 认证状态
│   ├── utils/               # 工具函数
│   │   ├── api.ts           # HTTP 客户端
│   │   ├── aiValuation.ts   # AI 估值
│   │   ├── calculations.ts  # 成本计算
│   │   ├── format.ts        # 格式化
│   │   └── storage.ts       # 导入导出
│   └── types/               # TypeScript 类型
├── Dockerfile               # 多阶段 Docker 构建
├── docker-compose.yml       # Docker Compose 配置
└── .env.example             # 环境变量示例
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| PUT | `/api/auth/password` | 修改密码 |
| GET | `/api/assets` | 资产列表 |
| POST | `/api/assets` | 创建资产 |
| PUT | `/api/assets/:id` | 更新资产 |
| DELETE | `/api/assets/:id` | 删除资产（移入回收站） |
| GET | `/api/trash` | 回收站列表 |
| POST | `/api/trash/restore/:id` | 恢复资产 |
| DELETE | `/api/trash/:id` | 永久删除 |
| DELETE | `/api/trash` | 清空回收站 |
| GET | `/api/categories` | 分类列表 |
| PUT | `/api/categories` | 批量保存分类 |
| GET | `/api/locations` | 位置列表 |
| PUT | `/api/locations` | 批量保存位置 |
| GET | `/api/settings` | 获取所有设置 |
| GET | `/api/settings/:key` | 获取指定设置 |
| PUT | `/api/settings/:key` | 保存设置 |
| GET | `/api/backup/export` | 导出备份 |
| POST | `/api/backup/import` | 导入备份 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务端口 |
| `JWT_SECRET` | `assetpulse_secret_key_2024` | JWT 签名密钥 |
| `DATA_DIR` | `./data` | SQLite 数据库目录 |

## 日均成本计算

```
日均成本 = (购买价格 - 回收金额) / 使用天数
```

- **使用中**：使用天数 = 今天 - 购买日期
- **已回收/已报废**：使用天数 = 结束日期 - 购买日期

## License

MIT
