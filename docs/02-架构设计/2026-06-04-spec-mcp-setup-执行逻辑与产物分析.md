# spec-mcp-setup 执行逻辑与产物分析

> 日期：2026-06-04
> 状态：snapshot（v1.13.1 复核补充）
> 范围：`skills/spec-mcp-setup/**` + `src/cli/helpers/setup-facts.js` + `src/cli/commands/doctor.js` 消费侧
> 证据：基于实测脚本调用链与产物写入点，非凭文档推断；命令名以当前 source 为准（入口 canonical=`spec-runtime-setup`，运行名仍 `spec-mcp-setup`，目录未重命名）

---

## 1. 定位

`spec-mcp-setup` 是 **Runtime Setup workflow 的可运行入口**：把 host / runtime 准备成确定性 readiness facts，供下游 workflow 消费。

核心边界：**scripts prepare facts, LLM decides**——脚本只产确定性 readiness facts，不做代码语义理解；setup 不得在 ordinary work 前强制要求任何外部分析服务。

- 入口 canonical 名：`spec-runtime-setup`
- 当前运行名（迁移期 alias）：`spec-mcp-setup`
- source 目录：`skills/spec-mcp-setup/`（重命名是后续独立 work 任务）

---

## 2. 四种 Mode 的写入边界（核心安全模型）

```text
┌──────────────┬───────────────┬───────────────┬──────────┬──────────────┐
│ Mode         │ 写 setup facts │ 改 host config │ 安装工具  │ 用途          │
├──────────────┼───────────────┼───────────────┼──────────┼──────────────┤
│ --check      │      ✗        │      ✗        │    ✗     │ 只读检查      │
│ --verify-only│      ✓        │      ✗        │    ✗     │ 刷新 facts    │
│ /--refresh-  │               │               │          │              │
│   facts      │               │               │          │              │
│ --plan       │      ✗        │      ✗        │    ✗     │ 预览+安全判断 │
│ --install    │      ✓        │      ✓        │    ✓*    │ 显式安装      │
└──────────────┴───────────────┴───────────────┴──────────┴──────────────┘
  * --install 跳过 safety_result=blocked；review-required 先展示风险再执行
```

---

## 3. 执行流水线（7 步 + 脚本编排）

```text
                          ┌─────────────────────────────┐
                          │  入口: spec-mcp-setup       │
                          │       spec-mcp-setup        │
                          │  args: --claude|--codex      │
                          │        --repo  --check/...   │
                          └──────────────┬──────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼ Step1 识别 host                ▼ Step2 多仓 target              ▼ Step3 校验 registry
  ┌──────────────┐              ┌────────────────────┐          ┌──────────────────┐
  │ detect-host  │              │resolve-project-    │          │  mcp-tools.json  │
  │ .sh/.ps1     │              │target .sh/.ps1     │          │  schema v6 校验  │
  │ claude/codex │              │ 父workspace→选child│          │  required MCP    │
  └──────┬───────┘              │ symlink escape 防护│          └────────┬─────────┘
         │                      └─────────┬──────────┘                   │
         └──────────────┬─────────────────┴──────────────────────────────┘
                        ▼ Step4 检测/warmup MCP
              ┌───────────────────────┐        ┌──────────────────────┐
              │   detect-tools.sh     │───────▶│  install-mcp.sh      │
              │   (readiness 检测)     │        │  warmup npx 包       │
              │   →detect-host         │        │  →configure-host     │──┐ 写 host
              │   →resolve-target      │        │  (写 MCP host config)│  │ config
              └───────────┬───────────┘        └──────────────────────┘  │ (.claude/
                          │                                                │  settings
                          ▼ Step5 helper readiness                        │  .codex/...)
              ┌───────────────────────────────────────────────┐          │
              │  install-helpers.sh (--verify-only / --install) │         │
              │  从 helper-tools.json 派生 8 helper             │         │
              │   ┌─────────────────────────────────────┐      │         │
              │   │ lib-helper-registry.sh              │      │         │
              │   │  helper_registry_ids()   ◀── jq 读   │      │         │
              │   │  helper_registry_safety_result()    │      │         │
              │   │      └─▶ setup-plan-renderer.cjs    │      │         │
              │   │          (install safety lens)      │      │         │
              │   └─────────────────────────────────────┘      │         │
              └───────────┬───────────────────────────────────┘          │
                          ▼ Step6 verify + 写 facts + 渲染                │
        ┌──────────────────────────────────────────────────────────┐    │
        │           verify-tools.sh  (总编排器)                      │    │
        │  ├─▶ detect-host / detect-tools / resolve-project-target  │    │
        │  ├─▶ install-helpers (readiness)                          │    │
        │  ├─▶ scan-configured-deps.sh ──▶ scan-configured-deps.cjs │    │
        │  │       扫 5 surface:                                     │    │
        │  │       .claude/settings.json (MCP/hooks/allowlist)      │◀───┘
        │  │       .codex/hooks.json     (Codex parity)             │
        │  │       package.json scripts / spec-first.verification   │
        │  ├─▶ write-setup-facts.sh  ─────────┐  写产物             │
        │  │       (含 scan 结果 + existence)  │                    │
        │  └─▶ render-status-block.cjs ◀──────┼─ sections JSON      │
        │          (9 分区 status table 渲染)  │                    │
        └─────────────────────────────────────┼────────────────────┘
                          │ Step7 报告        │
                          ▼                    ▼ 写盘
        ┌──────────────────────┐   ┌────────────────────────────────────┐
        │  9 分区 Status Block  │   │  .spec-first/config/                │
        │  (给用户/下游读)      │   │    tool-facts.json (v2)            │
        └──────────────────────┘   │    runtime-capabilities.json (v1)  │
                                    │  .spec-first/workspace/             │
                                    │    scenario-fingerprint-setup.json  │
                                    └────────────────────────────────────┘
```

脚本调用链（实测）：

```text
verify-tools.sh   → detect-host, detect-tools, install-helpers,
                    scan-configured-deps, write-setup-facts, render-status-block,
                    resolve-project-target
install-mcp.sh    → configure-host, detect-host, resolve-project-target
detect-tools.sh   → detect-host, resolve-project-target
configure-host.sh → detect-host
scan-configured-deps.sh   → scan-configured-deps.cjs
normalize-setup-facts.sh  → normalize-setup-facts.cjs
bootstrap-project-config.sh → resolve-project-target
```

---

## 4. 产物与归属

```text
┌─────────────────────────────────────────┬──────────────┬───────────┬──────────────┐
│ 产物                                      │ 写入者        │ checked-in │ 消费者        │
├─────────────────────────────────────────┼──────────────┼───────────┼──────────────┤
│ skills/spec-mcp-setup/mcp-tools.json     │ 人(source)   │ ✓         │ 全脚本        │
│ skills/spec-mcp-setup/helper-tools.json  │ 人(source)   │ ✓         │ lib-helper-  │
│   helper-tools-registry.v1 (8 helper)    │              │           │ registry/scan│
│ skills/spec-mcp-setup/provider-tools.json│ 人(source)   │ ✓         │ generic 槽位  │
├─────────────────────────────────────────┼──────────────┼───────────┼──────────────┤
│ .spec-first/config/tool-facts.json (v2)  │ write-setup- │ ✗ gitig   │ doctor /     │
│   tools{} helper_tools{} items[]         │ facts.sh     │           │ normalize-   │
│   configured_dependencies[]              │              │           │ setup-facts  │
│   schema_capabilities[]                  │              │           │ → workflows  │
│ .spec-first/config/runtime-capabilities  │ write-setup- │ ✗ gitig   │ doctor       │
│   .json (direct_evidence posture)        │ facts.sh     │           │              │
│ .spec-first/workspace/scenario-          │ verify-tools │ ✗ gitig   │ using-spec-  │
│   fingerprint-setup.json (warn-continue) │              │           │ first        │
├─────────────────────────────────────────┼──────────────┼───────────┼──────────────┤
│ host MCP config                          │ configure-   │ runtime   │ host runtime │
│   .claude/settings.json / Codex config   │ host.sh      │ mirror     │              │
│   (仅 --install)                          │              │           │              │
└─────────────────────────────────────────┴──────────────┴───────────┴──────────────┘
```

产物三层：**source registry（checked-in）→ 生成 facts（gitignored）→ host config（runtime mirror）**。消费方只读生成 facts，不读 source registry 直接做判断。

---

## 5. Facts 消费链（producer → consumer gate）

```text
   write-setup-facts.sh              src/cli/helpers/setup-facts.js            doctor.js
   ┌──────────────────┐   reads     ┌───────────────────────────┐   calls    ┌──────────────┐
   │ tool-facts.json  │────────────▶│ normalizeSetupFactsFile() │◀───────────│ compute-     │
   │ (v1 或 v2)        │             │  v1/v2 兼容 + reason_code │            │ DecisionInput│
   └──────────────────┘             │ computeDecisionInputHealth│───────────▶│ Health()     │
                                     │  7 状态决策表:            │   returns  │ → decision_  │
                                     │  not_checked/missing/     │            │   input_     │
                                     │  error/stale/warn/pass    │            │   health +   │
                                     └───────────────────────────┘            │   basis      │
                                                                              └──────┬───────┘
                            ┌─────────────────────────────────────────────────────────┘
                            ▼ consumer gate (父方案 §9.0.1)
              decision_input_health != 'not_checked'  ⇒ v1.11+v1.12 切片兑现
                            ▼ 下游 workflow (advisory input)
        using-spec-first / spec-plan / spec-work / spec-debug / spec-update
```

`decision_input_health` 7 状态决策表（`setup-facts.js` `computeDecisionInputHealth`）：

```text
no host                                   → not_checked  (no-host-selected)
facts missing                             → missing      (setup-facts-missing)
facts unreadable / invalid                → error        (setup-facts-invalid)
facts.host ≠ requested platforms          → missing      (setup-facts-host-mismatch)
freshness stale (>7d)                     → stale        (setup-facts-stale)
required_action>0 或 configured action>0  → error        (required-runtime-action-required)
degraded/skipped/provider missing/stale   → warn         (optional-capability-degraded)
其余                                       → pass         (setup-facts-ready)
```

---

## 6. 双宿主 parity 模型

```text
   每个脚本逻辑 = .sh (bash) + .ps1 (PowerShell) 对等
   ┌─────────────────────────────────────────────────────────┐
   │ 纯 shell 逻辑:  detect-host / configure-host / install-* │ ← 各自原生实现
   │ 跨平台逻辑:    normalize-setup-facts / scan-configured-  │ ← .sh/.ps1 均 dispatch
   │               deps / setup-plan-renderer / render-       │    同一个 .cjs (node)
   │               status-block                               │    → parity 由 node 保证
   └─────────────────────────────────────────────────────────┘
   平台差异: jq 仅 bash path required; Windows 原生 PowerShell 不依赖 jq
```

---

## 7. 关键观察

1. **`verify-tools.sh` 是真正的总编排器**：串起 detect / install-helpers / scan / write-facts / render 五环节；其余脚本是被它（或 `install-mcp`）调用的零件。
2. **薄 `.sh`/`.ps1` + 厚 `.cjs`** 是有意的跨平台模式：normalize / scan / plan-render / status 的逻辑都在 node，shell 只做 dispatch，parity 天然由 node 保证。
3. **产物三层归属清晰**：source registry → 生成 facts → host config，消费方只读生成 facts。
4. **consumer gate 的物理实现**：`tool-facts.json` → `setup-facts.js` normalizer → `doctor.computeDecisionInputHealth` → `decision_input_health` 不再是 `not_checked`，这条链就是 v1.11→v1.12 producer→consumer 的全部。
5. **`helper-tools.json` 是 spec-first 自身 helper 的单一真相源**（8 helper：agent-browser/gh/jq/vhs/silicon/ffmpeg/ast-grep/ast-grep-skill），收敛了此前 `install-helpers.sh` 与 `check-health` 的双份维护。registry 恒取 spec-first 自身（不读被扫描目标仓）。

---

## 8. 边界（来自 SKILL.md）

setup **做**：验证 Node/npm/npx 与 required helper；warmup package-backed MCP；写 host MCP config（managed/user target）；写 project-local setup facts；把父 workspace target 歧义与 foreign residual 标为 advisory facts。

setup **不做**：跑代码索引/watcher/默认 hook/长驻 daemon；把 setup facts 当语义代码证据；手改 generated runtime mirror；在 direct source evidence 足够时阻塞 ordinary plan/work/review/debug。

---

## 9. 2026-07-07 复核补充

这次复核主要补三件事：

1. `graphify` 的专用路径是受控 provider 路由，不是主安装循环里的普通 MCP 工具。
2. `codegraph` 的修复链路是 bounded 的 `init -> status -> sync -> index -f`，并且只在状态指示需要时触发。
3. `verify-tools -> write-setup-facts` 是事实落盘链路，不承担安装或语义判断。

### 9.1 Graphify 专用路径图

```text
┌────────────────────────────────────────────────────────────────────┐
│                           入口分流                                 │
│  bare spec-mcp-setup / --only graphify / --refresh / 有 graphify  │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
                    ┌────────────────────────┐
                    │ install-mcp.sh/ps1     │
                    │ 识别 selection          │
                    └───────────┬────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
       ┌───────────────────┐        ┌──────────────────────┐
       │ 默认 MCP/Helper    │        │ graphify 专用路由    │
       │ 主循环             │        │ （only graphify）    │
       └───────────────────┘        └───────────┬──────────┘
                                                  │
                                                  ▼
                                   ┌──────────────────────────────┐
                                   │ install-helpers.*            │
                                   │ SPEC_FIRST_PROVIDER_GRAPHIFY │
                                   │ CONSENT=approved             │
                                   └───────────┬──────────────────┘
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         │                     │                     │
                         ▼                     ▼                     ▼
             ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────┐
             │ first generation  │  │ refresh / update │  │ hook install     │
             │ graphify extract . │  │ graphify update . │  │ graphify hook... │
             └─────────┬─────────┘  └─────────┬────────┘  └─────────┬────────┘
                       │                      │                     │
                       └──────────────┬───────┴──────────────┬──────┘
                                      ▼                      ▼
                        ┌────────────────────────┐  ┌────────────────────────┐
                        │ graphify-out/graph.json│  │ .git/hooks / 项目镜像   │
                        │ + GRAPH_REPORT.md      │  │ + 说明性 next action   │
                        └────────────────────────┘  └────────────────────────┘
```

### 9.2 CodeGraph 修复图

```text
┌──────────────────────────────┐
│ install-mcp 主循环选择 codegraph │
└──────────────┬───────────────┘
               │
               ▼
     ┌──────────────────────────┐
     │ npm global install/verify │
     │ pinned @colbymchenry/...  │
     └────────────┬─────────────┘
                  │
                  ▼
         ┌───────────────────┐
         │ configure-host.*  │
         │ host MCP write    │
         └─────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ codegraph init   │
          │ .codegraph/db    │
          └─────────┬────────┘
                    │
                    ▼
          ┌──────────────────┐
          │ codegraph status │
          └─────────┬────────┘
                    │
          ┌─────────┴────────────────────────────┐
          │                                      │
          ▼                                      ▼
  ┌─────────────────────┐              ┌────────────────────────┐
  │ clean / ready       │              │ Pending Changes        │
  │ 直接记 ready        │              │ or index -f advisory   │
  └─────────────────────┘              └──────────┬─────────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────────┐
                                        │ codegraph sync      │
                                        └──────────┬──────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │ status re-check  │
                                          └──────────┬───────┘
                                                     │
                      ┌──────────────────────────────┴──────────────────────────────┐
                      │                                                             │
                      ▼                                                             ▼
           ┌─────────────────────┐                                      ┌──────────────────────┐
           │ ready / synced      │                                      │ 仍要求 index -f      │
           │ 结束并写 ready      │                                      │ 仅一次 bounded repair│
           └─────────────────────┘                                      └──────────┬───────────┘
                                                                                │
                                                                                ▼
                                                                      ┌──────────────────────┐
                                                                      │ codegraph index -f   │
                                                                      └──────────┬───────────┘
                                                                                 │
                                                                                 ▼
                                                                       ┌─────────────────────┐
                                                                       │ status 再检查      │
                                                                       │ 失败则 degraded     │
                                                                       └─────────────────────┘
```

### 9.3 verify-tools -> write-setup-facts 事实落盘图

```text
┌──────────────────────────────────────────────┐
│ verify-tools.sh / verify-tools.ps1          │
│ 总编排器：只负责验证与事实聚合               │
└──────────────┬───────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ detect-host / target resolve  │
    │ install-helpers --verify-only │
    │ scan-configured-deps          │
    └──────────────┬───────────────┘
                   │
                   ▼
       ┌──────────────────────────┐
       │ 组装 readiness ledger    │
       │ tool / helper / provider │
       └──────────────┬───────────┘
                      │
                      ▼
         ┌─────────────────────────────┐
         │ write-setup-facts.sh/.ps1    │
         │ 读取当前 facts 输入          │
         └──────────────┬──────────────┘
                        │
         ┌──────────────┼──────────────────────────┐
         │              │                          │
         ▼              ▼                          ▼
 ┌────────────────┐ ┌────────────────────┐ ┌──────────────────────┐
 │ tool-facts.json │ │ runtime-capabilities│ │ workspace summary    │
 │ tools/helper/   │ │ direct_evidence +   │ │ (可选，多仓汇总)     │
 │ items/provider  │ │ generated_runtime   │ └──────────────────────┘
 └────────────────┘ │ manifest health     │
                    └────────────────────┘
```

### 9.4 复核结论

- `graphify` 是 setup 内的受控 provider 路径，只在显式选择或 bare provider pack 场景中进入，不应被误读为通用 MCP 安装项。
- `codegraph` 的修复策略是“先试状态，再做一次同步，再做一次 full reindex”，每一步都保留失败即 action-required / degraded 的退路。
- `verify-tools` 和 `write-setup-facts` 共同构成事实闭环：前者负责检查与汇总，后者负责把 facts 落到 repo-local 的 gitignored 产物中。

### 9.5 Step1 Host 写入目标表

| Host | Step1 识别方式 | 默认写入目标 | 备选写入目标 | 配置格式 | `--user-scope` 作用 |
| --- | --- | --- | --- | --- | --- |
| `claude` | `MCP_SETUP_HOST=claude`、Claude env、单独 `claude` CLI | managed | user | JSON | 无额外切换开关，脚本层仍会尊重显式 path override |
| `codex` | `MCP_SETUP_HOST=codex`、Codex env、单独 `codex` CLI | user | system | TOML | 不适用，Codex 走用户/系统两层目标，不走 `--user-scope` |
| `kiro` | `MCP_SETUP_HOST=kiro`、显式 host pin | workspace | user | JSON | 将 Kiro user-level MCP config 从“不可默认写”提升为显式 opt-in |
| `qoder` | `MCP_SETUP_HOST=qoder`、显式 host pin | local | user | JSON | 同上，只有显式 opt-in 才允许写 user-level |
| `cursor` | `MCP_SETUP_HOST=cursor`、Cursor env、`agent` CLI | project | user | JSON | 同上，只有显式 opt-in 才允许写 user-level |

说明：

- Step1 的“识别 host”不等于“最终写入目标”，后者还会经过 `detect-host.*` 和 `host_config` 目标选择。
- `claude` / `codex` 的目标优先级与 `kiro` / `qoder` / `cursor` 不同，但都满足“显式 host pin 优先，自动识别只做辅助”的原则。
- `kiro` / `qoder` / `cursor` 的 user-level 写入都必须有显式 `--user-scope` 或对应环境变量授权。
