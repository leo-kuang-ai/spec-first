# Design — FSREQ-20260319-WEBSITE-001

> Spec-First 项目介绍官网技术设计

**Constitution Compliance**: P1 (KISS), P2 (事实为本), P5 (代码变动铁律) — Constitution v1.1.0

---

## 1. 技术选型

### 1.1 核心框架

| 组件 | 选型 | 理由 |
| --- | --- | --- |
| 静态生成器 | **Astro** | 零 JS 默认输出、组件 Islands 架构、内置 i18n 支持、SEO 友好 |
| UI 组件 | **vanilla CSS + Web Components** | 极简风格，最小化 JS 体积 |
| 终端演示 | **xterm.js** | 成熟的终端模拟器，支持主题定制 |
| 部署 | **GitHub Pages / Vercel** | 静态托管，CDN 自动配置 |

### 1.2 设计约束映射

| 约束 | 满足方式 |
| --- | --- |
| ESM only | Astro 原生 ESM |
| kebab-case 文件名 | 遵循 Astro 约定 |
| 性能 < 2s | 静态预渲染 + 零 JS 默认 |

---

## 2. 模块划分

```
website/
├── src/
│   ├── components/       # UI 组件（Islands）
│   │   ├── hero-section/     # Hero 区域（FR-001）
│   │   ├── feature-cards/    # 特性卡片（FR-001）
│   │   ├── terminal-demo/    # 终端演示（FR-002）
│   │   ├── language-switch/  # 语言切换（FR-006）
│   │   └── navigation/       # 导航栏（FR-008）
│   ├── layouts/          # 页面布局
│   │   └── base-layout.astro
│   ├── pages/            # 路由页面
│   │   ├── index.astro       # 首页（FR-001, FR-002）
│   │   ├── product.astro     # 产品介绍（FR-003）
│   │   ├── team.astro        # 团队介绍（FR-004）
│   │   ├── contact.astro     # 联系我们（FR-005）
│   │   └── en/                # 英文版页面
│   ├── i18n/             # 国际化
│   │   ├── zh.json
│   │   └── en.json
│   └── styles/           # 全局样式
│       └── global.css
├── public/               # 静态资源
│   └── images/
└── astro.config.mjs      # Astro 配置
```

---

## 3. 设计规格（DS）

### DS-WEBSITE-001: 首页展示模块

**映射**: FR-WEBSITE-001
**模块**: `src/pages/index.astro`, `src/components/hero-section/`, `src/components/feature-cards/`

**接口契约**:
- 输入: 无（静态页面）
- 输出: 预渲染 HTML

**关键约束**:
- Hero 区域包含 `<h1>` 产品名称、`<p>` 描述、2 个 CTA 按钮
- 特性卡片使用 CSS Grid 布局，响应式 4 列 → 2 列 → 1 列
- 首屏 Critical CSS 内联

**性能策略**:
- 图片使用 `astro:assets` 自动 WebP 转换
- 非首屏组件懒加载

---

### DS-WEBSITE-002: 交互式终端演示

**映射**: FR-WEBSITE-002
**模块**: `src/components/terminal-demo/`

**接口契约**:
- Props: `commands: string[]` - 预设命令序列
- Events: 无（纯展示）

**数据模型**:
```typescript
interface TerminalCommand {
  command: string;
  output: string;
  delay?: number;
}
```

**关键约束**:
- 桌面端: 使用 xterm.js 渲染交互式终端
- 移动端: 降级为 `<video>` 或 GIF 动图（CSS `@media` 检测）
- 终端主题: 暗色背景 + 绿色/蓝色高亮（与代码编辑器风格一致）

**回滚策略**:
- xterm.js 加载失败 → 显示静态命令截图
- 移动端检测逻辑: `window.matchMedia('(max-width: 768px)')`

---

### DS-WEBSITE-003: 产品介绍页

**映射**: FR-WEBSITE-003
**模块**: `src/pages/product.astro`

**接口契约**:
- 输入: 无（静态页面）
- 输出: 预渲染 HTML

**关键约束**:
- 功能特性列表: 至少 6 项，使用卡片组件
- 技术架构图: SVG 内联或 `<img>` 引用
- GitHub 链接: 外部链接，`target="_blank" rel="noopener noreferrer"`

---

### DS-WEBSITE-004: 团队介绍页

**映射**: FR-WEBSITE-004
**模块**: `src/pages/team.astro`

**接口契约**:
- 输入: 无（静态页面）
- 输出: 预渲染 HTML

**数据模型**:
```typescript
interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  links: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}
```

**关键约束**:
- 团队成员数据存储在 `src/data/team.json`
- 卡片使用 CSS Grid 布局，响应式 3 列 → 2 列 → 1 列
- 贡献者区域: 可选，链接到 `https://github.com/kuangcat/spec-first/graphs/contributors`

---

### DS-WEBSITE-005: 联系我们页

**映射**: FR-WEBSITE-005
**模块**: `src/pages/contact.astro`

**接口契约**:
- 输入: 无（静态页面）
- 输出: 预渲染 HTML

**关键约束**:
- 所有外部链接使用 `target="_blank" rel="noopener noreferrer"`
- 邮箱使用 `mailto:` 链接
- 可选: 简单的联系表单（Formspree / Netlify Forms）

---

### DS-WEBSITE-006: 国际化系统

**映射**: FR-WEBSITE-006
**模块**: `src/i18n/`, Astro i18n 配置

**接口契约**:
- URL 结构: `/zh/` 前缀中文，`/en/` 前缀英文，根路径重定向到默认语言
- 语言文件: JSON 格式，键值对结构

**数据模型**:
```typescript
interface I18nConfig {
  defaultLocale: 'zh';
  locales: ['zh', 'en'];
  fallback: 'en';
}
```

**关键约束**:
- 语言偏好存储: `localStorage.setItem('locale', lang)`
- 切换时更新 `document.documentElement.lang`
- URL 必须包含语言前缀（SEO 要求）

**一致性策略**:
- 切换语言后，页面跳转到对应语言版本
- 缺失翻译时，fallback 到默认语言并标记 `[ untranslated ]`

---

### DS-WEBSITE-007: 响应式布局系统

**映射**: FR-WEBSITE-007
**模块**: `src/styles/global.css`, 各组件 CSS

**断点定义**:
| 断点 | 宽度 | 布局 |
| --- | --- | --- |
| Desktop | >= 1024px | 多列完整布局 |
| Tablet | 768px - 1023px | 自适应 2 列 |
| Mobile | < 768px | 单列，汉堡菜单 |

**关键约束**:
- CSS Grid / Flexbox 实现响应式
- 导航栏移动端使用 `<details>` + CSS 实现，无 JS 依赖
- 图片使用 `srcset` + `sizes` 响应式加载

---

### DS-WEBSITE-008: 导航与路由系统

**映射**: FR-WEBSITE-008
**模块**: `src/components/navigation/`, Astro 路由

**接口契约**:
- 导航项: `[{ label: string, href: string }]`
- 当前页高亮: `aria-current="page"`

**关键约束**:
- 顶部导航栏固定（`position: sticky`）
- 导航项数据存储在 `src/data/navigation.json`
- 当前页通过 `Astro.url.pathname` 判断

**SEO 策略**:
- URL 结构: `/{locale}/{page-slug}`
- 每个页面自动生成 `<title>`, `<meta description>`, `<og:*>` 标签

---

## 4. 非功能设计

### NFR-001: 性能设计

| 指标 | 目标 | 实现方式 |
| --- | --- | --- |
| 首屏加载 | < 2s | 静态预渲染 + Critical CSS 内联 |
| Lighthouse 评分 | > 80 | Astro 零 JS 默认输出 |
| 图片优化 | WebP + 懒加载 | `astro:assets` 自动处理 |

### NFR-002: SEO 设计

- 每页包含: `<title>`, `<meta name="description">`, `<meta property="og:*">`
- 生成 `sitemap.xml`（Astro 内置）
- 语义化 HTML: `<header>`, `<main>`, `<nav>`, `<section>`, `<footer>`

### NFR-003: 无障碍设计

- 所有图片 `<img alt="...">`
- 链接包含 `aria-label`
- 键盘导航: Tab 顺序正确，`:focus-visible` 样式
- 颜色对比度: >= 4.5:1（WCAG AA）

### NFR-004: 安全设计

- 所有页面 HTTPS 部署
- 外部链接: `rel="noopener noreferrer"`
- Content Security Policy: 仅允许加载本域资源 + 统计脚本

---

## 5. 部署架构

```
┌─────────────────┐
│   GitHub Repo   │
│  (Source Code)  │
└────────┬────────┘
         │ git push
         ▼
┌─────────────────┐
│   GitHub Actions│
│   (Build & Test)│
└────────┬────────┘
         │ build
         ▼
┌─────────────────┐
│   GitHub Pages  │
│   (Static Host) │
└─────────────────┘
```

**构建流程**:
1. `npm run build` → 生成 `dist/` 静态文件
2. `npm run test` → 运行测试（如有）
3. `npm run lighthouse` → Lighthouse CI 检查（可选）

---

## 6. DS → FR 追溯矩阵

| DS ID | FR ID | 模块 |
| --- | --- | --- |
| DS-WEBSITE-001 | FR-WEBSITE-001 | hero-section, feature-cards |
| DS-WEBSITE-002 | FR-WEBSITE-002 | terminal-demo |
| DS-WEBSITE-003 | FR-WEBSITE-003 | product.astro |
| DS-WEBSITE-004 | FR-WEBSITE-004 | team.astro |
| DS-WEBSITE-005 | FR-WEBSITE-005 | contact.astro |
| DS-WEBSITE-006 | FR-WEBSITE-006 | i18n/ |
| DS-WEBSITE-007 | FR-WEBSITE-007 | global.css |
| DS-WEBSITE-008 | FR-WEBSITE-008 | navigation/ |

---

## 7. 待验证项

- [ ] xterm.js 在移动端性能表现（可能需要降级方案）
- [ ] Astro i18n 路由配置是否符合 SEO 要求
- [ ] GitHub Pages 自定义域名 + HTTPS 配置

---

## 8. 设计简洁性自检

| 检查项 | 结果 |
| --- | --- |
| 每个模块是否直接服务于对应 FR？ | ✅ |
| 是否存在投机性扩展点？ | ❌ 无 |
| 是否存在未使用的分层？ | ❌ 无 |
| 删除任一设计层是否影响交付？ | 部分影响，保留必要层 |
