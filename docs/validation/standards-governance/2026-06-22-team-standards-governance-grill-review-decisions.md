# 团队开发规范治理层 — grill-with-docs 审查决策清单

## 元信息

- 审查对象: `docs/plans/2026-06-21-004-feat-team-standards-governance-layer-plan.md`
- 审查方法: `grill-with-docs`（逐分支挑战 + 完整性/一致性审查）
- 日期: 2026-06-22
- 审查时仓 HEAD: `61c29f10`（stale snapshot；任何实现/修订前必须重新捕获 `git rev-parse --short HEAD` 与 `git status --short`）
- 状态: **决策已记录；plan 正文未改**。plan 修订是独立后续工作（用户选择"先存档、plan 修订另起"）。
- 性质: 本文件是 review 决策存档，供后续 plan 修订或 `spec-work` 直接消费；不是 plan 本身，不改变 source/runtime 行为。

## 范围说明

本次为**方案完整性 / 内部一致性**审查（用户明确边界），不是 scope 取舍。前提为**保留完整 U1–U12**。

整体画像结论：plan 在"需求→单元正向可追溯（34/34）"与"完成标准→证据反向可追溯（24/24 映射）"上**完整**；软肋在三处——(a) 验证海拔浅（大量完成标准靠"文档提到了 X"满足，而非真实产物合规）、(b) 几个核心账本产物无生产单元、(c) 内部枚举与决策词表未收敛成单一真相源。

---

## A. 框架决策（Grill 阶段）

| # | 结论 | 落点 |
|---|---|---|
| Grill 1 | 保留完整 U1–U12（不拆版） | 全局前提 |
| Grill 2 | **全量结构校验器**（所有字段做形状校验），并据此锁定机器可解析的 rule-card 格式 | U1/U2 定格式（解 L295 开放问题）；`team-standards-governance-contracts.test.js` 从"查散文提到"升级为"查产物形状" |
| Grill 3 | 保留五值 `trust`，**登记 glossary 例外 + 收 canonical 术语**（preview-first），校验器枚举值与 glossary 登记值同源 | `docs/contracts/domain-glossary.md`、U1 合同 |
| Grill 4 | （未采纳）属 scope/复杂度取舍，被"做完整性审查"重定向；作为 scope 级观察保留：所有通往 confirmed 的路径最终都收束到普通 diff review，promotion-state/authority-tier/owner-queue/decision-trace/confirmed-draft 这套预层与 diff review 存在概念重叠，若日后回到 scope 取舍可重审。 | — |

---

## B. 完整性修复决策（F1–F13，最终结论）

| # | 问题（一句） | 最终结论 | 落点 |
|---|---|---|---|
| F1 | `promotion_state` 三处枚举漂移（`none` 是否合法）：R2(L50) / 内容模型(L377) / candidate card(L409) | 单一 SoT 枚举 `{none,proposed,confirmed-draft,reviewed,rejected,deferred}` + 语境约束（`candidates/**` 条目永不为 `none`）；R2 改为引用合同枚举 | `team-standards.md`、R2、L377、L409 |
| F2 | `trust=imported` 无对应 candidate_type，且其来源（team pack）被 scope 延后 | 保留 `imported`，补 `imported` candidate_type，标 **v1-reserved**（team-pack 延后 L114）；校验器"接受但 v1 无生产者"；trust 枚举/生命周期表/设计图(L961)/source matrix/glossary 登记口径统一 | trust 枚举、L402、生命周期表、L961、source matrix |
| F3 | 4+ 套"决策/下一步"词表互不对齐：promotion_decision(L410) / autonomy.policy(L776) / gate next_action(L692-710) / threshold decision(L1550) | 拆**两正交轴** `next_action` + `outcome`；单一 SoT + 同义/映射表；时态/大小写统一（`reject` 不用 `rejected`）；decision_trace 只用规范 token，保证 gate→autonomy→outcome→eval 全链可对账 | `team-standards.md`/`authority-tiers.md`、L410、L776、L692-710、L1550 |
| F8 | "哪些字段是闭合枚举、闭合值是什么"未定义；且与 A6（surface 不得硬编码）冲突 | **字段三分类表**：global-enum（查合同枚举，含 category/enforcement/migration_impact 收闭合）/ project-enum（surface/layer/capability 走 `index.md` 项目注册表，解 A6）/ format-free（id 正则、source_refs 禁绝对路径、日期、非空文本） | `team-standards.md`、`index.md` |
| F4 | `lineage-ledger` / `owner-decision-queue` / `promotion-log` 被引用、被当验证输入，但无创建单元 | lineage-ledger + owner-decision-queue → **U10**；promotion-log → **U9**；v1 创建为带 schema 的模板；字段对齐 F1/F3/F11 | 产物结构、U9/U10、U8 验证输入 |
| F5 | surface 模型缺 `data.md` / `job-event.md`（applies_to/R11/单目标含 data、job/event，但无文件） | U2 增 `data.md` + `job-event.md`；`job/event`→`job-event` token 规范化；登记 `index.md` Surface Registry | U2、applies_to、index |
| F6 | 冲突只有检测+记录+路由，**无解决机制**（"resolution options"被点名 3 次却从未定义） | 在 `promotion-and-conflicts.md`（U9）定最小解决程序：结果集 `{superseded, scoped-split, merged, deferred, both-rejected}`；优先级复用仓内 `spec-prd evidence-and-topology` Contradiction Handling（owner/user > confirmed 权威 > 既有 standard）；状态回流写 lineage + promotion-log | U9、conflicts.md |
| F7 | `docs/standards/**` 与 `AGENTS.md`/`CLAUDE.md`/目录级文件的 priority/conflict 只承诺未定义；U2 从 host 文件 seed 制造双真相源 | **每条规则单源去重**（U2 seed = 指针或迁移，不复制成第二份权威）；precedence = 更具体 scope 胜、带治理字段的 confirmed > 裸 host 行；裁不出 → `trust=conflict`（F6），不静默 enforce；同步更新 `context-governance.md` | `team-standards.md`、`context-governance.md`、U2 |
| F9 | index↔规则文件一致性是否进校验器范围未定（index 是全部 scope-filtered 加载的承重单点） | **进 CI 校验器**：双向完整性（active-confirmed 规则有且仅有一行 index、`file` 指向含该 ID 的存在文件）+ 元数据相等（index 列 == card 字段，card 为 SoT）；index 纳入受治理 derived artifacts；范围限 active-confirmed | 校验器（U8/U9 测试）、`index.md`、L780/L948 |
| F10 | `owner` 的有效/失效无判定（被当 gate/指标/失效触发器 ~10 次） | `author` 来自 `.developer`（复用 `resolveChangelogAuthor` 链 global→git）；`owner_role` **确定性自动识别**：CODEOWNERS → 目录级指令 → git blame(scoped paths) → unresolved；CODEOWNERS 命中=有效 owner，git-blame=advisory 候选；`owner gone` 由重跑解析自动触发；新增确定性 owner-resolver（src/cli，复用 `developer.js` 已 shell git） | `team-standards.md`、新 owner-resolver、复用 `src/cli/developer.js` |
| F11 | `high-impact-governance` 是开放列表（带"等"），却决定 owner-gate 是否强制；4 处成员不一致（L762/L696/L443/L718） | 新增**闭合 `risk_domain` 枚举** `{auth,permission,payment,funds,privacy,data-lifecycle,state-ownership,cross-surface-contract}`；单一判据 `high_impact ⇔ category∈{architecture,security} OR risk_domain≠∅`；4 处归一去"等"；`high_impact ⇒ 强制有效 owner_role + 禁自动 promote/enforce`；项目经注册表扩展（闭合但可扩） | `team-standards.md`、L762/696/443/718、index 注册表 |
| F13 | `spec-doc-review` 作为 consumer 论证薄弱、scope 未收窄（开发规范作用于"评审计划文档"场景弱） | 收窄为：doc-review 只消费 `category∈{architecture,design}` 且 `workflow` 含 `plan`/`doc-review` 的规划期规范（如 `DESIGN-NOTE-001`）；只判"plan/PRD 与 confirmed 架构/设计规范矛盾或缺 design-note/ADR"；禁 coding/testing/style 用于文档；复用 index `workflow` 列做过滤 | U3/U4、index.md |
| F12 | 单元编号 U8 与执行顺序不符（U8 是终态验证单元却编号 8、排第 12），易读成"缺 U8" | **U8 重编为 U13**（编号=执行顺序），同步全部引用（实施单元图、依赖、分阶段、正文 U8 引用、U8 自身 R1–R34） | 实施单元图、依赖、分阶段、正文 |

### 已确认完整、无需改动的项（正向结论）

- 需求→单元正向可追溯：R1–R34 每条都有至少一个实现单元，无孤儿需求。
- 完成标准→证据反向可追溯：C1–C24 均可映射到单元（但验证海拔浅，见 Grill 2 / F9）。

---

## C. 落地依赖与建议顺序

- **F8 是地基**：F9（元数据相等）、F10（owner 字段/校验）、F11（risk_domain 闭合）都依赖它先定"哪些字段闭合、值是什么"。
- **F1/F3 的枚举**喂给 F4（账本字段）、F9（index 相等校验）。
- **F10 的 owner_role**喂给 F6/F11 的 gate 路由。
- 建议次序：**F8 → F1/F3 → F10/F11 → F4/F5/F6/F7 → F9 → F13/F12**。

---

## D. 新增 source 面与 A2 影响

- 本轮决策新增两个**确定性脚本**：结构校验器（Grill 2 / F9）+ owner-resolver（F10）。二者属 "Scripts prepare deterministic facts, LLM decides" 范畴，与既有 `lint-skill-entrypoints`、`resolveChangelogAuthor` 同类。
- 因此需**改写 A2**：由"v1 不实现新 CLI producer 或自动扫描器"改为"**v1 可含确定性 fact-prep 脚本（validator、owner-resolver），但不含语义级 rule-mining 自动 confirmer**"，使 scope 边界与实际决策一致。
- 合同/词表落点：新建 `docs/contracts/team-standards.md`；修改 `docs/contracts/domain-glossary.md`、`docs/contracts/context-governance.md`。

---

## E. 后续动作

1. 据本清单按 C 节顺序产出 plan 深化修订（preview-first），落到 plan + `team-standards.md` + `domain-glossary.md` + `context-governance.md`。
2. 修订时遵守仓规：重新捕获 HEAD/status、最窄验证（`git diff --check`、plan hygiene Node check、`npx jest tests/unit/changelog-format.test.js tests/unit/plan-status-taxonomy.test.js`）、CHANGELOG、source/runtime 边界。
3. Grill 3 的术语登记走 preview-first 进 `domain-glossary.md`；校验器枚举值与 glossary 登记值保持同源。
