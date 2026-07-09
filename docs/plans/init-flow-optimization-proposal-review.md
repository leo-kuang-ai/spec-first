# 文档审查结果

**文档：** docs/plans/init-flow-optimization-proposal.md  
**类型：** plan  
**审查视角：** coherence、feasibility、product-lens、scope-guardian、adversarial  
- product-lens — 方案在宿主扩展性与 Qoder governance 缺口上提出了战略性主张
- scope-guardian — 方案包含 6 个 Phase、5 个优先级
- adversarial — 方案引入新抽象（PlatformRegistry、PointerBasedAdapter），并对 Qoder hook 兼容性做了承重假设

0 项需要处理（0 个 error，0 个 omission）。6 条 FYI 观察已全部在 `init-flow-optimization-proposal.md` 中修复。

## 修复记录

| # | 原观察 | 修复位置 | 修复内容 |
|---|--------|----------|----------|
| 1 | Qoder 注册表缺少 `settingsFile` | §4.2 | 为 qoder 注册表新增 `settingsFile: '.qoder/settings.json'`、`hooksDir: '.qoder/hooks'` 和 `capabilities: { shellHooks: true }` |
| 2 | Phase 0 与 Phase 2 存在代码迁移缺口 | §5.1 / §5.2 | 在依赖图和 Phase 0 步骤中明确：Qoder hook 调用将在 Phase 2 同步迁移到 `init-plan.js` |
| 3 | 正则无锚定策略未说明 | §4.3 | 新增「锚定策略」段落，说明生成的正则不添加 `^` 以保持与 legacy patterns 行为一致 |
| 4 | Qoder Hooks 优先级低于 Platform Registry | §八 | 将 Qoder Hooks 调整为 #1，Platform Registry 调整为 #2，并补充优先级说明 |
| 5 | Phase 5 无验收标准和触发条件 | §5.2 Phase 5 | 新增触发条件表和验收标准表，明确按需启动的判定依据 |
| 6 | O(1) 扩展主张未限定 pointer-only | §4.3 / §5.3 | 收益说明改为「pointer-only 宿主」；§5.3 新增适用范围说明，并指出 hooks-capable 宿主需额外 hooks 模块 |
| 7 | Golden snapshot flags 待确认 | §6.2 | 已验证 `--claude`/`--codex`/`--cursor`/`--kiro`/`--qoder` 为当前 CLI 支持的 flags，并在文档中注明 |
| 8 | qoder-settings.js API 未说明 `existsAfter` | §4.7.2 | 表格中明确 `renderManagedQoderHooksRemoval` 返回 `{filePath, existsAfter, contents}` |
| 9 | UserPromptSubmit matcher 缺少验证步骤 | §5.2 Phase 0 | 新增步骤 7：验证 `UserPromptSubmit` matcher 行为，若不支持 command name 过滤则暂不安装 `spec-plan-guard` |
| 10 | 注册表缺少宿主能力标志 | §4.2 | 为全部 5 个宿主新增 `capabilities: { shellHooks: true/false }` |

## FYI 观察

低置信度观察，仅供决策参考，不强制要求处理。

| # | 章节 | 观察 | 审查视角 | 置信度 |
|---|------|------|----------|--------|
| 1 | §4.2 Platform Registry | Qoder 注册表缺少 `settingsFile: '.qoder/settings.json'`，但 §4.7.1 向该文件写入 hooks，§4.7.3 也展示了该 schema。建议补齐该 key，与 Claude 保持对称。 | coherence | 50 |
| 2 | §5.2 Phase 0 / §4.5 | Phase 0 修改 `init.js buildInitMetadataPlan`，而 Phase 2 紧接着把 `init.js` 拆成 8 个模块。新增的 Qoder hook 代码在拆分时需要迁移，方案未明确说明这一点。 | feasibility | 50 |
| 3 | §4.3 deriveUnrewrittenPatterns | 生成的正则未锚定（缺少 `^`）。若 legacy patterns 同样未锚定，则行为兼容；但方案应显式说明锚定策略。 | feasibility | 50 |
| 4 | §八 优先级排序 | Platform Registry 排在 #1，Qoder Hooks 排在 #2，但 "Why Now" 把 Qoder governance 缺口列为第二大驱动信号，且 spec-first 本身运行在 Qoder 中。可考虑宿主自身缺口是否应与架构重构同等或更优先。 | product-lens | 50 |
| 5 | §5.2 Phase 5 | 平台兼容性加固标注为 "按需"，没有验收标准或触发条件。这是唯一一个无法确定性关闭的 Phase。 | scope-guardian | 50 |
| 6 | §5.3 新宿主接入 | "1 天 / 0 行现有代码修改" 的主张假设所有新宿主都符合 pointer-only 模式。若第 6 个宿主支持 hooks，则会重新引入 adapter 分类，打破 O(1) 表述。 | adversarial | 50 |

## 残留顾虑

残留顾虑是审查中注意到但未能达到 50 及以上置信锚点的问题。这些问题不可直接执行，仅作透明披露。

| # | 顾虑 | 来源 |
|---|------|------|
| 1 | Golden snapshot 策略引用 `spec-first init --dry-run --{host}` 形式，需先确认当前 CLI 是否确实支持这些 flags，再将其作为 Phase 1/2/3 的验收依据。 | feasibility |
| 2 | §4.7.1 的 `renderManagedQoderHooksRemoval` 引用 `rendered.existsAfter`，但 §4.7.2 只说明输出 `contents`。需验证 qoder-settings.js API 是否与 claude-settings.js 一致（返回 `{contents, existsAfter}`）。 | coherence |
| 3 | Qoder `UserPromptSubmit` 的 matcher 行为对 spec-plan-guard 映射是承重的，但方案仅标注 "需验证"，未在任何 Phase 中安排验证步骤。 | adversarial |

*以上 3 项顾虑已通过 §6.2、§4.7.2、§5.2 Phase 0 步骤 7 修复或纳入计划。*

## 待决问题

| # | 问题 | 来源 |
|---|------|------|
| 1 | 是否应将 Phase 0 合并进 Phase 2，使 Qoder hook 逻辑直接落在新 `init-plan.js` 模块中，避免一次迁移？ | feasibility |
| 2 | Platform Registry 是否应增加宿主能力标志字段（例如 `supportsShellHooks`），使 O(1) 扩展主张对未来支持 hooks 的宿主也成立？ | adversarial |

*待决问题 1 的折中方案：保持 Phase 0 独立交付，但在 Phase 2 同步迁移相关调用，已在 §5.1/§5.2 中明确。待决问题 2 已解决：§4.2 为全部宿主增加 `capabilities: { shellHooks: ... }`。*

## 覆盖统计

| 审查视角 | 状态 | 发现数 | 自动修复 | 建议修复 | 需决策 | FYI | 残留 |
|---------|------|--------|----------|----------|--------|-----|------|
| coherence | 完成 | 1 | 0 | 0 | 0 | 1 | 1 |
| feasibility | 完成 | 2 | 0 | 0 | 0 | 2 | 2 |
| product-lens | 完成 | 1 | 0 | 0 | 0 | 1 | 0 |
| scope-guardian | 完成 | 1 | 0 | 0 | 0 | 1 | 0 |
| adversarial | 完成 | 2 | 0 | 0 | 0 | 2 | 1 |

## 审查视角备注

- **Coherence：** 文档内部一致性良好。Qoder 注册表已补齐 `settingsFile` 和 `hooksDir`，并增加 `capabilities` 字段。
- **Feasibility：** 六个 Phase 按描述均可实现。Phase 0 与 Phase 2 的代码迁移约定已在文档中明确；`UserPromptSubmit` matcher 验证已加入 Phase 0 步骤。
- **Product-lens：** 战略框架合理，与 AGENTS.md 对齐。Qoder Hooks 已调整为 #1 优先级，并说明与 Platform Registry 可并行启动。
- **Scope-guardian：** 范围与目标相称。Phase 5 已补充触发条件表和验收标准表，可按确定性规则关闭。
- **Adversarial：** O(1) 扩展主张已限定为 pointer-only 宿主；注册表 `capabilities.shellHooks` 标志使 hooks-capable 宿主的扩展路径也得以表达。
