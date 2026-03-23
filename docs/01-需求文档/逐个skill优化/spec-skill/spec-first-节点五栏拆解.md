# Spec-First 节点五栏拆解

> 目标：把 `skills/spec-first` 的每个节点拆成 `输入 / 输出 / gate / 卡点 / 优化项` 五栏，只写代码和 Skill 文档能证明的事实。
>
> 证据边界：
> - Skill 文档：`skills/spec-first/*/SKILL.md`、`skills/spec-first/README.md`、`skills/spec-first/SHARED.md`
> - runtime / gate / stage 真相源：`src/core/**`、`src/cli/**`
> - 明确区分“代码已实现”与“文档仅声明但 runtime 未接入”
> - 不把 docs 当成真源，不把推断写成事实

## 0. 总推进图

```text
A. 主交付链

00-onboarding
    ↓
00-first
    ↓
01-init
    ↓
03-spec
    ↔ 20-spec-review
    ↓
04-design
    ↔ 05-research
    ↓
06-task
    ↓
07-code
    ↔ 08-review
    ↓
12-verify
    ↓
10-archive
    ↓
07_release (runtime golive)
    ↓
08_done (runtime done)

B. 控制面 / 支撑面

02-catchup  ─┐
11-plan     ─┼─> findings / 计划 / 风险 / 下一步
13-orchestrate ─┤
14-status    ─┤
15-doctor    ─┤
16-sync      ─┤
17-feature   ─┤
21-analyze   ─┘

补充支线：
reviewed requirement -> focus-requirements -> owner-scoped PRD / handoff
```

## 1. 入口与认知层

### 00-onboarding

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| 需要新手引导的用户场景；`docs/onboarding/` 下已有学习路径文档与否；`summary.json` / `entry-guide.json` 是否存在；用户角色 / 任务 / 项目规模（完整模式） | `docs/onboarding/{角色}学习路径.md`；首次命中时给出学习路径；输出首个启动命令；可覆盖更新同角色文档 | 强制使用 `AskUserQuestion`；前置检查 `docs/onboarding/` 与 `first` 资产；无 `first` 资产时允许降级但建议先跑 `/spec-first:first` | 这是纯交互型节点，容易把“推荐路径”误写成固定真理；依赖 `AskUserQuestion`，不能退化成纯文本问答；学习路径保存到用户文档区，不进入 spec 交付链 | 把“场景映射 -> 推荐路径 -> 落盘文件名”做成显式表，减少不同角色输出漂移；把 `first` 资产缺失时的降级提示写得更明确 |

### 00-first

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| 项目代码、配置、依赖声明；`.spec-first/runtime/first/index.json` 与 9 个 runtime 资产；docs 投影集合；需要时读取 `references/execution-flow.md`、`subagent-architecture.md` 等 | `.spec-first/runtime/first/index.json`；`summary.json`、`steering.json`、`conventions.json`、`critical-flows.json`、`entry-guide.json`、`api-contracts.json`、`structure-overview.json`、`domain-model.json`、`database-schema.json`；`docs/first/*.md` 投影文档；`docs-index.json`；`project-cognition-updates.jsonl` | runtime 资产健康；`databaseSchema.status === healthy` 时才允许 `docs/first/database-er.md` 进入投影；CLI `first` 只验证 runtime/docs，不把 docs 反写为真源 | `docs/first` 是人类输出，不得回灌为真源；`database-er.md` 是条件产物；`first` 默认是 deep，不应把浅层摘要当完整认知 | 把 runtime 真源、docs 投影、健康检查三层明确拆成固定输出区块；对数据库条件产物再加一层显式提示，避免误消费 |

### 01-init

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `.spec-first` 项目壳；`meta/config.yaml`；项目是否已有 `00-first` runtime；平台 YAML；用户传入 / 自动识别的 `mode / size / platforms`；brownfield 是否存在基线 Feature | `stage-state.json`；新 Feature 目录；必要时 `prd.md`、`task_plan.md`；brownfield 基线 `FSREQ-19700101-LEGACY-BASELINE`；配置补齐结果 | `G-INIT-01` Feature 目录存在；`G-INIT-02` mode/size/platforms 已确认；`G-INIT-03` `stage-state.json` 存在 | 三轨道自动路由容易把 project-onboarding / baseline / feature-init 混在一起；`platforms` 为空时不能强行继续；brownfield baseline 需要明确解释，不可静默跳过 | 把三轨道的触发条件做成更可读的决策表；baseline 生成后强制回到 `init` 再确认，减少“半初始化”状态 |

## 2. 会话恢复与状态观测

### 02-catchup

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `.spec-first/current`；`stage-state.json`；`task_plan.md`；`findings.md`；`document-links.yaml`；`[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]` 标记；当前 Feature 上下文 | 恢复报告；5-Question 回答；`findings.md` 追加恢复摘要；缺口清单；下一步最小可执行命令 | 强约束：没有上下文恢复就不允许继续工作；必须先定位 Feature，再读 stage/task/findings | `findings.md` 为空时要降级到 `status`；无 `in_progress` TASK 时只能建议从 `planned` 继续；TDD 缺口只算风险，不算硬阻断 | 将 5-Question 和信息缺口的输出格式固定到更短的机器可读模板；让 `status -> catchup` 的衔接提示更明确 |

### 14-status

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `stage-state`；`metrics`；`task_plan`；`gate history`；`background_input_status`；`runtime 真源` 与 `docs 输出` 分层状态；`findings.md` 中的 TDD 标记 | 仅展示状态仪表盘，不写项目产物；输出阶段进度、覆盖率、健康分、任务进度、风险识别、下一步建议 | 没有写入 gate；是只读状态查询节点；可推进性只是展示结论，不等于 stage advance | 它是 snapshot，不是证据闭环；如果用户只看 status 很容易误以为已经完成验证；`runtime 真源` 与 `docs 输出` 不一致时必须显式标注同步状态 | 把健康分、风险等级、阶段可推进性三者分离展示，避免把“分数高”误解成“可以 advance” |

### 15-doctor

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| 宿主配置（Claude Code / Codex / Gemini / Cursor）；Node / Git / hooks / config / 文件膨胀；MCP / skills 清单；`bootstrap-manifest`；runtime/docs 背景健康 | 默认 dry-run 诊断报告；显式 `--fix --yes` 时可执行环境修复；可能更新用户级环境配置文件 | 默认只读；只有 `--fix --yes` 才进入 apply 模式；工作区内不写项目交付物 | 作用域只在宿主环境，不在 Feature 工作区；如果把它当成项目修复节点，会把环境问题伪装成交付物问题 | 把诊断结果和修复动作进一步结构化成“问题 -> 证据 -> 修复命令 -> 复检命令”四段式 |

### 16-sync

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `document-links.yaml`；当前阶段产物；验证证据；`findings.md`；`summary.json`、`entry-guide.json`（first 认知资产辅助输入） | `document-links.yaml` 回填；`findings.md` 审计日志 | 依赖 `docs links validate` / `docs links show`；必须先定位 Feature；不能跳过同步确认 | 它只能修关联索引，不能代替缺失产物；如果文档内容本身错了，sync 解决不了根因 | 把“回填引用”和“审计日志”拆成固定区块，减少索引修复与内容修复混淆 |

### 17-feature

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `.spec-first/current`；`stage-state.json`；`specs/` 下所有 Feature；环境变量 `SPEC_FIRST_FEATURE` / `SPEC_FIRST_CURRENT_FEATURE` / `FEATURE_ID` | `list`：Feature 列表与阶段摘要；`current`：当前 Feature；`switch`：写入 `.spec-first/current` | `switch` 目标 Feature 必须存在且 `stage-state.featureId` 一致；写入失败时禁止污染当前指针 | `.spec-first/current` 是共享指针不是会话私有状态；并发终端会互相覆盖；切换后如果不跑 catchup，后续上下文可能错位 | 在 `switch` 输出里更强地提示“切换后先跑 catchup”；把来源（env / exact / prefix）展示得更显眼 |

## 3. 需求定义与审查

### 03-spec

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `00-first` 的 summary / critical-flows / domain-model；原始需求；`constitution.md`；`spec.md`；`document-links.yaml`；澄清问答；`background_input_status` | `prd.md`；`spec.md`；`document-links.yaml`；`findings.md`；Complex 时的 `adr/ADR-XXX.md`；FR/AC 与 ID 注册结果 | `C-PRD >= 85%`；`G-SPEC-01` `spec.md` 存在；`G-SPEC-02` 文档关联声明 `spec.md`；`G-SPEC-03` C10 >= 80%（warning）；宪法一致性检查必须通过 | 澄清过多时容易把问题堆到 `findings.md` 而没回写 `spec.md`；`[NEEDS CLARIFICATION]` 不可省略；实现细节不能混进需求 | 把 `[ASSUMED]` / `[NEEDS CLARIFICATION]` 的记录模板固定化；让 C-PRD、C10、宪法检查分开展示，减少“分数通过但内容不干净” |

### 20-spec-review

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `spec.md`；`constitution.md`；`document-links.yaml`；`summary.json`、`critical-flows.json`、`domain-model.json`（可用时） | `checklists/spec-review.md`；C10 分数；未通过清单 | 阶段要求在 `01_specify`；C10 < 80% 标记为阻断风险 | 当前代码层未见独立 runtime handler，主要是 skill 文档驱动；如果只产出 checklist，不联动 gate，审查结果会悬空 | 让 review 清单和 gate 条件对齐，减少“文档审查通过但阶段不一致”的空转 |

### 04-design

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `spec.md`；`constitution.md`；必要时 `research.md` / 外部证据；`summary.json` / `structure-overview.json` / `api-contracts.json` / `critical-flows.json`；`backgroundInputStatus` | `design.md`；`document-links.yaml`；按需 `contracts/*.yaml`；`findings.md` 中的设计决策摘要 | `G-DESIGN-01` `design.md` 存在；`G-DESIGN-02` 设计引用 spec；`G-DESIGN-03` 宪法检查（warning） | 设计只输出系统级 HOW，不输出实现级 HOW；多方案或外部证据不足时必须先 research；不要提前引入投机性层次 | 把 research 回流字段固定为“最终方案 / 采用理由 / 风险 / 待验证项”四段，减少 design.md 抽象化 |

### 05-research

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| 设计阶段的技术不确定性；外部网页 / 官方文档 / `context7` / `fetch` / `serena`；`summary.json`；`critical-flows.json`；`api-contracts.json` | `research.md`；`findings.md` 同步摘要；证据路径；方案对比；未验证假设 | 以证据为主；如果工具不可用可降级，但必须在 findings 标记；不得直接替代 design | 结论如果没有对比与证据，就不算 research；外部资料不能直接拍板成 design | 把 TYPE A/B/C 的输出模板与工具选择策略做成更短的速查表，降低误用 fetch/context7/serena |

## 4. 任务拆解与实现

### 06-task

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `spec.md`；`design.md`；`document-links.yaml`；任务依赖关系；`backgroundInputStatus`；`summary.json`、`critical-flows.json`、`structure-overview.json`、`api-contracts.json` | `task_plan.md`；`document-links.yaml`；`findings.md` 计划摘要；TASK ID / owner / 工期 / 依赖 / 验收标准 / 验证命令 | 阶段必须是 `03_plan`；必须读取 spec + design + links；任务粒度应在 2-4h；复杂场景可进入 Plan Mode | 粒度过粗会直接拖垮 code；`[P]` 并行标记和依赖链如果不清楚，会让批量执行失真；`task_plan.md` 的 canonical status 必须和 parser 对齐 | 把任务模板和 parser 字段一一对应，减少 canonical/legacy 混用；把并行和串行边界写成显式小节而不是散落在任务正文 |

### 07-code

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `task_plan.md`；`design.md`；依赖解析结果；上下文包；`runtime.auto_orchestrate.max_parallel`；`summary.json`；`conventions.json` / `entry-guide.json` 等辅助资产 | `task_plan.md` 状态推进；`findings.md` 执行记录；`batch-checkpoint.json`；`batch-report.md`；必要测试与代码修改 | 阶段必须是 `04_implement`；`design.md` 和 `task_plan.md` 必须存在；必须先解析依赖；单 TASK 需要 RED 或 WAIVER；worktree-first 对高风险变更生效 | 代码 Skill 文档里明确：当前 batch executor 仍未完全接入真实 subagent 链路；失败率控制 / 超时裁剪 / 多层并发控制仍偏目标态；`findings.md` 只是执行记录，不等于门禁 | 把“自动批量提示词”与“真实 runtime 接线”再分层说明，避免把提示词当能力；把 checkpoint/report 的写边界固定化，减少共享文件漂移 |

### 08-review

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| 代码变更；traces；测试证据；`constitution.md`；`findings.md` 中的 TDD 记录；`code-view` / `playwright-mcp`（如需） | `findings.md` 中的审查结论；MUST FIX / SHOULD FIX / OUT_OF_SCOPE 分类；通过后更新 TASK 状态 | Stage 1 合规先于 Stage 2 质量；TDD 证据必须新鲜；`OUT_OF_SCOPE` 不能包装成阻断项 | 很容易把质量问题先行升级为阻断，或者把历史欠账误当当前问题；如果合规没过，质量结论无效 | 把 Stage 1 / Stage 2 的输出模板拆开，强化“先合规后质量”的顺序感 |

### 12-verify

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `gate check` / `docs links validate` / `metrics report` 的新鲜输出；`findings.md`；`task_plan.md`；TDD 过程证据；当前阶段门禁条件 | `findings.md` 校验记录；PASS / PASS_WITH_WAIVER / FAIL 解释；阶段是否可推进的证据结论 | `G-VERIFY-01` 测试信号；`G-VERIFY-03` 安全扫描；`G-VERIFY-02` 在 skill 文档存在，但当前内置 registry 未见对应项；必须区分 gate 信号和 TDD 证据 | verify 只认新鲜证据；“之前通过过”不算；门禁通过不等于 TDD 闭环完整 | 把 gate 条件、TDD 证据、文档健康三个层次分栏展示，避免一张 PASS 掩盖过程缺口 |

### 11-plan

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| 当前 Feature 的 stage / metrics / gate history / tasks；`background_input_status`；`dependencyStrength` / `riskCategory` / `riskSignals`；`summary.json`；`critical-flows.json` | `findings.md` 的计划摘要；目标阶段；下一步动作；阻塞项；风险等级；建议命令 | 只做计划，不推进阶段；输出必须写入 `findings.md`；Plan Mode 结论要能被 orchestrate 直接复用 | 容易把计划写成空泛建议，或者把风险写成叙述而不是决策字段；`findings.md` 如果不落盘，计划就会丢失 | 把“目标阶段 / 下一步 / 阻塞项 / 风险等级 / 建议命令”做成固定小节，减少自由文本漂移 |

### 13-orchestrate

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| 当前 stage-state；task todo 状态；gate status；dependency check；auto-loop 状态；`background_input_status`；`dependencyStrength` / `riskCategory` / `riskSignals`；`summary.json` | 编排计划；批次检查点；`findings.md` 执行证据；必要时 stage advance；`READY_TO_ADVANCE / AUTO_ADVANCE` 决策 | 必须先用 verify 的新鲜证据；批次结束必须落盘；`--auto-advance` 只有在决策层明确就绪时才推进 | 不能越过检查点“带病推进”；并行任务与高风险变更会提升依赖强度；`07_release / 08_done` 是 runtime 责任链，不再有额外 skill 目录 | 把 `background_status -> dependency_strength -> risk_category -> recommended_action` 的投影链写成标准示例，方便多端一致输出 |

## 5. 状态、修复、索引与管理

### 16-sync

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `document-links.yaml`；阶段产物；验证证据；`findings.md`；`summary.json` / `entry-guide.json` 辅助认知 | `document-links.yaml` 回填；`findings.md` 审计日志 | 依赖 `docs links validate` / `docs links show`；必须先定位 Feature | 只能修索引，不能补内容；如果产物本身缺失，sync 不会自动生成正文 | 把“回填引用”和“审计日志”拆开写，避免审计结果被当作文档正文 |

### 17-feature

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| 当前 Feature 指针来源；`specs/` 目录下的 StageState；环境变量覆盖 | `list` / `current` / `switch` 结果；写入 `.spec-first/current` | `switch` 前必须确认目标存在且 state 匹配；失败时禁止写坏指针 | `.spec-first/current` 是共享状态，切换不是会话私有动作；多终端容易互相覆盖 | `switch` 成功后更强制提示 `catchup`，减少后续上下文错位 |

### 21-analyze

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `spec.md`、`design.md`、`task_plan.md`、`document-links.yaml`、`background_input_status`、`runtime/docs` 背景状态 | `reports/analysis-report.md`；按严重度排序的分析结论；背景质量结论 | 只读分析，不推进阶段；`CRITICAL` 数量会影响后续 gate 读取 | 容易把分析报告当作“建议”，但它实际是可被 gate 读取的结构化输入 | 把严重度输出与后续 gate 条件再做一次对齐，避免分析和门禁用词不一致 |

### focus-requirements

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| 已 review 的 source requirement；owner / side 标识；workspace project list；视觉证据（如截图 / 标注图）；可选历史模块文档与术语说明 | 仅三个固定输出：`docs/requirements/focus-requirements.md`、`handoff/side-requirements.md`、`handoff/handoff-summary.md` | required inputs 不齐时必须 `BLOCKED` 或 `NEEDS_CONTEXT`；不能把它变成第二份全局 PRD；不能越权做架构设计或任务拆分 | 当前仓库里未见独立 `src/cli` runtime handler；该节点主要由 skill 文档、模板与示例驱动；如果没有 reviewed source requirement，就不该继续 | 如果未来要做 runtime 接入，需要补 handler、参数校验、输出路径落盘和 gate；当前阶段先把 owner 边界写干净 |

## 6. 非 Skill 目录但属于主链路的 runtime 节点

### 07_release

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `06_wrap_up` 已完成后的发布证据；`specs/{featureId}/reports/smoke-test-report.md`；`specs/{featureId}/reports/release-note.md`；`contract:check` 结果 | runtime `golive` 路由；发布证据；阶段从 `07_release` 推向 `08_done` 的前置收口材料 | `G-REL-01` smoke test report；`G-REL-02` release note；`advance.ts` 当前实现对 `07_release` 走自动收口 | 它不是独立 skill 目录，而是 runtime route；如果把它当成普通 skill，会漏掉“发布证据 -> 自动收口”这条链 | 后续若接真实发布自动化，需要把发布动作、门禁、证据写回同一条链 |

### 08_done

| 输入 | 输出 | gate | 卡点 | 优化项 |
|---|---|---|---|---|
| `07_release` 自动收口后的终态；stage history；gate history；归档后的运行态证据 | 终态标记；只读结束态；`stage-machine.ts` 不允许再逆转 | 终态不可逆；`stage-machine.ts` 中 `TERMINAL_STAGES` 生效 | 如果把 `08_done` 当作“可继续操作的阶段”，会违反状态机；它只是交付结束态 | 在 UI / CLI 输出里把 done 明确标成终态，降低误操作 |

## 7. 代码层真实约束清单

```text
1. stage-machine.ts 只允许 00_init -> 01_specify -> 02_design -> 03_plan -> 04_implement -> 05_verify -> 06_wrap_up -> 07_release -> 08_done，外加每阶段可回到 09_cancelled。
2. advance.ts 的推进顺序是：依赖检查 -> gate 校验 -> warning 审计 -> 写 stage-state.json / gate-history.jsonl -> 必要时 context sync -> 07_release 自动收口到 08_done。
3. condition-registry.ts 的内置 Gate 条件只覆盖当前代码中注册的项；skill 文档里出现但 registry 未注册的条件，不应直接当成内置事实。
4. hard-gate.ts 把 design / code / orchestrate 的前置条件收得很紧，尤其是 spec.md、design.md、task_plan.md、worktree 高风险守卫。
5. first-runtime-store.ts / first-artifact-mapping.ts / first-docs-check.ts 形成 runtime 真源 -> docs 投影 -> docs 健康校验三层链路，docs 永远不是真源。
6. background-quality-contract.md 和 orchestration-governance-contract.md 把 background_input_status、dependencyStrength、riskCategory、riskSignals、recommendedAction 约束成统一协议。
```

## 8. 逐节点优化优先级

1. 先处理主链路中的事实真源节点：`00-first`、`03-spec`、`04-design`、`06-task`、`07-code`、`12-verify`
2. 再处理控制面节点：`11-plan`、`13-orchestrate`、`14-status`、`16-sync`、`17-feature`
3. 最后处理边缘与扩展节点：`00-onboarding`、`02-catchup`、`15-doctor`、`20-spec-review`、`21-analyze`、`focus-requirements`
4. 所有优化都应围绕三件事：节点输入更清楚、输出更可落盘、gate 更可机器验证

