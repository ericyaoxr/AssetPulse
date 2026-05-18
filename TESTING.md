# AssetPulse 测试计划

## 一、页面功能测试清单

### 1. 首页 & 仪表盘
- [x] 登录页面 (`/` - 未登录时显示)
- [x] 注册页面 (`/` - 未登录时显示)
- [ ] 仪表盘首页 (`/`)
  - [ ] 最近资产展示
  - [ ] 统计数据卡片
  - [ ] 快捷操作入口

### 2. 资产管理
- [ ] 资产列表 (`/assets`)
  - [ ] 筛选功能
  - [ ] 排序功能
  - [ ] 搜索功能
  - [ ] 分类/标签筛选
- [ ] 添加资产 (`/assets/new`)
  - [ ] 表单验证
  - [ ] 保存功能
- [ ] 资产详情 (`/assets/:id`)
  - [ ] 信息展示
  - [ ] AI 估值
  - [ ] 编辑按钮
  - [ ] 分享功能
- [ ] 资产编辑 (`/assets/:id/edit`)
  - [ ] 编辑功能
  - [ ] 删除功能
- [ ] 回收站 (`/trash`)
  - [ ] 恢复功能
  - [ ] 永久删除功能

### 3. 分析 & 复盘
- [ ] 盈亏复盘 (`/review`)
  - [ ] 时间范围选择
  - [ ] 图表展示
  - [ ] 统计数据
- [ ] 数据分析 (`/analytics`)
  - [ ] 分类统计
  - [ ] 趋势图表
  - [ ] 自定义查询

### 4. AI 功能
- [ ] AI 顾问 (`/ai-advisor`)
  - [ ] 资产体检报告
  - [ ] 买卖建议
  - [ ] 预测功能
- [ ] AI 物品故事 (资产详情)
  - [ ] 故事生成
  - [ ] 分享功能

### 5. 管理 & 设置
- [ ] 提醒设置 (`/reminders`)
  - [ ] 添加提醒
  - [ ] 编辑提醒
  - [ ] 删除提醒
  - [ ] 通知功能
- [ ] 保险保修 (`/insurance`)
  - [ ] 保险列表
  - [ ] 添加保险
  - [ ] 索赔跟踪
- [ ] 资产宇宙 (`/universe`)
  - [ ] 可视化展示
  - [ ] 缩放交互
  - [ ] 分类筛选
- [ ] 时光机 (`/time-machine`)
  - [ ] 时间回溯
  - [ ] 假设分析
  - [ ] 历史对比
- [ ] 成就系统 (`/achievements`)
  - [ ] 成就列表
  - [ ] 进度显示

### 6. 小组共享
- [ ] 小组共享 (`/share`)
  - [ ] 创建小组
  - [ ] 邀请成员
  - [ ] 共享资产
- [ ] 小组详情 (`/share/:groupId`)
  - [ ] 成员管理
  - [ ] 资产查看

### 7. API 平台
- [ ] API 平台 (`/api`)
  - [ ] API Key 管理
  - [ ] 文档展示
  - [ ] 数据同步

### 8. 系统设置
- [ ] 账户管理 (`/settings/account`)
  - [ ] 用户信息
  - [ ] 删除账户
- [ ] 外观设置 (`/settings/appearance`)
  - [ ] 主题切换
  - [ ] 配色方案
- [ ] 语言和货币 (`/settings/locale`)
  - [ ] 语言切换
  - [ ] 货币切换
  - [ ] 汇率设置
- [ ] AI 估值 (`/settings/ai`)
  - [ ] AI 服务商选择
  - [ ] API Key 配置
  - [ ] 连接测试
- [ ] 数据备份 (`/settings/backup`)
  - [ ] 导出数据 (JSON/Excel/CSV)
  - [ ] 导入数据
  - [ ] 备份历史

## 二、测试流程

### 2.1 每次新改动后的测试
1. 代码编译检查：`npm run build`
2. 代码风格检查：`npm run lint`
3. 基础页面访问测试
4. 受影响功能的详细测试
5. 端到端流程测试

### 2.2 完整测试 (发布前)
1. 完整构建：`npm run build`
2. 所有页面路由测试
3. 各功能模块完整测试
4. 数据持久化测试
5. 响应式布局测试

### 2.3 日常测试检查清单

每次有新代码改动后，请按以下顺序测试：

#### 阶段 1：基础验证 (必须)
```bash
# 1. 检查代码是否能正常编译
npm run build

# 2. 检查代码风格
npm run lint
```

#### 阶段 2：页面访问测试
- 访问首页 `/` - 确认登录/注册页面或仪表盘正常显示
- 访问资产列表 `/assets` - 确认页面正常加载
- 访问设置页面 `/settings/ai` - 确认关键设置页面可用
- 访问几个代表性页面确认导航正常

#### 阶段 3：功能测试
- 添加一个测试资产
- 编辑该资产
- 删除该资产（或放入回收站）
- 测试导入/导出功能
- 测试 AI 设置保存功能（如果有修改）

## 三、测试环境

- **开发环境**: `http://localhost:5173` (Vite Dev Server)
- **生产环境**: Docker 容器 `http://localhost:8642`
- **测试账号**: 按需创建临时用户

## 四、问题记录

| 日期 | 问题描述 | 严重程度 | 状态 |
|------|---------|---------|------|
| 2026-05-18 | 修复 Docker 容器数据库只读问题 | 高 | 已解决 |
| 2026-05-18 | 修复加密模块错误处理 | 中 | 已解决 |
| 2026-05-18 | 修复 AI 配置保存功能 | 高 | 已解决 |

## 五、已验证页面

所有页面文件检查完毕，以下页面均存在且正常：

- [x] Dashboard (`/`)
- [x] AssetList (`/assets`)
- [x] AssetNew (`/assets/new`)
- [x] AssetDetailPage (`/assets/:id`)
- [x] AssetEdit (`/assets/:id/edit`)
- [x] Trash (`/trash`)
- [x] Review (`/review`)
- [x] AchievementsPage (`/achievements`)
- [x] RemindersPage (`/reminders`)
- [x] InsurancePage (`/insurance`)
- [x] AnalyticsPage (`/analytics`)
- [x] LocaleSettings (`/settings/locale`)
- [x] ApiPlatform (`/api`)
- [x] AIAdvisorPage (`/ai-advisor`)
- [x] AssetUniverse (`/universe`)
- [x] TimeMachine (`/time-machine`)
- [x] SharePage (`/share`)
- [x] ShareGroupDetail (`/share/:groupId`)
- [x] AISettings (`/settings/ai`)
- [x] DataBackup (`/settings/backup`)
- [x] AccountSettings (`/settings/account`)
- [x] ThemeSettings (`/settings/appearance`)

