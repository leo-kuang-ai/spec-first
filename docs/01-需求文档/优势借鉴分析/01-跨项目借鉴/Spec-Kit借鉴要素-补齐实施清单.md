# Spec-Kit 借鉴要素补齐实施清单

> 版本：v1.1  
> 日期：2026-02-26  
> 基线输入：`Spec-First 可借鉴 Spec-Kit 的要素分析.md` + 仓库实现审查结果

## 审查结论基线

- 总项数：14
- 已完整完成：14
- 部分完成：0
- 未完成：0

## 最新修复进度（2026-02-26）

- 状态：已收口（`14/14`）
- 验证：相关单测通过（183/183），`pnpm -s tsc --noEmit` 通过
- 待办：无（按本清单口径）

---

## P1（近期，1-2 周）

| 勾选 | 编号 | 要素 | 当前状态 | 目标结果 | 主要改动文件 | 验收标准 |
|---|---|---|---|---|---|---|
| [x] | P1-01 | “英语单元测试”式 Checklist（spec-review + C10） | 已完成 | 新增独立 `spec-review` Skill；`01_specify` Gate 引入 C10 | `skills/spec-first/20-spec-review/SKILL.md`（新增）<br>`skills/spec-first/AGENTS.md`<br>`src/core/gate-engine/gate-evaluator.ts` | 可执行 `/spec-first:spec-review`；C10 < 80% 时阻断阶段推进 |
| [x] | P1-02 | 结构化歧义消解（Clarify） | 已完成 | 扩展为 10 类歧义分类；按轮次澄清并回写 `spec.md` | `skills/spec-first/03-spec/SKILL.md` | 至多 5 轮澄清；歧义项规范化标记；澄清结果写回 `spec.md` |
| [x] | P1-03 | 模板驱动 LLM 行为约束 | 已完成 | 增加“自我修正上限=3”和统一约束模板 | `skills/spec-first/03-spec/SKILL.md`<br>`skills/spec-first/04-design/SKILL.md`<br>`skills/spec-first/06-task/SKILL.md`<br>`src/shared/config-schema.ts` | 生成类 Skill 明确 max self-correction=3；输出不提前泄露 HOW 细节 |

---

## P2（中期，3-4 周）

| 勾选 | 编号 | 要素 | 当前状态 | 目标结果 | 主要改动文件 | 验收标准 |
|---|---|---|---|---|---|---|
| [x] | P2-01 | Constitution 语义版本管理（C11） | 已完成 | `constitution.md` 引入 `version/ratified/last_amended` 与修订记录；Gate 引入 C11 | `templates/init/constitution.md.hbs`<br>`.spec-first/constitution.md`（迁移）<br>`src/core/gate-engine/gate-evaluator.ts` | 设计阶段可自动检查 constitution 引用与合规；C11 失败阻断推进 |
| [x] | P2-02 | 跨产物一致性分析（Analyze） | 已完成 | 新增只读 `analyze` Skill，产出 `analysis-report.md` | `skills/spec-first/21-analyze/SKILL.md`（新增）<br>`skills/spec-first/AGENTS.md`<br>`src/core/gate-engine/sca.ts` | 输出严重度分级（CRITICAL/HIGH/MEDIUM/LOW）；CRITICAL 可阻断 Gate |
| [x] | P2-03 | 用户故事组织任务分解 + 并行调度 | 已完成 | 调度器按依赖并行执行 `[P]` 任务 | `src/core/ai-orchestrator/todo-runner.ts`<br>`skills/spec-first/13-orchestrate/SKILL.md` | 同层可并行 TASK 被真实调度；证据链保留 |
| [x] | P2-04 | Agent 无关架构（generic） | 已完成 | 增加 Agent 抽象配置层与 generic 安装路径 | `src/shared/host-paths.ts`<br>`src/shared/skill-commands.ts`<br>`src/cli/commands/update.ts` | 支持 `--host`（或等价）声明；可落地 generic 目录 |
| [x] | P2-05 | Agent 上下文自动同步 | 已完成 | `design` 结束自动同步宿主上下文文件（保留手动块） | `skills/spec-first/04-design/SKILL.md`<br>`src/core/tool-integration/*`（新增同步脚本） | 设计变更后上下文文件自动更新；手工区块不被覆盖 |
| [x] | P2-06 | Handoff 接力机制 | 已完成 | 每个 Skill 增加 Next Steps 输出 | `skills/spec-first/*/SKILL.md` | 每次 Skill 完成后均给出明确下一步命令 |
| [x] | P2-07 | Dynamic Clarification Questions | 已完成 | 在 `03-spec` 增加 5 步动态问题生成算法 | `skills/spec-first/03-spec/SKILL.md` | 每次最多 3 个问题；问题均对结果有实质影响 |
| [x] | P2-08 | Progressive Disclosure 上下文加载 | 已完成 | 将 slicing 策略真正接入执行链，加入摘要优先 | `src/core/ai-orchestrator/context-pack.ts`<br>`src/core/ai-orchestrator/context-slicing.ts`<br>`src/cli/commands/ai.ts` | 大文档默认摘要化；仅缺口时增量加载；token 开销可观测 |

---

## P3（远期）

| 勾选 | 编号 | 要素 | 当前状态 | 目标结果 | 主要改动文件 | 验收标准 |
|---|---|---|---|---|---|---|
| [x] | P3-01 | V-Model 四层配对追踪 | 已完成 | 新增四层 ID 体系与双向矩阵 | `src/core/trace-engine/id-validator.ts`<br>`src/core/trace-engine/matrix.ts`<br>`.spec-first/layer2/v-model.yaml`（新增） | 支持 REQ/SYS/ARCH/MOD 与 ATP/STP/ITP/UTP 映射与双向检查 |
| [x] | P3-02 | 扩展系统（Extension System） | 已完成 | 支持 `.spec-first/extensions/` 装载 Skill + Hook + Rule | `src/core/process-engine/layer-merger.ts`<br>`src/core/skill-runtime/dispatcher.ts` | 扩展可隔离命名空间；可启停、可版本化 |
| [x] | P3-03 | 前缀匹配 Feature 定位 | 已完成 | 目录定位降级链：精确 -> 前缀 -> 环境变量覆盖 | `src/core/process-engine/feature.ts`<br>`src/cli/commands/feature.ts` | 精确失败时可按前缀匹配，且不破坏现有精确路径 |

---

## 已完成路径（实际执行）

1. `P1-01` -> `P1-02` -> `P1-03`
2. `P2-01` -> `P2-02` -> `P2-03` -> `P2-04` -> `P2-05` -> `P2-06` -> `P2-07` -> `P2-08`
3. `P3-03` -> `P3-01` -> `P3-02`

## 里程碑验收口径

- M1（P1 完成）：`01_specify` 具备“可度量质量门禁”，歧义消解流程可复现
- M2（P2 完成）：跨产物一致性与上下文同步/裁剪能力稳定
- M3（P3 完成）：形成可扩展、多层追踪、宿主无关的长期架构
