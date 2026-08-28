---
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan
status: active
execution: code
---

# spec-project-rules 知识层强化（切片 1）实施与过程合同层（B 线）架构设计 - Plan

## Goal Capsule

- **objective**: 实施需求计划 2026-08-28-001 的切片 1（A1–A6，知识层，文本级），并给出 B 线（过程合同层）的架构级设计供后续切片评审。
- **product authority**: 上游 requirements-only 计划 `2026-08-28-001-feat-ai-dev-knowledge-and-process-contract-plan.md`。
- **open blockers**: 无。

## Part 1：切片 1（A1–A6）实施设计

### 1.1 变更总览

| 变更 | 文件 | 性质 |
| --- | --- | --- |
| A1 准入三问 | `skills/spec-project-rules/references/mining-method.md`、`SKILL.md`、`evals/trigger-cases.json` | 文本 + eval |
| A2 C4 查重义务 + 能力指针 | `mining-method.md`、`references/knowledge-format.md`、evals、hszq-app 实例 | 文本 + eval + 目标仓写入 |
| A3 生命周期元数据 + 减法审查 | `knowledge-format.md`、`SKILL.md`、evals | 文本 + eval |
| A4 四族指针区 | `knowledge-format.md`、`SKILL.md`、hszq-app index | 文本 + 目标仓写入 |
| A5 词汇边界 | `SKILL.md`、`mining-method.md` | 文本 |
| A6 合同冻结 | `knowledge-format.md` | 文本 |
| 治理面 | 契约测试、CHANGELOG、ce-localization 再生、六宿主 init | 常规 |

skill 包文件数不变（ce-localization 口径：governance 注册 37 skills / package_path_count 577 保持，非文件系统原始计数），eval 23→27（新增 NEG-004、TRIGGER-005、BOUNDARY-006、UPDATE-003 四条）。

### 1.2 A1 规则准入三问

- `mining-method.md` 基础策略新增条目：**准入三问**——`AI 不知道这个吗（私有事实）/ AI 的默认会错吗（偏离）/ 这条只属于这里吗（公司特性）`；三问全否的候选不写入；通识、语言/框架默认、模型已不生成的 anti-pattern（如 AsyncTask 禁令）一律挡在门外；依据：Anthropic 2026-07 删除 80%+ 系统提示词事件（Claude 官方 "Would removing this cause Claude to make mistakes?" 测试同源）（通识入规则零收益）。
- `SKILL.md` Quality Checks 增加一行引用三问（保持正文轻量，细则留 reference）。
- eval 新增 `NEG-004`：用户要求把"函数不要过长/写清晰注释"等通用规范写入知识库 → should-not-trigger（通识拒写）。
- hszq-app 回检（通过判据写死）：22 条规则逐条过三问，输出回检报告；**通过 = 全部条目至少一问有肯定证据**；个别边界条目（预登记候选：RULE-004"新增类必须 Kotlin"偏通识、但其"编辑 Java 保持 Java"子句为私有偏离，可拆分处理）须以三问重测记录 + 保留理由落盘，并联动 invalidation_condition 复核，owner 裁决后才算回检通过——不是只交报告。

### 1.3 A2 C4 查重义务 + 能力指针

- `mining-method.md` 编码类别新增 **C4 查重义务**：识别"AI 最可能重复造轮子的域"（utils/组件/HTTP 客户端/格式化/校验），每域产出一条义务规则：`先查哪里（含可复现检索式）→ 不存在才新建 → 新建后归位到共享层`；禁止产出条目级组件清单。
- `knowledge-format.md` 新增能力指针模板：

  ```markdown
  ### REUSE-00X <能力域>（如：金额/日期格式化）
  - 住址: <package/模块路径>
  - 查法: `rg "<模式>" <dirs>`
  - 义务: 新建同类前必先检索；发现即复用；新建后归位本域
  ```

- eval 新增 `TRIGGER-005`："把金额格式化的查重义务回写进知识库" → should-trigger（update 模式，产出 C4 义务条目）。注意：直接编码请求（"帮我写一个格式化函数"）不触发本 skill（路由 spec-work/Direct Lane，由知识库的查重规则约束该会话）——审查修正，原设计误扩触发面。
- 落位双轨裁定（审查修正）：能力指针条目以 `REUSE-` 前缀落 `reuse-contracts.md`；查重义务条目以 `RULE-` 前缀落 `coding-rules.md`（义务是行为约束，指针是存在性事实）。
- hszq-app 实例写入（update 模式，marker 内，两条）：`reuse-contracts.md` 增 `REUSE-006`（金额/日期格式化能力域：住址+查法）；`coding-rules.md` 增 `RULE-006`（查重义务：先查 `formatMoney`/`QuotesFormatUtil`，检索式 `rg -i "format.*money|money.*format" common quotes-common platformcomm <本模块>`）。

### 1.4 A3 生命周期元数据 + 减法审查

- `knowledge-format.md` 条目模板元数据扩展：`owner`（默认目标仓库 maintainer）、`consumer`（预期消费端）、`invalidation_condition`（何时失效）、`last_verified_commit`；均可选但 confirmed 条目必填 owner。
- stale 语法升级为双原因：`status: stale(reason: code-drift | model-obsolescence, evidence: <反证 refs 或三问重测记录>)`。
- `SKILL.md` Workflow 8 补 stale 双原因；Workflow 第 1 步 verify 分支补"stale 候选须标注双原因"（verify 报告载体 = verify 模式 closeout 清单）；Step 9 closeout 增加可选减法审查步骤：**当用户告知宿主模型已大版本更新时**发起（skill 无法自判模型版本——审查修正；可选元数据 `verified_against_model` 记录用户口供），对知识库逐条重测三问，model-obsolescence 候选在 preview 中列出交 owner 裁决（不自动删除）。
- hszq-app 增补（审查漏项）：7 条 confirmed 条目回填 `owner`，并同批刷新 `last_verified_commit`（三问回检本身即一次 verification）。
- eval 新增 `BOUNDARY-006`："新模型发布了，知识库规则还适用吗" → 减法审查行为（重测三问、列候选、不自动删）。

### 1.5 A4 index.md 四族指针区

- `knowledge-format.md` index.md 骨架更新为：

  ```markdown
  - freshness: ...
  - 导读: ...
  - pre-development pointers（只放 owner 路径；各族状态由 preflight 运行时判定，index 不维护状态快照——避免第二真相源）:
    - 静态: 本库五文件
    - 操作: 命令文档/setup 脚本路径
    - 治理: <!-- B 线切片随行：CODEOWNERS/CI 入口 -->
    - 动态: <!-- B 线切片随行：ledger/handoff 位置 -->
  - 已知局限: ...
  ```

- `SKILL.md` Outputs 补 `index.md` 含四族指针区骨架；**治理/动态两族指针推迟到 B1/B6 落地的切片随行加入**（当前指向不存在的 owner，消费者价值为零——审查修正），骨架只留注释位。
- eval 新增 `UPDATE-003`："在 index 里把构建命令文档也指进去" → should-trigger（update 模式，产出指针区）。
- hszq-app `index.md` 实际增补（update 写入）：静态=本库；操作=CLAUDE.md 构建命令节 + app-gradle 脚本；治理/动态留注释位。

### 1.6 A5 词汇边界 + A6 合同冻结

- A5：`SKILL.md` When Not To Use 增一句：全量业务词汇表归 `CONCEPTS.md`/spec-compound，本 skill 只管理与边界/契约直接相关的术语；`mining-method.md` A1 补词汇处理原则。
- A6：`knowledge-format.md` 新增小节：DEP 结构化行格式（7 字段：规则 id/from/to/允许方向/grade/source refs/例外/status）标注为**contract-candidate**——首个机器消费者（CI 导出/脚本解析）出现时才冻结为 v1；冻结触发条件显式记录；冻结前字段演进自由，冻结后变更需升 `docs-architecture/v2`。审查修正：原方案在零外部消费者时冻结属过早承诺（skill 目录尚未提交、无兼容负担，且两份计划字段清单不一致）。

### 1.7 验证矩阵与回滚

- 契约测试：资产断言增三问/C4/四族指针关键词；**新增** eval 数量断言（cases.length === 27，现状无此断言——审查修正）与 coverage_tags/case 标签一致性检查；落点 `tests/unit/spec-project-rules-contracts.test.js`。
- 验证序列：`lint:skill-entrypoints` → `typecheck` → 脚本/契约套件 → ce-localization 再生链（refresh→surgery→generate→verify）→ 全量 unit → 六宿主 `spec-first init`。
- hszq-app 侧验证：22 条规则三问回检报告；RULE-006 与四族指针写入后的 grep 验收（marker 成对、敏感信息零泄漏）。
- 回滚：单变更窗口，git revert 即回滚全部（skill 文本 + evals + 治理面）；hszq-app 侧 update 写入独立回滚。

## Part 2：B 线架构设计（设计级，切片 2–4 评审用）

### 2.1 artifact 家族与 owner

| artifact | owner | 载体 | 生成方 |
| --- | --- | --- | --- |
| pre_development_context（B1） | 新 `spec-preflight`（或并入 spec-work intake，切片 2 定） | run-local JSON | 确定性脚本 |
| effective rules receipt（B2） | host adapter（spec-runtime-setup 扩展） | run-local JSON | adapter；**数据来源约束：只写宿主可确定性导出的事实（debug dump/hook 捕获清单），禁止以配置存在推断"已加载"；无通道即如实 unknown** |
| workspace baseline（B3） | spec-work/worktree intake | run-local JSON | 脚本 |
| acceptance→verification 映射（B4） | spec-plan/spec-write-tasks | committed plan 内 | LLM+脚本校验 |
| verification receipt（B5） | spec-work/test skills | run-local JSON | 命令包装器 |
| task ledger（B6） | spec-work | committed | LLM 写、脚本校验 schema |
| handoff（B7） | spec-handoff | committed | LLM 写 |

**存储决策**：receipts 一律 run-local（`.spec-first/runs/<run-id>/`，机器生成禁止手写；**gitignore 待切片 2 落地**——现 `src/cli/gitignore-policy.js` 为逐条目白名单、不含 `runs/`，切片 2 须同步扩展 patterns 并经 `spec-first init` 刷新 target 仓）；ledger/handoff/映射 committed（可 review、跨会话；ledger/handoff 建议 docs/ 侧路径而非 `.spec-first/` 下，避免与该目录 local-runtime 语义冲突）。任务 ledger/handoff 由 LLM 写 + 脚本 schema 校验——这是对"动态族机器生成"铁律的**显式可控偏离**（schema 校验后的 LLM 写入视为可控生成），已报 owner 确认。

### 2.2 四族 preflight 判定的确定性来源

- 静态：知识库五文件存在性 + markers 完整性 + freshness（现有 verify-deps 扩展）。
- 操作：命令文档/脚本存在且 `--help`/dry-run 可执行探测。
- 治理：宿主 adapter 报告 effective rules/policy（B2 依赖）；无 adapter 时如实 `unknown`。
- 动态：git facts（branch/dirty/baseline）+ ledger 存在性。

各族降级行为按需求文档执行（静态缺→探索降级；治理缺→副作用阻断；动态缺→长任务阻断）。

### 2.3 集成流

```text
preflight（四族就绪报告；主案=并入 spec-work intake，新 skill 仅备选——避免入口膨胀）
  → 缺验收 → needs_human（不得进入实施）
  → 通过 → spec-work intake（载入 baseline + rules receipt）
  → 实施（mutation 受 policy 约束）
  → verify（B5 receipts）
  → review（B10 分级）
  → handoff/ledger 更新（B6/B7）
```

### 2.4 风险与开放问题

- 宿主 adapter 能力差异（Codex 无法报告加载规则 → 治理族 `unknown` 是常态而非异常，须诚实降级）。
- `spec-preflight` 新 skill vs 扩展 spec-work：**主案定为扩展 spec-work intake**（避免入口膨胀），新 skill 列为备选，切片 2 终审。
- receipts 格式复用 A6 冻结思路：先在 spec-first 仓内合同化，稳定后再考虑跨仓。
- B 线不引入新规范挖掘类别；所有 schema 变更走 CHANGELOG + contract test。

## Key Decisions

- 2026-08-28：A 线六项全部文本级实施，不新增挖掘维度（与需求计划一致）。
- 2026-08-28：receipts run-local 不入库、ledger/handoff 入库（动态族载体铁律）。
- 2026-08-28：DEP 行格式冻结为执法导出合同 v1，字段变更需 schema 升版。

## 验收（切片 1 完成定义）

1. 全部 A1–A6 文本/eval/模板变更落盘且验证矩阵全绿；
2. hszq-app 回检报告 + RULE-006 + 四族指针写入完成并 grep 验收通过；
3. CHANGELOG 记录；六宿主投影刷新；本计划 status 保持 active 至切片 1 验证通过后由 owner 关闭。

## 审查修订记录（2026-08-28，三路对抗性审查后）

- P1×4 已修：eval 算术（补 UPDATE-003 凑齐 27）；TRIGGER-005 触发面误扩（改挖掘语境）；A6 过早冻结（降级 contract-candidate，冻结移出切片 1，统一 7 字段清单）；四族指针区状态列制造第二真相源（删状态列，治理/动态族推迟 B 线随行）。
- P2×8 已修：减法审查触发改用户告知（skill 无法自判模型版本）；receipts gitignore 未兑现注记；B2 数据来源约束；hszq-app 7 条 confirmed owner 回填漏项；verify 分支双原因落地；回检通过判据写死+RULE-004 预登记；ledger LLM 写偏离显式论证；统计口径注明。
- P3×9 已修：契约测试数量断言实为新增；能力指针 REUSE/RULE 双轨裁定；coverage_tags 一致性检查；B1 needs_human 出口；spec-preflight 主案定为扩展 spec-work；80%+ 转述修正。
- 未修（记录在案）：成功指标基线与计量机制随切片 4 B9 落地（需求文档补注手工抽样口径）。
