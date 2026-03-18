# Design — FSREQ-20260318-WEBSITE-001

> 项目官方网站 - 技术设计文档

## 概述

| 字段 | 值 |
| ---- | ---- |
| Feature ID | FSREQ-20260318-WEBSITE-001 |
| 阶段 | 02_design |
| 部署平台 | GitHub Pages |
| 域名 | spec-first.github.io |
| 技术栈 | 纯静态 HTML/CSS/JS |

---

## 设计系统 (Design System)

### 设计令牌 (Design Tokens)

#### 颜色系统

| 令牌 | 值 | 用途 |
| ---- | -- | ---- |
| --color-primary-start | #667eea | 渐变起点（紫蓝） |
| --color-primary-end | #764ba2 | 渐变终点（紫色） |
| --color-accent | #00d4ff | 强调色（青色） |
| --color-text-primary | #1a1a2e | 主要文字 |
| --color-text-inverse | #ffffff | 反色文字 |
| --color-bg-primary | #0f0f1a | 主背景（深色） |
| --color-bg-glass | rgba(255,255,255,0.1) | 玻璃态背景 |

#### 间距系统 (8px base)

| 令牌 | 值 | 用途 |
| ---- | -- | ---- |
| --space-1 | 4px | 最小间距 |
| --space-2 | 8px | 紧凑间距 |
| --space-4 | 16px | 标准间距 |
| --space-6 | 24px | 中等间距 |
| --space-8 | 32px | 大间距 |
| --space-16 | 64px | 区块间距 |

#### 字体系统

| 令牌 | 值 | 用途 |
| ---- | -- | ---- |
| --font-sans | 系统字体栈 | 正文 |
| --font-mono | SF Mono, Fira Code | 代码 |
| --text-base | 16px | 正文大小 |
| --text-xl | 20px | 小标题 |
| --text-3xl | 30px | 大标题 |
| --text-hero | clamp(2.5rem, 8vw, 4.5rem) | Hero 标题 |

#### 圆角与阴影

| 令牌 | 值 | 用途 |
| ---- | -- | ---- |
| --radius-md | 8px | 按钮、输入框 |
| --radius-xl | 16px | 卡片 |
| --radius-2xl | 24px | 大容器 |
| --shadow-lg | 0 10px 15px rgba(0,0,0,0.1) | 悬浮阴影 |
| --shadow-glow | 0 0 40px rgba(102,126,234,0.3) | 发光效果 |

#### 动画

| 令牌 | 值 | 用途 |
| ---- | -- | ---- |
| --ease-out | cubic-bezier(0.16, 1, 0.3, 1) | 流畅退出 |
| --ease-spring | cubic-bezier(0.34, 1.56, 0.64, 1) | 弹性效果 |
| --duration-fast | 150ms | 快速反馈 |
| --duration-normal | 250ms | 标准过渡 |

---

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Pages                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Static Files                        │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │    │
│  │  │ HTML    │ │ CSS     │ │ JS              │   │    │
│  │  │ (i18n)  │ │ (主题)  │ │ (交互/复制/语言)│   │    │
│  │  └─────────┘ └─────────┘ └─────────────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 设计规格 (DS)

### DS-WEBSITE-001: 静态站点架构

**映射**: FR-WEBSITE-001 ~ FR-WEBSITE-006

**目录结构**:

```
website/
├── index.html              # 根首页（重定向到 /zh/）
├── zh/
│   └── index.html          # 中文首页
├── en/
│   └── index.html          # 英文首页
├── assets/
│   ├── css/
│   │   ├── variables.css   # CSS 变量（渐变主题）
│   │   └── main.css        # 主样式
│   ├── js/
│   │   ├── main.js         # 主脚本
│   │   ├── i18n.js         # 语言切换
│   │   └── clipboard.js    # 复制功能
│   └── images/
│       └── *.webp          # 图片资源
├── sitemap.xml
├── robots.txt
└── CNAME                   # GitHub Pages 域名配置
```

**关键约束**:
- 无构建工具，纯静态文件
- 使用 CSS 变量实现主题一致性
- 图片使用 WebP 格式，懒加载

---

### DS-WEBSITE-002: Hero 组件设计

**映射**: FR-WEBSITE-001

**HTML 结构**:

```html
<section class="hero" id="hero">
  <div class="hero-content">
    <h1 class="hero-title">spec-first</h1>
    <p class="hero-tagline" data-i18n="hero.tagline">
      AI 时代的规范驱动开发 CLI
    </p>
    <div class="hero-cta">
      <a href="#quickstart" class="btn btn-primary" data-i18n="hero.cta">
        快速开始
      </a>
    </div>
    <div class="hero-install">
      <code class="install-cmd">npm install -g spec-first</code>
      <button class="copy-btn" data-cmd="npm install -g spec-first">
        <span data-i18n="copy">复制</span>
      </button>
    </div>
  </div>
</section>
```

**UI/UX 规范**:

| 属性 | 值 | 说明 |
| ---- | -- | ---- |
| 最小高度 | 100vh | 全屏展示 |
| 背景 | 动态渐变 (135deg, #667eea→#764ba2→#f093fb) | 15s 循环动画 |
| 内容容器 | 玻璃态 (backdrop-blur: 20px) | 毛玻璃卡片 |
| 标题字体 | clamp(2.5rem, 8vw, 4.5rem), 800 weight | 响应式大标题 |
| 标题效果 | 渐变文字 (白色→青色) | 渐变裁剪 |
| 安装命令 | 等宽字体, #00ff88 绿色 | 代码块样式 |

**微交互**:
- 复制按钮: hover 背景变亮, active 缩放 0.95
- 复制成功: 背景变绿 (#00ff88), 文字变黑

---

### DS-WEBSITE-003: 功能特性卡片组件

**映射**: FR-WEBSITE-002

**HTML 结构**:

```html
<section class="features" id="features">
  <h2 class="section-title" data-i18n="features.title">核心特性</h2>
  <div class="features-grid">
    <article class="feature-card">
      <img src="assets/images/icon-workflow.svg" alt="" loading="lazy">
      <h3 data-i18n="features.workflow.title">规范驱动</h3>
      <p data-i18n="features.workflow.desc">从需求到上线的全链路研发闭环</p>
    </article>
    <!-- 4-6 个特性卡片 -->
  </div>
</section>
```

**UI/UX 规范**:

| 属性 | 值 | 说明 |
| ---- | -- | ---- |
| 布局 | CSS Grid, auto-fit, minmax(300px, 1fr) | 自适应列数 |
| 间距 | 24px (--space-6) | 卡片间距 |
| 背景 | 玻璃态 (backdrop-blur: 10px) | 毛玻璃效果 |
| 边框 | 1px solid rgba(255,255,255,0.1) | 微妙边框 |
| 圆角 | 16px (--radius-xl) | 现代感 |
| 悬停效果 | translateY(-8px) + shadow-xl | 上浮 + 大阴影 |
| 动画曲线 | ease-out, 250ms | 流畅过渡 |
| 图标 | 48px, 白色滤镜 | 统一图标风格 |

**微交互**:
- hover: 卡片上浮 + 边框高亮
- 顶部渐变条: hover 时从左到右展开（scaleX 0→1）

---

### DS-WEBSITE-004: 语言切换机制

**映射**: FR-WEBSITE-005

**接口设计**:

```typescript
interface I18nConfig {
  defaultLang: 'zh' | 'en';
  currentLang: 'zh' | 'en';
}
```

**URL 路由**:
- `/` → 重定向到 `/zh/` 或 `/en/`（根据浏览器语言）
- `/zh/` → 中文首页
- `/en/` → 英文首页

**切换逻辑**:

```javascript
// i18n.js
const translations = {
  zh: { 'hero.tagline': 'AI 时代的规范驱动开发 CLI', ... },
  en: { 'hero.tagline': 'Spec-Driven Development CLI for AI Era', ... }
};

function setLanguage(lang) {
  localStorage.setItem('lang', lang);
  window.location.href = `/${lang}/`;
}

function detectLanguage() {
  const stored = localStorage.getItem('lang');
  if (stored) return stored;
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('zh') ? 'zh' : 'en';
}
```

**关键约束**:
- 默认语言根据 `navigator.language` 检测
- 语言偏好存储到 localStorage
- URL 必须包含语言前缀

---

### DS-WEBSITE-005: 响应式布局系统

**映射**: FR-WEBSITE-006

**断点定义**:

| 断点 | 宽度 | 布局调整 |
| ---- | ---- | -------- |
| 移动端 (sm) | ≤767px | 单列, 汉堡菜单 |
| 平板 (md) | 768px-1439px | 双列, 完整导航 |
| 桌面 (lg) | ≥1440px | 三列, 完整导航 |

**触摸目标约束**:
- 最小触摸目标: 44px × 44px
- 按钮内边距: 至少 12px

**响应式字体**:
- 使用 `clamp()` 实现平滑缩放
- Hero 标题: `clamp(2.5rem, 8vw, 4.5rem)`

---

### DS-WEBSITE-006: SEO 配置

**映射**: NFR-WEBSITE-002

**Meta 标签**:

```html
<!-- zh/index.html -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="spec-first - AI 时代的规范驱动开发 CLI，帮助团队实现从需求到上线的全链路研发闭环">
  <meta property="og:title" content="spec-first - 规范驱动开发 CLI">
  <meta property="og:description" content="AI 时代的规范驱动开发 CLI">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://spec-first.github.io/zh/">
  <meta property="og:image" content="https://spec-first.github.io/assets/images/og-image.png">
  <link rel="canonical" href="https://spec-first.github.io/zh/">
  <html lang="zh-CN">
</head>
```

**sitemap.xml 配置**:

| URL | 更新频率 |
| --- | -------- |
| https://spec-first.github.io/zh/ | weekly |
| https://spec-first.github.io/en/ | weekly |

---

### DS-WEBSITE-007: 性能优化策略

**映射**: NFR-WEBSITE-001

| 优化项 | 策略 |
| ------ | ---- |
| 图片 | WebP 格式 + loading="lazy" |
| CSS | 单文件 + CSS 变量 |
| JS | 原生 JS，无框架 |
| 字体 | 系统字体栈 |
| 压缩 | 部署时 minify |

**系统字体栈**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`

---

## 部署配置

### GitHub Pages 配置

| 配置项 | 值 |
| ------ | -- |
| CNAME | spec-first.github.io |
| 部署分支 | main |
| 发布目录 | ./website |

**GitHub Actions (可选)**:
- 触发: push 到 main，paths: website/**
- Action: peaceiris/actions-gh-pages@v3
- 发布目录: ./website

---

## 可访问性规范 (A11Y)

### WCAG 2.1 AA 合规要求

| 要求 | 标准 | 实现方式 |
| ---- | ---- | -------- |
| 颜色对比度 | ≥4.5:1 (正文), ≥3:1 (大文本) | 深色背景 + 白色文字 |
| 焦点指示器 | 明显可见 | 2px outline + glow |
| 键盘导航 | 全功能可用 | Tab/Enter/Esc |
| 动画偏好 | 尊重 prefers-reduced-motion | @media query |
| Alt 文本 | 所有图片 | 描述性 alt 属性 |
| 语义化 HTML | 正确使用标签 | header/nav/main/section/footer |

### 焦点样式规范

| 状态 | 样式 |
| ---- | ---- |
| 默认 | 无特殊样式 |
| :focus-visible | 2px solid #00d4ff + 0 0 8px rgba(0,212,255,0.5) |
| :focus (非鼠标) | 同 :focus-visible |

### 动画偏好

```css
/* 尊重用户偏好 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 追溯关系

| DS ID | 映射 FR | 描述 |
| ----- | ------- | ---- |
| DS-WEBSITE-001 | FR-001~006 | 静态站点架构 |
| DS-WEBSITE-002 | FR-001 | Hero 组件 |
| DS-WEBSITE-003 | FR-002 | 功能特性卡片 |
| DS-WEBSITE-004 | FR-005 | 语言切换 |
| DS-WEBSITE-005 | FR-006 | 响应式布局 |
| DS-WEBSITE-006 | NFR-002 | SEO 配置 |
| DS-WEBSITE-007 | NFR-001 | 性能优化 |

---

## 风险与约束

### 技术约束

- 纯静态 HTML/CSS/JS，无服务端渲染
- GitHub Pages 不支持自定义服务器配置
- 双语内容需手动维护同步

### 缓解措施

| 风险 | 缓解 |
| ---- | ---- |
| 内容更新频繁 | 使用 Markdown + 脚本生成 HTML |
| 双语同步 | 建立翻译 checklist |

---

## 开放问题

| 问题 | 状态 | 优先级 |
| ---- | ---- | ------ |
| 是否需要暗色模式？ | Open | P2 |
| 分析工具选择？ | Open | P1 |
