# Task Template

标准任务拆解模板，用于确保任务的可执行性。

## 任务粒度原则

**Bite-Sized Granularity**：
- 每个步骤：5-30 分钟可完成
- 每个任务：2-4 小时可完成
- 每个任务包含：3-7 个具体步骤

## 任务结构模板

```markdown
### TASK-XXX-YYY: [任务标题]

**Owner**: [FE/BE/DEV/QA/DEVOPS]
**预计工期**: [Xd/Xh]
**traces**: [FR-XXX,DS-XXX]
**depends_on**: [TASK-ID or -]
**用户故事**: [US#]

**目标**：
一句话描述这个任务要达成的结果。

**验收标准**：
- [ ] 具体可验证的条件 1
- [ ] 具体可验证的条件 2

**文件清单**：
- Create: `path/to/new/file.ext`
- Modify: `path/to/existing/file.ext:line-range`
- Reference: `path/to/reference/file.ext`

**执行步骤**：

**Step 1: [动作描述]**
- 具体操作
- 预期输出: [具体结果]

**Step 2: [动作描述]**
- 具体操作
- 预期输出: [具体结果]

...

**Step N: Commit**
```bash
git add <files>
git commit -m "scope: brief description"
```

**验证命令**：
```bash
# 运行测试/检查
<command>
# 预期输出
<expected output>
```

**状态**: planned | in_progress | complete | verified
```

## 步骤类型规范

| 步骤类型 | 示例 | 预期时间 |
|---------|------|----------|
| 创建文件 | Create `src/auth/service.ts` | 5-10 分钟 |
| 读取参考 | Read `docs/api-spec.md` section 3 | 5-15 分钟 |
| 编写代码 | Implement `login()` function | 15-30 分钟 |
| 运行测试 | `npm test auth.test.ts` | 2-5 分钟 |
| 本地验证 | `curl http://localhost:3000/api/login` | 2-5 分钟 |
| 提交代码 | git commit | 2-5 分钟 |

## 常见反模式

| ❌ 反模式 | ✅ 正确做法 |
|---------|-----------|
| "实现登录功能" | "Step 1: 创建 `src/auth/login.ts`<br>Step 2: 实现 `login()` 函数<br>Step 3: 添加输入验证<br>Step 4: 单元测试<br>Step 5: Commit" |
| "调研第三方库" | "Step 1: 搜索 Node.js JWT 库<br>Step 2: 对比 jsonwebtoken vs jose<br>Step 3: 记录对比结论到 findings.md" |
| "优化性能" | "Step 1: 使用 pprof 分析瓶颈<br>Step 2: 识别热点函数<br>Step 3: 优化 `processData()` 算法<br>Step 4: 基准测试对比" |
| "编写文档" | "Step 1: 创建 `docs/api/login.md`<br>Step 2: 编写请求/响应示例<br>Step 3: 添加错误码说明" |

## 依赖关系规范

```markdown
**depends_on**: TASK-AUTH-001

# 或多个依赖
**depends_on**: TASK-AUTH-001,TASK-AUTH-002

# 无依赖
**depends_on**: -
```

**依赖规则**：
- 只能引用同一 Feature 的 TASK ID
- 禁止自然语言描述（如"等登录功能完成"）
- 禁止跨 Feature 依赖（如有需要，提升到 FR/DS 层级）

## 用户故事标记

```markdown
**用户故事**: US1

# 用户故事格式
### US# — [用户故事名称] (优先级)
- TASK-XXX-001
- TASK-XXX-002
```

**用户故事原则**：
- 每个用户故事可独立交付
- 每个用户故事有端到端验收条件
- 优先级标记：P0/P1/P2/P3

## 验收标准规范

| 验收标准类型 | 示例 |
|------------|------|
| 功能验收 | API 返回 200 且包含 `{ token: string }` |
| 边界验收 | 空用户名返回 400 错误码 `INVALID_USERNAME` |
| 异常验收 | 数据库连接失败返回 500 且记录日志 |
| 性能验收 | API 响应时间 < 200ms (p95) |
| 安全验收 | 密码使用 bcrypt 加密，cost >= 10 |
