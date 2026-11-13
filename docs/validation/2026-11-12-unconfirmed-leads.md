# SUP 深度审查未确认线索核验（U16）

- 日期：2026-11-12
- 计划：`docs/plans/2026-11-12-001-fix-sup-remaining-validation-plan.md`（U16）
- 上游报告：`docs/validation/2026-11-09-harness-full-code-deep-review.md`
- 范围：该报告仍标注为“待跨包核对/未确认”的 14 条静态线索
- 授权状态：只读本地源码与本地命令；无外部网络、无模型调用、无宿主写入、无实现修改
- 结论口径：`confirmed`（源码可直接确认的现象或合同不一致）、`not-a-defect`（当前合同下不是缺陷，附保留边界）、`insufficient-evidence`（本地无法取得决定性证据）

## 结论摘要

| 结论 | 数量 | 线索 |
| --- | --- | --- |
| confirmed | 5 | A1、B3、B4、B5、C1 |
| not-a-defect | 6 | A2、A3、B1、B2、B6、C2 |
| insufficient-evidence | 3 | C3、C4、C5 |

按 KTD13，本轮不顺手修复任何线索；confirmed 项只登记为 follow-up 候选。所有 confirmed 结论均为**源码/文档层面的现象**，不是 live 行为缺陷：本轮没有运行任何一个被测 skill 的模型会话。

## 批次 1：App audit 接口线索

来源：`docs/validation/2026-11-09-harness-full-code-deep-review.md:346`（“尚需跨包核对”段）。

### A1. Planner 允许专家列表缺少 `Page Route Expert` — confirmed

- **位置：** `skills/spec-app-consistency-audit/prompts/audit-planner.md:50-65`（`allowed experts` 11 项，无 Page Route Expert）；`skills/spec-app-consistency-audit/prompts/page-route-expert.md` 存在且被 `references/ecc-source-lock.json:48,134` 登记为 target prompt。
- **当前行为：** SKILL 规定专家选择在 planner 的 allowed guardrails 内进行（`SKILL.md:187`），orchestrator 只调度 audit-plan 选中的专家（`prompts/orchestrator.md:32`）。Page Route Expert 不在允许列表，因此无法通过文档化路径被选中；page-route 证据链只能由其它专家（product/analytics/figma 等）在各自 lens 中消费 `page-route-contract`（如 `prompts/product-expert.md:22`）。
- **结论：** confirmed。这是“资产存在但入口不可达”的合同不一致，不是伪造能力声明。
- **限制：** 未运行 audit 会话，无法判断 planner 在真实输入下是否会自行列出 Page Route Expert 并越出 allowed 列表；也未统计 route-chain 覆盖缺口在真实 run 中的比例。
- **Follow-up 候选：** 二选一——把 Page Route Expert 加入 allowed experts（并纳入 max 5 预算），或在 planner/orchestrator 中明确“page-route 只作 lens，不可作为独立专家”。

### A2. Headless `summary_path` 指向 runner 不创建的 Markdown — not-a-defect

- **位置：** `scripts/build-run-metadata.js:106`（生成 `summary_path`）、`scripts/render-headless-envelope.js:40`（envelope 打印 Summary 行）、`SKILL.md:119`（“Report-Writer markdown summaries are downstream responsibilities today”）、`schemas/metadata.schema.json:25`（必填）。
- **当前行为：** runner 只写 JSON 脊柱与 headless envelope（`scripts/run-audit.js:631` 写 `latest-summary.json`），不写 `app-consistency-audit.summary.md`；SKILL 明文把该 Markdown 归给下游 Report Writer，`summary_path` 是写入地址而非 runner 产物。
- **结论：** not-a-defect。跨包核验未发现任何外部 consumer 读取该路径（全仓检索只命中 `workspace_summary_paths` 等无关字段）。
- **保留边界：** envelope 的 `Summary:` 行没有声明“文件可能尚不存在”，只读 envelope 的调用方可能把地址当作已完成产物。
- **Follow-up 候选：** 在 envelope 行尾或 `mode-output-contract.md` 补一句“路径由下游 Report Writer 写入”。

### A3. 部分参数只到 metadata/impact，不到领域 producer — not-a-defect

- **位置：** `scripts/run-audit.js:375-500`（token→子脚本分发）、`:64`（`--max-files` 帮助文本“传给 metadata/diff 扫描的最大文件数”）、`scripts/build-run-metadata.js:101`（`depth` 写入 metadata）、`prompts/audit-planner.md:23`（planner 直接读取 `mode/depth/industry/expected_inputs`）。
- **当前行为：** `depth` 只进 metadata 与 planner 的调用参数；`industry`/`industry-profile` 进 metadata、impact-facts 与 `build-industry-profile.js`；`expected_inputs` 进 metadata 与 preflight（降级分类）；领域 extractor 只收 `sharedSourceFlags` 与上游 contract 路径。
- **结论：** not-a-defect。各 token 到达的是它实际治理的层：`depth` 是 LLM lens（`references/mode-output-contract.md:35`），`--max-files` 自述只覆盖 metadata/diff 扫描，`expected_inputs` 决定降级而非提取。
- **保留边界：** 没有一张“token → 消费者”的映射表，未来新增 token 时无法用文档判断哪些层应当收到它。
- **Follow-up 候选：** 在 `mode-output-contract.md` 增补 token→consumer 表格。

## 批次 2：runtime setup 文档与边界线索

来源：`2026-11-09-harness-full-code-deep-review.md:350`（configured dependency / renderer / TOML）与 `:356`（eval README / examples / parent diagnostic）。

### B1. Configured dependency 命令归一化边界 — not-a-defect（advisory 精度限制）

- **位置：** `skills/spec-runtime-setup/scripts/lib/configured-dependencies.cjs:289-295`（`commandName`：剥离 `env`/`KEY=VALUE` 前缀后取第一个 token 的 basename）、`:250-262`（`undeclared` 判定）。
- **当前行为：** 只做文本级归一化。`npx foo`、`uvx foo`、`bun x foo` 归一为 wrapper；Windows `foo.cmd`/`foo.exe` 保留扩展名（不与 registry 的裸命令名对齐）；`${VAR}` 展开、shell 管道与 `&&` 链不解析。
- **消费者核验：** 结果进入 `tool-facts.json` 的 `configured_dependencies`，仅在人类摘要“Host 已配置依赖”小节逐条展示（`renderer.cjs:260`）；`overall_status` 只由 `baseline_ready`/`host_runtime_ready`/manifest/`items`/`provider_readiness` 决定（`renderer.cjs:300-315`），`facts.cjs` 也只透传该数组（`:370`、`:628-629`）。
- **结论：** not-a-defect。归一化误差只影响 advisory 提示精度，不影响 readiness 判定或写入决策。
- **限制：** 未统计真实仓库中 wrapper/Windows 形态造成误报的比例。
- **Follow-up 候选：** 在 `configured-dependencies.cjs` 头部注释或 SKILL 中标注“advisory 文本归一化，不做 shell 语义解析”。

### B2. Renderer 默认 summary 与执行 summary 的关系 — not-a-defect

- **位置：** `scripts/lib/renderer.cjs:202-210`（`executionSummary` 缺省时回退 `deriveExecutionSummary`）、`:300-325`（回退值固定 `scope: 'full'`、`selected_ids: []`）；`scripts/lib/runtime-executor.cjs:276,294`（生产路径构造并传入 `execution_summary`，其 `buildExecutionSummary` 在 `:299-325` 计算 `subset`/`installation`/`full`）。
- **当前行为：** 生产路径始终传入真实执行摘要，`--only`/`--verify-only` 等子集会显示 `scope=subset`；回退分支只在直接调用 `renderHumanSummary` 时生效（当前仅测试这样做，`tests/unit/mcp-setup-facts-renderer.test.js:287,645,669,704,746`）。
- **结论：** not-a-defect。回退不是可到达的生产错误标签路径。
- **保留边界：** 未来若有新调用方漏传 `executionSummary`，摘要会误报 `scope=full`、`selected=none`，且没有任何断言拦截。
- **Follow-up 候选：** 让 `executionSummary` 成为显式必填参数，或在回退分支写入 `scope: 'unknown'`。

### B3. TOML 子表与完整文法校验边界 — confirmed（文法边界）

- **位置：** `scripts/lib/toml-section-editor.cjs:200-234`（`analyzeToml` 只解析 header 与多行字符串状态）、`:245-251`（子表识别）、`:624-627`、`:678-681`（`toml-target-subtable-unsupported` 失败关闭）、`:257-259`（`toml-target-table-duplicate` 失败关闭）。
- **受控实验（本轮执行）：**
  - 目标表含子表 `[mcp_servers.foo.env]` → `upsertMcpSection` 返回 `{ok:false, reason_code:"toml-target-subtable-unsupported"}`。
  - 目标表同名前出现 `[[mcp_servers.list]]` 数组表 → 仍返回 `{ok:true, reason:"toml-target-table-updated"}`。
  - 同文件含非 header 的非法行 `this is not toml` → `{ok:true, changed:true, reason_code:"toml-target-table-updated"}`，非法行被原样保留。
  - 对照 JSON 路径：`scripts/lib/host-config.cjs:577-580` 对整份 JSON 做全量 `parseJsonConfig`，语法错误即失败。
- **结论：** confirmed。TOML 路径只对 header 文法与歧义失败关闭（`toml-grammar-ambiguous`），不对整份文档做全量文法校验；子表本身是**显式失败关闭**，不构成缺陷。语法已损坏的 TOML 会被继续编辑并报告成功，写入不会比输入更坏，但“成功”不蕴含“文件仍是合法 TOML”。
- **限制：** 未验证 Codex/OpenCode 等宿主 provider 是否会在读取时拒绝该文件；本轮无宿主运行证据。
- **Follow-up 候选：** 在 `upsertMcpSection` 的 reason_code 或 SKILL 中区分“表更新成功”与“整份文档文法未校验”；若要求更强保证，可引入 vendored TOML 解析器只读校验。

### B4. Eval README 的退出码 2 已陈旧 — confirmed（文档漂移）

- **位置：** `skills/spec-runtime-setup/evals/README.md:9`（“要求引擎以退出码 `2` 返回”）；`evals/fixtures/scripts/check-bare-mutation.sh:5-6`（“claude_code 引擎的会话级 `EVAL_EXIT_CODE` 恒为 0……blocked 退出码合同属于 setup CLI 调用自身（A25 修正）”）。
- **本轮验证：** `npx jest tests/unit/runtime-setup-eval-judge.test.js --runInBand` → 28/28 PASS。上游报告 2026-11-09 记录的“27 通过 / 1 失败”（`:280`）在当前工作树已不复现，判据与校准已对齐 A25 口径。
- **结论：** confirmed 但仅限 README 一行文字；判据侧已正确，旧失败是已修复的历史状态。
- **限制：** 未运行该 case 的 live 评测，因此只能证明离线校准，不证明 live 下 bare 调用真的被 fail-closed。
- **Follow-up 候选：** 把 README 改为“引擎 `EVAL_EXIT_CODE` 不作为 blocked 信号；blocked 由 setup CLI 自身退出码与最终输出共同证明”。

### B5. `examples.json` external-hook 例与 SKILL 只读检查矛盾 — confirmed（文本矛盾）

- **位置：** `skills/spec-runtime-setup/evals/examples.json:65-75`（“do not inspect or mutate the external hook”）；`SKILL.md` Graphify 段（“有效 hooks root 位于项目外时，setup 只读 `post-commit`/`post-checkout` 两个普通文件，检测 Provider marker 与 legacy override”）。
- **当前行为：** SKILL 要求一次**有界只读**检查以区分 `verified-external` / `blocked` / `legacy-artifact-override`；examples 的 expected_outcome 禁止“inspect”，并额外要求不得声称 hook 不存在或不可执行（这两条与 SKILL 一致）。
- **结论：** confirmed。冲突只在“是否允许有界只读检查”这一点；`do not inspect` 与“只读两个普通文件”互斥。
- **限制：** examples 只作为 editing/reviewing/fresh-source eval 的上下文（`evals/README.md:5-6`），无脚本消费，因此不影响确定性判据；实际影响是在 fresh-source 评估中可能诱导模型拒绝合法只读检查。
- **Follow-up 候选：** 把该条改为“不得执行/写入/修改 external hook；允许对 `post-commit`/`post-checkout` 两个普通文件做有界只读检查”。

### B6. Parent diagnostic 默认建议包含 repair flag — not-a-defect

- **位置：** `scripts/lib/workspace-parent-diagnostic.cjs:32-37`（`child_provider_setup.commands` 含 `--repair-host-config`）、`:88-90`（“If host MCP config drifts …, re-run with `--repair-host-config`”）；`SKILL.md` Default Diagnostic Flow 第 3-4 步（“冲突只报告 path/key/reason，不自动追加 `--repair-host-config`”“未授权的新副作用需要确认；预览成功本身不授予写入权限”）。
- **当前行为：** 诊断输出把带 flag 的命令当作 next action 展示；SKILL 明文禁止自动追加该 flag，并要求新副作用单独确认。
- **结论：** not-a-defect。建议命令不等于授权，授权边界落在 SKILL 的执行步骤上。
- **保留边界：** 模块输出句本身不带“需要用户确认”的限定，只读该输出（不读 SKILL）的调用方可能把它当作已授权指令。
- **Follow-up 候选：** 在该 nextAction 文案后追加“（需用户确认后执行）”。

## 批次 3：brainstorm / POV / prototype 线索

### C1. `spec-brainstorm` 交互专用声明与 headless 分支的关系 — confirmed（文本不一致）

- **位置：** `references/synthesis-summary.md:11`（“The skill is interactive by design … There is no non-interactive mode; if an automated workflow needs a Product Contract without dialogue, the right move is to write the unified plan artifact from context directly, not to invoke `spec-brainstorm`”）；与之并存的 headless/pipeline 分支：`references/blindspot-pass.md:22`（“in a pipeline or headless run where no user can answer, never fire the offer”）、`references/output-mode.md:15`（pipeline 强制 `OUTPUT_FORMAT=md`）、`references/plan-write.md:20`（“If the run pauses, becomes headless …”）、`references/handoff.md:62`（`spec-lfg` “hands `spec-plan` that artifact path in pipeline mode and cannot prompt”）。
- **当前行为：** 主声明否认存在非交互模式，同时四处引用声明 pipeline/headless 运行可以存在；`references/interaction-rules.md:19` 又规定“Never silently skip the question”，只有 blindspot offer 给了非交互降级规则。
- **结论：** confirmed 的**合同文本不一致**：pipeline 调用时无法提问，但除 blindspot 外没有“哪些问题可以降级为记录假设”的规则。
- **限制：** 未运行 pipeline 下的 live brainstorm，无法判断实际输出是停在提问、还是自行记录假设；本轮不把它升级为行为缺陷。
- **Follow-up 候选：** 统一一处 pipeline/headless 规则（建议在 `interaction-rules.md` 增一条“无交互通道时阻断问题降级为显式假设”，与 `blindspot-pass.md:22` 同构），或按 `synthesis-summary.md:11` 明确禁止 pipeline 调用并改由 caller 直接写产物。

### C2. brainstorm → plan 的 producer/consumer 消费边界 — not-a-defect

- **位置：** producer：`references/plan-write.md:18`（`artifact_contract: spec-unified-plan/v1`、`artifact_readiness: requirements-only`、`product_contract_source: spec-brainstorm`、`execution: code`、Markdown 另有 `status: active`）；consumer：`skills/spec-plan/references/intake.md:9,42,44,45`（enrich 同一文件，识别两种 origin 形态）、`references/resume.md:18,25`（requirements-only 不得进入 deepen fast path，是 enrichment 输入而非 resume 目标，pipeline 场景不弹 resume 确认）。
- **结论：** not-a-defect。字段集、路径约定、pipeline 传参方式在两侧一致；消费侧对 requirements-only 的处理是显式规则而非隐含假设。
- **限制：** 未运行一次真实 brainstorm→plan 交接，未验证写入的 frontmatter 实际取值（上游报告 `:344` 已指出产出用例只以 final 中的路径字符串判通过）。
- **Follow-up 候选：** 若后续补 live 用例，应断言产物 frontmatter 而非最终文本路径。

### C3. POV Windows `__supervise` 入口 — insufficient-evidence

- **位置：** `skills/spec-pov/scripts/peer-job-runner.py:2242-2245`（仅 `IS_WINDOWS` 且 `argv[0] == "__supervise"` 时进入内部入口，POSIX 下走 argparse 报错）、`:1668-1720`（detach 写 `.spawn.json` 并以 `DETACHED_PROCESS`/`CREATE_BREAKAWAY_FROM_JOB` 重入）、`:1726-1760`（`_check_owned_dir` + `read_owned` 读取 spawn spec 后删除）、`:892-901`（Windows 用 SID 所有权替代 `st_uid`）、`:961-975`（`O_NOFOLLOW` + 句柄 owner SID 校验）、`:768-772`（`_win_owns_path`/`_win_owns_handle`）。
- **当前行为（静态）：** 内部入口只在 Windows 可达；目录与 spawn spec 都做所有权校验，spec 以 no-follow 方式读取；`__supervise` 不经过 `_require_detach_support`/receipt 门（设计上只由 detach 路径发出）。三份副本有 parity 测试，`_pre_reuse_descendant_pids` 有 kill-set 行为测试（`tests/unit/peer-job-runner-parity.test.js`、`tests/unit/peer-job-runner-killset.test.js`），但这些测试不覆盖 `_win_*` 分支。
- **结论：** insufficient-evidence。当前平台为 macOS，无法执行 Windows 分支；静态检查未发现明显的无主权限路径，但“静态合理”不等于“已运行验证”。
- **限制：** 无 Windows CI 证据；`__supervise` 的 spawn spec 中 `conf` 字段未做二次路径校验（由调用方保证），未验证恶意 spec 的影响面。
- **Follow-up 候选：** 增加可在 POSIX 上模拟的 owner-check/spec-parse 层测试，或补 Windows CI job；在文件头声明 `__supervise` 按设计绕过 receipt/detach-capability 门。

### C4. POV 历史 job recovery（Windows 存活判定）— insufficient-evidence

- **位置：** `peer-job-runner.py:805-812`（`_win_pid_alive`）、`:1096-1118`（`_pid_alive`/`_pid_running` 在 Windows 走 `OpenProcess`）、`:846-854`（PID 复用与 stale-PPID 子树保留）。
- **当前行为（静态）：** Windows 存活判定用 `OpenProcess` + 退出码，僵尸进程与 PID 复用都有专门处理；POSIX 走 `kill(pid,0)`/wraps。
- **结论：** insufficient-evidence。同样是平台不可达；本轮只能确认代码路径存在且被注释解释。
- **限制：** 未在 Windows 上恢复过历史 job；`normal start` 的 fail-closed 关闭（上游已核）不能自动证明 recovery 路径安全。
- **Follow-up 候选：** 同 C3，补平台级验证；在此之前不把 Windows recovery 计入已验证能力。

### C5. prototype/polish 框架 recipe 的第三方版本叙述 — insufficient-evidence

- **位置：** `skills/spec-polish/references/dev-server-remix.md:7-8,56`（“Remix 2.x+ on Vite has no `remix.config.*` … resolves as `vite` type”）、`skills/spec-polish/references/dev-server-next.md:7,10-27`（启动命令与 package manager 优先级）、其余同目录 recipe 同型。
- **当前行为：** recipe 以框架版本行为作为分类前提，属于外部事实；仓库内无对应的官方文档快照或版本断言测试。
- **结论：** insufficient-evidence。按 U16 的授权规则，本轮不发起网络请求，也不据记忆背书版本事实。
- **限制：** 只能在获得外部数据访问授权后逐条对照官方文档核实。
- **Follow-up 候选：** 有外部访问授权时核对一次并记录核对日期；在此之前 recipe 只作分类启发式，不作为版本事实引用。

## 本轮执行的命令与证据

- `rg`/`sed` 只读核验：`skills/spec-app-consistency-audit/**`、`skills/spec-runtime-setup/**`、`skills/spec-brainstorm/references/**`、`skills/spec-pov/scripts/peer-job-runner.py`、`skills/spec-polish/references/**`。
- `node -e` 直接调用 `toml-section-editor.cjs` 的三个受控输入（子表 / 数组表 / 非 header 非法行），输出见 B3。
- `npx jest tests/unit/runtime-setup-eval-judge.test.js --runInBand` → 28/28 PASS，用于 B4 的校准现状。
- 全仓检索 `summary_path` 外部消费者与 `--max-files`/`depth` 文档归属，用于 A2/A3。

## 未执行与限制

- 未运行任何 audit / runtime-setup / brainstorm / POV / prototype 的模型会话；confirmed 项全部是源码与文档现象。
- 未执行 Windows 相关路径（C3/C4）与外部版本核对（C5）。
- 未修改任何实现或文档文本；follow-up 候选是否修复由用户另行决定。

## 结论边界

本文件把上游报告中的“可能有问题”收敛为 14 条带证据的处置，其中 5 条 confirmed 均可在 `file:line` 级别复核。它不证明这些线索之外不存在缺陷，也不改变上游报告已确认的 SUP 编号结论；`docs/validation/2026-11-09-harness-full-code-deep-review.md` 的历史文本保持不变。
