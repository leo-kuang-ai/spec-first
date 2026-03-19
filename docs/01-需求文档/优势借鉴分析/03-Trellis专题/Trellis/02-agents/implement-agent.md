# Implement Agent 详解

> 本文档详细分析 Trellis 的 Implement Agent（实现代理）

---

## 1. 核心定位

### 1.1 角色定义

**代码实现专家** — 根据规范和 PRD 实现代码，遵循项目开发规范。

```
┌─────────────────────────────────────────────────────────────┐
│                   Implement Agent 定位                       │
├─────────────────────────────────────────────────────────────┤
│  核心能力：                                                  │
│  ├─ 读取 PRD 和验收标准                                      │
│  ├─ 遵循项目规范实现代码                                      │
│  ├─ 编写测试用例                                             │
│  └─ 输出符合规范的代码                                        │
│                                                              │
│  输入来源（由 Hook 注入）：                                   │
│  ├─ prd.md（需求文档）                                       │
│  ├─ implement.jsonl（上下文文件列表）                        │
│  └─ 项目规范文件                                             │
│                                                              │
│  输出：                                                     │
│  ├─ 实现的代码文件                                           │
│  ├─ 测试文件                                                 │
│  └─ 实现说明                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **规范驱动** | 所有实现必须遵循项目规范 |
| **上下文注入** | 规范由 Hook 注入，不依赖记忆 |
| **测试先行** | 关键功能必须有测试覆盖 |
| **最小变更** | 只修改必要的代码 |

---

## 2. 执行流程

### 2.1 实现流程

```
┌─────────────────────────────────────────────────────────────┐
│                  Implement Agent Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: 接收任务                                            │
│          从 Dispatch Agent 接收任务目录                       │
│          │                                                   │
│          ▼                                                   │
│  Step 2: Hook 注入上下文                                     │
│          PreToolUse Hook 读取 implement.jsonl                │
│          注入规范文件到 prompt                                │
│          │                                                   │
│          ▼                                                   │
│  Step 3: 分析 PRD 和验收标准                                 │
│          理解需求、识别关键点                                  │
│          │                                                   │
│          ▼                                                   │
│  Step 4: 研究现有代码                                        │
│          了解代码结构、模式、约定                              │
│          │                                                   │
│          ▼                                                   │
│  Step 5: 设计实现方案                                        │
│          确定文件结构、接口设计                                │
│          │                                                   │
│          ▼                                                   │
│  Step 6: 实现代码                                            │
│          编写代码、遵循规范                                    │
│          │                                                   │
│          ▼                                                   │
│  Step 7: 编写测试                                            │
│          单元测试、集成测试                                    │
│          │                                                   │
│          ▼                                                   │
│  Step 8: 输出实现结果                                        │
│          代码文件、测试文件、实现说明                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 上下文注入详情

```python
# PreToolUse Hook 注入的上下文
def inject_implement_context(task_dir):
    # 读取 implement.jsonl
    jsonl_path = f"{task_dir}/implement.jsonl"
    context_files = read_jsonl(jsonl_path)

    # 读取规范文件
    context_content = []
    for entry in context_files:
        content = read_file(entry["file"])
        context_content.append({
            "file": entry["file"],
            "reason": entry["reason"],
            "content": content
        })

    # 注入到 Implement Agent prompt
    return assemble_prompt(context_content)
```

---

## 3. 规范遵循机制

### 3.1 规范注入示例

**implement.jsonl 内容**:
```jsonl
{"file": ".trellis/spec/backend/index.md", "reason": "Backend guidelines"}
{"file": ".trellis/spec/backend/api-design.md", "reason": "API design patterns"}
{"file": ".trellis/spec/backend/testing.md", "reason": "Testing standards"}
{"file": ".trellis/spec/guides/error-handling.md", "reason": "Error handling patterns"}
```

**注入后的 Prompt 结构**:
```
你是一个 Implement Agent，负责根据规范实现代码。

## 项目规范上下文

### Backend Guidelines (.trellis/spec/backend/index.md)
[规范内容...]

### API Design Patterns (.trellis/spec/backend/api-design.md)
[规范内容...]

### Testing Standards (.trellis/spec/backend/testing.md)
[规范内容...]

### Error Handling Patterns (.trellis/spec/guides/error-handling.md)
[规范内容...]

## 需求文档 (prd.md)
[PRD 内容...]

## 验收标准
[验收标准...]

请根据以上规范和需求实现代码。
```

### 3.2 规范遵循检查

```
Implement Agent 必须遵循：
├─ 代码风格规范
├─ API 设计规范
├─ 错误处理规范
├─ 测试规范
├─ 命名约定
└─ 文件结构约定
```

---

## 4. 输出格式

### 4.1 标准输出

```markdown
## 实现完成

### 实现内容
- [ ] 功能点 1: 描述
- [ ] 功能点 2: 描述

### 文件变更
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/auth/login.ts` | 新增 | 登录功能实现 |
| `src/auth/token.ts` | 修改 | 添加令牌刷新逻辑 |
| `tests/auth.test.ts` | 新增 | 认证测试用例 |

### 测试覆盖
- 单元测试: X 个
- 集成测试: Y 个
- 覆盖率: Z%

### 遵循的规范
- [x] Backend Guidelines
- [x] API Design Patterns
- [x] Testing Standards

### 注意事项
- [需要 review 的点]
- [潜在风险]
```

### 4.2 代码提交信息格式

```
feat(auth): 实现 JWT 令牌刷新功能

- 添加令牌刷新 API
- 实现 refresh_token 逻辑
- 添加刷新令牌存储
- 增加测试覆盖

Refs: TASK-XXX
```

---

## 5. 与其他 Agent 的协作

### 5.1 协作流程

```
┌──────────────┐    调用     ┌──────────────┐
│   Dispatch   │────────────▶│  Implement   │
│    Agent     │             │    Agent     │
└──────────────┘             └──────┬───────┘
                                    │
                                    │ 输出代码
                                    ▼
                             ┌──────────────┐
                             │    Check     │
                             │    Agent     │
                             └──────────────┘
```

### 5.2 职责边界

| Agent | 实现前 | 实现中 | 实现后 |
|-------|--------|--------|--------|
| **Plan** | 配置任务 | - | - |
| **Implement** | - | 编写代码 | - |
| **Check** | - | - | 验证代码 |
| **Debug** | - | - | 修复问题 |

---

## 6. 核心规则

### 6.1 六大铁律

| 规则 | 说明 |
|------|------|
| **1. 规范优先** | 所有实现必须遵循注入的规范 |
| **2. 上下文依赖** | 不假设规范，只使用注入的上下文 |
| **3. 测试覆盖** | 关键功能必须有测试 |
| **4. 最小变更** | 只修改必要的代码 |
| **5. 明确输出** | 输出文件变更列表和实现说明 |
| **6. 风险标注** | 标注潜在风险和需要 review 的点 |

### 6.2 实现检查清单

```markdown
## 实现检查清单

- [ ] 已阅读 PRD 和验收标准
- [ ] 已了解现有代码结构
- [ ] 实现方案已设计
- [ ] 代码遵循项目规范
- [ ] 测试已编写
- [ ] 文件变更列表已输出
- [ ] 潜在风险已标注
```

---

## 7. 错误处理

### 7.1 常见问题处理

| 问题 | 处理方式 |
|------|----------|
| **规范冲突** | 标注冲突，请求澄清 |
| **需求不清晰** | 返回 Plan Agent 补充 |
| **技术限制** | 标注限制，提供替代方案 |
| **依赖问题** | 标注依赖，等待解决 |

### 7.2 失败处理流程

```
Implement Agent 失败
        │
        ▼
┌──────────────────┐
│  标注失败原因    │
│  提供上下文信息  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Dispatch Agent  │
│  调用 Debug Agent│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Debug Agent    │
│   分析并修复     │
└──────────────────┘
```

---

## 8. 对 spec-first 的借鉴价值

### 8.1 核心借鉴点

| 借鉴点 | 优先级 | 说明 |
|--------|--------|------|
| **上下文注入** | P0 | 规范由 Hook 注入，不依赖 AI 记忆 |
| **规范驱动** | P0 | 所有实现必须遵循注入的规范 |
| **JSONL 配置** | P1 | 灵活配置每个任务的上下文 |
| **标准输出格式** | P2 | 统一的输出格式便于后续处理 |

### 8.2 实现建议

```python
class ImplementAgent:
    """Implement Agent - 代码实现"""

    def execute(self, task_dir: str, context: InjectedContext):
        """执行实现任务"""
        # 1. 分析 PRD
        prd = self.read_prd(task_dir)

        # 2. 获取注入的规范
        specs = context.specifications

        # 3. 研究现有代码
        existing_code = self.research_codebase(prd.scope)

        # 4. 设计实现方案
        design = self.design_implementation(prd, specs, existing_code)

        # 5. 实现代码
        changes = self.implement_code(design, specs)

        # 6. 编写测试
        tests = self.write_tests(prd.acceptance_criteria, specs.testing)

        # 7. 输出结果
        return ImplementationResult(
            changes=changes,
            tests=tests,
            notes=self.generate_notes()
        )
```

---

## 9. 相关文档

- [Dispatch Agent](./dispatch-agent.md) - 纯调度器
- [Check Agent](./check-agent.md) - 质量检查
- [Debug Agent](./debug-agent.md) - 问题修复
- [PreToolUse Hook](../03-hooks/pre-tool-use.md) - 上下文注入
