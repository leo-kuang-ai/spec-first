# 系统架构（前端 Web）

> **模板类型**：frontend
> **适用项目**：React、Vue、Angular、Svelte 等 Web 前端项目

---

## 架构模式

### FSD（Feature-Sliced Design）层级

```
┌─────────────────────────────────────────────────────────────┐
│                         App / Pages                         │
│                   (页面、路由、布局)                          │
├─────────────────────────────────────────────────────────────┤
│                        Widgets                              │
│              (复合组件、可复用页面块)                         │
├─────────────────────────────────────────────────────────────┤
│                       Features                              │
│                   (业务功能模块)                             │
├─────────────────────────────────────────────────────────────┤
│                       Entities                              │
│                 (业务实体、通用组件)                          │
├─────────────────────────────────────────────────────────────┤
│                       Shared                                │
│            (UI 库、工具、配置、第三方集成)                     │
└─────────────────────────────────────────────────────────────┘
```

### MVVM / 组件树架构

```
App
├── Providers (状态管理 Context)
├── Layout (全局布局)
│   ├── Header
│   ├── Sidebar
│   └── Content
└── Pages
    ├── Dashboard
    │   ├── StatCard
    │   ├── ChartView
    │   └── RecentActivity
    └── Settings
        ├── ProfileForm
        └── SecurityPanel
```

## 状态管理

| 方案 | 适用场景 |
|------|----------|
| **Context API** | 中小型应用、局部状态 |
| **Redux Toolkit** | 大型应用、复杂状态 |
| **Zustand / Jotai** | 轻量级状态管理 |
| **Pinia** | Vue 3 推荐 |
| **MobX** | 响应式状态管理 |

## 数据流

```
用户交互 → Component Event
         → Action / Handler
         → State Update / API Call
         → Re-render / Response
         ← UI Update
```

## 路由结构

| 路由类型 | 说明 |
|----------|------|
| **静态路由** | `/dashboard`、`/settings` |
| **动态路由** | `/users/:id`、`/posts/:postId` |
| **嵌套路由** | `/admin/users/list` |
| **权限路由** | 需认证、需授权 |

## 组件通信

| 方式 | 父→子 | 子→父 | 兄弟 | 跨层级 |
|------|-------|-------|------|--------|
| **Props** | ✅ | ❌ | ❌ | ❌ |
| **Events** | ❌ | ✅ | ❌ | ❌ |
| **State** | ✅ | ✅ | ✅ | ✅ |
| **Expose** | ✅ | ✅ | ❌ | ❌ |
| **Provider** | ✅ | ✅ | ✅ | ✅ |

## 样式方案

| 方案 | 说明 |
|------|------|
| **CSS Modules** | 模块化 CSS |
| **Tailwind CSS** | 原子类 CSS |
| **CSS-in-JS** | styled-components / emotion |
| **Sass/SCSS** | CSS 预处理器 |
| **UnoCSS** | 原子化引擎 |

## 子类型差异

### Admin（后台管理）

- 特征：表格、表单、权限控制、多标签页
- UI 库：Ant Design、Element Plus、Arco Design
- 布局：Sidebar + Header + Content

### H5（移动 Web）

- 特征：响应式、触摸优化、移动端适配
- UI 库：Vant、NutUI、Mint UI
- 布局：单列、底部导航、下拉刷新
