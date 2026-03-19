# Task Plan — FSREQ-20260319-WEBSITE-001

> Spec-First 项目介绍官网任务拆解

## 目标

实现 Spec-First 项目介绍官网，包含首页、产品介绍、团队介绍、联系我们四个核心页面，支持中英双语和响应式设计。

## 当前阶段

Phase 2: Implementation (03_plan → 04_implement)

## 技术栈

- 静态生成器: Astro
- UI: vanilla CSS + Web Components
- 终端演示: xterm.js
- 部署: GitHub Pages

## 用户故事分组

### US1 — 项目基础设施 (P0)

- [x] TASK-WEBSITE-001 [P] [US1] 项目初始化与 Astro 配置 (in_progress)
- [ ] TASK-WEBSITE-002 [P] [US1] 基础布局与导航组件

### US2 — 首页功能 (P0)

- [ ] TASK-WEBSITE-003 [US2] Hero 区域与特性卡片
- [ ] TASK-WEBSITE-004 [US2] 交互式终端演示组件

### US3 — 内容页面 (P1-P2)

- [ ] TASK-WEBSITE-005 [US3] 产品介绍页
- [ ] TASK-WEBSITE-006 [US3] 团队介绍页
- [ ] TASK-WEBSITE-007 [US3] 联系我们页

### US4 — 系统功能 (P0)

- [ ] TASK-WEBSITE-008 [P] [US4] 国际化系统
- [ ] TASK-WEBSITE-009 [P] [US4] 响应式布局系统

### US5 — 质量保证 (P0)

- [ ] TASK-WEBSITE-010 [US5] SEO 与性能优化
- [ ] TASK-WEBSITE-011 [US5] 部署配置与验证

---

## 任务明细

| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 验证命令 | 状态 |
|---------|------|-------|----------|--------|------------|----------|----------|------|
| TASK-WEBSITE-001 | 项目初始化与 Astro 配置 | FE | 4h | DS-WEBSITE-001,DS-WEBSITE-008 | - | Astro 项目可运行，目录结构符合设计 | `pnpm dev` 启动成功 | in_progress |
| TASK-WEBSITE-002 | 基础布局与导航组件 | FE | 4h | DS-WEBSITE-008 | TASK-WEBSITE-001 | 导航栏显示，页面切换正常 | `pnpm dev` 检查导航 | todo |
| TASK-WEBSITE-003 | Hero 区域与特性卡片 | FE | 4h | DS-WEBSITE-001 | TASK-WEBSITE-002 | Hero + 4 个特性卡片显示 | `pnpm dev` 检查首页 | todo |
| TASK-WEBSITE-004 | 交互式终端演示组件 | FE | 4h | DS-WEBSITE-002 | TASK-WEBSITE-003 | 终端组件可交互，移动端降级 | `pnpm dev` 测试终端 | todo |
| TASK-WEBSITE-005 | 产品介绍页 | FE | 3h | DS-WEBSITE-003 | TASK-WEBSITE-002 | 产品页 6+ 特性 + 架构图 | `pnpm dev` 检查 product | todo |
| TASK-WEBSITE-006 | 团队介绍页 | FE | 3h | DS-WEBSITE-004 | TASK-WEBSITE-002 | 团队成员卡片响应式布局 | `pnpm dev` 检查 team | todo |
| TASK-WEBSITE-007 | 联系我们页 | FE | 2h | DS-WEBSITE-005 | TASK-WEBSITE-002 | GitHub/邮箱链接可用 | `pnpm dev` 检查 contact | todo |
| TASK-WEBSITE-008 | 国际化系统 | FE | 4h | DS-WEBSITE-006 | TASK-WEBSITE-001 | 中英切换正常，URL 前缀正确 | 切换语言验证 | todo |
| TASK-WEBSITE-009 | 响应式布局系统 | FE | 3h | DS-WEBSITE-007 | TASK-WEBSITE-002 | 三断点布局正常 | 缩放窗口验证 | todo |
| TASK-WEBSITE-010 | SEO 与性能优化 | FE | 3h | NFR-001,NFR-002 | TASK-WEBSITE-003..007 | meta 标签完整，Lighthouse > 80 | `pnpm lighthouse` | todo |
| TASK-WEBSITE-011 | 部署配置与验证 | FE | 2h | - | TASK-WEBSITE-010 | GitHub Pages 部署成功 | 访问线上地址 | todo |

---

## 任务详情

### TASK-WEBSITE-001: 项目初始化与 Astro 配置

**Owner**: FE
**预计工期**: 4h
**traces**: DS-WEBSITE-001, DS-WEBSITE-008
**depends_on**: -
**用户故事**: US1

**目标**：初始化 Astro 项目，配置项目结构和基础依赖。

**验收标准**：
- [ ] Astro 项目创建成功
- [ ] 目录结构符合 design.md 定义
- [ ] 基础依赖安装完成（xterm.js）
- [ ] 开发服务器可启动

**文件清单**：
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/layouts/base-layout.astro`
- Create: `src/styles/global.css`

**执行步骤**：

1. 创建 Astro 项目：`npm create astro@latest website -- --template minimal --typescript strict`
2. 安装依赖：`npm install xterm`
3. 创建目录结构：`mkdir -p src/{components,pages,i18n,styles,data} public/images`
4. 配置 `astro.config.mjs` i18n 选项
5. 创建基础布局 `src/layouts/base-layout.astro`

**验证命令**：`pnpm dev` → Astro dev server running

**状态**: todo

---

### TASK-WEBSITE-002: 基础布局与导航组件

**Owner**: FE
**预计工期**: 4h
**traces**: DS-WEBSITE-008
**depends_on**: TASK-WEBSITE-001
**用户故事**: US1

**目标**：实现页面基础布局和顶部导航栏组件。

**验收标准**：
- [ ] 导航栏包含所有页面链接
- [ ] 当前页导航项高亮显示
- [ ] 移动端导航收起为汉堡菜单
- [ ] 导航栏固定在顶部

**文件清单**：
- Create: `src/components/navigation/navigation.astro`
- Create: `src/components/navigation/navigation.css`
- Create: `src/data/navigation.json`
- Modify: `src/layouts/base-layout.astro`

**执行步骤**：

1. 创建导航数据 `src/data/navigation.json`
2. 实现导航组件 `src/components/navigation/navigation.astro`
3. 添加响应式样式 `src/components/navigation/navigation.css`
4. 集成到布局 `src/layouts/base-layout.astro`

**验证命令**：`pnpm dev` → 导航栏显示正常

**状态**: todo

---

### TASK-WEBSITE-003: Hero 区域与特性卡片

**Owner**: FE
**预计工期**: 4h
**traces**: DS-WEBSITE-001
**depends_on**: TASK-WEBSITE-002
**用户故事**: US2

**目标**：实现首页 Hero 区域和核心特性卡片组件。

**验收标准**：
- [ ] Hero 区域包含产品名称、描述、2 个 CTA 按钮
- [ ] 4 个特性卡片展示核心功能
- [ ] 卡片响应式布局（4 列 → 2 列 → 1 列）

**文件清单**：
- Create: `src/components/hero-section/hero-section.astro`
- Create: `src/components/hero-section/hero-section.css`
- Create: `src/components/feature-cards/feature-cards.astro`
- Create: `src/components/feature-cards/feature-cards.css`
- Modify: `src/pages/index.astro`

**执行步骤**：

1. 创建 Hero 组件和样式
2. 创建特性卡片组件和响应式网格样式
3. 集成到首页 `src/pages/index.astro`

**验证命令**：`pnpm dev` → Hero + 4 个特性卡片显示

**状态**: todo

---

### TASK-WEBSITE-004: 交互式终端演示组件

**Owner**: FE
**预计工期**: 4h
**traces**: DS-WEBSITE-002
**depends_on**: TASK-WEBSITE-003
**用户故事**: US2

**目标**：实现首页交互式终端演示组件。

**验收标准**：
- [ ] 终端组件支持预设命令序列
- [ ] 用户可点击运行演示命令
- [ ] 移动端降级为 GIF 动图

**文件清单**：
- Create: `src/components/terminal-demo/terminal-demo.astro`
- Create: `src/components/terminal-demo/terminal-demo.css`
- Create: `src/components/terminal-demo/terminal-demo.ts`
- Create: `src/data/terminal-commands.json`
- Modify: `src/pages/index.astro`

**执行步骤**：

1. 创建命令数据 `src/data/terminal-commands.json`
2. 集成 xterm.js 实现 `terminal-demo.ts`
3. 添加暗色主题样式
4. 实现移动端降级逻辑
5. 集成到首页

**验证命令**：`pnpm dev` → 终端组件可交互

**状态**: todo

---

### TASK-WEBSITE-005: 产品介绍页

**Owner**: FE
**预计工期**: 3h
**traces**: DS-WEBSITE-003
**depends_on**: TASK-WEBSITE-002
**用户故事**: US3

**目标**：实现产品介绍页面。

**验收标准**：
- [ ] 页面包含 6+ 功能特性列表
- [ ] 包含技术架构图或流程说明
- [ ] GitHub 仓库链接可点击

**文件清单**：
- Create: `src/pages/zh/product.astro`
- Create: `src/pages/en/product.astro`
- Create: `src/data/features.json`

**执行步骤**：

1. 创建特性数据 `src/data/features.json`
2. 实现中文产品页 `src/pages/zh/product.astro`
3. 实现英文产品页 `src/pages/en/product.astro`

**验证命令**：`pnpm dev` → 产品页显示正常

**状态**: todo

---

### TASK-WEBSITE-006: 团队介绍页

**Owner**: FE
**预计工期**: 3h
**traces**: DS-WEBSITE-004
**depends_on**: TASK-WEBSITE-002
**用户故事**: US3

**目标**：实现团队介绍页面。

**验收标准**：
- [ ] 展示核心团队成员信息
- [ ] 卡片响应式网格布局
- [ ] 包含贡献者致谢区域

**文件清单**：
- Create: `src/pages/zh/team.astro`
- Create: `src/pages/en/team.astro`
- Create: `src/data/team.json`

**执行步骤**：

1. 创建团队数据 `src/data/team.json`
2. 实现中英文团队页

**验证命令**：`pnpm dev` → 团队页显示正常

**状态**: todo

---

### TASK-WEBSITE-007: 联系我们页

**Owner**: FE
**预计工期**: 2h
**traces**: DS-WEBSITE-005
**depends_on**: TASK-WEBSITE-002
**用户故事**: US3

**目标**：实现联系我们页面。

**验收标准**：
- [ ] 包含 GitHub Issues 链接
- [ ] 包含邮箱联系方式
- [ ] 外部链接新标签页打开

**文件清单**：
- Create: `src/pages/zh/contact.astro`
- Create: `src/pages/en/contact.astro`

**执行步骤**：

1. 实现中英文联系页

**验证命令**：`pnpm dev` → 联系页链接可用

**状态**: todo

---

### TASK-WEBSITE-008: 国际化系统

**Owner**: FE
**预计工期**: 4h
**traces**: DS-WEBSITE-006
**depends_on**: TASK-WEBSITE-001
**用户故事**: US4

**目标**：实现中英双语切换功能。

**验收标准**：
- [ ] 导航栏包含语言切换按钮
- [ ] 切换语言后所有页面同步
- [ ] URL 包含语言前缀
- [ ] localStorage 保存偏好

**文件清单**：
- Create: `src/i18n/zh.json`
- Create: `src/i18n/en.json`
- Create: `src/components/language-switch/language-switch.astro`
- Modify: `astro.config.mjs`

**执行步骤**：

1. 创建语言文件 `src/i18n/zh.json`, `src/i18n/en.json`
2. 配置 Astro i18n 路由
3. 实现语言切换组件

**验证命令**：切换语言 → URL 和内容同步变化

**状态**: todo

---

### TASK-WEBSITE-009: 响应式布局系统

**Owner**: FE
**预计工期**: 3h
**traces**: DS-WEBSITE-007
**depends_on**: TASK-WEBSITE-002
**用户故事**: US4

**目标**：实现响应式布局系统。

**验收标准**：
- [ ] 桌面端（>= 1024px）完整布局
- [ ] 平板端（768px - 1023px）自适应
- [ ] 移动端（< 768px）单列 + 汉堡菜单

**文件清单**：
- Modify: `src/styles/global.css`
- Modify: `src/components/navigation/navigation.css`

**执行步骤**：

1. 定义 CSS 变量和断点
2. 实现响应式导航样式
3. 测试各断点

**验证命令**：缩放窗口 → 布局自适应

**状态**: todo

---

### TASK-WEBSITE-010: SEO 与性能优化

**Owner**: FE
**预计工期**: 3h
**traces**: NFR-001, NFR-002
**depends_on**: TASK-WEBSITE-003, TASK-WEBSITE-005, TASK-WEBSITE-006, TASK-WEBSITE-007
**用户故事**: US5

**目标**：实现 SEO 优化和性能优化。

**验收标准**：
- [ ] 所有页面包含正确 meta 标签
- [ ] 生成 sitemap.xml
- [ ] Lighthouse 性能评分 > 80

**文件清单**：
- Create: `src/components/seo/seo.astro`
- Modify: `src/layouts/base-layout.astro`
- Modify: `astro.config.mjs`

**执行步骤**：

1. 创建 SEO 组件封装 meta 标签
2. 配置 sitemap 生成
3. 运行 Lighthouse 测试

**验证命令**：`pnpm lighthouse` → 评分 > 80

**状态**: todo

---

### TASK-WEBSITE-011: 部署配置与验证

**Owner**: FE
**预计工期**: 2h
**traces**: -
**depends_on**: TASK-WEBSITE-010
**用户故事**: US5

**目标**：配置 GitHub Pages 部署。

**验收标准**：
- [ ] GitHub Actions CI 配置完成
- [ ] GitHub Pages 部署成功
- [ ] 线上环境可访问

**文件清单**：
- Create: `.github/workflows/deploy.yml`
- Modify: `astro.config.mjs`

**执行步骤**：

1. 创建 GitHub Actions 工作流
2. 配置 Astro 部署选项
3. 推送触发部署
4. 验证线上环境

**验证命令**：访问 GitHub Pages URL → 网站可用

**状态**: todo

---

## 依赖关系图

```
TASK-001 (项目初始化)
    ├── TASK-002 (导航组件)
    │       ├── TASK-003 (Hero + 特性卡片)
    │       │       └── TASK-004 (终端演示)
    │       ├── TASK-005 (产品页)
    │       ├── TASK-006 (团队页)
    │       └── TASK-007 (联系页)
    │               └── TASK-010 (SEO 优化)
    │                       └── TASK-011 (部署)
    └── TASK-008 (国际化) [P]
            └── TASK-009 (响应式) [P]
```

## 并行策略

| 批次 | 可并行任务 | 说明 |
|------|-----------|------|
| 1 | TASK-001 | 基础设施，必须先完成 |
| 2 | TASK-002, TASK-008 | 导航和国际化可并行 |
| 3 | TASK-003, TASK-005, TASK-006, TASK-007, TASK-009 | 内容页面和响应式可并行 |
| 4 | TASK-004 | 终端演示依赖首页 |
| 5 | TASK-010 | SEO 依赖所有页面 |
| 6 | TASK-011 | 部署依赖 SEO |

## 总工期估算

- **串行工期**: 36h
- **并行工期**: ~20h（3 个工作日）
