# spec-worktree 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-worktree/scripts/worktree-manager.sh:556-561`、`SKILL.md:77`、CHANGELOG.md:200,1422 | 每条约束可回溯真实失败（unborn 拒绝源自 2026-09-21 eval N1/N2，slug 遍历防护源自 2026-07-26 bug 审查 RED/GREEN），未发现过时或互相矛盾的补丁式指令 |
| D02 | pass | `SKILL.md:53,99,127,142`；`worktree-manager.sh:236-243,321-323` | 编码了真实 git 领域知识（单分支单 worktree、linked worktree 不继承 .gitignore、PR head 不落 FETCH_HEAD、共享 index 不可写），脚本管确定性事实、caller 管语义决策，分工干净 |
| D03 | pass | `worktree-manager.sh:18,146-234,518-533`；`tests/unit/spec-worktree-contracts.test.js:38-226`；`evals/cases/*.yaml`(3) | 验证门为脚本强制（detect.v1 事实合同、状态拒绝、base-ref-unresolvable、写前路径安全），且有正反例测试与 script-judge eval；prose-only 边界（worker index 隔离）显式声明未强制（SKILL.md:146） |
| D04 | pass | `skills/spec-dogfood/references/phases.md:16` ↔ `SKILL.md:144`；`skills/spec-work/references/execution-strategy.md:50-56` ↔ `SKILL.md:146`；双侧字符串被 `spec-worktree-contracts.test.js:95-112`、`spec-work-lfg-recovery-contracts.test.js:30-36` 锁定 | 两个 governed caller 均有 forward invocation 与 intake contract，输出（`Worktree ready`/`already_checked_out`/detect facts）被消费且 `worktree_identity.repo_root`、`run-source-drifted` 双侧对齐 |
| D05 | pass | `SKILL.md` 全文 157 行；重复点 `SKILL.md:22,60,70-72,84,90-92`（有据 `SKILL.md:57`） | 单文件自包含、关键规则均可定位、无内部矛盾；唯一长度成本是 wrapper×8 重复，且重复理由（匹配窄 allowed-tools 模式）已写明；仅两个 P3 文档缺口（见 Findings F1/F2） |
| D06 | pass | `SKILL.md:44`（node 缺失→结构化 fail-closed）；`SKILL.md:57`+`src/cli/skill-path-rewrite-markers.js:46`+`src/cli/adapters/claude.js:107-109,opencode.js:106`（路径重写机制真实存在）；`agents/openai.yaml:1-2`；`tests/unit/plugin-modules.test.js:289-305` | 能力假设（bash+git+node）显式且降级诚实；CLAUDE_SKILL_DIR/生成期重写双路径覆盖多宿主，openai.yaml 在全部 8 宿主投射 |
| D07 | pass | CHANGELOG.md:200,202,960,1422,3410-3426（问题→修订→复验链）；`worktree-manager.sh:558-560`（引用 eval it-1, 2026-09-21） | 演化由失败与审查证据驱动且逐条带验证命令；3 个已提交 eval case 构成回归集；无知识沉淀职责，维护依据（合同测试+evals+CHANGELOG）充分 |
| D08 | pass | `SKILL.md:17-44`（detect-first JSON 事实输出）、全文无 references/ 拆分（目录清单确认仅 SKILL.md+scripts+evals+agents） | 单入口自包含、按需加载脚本、机器可读 JSON 输出最小化消费者解析成本；未发现要求模型重复读取或摘要裁剪必要信息的结构 |
| B01 | pass | `src/cli/contracts/dual-host-governance/skills-governance.json:74-88`（internal_only×8 宿主）；`SKILL.md:3-4`；`agents/openai.yaml:2`；public-route-map.md 无该入口（grep 0 命中）；负例锁定 `spec-worktree-contracts.test.js:106-107`、`skill-flow-p2-closure-contracts.test.js:53-60` | 内部 helper 暴露治理完整：user-invocable:false、禁止隐式调用、公共路由图不收录、已删除的 spec-code-review 假 caller 有测试防回归 |
| B02 | pass | `SKILL.md:25-38,95-104,142` ↔ `worktree-manager.sh` 对应实现 ↔ 消费者测试 | 入口/脚本/消费者三方对同一组字符串与字段（detect.v1、already_checked_out、Worktree ready、intake 七要素）一致；node/git readiness 与降级写明 |
| B03 | pass | `SKILL.md:5`（单命令 allowed-tools 白名单）、`:108-110`（env 复制显式 opt-in、staging 默认拒绝）、`:127`（trust 只打印不执行）、`:142`（无 stage/commit/push/PR 权） | 全部副作用（.gitignore、worktree 目录、fetch、env 复制、审计日志）显式声明且默认最小化；不越权、不重复索取 caller 已有授权 |
| B04 | pass | source=`skills/spec-worktree/**`；投射=`skills-governance.json:74-88`+`plugin-modules.test.js:289-305`；重写=`skill-path-rewrite-markers.js:46-68` | 真相源清楚；生成逻辑与 8 宿主投射可追溯（本 worktree 无 runtime 镜像属冻结审查副本预期状态）；无手改镜像痕迹 |
| B05 | pass | `SKILL.md:40,53,77,104,150-156`；`worktree-manager.sh:221-225,564-567,646-648`；eval 负例 `not-git-repo-fails-closed.yaml`、`unborn-repo-create-refuses.yaml` | fail-closed（unknown/非零退出即停、禁止裸回退）、already_checked_out 处置、部分副作用披露（非零退出≠零写入）、troubleshooting 三条均有对应实现 |
| B06 | pass | `SKILL.md`↔`worktree-manager.sh`↔`spec-worktree-contracts.test.js`(11 用例)↔evals↔CHANGELOG 逐条对账 | 该 Skill 自身交付可追溯：每条文档承诺可定位到脚本行为与验证测试，CHANGELOG 记录带验证命令的行为变更史 |
| X01 | not-applicable | `skills/spec-worktree/` 目录清单（单 SKILL.md+单脚本）；`SKILL.md:48`（仅 create/isolate 两模式） | 单脚本有界 helper，无多模块分解、依赖波次或长任务编排；其共享写面关切（.gitignore、共享 index）属核心合同，已在 D04/B03/B05 裁决覆盖 |
| X02 | pass | `SKILL.md:29`+`worktree-manager.sh:18`（`spec-worktree-detect.v1` 版本化 schema_version）；消费者字符串锁定 `spec-worktree-contracts.test.js:99-105` | 自有输出合同已版本化，下游消费被测试锁定，变更需消费者协同的约束成立 |
| X03 | pass | 符号链接/遍历防御 `worktree-manager.sh:45-74,291-297`+测试 `spec-worktree-contracts.test.js:38-72`；env 秘密审计 `:208-226`；trust 不执行 `:182-206` | 高危面（仓库写入、env 秘密、路径逃逸、trust 状态）逐项有防御设计与正反例测试；无发布/回滚面（不适用部分不虚报） |
| X04 | not-applicable | `SKILL.md:142-146`（caller-owned：返回事实即止、身份漂移回路由 caller、不决定清理） | helper 不拥有跨会话交接 artifact 或知识沉淀职责；worktree 持久化与 drift 处置归 caller（spec-work 状态合同），本 Skill 无摘要/freshness 义务 |

## Findings

**F1（P3，文档/行为缺口）** `--copy-env` 在 isolate 的 linked-worktree in-place 分支被静默忽略。
- 位置：`skills/spec-worktree/SKILL.md:108`（"The opt-in path works for both `create` and `isolate`"）vs `worktree-manager.sh:688-701`（in-place 分支不调用 `copy_env_files`，也不打印任何 env 说明）。
- 后果：caller 在 linked worktree 内执行 `isolate --copy-env <ref>` 会得到 `Worktree ready` 而 env 复制无声未发生；语义上 in-place 模式无新 worktree、复制确无意义，但文档承诺未打折扣口径，行为差异未披露。
- 最小修复：在 `SKILL.md:101` 的 in-place 行为项补半句"（`--copy-env` 不适用，无新 worktree）"，或让脚本在该分支打印一行说明。

**F2（P3，文档精度）** node 依赖的文档口径只覆盖 `detect --json`，实际三个子命令都依赖 node。
- 位置：`SKILL.md:44`、`worktree-manager.sh:275`（usage 只写 "node is required to emit the JSON"）；但 `realpath_existing`（`worktree-manager.sh:29-37`）使 `create`/`isolate` 同样依赖 node，缺失时经 detect 失败以 `output-contract-failed` 收敛。
- 后果：轻则读者误判依赖面；行为本身仍 fail-closed 且结构化，无安全后果。
- 最小修复：把 `SKILL.md:44` 的依赖说明改为覆盖全部子命令（一句话）。

**F3（P3，观察）** PR 重复隔离的陈旧分支语义未文档化。
- 位置：`SKILL.md:99` vs `worktree-manager.sh:653`（非强制 refspec `pull/N/head:refs/heads/pr-N`：PR 可快进时静默更新本地 `pr-N`；被 force-push 后非快进则整条 fetch 失败、结构化报错退出）。
- 后果：fail-closed 方向正确，但「重复隔离同一 PR 时本地分支可能落后或触发拒绝」未写明；caller 侧 currency 复查（`execution-strategy.md:54`）部分兜底。
- 最小修复：在 isolate 行为列表补一句陈旧 `pr-<number>` 分支的处理语义；或保持现状成立（拒绝路径已结构化）。

**F4（P3，已权衡的重复，保持现状成立）** `bash -c` wrapper 全文重复 8 次。
- 位置：`SKILL.md:22,60,70-72,84,90-92`，约 1.1KB 成本；理由已写明（`SKILL.md:57`：匹配窄 `allowed-tools` 模式 + 双运行时路径解析）。
- 后果：维护时需同步 8 处（有合同测试锁定命令形态，漂移会被消费者测试暴露）；换取每条示例可直接复制执行、不依赖模型重组命令。
- 结论：保持现状成立；若未来加第四种调用形态，建议改为定义一次 + 参数化示例。

**F5（P3，信任假设观察，保持现状基本成立）** 兜底分支执行当前仓库内的脚本字节。
- 位置：`SKILL.md:22,60`——`CLAUDE_SKILL_DIR` 未设置时执行 `$(git rev-parse --show-toplevel)/skills/spec-worktree/scripts/worktree-manager.sh`。
- 后果：在既非 Claude 运行时、又未经生成期重写的原始 source 场景下，若 cwd 是一个伪造了该路径布局的外来仓库，wrapper 会以 Skill 授权运行仓库内字节。现实概率低：Claude 分支优先、生成资产会重写该路径（`skill-path-rewrite-markers.js:46`）、governed caller 场景下路径指向真源；脚本自身另有完整路径安全防御。
- 最小修复（可选加固）：在 SKILL.md 记录该信任假设一句，或让兜底分支校验脚本位于 skills 根下；不改也可接受。

## 主责深挖面发现

- **D01**：全部「必须」均可回源到具体失败事件——unborn 拒绝与「脚本失败不裸回退」来自 2026-09-21 eval 首跑两个新发现（CHANGELOG.md:202→200，脚本注释 `worktree-manager.sh:557-560` 保留引用）；slug 遍历防护来自 2026-07-26 全局 bug 审查（CHANGELOG.md:1422，先 RED 后 GREEN）；detect 合同与 separate-git-dir 锚点修正来自 2026-06 CE follow-up 复审（CHANGELOG.md:3410-3412）。SKILL.md:77 的拒绝状态清单与脚本 `case` 允许清单（`worktree-manager.sh:527-533`）语义等价（允许表收敛，无清单漂移）。未发现为对冲模型能力而设的过度指导；`When to create a worktree`（:129-136）是决策依据而非流程补丁。
- **D02**：领域知识密度高且可验证：单分支单 worktree（:53）、linked worktree 不继承主仓 .gitignore（`worktree-manager.sh:321-323` 注释）、`main_worktree_root` 在 separate-git-dir 下指向 GIT DIR 的坑（:236-243 注释）、PR head fetch 到本地分支防 FETCH_HEAD 孤儿（:99）、共享 Git index 不可由 worker 写（:142）、mise/direnv trust 属用户所有状态（:127）。职责分工上脚本不做任何语义选择（模式选择、already_checked_out 处置、何时隔离全留给 caller/模型），符合「确定性地板之上归 LLM」。
- **D03**：验证门分三层且界限诚实——脚本强制（detect.v1、状态拒绝、写前 `assert_worktree_path`×2 调用点、base-ref 校验前移到任何 mutation 前，CHANGELOG.md:200 记录了校验后置会留多余副作用的实证）；合同测试锁定（11 用例含符号链接、遍历 slug、远端分支 tracking、node-less 输出、trust 不执行、env 日记隐私）；eval script-judge 三例。唯一 prose-only 边界（worker Git-index 隔离无宿主回执时 `worker_git_index_enforcement_unavailable` 降级）显式声明未强制（SKILL.md:146），未冒充机械判定。
- **D04**：双向合同完整——dogfood 侧（`phases.md:16`：授权来源=用户选择隔离选项、消费 `already_checked_out`、"never switch the primary checkout"）与 work 侧（`execution-strategy.md:52-56`：七要素 intake、失败时记录实际副作用、身份绑定 `worktree_identity.repo_root`、drift 语义停止）与 SKILL.md:142-146 的 intake/边界逐项对上，且双侧关键词被三个消费者测试文件锁定。SKILL.md:148 的「未来 caller 必须 forward invocation 先行」堵住了 reverse claim 建边的漏洞（与 SF-17/SF-28 治理一致）。
- **D05**：157 行单文件，无 references/ 拆分（目录清单确认），每条规则可 file:line 定位；除 F1/F2 两个 P3 文档缺口与 F4 的有据重复外，未发现指令矛盾或同一规则多处口径不一。
- **D08**：上下文经济性良好——detect-first 设计让模型一次 JSON 拿全决策事实（state/reason_code/root/branch），避免模型自行探测 git；示例全部可复制执行消除了命令重组错误；无按需加载断裂（不需要的 script/eval 内容不进主上下文）。

## 未读文件

- `evals/fixtures/repos/plain-app/{README.md,package.json,src/server.js}`、`evals/fixtures/repos/plain-app-nogit/{README.md,package.json,src/server.js}`：惰性 fixture 载荷，与被审合同无关；未覆盖后果——无（judge 脚本与 prepare 脚本已全文读）。
- `skills/spec-dogfood/references/phases.md`、`skills/spec-work/references/execution-strategy.md` 仅读 spec-worktree 相关段落（:14-16、:46-56、:157、:180 及 grep 锚点）：这两份是 caller 侧文档，本轮只需正向调用锚点；未覆盖后果——caller 文档自身完整性不在本轮结论内。
- `src/cli/adapters/{opencode,cursor,qoder}.js` 仅 grep 确认调用 `rewriteSourceSkillRuntimePaths`：重写机制已由 `skill-path-rewrite-markers.js` 全文 + claude.js 段落 + `command-resource-path-rewrite.test.js` 存在性确认；未覆盖后果——各宿主重写的细微差异（如 cursor 注入 `disable-model-invocation`）未逐行核对，属 B04 边缘。
- `CHANGELOG.md` 仅 grep 摘录 spec-worktree 相关条目（约 15 条）：D07 证据取自这些条目原文；未覆盖后果——无。

## 结论一句话

spec-worktree 静态合同层整体扎实：18 项裁决 16 pass、2 项有据 not-applicable、0 fail；5 条 findings 全部为 P3 文档精度/权衡观察（F1 的 `--copy-env` in-place 静默忽略最值得顺手修一句），无阻断缺陷。
