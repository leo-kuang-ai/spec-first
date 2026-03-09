# first runtime / docs 投影视图后续待优化问题清单（2026-03-09）

## 目的

本文聚焦当前 `spec-first first` 最小实现落地后的**后续待优化问题**，仅记录：

- 问题是什么
- 为什么是问题
- 当前推荐的最佳解决方案是什么

原则：坚持 **KISS**、**职责分离**、**避免过度设计**，优先做收口型优化，不引入新的复杂抽象。

---

## 待优化问题列表

| ID | 问题 | 现状 / 风险 | 最佳解决方案 |
|---|---|---|---|
| F1 | `first` 命令层偏厚 | 当前 `src/cli/commands/first.ts` 同时承担参数解析、runtime 健康判断、首次 bootstrap、refresh、docs 强制恢复，命令层已有业务编排职责，后续继续演进时容易膨胀 | 把“runtime 健康但 docs 缺失时自动补投影”的逻辑下沉到 `src/core/skill-runtime/first-context.ts` 或相邻 runtime service；CLI 命令层只保留“参数解析 + 调用单一入口 + 打印结果” |
| F2 | `first` 的确认策略注册仍偏分散 | `src/cli/index.ts` 中对 `first` 的 `requiresConfirmation` 做了专门内联判断，和“命令行为”没有完全收敛到命令自身或参数模块，长期看会让 CLI 注册表变厚 | 抽出一个极小 helper，例如 `shouldConfirmFirst(args)`，放到 `src/core/skill-runtime/first-args.ts` 或 `src/cli/commands/first.ts`；`src/cli/index.ts` 只引用 helper，不内联策略细节 |
| F3 | `refresh-all` 对“投影视图缺失”感知不足 | 当前 runtime 健康但 `docs/first/` 缺失时，需要命令层再显式执行一次 `refresh-docs-from-runtime`；这说明核心 refresh 语义未完全闭环 | 在 `refreshFirstArtifacts(...)` 内部补齐“runtime 健康 + docs 缺失/索引缺失 => 自动补投影”的内建规则，让核心服务自身完成闭环，避免命令层兜底 |
| F4 | `--skip` 语义仍可更精确 | 当前 `--skip` 仅复用已有 runtime 并输出摘要，不会主动恢复 `docs/first/`；这与“runtime 是真源、docs 是投影”的模型还不够一致 | 将 `--skip` 明确定义为：“跳过 runtime 重建，但允许从健康 runtime 恢复 docs 投影”；这样既不重建真源，又满足 docs/first 可恢复 |
| F5 | `--deep` 还只是 mode 标记，不是完整 deep 语义 | 当前首次 bootstrap 时，`--deep` 会写入 `mode=deep`，但产物内容仍是最小启发式摘要；如果后续用户把它理解成“完整 deep 分析”，会产生认知偏差 | 先定义最小 deep 语义，不急着恢复旧版 10-11 份文档。建议只在 deep 下增强 `summary.techStack`、`modules`、`evidence`、`entryPoints` 的采样密度，并在输出文案中明确“当前为最小 deep” |
| F6 | bootstrap 启发式边界需要冻结 | 现在 `first-bootstrap` 已具备项目名、端类型、tech stack、模块、入口、证据等提取能力，如果后续继续堆规则，容易演化成第二套分析引擎 | 明确边界：bootstrap 只允许使用“文件存在性 + `package.json`/少量配置解析 + 平台探测器”，禁止引入 AST 深扫、多 agent 分析、大量推断规则 |
| F7 | `first` 缺少 router 级确认策略测试 | 当前已有命令级测试，但对“默认需确认 / `--quick` 跳确认 / `--force` 跳确认”的 router 行为仍缺保护，后续容易在 CLI 层回归 | 补 2-3 条 router 级单测，只验证确认策略分发，不扩展到业务实现细节 |
| F8 | runtime/docs 闭环证据还未显式结构化 | 现在 index 已记录 docsProjection 哈希与健康度，但 `first` 命令执行本身没有形成独立“这次恢复了哪些投影”的显式摘要记录 | 保持最小方案，不新增数据库/事件总线；仅在命令输出中稳定打印“生成/刷新了哪些 runtime 资产、哪些 docs 投影”，必要时再考虑是否写入轻量审计字段 |
| F9 | `first` 当前缺少面向用户的最小语义文档同步 | 代码已有最小 `first` 命令，但使用者不一定知道：当前已从“skill 描述”升级为“CLI 可执行入口”，且 `docs/first` 是投影视图 | 在 `skills/spec-first/00-first/SKILL.md` 或相关 README 中补一段最小说明：CLI 命令存在、runtime 为真源、docs 为投影、`--check-health/--skip` 的语义 |
| F10 | 变更优先级需要收口，避免再次扩 scope | 当前最值钱的是把“真源→执行→投影恢复”收得更紧，而不是继续扩展分析能力；如果直接做 full deep analyzer，复杂度会上升过快 | 后续只建议优先做收口项：`F1/F2/F3/F4/F7`；`F5/F6/F8/F9` 放在第二优先级，且必须坚持最小化实现 |

---

## 推荐优先级

### P0：优先立即优化

1. **F1 命令层瘦身**
2. **F2 确认策略 helper 收口**
3. **F3 refresh 核心闭环内建化**
4. **F4 `--skip` 语义对齐真源模型**
5. **F7 router 级确认测试补齐**

这 5 项都属于**收口型优化**：

- 不改系统边界
- 不引入新抽象层
- 直接增强“规范定义 -> 运行时执行 -> 证据记录 -> 放行验收”的闭环一致性

### P1：确认后再做

6. **F5 最小 deep 语义澄清**
7. **F6 bootstrap 边界冻结**
8. **F8 输出证据摘要稳定化**
9. **F9 文档语义同步**

这些属于**增强型优化**，应该在收口项稳定后再做。

---

## 总体建议

当前最优策略不是继续扩 `first` 的分析能力，而是继续把现有最小实现做成真正稳定的闭环：

- **runtime 真源唯一**
- **docs/first 永远可由真源恢复**
- **命令层只负责路由，不负责业务编排**
- **确认策略与测试一起收口**

换句话说，下一步最值得做的不是“做更多”，而是“让当前这套更稳、更薄、更一致”。
