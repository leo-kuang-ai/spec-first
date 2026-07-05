# spec-mcp-setup 执行逻辑与产物分析

> 日期：2026-06-04
> 状态：snapshot（v1.11/v1.12 Dependency Readiness Baseline 实现后）
> 范围：`skills/spec-mcp-setup/**` + `src/cli/helpers/setup-facts.js` + `src/cli/commands/doctor.js` 消费侧
> 证据：基于实测脚本调用链与产物写入点，非凭文档推断；命令名以当前 source 为准（入口 canonical=`spec-runtime-setup`，运行名仍 `spec-mcp-setup`，目录未重命名）

---

## 1. 定位

`spec-mcp-setup` 是 **Runtime Setup workflow 的可运行入口**：把 host / runtime 准备成确定性 readiness facts，供下游 workflow 消费。

核心边界：**scripts prepare facts, LLM decides**——脚本只产确定性 readiness facts，不做代码语义理解；setup 不得在 ordinary work 前强制要求任何外部分析服务。

- 入口 canonical 名：`spec-runtime-setup`（`spec-runtime-setup` / `spec-runtime-setup`）
- 当前运行名（迁移期 alias）：`spec-mcp-setup`（`spec-mcp-setup` / `spec-mcp-setup`）
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
