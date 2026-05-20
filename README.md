# AssetPulse

资产日均成本追踪工具，帮助你了解每一件资产每天的真实花费。

## 核心功能

- **资产管理** — 记录资产购买价格、使用天数、回收金额，自动计算日均成本
- **AI 拍照识别** — 拍照上传，AI 自动识别物品名称、分类和价格
- **AI 估值** — 接入 OpenAI 兼容 API，一键估算资产当前二手市场价值
- **AI 资产顾问** — 智能体检报告、购买推荐、替代方案建议
- **邀请好友** — 分享邀请码，双方各获 10 次 AI 使用次数
- **AI 次数管理** — 侧边栏和设置页实时显示剩余/已用次数
- **多状态追踪** — 使用中 / 已回收 / 已报废，状态变更时自动重算
- **盈亏复盘** — 可视化日均成本趋势、分类排名、状态分布
- **数据导入导出** — 支持 Excel / CSV / JSON 格式
- **多用户** — 注册登录，数据按用户隔离
- **数据备份** — 一键导出/导入完整备份，防止数据丢失
- **深色/浅色主题** — 多主题切换

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 状态管理 | Zustand |
| 后端 | Express + JWT 认证 + AES-256-GCM 加密 |
| 数据库 | SQLite (better-sqlite3) |
| 部署 | Docker / Vercel Serverless |

## 快速开始

### 本地开发

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..

# 启动后端服务 (http://localhost:8642)
cd server && JWT_SECRET=your-secret node index.js

# 另开终端，启动前端开发服务器 (http://localhost:5173)
npm run dev
```

前端开发服务器会自动代理 `/api` 请求到后端。

### Docker Compose 部署（推荐）

#### 1. 克隆仓库

```bash
git clone https://github.com/ericyaoxr/AssetPulse.git
cd AssetPulse
```

#### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，**必须修改 `JWT_SECRET`**：

```env
PORT=8642
JWT_SECRET=your-secure-random-string-here
```

> ⚠️ `JWT_SECRET` 是 JWT 签名密钥，请使用随机字符串，不要使用默认值。

#### 3. 启动服务

```bash
docker compose up -d
```

#### 4. 访问应用

打开浏览器访问 **http://localhost:8642**

#### 常用命令

```bash
# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重新构建并启动（代码更新后）
docker compose up -d --build

# 停止并删除数据（⚠️ 会丢失所有数据）
docker compose down -v
```

### Docker 手动部署

如果不使用 docker-compose，可以手动构建和运行：

```bash
# 构建镜像
docker build -t assetpulse .

# 运行容器
docker run -d \
  --name assetpulse \
  -p 8642:8642 \
  -e JWT_SECRET=your-secure-random-string \
  -v assetpulse-data:/app/data \
  --restart unless-stopped \
  assetpulse
```

### Vercel 部署

支持部署到 Vercel，后端 API 通过 Serverless Functions 运行，后端不可用时自动降级为浏览器本地存储模式：

1. 访问 https://vercel.com/new
2. 导入 GitHub 仓库 `ericyaoxr/AssetPulse`
3. Framework Preset 选择 **Vite**
4. 在 Environment Variables 中添加 `JWT_SECRET`
5. 点击 Deploy

> 📌 Vercel Serverless 模式下 SQLite 数据存储在 `/tmp`，函数冷启动后数据会丢失，适合演示和测试。如需数据持久化，请使用 Docker 部署。

### 远程服务器部署

将代码推送到服务器后，使用 docker-compose 部署：

```bash
# SSH 到服务器
ssh user@your-server

# 克隆仓库
git clone https://github.com/ericyaoxr/AssetPulse.git
cd AssetPulse

# 配置环境变量
cp .env.example .env
nano .env  # 修改 JWT_SECRET

# 启动
docker compose up -d

# 验证
curl http://localhost:8642
```

如果服务器有防火墙，需要开放对应端口：

```bash
# Ubuntu/Debian
sudo ufw allow 8642

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8642/tcp
sudo firewall-cmd --reload
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `8642` | 服务端口 |
| `JWT_SECRET` | — | JWT 签名密钥（**必填**） |
| `DATA_DIR` | `./data` | SQLite 数据库目录 |
| `DIST_DIR` | 自动检测 | 前端静态文件目录（Docker 中自动设置） |
| `CORS_ORIGIN` | — | 允许的跨域来源，多个用逗号分隔 |
| `TZ` | `UTC` | 时区（Docker 中默认 `Asia/Shanghai`） |

## 数据持久化

Docker 部署使用命名卷 `assetpulse-data` 挂载到 `/app/data`，数据库文件位于：

```
/app/data/assetpulse.db
```

备份数据：

```bash
# 从容器中复制数据库文件
docker cp assetpulse:/app/data/assetpulse.db ./backup.db

# 或者使用应用内的数据备份功能（设置 → 数据备份 → 导出）
```

恢复数据：

```bash
# 将备份文件复制回容器
docker cp ./backup.db assetpulse:/app/data/assetpulse.db

# 重启容器
docker compose restart
```

## AI 功能配置

1. 注册并登录后，进入 **AI 设置** 页面
2. 选择 AI 服务商（支持 DeepSeek、OpenAI、阿里云百炼、硅基流动、智谱AI 等）
3. 填入 API Key
4. 保存后即可使用拍照识别和 AI 估值功能

### AI 使用次数

- 新用户默认 10 次 AI 使用次数
- 每次使用 AI 识别、估值、体检报告或推荐，消耗 1 次次数
- 邀请好友注册，双方各获 10 次额外次数
- 在侧边栏和账户设置页可查看剩余次数

## 项目结构

```
AssetPulse/
├── api/                     # Vercel Serverless 入口
│   └── index.mjs            # serverless-http 适配
├── server/                  # 后端服务
│   ├── index.js             # Express 入口
│   ├── db.js                # SQLite 数据库初始化与迁移
│   ├── middleware/
│   │   └── auth.js          # JWT 认证中间件
│   ├── utils/
│   │   ├── crypto.js        # AES-256-GCM 加解密
│   │   └── json.js          # JSON 安全解析
│   └── routes/
│       ├── auth.js          # 注册/登录/邀请码/AI次数
│       ├── assets.js        # 资产 CRUD
│       ├── trash.js         # 回收站
│       ├── categories.js    # 分类管理
│       ├── locations.js     # 位置管理
│       ├── settings.js      # 用户设置（键值对）
│       ├── ai.js            # AI 识别/估值/体检/推荐
│       └── backup.js        # 数据备份导入/导出
├── src/                     # 前端应用
│   ├── components/          # UI 组件
│   ├── pages/               # 页面
│   ├── store/               # Zustand 状态管理
│   ├── utils/               # 工具函数
│   └── types/               # TypeScript 类型
├── Dockerfile               # 多阶段 Docker 构建
├── docker-compose.yml       # Docker Compose 配置
├── docker-entrypoint.sh     # Docker 启动脚本
├── vercel.json              # Vercel 部署配置
└── .env.example             # 环境变量示例
```

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（支持邀请码） |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户（含邀请码、AI次数） |
| PUT | `/api/auth/password` | 修改密码 |
| GET | `/api/auth/invites` | 获取邀请记录 |

### 资产

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/assets` | 资产列表 |
| POST | `/api/assets` | 创建资产 |
| PUT | `/api/assets/:id` | 更新资产 |
| DELETE | `/api/assets/:id` | 删除资产（移入回收站） |

### 回收站

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/trash` | 回收站列表 |
| POST | `/api/trash/restore/:id` | 恢复资产 |
| DELETE | `/api/trash/:id` | 永久删除 |
| DELETE | `/api/trash` | 清空回收站 |

### 分类与位置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/categories` | 分类列表 |
| PUT | `/api/categories` | 批量保存分类 |
| GET | `/api/locations` | 位置列表 |
| PUT | `/api/locations` | 批量保存位置 |

### 设置与备份

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取所有设置 |
| GET | `/api/settings/:key` | 获取指定设置 |
| PUT | `/api/settings/:key` | 保存设置 |
| GET | `/api/backup/export` | 导出备份 |
| POST | `/api/backup/import` | 导入备份 |

### AI

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/recognize` | AI 图片识别 |
| POST | `/api/ai/valuate` | AI 估值 |
| POST | `/api/ai/health-check` | AI 资产体检报告 |
| POST | `/api/ai/recommendations` | AI 购买/替代推荐 |

## 日均成本计算

```
日均成本 = (购买价格 - 回收金额) / 使用天数
```

- **使用中**：使用天数 = 今天 - 购买日期
- **已回收/已报废**：使用天数 = 结束日期 - 购买日期

## License

MIT
