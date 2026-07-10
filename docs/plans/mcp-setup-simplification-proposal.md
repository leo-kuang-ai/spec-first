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

截至 2026-07-10，`skills/spec-mcp-setup/` 包含：

| 类型 | 数量 |
| --- | ---: |
| Bash | 19 |
| PowerShell | 19 |
| CommonJS | 5 |
| JSON | 4 |
| 其他 source / reference | 4 |
| 总文件数 | 51 |
| 近似总行数 | 19,521 |

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

## 目标结构

```text
skills/spec-mcp-setup/
├── SKILL.md
├── setup-registry.json
├── evals/
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

`check-health` 保留现有文件名，但改为带 Node shebang 的薄入口。Windows generated host surfaces 直接调用 `node scripts/setup.cjs --check`，不再依赖 `check-health.ps1`。

## 核心设计决策

### 1. 显式 mode policy

`setup.cjs` 不通过否定条件推断是否允许 mutation。`mode-policy.cjs` 根据公开模式生成确定性的 action plan，编排器只执行该 plan 已授权的动作。

| 模式 | 安装工具 | 写 host config | Provider mutation | 写 setup facts | 主要输出 |
| --- | --- | --- | --- | --- | --- |
| bare | 否 | 否 | 否 | 否 | diagnose + next actions |
| `--check` | 否 | 否 | 否 | 否 | diagnostic snapshot |
| `--verify-only` / `--refresh-facts` | 否 | 否 | 否 | 是 | verified facts |
| `--plan` | 否 | 否 | 否 | 否 | `setup-install-plan.v1` |
| `--project-config` | 否 | 否 | 否 | 否 | project config result |
| `--only <ids>` | 按当前合同 | 按当前合同 | 仅选中 provider | 是 | execution + facts |
| `--only graphify --refresh` | 按当前合同 | 按当前合同 | Graphify refresh | 是 | execution + facts |

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
- parent workspace 下的 repo-local mutation 必须选择 child repo 或显式 `--all-repos`。
- project target、requirement workspace、provider artifact 和 hook path 必须经过 absolute / `..` / symlink escape 检查。
- source repo 中 provider normalization 不得改写 source-owned `AGENTS.md` / `CLAUDE.md`。

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

继承顺序固定为：registry defaults → host defaults → tool/helper/provider host override → platform override。Schema 必须支持：

- 多 target host config、precedence、fallback order、uninstall targets；
- `requires_user_scope_opt_in`、writable check、config format 和 detect key；
- command / args / env 的 host 与 platform override；
- required / optional / baseline-blocking / explicit-consent 语义；
- dependency pin、source、risk flags、version policy、review-required 和 install effect；
- provider readiness schema、artifact root、native interfaces 和 non-actions；
- artifact path、schema version、producer 和 consumer。

Registry loader 只做 schema 校验、默认值展开和确定性查询，不做 provider readiness 或架构语义判断。

### 4. Process runner

所有 npm、npx、CodeGraph、Graphify 和 host CLI 调用通过 `process-runner.cjs`：

- 使用 argv array 和 `shell:false`，不拼接 shell command；
- 支持 stage timeout、probe timeout 和 process-tree termination；
- 捕获 exit code、stdout、stderr、timeout 和 signal；
- 对诊断执行输出上限与 credential redaction；
- 使用 per-call env overlay，不修改全局 `process.env`；
- mirror fallback 只影响第二次调用，并在 result 中标记 source / mirror；
- 返回统一结果：`ready | degraded | failed | blocked`、`reason_code`、raw exit facts 和 redacted diagnostic；
- 安装失败不得被静默吞掉，后续 host config / provider mutation 必须按 action contract 显式决定是否继续。

### 5. Host config transaction

`host-config.cjs` 保留现有 mutation safety：

1. 根据 host authority 和 registry target 解析唯一 config path；
2. 检查 scope、precedence、writable status 和 existing conflict；
3. 获取跨进程 lock；
4. 解析现有 JSON 或定位 TOML MCP section；
5. 执行 literal secret guard 和 explicit overwrite guard；
6. 写入同目录临时文件并 atomic rename；
7. 写失败时恢复 transaction 前内容并返回结构化失败事实；
8. 保留原文件权限，不扩大可读范围。

Codex TOML 使用 `toml-section-editor.cjs`，只 extract / compare / upsert / remove `[mcp_servers.<key>]` section，保留其他 section、未知 key、注释和顺序。不引入“完整 TOML 重排”，也不使用仅能序列化新文件的 30 行 writer。

### 6. Provider module contract

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

### 7. Artifact contracts

重构保持以下 primary artifacts 及其现有 schema：

| Artifact | Schema / contract |
| --- | --- |
| Install preview | `setup-install-plan.v1`，`mutation=false` |
| Diagnostic snapshot | `spec-mcp-setup-diagnostic-snapshot.v1` / `spec-mcp-setup-preflight.v2` |
| `.spec-first/config/tool-facts.json` | `tool-facts.v2` |
| `.spec-first/config/runtime-capabilities.json` | `runtime-capabilities.v1` |
| Provider readiness | current provider readiness entries and `reason_code` semantics |
| Workspace verification | current parent / child summary schemas and repo-local artifact quarantine rules |
| Project config result | current project-local config status / workspace summary schemas |

若实现发现 schema 必须变化，该变化不再属于纯重构，必须从本计划拆出、版本化并增加 downstream consumer tests。

## 实施单元

### U1：行为 characterization

- **Goal**：在删除旧实现前，把公开行为和确定性边界固化为实现无关测试。
- **Files**：`tests/unit/mcp-setup*.test.js`、`tests/unit/mcp-setup.sh`、新增 Node fixture helpers。
- **Approach**：测试 mode matrix、host authority、target scope、artifact schema、reason_code、config fixtures、provider results 和 failure paths；逐步去掉“某个 `.sh` 文件必须存在”类实现耦合断言。
- **Verification**：测试既能对当前实现建立基线，也能在切换到 Node 后不修改期望继续通过。

### U2：Registry v8

- **Goal**：建立唯一 registry source 和 schema validator。
- **Files**：新增 `setup-registry.json`、`scripts/lib/registry.cjs` 和 registry contract tests。
- **Approach**：机械迁移现有 metadata，不在迁移时改变 required/optional、host target、safety 或 provider 语义。开发期间旧 registry 只供尚未切换的旧实现读取，Node 实现只读取 v8；不实现同时合并 v7/v8 的 compatibility loader。旧 registry 在 U7 原子切换时删除。
- **Verification**：对每个旧 entry 生成 v8 projection fixture，证明 id、host target、install、detection、safety 和 readiness 字段等价。

### U3：Mode、host authority 与 project target

- **Goal**：建立显式 action plan 和 mutation gate。
- **Files**：`setup.cjs`、`args.cjs`、`mode-policy.cjs`、`host-authority.cjs`、`project-target.cjs`。
- **Approach**：先生成 action plan，再进入 read-only 或 mutation executor；所有冲突和未授权写入 fail closed。
- **Verification**：mode table 全覆盖；bare/check/plan/verify 不发生未授权副作用；parent workspace target fixtures 通过。

### U4：Process runner 与 host config

- **Goal**：替代 shell process、JSON/TOML 和 config transaction helper。
- **Files**：`process-runner.cjs`、`host-config.cjs`、`toml-section-editor.cjs`。
- **Approach**：统一 timeout、env overlay、redaction、atomic write、lock、conflict 和 secret guard。
- **Verification**：覆盖 command-not-found、timeout、nonzero、mirror failure、invalid JSON、TOML comments/unknown sections、多 server、重复执行和并发 lock。

### U5：Facts 与 renderer

- **Goal**：替代 `write-setup-facts.*`、`verify-tools.*`、`normalize-setup-facts.*`、`scan-configured-deps.cjs` 和 status renderers。
- **Files**：`facts.cjs`、`renderer.cjs`、artifact contract tests。
- **Approach**：只准备 deterministic facts；不在脚本中判断 semantic adequacy。
- **Verification**：primary artifact schema、reason_code、parent-workspace quarantine、generated runtime freshness 和 provider readiness fixtures 等价。

### U6：Provider modules

- **Goal**：迁移 CodeGraph 和 Graphify install-init / verify / refresh 行为。
- **Files**：`providers/registry.cjs`、`providers/codegraph.cjs`、`providers/graphify.cjs`。
- **Approach**：复用统一 runner 和 action plan；保留 explicit opt-in、bounded repair、degraded facts、hook/symlink containment 和 source/runtime boundary。
- **Verification**：provider plan、steady-state、first-generation、refresh、timeout、partial/degraded、invalid workspace 和 source-repo protection fixtures 通过。

### U7：入口切换与删除

- **Goal**：将所有 source consumer 切换到 Node，并删除旧实现。
- **Files**：`SKILL.md`、source templates / tests 中的脚本引用、`check-health`；删除 19 个 `.sh`、19 个 `.ps1`、旧 `.cjs` helper 和 `jq`-specific tests。
- **Approach**：保留公开 workflow 语义，仅更新内部入口引用；不保留 v7 loader 或双轨执行路径。
- **Verification**：删除完成后重新执行全部 focused tests，确认不存在对旧脚本、旧 registry 或 `jq` 的 active source 引用。

### U8：文档与发布说明

- **Goal**：同步 source 文档和发布说明。
- **Files**：`SKILL.md`、必要的 README / docs、`CHANGELOG.md`。
- **Approach**：明确“公开合同不变、内部入口更新”；不修改 generated runtime mirrors。
- **Verification**：entrypoint lint、changelog contract 和 source/runtime drift expectations 通过。

## 实施顺序

1. U1 固化实现无关的行为 characterization。
2. U2 建立 v8 registry 和 projection tests。
3. U3 实现 action plan、mode policy、host authority 和 target resolution。
4. U4 实现统一 process runner 与 host config transaction。
5. U5 迁移 facts、verification 和 renderer。
6. U6 迁移 CodeGraph / Graphify provider modules。
7. 让 Node 实现通过全部 characterization tests。
8. U7 一次性切换 source consumers，删除旧脚本、旧 registry 和 `jq` 依赖。
9. 在最终文件树上重新运行全部验证。
10. U8 更新文档和 changelog。

不建立长期 shadow-run 或 rollback layer。旧实现只在开发期间作为读取行为和建立 characterization 的 source evidence；完成 gate 只认删除后最终树上的测试结果。

## Test Plan

### Mode matrix

- bare、`--check`、`--verify-only`、`--refresh-facts`、`--plan`、`--project-config`、`--only`、`--refresh`。
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
- invalid JSON、TOML unknown section/comment preservation、config conflict、lock contention、write failure。
- unknown provider、invalid/escaping/symlink workspace、provider partial readiness、hook failure。
- parent workspace 未选 child、`--all-repos` 冲突和 repo-local artifact quarantine。

### Final commands

```bash
npm run typecheck
npm run test:mcp-setup
npm run test:unit
npm run lint:skill-entrypoints
npm run test:smoke
```

若 source template 或 runtime projection contract 被修改，再运行：

```bash
npm run test:integration
```

Windows CI 必须执行同一 Node setup contract suite；不得以当前机器缺少 Windows 环境为由声明跨平台重构完成。

## Definition of Done

- `skills/spec-mcp-setup/scripts/` 不再包含 `.sh` 或 `.ps1` 实现。
- `setup-registry.json` 是唯一 active registry source；三个旧 registry 已删除。
- `spec-mcp-setup` source/test 不再要求 `jq`。
- mode matrix、host authority、artifact schema、config transaction 和 provider contracts 有确定性测试。
- bare/check/plan/verify 路径无越权 mutation。
- 所有 provider mutation 都来自显式 selection 和可审计 action plan。
- primary facts / plan artifact schema 和 downstream consumer tests 通过。
- 最终树通过 Test Plan；通过证据来自删除旧实现之后的命令结果。
- `SKILL.md` 和 `CHANGELOG.md` 已同步，generated runtime mirrors 未手改。
- 代码量下降作为结果记录，不作为正确性 gate。

## 风险与控制

| 风险 | 控制 |
| --- | --- |
| mode 重构引入 silent mutation | mode-policy allowlist + side-effect matrix tests |
| host target 写错 | explicit host authority + precedence / scope fixtures |
| registry 继承隐藏差异 | 明确 override 顺序 + projection tests + schema validation |
| TOML / JSON 损坏用户配置 | section-preserving editor + atomic transaction + conflict fixtures |
| 外部命令卡死或泄露凭据 | bounded runner + env isolation + output redaction |
| Provider 将 partial 当 ready | structured result + confirmed/degraded reason tests |
| Graphify hook / symlink 越界 | path containment + managed block + source-repo protection |
| 删除后测试仍绑定旧结构 | U1 先改为行为测试，U7 删除后执行最终 suite |
| generated runtime 被误当 source 修改 | source-first review + runtime mirror diff check |
