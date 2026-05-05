# ECC Governance Completion Audit

Objective: $spec-work docs/02-架构设计/ECC集成/ECCAgent重叠治理V1技术方案.md 完成全部开发工作,做好审查
Review round count: 50

## Prompt-To-Artifact Checklist

| Requirement | Evidence |
| --- | --- |
| G0 current source inventory | current-agent-inventory.json/md |
| G1 ECC overlap matrix | ecc-agent-overlap-matrix.json/md |
| G1.5 ECC rubric extraction matrix | ecc-rubric-extraction-matrix.json/md |
| G1.6 ECC command idea matrix | ecc-command-idea-matrix.json/md |
| G2 agent packs preview | agent-packs.json/md |
| G3 registry preview + drift policy | agent-registry.json |
| G4 router candidate facts | router-candidate-policy.json/md |
| G5 finding schema compatibility | finding-compatibility-policy.json/md |
| G6 skill synthesis policy | synthesis-policy.json/md |
| G6.5 host compatibility + runtime merge policy preview | capability-host-compatibility.md and capability-runtime-merge-policy.md |
| Quality gates and pilot scenarios | quality-gates.json/md and node-quality-pilot-scenarios.json/md |
| 50-round review | completion-audit.md |

## 50-Round Review

| Round | Question | Evidence | Status |
| ---: | --- | --- | --- |
| 1 | G0 inventory 是否覆盖 51 个 source agent | current-agent-inventory.json 记录 agent_count，测试校验数量 | covered |
| 2 | G0 是否每个 agent 有唯一 id | inventory generator 从 frontmatter name / 文件名提取并做唯一性检查 | covered |
| 3 | G0 是否处理个人名 agent | kieran / dhh / ankane / julik 均映射 rename_generic 或 style_profile | covered |
| 4 | G0 是否区分 source 与 runtime | 所有 source_file 指向 agents/*.agent.md，不引用 .claude/.codex runtime 作为 source | covered |
| 5 | G1 是否覆盖 48 个 ECC agents | overlap matrix 记录 ecc_agent_count 和每个 ECC agent entry | covered |
| 6 | G1 direct_match 是否禁止新增 agent | direct_match entry 的 integration_action 为 enhance_existing | covered |
| 7 | G1 missing_in_spec_first 是否有 reason | missing/reference/optional entries 都有 reason | covered |
| 8 | G1 style/domain 是否不进 P0/P1 | seo/healthcare/GAN/style 均为 reference_only 或 P3 | covered |
| 9 | G1 spec_first_native 是否不被 ECC 覆盖 | native agents 只在 registry 标记 native，不映射 ECC 覆盖 | covered |
| 10 | G1 overlap 是否保留多目标关系 | code-reviewer 等映射到多个 spec-first reviewer | covered |
| 11 | G1.5 是否只提取高价值研发样本 | rubric matrix 首批限定 security/testing/API/data/frontend/architecture/research/governance | covered |
| 12 | G1.5 是否有 source_file | 每条 adopted/deferred/rejected entry 都有 ecc_source_file 或 reason | covered |
| 13 | G1.5 是否有 freshness | 每条 entry 有 source_revision、loaded_from、freshness、runtime_cached | covered |
| 14 | G1.5 是否防止全量 prompt 注入 | matrix 只记录摘要和 target，不保存 ECC skill 正文 | covered |
| 15 | G1.5 是否排除非研发领域 | excluded entries 不进入 capability pack 或 router candidate | covered |
| 16 | G1.6 是否覆盖 68 个 ECC commands | command idea matrix 记录 command_count 和所有 command entry | covered |
| 17 | G1.6 是否禁止 command import | adoption_action 仅 enhance_existing_workflow/reference_only/rejected | covered |
| 18 | G1.6 是否禁止 /ecc 或 $ecc | 生成器不创建 command template 或 runtime registry | covered |
| 19 | G1.6 是否区分 Claude/Codex command parity | command matrix 声明 legacy prompt reference only | covered |
| 20 | G1.6 是否映射到现有 workflow | command ideas 只指向 spec-* workflow 或 reference_only | covered |
| 21 | G2 是否生成 P0/P1/P2/P3 pack preview | agent-packs.json 包含 core/conditional/optional/style_profile | covered |
| 22 | G2 P0 是否默认 enabled | core packs default_enabled=true，仅为候选池，不绕过 Skill | covered |
| 23 | G2 P2/P3 是否默认 disabled | optional/style packs default_enabled=false | covered |
| 24 | G2 excluded domain 是否不在 pack 中 | excluded domain references 独立记录，不生成 capability pack | covered |
| 25 | G2 style profile 是否不能 blocker | style-profile-pack policy 记录 blocker 禁止 | covered |
| 26 | G3 registry 是否覆盖所有 source agents | agent-registry.json entries 与 inventory agent_count 一致 | covered |
| 27 | G3 registry 是否有 source_revision | registry metadata 写入 source_revision 与 stale_policy | covered |
| 28 | G3 registry 是否不是 source-of-truth | registry metadata 声明 source wins | covered |
| 29 | G3 routable agent 是否有 workflows/forbidden_actions | 每个 entry 有 allowed_workflows、trigger_signals、forbidden_actions | covered |
| 30 | G3 synthesis_ready 是否声明 output_schema | registry entries 统一声明 workflow-native schema compatibility | covered |
| 31 | G4 router 是否只输出 candidate facts | router-candidate-policy 明确 candidate_agents/reason_code/budget_hint/degraded_mode | covered |
| 32 | G4 router 是否不输出 selected_agents | 测试扫描 generated artifacts 禁止 selected_agents 字段出现在 router output schema | covered |
| 33 | G4 是否有低风险 typo 场景 | pilot scenarios 覆盖低风险 docs typo 不调用重专家 | covered |
| 34 | G4 是否有风险触发场景 | pilot scenarios 覆盖 auth/API/migration/tsx/skill 变更 | covered |
| 35 | G5 是否保留 workflow-native schema | finding-compatibility-policy 明确 native schema wins | covered |
| 36 | G5 是否不反向改写 native finding | Finding Core 仅 compatibility view | covered |
| 37 | G5 是否有 evidence/confidence/not_reviewed | policy 明确 core 字段和降级规则 | covered |
| 38 | G6 synthesis 是否不是拼接长文 | synthesis-policy 包含 merge/dedupe/rank/downgrade/reject/adopt | covered |
| 39 | G6 Skill 是否保持最终裁判 | synthesis-policy 明确 final verdict belongs to Skill | covered |
| 40 | G6 是否保留 code-review/doc-review 特有字段 | policy 明确 autofix_class/owner/finding_type/deferred_questions 不丢失 | covered |
| 41 | G6.5 是否生成 host compatibility preview | capability-host-compatibility.md 覆盖每个 pack host_support | covered |
| 42 | G6.5 是否生成 runtime merge policy preview | capability-runtime-merge-policy.md 覆盖 marker/add-only/preview-first | covered |
| 43 | G6.5 是否不实现 runtime delivery | runtime_delivery=none_in_v1，lifecycle doctor/clean/state=future | covered |
| 44 | 双宿主是否同时覆盖 Claude/Codex | host_support 为每个 pack 提供 claude/codex/fallback/unsupported_reason_code | covered |
| 45 | source freshness 是否区分 provider source 与 runtime cache | loaded_from=provider_source，runtime_cached=false | covered |
| 46 | 插件化是否不是 ECC 整包安装 | capability provider 只进 inventory/rubric，runtime delivery pack-gated | covered |
| 47 | 业务运营/媒体/金融/物流/医疗/web3 是否不集成 | excluded domain refs 不进入 capability pack/router/runtime roadmap | covered |
| 48 | generated runtime 是否未被触碰 | 生成路径限定 docs/02-架构设计/ECC集成/generated | covered |
| 49 | CHANGELOG 是否记录 source 变更 | CHANGELOG 顶部新增 docs(ecc) 记录 | covered |
| 50 | 完成审查是否有 prompt-to-artifact checklist | completion-audit.md 映射目标、文件、gate、测试和证据 | covered |
