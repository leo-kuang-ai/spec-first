# First Skill 新手引导增强设计

> **版本**: v1.0.0 | **日期**: 2026-03-04 | **状态**: 待实施

---

## 1. 背景

### 1.1 问题描述

First Skill 作为项目快速认知工具，当前产物（quick 模式 4-5 个，deep 模式 10-11 个）能够帮助新手了解项目的：
- 技术栈（tech-stack.md）
- 代码结构（codebase-overview.md）
- 业务概念（domain-model.md）
- API 接口（api-docs.md）
- 数据模型（database-er.md）
- 开发规范（development-guidelines.md）
- 环境搭建（local-setup.md）

但新手反馈：
1. **不知道从哪个文档开始看**：产物较多，缺少阅读路径指引
2. **不知道改哪个文件**：理解了代码结构，但不知道"新增一个 API"应该改哪里

### 1.2 目标

在不破坏 First Skill 现有边界（专注代码分析）的前提下，通过轻量增强提升新手引导体验：
1. README.md 新增「新手必读」章节：推荐阅读顺序
2. codebase-overview.md 新增「开发入口」章节：常见任务 → 文件路径映射

### 1.3 范围

**包含**：
- README.md 模板更新
- codebase-overview.md 模板更新
- SKILL.md 规格更新
- references/agents-code-analysis.md 更新

**不包含**：
- 新增产物（如 quick-start.md）
- Agent 数量变更
- 执行流程变更

---

## 2. 方案设计

### 2.1 README.md 新增「新手必读」章节

**位置**：README.md 开头（在产物索引之前）

**内容模板**：

```markdown
## 新手必读

### 快速入门路径（预计 15-20 分钟）

**Step 1: 了解项目**（5 分钟）
→ 先读 `tech-stack.md` 了解技术栈
→ 再读 `domain-model.md` 了解业务核心概念

**Step 2: 理解结构**（5 分钟）
→ 读 `codebase-overview.md` 了解代码组织
→ 读 `architecture.md` 了解系统架构

**Step 3: 开始开发**（5 分钟）
→ 读 `local-setup.md` 搭建本地环境
→ 读 `development-guidelines.md` 了解开发规范
→ 参考 `codebase-overview.md` 的「开发入口」章节找到改动的文件

### 按角色推荐

| 角色 | 重点文档 |
|------|----------|
| 后端开发 | domain-model → api-docs → database-er → codebase-overview |
| 前端开发 | tech-stack → api-docs → codebase-overview → development-guidelines |
| 全栈开发 | 按快速入门路径顺序 |
```

### 2.2 codebase-overview.md 新增「开发入口」章节

**位置**：codebase-overview.md 末尾（在模块清单之后）

**内容模板**：

```markdown
## 开发入口

> 告诉你"改什么功能 → 改哪个文件"

### 常见开发任务

| 任务 | 文件/目录 | 说明 |
|------|-----------|------|
| 新增 API 端点 | `src/api/` 或 `src/routes/` | 按模块组织，新增路由文件 |
| 新增业务逻辑 | `src/services/` 或 `src/domain/` | 核心业务代码 |
| 新增页面/组件 | `src/pages/` 或 `src/components/` | 前端页面和组件 |
| 修改数据模型 | `prisma/schema.prisma` 或 `src/models/` | 数据库 Schema |
| 修改配置 | `config/` 或 `.env` | 环境变量和配置 |
| 添加测试 | `tests/` 或 `__tests__/` | 单元测试和集成测试 |
| 修改定时任务 | `src/jobs/` 或 `src/cron/` | 后台任务 |

### 快速定位

- **入口文件**：`src/index.ts`（项目启动入口）
- **路由注册**：`src/router.ts`（API 路由注册）
- **数据库连接**：`src/db/`（数据库初始化）
- **中间件**：`src/middleware/`（请求处理中间件）
```

---

## 3. 实施计划

### 3.1 阶段划分

| 阶段 | 任务 | 改动文件 | 预计时间 |
|------|------|----------|----------|
| 1 | 更新 SKILL.md 规格和成功标准 | SKILL.md | 15 分钟 |
| 2 | 更新 Agent A1 规格和模板 | references/agents-code-analysis.md | 20 分钟 |
| 3 | 测试验证 | - | 15 分钟 |
| **总计** | - | **2 个文件** | **50 分钟** |

### 3.2 阶段 1：SKILL.md 更新

**改动点**：

1. **产物清单章节**（约第 244 行）：
   - 更新 `codebase-overview.md` 描述，增加"包含开发入口章节"

2. **成功标准章节**（约第 602 行）：
   - 更新 `codebase-overview.md` 最低要求：
     - 原：`至少包含：目录结构、模块划分（3+ 个模块）、入口文件`
     - 新：`至少包含：目录结构、模块划分（3+ 个模块）、入口文件、开发入口章节`

3. **P3 阶段**（约第 583 行）：
   - 更新 README.md 生成逻辑说明，增加"包含新手必读章节"

### 3.3 阶段 2：references/agents-code-analysis.md 更新

**改动点**：

1. 更新 A1 (codebase-overview.md) 产出模板，增加「开发入口」章节模板
2. 增加开发入口检测规则：
   - 常见目录 → 任务映射表
   - 按端类型（backend/frontend/mobile）调整映射

### 3.4 阶段 3：测试验证

**测试用例**：

| 用例 | 验证点 |
|------|--------|
| quick 模式 | codebase-overview.md 包含「开发入口」章节 |
| deep 模式 | README.md 包含「新手必读」章节 |
| 端类型检测 | 不同端类型的开发入口映射正确 |

---

## 4. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 模板内容与实际不符 | 新手被误导 | 使用 `[待确认]` 标注不确定项 |
| 端类型检测失败 | 开发入口映射错误 | 降级到通用模板 |

---

## 5. 验收标准

### 5.1 功能验收

- [ ] quick 模式生成的 codebase-overview.md 包含「开发入口」章节
- [ ] deep 模式生成的 README.md 包含「新手必读」章节
- [ ] 开发入口章节包含至少 5 个常见任务映射
- [ ] 新手必读章节包含 3 步骤阅读路径

### 5.2 质量验收

- [ ] SKILL.md 规格与 references 文件一致
- [ ] 成功标准章节已更新
- [ ] 测试用例通过

---

## 6. 后续迭代

如果本次轻量增强效果良好，可考虑：

1. **方案 2：中等增强**
   - 新增 `quick-start.md`（deep 模式专属）
   - 详细的开发任务示例（新增 API、新增页面、修改字段）

2. **方案 3：智能路径**
   - 根据端类型动态生成不同的「新手必读」路径
   - 根据项目特征（API 数量、表数量）调整推荐

---

## 附录：决策记录

### 决策 1：为什么不新增产物？

**理由**：
1. First Skill 定位是"项目认知工具"，不是"开发教程工具"
2. 开发流程由其他 skill（spec/design/task）负责
3. 轻量增强足以解决新手"不知道从哪开始"的问题

### 决策 2：为什么选择方案 1 而非方案 2/3？

**理由**：
1. 方案 1 改动最小，风险可控
2. 不破坏现有 quick/deep 模式边界
3. 后续可根据反馈再迭代
