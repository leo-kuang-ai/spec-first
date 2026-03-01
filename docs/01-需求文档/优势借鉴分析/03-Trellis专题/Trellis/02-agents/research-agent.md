# Research Agent 详解

> 本文档详细分析 Trellis 的 Research Agent（研究代理）

---

## 1. 核心定位

### 1.1 角色定义

**代码搜索与信息收集专家** — 在代码库中搜索信息，为其他 Agent 提供上下文。

```
┌─────────────────────────────────────────────────────────────┐
│                   Research Agent 定位                        │
├─────────────────────────────────────────────────────────────┤
│  核心能力：                                                  │
│  ├─ 代码库搜索（文件、符号、模式）                            │
│  ├─ 文档查找                                                 │
│  ├─ 依赖分析                                                 │
│  ├─ 代码结构分析                                             │
│  └─ 信息汇总与报告                                           │
│                                                              │
│  使用场景：                                                  │
│  ├─ Plan Agent 需要分析代码库                                │
│  ├─ Implement Agent 需要了解现有代码                         │
│  ├─ Debug Agent 需要查找相关代码                             │
│  └─ 用户直接提问                                             │
│                                                              │
│  输出：                                                     │
│  ├─ 搜索结果                                                 │
│  ├─ 代码片段                                                 │
│  ├─ 分析报告                                                 │
│  └─ 建议的上下文配置                                         │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **只读操作** | 只搜索和读取，不修改代码 |
| **结构化输出** | 输出结构化的搜索结果 |
| **上下文感知** | 理解搜索目的，提供相关信息 |
| **效率优先** | 快速定位关键信息 |

---

## 2. 搜索能力

### 2.1 搜索类型

```
┌─────────────────────────────────────────────────────────────┐
│                   Research Agent 搜索能力                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 文件搜索                                                 │
│     ├─ 按名称模式搜索（glob）                                │
│     ├─ 按目录搜索                                            │
│     └─ 按文件类型搜索                                        │
│                                                              │
│  2. 符号搜索                                                 │
│     ├─ 类/接口定义                                           │
│     ├─ 函数/方法定义                                         │
│     ├─ 变量/常量定义                                         │
│     └─ 类型定义                                              │
│                                                              │
│  3. 内容搜索                                                 │
│     ├─ 文本模式搜索（regex）                                 │
│     ├─ 代码模式搜索                                          │
│     └─ 注释/文档搜索                                         │
│                                                              │
│  4. 关系搜索                                                 │
│     ├─ 引用查找（谁用了这个函数）                            │
│     ├─ 依赖查找（这个文件依赖什么）                          │
│     └─ 继承查找（类的继承关系）                              │
│                                                              │
│  5. 结构分析                                                 │
│     ├─ 目录结构                                              │
│     ├─ 模块结构                                              │
│     └─ 架构概览                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 搜索命令示例

```bash
# 文件搜索
find . -name "*.ts" -path "*/auth/*"

# 符号搜索
grep -r "class AuthService" --include="*.ts"

# 内容搜索
grep -r "validateToken" --include="*.ts" -A 5

# 引用查找
grep -r "import.*AuthService" --include="*.ts"
```

---

## 3. 执行流程

### 3.1 研究流程

```
┌─────────────────────────────────────────────────────────────┐
│                   Research Agent Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: 接收查询                                            │
│          从其他 Agent 或用户接收搜索请求                      │
│          │                                                   │
│          ▼                                                   │
│  Step 2: 理解查询意图                                        │
│          ├─ 识别搜索类型                                      │
│          ├─ 确定搜索范围                                      │
│          └─ 确定输出格式                                      │
│          │                                                   │
│          ▼                                                   │
│  Step 3: 执行搜索                                            │
│          ├─ 文件搜索                                          │
│          ├─ 符号搜索                                          │
│          ├─ 内容搜索                                          │
│          └─ 关系搜索                                          │
│          │                                                   │
│          ▼                                                   │
│  Step 4: 结果过滤                                            │
│          ├─ 去除无关结果                                      │
│          ├─ 按相关性排序                                      │
│          └─ 提取关键信息                                      │
│          │                                                   │
│          ▼                                                   │
│  Step 5: 生成报告                                            │
│          ├─ 汇总搜索结果                                      │
│          ├─ 提供代码片段                                      │
│          └─ 给出建议                                          │
│          │                                                   │
│          ▼                                                   │
│  Step 6: 输出结果                                            │
│          结构化报告 + 建议配置                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 查询类型处理

```python
def handle_query(query_type, query_params):
    if query_type == "file":
        return search_files(query_params.pattern, query_params.path)
    elif query_type == "symbol":
        return search_symbols(query_params.name, query_params.type)
    elif query_type == "content":
        return search_content(query_params.pattern, query_params.context_lines)
    elif query_type == "reference":
        return find_references(query_params.symbol)
    elif query_type == "structure":
        return analyze_structure(query_params.scope)
```

---

## 4. 与其他 Agent 的协作

### 4.1 协作关系

```
┌─────────────────────────────────────────────────────────────┐
│              Research Agent 协作网络                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    ┌──────────────┐                         │
│                    │  Plan Agent  │                         │
│                    └──────┬───────┘                         │
│                           │                                 │
│                           ▼                                 │
│                    ┌──────────────┐                         │
│       ┌────────────▶│   Research   │◀────────────┐         │
│       │             │    Agent     │             │         │
│       │             └──────────────┘             │         │
│       │                                           │         │
│  ┌────┴────┐                               ┌────┴────┐     │
│  │Implement│                               │  Debug  │     │
│  │  Agent  │                               │  Agent  │     │
│  └─────────┘                               └─────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 调用场景

| Agent | 调用场景 | 需要的信息 |
|-------|----------|------------|
| **Plan** | 需求评估 | 代码结构、相关文件、依赖关系 |
| **Implement** | 代码实现 | 现有代码、模式、约定 |
| **Debug** | 问题修复 | 相关代码、错误上下文、日志 |

---

## 5. 输出格式

### 5.1 标准输出

```markdown
## 研究报告

### 搜索摘要
- **查询类型**: [文件/符号/内容/关系]
- **搜索范围**: [目录/模块/全局]
- **结果数量**: X 个文件, Y 个符号

### 搜索结果

#### 文件结果
| 文件 | 相关性 | 说明 |
|------|--------|------|
| `src/auth/login.ts` | 高 | 登录核心逻辑 |
| `src/auth/token.ts` | 中 | 令牌处理 |

#### 代码片段
```typescript
// src/auth/login.ts:42-50
async function validateToken(token: string): Promise<AuthResult> {
  if (!token) {
    throw new AuthenticationError('Token is required');
  }
  return jwt.verify(token, config.secret);
}
```

#### 符号结果
| 符号 | 类型 | 位置 |
|------|------|------|
| `AuthService` | class | `src/auth/service.ts:10` |
| `validateToken` | function | `src/auth/login.ts:42` |

### 依赖关系
- `src/auth/login.ts` 依赖:
  - `src/auth/token.ts`
  - `src/config/index.ts`
  - `jsonwebtoken`

### 建议的上下文配置

**implement.jsonl**:
```jsonl
{"file": "src/auth/login.ts", "reason": "Login implementation reference"}
{"file": "src/auth/token.ts", "reason": "Token handling patterns"}
```

**check.jsonl**:
```jsonl
{"file": ".trellis/spec/backend/auth.md", "reason": "Auth guidelines"}
```
```

### 5.2 快速输出（简化版）

```markdown
## 快速搜索结果

**查询**: `validateToken`

**结果**:
- `src/auth/login.ts:42` - `validateToken` 函数定义
- `src/middleware/auth.ts:15` - 调用 `validateToken`
- `tests/auth.test.ts:30` - 测试用例

**相关文件**: 3 个
**建议查看**: `src/auth/login.ts`
```

---

## 6. 高级搜索功能

### 6.1 模式搜索

```python
# 代码模式搜索
patterns = {
    "api_endpoint": r"(get|post|put|delete)\s*\(['\"](.+)['\"]",
    "class_definition": r"class\s+(\w+)",
    "function_definition": r"function\s+(\w+)|const\s+(\w+)\s*=\s*\(",
    "import_statement": r"import\s+.*from\s+['\"](.+)['\"]"
}

def search_by_pattern(pattern_name, scope):
    pattern = patterns[pattern_name]
    return regex_search(pattern, scope)
```

### 6.2 依赖分析

```python
def analyze_dependencies(file_path):
    """分析文件依赖"""
    imports = extract_imports(file_path)
    usages = find_usages(file_path)

    return {
        "file": file_path,
        "imports": imports,        # 该文件导入的模块
        "imported_by": usages,     # 导入该文件的模块
        "external_deps": filter_external(imports)
    }
```

### 6.3 结构分析

```python
def analyze_module_structure(module_path):
    """分析模块结构"""
    return {
        "directories": list_directories(module_path),
        "files": list_files(module_path),
        "exports": find_exports(module_path),
        "entry_points": find_entry_points(module_path)
    }
```

---

## 7. 核心规则

### 7.1 六大铁律

| 规则 | 说明 |
|------|------|
| **1. 只读操作** | 永远不修改代码，只读取和搜索 |
| **2. 结构化输出** | 输出结构化、可解析的结果 |
| **3. 相关性排序** | 结果按相关性排序，最重要的在前 |
| **4. 上下文建议** | 提供上下文配置建议 |
| **5. 代码片段** | 包含关键代码片段，不只是文件名 |
| **6. 效率优先** | 快速返回，避免冗长分析 |

### 7.2 搜索检查清单

```markdown
## Research Agent 检查清单

- [ ] 已理解查询意图
- [ ] 已确定搜索类型
- [ ] 已执行搜索
- [ ] 已过滤和排序结果
- [ ] 已提取代码片段
- [ ] 已生成结构化报告
- [ ] 已提供上下文建议（如适用）
```

---

## 8. 对 spec-first 的借鉴价值

### 8.1 核心借鉴点

| 借鉴点 | 优先级 | 说明 |
|--------|--------|------|
| **多类型搜索** | P1 | 支持文件、符号、内容、关系搜索 |
| **结构化输出** | P1 | 标准化的搜索结果格式 |
| **上下文建议** | P1 | 自动生成 JSONL 配置建议 |
| **依赖分析** | P2 | 分析代码依赖关系 |

### 8.2 实现建议

```python
class ResearchAgent:
    """Research Agent - 代码搜索与信息收集"""

    def execute(self, query: ResearchQuery):
        """执行搜索任务"""
        results = []

        # 1. 确定搜索类型
        search_type = self.classify_query(query)

        # 2. 执行搜索
        if search_type == "file":
            results = self.search_files(query)
        elif search_type == "symbol":
            results = self.search_symbols(query)
        elif search_type == "content":
            results = self.search_content(query)
        elif search_type == "reference":
            results = self.find_references(query)

        # 3. 过滤和排序
        filtered = self.filter_results(results, query.relevance_threshold)

        # 4. 提取代码片段
        snippets = self.extract_snippets(filtered)

        # 5. 生成报告
        report = self.generate_report(filtered, snippets)

        # 6. 生成上下文建议
        suggestions = self.suggest_context(filtered)

        return ResearchOutput(
            results=filtered,
            snippets=snippets,
            report=report,
            context_suggestions=suggestions
        )

    def suggest_context(self, results):
        """生成上下文配置建议"""
        suggestions = {"implement": [], "check": []}

        for result in results:
            if result.is_implementation_reference:
                suggestions["implement"].append({
                    "file": result.path,
                    "reason": result.relevance_reason
                })
            elif result.is_guideline:
                suggestions["check"].append({
                    "file": result.path,
                    "reason": result.relevance_reason
                })

        return suggestions
```

---

## 9. 相关文档

- [Plan Agent](./plan-agent.md) - 需求评估与任务配置
- [Implement Agent](./implement-agent.md) - 代码实现
- [Debug Agent](./debug-agent.md) - 问题修复
- [parallel 命令](../01-commands/dev-commands.md) - 多 Agent 管道
