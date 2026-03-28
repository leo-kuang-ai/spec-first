# spec-first Spec 模板使用指南

> 本文档详细介绍如何使用、创建和分享 Spec 模板，帮助你快速启动规范驱动的开发工作流。

---

## 目录

- [快速开始](#快速开始)
- [模板概述](#模板概述)
- [使用模板](#使用模板)
- [Marketplace](#marketplace)
- [企业内部模板定制](#企业内部模板定制) ⭐ 重点
- [创建自定义模板](#创建自定义模板)
- [发布与分享](#发布与分享)
- [模板维护](#模板维护)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 快速开始

### 30 秒上手

```bash
# 1. 使用官方模板初始化项目
spec-first init -u your-name -t react-ts

# 2. 查看生成的 Spec 文件
ls .spec-first/spec/

# 3. 开始开发
# Spec 会自动注入到你的 AI 会话中
```

### 选择模板的快速参考

| 你的项目类型 | 推荐模板 | 命令 |
|-------------|---------|------|
| React + TypeScript | `react-ts` | `spec-first init -u name -t react-ts` |
| Vue 3 + TypeScript | `vue3-ts` | `spec-first init -u name -t vue3-ts` |
| Next.js 全栈 | `nextjs` | `spec-first init -u name -t nextjs` |
| Node.js API | `express-ts` | `spec-first init -u name -t express-ts` |
| NestJS | `nestjs` | `spec-first init -u name -t nestjs` |
| Python FastAPI | `fastapi` | `spec-first init -u name -t fastapi` |
| Electron 桌面 | `electron` | `spec-first init -u name -t electron` |

---

## 模板概述

### 什么是 Spec 模板？

Spec 模板是**预定义的规范文件集合**，包含特定技术栈或场景的最佳实践。

```
模板结构示例/
├── template.json           # 模板元信息（必需）
├── README.md               # 模板说明文档
└── spec/                   # Spec 文件目录
    ├── coding-standards.md # 编码规范
    ├── architecture.md     # 架构指南
    ├── api-design.md       # API 设计规范
    └── testing.md          # 测试规范
```

### 为什么使用模板？

| 优势 | 说明 |
|------|------|
| **快速启动** | 无需从零编写 Spec，开箱即用 |
| **最佳实践** | 包含社区验证的规范和经验 |
| **团队一致性** | 团队使用相同模板保持风格统一 |
| **可定制** | 基于模板进行个性化调整 |
| **持续更新** | 模板可以更新，获取最新实践 |

### 模板 vs 手写 Spec

| 对比项 | 手写 Spec | 使用模板 |
|--------|----------|----------|
| 启动速度 | 慢（需要从零开始） | 快（开箱即用） |
| 规范质量 | 取决于个人经验 | 社区验证的最佳实践 |
| 维护成本 | 高（需要自己维护） | 低（跟随模板更新） |
| 定制灵活性 | 高 | 中（基于模板调整） |

---

## 使用模板

### 基本命令

```bash
# 查看可用模板列表
spec-first init --list-templates

# 使用指定模板初始化
spec-first init -u <用户名> -t <模板名>

# 示例：使用 React TypeScript 模板
spec-first init -u zhangsan -t react-ts
```

### 从远程仓库使用模板

```bash
# 从 GitHub 仓库（推荐格式）
spec-first init -u your-name \
  --registry gh:your-org/spec-templates \
  -t my-template

# 从完整 Git URL
spec-first init -u your-name \
  --registry https://github.com/your-org/spec-templates.git \
  -t my-template

# 从本地目录（开发测试用）
spec-first init -u your-name \
  --registry /path/to/local/templates \
  -t my-template
```

### 模板选项详解

| 选项 | 简写 | 说明 | 示例 |
|------|------|------|------|
| `--template` | `-t` | 指定模板名称 | `-t react-ts` |
| `--registry` | `-r` | 模板仓库地址 | `-r gh:org/repo` |
| `--overwrite` | | 覆盖现有 Spec 文件 | `--overwrite` |
| `--append` | | 仅添加缺失文件，保留现有 | `--append` |

### 使用场景

#### 场景 1：新项目初始化

```bash
# 创建新项目目录
mkdir my-react-app && cd my-react-app

# 使用模板初始化
spec-first init -u developer -t react-ts --cursor

# 结果：
# - 生成 .spec-first/spec/ 目录
# - 包含 React + TypeScript 的规范文件
# - 生成 .cursor/ 配置
```

#### 场景 2：现有项目添加规范

```bash
cd existing-project

# 使用 --append 保留现有文件
spec-first init -u developer -t express-ts --append

# 结果：
# - 保留现有的 .spec-first/spec/ 文件
# - 只添加缺失的规范文件
```

#### 场景 3：从团队模板仓库初始化

```bash
# 使用团队维护的模板仓库
spec-first init -u developer \
  --registry gh:mycompany/spec-templates \
  -t company-standard \
  --claude --cursor
```

---

## Marketplace

### 什么是 Marketplace？

Marketplace 是 spec-first 的**官方模板市场**，汇集了社区贡献的高质量模板。

```
Marketplace 结构/
├── 官方模板/          # spec-first 团队维护
│   ├── react-ts
│   ├── vue3-ts
│   ├── nextjs
│   └── ...
├── 社区模板/          # 社区贡献
│   ├── svelte-kit
│   ├── remix
│   └── ...
└── 企业模板/          # 企业内部仓库
    └── (私有仓库)
```

### 浏览和搜索模板

```bash
# 列出所有可用模板
spec-first marketplace list

# 按关键词搜索
spec-first marketplace search react
spec-first marketplace search api
spec-first marketplace search typescript

# 查看模板详细信息
spec-first marketplace info react-ts
```

### 模板分类

| 分类 | 说明 | 推荐模板 |
|------|------|----------|
| **前端框架** | React, Vue, Angular 等 | `react-ts`, `vue3-ts`, `angular` |
| **全栈框架** | Next.js, Nuxt, Remix | `nextjs`, `nuxt3`, `remix` |
| **后端框架** | Express, NestJS, FastAPI | `express-ts`, `nestjs`, `fastapi` |
| **移动端** | React Native, Flutter | `react-native`, `flutter` |
| **桌面应用** | Electron, Tauri | `electron`, `tauri` |
| **微服务** | gRPC, GraphQL | `grpc-go`, `graphql` |

### 模板详情解读

执行 `spec-first marketplace info react-ts` 会显示：

```
模板名称: react-ts
版本: 1.2.0
作者: spec-first-team
下载量: 1,234

描述:
React + TypeScript 项目规范模板，包含编码标准、组件设计、测试规范。

包含文件:
- spec/coding-standards.md    # TypeScript 编码规范
- spec/component-design.md    # 组件设计指南
- spec/testing.md             # 测试规范
- spec/review-checklist.md    # 代码审查清单

适用场景:
- React 18+ 项目
- TypeScript 5.0+
- 中大型前端项目

使用命令:
spec-first init -u your-name -t react-ts
```

---

## 企业内部模板定制

> 本章节重点介绍企业如何搭建内部模板体系，实现团队规范统一和高效协作。

### 为什么需要企业内部模板？

| 痛点 | 企业内部模板的解决方案 |
|------|------------------------|
| 每个项目规范不统一 | 统一的企业标准模板 |
| 新项目启动慢 | 开箱即用的模板库 |
| 代码审查标准不一 | 嵌入审查清单的模板 |
| 技术债务积累 | 规范持续迭代更新 |
| 新人上手困难 | 规范即文档 |

### 企业模板体系架构

```
企业 Spec 模板仓库/
├── README.md                      # 使用指南
├── templates/                     # 模板目录
│   ├── base/                      # 基础模板
│   │   ├── template.json
│   │   └── spec/
│   ├── frontend/                  # 前端模板
│   │   ├── react/
│   │   ├── vue/
│   │   └── mobile/
│   ├── backend/                   # 后端模板
│   │   ├── nodejs/
│   │   ├── java/
│   │   └── python/
│   └── fullstack/                 # 全栈模板
│       └── nextjs/
├── shared/                        # 共享 Spec 片段
│   ├── api-standards.md
│   ├── security-rules.md
│   └── testing-guidelines.md
├── docs/                          # 文档
│   ├── contributing.md
│   └── template-guide.md
└── scripts/                       # 辅助脚本
    ├── validate-template.sh
    └── sync-shared-specs.sh
```

---

### 第一步：搭建企业模板仓库

#### 1.1 创建仓库

**GitHub Enterprise:**

```bash
# 创建企业模板仓库
gh repo create mycompany/spec-templates --private \
  --description "企业内部 Spec 模板仓库"

# 克隆仓库
git clone git@github.enterprise.com:mycompany/spec-templates.git
cd spec-templates
```

**GitLab (私有部署):**

```bash
# 在 GitLab 创建项目后克隆
git clone https://gitlab.company.com/tech-team/spec-templates.git
cd spec-templates
```

**Gitee (国内企业):**

```bash
# Gitee 企业版
git clone https://gitee.company.com/tech-team/spec-templates.git
cd spec-templates
```

#### 1.2 初始化仓库结构

```bash
# 创建目录结构
mkdir -p templates/{base,frontend/{react,vue,mobile},backend/{nodejs,java,python},fullstack/nextjs}
mkdir -p shared docs scripts

# 创建基础文件
touch README.md
touch templates/base/template.json
touch shared/{api-standards,security-rules,testing-guidelines}.md
```

---

### 第二步：定义企业级基础规范

#### 2.1 基础模板 template.json

```json
{
  "name": "company-base",
  "version": "1.0.0",
  "description": "企业基础规范模板 - 所有项目的基础",
  "author": "Tech Team",
  "company": "MyCompany",
  "tags": ["base", "company-standard"],
  "spec-first": ">=1.0.0",
  "files": [
    "spec/coding-standards.md",
    "spec/git-workflow.md",
    "spec/code-review.md",
    "spec/security.md",
    "spec/testing.md"
  ],
  "variables": {
    "projectName": {
      "description": "项目名称",
      "required": true
    },
    "team": {
      "description": "所属团队",
      "default": "default"
    },
    "techLead": {
      "description": "技术负责人",
      "required": true
    }
  }
}
```

#### 2.2 企业编码规范示例

**spec/coding-standards.md:**

```markdown
# 企业编码规范

> 本规范适用于公司所有项目，团队可在基础上扩展。

## 通用原则

### 代码质量三要素
1. **可读性**: 代码是写给人看的，顺便让机器执行
2. **可维护性**: 6 个月后的你也是新人
3. **可测试性**: 不可测试的代码是不可信任的

---

## 命名规范

### 通用命名规则

| 类型 | 规范 | 示例 | 说明 |
|------|------|------|------|
| 变量/函数 | camelCase | `getUserInfo` | 驼峰命名 |
| 类/接口/类型 | PascalCase | `UserService` | 大驼峰 |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` | 全大写+下划线 |
| 文件名 | kebab-case | `user-service.ts` | 小写+连字符 |
| 目录名 | kebab-case | `user-management/` | 小写+连字符 |

### 禁止的命名

```typescript
// ❌ 禁止
let data;           // 太泛
let temp;           // 无意义
let flag;           // 不明确
let list1, list2;   // 数字后缀
let obj;            // 类型作为名称

// ✅ 正确
let userProfile;
let pendingOrders;
let isActive;
let userAddressList;
let shippingAddress;
```

---

## 注释规范

### 必须注释的场景

1. **公共 API** - 函数、类、接口
2. **复杂算法** - 解释"为什么"而非"是什么"
3. **业务规则** - 解释业务逻辑
4. **临时方案** - TODO/FIXME + Issue 链接

### JSDoc 格式

```typescript
/**
 * 获取用户订单列表
 *
 * @param userId - 用户 ID
 * @param options - 查询选项
 * @param options.page - 页码，从 1 开始
 * @param options.pageSize - 每页数量，默认 20
 * @returns 订单列表
 * @throws {NotFoundError} 用户不存在
 * @throws {PermissionError} 无权限查看
 *
 * @example
 * const orders = await getUserOrders('user-123', { page: 1, pageSize: 10 });
 */
async function getUserOrders(
  userId: string,
  options: { page: number; pageSize?: number }
): Promise<Order[]> {
  // 实现...
}
```

### TODO/FIXME 格式

```typescript
// TODO(@zhangsan): 需要添加缓存支持 #123
// FIXME(@lisi): 并发场景下有竞态条件 #456
// HACK: 临时方案，等待下游 API 更新后移除
```

---

## 错误处理规范

### 统一错误类型

```typescript
// 企业标准错误类型
enum ErrorCode {
  // 通用错误 1xxx
  UNKNOWN = 1000,
  INVALID_PARAM = 1001,
  UNAUTHORIZED = 1002,
  FORBIDDEN = 1003,
  NOT_FOUND = 1004,

  // 业务错误 2xxx
  USER_NOT_FOUND = 2001,
  ORDER_EXPIRED = 2002,

  // 系统错误 5xxx
  DATABASE_ERROR = 5001,
  EXTERNAL_API_ERROR = 5002,
}

class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}
```

### 错误处理模式

```typescript
// ✅ 正确：统一错误处理
async function handleRequest(req: Request): Promise<Response> {
  try {
    const result = await processRequest(req);
    return { code: 0, data: result, message: 'success' };
  } catch (error) {
    logger.error('Request failed', { req, error });

    if (error instanceof AppError) {
      return { code: error.code, data: null, message: error.message };
    }

    return { code: ErrorCode.UNKNOWN, data: null, message: '服务器错误' };
  }
}

// ❌ 错误：吞掉错误
try {
  await doSomething();
} catch (e) {
  // 什么都不做
}
```

---

## 日志规范

### 日志级别

| 级别 | 场景 | 示例 |
|------|------|------|
| DEBUG | 开发调试 | `logger.debug('Processing item', { id })` |
| INFO | 关键业务节点 | `logger.info('Order created', { orderId })` |
| WARN | 潜在问题 | `logger.warn('Retry attempt', { count })` |
| ERROR | 错误但可恢复 | `logger.error('API call failed', { error })` |
| FATAL | 系统不可用 | `logger.fatal('Database connection lost')` |

### 日志格式

```typescript
// 统一日志格式
logger.info('操作描述', {
  // 上下文信息
  userId: 'user-123',
  action: 'create_order',

  // 业务数据
  orderId: 'order-456',
  amount: 99.9,

  // 追踪信息
  traceId: 'trace-789',
  duration: 150, // ms
});
```

---

## 安全规范

### 禁止硬编码敏感信息

```typescript
// ❌ 禁止
const dbPassword = 'password123';
const apiKey = 'sk-xxxxx';

// ✅ 正确：使用环境变量
const dbPassword = process.env.DB_PASSWORD;
const apiKey = process.env.API_KEY;
```

### 输入验证

```typescript
// 所有外部输入必须验证
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
});

function createUser(input: unknown) {
  const validated = UserSchema.parse(input); // 验证失败会抛出错误
  // 使用 validated...
}
```

---

## 测试规范

### 测试覆盖率要求

| 类型 | 最低覆盖率 | 目标覆盖率 |
|------|-----------|-----------|
| 核心业务逻辑 | 80% | 90% |
| 工具函数 | 90% | 100% |
| UI 组件 | 60% | 80% |
| API 端点 | 80% | 90% |

### 测试命名规范

```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when user exists', () => {
      // ...
    });

    it('should throw NotFoundError when user not exists', () => {
      // ...
    });

    it('should throw InvalidParamError when id is invalid', () => {
      // ...
    });
  });
});
```
```

#### 2.3 Git 工作流规范

**spec/git-workflow.md:**

```markdown
# Git 工作流规范

## 分支策略

### 分支类型

| 分支类型 | 命名规范 | 说明 | 生命周期 |
|----------|----------|------|----------|
| main/master | `main` | 生产环境代码 | 永久 |
| develop | `develop` | 开发集成分支 | 永久 |
| feature | `feature/<ticket>-<desc>` | 功能开发 | 合并后删除 |
| bugfix | `bugfix/<ticket>-<desc>` | Bug 修复 | 合并后删除 |
| hotfix | `hotfix/<ticket>-<desc>` | 紧急修复 | 合并后删除 |
| release | `release/<version>` | 发布准备 | 合并后删除 |

### 分支示例

```bash
# 功能分支
feature/PROJ-123-user-authentication
feature/PROJ-456-payment-integration

# Bug 修复
bugfix/PROJ-789-login-timeout

# 紧急修复
hotfix/PROJ-999-security-patch

# 发布分支
release/1.2.0
```

---

## Commit 规范

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | `feat(auth): add OAuth2 login` |
| fix | Bug 修复 | `fix(api): handle timeout error` |
| docs | 文档更新 | `docs: update README` |
| style | 代码格式 | `style: fix indentation` |
| refactor | 重构 | `refactor(user): extract validation logic` |
| test | 测试 | `test(auth): add unit tests` |
| chore | 构建/工具 | `chore: update dependencies` |

### 完整示例

```bash
feat(order): 添加订单取消功能

- 支持用户主动取消未支付订单
- 支持系统自动取消超时订单
- 取消后自动退款

Closes #123
```

---

## PR 规范

### PR 标题格式

```
[<type>] <ticket>: <description>
```

示例：
```
[feat] PROJ-123: 添加用户登录功能
[fix] PROJ-456: 修复订单金额计算错误
```

### PR 描述模板

```markdown
## 变更说明
<!-- 简要描述本次变更的内容 -->

## 变更类型
- [ ] 新功能 (feature)
- [ ] Bug 修复 (bugfix)
- [ ] 重构 (refactor)
- [ ] 文档 (docs)
- [ ] 其他: ___

## 测试情况
- [ ] 已添加单元测试
- [ ] 已添加集成测试
- [ ] 已手动测试

## 检查清单
- [ ] 代码符合编码规范
- [ ] 没有引入新的警告
- [ ] 更新了相关文档
- [ ] 通过了 CI 检查

## 截图/演示
<!-- 如有 UI 变更，附上截图 -->

## 关联 Issue
Closes #
```
```

---

### 第三步：创建业务线专用模板

#### 3.1 前端模板示例

**templates/frontend/react/template.json:**

```json
{
  "name": "company-react",
  "version": "1.0.0",
  "description": "企业 React 项目模板",
  "extends": "company-base",
  "author": "Frontend Team",
  "tags": ["react", "typescript", "frontend", "company"],
  "spec-first": ">=1.0.0",
  "files": [
    "spec/coding-standards.md",
    "spec/git-workflow.md",
    "spec/code-review.md",
    "spec/security.md",
    "spec/testing.md",
    "spec/react-standards.md",
    "spec/component-design.md",
    "spec/state-management.md"
  ]
}
```

**spec/react-standards.md:**

```markdown
# React 开发规范

## 组件设计原则

### 组件分类

| 类型 | 命名后缀 | 职责 | 示例 |
|------|----------|------|------|
| 页面组件 | `Page` | 路由页面 | `UserListPage` |
| 容器组件 | `Container` | 数据获取 | `UserListContainer` |
| 展示组件 | 无后缀 | 纯展示 | `UserCard` |
| UI 组件 | 无后缀 | 通用 UI | `Button`, `Input` |

### 组件结构

```typescript
// 组件文件结构
UserCard/
├── index.ts           # 导出
├── UserCard.tsx       # 组件实现
├── UserCard.styles.ts # 样式
├── UserCard.types.ts  # 类型定义
├── UserCard.test.tsx  # 测试
└── UserCard.hooks.ts  # 自定义 hooks（可选）
```

### Hooks 规范

```typescript
// ✅ 自定义 Hook 命名以 use 开头
function useUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  return { users, loading };
}

// ✅ 在组件中使用
function UserListPage() {
  const { users, loading } = useUserList();
  // ...
}
```

### 状态管理选择

| 场景 | 推荐方案 |
|------|----------|
| 组件内状态 | `useState` |
| 跨组件共享 | Context + `useReducer` |
| 服务端状态 | React Query / SWR |
| 全局状态 | Zustand / Redux Toolkit |
```

#### 3.2 后端模板示例

**templates/backend/nodejs/template.json:**

```json
{
  "name": "company-nodejs",
  "version": "1.0.0",
  "description": "企业 Node.js API 模板",
  "extends": "company-base",
  "author": "Backend Team",
  "tags": ["nodejs", "typescript", "api", "company"],
  "spec-first": ">=1.0.0",
  "files": [
    "spec/coding-standards.md",
    "spec/git-workflow.md",
    "spec/code-review.md",
    "spec/security.md",
    "spec/testing.md",
    "spec/api-design.md",
    "spec/database.md",
    "spec/error-handling.md"
  ]
}
```

---

### 第四步：共享 Spec 片段

#### 4.1 共享 API 标准

**shared/api-standards.md:**

```markdown
# API 标准规范

> 本文件可被多个模板引用，保持 API 规范一致。

## 统一响应格式

### 成功响应

```json
{
  "code": 0,
  "data": { ... },
  "message": "success",
  "timestamp": 1704067200000,
  "traceId": "abc123"
}
```

### 错误响应

```json
{
  "code": 1001,
  "data": null,
  "message": "参数错误",
  "timestamp": 1704067200000,
  "traceId": "abc123",
  "errors": [
    { "field": "email", "message": "邮箱格式不正确" }
  ]
}
```

## 错误码规划

| 范围 | 类别 | 示例 |
|------|------|------|
| 0 | 成功 | 0 |
| 1000-1999 | 通用错误 | 1001 参数错误 |
| 2000-2999 | 用户相关 | 2001 用户不存在 |
| 3000-3999 | 订单相关 | 3001 订单已取消 |
| 4000-4999 | 支付相关 | 4001 支付失败 |
| 5000-5999 | 系统错误 | 5001 数据库错误 |

## 分页格式

```json
{
  "code": 0,
  "data": {
    "list": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```
```

#### 4.2 同步脚本

**scripts/sync-shared-specs.sh:**

```bash
#!/bin/bash

# 同步共享 Spec 到各模板

SHARED_DIR="shared"
TEMPLATES=$(find templates -name "template.json" -exec dirname {} \;)

for template_dir in $TEMPLATES; do
  spec_dir="$template_dir/spec"

  # 创建符号链接或复制
  for shared_file in $SHARED_DIR/*.md; do
    filename=$(basename "$shared_file")
    target="$spec_dir/$filename"

    if [ ! -e "$target" ]; then
      echo "Copying $filename to $template_dir"
      cp "$shared_file" "$target"
    fi
  done
done

echo "Sync completed!"
```

---

### 第五步：团队协作流程

#### 5.1 模板更新流程

```
┌─────────────────┐
│  发现规范问题   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  提交 Issue     │────▶│  讨论解决方案   │
└─────────────────┘     └────────┬────────┘
                                 │
         ┌───────────────────────┘
         ▼
┌─────────────────┐
│  修改模板文件   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  提交 PR        │────▶│  Code Review    │
└─────────────────┘     └────────┬────────┘
                                 │
         ┌───────────────────────┘
         ▼
┌─────────────────┐
│  合并 + 发版    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  通知团队更新   │
└─────────────────┘
```

#### 5.2 版本通知模板

```markdown
# Spec 模板更新通知 v1.2.0

## 更新内容

### 新增
- 新增 API 限流规范
- 新增日志脱敏规则

### 变更
- 更新错误码规划（新增 6000-6999 消息队列相关）
- 调整测试覆盖率要求（核心业务 80% → 85%）

### 修复
- 修复命名规范中的示例错误

## 升级指南

```bash
# 更新模板
spec-first init -u your-name \
  --registry git@gitlab.company.com:tech-team/spec-templates.git \
  -t company-base \
  --overwrite
```

## 影响范围
- 所有新项目将使用新规范
- 现有项目建议在下次迭代时更新

## 生效日期
2024-02-01
```

---

### 第六步：CI/CD 集成

#### 6.1 模板验证 CI

**.gitlab-ci.yml (GitLab):**

```yaml
stages:
  - validate
  - test
  - publish

validate-templates:
  stage: validate
  image: node:18
  script:
    - npm install -g spec-first
    - |
      for template in templates/*/; do
        echo "Validating $template"
        spec-first validate-template "$template"
      done
  rules:
    - changes:
      - templates/**/*

test-templates:
  stage: test
  image: node:18
  script:
    - npm install -g spec-first
    - |
      for template in templates/*/; do
        name=$(basename "$template")
        echo "Testing $name"
        mkdir -p "/tmp/test-$name"
        cd "/tmp/test-$name"
        spec-first init -u test \
          --registry "$CI_PROJECT_DIR" \
          -t "$name"
        ls -la .spec-first/spec/
      done
  rules:
    - changes:
      - templates/**/*

publish-docs:
  stage: publish
  image: node:18
  script:
    - npm run generate-docs
    - npm run deploy-docs
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

**.github/workflows/validate.yml (GitHub):**

```yaml
name: Validate Templates

on:
  push:
    paths:
      - 'templates/**'
      - 'shared/**'
  pull_request:
    paths:
      - 'templates/**'
      - 'shared/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install spec-first
        run: npm install -g spec-first

      - name: Validate all templates
        run: |
          for template in templates/*/; do
            echo "Validating $template"
            spec-first validate-template "$template" || exit 1
          done

      - name: Test templates
        run: |
          for template in templates/*/; do
            name=$(basename "$template")
            echo "Testing $name"
            mkdir -p "/tmp/test-$name"
            cd "/tmp/test-$name"
            spec-first init -u test \
              --registry "${{ github.workspace }}" \
              -t "$name" || exit 1
          done
```

---

### 第七步：团队使用指南

#### 7.1 新项目初始化

```bash
# 1. 克隆企业模板仓库（首次）
git clone git@gitlab.company.com:tech-team/spec-templates.git
cd spec-templates

# 2. 在新项目中使用模板
cd /path/to/new-project
spec-first init -u zhangsan \
  --registry git@gitlab.company.com:tech-team/spec-templates.git \
  -t company-react \
  --cursor --claude

# 3. 查看生成的规范
ls .spec-first/spec/

# 4. 根据项目需要微调
# 编辑 .spec-first/spec/ 中的文件
```

#### 7.2 现有项目接入

```bash
cd /path/to/existing-project

# 使用 --append 保留现有规范
spec-first init -u zhangsan \
  --registry git@gitlab.company.com:tech-team/spec-templates.git \
  -t company-nodejs \
  --append

# 检查新增的规范
git diff .spec-first/spec/
```

#### 7.3 模板更新

```bash
# 检查模板版本
cat .spec-first/.template-version

# 更新到最新版本
spec-first init -u zhangsan \
  --registry git@gitlab.company.com:tech-team/spec-templates.git \
  -t company-base \
  --overwrite

# 或使用更新命令
spec-first template update company-base
```

---

### 企业模板管理检查清单

#### 初始化阶段

- [ ] 创建企业模板仓库（私有）
- [ ] 定义基础规范模板
- [ ] 定义业务线专用模板
- [ ] 设置 CI/CD 验证
- [ ] 编写使用文档

#### 日常维护

- [ ] 定期审查规范（每季度）
- [ ] 收集团队反馈
- [ ] 更新模板版本
- [ ] 通知团队更新

#### 团队推广

- [ ] 组织培训会议
- [ ] 编写最佳实践文档
- [ ] 建立问题反馈渠道
- [ ] 定期分享成功案例

---

## 创建自定义模板

### 创建步骤

#### 第 1 步：创建模板目录

```bash
# 创建模板目录结构
mkdir -p my-template/spec
cd my-template
```

#### 第 2 步：编写 template.json

```json
{
  "name": "my-template",
  "version": "1.0.0",
  "description": "我的自定义 Spec 模板",
  "author": "your-name",
  "license": "MIT",
  "tags": ["typescript", "nodejs", "api", "express"],
  "spec-first": ">=1.0.0",
  "files": [
    "spec/coding-standards.md",
    "spec/architecture.md",
    "spec/api-design.md",
    "spec/testing.md",
    "spec/review-checklist.md"
  ],
  "variables": {
    "projectName": {
      "description": "项目名称",
      "default": "my-project"
    },
    "author": {
      "description": "作者名称",
      "default": ""
    }
  }
}
```

#### 第 3 步：编写 Spec 文件

**spec/coding-standards.md**:

```markdown
# 编码规范

## TypeScript 配置

- 启用严格模式 (`strict: true`)
- 启用 nullish 检查 (`strictNullChecks: true`)
- 禁用隐式 any (`noImplicitAny: true`)

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `getUserInfo` |
| 类/接口/类型 | PascalCase | `UserService` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 文件名 | kebab-case | `user-service.ts` |

## 代码风格

- 使用 2 空格缩进
- 使用单引号
- 语句末尾不加分号
- 最大行宽 100 字符

## 注释规范

```typescript
/**
 * 获取用户信息
 * @param userId - 用户 ID
 * @returns 用户信息对象
 * @throws {NotFoundError} 用户不存在时抛出
 */
function getUserInfo(userId: string): UserInfo {
  // 实现...
}
```
```

**spec/api-design.md**:

```markdown
# API 设计规范

## RESTful 端点命名

- 使用名词复数: `/users`, `/orders`
- 使用小写和连字符: `/user-profiles`
- 避免嵌套超过 2 层: `/users/{id}/orders` ✓

## 统一响应格式

### 成功响应

```json
{
  "code": 0,
  "data": {
    // 响应数据
  },
  "message": "success"
}
```

### 错误响应

```json
{
  "code": 1001,
  "data": null,
  "message": "用户不存在"
}
```

## HTTP 状态码使用

| 状态码 | 场景 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |
```

#### 第 4 步：编写 README.md

```markdown
# my-template

My custom spec template for Node.js API projects.

## 适用场景

- Node.js 后端项目
- Express / Fastify 框架
- TypeScript 5.0+
- RESTful API 服务

## 包含内容

| 文件 | 说明 |
|------|------|
| `coding-standards.md` | TypeScript 编码规范 |
| `architecture.md` | 项目架构指南 |
| `api-design.md` | RESTful API 设计规范 |
| `testing.md` | 单元测试和集成测试规范 |
| `review-checklist.md` | 代码审查清单 |

## 使用方法

```bash
# 从本地使用
spec-first init -u your-name \
  --registry /path/to/my-template \
  -t my-template

# 从 GitHub 使用
spec-first init -u your-name \
  --registry gh:your-username/my-template \
  -t my-template
```

## 定制建议

1. 根据团队习惯调整命名规范
2. 添加项目特定的业务规则
3. 调整测试覆盖率要求
4. 添加数据库操作规范

## 版本历史

- 1.0.0 (2024-01-15): 初始版本
```

#### 第 5 步：测试模板

```bash
# 创建测试项目
mkdir test-project && cd test-project

# 使用本地模板初始化
spec-first init -u test \
  --registry /path/to/my-template \
  -t my-template

# 检查生成的文件
ls -la .spec-first/spec/
cat .spec-first/spec/coding-standards.md
```

### 完整模板示例

```
my-template/
├── template.json
├── README.md
└── spec/
    ├── coding-standards.md
    ├── architecture.md
    ├── api-design.md
    ├── testing.md
    ├── review-checklist.md
    └── database.md
```

---

## 发布与分享

### 发布到 GitHub

#### 第 1 步：创建仓库

```bash
# 初始化 Git 仓库
cd my-template
git init
git add .
git commit -m "Initial template"

# 创建 GitHub 仓库并推送
gh repo create my-spec-template --public
git push -u origin main
```

#### 第 2 步：添加发布标签

```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0
```

#### 第 3 步：分享使用方法

其他人可以这样使用你的模板：

```bash
spec-first init -u user \
  --registry gh:your-username/my-spec-template \
  -t my-template
```

### 发布到官方 Marketplace

#### 第 1 步：Fork 仓库

```bash
# Fork spec-first 仓库
gh repo fork sunrain520/spec-first --clone
cd spec-first
```

#### 第 2 步：添加模板

```bash
# 创建模板目录
mkdir -p marketplace/templates/my-template

# 复制模板文件
cp -r /path/to/my-template/* marketplace/templates/my-template/
```

#### 第 3 步：提交 PR

```bash
git checkout -b add-my-template
git add marketplace/templates/my-template/
git commit -m "feat: add my-template to marketplace"
git push origin add-my-template

# 在 GitHub 上创建 Pull Request
gh pr create --title "Add my-template to marketplace" \
  --body "This template provides..."
```

### 企业内部模板仓库

```bash
# 创建私有模板仓库
# 企业内部 GitLab / GitHub Enterprise

# 使用方法
spec-first init -u user \
  --registry https://gitlab.company.com/spec-templates.git \
  -t company-standard
```

---

## 模板维护

### 版本管理

使用**语义化版本**管理模板：

| 版本类型 | 说明 | 示例 |
|----------|------|------|
| **主版本 (MAJOR)** | 不兼容的变更 | 1.0.0 → 2.0.0 |
| **次版本 (MINOR)** | 新增功能，向后兼容 | 1.0.0 → 1.1.0 |
| **修订版本 (PATCH)** | Bug 修复 | 1.0.0 → 1.0.1 |

### 更新流程

```bash
# 1. 修改模板文件
vim spec/coding-standards.md

# 2. 更新版本号
# 编辑 template.json 中的 version

# 3. 提交变更
git add .
git commit -m "feat: add new coding standards"

# 4. 创建新标签
git tag v1.1.0
git push origin main --tags
```

### 用户更新模板

```bash
# 检查模板更新
spec-first template check-updates

# 更新到最新版本
spec-first template update my-template

# 更新到指定版本
spec-first template update my-template --version 1.1.0
```

### 废弃模板

当模板不再维护时：

```json
// template.json
{
  "name": "old-template",
  "version": "1.0.0",
  "deprecated": true,
  "deprecationMessage": "请使用 new-template 替代",
  "migrationGuide": "https://github.com/.../migration.md"
}
```

---

## 最佳实践

### 1. 模板内容原则

#### ✅ 好的做法

```markdown
# 编码规范

## 错误处理
- 使用 try-catch 捕获异步错误
- 统一使用项目定义的错误类型
- 记录完整的错误堆栈

## API 响应
- 使用统一的响应格式
- 包含请求 ID 便于追踪
```

#### ❌ 不好的做法

```markdown
# 编码规范

## 错误处理
- 使用 try-catch
- 错误类型: DatabaseError, NetworkError, ValidationError
- 错误码: 1001-1999 数据库错误, 2001-2999 网络错误
- 日志格式: [时间] [级别] [模块] 消息
- ...（过于具体，不具通用性）
```

### 2. 提供清晰的适用场景

```markdown
## 适用场景
✅ TypeScript 5.0+ 项目
✅ Node.js 18+ 后端
✅ Express / Fastify 框架
✅ 中大型团队协作

## 不适用场景
❌ 纯 JavaScript 项目
❌ 前端项目
❌ 微服务架构（需要拆分）
```

### 3. 提供示例代码

```markdown
## 统一错误处理示例

```typescript
// ✅ 正确做法
try {
  const user = await userService.getById(userId);
  return res.json({ code: 0, data: user });
} catch (error) {
  logger.error('获取用户失败', { userId, error });
  if (error instanceof NotFoundError) {
    return res.status(404).json({ code: 1001, message: '用户不存在' });
  }
  return res.status(500).json({ code: 5000, message: '服务器错误' });
}

// ❌ 错误做法
try {
  // ...
} catch (e) {
  res.send('error');  // 格式不统一
}
```
```

### 4. 保持模板精简

- **核心规范**: 5-7 个文件
- **每个文件**: 100-300 行
- **总大小**: < 50KB

### 5. 定期更新

- 每季度审查一次
- 跟进技术栈更新
- 收集用户反馈

---

## 常见问题

### Q1: 如何选择合适的模板？

**A**: 根据项目类型选择：

```bash
# 查看模板详情
spec-first marketplace info <template-name>

# 对比多个模板
spec-first marketplace compare react-ts vue3-ts
```

### Q2: 模板和现有 Spec 冲突怎么办？

**A**: 使用 `--append` 选项：

```bash
# 保留现有 Spec，只添加缺失文件
spec-first init -u user -t react-ts --append
```

### Q3: 如何定制模板？

**A**: 两种方式：

1. **直接修改**: 初始化后修改 `.spec-first/spec/` 文件
2. **Fork 模板**: 复制模板到本地，修改后使用

### Q4: 模板更新后如何同步？

**A**:

```bash
# 检查更新
spec-first template check-updates

# 更新（会提示覆盖确认）
spec-first template update react-ts
```

### Q5: 如何创建企业内部模板？

**A**:

1. 创建私有 Git 仓库
2. 按模板结构添加文件
3. 团队成员使用 `--registry` 指向内部仓库

---

## 检查清单

### 使用模板前

- [ ] 确认项目类型和技术栈
- [ ] 查看模板详情和适用场景
- [ ] 备份现有 Spec（如有）

### 创建模板时

- [ ] 创建 template.json 元信息
- [ ] 编写核心 Spec 文件（5-7 个）
- [ ] 编写 README.md 说明文档
- [ ] 本地测试模板

### 发布模板时

- [ ] 添加版本标签
- [ ] 编写发布说明
- [ ] 测试从远程使用

---

## 相关文档

- [安装指南](../入门/安装指南.md)
- [核心概念](../入门/核心概念.md)
- [最佳实践](./最佳实践.md)
- [官方 Marketplace](https://github.com/sunrain520/spec-first/blob/master/marketplace/README.md)
