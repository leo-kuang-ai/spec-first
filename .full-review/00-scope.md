# Review Scope

## Target

**00-first Skill** - 项目快速认知 Skill

该 Skill 用于快速认知一个项目：自动分析目标项目的技术栈、代码结构、架构、API、外部依赖、本地环境、研发规范和数据库，生成结构化文档到 `docs/first/`。

## Files

| 文件 | 行数 | 说明 |
|------|------|------|
| `SKILL.md` | ~396 | 主编排文件，定义执行阶段、并发策略、产物清单、成功标准 |
| `references/detection-rules.md` | ~82 | 12 种语言、20 种框架、多端技术栈、Context7 映射检测规则 |
| `references/agents-code-analysis.md` | ~122 | Agent A1/A2/A3 规格（代码分析链） |
| `references/agents-api-deps.md` | ~93 | Agent B/C1 规格（API 与外部依赖） |
| `references/agent-guidelines-setup.md` | ~119 | Agent C2 规格（研发规范 + 本地环境） |
| `references/agent-database.md` | ~103 | Agent D 规格（DB 检测 + ER 生成） |
| `references/agent-domain-model.md` | ~417 | Agent A4 规格（领域模型分析） |
| `references/subagent-architecture.md` | ~226 | Subagent-Driven 架构设计 |

**总代码量**: ~1,558 行 Markdown

## Flags

- Security Focus: no
- Performance Critical: no
- Strict Mode: no
- Framework: skill (Claude Code Skill 格式)

## Review Dimensions

1. **Architecture** - 架构设计、模块拆分、Agent 协作模式
2. **Security** - 数据库凭证安全、外部服务访问安全
3. **Performance** - 并发执行效率、超时控制、降级策略
4. **Testing** - 成功标准可验证性、边界条件覆盖
5. **Documentation** - 文档完整性、示例清晰度、可读性
6. **Best Practices** - Skill 设计模式、可维护性、可扩展性

## Review Phases

1. Code Quality & Architecture
2. Security & Performance
3. Testing & Documentation
4. Best Practices & Standards
5. Consolidated Report
