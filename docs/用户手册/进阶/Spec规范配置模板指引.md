# Spec 规范配置模板指引

本文档用于指导团队如何为 `spec-first` 设计、组织和维护一套可复用的 spec 规范模板，包括：

- 项目内 `.spec-first/spec/` 如何组织
- 远程模板仓库如何设计
- `index.json` 如何配置
- 模板内容应该写什么，不应该写什么
- 初始化、使用、维护时的边界是什么

---

## 1. 目标

spec 模板的目标不是“放一堆 markdown”，而是给 AI 和开发者提供一套可执行、可读取、可维护的项目规范。

它解决的是：

- 新项目初始化时，快速生成一套规范骨架
- 团队内部沉淀统一的开发约定
- `before-dev`、`check` 等命令在运行时有稳定输入
- 不同项目可以复用同一套模板体系

一句话：

```text
spec 模板 = 项目开发知识层的初始化来源
```

---

## 2. 先分清三层

建议先把这三层概念分开：

```text
CLI 框架层
  -> 负责 init / update / hooks / commands / skills

spec 模板层
  -> 负责 .spec-first/spec/ 的初始内容

项目实例层
  -> 负责项目内真正落地后的 .spec-first/spec/
```

边界：

- 改 CLI，不等于改模板
- 改模板，不等于自动改所有项目实例
- 改项目实例，只影响当前项目

---

## 3. 推荐目录结构

### 3.1 单项目内的 `.spec-first/spec/`

推荐至少保留这三类：

```text
.spec-first/spec/
├─ backend/
│  ├─ index.md
│  ├─ directory-structure.md
│  ├─ error-handling.md
│  ├─ quality-guidelines.md
│  └─ ...
├─ frontend/
│  ├─ index.md
│  ├─ component-guidelines.md
│  ├─ state-management.md
│  ├─ type-safety.md
│  └─ ...
└─ guides/
   ├─ index.md
   ├─ cross-layer-thinking-guide.md
   └─ code-reuse-thinking-guide.md
```

说明：

- `backend/`、`frontend/`：写“怎么实现”
- `guides/`：写“写之前要想到什么”

### 3.2 monorepo 推荐结构

```text
.spec-first/spec/
├─ guides/
│  └─ *.md
├─ admin/
│  ├─ frontend/
│  └─ backend/
├─ mobile/
│  ├─ frontend/
│  └─ backend/
└─ api/
   └─ backend/
```

原则：

- `guides/` 放共享思考指南
- `spec/<package>/...` 放 package 专属规范

---

## 4. 模板仓库推荐结构

如果要独立维护远程模板，推荐使用 marketplace 模式：

```text
company-spec-registry/
├─ index.json
├─ specs/
│  ├─ admin-next/
│  │  └─ .spec-first/spec/...
│  ├─ backend-go-api/
│  │  └─ .spec-first/spec/...
│  ├─ mobile-kmp/
│  │  └─ .spec-first/spec/...
│  └─ desktop-electron/
│     └─ .spec-first/spec/...
└─ skills/
   └─ spec-meta/
```

如果只维护 spec 模板，不维护 skill，也可以没有 `skills/`。

---

## 5. `index.json` 配置规范

推荐最少包含这些字段：

```json
{
  "version": 1,
  "templates": [
    {
      "id": "admin-next",
      "type": "spec",
      "name": "Admin Web + Next.js",
      "description": "Admin web project spec template",
      "path": "specs/admin-next",
      "tags": ["admin", "next", "typescript"]
    }
  ]
}
```

字段说明：

- `id`
  - 模板唯一标识，命令行通过 `--template` 引用
- `type`
  - 当前常见是 `spec`
- `name`
  - 给用户看的名称
- `description`
  - 简短说明适用场景
- `path`
  - 模板在仓库中的目录路径
- `tags`
  - 用于分类和检索

命名建议：

```text
<场景>-<技术栈>
```

例如：

- `admin-next`
- `backend-go-api`
- `mobile-kmp`
- `desktop-electron`

---

## 6. 模板内容应该写什么

模板里不应该只是空标题，建议每个核心文件至少包含这 5 类内容：

1. 适用范围
2. 项目约定
3. 推荐模式
4. 反模式
5. 代码示例占位说明

例如 `backend/error-handling.md` 应该至少有：

```text
- 本项目错误处理原则
- 错误分层方式
- API 返回结构约定
- 记录日志的边界
- 常见错误写法 vs 正确写法
```

`frontend/component-guidelines.md` 应该至少有：

```text
- 组件拆分原则
- props 设计约定
- 状态放置边界
- 页面组件与业务组件的职责划分
- 不推荐写法
```

---

## 7. 模板里不应该写什么

不要把模板写成这几种东西：

- 纯口号
- 纯最佳实践堆砌
- 与项目无关的框架百科
- 没有边界条件的理想化规范

错误示例：

```text
请保持代码优雅
尽量使用最佳实践
组件要高内聚低耦合
```

这种内容对运行时注入几乎没帮助。

正确方向应该是：

```text
在本项目中，页面容器放在 xxx，纯展示组件放在 xxx。
接口错误统一通过 xxx 包装，禁止在 controller 直接返回裸错误。
```

---

## 8. 推荐的 index 文件写法

每个 layer 的 `index.md` 最好承担两个职责：

1. 概览本层规范
2. 给出 Pre-Development Checklist

例如：

```md
# Backend Spec Index

## 适用范围
适用于本项目所有后端实现任务。

## Pre-Development Checklist
- 本次是否涉及目录结构调整？
- 本次是否新增接口或修改返回结构？
- 本次是否涉及错误处理或日志规范？
- 本次是否需要补测试？

## 相关规范
- [目录结构](./directory-structure.md)
- [错误处理](./error-handling.md)
- [质量规范](./quality-guidelines.md)
```

这样 `before-dev` 读 `index.md` 时，能继续跳到真正的细则文档。

---

## 9. 初始化与使用方式

### 9.1 使用默认模板市场

```bash
spec-first init
```

### 9.2 使用指定远程模板市场

```bash
spec-first init --registry gh:your-org/company-spec-registry
```

### 9.3 使用指定模板

```bash
spec-first init --registry gh:your-org/company-spec-registry --template admin-next
```

### 9.4 direct download 模式

```bash
spec-first init --registry gh:your-org/company-spec-registry/specs/admin-next
```

---

## 10. 运行时是怎么消费 spec 的

关键点：

```text
before-dev / check
  -> 运行时读取当前项目里的 .spec-first/spec/
  -> 不是每次去远程仓库拉取
```

所以：

- 模板仓库影响“初始化来源”
- 项目里的 `.spec-first/spec/` 才是运行时真实输入

---

## 11. 推荐维护流程

推荐团队按这个流程维护：

```text
新增或修改模板
  -> 修改 specs/<template-id>/*
  -> 如有新增模板，同步更新 index.json
  -> code review
  -> git commit
  -> git push main
  -> 新项目通过 init --registry 拉取
```

项目接入后：

```text
init 拉模板
  -> bootstrap / 人工补齐项目真实规范
  -> before-dev / check 运行时读取本地 spec
  -> 发现新模式后通过 update-spec 或手工回写本地 spec
```

---

## 12. 公司级落地建议

如果是一家研发公司，建议按下面原则建设模板体系：

- 一套 CLI 主仓库
- 一套独立 spec 模板仓库
- 模板按场景拆分，不按人拆分
- `index.json` 做统一发现入口
- 每个模板都要有明确适用范围
- 每个核心规范文件都要有反模式和边界说明
- 项目落地后允许本地继续演进，不强求与远程模板强同步

---

## 13. 最终建议

最佳实践可以压缩成一句话：

```text
模板负责提供“好的起点”，项目实例负责沉淀“真实规范”。
```
