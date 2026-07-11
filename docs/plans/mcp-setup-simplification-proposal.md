# spec-mcp-setup：纯 Node.js 直接重构方案

## 结论

将 `spec-mcp-setup` 从 Bash / PowerShell 双实现直接重构为单一 Node.js CommonJS 实现。重构完成后删除旧脚本、旧 registry 和 `jq` 硬依赖，不保留产品级 rollback 或长期双轨兼容层。

这是一项行为保持型重构：内部实现、文件组织和 registry schema 可以改变，但公开 workflow 语义、host mutation 边界、facts / plan artifact、`reason_code`、配置写入安全和 provider readiness 语义必须保持等价。

## Goals

- 用一套 Node.js 实现替代 19 个 `.sh` 和 19 个 `.ps1` 文件。
- 用一个 schema v8 registry 替代 `mcp-tools.json`、`helper-tools.json`、`provider-tools.json` 三个 source registry。
- 删除 `jq` 作为 `spec-mcp-setup` 实现和测试的硬依赖。
- 保持 Claude、Codex、Cursor、Kiro、Qoder 的现有公开 setup 行为。
- 保持 preview-first、显式 host authority、显式 provider opt-in 和 setup-owned facts 合同。
- 让新增 host、tool、helper 或 provider 的改动集中在明确 owner 模块中。

## Non-goals

- 不改变 bare setup、`--check`、`--verify-only`、`--plan`、`--project-config`、`--only`、`--refresh` 的公开语义。
- 不新增 `--status` 等公开模式。
- 不改变 host config scope、precedence、user-scope opt-in 或 provider first-generation 规则。
- 不新增 provider 功能，不把 provider 内部实现提升为 workflow contract。
- 不设计产品级 rollout / rollback；Git 历史承担源码回退。配置写入失败时的 transaction restore 属于现有 mutation safety，不是产品 rollback。
- 不手改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` generated runtime mirrors。

## 当前事实

截至 2026-07-11，`skills/spec-mcp-setup/` 包含：

| 类型 | 数量 |
| --- | ---: |
| Bash | 19 |
| PowerShell | 19 |
| CommonJS | 5 |
| JSON | 4 |
| 其他 source / reference | 5 |
| 总文件数 | 52 |
| 近似总行数 | 19,485 |

三个现有 registry 共 1,211 行：`mcp-tools.json` 714 行、`helper-tools.json` 421 行、`provider-tools.json` 76 行。

现有实现不只是安装包、写配置和检查 PATH。它还承担 mode dispatch、host write authority、parent-workspace target resolution、config transaction、install safety preview、provider opt-in、bounded external commands、diagnostic redaction、facts reconciliation 和 degraded readiness 表达。

## 行为不变量

| Surface | 必须保持的行为 | 主要消费者 |
| --- | --- | --- |
| Bare invocation | 只诊断并给 next actions；不安装、不写 host config、不执行 provider first generation | 用户、host skill |
| `--check` | 只读检查；不写 setup facts、host config 或 provider artifacts | CI、用户 |
| `--verify-only` / `--refresh-facts` | 只验证并刷新 setup-owned facts；不安装、不写 host config | downstream workflows |
| `--plan` | 输出 `setup-install-plan.v1`，`mutation=false`；包含 planned operations、safety、provider selection、blocked reason | preview / approval surface |
| `--project-config` | 只处理 project-local config；不安装 MCP/helper/provider，不写 host config | project bootstrap |
| `--only <ids>` | 只有显式选择的 provider 可以进入 install-init；未知 id fail closed | provider setup |
| `--refresh` | 仅作为显式 Graphify incremental refresh；不得从 bare/check/plan/verify 进入 | Graphify setup |
| Host authority | mutation 必须来自 host runtime 显式 `MCP_SETUP_HOST` pin；自动检测只能提供 advisory facts | host config writers |
| Host config | 保持 targets、precedence、fallback order、user-scope opt-in、conflict guard、secret guard 和 atomic write | Claude/Codex/Cursor/Kiro/Qoder |
| Facts | 保持 primary artifact path、schema version、`reason_code` 和 provider readiness 语义 | plan/work/debug/review workflows |
| Provider results | 区分 `ready`、`degraded`、`failed`、`blocked`，不得把 advisory 或 partial 结果提升为 confirmed | setup consumers |
| `spec-first repair-worktree` | 保持 dry-run-only；`--apply` / `--unlink` fail closed；不删除 `.git` | CLI 用户、worktree recovery guidance |

## 目标结构

```text
skills/spec-mcp-setup/
├── SKILL.md
├── setup-registry.json
├── setup-registry.schema.json
├── evals/
│   ├── README.md
│   └── examples.json
├── references/
│   ├── config-template.yaml
│   └── supported-mcp-tools.md
└── scripts/
    ├── setup.cjs
    ├── check-health
    ├── lib/
    │   ├── args.cjs
    │   ├── mode-policy.cjs
    │   ├── registry.cjs
    │   ├── host-authority.cjs
    │   ├── project-target.cjs
    │   ├── project-config.cjs
    │   ├── worktree-health.cjs
    │   ├── process-runner.cjs
    │   ├── host-config.cjs
    │   ├── toml-section-editor.cjs
    │   ├── facts.cjs
    │   └── renderer.cjs
    └── providers/
        ├── registry.cjs
        ├── codegraph.cjs
        └── graphify.cjs
```

`check-health` 保留现有文件名，但改为带 Node shebang 的薄入口。所有 generated host surfaces 都必须从 loaded skill root 解析共置的 `scripts/setup.cjs`；Windows 调用形态为 `node <loaded-skill-root>/scripts/setup.cjs --check`，不得假设项目 cwd 下存在 `scripts/setup.cjs`，也不再依赖 `check-health.ps1`。

`setup-registry.json` 与其 schema 是 package source；五宿主 runtime 中的共置副本是 generated projection。`evals/` 和 skill 顶层 maintainer `README.md` 保持 source-only，不进入 runtime projection；`setup-registry.json`、`references/` 中运行必需资产及 `scripts/` 必须随 loaded skill 投影。

旧入口的 replacement ownership 固定如下，U1 inventory 只负责验证完整性，不重新决定归属：

| 旧入口类别 | Node owner |
| --- | --- |
| install / detect / configure / verify / normalize / setup-plan | `setup.cjs` + `mode-policy.cjs` + `registry.cjs` + `facts.cjs` + `renderer.cjs` |
| `repair-install.*` | `setup.cjs` 的显式 repair action plan，不保留独立脚本入口 |
| `bootstrap-project-config.*` | `project-config.cjs` |
| `repair-worktree.*`、`lib-git-health.*` | `worktree-health.cjs`；`src/cli/commands/repair-worktree.js` 直接调用共享模块 |
| `uninstall-mcp.*` | `host-config.cjs` 的 remove action 与 provider `uninstall`；只保留当前公开合同需要的动作 |
| `scan-configured-deps.cjs`、facts/status helpers | `facts.cjs` + `renderer.cjs` |
| CodeGraph / Graphify install-init / refresh | 对应静态 provider module |

## 核心设计决策

### 1. 显式 mode policy

`setup.cjs` 不通过否定条件推断是否允许 mutation。`mode-policy.cjs` 根据公开模式生成确定性的 action plan，编排器只执行该 plan 已授权的动作。

| 模式 | 安装工具 | 写 host config | 写 project config | Provider mutation | 写 setup facts | `plan.mutation` | 主要输出 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bare | 否 | 否 | 否 | 否 | 否 | `false` | diagnose + next actions |
| `--check` | 否 | 否 | 否 | 否 | 否 | `false` | diagnostic snapshot |
| `--verify-only` / `--refresh-facts` | 否 | 否 | 否 | 否 | 是 | `true` | verified facts |
| `--plan` | 否 | 否 | 否 | 否 | 否 | `false` | `setup-install-plan.v1` |
| `--project-config` | 否 | 否 | 是 | 否 | 否 | `true` | project config result |
| `--only <ids>` | 按当前合同 | 按当前合同 | 否 | 仅选中 provider | 是 | `true` | execution + facts |
| `--only graphify --refresh` | 按当前合同 | 按当前合同 | 否 | Graphify refresh | 是 | `true` | execution + facts |

`plan.mutation=true` 只表示 action plan 含有已授权写操作，不表示可以跨列执行 mutation。`--project-config` 只能执行 project-local config action；`--verify-only` / `--refresh-facts` 只能写 setup-owned facts。executor 必须逐 action 校验 capability，而不是只检查一个总布尔值。

`--repo`、`--folder`、`--all-repos`、`--requirement-workspace`、`--user-scope` 是 target / scope modifier，不是独立 mode。冲突组合在 action plan 阶段返回 machine-readable `reason_code`，不进入 mutation。

```javascript
async function main(argv, env) {
  const args = parseArgs(argv);
  const target = resolveProjectTarget(args);
  const host = resolveHostAuthority({ args, env, mutationRequested: args.requestsMutation });
  const registry = loadRegistry();
  const plan = buildActionPlan({ args, target, host, registry });

  if (plan.blocked) return renderBlocked(plan);
  if (plan.mode === 'plan') return renderInstallPlan(plan);
  if (!plan.mutation) return runReadOnlyPlan(plan);
  return runMutationPlan(plan);
}
```

### 2. Host authority 与 target containment

- Read-only 路径可以输出 host candidate，但 candidate 不授予写权限。
- host config、setup-owned facts 或 provider artifact mutation 前，必须持有当前 host runtime 注入的 canonical `MCP_SETUP_HOST`。
- parent workspace 未指定 child repo 时，保留当前默认批处理行为，生成 `selection_source=workspace-default-all-repos`；显式 `--all-repos` 生成 `selection_source=explicit-all-repos`；`--repo <child>` 生成 `selection_source=explicit-repo`。
- bare invocation 在 parent workspace 仍保持只读；无 child candidate、`--repo` 与 `--all-repos` 冲突、或显式 target 越界时 fail closed。
- project target、requirement workspace、provider artifact 和 hook path 必须经过 absolute / `..` / symlink escape 检查。
- source repo 中 provider normalization 不得改写 source-owned `AGENTS.md` / `CLAUDE.md`。

所有 mutation surface 使用同一 containment contract，但按 owner 分别执行：

| Surface | Trusted root | 必须检查的节点 | 提交前复检 |
| --- | --- | --- | --- |
| Host config | registry 解析出的 canonical host target | parent directory、target leaf、scope/precedence | temp write 后、rename 前 |
| Project config / `.gitignore` | resolved child repo root | repo root、`.spec-first` ancestors、target leaf | mkdir 后、rename/delete 前 |
| Workspace summary | resolved parent workspace root | `.spec-first/workspace` ancestors、summary leaf | mkdir 后、rename 前 |
| Setup facts | resolved repo-local facts root | facts ancestors、artifact leaf | mkdir 后、rename 前 |
| Provider artifacts / hooks | selected project root / provider-owned hook root | artifact root、hook parent、managed leaf | provider apply 前及写入后验证 |
| Managed instruction section | selected project root | source-repo guard、instruction file leaf、managed marker | replace 前 |

任何 ancestor 或 leaf symlink、canonical root 漂移、检查后路径替换或无法确认 containment 的情况都拒绝 mutation，并返回稳定 `reason_code`。不得用 follow-symlink 写入替代 fail-closed。

### 3. 单一 schema v8 registry

`setup-registry.json` 是唯一 source-of-truth。重构同一变更中迁移全部消费者并删除三个旧 registry，不实现 v7 compatibility loader。

```json
{
  "schema_version": "setup-registry.v8",
  "external_dependencies": [],
  "hosts": {},
  "tools": [],
  "helpers": [],
  "providers": [],
  "artifact_contracts": []
}
```

继承顺序固定为：registry defaults → host defaults → tool/helper/provider host override → platform override。Merge algebra 固定为：

- plain object 递归合并；scalar 由后层显式值替换；
- array 整体替换，不做隐式 concat 或去重；
- missing 表示继承上层值；`null` 只在 schema 明确声明 nullable/delete semantics 时有效，否则校验失败；
- 同层重复 id、重复 host target 或冲突 override 直接拒绝加载；
- loader 输出完全展开、key 排序稳定的 canonical effective registry，供 snapshot 和差分测试使用。

Schema 必须支持：

- 多 target host config、precedence、fallback order、uninstall targets；
- `requires_user_scope_opt_in`、writable check、config format 和 detect key；
- command / args / env 的 host 与 platform override；
- required / optional / baseline-blocking / explicit-consent 语义；
- dependency pin、source、risk flags、version policy、review-required 和 install effect；
- provider readiness schema、artifact root、native interfaces 和 non-actions；
- artifact path、schema version、producer 和 consumer。

Registry loader 只做 schema 校验、默认值展开和确定性查询，不做 provider readiness 或架构语义判断。U2 必须针对每个 host/platform 对旧 loader 的 effective query result 与 v8 canonical snapshot 做差分；U2 完成后旧 registry 冻结，除修复 characterization 阻断外不再修改，直至 U8 删除。

### 4. Process runner

所有 npm、npx、CodeGraph、Graphify 和 host CLI 调用通过 `process-runner.cjs`：

- 使用 argv array 和 `shell:false`，不拼接 shell command；
- 支持 stage timeout、probe timeout 和 process-tree termination；
- 捕获 exit code、stdout、stderr、timeout 和 signal；
- 对诊断执行输出上限与 credential redaction；
- redaction 覆盖 argv、env overlay、stdout、stderr、异常对象和 plan/facts diagnostic；任何 artifact 都不得持久化 literal credential；
- 使用 per-call env overlay，不修改全局 `process.env`；
- mirror fallback 只影响第二次调用，并在 result 中标记 source / mirror；
- 返回 raw execution facts：exit code、stdout、stderr、timeout、signal、invocation source、mirror attempt 和 redacted diagnostic；
- 不在 runner 层判断 `ready | degraded | failed | blocked`，该状态与 `reason_code` 由 install、host config、facts 或 provider owner 根据各自合同映射；
- POSIX 使用独立 process group 终止后代进程；Windows 使用可验证的 descendant termination 实现，两个平台都必须有 timeout fixture；
- 安装失败不得被静默吞掉，后续 host config / provider mutation 只能按下述 execution contract 继续。

### 5. Execution contract 与 facts reconciliation

mutation executor 按 action plan 顺序执行，但不把整个 setup 伪装成单一跨系统 transaction：

| Action 类别 | 前置条件 | 提交点 | 失败后的默认策略 | 最终事实来源 |
| --- | --- | --- | --- | --- |
| Tool/helper install | install safety 已批准、target/host 已解析 | 外部安装命令成功退出 | stop 依赖该工具的 host/provider action；独立 action 可继续 | mutation 后重新 detect/version probe |
| Host config | 工具可解析、host authority 有效、conflict/secret guard 通过 | atomic rename 成功 | stop 依赖该 host config 的 provider action；transaction 内恢复原内容 | mutation 后重新 parse/compare |
| Project config | project action 显式授权、containment 通过 | 每个 atomic file action 成功 | 当前 repo stop；parent batch 继续其他 repo并汇总 partial | mutation 后重新读取 project state |
| Provider mutation | provider 显式 selection、依赖和 workspace 均有效 | provider contract 定义的最小可验证提交点 | stop 当前 provider 后续 action；不删除既有可用 artifact | mutation 后执行 `verify(context)` |
| Setup facts | 所有前序 action 已结束且 reconciliation facts 已生成 | facts atomic rename 成功 | 返回 facts-write failure；不得宣称 setup complete | 上述 post-mutation probes |

`ready`、`degraded`、`failed`、`blocked` 只能由 post-mutation probe 和 confirmed local state 推导。plan、attempted action、外部命令启动或部分产物存在都不是 confirmed readiness。测试必须在 install、host config、project config、provider 和 facts 阶段分别注入失败，验证 stop/continue、partial summary 和重试幂等语义。

### 6. Host config transaction

`host-config.cjs` 保留现有 mutation safety：

1. 根据 host authority 和 registry target 解析唯一 config path；
2. 检查 scope、precedence、writable status 和 existing conflict；
3. 获取跨进程 lock；
4. 解析现有 JSON 或定位 TOML MCP section；
5. 执行 literal secret guard 和 explicit overwrite guard；
6. 写入同目录临时文件并 atomic rename；
7. 写失败时恢复 transaction 前内容并返回结构化失败事实；
8. 保留原文件权限，不扩大可读范围。

新建 config、backup、lock 和 temp 文件必须采用 owner-only 或不宽于最终目标的权限。Lock contract 必须包含 owner metadata、bounded wait、进程存活检查和 stale-lock 回收；异常退出遗留的 temp 文件只能在确认属于当前 managed naming contract 后清理。Windows 必须通过真实 CI fixture 验证 replace、permission preservation 和 restore 语义。

Codex TOML 使用 `toml-section-editor.cjs`，只 extract / compare / upsert / remove `[mcp_servers.<key>]` section，保留其他 section、未知 key、注释和顺序。不引入“完整 TOML 重排”，也不使用仅能序列化新文件的 30 行 writer。编辑器必须显式声明可无损处理的 TOML grammar；quoted/dotted keys、BOM、CRLF、多行字符串中的伪 section、inline table/array 和重复 table 均需 fixture。无法证明 section 边界或无损修改时 fail closed，并返回稳定 `reason_code`。

### 7. Provider module contract

不使用只有一个实现层级的基类。`providers/registry.cjs` 显式映射 provider id 到受信任模块，避免动态扫描目录后执行任意文件。

```javascript
module.exports = {
  codegraph: require('./codegraph.cjs'),
  graphify: require('./graphify.cjs'),
};
```

每个 provider module 实现结构化 contract：

- `plan(context)`：返回 planned writes、non-actions、risk facts 和 blocked reason；
- `verify(context)`：只读 readiness probe；
- `apply(context, plan)`：只执行 plan 已授权的 mutation；
- `refresh(context, plan)`：仅显式 refresh mode 可调用；
- `uninstall(context, plan)`：仅当前公开合同需要时实现；
- 所有操作必须幂等，并返回统一 provider result；
- Graphify hook / symlink / instruction-section mutation 保持 path containment、managed-block 和 explicit provider opt-in 边界。

### 8. Artifact contracts

重构保持以下 primary artifacts 及其现有 schema：

| Artifact | Schema / contract | Producer | 主要消费者 |
| --- | --- | --- | --- |
| Install preview | `setup-install-plan.v1`，`mutation=false` | mode policy + renderer | 用户、approval surface |
| Diagnostic snapshot | `spec-mcp-setup-diagnostic-snapshot.v1` / `spec-mcp-setup-preflight.v2` | check/diagnostic path | 用户、CI |
| `.spec-first/config/tool-facts.json` | `tool-facts.v2` | facts reconciliation | downstream workflows |
| `.spec-first/config/runtime-capabilities.json` | `runtime-capabilities.v1` | facts reconciliation | plan/work/debug/review |
| Workspace setup summary | `workspace-mcp-setup-summary.v1` | parent batch executor | parent workspace consumer |
| Workspace verification | `workspace-mcp-verify-summary.v1`、`mcp-verify-child-result.v1`、`parent-artifact-quarantine.v1` | verification path | parent workspace consumer |
| Project config result | `project-config-bootstrap.v1`、`workspace-project-config-bootstrap-summary.v1`、`project-local-config-status.v1` | `project-config.cjs` | project bootstrap、用户 |
| Provider readiness | current provider readiness entries and `reason_code` semantics | provider `verify` + facts | setup consumers |

若实现发现 schema 必须变化，该变化不再属于纯重构，必须从本计划拆出、版本化并增加 downstream consumer tests。

## 实施单元

### 开发入口 gate

- 在独立 worktree 或无无关 source 改动的稳定分支上开始，记录 baseline commit、OS、Node 版本和执行时间。
- 先运行 `npm run test:mcp-setup`、`npm run test:unit`、`npm run test:smoke`、`npm run test:integration`；任何既有失败必须记录为带 owner 的 baseline limitation，不得在重构完成声明中混同为本方案通过。
- POSIX legacy characterization 在本地/Unix CI 采集；Windows legacy characterization 由 `.github/workflows/windows-compatibility.yml` 的 Node 20/22 matrix 采集。两端 fixture 未形成前不得进入 U3。

### U1：行为 characterization 与 active consumer inventory

- **Goal**：在删除旧实现前，把公开行为、平台差异、确定性边界和全部 active consumers 固化为可执行证据。
- **Files**：`tests/unit/mcp-setup*.test.js`、新增 `tests/unit/mcp-setup-node-contracts.test.js` 与 fixture helpers、`tests/fixtures/mcp-setup/active-consumers.json`、`tests/fixtures/mcp-setup/legacy-parity/posix/`、`tests/fixtures/mcp-setup/legacy-parity/windows/`、`tests/fixtures/mcp-setup/platform-differences.json`、`.github/workflows/windows-compatibility.yml`。
- **Approach**：
  - 生成 `.sh`、`.ps1`、旧 `.cjs` helper、三个旧 registry 和 `jq` 引用清单；每项标记 `migrate`、`absorb` 或 `retire`，并指定 replacement owner；
  - inventory 至少覆盖 `repair-install.*`、`uninstall-mcp.*`、`bootstrap-project-config.*`、`repair-worktree.*`、`src/cli/commands/repair-worktree.js`、`src/cli/helpers/setup-facts.js`、source templates、quality gates、test runners、runtime projection tests 和 package asset tests；
  - 在 POSIX 与 Windows 分别运行旧实现的 mode、target、artifact、reason code、config、provider 和 failure scenarios，输出规范化 fixtures；
  - Bash/PowerShell 差异必须在 U3 前标记为 canonical public behavior、既有缺陷或必要平台特例，不能由 Node 实现临时选择；
  - characterization tests 不锁定旧脚本文件名或调用方式。
- **Verification**：旧 POSIX/Windows 实现分别通过其 canonical fixtures；consumer inventory 无未分类 active reference；platform difference ledger 每项都有 canonical expected result；同一 fixtures 可直接用于 Node contract suite。

### U2：Registry v8

- **Goal**：建立唯一 registry source 和 schema validator。
- **Files**：新增 `setup-registry.json`、`setup-registry.schema.json`、`scripts/lib/registry.cjs`、`tests/fixtures/mcp-setup/effective-registry/` 和 registry differential tests。
- **Approach**：机械迁移现有 metadata，不改变 required/optional、host target、safety 或 provider 语义；实现本计划定义的 merge algebra。开发期间旧 registry 只供尚未切换的旧实现读取，Node 实现只读取 v8；不实现同时合并 v7/v8 的 compatibility loader。旧 registry 在 U8 原子切换时删除。
- **Verification**：每个旧 entry 的字段 projection 通过；每个 host/platform 的 fully-expanded effective registry 与旧 loader 查询结果等价；duplicate/null/array/override failure fixtures 通过；五宿主 runtime projection 中 registry 共置路径与 source/runtime drift 检查通过。

### U3：Mode、host authority 与 project target

- **Goal**：建立显式 action plan 和 mutation gate。
- **Files**：`setup.cjs`、`args.cjs`、`mode-policy.cjs`、`host-authority.cjs`、`project-target.cjs`。
- **Approach**：先生成 action plan，再进入 read-only 或 mutation executor；逐 action 校验 capability；保留 `workspace-default-all-repos`、`explicit-all-repos` 与 `explicit-repo` 三种 selection source；所有冲突和未授权写入 fail closed。
- **Verification**：mode table 全覆盖；bare/check/plan 不写入，verify 只写 facts，project-config 只写 project-local surface；parent default-all、explicit-all、explicit-repo、无候选和冲突 fixtures 通过。

### U4：Process runner、execution contract 与 host config

- **Goal**：替代 shell process、JSON/TOML 和 config transaction helper，并固定部分执行语义。
- **Files**：`process-runner.cjs`、`host-config.cjs`、`toml-section-editor.cjs`。
- **Approach**：runner 只返回 raw execution facts；领域 owner 映射 readiness。统一 timeout、process-tree termination、env overlay、redaction、atomic write、lock、conflict、secret guard、stale-lock recovery 和 post-mutation reconciliation。
- **Verification**：覆盖 command-not-found、timeout/descendant termination、nonzero、mirror failure、invalid JSON、完整 TOML grammar fixtures、多 server、重复执行、并发/stale lock、write/restore failure、Windows replace 和每阶段故障注入。

### U5：Project config 与 worktree health

- **Goal**：完整迁移 project-local bootstrap，并保证公开 `spec-first repair-worktree` 不因删除脚本而失去后端。
- **Files**：`project-config.cjs`、`worktree-health.cjs`、`src/cli/commands/repair-worktree.js`、project config/worktree contract tests。
- **Approach**：
  - `project-config.cjs` 提供 inspect/plan/apply，迁移 refresh example、create local override、ensure `.gitignore`、explicit legacy deletion、symlink guards、parent batch summary 和幂等语义；
  - `worktree-health.cjs` 承担跨平台 git health detection，供 project target 与 CLI 共享；
  - `repair-worktree` 保持当前 dry-run-only 合同，继续拒绝 `--apply` / `--unlink`，保留 help、reason code、stdout/stderr 和退出码语义。
- **Verification**：`project-config-bootstrap.v1`、`workspace-project-config-bootstrap-summary.v1` 和 `project-local-config-status.v1` fixtures 等价；project config 五类 mutation surface 通过 symlink/containment tests；repair-worktree POSIX/Windows fixtures 等价。

### U6：Facts 与 renderer

- **Goal**：替代 `write-setup-facts.*`、`verify-tools.*`、`normalize-setup-facts.*`、`scan-configured-deps.cjs` 和 status renderers。
- **Files**：`facts.cjs`、`renderer.cjs`、artifact contract tests。
- **Approach**：只准备 deterministic facts；facts 必须来自前序 mutation 后重新验证，不根据 plan 或 attempted action 推导 confirmed readiness；不在脚本中判断 semantic adequacy。
- **Verification**：primary artifact schema、reason_code、parent-workspace quarantine、generated runtime freshness、partial summary、facts write failure 和 provider readiness fixtures 等价。

### U7：Provider modules

- **Goal**：迁移 CodeGraph 和 Graphify install-init / verify / refresh 行为。
- **Files**：`providers/registry.cjs`、`providers/codegraph.cjs`、`providers/graphify.cjs`。
- **Approach**：复用统一 runner 和 action plan；保留 explicit opt-in、bounded repair、degraded facts、hook/symlink containment 和 source/runtime boundary。
- **Verification**：provider plan、steady-state、first-generation、refresh、timeout、partial/degraded、invalid workspace 和 source-repo protection fixtures 通过。

### U8：Source consumer 切换与删除

- **Goal**：将所有 source consumer 切换到 Node，并删除旧实现。
- **Files**：`SKILL.md`、`references/supported-mcp-tools.md`、source templates、`check-health`、`src/cli/commands/repair-worktree.js`、`src/cli/helpers/setup-facts.js`、`scripts/run-test-suite.cjs`、`scripts/run-ai-dev-quality-gate.js`、`src/cli/contracts/quality-gates/branch-protection-policy.json`、`tests/unit/mcp-setup-contracts.test.js`、`tests/unit/mcp-setup-config-consumers.test.js`、`tests/unit/mcp-setup-powershell-contracts.test.js`、`tests/unit/host-runtime-projection-contracts.test.js`、`tests/unit/plugin-modules.test.js` 和相关 fixtures；删除 19 个 `.sh`、19 个 `.ps1`、已分类为 retire/absorb 的旧 `.cjs` helper、三个旧 registry 和 `jq`-specific tests。
- **Approach**：按 U1 inventory 原子切换所有 active consumers；Windows/POSIX 都运行统一 Node contract suite；保留公开 workflow 语义，仅更新内部入口引用；不保留 v7 loader、脚本 fallback 或双轨执行路径。
- **Verification**：删除完成后执行全仓 active-reference scan，确认不存在对旧脚本、旧 registry、PowerShell-only existence contract 或 `jq` 的 active source 引用；`test:mcp-setup` 不再只检查文件存在，而是实际执行统一 Node contract suite；inventory 中每项 replacement owner 可定位且测试通过。

### U9：文档、runtime projection 与发布说明

- **Goal**：同步 source 文档和发布说明。
- **Files**：`SKILL.md`、必要的 README / docs、source templates、`CHANGELOG.md`、`.github/workflows/windows-compatibility.yml`。
- **Approach**：明确“公开合同不变、内部入口更新”；source template 使用 loaded skill root 调用 Node 入口；不手改 generated runtime mirrors。现有 Windows Node 20/22 matrix 增加显式 `npm run test:mcp-setup` 步骤，并继续运行全量 `npm test` 与 package build。
- **Verification**：entrypoint lint、changelog contract、无条件 integration/runtime projection tests、package contents、source/runtime drift expectations 和 Windows Node contract suite 通过；GitHub Actions run URL/ID 作为 confirmed evidence 留在 PR/交付记录中。

## 实施顺序

1. 满足开发入口 gate；U1 固化 POSIX/Windows behavior fixtures，并完成 active consumer inventory 和差异裁决。
2. U2 建立 v8 registry、merge contract 和 effective snapshot differential tests。
3. U3 实现 action plan、mode policy、host authority 和 target resolution。
4. U4 实现统一 runner、execution contract 与 host config transaction。
5. U5 迁移 project config 与共享 worktree health。
6. U6 迁移 facts、verification 和 renderer。
7. U7 迁移 CodeGraph / Graphify provider modules。
8. 让 Node 实现通过全部 characterization、artifact 和 failure-injection tests。
9. U8 一次性切换 source consumers，删除旧脚本、旧 registry 和 `jq` 依赖。
10. U9 更新文档、source templates、Windows CI owner contract 和 changelog。
11. 在删除且文档/投影入口更新后的最终文件树上重新运行全部验证，包括 Windows 与 integration/runtime projection suite。

不建立长期 shadow-run 或 rollback layer。旧实现只在开发期间作为读取行为和建立 characterization 的 source evidence；完成 gate 只认删除后最终树上的测试结果。

## Test Plan

### Mode matrix

- bare、`--check`、`--verify-only`、`--refresh-facts`、`--plan`、`--project-config`、`--only <ids>`、`--only graphify --refresh`。
- 裸 `--refresh`、unknown `--only` id、`--refresh` 与 bare/check/plan/verify 组合、互斥 target modifier 必须 fail closed。
- 每个 mode 验证 install、host config、provider、facts 和 project config 五类副作用是否符合权限表。

### Host matrix

- Claude managed/user JSON。
- Codex user/system TOML precedence。
- Kiro workspace/user JSON。
- Qoder local/user JSON。
- Cursor project/user JSON。
- 未显式 host authority、混合 host candidate 和 stale previous-host facts 必须 fail closed 或降级为 advisory。

### Failure matrix

- command missing、timeout、nonzero exit、mirror failure、malformed registry。
- invalid JSON；TOML quoted/dotted key、BOM、CRLF、多行字符串、inline table/array、重复 table、unknown section/comment preservation。
- config conflict、secret guard、lock contention/stale lock、temp cleanup、write/rename/restore failure、Windows permission preservation。
- unknown provider、invalid/escaping/symlink workspace、各 mutation surface containment、provider partial readiness、hook failure。
- parent workspace default-all、explicit-all、explicit-repo、无 child candidate、`--all-repos` 冲突和 repo-local artifact quarantine。
- install、host config、project config、provider 和 facts 各阶段故障注入后的 stop/continue、partial summary、post-mutation verification 和重试幂等。

### Final commands

```bash
npm run typecheck
npm run test:mcp-setup
npm run test:unit
npm run lint:skill-entrypoints
npm run test:smoke
npm run test:integration
npm run test:ai-dev:gate
npm run build
```

这些命令必须在 U8 删除旧实现且 U9 更新 source templates 后的最终文件树上执行。Windows CI 通过 `scripts/run-test-suite.cjs` 执行与 POSIX 相同的 Node contract suite，并保留 CI run 作为 confirmed evidence；不得以当前机器缺少 Windows 环境为由声明跨平台重构完成。

## Definition of Done

- `skills/spec-mcp-setup/scripts/` 不再包含 `.sh` 或 `.ps1` 实现。
- `setup-registry.json` 是唯一 active registry source；三个旧 registry 已删除。
- `setup-registry.schema.json` 与 loader 查询合同锁步；五宿主 runtime 只消费 generated registry projection，不把 runtime copy 当 source。
- `spec-mcp-setup` source/test 不再要求 `jq`。
- `evals/` 与 maintainer README 不进入 runtime projection；loaded skill 中 registry、运行必需 references 和 scripts 完整共置。
- U1 inventory 中所有旧 script/registry consumers 都有 replacement owner 或明确 retire 记录；全仓 active-reference scan 无残留。
- mode matrix、host authority、target selection、artifact schema、execution contract、config transaction、project config、worktree health 和 provider contracts 有确定性测试。
- bare/check/plan 无写入；verify 只写 facts；project-config 只写 project-local surface。
- 所有 provider mutation 都来自显式 selection 和可审计 action plan。
- setup facts 只来自 post-mutation verification，不把 planned、attempted 或 partial state 提升为 confirmed。
- parent workspace 默认批处理与 `selection_source` 公开语义保持不变。
- `spec-first repair-worktree` 在删除旧脚本后仍保持 dry-run-only 行为与退出码合同。
- primary facts / plan artifact schema 和 downstream consumer tests 通过。
- POSIX 与 Windows 运行同一 Node contract suite；legacy platform differences 已裁决并固化。
- `.github/workflows/windows-compatibility.yml` 的 Node 20/22 matrix 显式运行 `npm run test:mcp-setup`，并保留可引用的 confirmed CI evidence。
- 最终树通过 Test Plan；通过证据来自删除旧实现之后的命令结果。
- `SKILL.md` 和 `CHANGELOG.md` 已同步，generated runtime mirrors 未手改。
- 代码量下降作为结果记录，不作为正确性 gate。

## 风险与控制

| 风险 | 控制 |
| --- | --- |
| mode 重构引入 silent mutation | mode-policy allowlist + side-effect matrix tests |
| host target 写错 | explicit host authority + precedence / scope fixtures |
| project-config 绕过统一 mutation gate | 独立 capability + `project-config.cjs` owner + side-effect tests |
| registry 继承隐藏差异 | 明确 merge algebra + effective snapshot differential tests + schema validation |
| TOML / JSON 损坏用户配置 | grammar-bounded section editor + fail-closed + atomic transaction + conflict fixtures |
| 外部命令卡死或泄露凭据 | bounded runner + env isolation + output redaction |
| 部分执行产生错误 confirmed facts | execution contract + post-mutation reconciliation + failure injection |
| Provider 将 partial 当 ready | provider verify + confirmed/degraded reason tests |
| Project/provider/hook symlink 越界 | mutation-surface containment table + commit-time recheck + source-repo protection |
| stale lock 或 Windows replace 行为不一致 | owner metadata + stale recovery + Windows CI transaction fixtures |
| 删除后 consumer 或测试仍绑定旧结构 | U1 inventory + U8 active-reference gate + 删除后最终 suite |
| source-only eval 或 maintainer 资产泄漏到 runtime | package asset filter + 五宿主 projection tests + build contents check |
| runtime 从项目 cwd 误找 Node 入口 | loaded skill root resolution + 五宿主 generated entrypoint fixtures |
| generated runtime 被误当 source 修改 | source-first review + runtime mirror diff check |
