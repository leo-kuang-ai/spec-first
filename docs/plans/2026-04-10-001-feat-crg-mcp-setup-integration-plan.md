---
title: "feat: Add code-review-graph as optional MCP tool in mcp-setup"
type: feat
status: completed
date: 2026-04-10
origin: docs/01-需求分析/spec-graph-bootstrap需求/阶段0-CRG安装接入mcp-setup技术方案.md
---

# feat: Add code-review-graph as optional MCP tool in mcp-setup

## Overview

将 `code-review-graph`（CRG）作为 `optional` 工具纳入 `mcp-setup` 的标准安装链，使其可通过 `spec-mcp-setup` 安装和检测。同时将 `verify-tools.sh` / `verify-tools.ps1` 从硬编码重构为数据驱动，并将 host marker schema 从 v4 升级到 v5（加法兼容：保留 `tools` 字段，新增 `optional_tools` 字段）。

## Problem Frame

`spec-graph-bootstrap` Phase 2 的 Full mode 依赖 CRG MCP 工具，但 CRG 目前没有被 `mcp-setup` 管理。如果不先解决宿主级安装，`spec-graph-bootstrap` 就必须自己承担"装工具、配宿主、验可用"的职责，违反现有分层原则（`mcp-setup` 管宿主级、`spec-graph-bootstrap` 管项目级）。

阶段 0 的目标是把 CRG 宿主级安装产品化，使后续阶段 1/2 能干净地以 `optional_tools.code-review-graph.configured` 为 gate 决定进入哪种模式。

（参见 origin: docs/01-需求分析/spec-graph-bootstrap需求/阶段0-CRG安装接入mcp-setup技术方案.md）

## Requirements Trace

- R1. `mcp-tools.json` 中存在 `code-review-graph` 条目，`category=optional`，启动命令为 `uvx code-review-graph serve`
- R2. `detect-tools.sh` / `.ps1` 能区分 CRG 已配置 / 未配置（无需修改脚本，数据驱动已覆盖）
- R3. `install-coordinator.sh` / `.ps1` 通过 `--install=code-review-graph` 能将 CRG 写入宿主配置
- R4. `SKILL.md` Phase 3 optional tools 列表包含 CRG；`quick` 模式跳过 optional，`custom` 模式仅保留“是否安装 optional tools（整体）”交互，不引入 per-tool 选择
- R5. `verify-tools.sh` / `.ps1` 从数据驱动读取工具列表，输出 v5 schema，`setup_success` 只由 required tools 决定
- R6. host marker v5 保留 `tools` 字段（required tools，向后兼容 spec-graph-bootstrap），新增 `optional_tools` 字段
- R7. `verify-tools.sh` 与 `verify-tools.ps1` 在同一 PR 同步交付，不允许单端后置
- ~~R8~~（降级为跨阶段契约约束，不作为本计划验收项）：读取方必须容忍 `optional_tools` 缺失（v4 场景）和未知附加字段，不得因 schema 加法扩展报错。该约束由 spec-graph-bootstrap 阶段 2 实施并验证；本计划通过 KD-5 记录约定，不在此处设验收门控。

## Scope Boundaries

- 不修改 `check-deps.sh` / `.ps1`（uvx 管理 Python，无需新增 python3 检测）
- 不修改 `detect-tools.sh` / `.ps1`（已数据驱动）
- 不修改 `install-coordinator.sh` / `.ps1`（已支持 --install 参数）
- 不修改 `spec-graph-bootstrap` SKILL.md（`tools.*.configured` 字段保持不变）
- 不实现任何 repo 级 CRG 操作（build_or_update_graph_tool、list_graph_stats_tool 等）
- 不实现 per-tool optional 细粒度选择交互（后续产品化迭代）
- 不在本计划中实现 `spec-graph-bootstrap` 对 v4/v5 marker 的消费逻辑（属于阶段 2）
- 不在本计划中新增 runtime MCP 可调用性验证（该验证仍由 `spec-graph-bootstrap/spec-graph-bootstrap` 的项目级 probe 负责）

## Context & Research

### Relevant Code and Patterns

- `skills/mcp-setup/mcp-tools.json` — 现有工具定义结构；playwright 是当前唯一 optional 工具，是 CRG 条目的直接模板
- `skills/mcp-setup/scripts/detect-tools.sh` — 第 34 行 `jq -r '.tools[].id' "$TOOLS_JSON"` 动态遍历工具；添加 JSON 条目即自动覆盖，零脚本修改
- `skills/mcp-setup/scripts/install-coordinator.sh` — `should_install()` 函数通过 `--install` 过滤，optional 工具默认跳过，可显式触发
- `skills/mcp-setup/scripts/verify-tools.sh` — 当前 v4 hardcoded：手动调用 `check_mcp_configured "serena"` 等三次，输出静态 JSON；必须重构为数据驱动
- `tests/unit/mcp-setup.sh` — 测试 5.x 节检查 `.tools.serena.configured` 等 v4 字段；需更新到 v5，同时不能让现有 required tools 检测逻辑失效
- `skills/spec-graph-bootstrap/SKILL.md` — Host Readiness Gate Step 2b 消费 `tools.*.configured`；必须保留 `tools` 字段（见关键技术决策 KD-2）

### Institutional Learnings

- 无 `docs/solutions/` 直接相关条目

### External References

- 无需外部研究：本次变更在已有 bash/jq/JSON 模式内，本地实现模式充分

## Key Technical Decisions

- **KD-1: CRG 不需要系统 Python 检测**：启动命令 `uvx code-review-graph serve` 使用 uv 工具链，自 v0.4 起内置 Python 版本管理（`uv python install`），无需系统 Python 3.10+。`uv` 已在 baseline 依赖检测中覆盖，`check-deps.sh` 无需扩展。（see origin: Section 5.4、6.3）
  > **运行时保障边界**：`check-deps.sh` 已验证 `uv` 可执行，即满足 CRG 的宿主前置条件。KD-1 的假设成立前提是 `uv >= 0.4`（内置 Python 管理的最低版本）。若现场 `uv` 版本低于 0.4，`uvx code-review-graph serve` 首次启动时会因缺乏内置 Python 管理失败；此情形属于运行时故障，**不在本计划（mcp-setup）范围内处理**，由 `spec-graph-bootstrap` Phase 0 的 runtime probe 检测并向用户输出 remediation 提示（如 `uv self update`）。本计划只负责将 CRG 写入宿主配置，不验证 uvx 拉包成功与否。

- **KD-2: v5 schema 保留 `tools` 字段（加法兼容，不改名）**：tech spec Section 6.5 原稿提议将 `tools` 改名为 `required_tools`，但 `skills/spec-graph-bootstrap/SKILL.md` Host Readiness Gate Step 2b 明确消费 `tools.*.configured`（见 SKILL.md "Consumers" 表），若改名则 spec-graph-bootstrap 静默失效。正确方案：v5 保留 `tools`（内容不变），新增 `optional_tools`（optional category 工具）。这是加法变更，对 spec-graph-bootstrap 零破坏。
  > ⚠️ **字段命名裁决**：origin 文档（阶段0技术方案.md）部分段落仍遗留 `required_tools` 表述，与本计划冲突。**以本计划字段契约为准**：写入端输出 `tools`（非 `required_tools`），读取端也按 `tools` 解析。实施时以此计划而非 origin 文档为代码依据。

- **KD-3: `verify-tools.sh` 需重构（非扩展）**：当前脚本完全硬编码（工具列表、输出 JSON 均为静态）。支持 `optional_tools` 分区必须改为从 `mcp-tools.json` 动态读取工具列表并按 `category` 分组。这是该计划工作量最重的单元，PS1 端需同步改造。

- **KD-4: startup_timeout_sec 仅对 Codex 生效**：`install-coordinator.sh` 的 `ensure_codex_startup_timeout()` 函数有 `if [ "$HOST" != "codex" ]; then return 0; fi` 判断。CRG 声明的 120 秒超时对 Claude Code 宿主无操作，无需特殊处理。

- **KD-5: v5 schema 采用“加法兼容 + 宽松读取”策略**：写入端新增 `optional_tools`，保留 `tools` 与 `setup_success` 语义不变；读取端必须忽略未知字段，并在 `optional_tools` 缺失时按“CRG 未安装”降级，而不是报错中断。

- **KD-6: category 处理采用“required 严格、非 required 宽松”策略**：`setup_success` 仅由 `category=="required"` 决定；`category!="required"` 的工具统一进入 `optional_tools` 计算，避免后续新增类别（如 `experimental`）时被静默丢失。

## Open Questions

### Resolved During Planning

- **Q: CRG 通过 uvx 启动时是否需要系统 Python 3.10+？** 否。uvx 内置 Python 管理，只依赖 `uv` 本身。（KD-1）
- **Q: `tools` 字段是否应改名为 `required_tools`？** 否。保持 `tools` 向后兼容，仅新增 `optional_tools`。（KD-2）
- **Q: detect-tools.sh 和 install-coordinator.sh 是否需要修改？** 否，均已数据驱动，添加 JSON 条目即覆盖。（KD-3）

### Deferred to Implementation

- **spec-graph-bootstrap 消费 v5 marker 的代码**：属于阶段 1/2 范围，不在本计划内。读取 v4 旧 marker 时的降级行为（`optional_tools` 字段缺失→视 CRG 未安装）由 spec-graph-bootstrap 在阶段 2 保证并补测试。

## High-Level Technical Design

> *以下说明 verify-tools.sh 重构后的输出结构，为方向性指引，非实现规范。*

**v5 host marker 结构（additive change）：**

```
{
  "version": "5",           // bumped from "4"
  "host": "...",
  "completed_at": "...",
  "setup_success": true,    // still driven by required tools only
  "tools": {                // ← PRESERVED (backward compat for spec-graph-bootstrap)
    "serena":              { "configured": true },
    "context7":            { "configured": true },
    "sequential-thinking": { "configured": true }
  },
  "optional_tools": {       // ← NEW (spec-graph-bootstrap reads this)
    "playwright":          { "configured": false },
    "code-review-graph":   { "configured": true }
  }
}
```

**verify-tools.sh 重构逻辑示意：**

```
required_ids  = mcp-tools.json 中 category=="required" 的 id 列表
optional_ids  = mcp-tools.json 中 category!="required" 的 id 列表   # KD-6: 非 required 均进入 optional_tools

for each id in required_ids:
  configured[id] = check_mcp_configured(id)

setup_success = all(configured[id] for id in required_ids)

output JSON:
  tools          = { id: {configured: ...} for id in required_ids }
  optional_tools = { id: {configured: check_mcp_configured(id)} for id in optional_ids }
```

## Implementation Units

- [ ] **Unit 1: Add code-review-graph to mcp-tools.json**

**Goal:** 将 CRG 注册为 optional MCP 工具，使 detect / install 链路自动覆盖，无需修改任何脚本。

**Requirements:** R1, R2, R3

**Dependencies:** 无

**Files:**
- Modify: `skills/mcp-setup/mcp-tools.json`
- （测试变更全部由 Unit 4 统一管理，Unit 1 不触碰 `tests/unit/mcp-setup.sh`）

**Approach:**
- 在 `tools` 数组末尾追加 CRG 条目，参照 playwright 条目结构
- `dependencies` 仅 `["uv"]`，不含 `python3`（KD-1）
- `startup_timeout_sec: 120` 写入 `mcp_config`（Codex 生效，Claude Code 忽略，KD-4）
- `detect.method: "mcp_config"`, `detect.key: "code-review-graph"`

**Patterns to follow:**
- `skills/mcp-setup/mcp-tools.json` 中的 playwright 条目

**Test scenarios:**
- Happy path: `jq -e .` 验证 JSON 合法
- Happy path: CRG 条目存在，`category == "optional"`
- Happy path: `dependencies == ["uv"]`（不含 python3）
- Happy path: `mcp_config.command == "uvx"`，`args == ["code-review-graph","serve"]`
- Happy path（辅助断言）: 工具总数为 5（原 4 个 + CRG）；主断言是 CRG 条目存在 + category/dependencies 字段值正确，数量断言仅作辅助
- Happy path: detect-tools.sh 在 CRG 已配置时将其列入 installed
- Happy path: detect-tools.sh 在 CRG 未配置时将其列入 missing
- Happy path: install-coordinator.sh `--install=code-review-graph` 将 CRG 写入宿主配置

**Verification:**
- `jq -e . skills/mcp-setup/mcp-tools.json` 退出码 0（JSON 合法）
- `jq '.tools | length' skills/mcp-setup/mcp-tools.json` 返回 5
- `jq '.tools[] | select(.id == "code-review-graph") | .category' skills/mcp-setup/mcp-tools.json` 返回 `"optional"`
- `jq '.tools[] | select(.id == "code-review-graph") | .dependencies' skills/mcp-setup/mcp-tools.json` 返回 `["uv"]`（不含 python3）
- 对应测试断言由 Unit 4 在 `tests/unit/mcp-setup.sh` 中统一覆盖

---

- [ ] **Unit 2: Update SKILL.md optional tools section**

**Goal:** 在 `mcp-setup` 技能文档中将 CRG 添加到 optional tools 列表，同步更新工具概览表。

**Requirements:** R4

**Dependencies:** Unit 1（CRG 条目已存在于 mcp-tools.json 时，文档描述才准确）

**Files:**
- Modify: `skills/mcp-setup/SKILL.md`
- Modify: `docs/10-prompt/skills/mcp-setup/SKILL.md`（中文本地化版本，由 mcp-setup.sh Section 6 通过 `PROMPT_SKILL_MD` 环境变量测试，**非自动生成，必须手动同步**）

**Approach:**
- 更新文件顶部工具概览表，新增 CRG 行：`| Code Review Graph | Optional | AST 级代码图与 blast-radius 分析，spec-graph-bootstrap Full mode 增强能力 |`
- 在 Phase 3.1 中将 CRG 与 Playwright 并列列出，附使用场景说明
- 在 Appendix schema v5 说明中更新示例（加入 `optional_tools` 分区）并补充消费者表新行：`| optional_tools.*.configured | spec-graph-bootstrap Phase 0 | 判断 CRG 是否可用，决定 Full/Enhanced/Basic mode |`
- `quick` 模式说明不变（跳过 optional），`custom` 模式文案补充 CRG
- `docs/10-prompt/skills/mcp-setup/SKILL.md` 同步中文版对应章节（工具概览表、第 3 阶段、附录 schema）

**Patterns to follow:**
- 现有 Playwright MCP 的描述风格与文案格式
- `docs/10-prompt/skills/mcp-setup/SKILL.md` 已有的中文描述风格

**Test scenarios:**
- Happy path: `skills/mcp-setup/SKILL.md` Phase 3 包含 "Code Review Graph" 字符串
- Happy path: `skills/mcp-setup/SKILL.md` 工具表包含 CRG 行
- Happy path: schema 文档中 `optional_tools` 字段有说明
- Happy path: `docs/10-prompt/skills/mcp-setup/SKILL.md` Phase 3 / 工具表同样包含 CRG（避免中英版本内容漂移）

**Verification:**
- `grep "Code Review Graph" skills/mcp-setup/SKILL.md` 有输出
- `grep "Code Review Graph" docs/10-prompt/skills/mcp-setup/SKILL.md` 有输出（或中文等价词）
- tests/unit/mcp-setup.sh section 6 (`SKILL.md validation`) 通过（包含 `PROMPT_SKILL_MD` 路径下的断言）

---

- [ ] **Unit 3: Refactor verify-tools.sh and verify-tools.ps1 (data-driven, schema v5)**

**Goal:** 将硬编码脚本重构为从 `mcp-tools.json` 动态读取工具列表，输出 v5 schema（保留 `tools` 字段，新增 `optional_tools` 字段，version 从 "4" 改为 "5"）。

**Requirements:** R5, R6

**Dependencies:** Unit 1（mcp-tools.json 包含 CRG 后，重构才有完整输出）

**Files:**
- Modify: `skills/mcp-setup/scripts/verify-tools.sh`
- Modify: `skills/mcp-setup/scripts/verify-tools.ps1`
- Test: `tests/unit/mcp-setup.sh`（section 5）

**Approach:**
- 从 `mcp-tools.json` 读取 `category=="required"` 的工具列表构建 `tools` 分区（保留原字段名，KD-2）
- 从 `mcp-tools.json` 读取 `category!="required"` 的工具列表构建 `optional_tools` 分区（KD-6）
- `setup_success` 逻辑：仍只由 required tools 决定（遍历 required 列表，全部 configured=true 则为 true）
- schema `version` 字段从 `"4"` 改为 `"5"`
- 重构后 `verify-tools.sh` 对所有工具的 `check_mcp_configured()` 调用由循环驱动，不再出现硬编码的工具名
- PS1 端同步改造，逻辑一致；同一 PR 交付，不允许后置

**Patterns to follow:**
- `skills/mcp-setup/scripts/detect-tools.sh` 第 34 行从 `mcp-tools.json` 动态读取工具 ID 的模式（`jq -r '.tools[].id'`）——用于遍历工具列表
- `skills/mcp-setup/scripts/verify-tools.sh` 现有的 `check_mcp_configured()` 函数逻辑（可复用）
- ⚠️ **注意**：`detect-tools.sh` 构建的是 JSON 数组（`["a","b"]`），`verify-tools.sh` 重构后需要构建嵌套 JSON 对象（`{"serena":{"configured":true},...}`）。两者模式不同，**不可直接套用**。推荐 jq 对象构造方式：
  ```bash
  # reduce 方式（适合动态 key）
  tools_json=$(echo "$required_ids" | jq -Rn '
    [inputs] | reduce .[] as $id ({}; . + {($id): {"configured": false}})')
  # 或通过循环 + --arg 累积 JSON 字符串，每轮用 jq -n --arg k "$id" --argjson v "$val" '{($k): $v}'
  ```
  实施前应在本地验证选定的 jq 构造方式，避免嵌套引号错误

**Test scenarios:**
- Happy path: required tools 全部配置 → `setup_success=true`，`tools.serena.configured=true` 等
- Happy path: CRG 已配置 → `optional_tools.code-review-graph.configured=true`
- Happy path: CRG 未配置（但 required 全配置）→ `setup_success=true`，`optional_tools.code-review-graph.configured=false`
- Edge case: 一个 required tool 缺失 → `setup_success=false`，`optional_tools` 仍被正确计算
- Happy path: schema `version == "5"`
- Backward compat: `tools` 字段仍存在（spec-graph-bootstrap 消费者不受影响）
- Happy path: Codex 宿主下 verify 也输出 v5 schema（`.codex/spec-first/host-setup.json`）
- Edge case: 如果 mcp-tools.json 新增一个 optional 工具，verify 输出的 `optional_tools` 自动包含它，无需改脚本
- Edge case: 如果 mcp-tools.json 出现新类别工具（非 required），verify 仍将其纳入 `optional_tools`，`setup_success` 不受影响
- Error path: `mcp-tools.json` 文件不存在 → `verify-tools.sh` 退出码非零，不写入 marker 文件，stderr 输出有意义的错误信息
- Error path: `mcp-tools.json` 存在但 JSON 格式非法（malformed）→ `verify-tools.sh` 退出码非零，不写入 marker 文件（防止写入损坏的 host-setup.json）

**Verification:**
- `tests/unit/mcp-setup.sh` section 5 全部通过（bash 端）
- `jq '.version' host-setup.json` 返回 `"5"`
- `jq '.tools.serena.configured' host-setup.json` 仍然可读（向后兼容）
- `jq '.optional_tools."code-review-graph".configured' host-setup.json` 可读
- **PS1 端最小验证**（R7 要求 `.sh/.ps1` 同一 PR 交付）：在 Windows/pwsh 环境或 CI PowerShell 作业中执行：
  ```powershell
  # fake-home 场景：CRG 已写入 ~/.codex/config.toml
  $out = pwsh -File skills/mcp-setup/scripts/verify-tools.ps1 | ConvertFrom-Json
  $out.version | Should -Be "5"
  $out.tools.serena.configured | Should -Be $true
  $out.optional_tools."code-review-graph".configured | Should -BeIn @($true, $false)
  ```
  若无 Windows CI，需在 PR 描述中附 PowerShell 手动运行截图或输出片段；不允许仅凭"代码对称"替代实际执行验证。

---

- [ ] **Unit 4: Update unit tests for v5 behavior**

**Goal:** 更新 `tests/unit/mcp-setup.sh` 中所有与工具数量、optional 工具列表、host marker schema 相关的断言，并新增 v5 optional_tools 验证测试。

**Requirements:** R1, R5, R6

**Dependencies:** Unit 1, Unit 3（需要 JSON 条目和重构后脚本先就位）

**Files:**
- Modify: `tests/unit/mcp-setup.sh`

**Approach:**
- 更新 Section 1 (config file validation)：
  - 1.2：`"4"` → `"5"` tools（总数辅助断言；建议用 `jq '.tools | length' mcp-tools.json` 动态取值而非硬编码 `"5"`，以便后续再增工具时只改 JSON 不改测试）
  - 1.5：原断言 `assert_output "Optional tool IDs" "playwright" "$optional_ids"` 为单值精确匹配，需改为集合包含检查，例如：
    ```bash
    assert_contains "Optional tool IDs contains playwright" "$optional_ids" "playwright"
    assert_contains "Optional tool IDs contains code-review-graph" "$optional_ids" "code-review-graph"
    ```
    若测试框架无 `assert_contains`，可用 `echo "$optional_ids" | grep -q "playwright"` 等价替代
- 更新 Section 3 (detect-tools.sh tests)：
  - 保留必要数量断言，但主断言从“固定总数”改为“required 集合/optional 集合包含性”
  - 3.8：required tools 全配置但 optional 未配置时，missing 至少包含 `playwright` 与 `code-review-graph`；同时将测试描述从原来的 "No missing tools when config present"（不准确，因为 optional 工具仍会在 missing 列表）修改为语义准确的描述，例如 "Required tools installed; optional tools still appear in missing list"
  - 3.9 / 3.10：codex 场景同上
  - 3.11：全缺失场景改为“missing 覆盖 mcp-tools.json 中全部 tool IDs”，而非硬编码数字
- 更新 Section 5 (verify-tools.sh tests)：
  - 5.1：schema version 从 `"4"` 改为 `"5"`；`tools.serena.configured` 检查保持（KD-2）；新增 `optional_tools.playwright.configured == "false"` 和 `optional_tools.code-review-graph.configured == "false"` 断言
  - 5.2：保持 `setup_success=false` 逻辑断言
  - 5.3：新增 CRG configured 时 `optional_tools.code-review-graph.configured == "true"` 测试
  - 5.4 (codex)：schema version `"4"` → `"5"`
- 新增 Section 5.x：optional tool 缺失不影响 `setup_success` 的独立测试案例

**Patterns to follow:**
- 现有 Section 5 的 `FH9x` fake home 模式（创建临时目录 + 临时 claude.json/config.toml + 运行脚本 + 断言输出）

**Test scenarios:**
- Happy path（辅助断言）: 1.2 tool count 为 5；主断言是 1.5 集合包含性，数量断言升级为辅助验证，后续再增工具时只需改 JSON，不触发此处失败
- Happy path: 1.5 optional_ids 集合包含 code-review-graph 与 playwright（主断言）
- Integration: 3.8 detect 在 required tools 全配置但 optional 未配置时，missing 列表包含 optional 工具
- Happy path: 5.1 schema=v5，`tools.serena.configured=true`，`optional_tools.code-review-graph.configured=false`
- Happy path: 新 5.x — CRG 已在宿主配置时，`optional_tools.code-review-graph.configured=true`
- Edge case: 新 5.x — optional tool 缺失时 `setup_success` 仍为 `true`
- Backward compat: `tools.serena.configured` 等字段在 v5 仍可正常读取
- Happy path: `skills/mcp-setup/SKILL.md` 和 `docs/10-prompt/skills/mcp-setup/SKILL.md` 均包含 CRG 引用（防止中英版本漂移）
- Integration (E2E optional tool path): 在 fake-home 环境下模拟 CRG 安装全流程：
  1. detect-tools.sh → CRG 在 `missing` 列表
  2. install-coordinator.sh `--install=code-review-graph` → 写入宿主配置
  3. detect-tools.sh → CRG 在 `installed` 列表
  4. verify-tools.sh → `optional_tools.code-review-graph.configured == true`，`setup_success` 仍为 `true`
  此测试覆盖 R1/R3/R5 的联动路径，是本次变更最关键的端到端验证，应作为 Section 5 中的独立测试用例（5.3 或新增 5.5）

**Verification:**
- `bash tests/unit/mcp-setup.sh` 全部通过（fail=0）
- 不引入 `grep -c "assert_output" tests/unit/mcp-setup.sh` 总数倒退

---

- [ ] **Unit 5: Update CHANGELOG.md and docs/08-版本更新/README.md**

**Goal:** 记录本次变更。

**Requirements:** 无功能性需求，仅合规性

**Dependencies:** Unit 1-4 全部完成

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/08-版本更新/README.md`（若存在）

**Approach:**
- 在 CHANGELOG.md 按仓库现行格式追加变更记录，标注 user-visible（optional tools 用户可见）
- 记录：mcp-tools.json 新增 CRG，verify-tools schema v4→v5，SKILL.md Phase 3 更新

**Verification:**
- CHANGELOG.md 末尾有新条目
- 条目中包含 code-review-graph 和 schema v5 关键词

## System-Wide Impact

- **向后兼容性（spec-graph-bootstrap）**：`spec-graph-bootstrap/SKILL.md` 第 241 行错误提示明确引用 `serena.configured=true`，消费路径是 `.tools.serena.configured`。v5 marker 保留 `tools` 字段，spec-graph-bootstrap 对新旧 marker 透明，无需修改。

- **磁盘上已有的 v4 marker 文件**：用户在升级前已有的 `~/.claude/spec-first/host-setup.json`（v4 格式）在本次变更后仍可被 spec-graph-bootstrap 正常读取（`setup_success` 和 `tools` 字段保持不变）。spec-graph-bootstrap 读取这些 v4 文件时，因 `optional_tools` 字段缺失，应降级到 Enhanced/Basic mode（该降级逻辑在阶段 2 实施，超出本计划范围，记录为约定）。用户下次运行 `spec-mcp-setup` 后 marker 将自动升级为 v5。

- **前向兼容约束**：后续 marker 只允许做加法扩展；消费者必须忽略未知字段。`tools` 与 `setup_success` 继续作为 baseline 契约锚点，避免每次 schema 演进触发跨技能联动重构。

- **spec-graph-bootstrap 当前状态**：`skills/spec-graph-bootstrap/SKILL.md` 当前是 57 行占位符，无任何 optional_tools 消费逻辑。本计划不改变这一现状；阶段 2 实施时才需要在该 SKILL.md 中读取 `optional_tools.code-review-graph.configured`。

- **detect-tools 输出变化**：历史测试中存在 `total == 4` 的断言（tests 3.3、3.8、3.11 等），添加 CRG 后需同步调整；同时将主断言迁移为“集合包含性优先”（Unit 4 覆盖）。

- **install-coordinator 输出变化**：默认 required-only 安装模式下，CRG 不会被写入（符合 optional 语义）。`--install=code-review-graph` 才触发 CRG 安装，行为与 playwright 一致。

- **不变的接口**：`check-deps.sh` 输出、`detect-tools.sh` 输出结构（installed/missing 数组）、`install-coordinator.sh` 接口（--install/--skip）均不变。

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| verify-tools.ps1 重构范围超出预期 | 与 .sh 端并行实施；`.sh/.ps1` 同一 PR 同步交付，不允许后置；任一端未完成则不升级 schema version。|
| verify-tools.sh 重构时意外改变 `setup_success` 逻辑 | Unit 4 已覆盖 required tool 缺失 → setup_success=false 的完整回归场景 |
| 现有测试中的硬编码数量（"4 tools"）更新遗漏 | 实施前用 `grep -n '"4"' tests/unit/mcp-setup.sh` 确认全量 |
| spec-graph-bootstrap 消费 `tools` 字段 —— 若改名则静默失效 | KD-2 已决策：保留 `tools` 字段名，不改名（加法变更） |
| v5 发布后消费者遇到未知字段导致解析失败 | KD-5：读取方宽松解析，未知字段忽略；v4 无 `optional_tools` 场景按未安装降级 |
| 未来新增 tool category 时 verify 漏算 | KD-6：按 "required 严格、非 required 宽松" 分组；新增类别默认进入 `optional_tools` |
| `configured=true` 不等于 "CRG server 运行中" | `mcp_config` 写入成功只代表宿主配置文件有该条目；`uvx code-review-graph serve` 首次启动时 uvx 会下载 CRG 包（需网络和磁盘），运行时是否可调用必须由 `spec-graph-bootstrap` Phase 0 的项目级 probe 验证，不能以 `optional_tools.code-review-graph.configured` 直接等同于可用性 |

## Documentation / Operational Notes

- `skills/mcp-setup/SKILL.md` 中的 Appendix schema 文档需同步更新为 v5（Unit 2 覆盖）
- 本计划完成后，`spec-graph-bootstrap` 阶段 2 可直接以 `optional_tools.code-review-graph.configured` 为 gate，无需再修改 `mcp-setup` 层

## Sources & References

- **Origin document:** [阶段0-CRG安装接入mcp-setup技术方案.md](docs/01-需求分析/spec-graph-bootstrap需求/阶段0-CRG安装接入mcp-setup技术方案.md)
- Related plan: [2026-04-09-001-feat-spec-graph-bootstrap-stage1-plan.md](docs/plans/2026-04-09-001-feat-spec-graph-bootstrap-stage1-plan.md)
- Relevant code: `skills/mcp-setup/mcp-tools.json`, `scripts/verify-tools.sh`, `tests/unit/mcp-setup.sh`
- spec-graph-bootstrap consumer: `skills/spec-graph-bootstrap/SKILL.md` → Host Readiness Gate Step 2b
