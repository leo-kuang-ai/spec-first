# `spec-mcp-setup` 终版重构技术方案

> Lifecycle: historical-input / external-reference. 本文保留旧架构、方案、迁移或研究记录；当前 source of truth 以 `docs/README.md`、根目录 README、`docs/05-用户手册/`、`docs/contracts/`、`skills/`、`src/cli/` 和 `CHANGELOG.md` 为准。

> 状态说明：本文是 CRG 删除前后的探索性设计记录，不代表当前 runtime contract。
> 当前实现已移除内置 CRG 与 graph-bootstrap workflow。
> 如需恢复图谱能力，请另见后续 external graph provider 集成方案。

> 版本：终版优化版
> 目标：把 `spec-mcp-setup` 从可选 MCP 安装器，重构为 **Required Harness Runtime Setup**
> 范围：`spec-mcp-setup`、`spec-graph-bootstrap`、命令模板、README、测试入口、ledger schema、provider config
> 重要原则：**不考虑向下兼容，但必须保证当前新工作流可运行**
> 基础来源：基于原始 mcp-setup 重构方案与后续阻断项审查整合。

---

# 0. 终版结论

`spec-mcp-setup` 最终应该变成：

```text
Required Harness Runtime Setup
```

它固定安装和配置：

```text
MCP Baseline:
  - Serena
  - Sequential Thinking
  - Context7

Graph Provider MCP Baseline:
  - GitNexus
  - code-review-graph

Helper Baseline:
  - agent-browser
```

它彻底删除：

```text
- Playwright MCP
- optional tools
- quick/custom mode
- optional-pending 状态
- 顶层 crg readiness 字段
- 旧版 graph-bootstrap 对 crg.cli_status / crg.native_modules_status 的依赖
```

它只负责：

```text
1. 安装 required runtime
2. 写 Claude / Codex MCP host config
3. 安装 required helper agent-browser
4. 对 Serena 做 current repo bootstrap
5. 写 host readiness ledger v2
6. 写 .spec-first/config/graph-providers.json
7. 告诉用户下一步运行 spec-graph-bootstrap
```

它不负责：

```text
1. 不运行 gitnexus analyze
2. 不运行 code-review-graph build
3. 不生成 project-map.md
4. 不生成 architecture-facts.md
5. 不生成 impact-report.md
6. 不生成 context-pack.md
7. 不执行 review
8. 不把 graph provider 标记为 query_ready=true
```

最终分工是：

```text
spec-mcp-setup:
  准备 host runtime 和 provider config

spec-graph-bootstrap:
  真正构建 GitNexus / code-review-graph 项目图谱

spec-plan / spec-work / spec-review:
  消费已经 query_ready 的 graph providers
```

---

# 1. 核心设计原则

## 1.1 setup 和 graph bootstrap 必须分离

`spec-mcp-setup` 只证明：

```text
工具已安装
MCP server 已配置
helper 已安装
host readiness ledger 已写入
graph provider 已配置为可 bootstrap
```

它不能证明：

```text
当前仓库的 GitNexus graph 已构建
当前仓库的 code-review-graph graph 已构建
graph provider 已可查询当前 repo
```

因此要区分：

```text
configured = true
enabled_for_bootstrap = true
query_ready = false
bootstrap_required = true
```

只有 `spec-graph-bootstrap` 成功后，才能把 provider 标记为：

```text
query_ready = true
bootstrap_required = false
```

---

## 1.2 `baseline_ready` 只能有一个最终语义

终版要求：

```text
detect-tools.* 不输出 baseline_ready
verify-tools.* 统一计算 baseline_ready
```

原因：

```text
detect-tools.* 只检测 MCP tools / graph providers
install-helpers.* 才检测 agent-browser
verify-tools.* 才能看到完整事实
```

因此：

```text
detect-tools.* 输出 tool facts
install-helpers.* 输出 helper facts
verify-tools.* 合并 facts 并输出最终 baseline_ready
```

不要保留两个含义不同的 `baseline_ready`。

---

## 1.3 `mcp-tools.json` 是唯一 machine registry

`mcp-tools.json` 继续作为：

```text
MCP server
Graph Provider MCP server
```

的唯一 machine registry。

进入 `mcp-tools.json`：

```text
serena
sequential-thinking
context7
gitnexus
code-review-graph
```

不进入 `mcp-tools.json`：

```text
agent-browser
playwright
```

`agent-browser` 是 required helper，不是 MCP server。

---

## 1.4 `graph-providers.json` 不是第二个 registry

`.spec-first/config/graph-providers.json` 是项目级 provider selection projection。

它不是 tool registry。

它的职责是告诉下游：

```text
当前项目选择哪些 graph providers
这些 providers 是否 configured
是否可以进入 bootstrap
是否已经 query_ready
```

---

# 2. 用户入口设计

## 2.1 删除旧入口参数

删除：

```text
spec-mcp-setup [quick|custom]
spec-mcp-setup [quick|custom]
```

改为固定入口：

```text
spec-mcp-setup
spec-mcp-setup
```

不再暴露 quick/custom。

不再暴露 optional tools。

不再让用户选择安装哪些 MCP。

---

## 2.2 成功输出

成功后输出：

```text
Required Harness Runtime is ready.

Installed and configured:
- Serena
- Sequential Thinking
- Context7
- GitNexus
- code-review-graph
- agent-browser

Generated:
- host readiness ledger v2
- .spec-first/config/graph-providers.json

Graph providers are configured but not query-ready yet.

Next:
1. Restart Claude Code / Codex if needed.
2. Run spec-graph-bootstrap or spec-graph-bootstrap.
```

注意这句必须保留：

```text
Graph providers are configured but not query-ready yet.
```

防止用户误以为 setup 已经完成图谱构建。

---

# 3. 终版工具模型

| Tool                |               Type | Required | 进入 `mcp-tools.json` | 写 MCP config | 参与 `baseline_ready` | 是否 query_ready |
| ------------------- | -----------------: | -------: | ------------------: | -----------: | ------------------: | -------------: |
| Serena              |                MCP |      Yes |                 Yes |          Yes |                 Yes |            N/A |
| Sequential Thinking |                MCP |      Yes |                 Yes |          Yes |                 Yes |            N/A |
| Context7            |                MCP |      Yes |                 Yes |          Yes |                 Yes |            N/A |
| GitNexus            | Graph Provider MCP |      Yes |                 Yes |          Yes |                 Yes |  setup 后 false |
| code-review-graph   | Graph Provider MCP |      Yes |                 Yes |          Yes |                 Yes |  setup 后 false |
| agent-browser       |             Helper |      Yes |                  No |           No |                 Yes |            N/A |
| Playwright MCP      |            Removed |       No |                  No |           No |                  No |            N/A |

---

# 4. 文件改造清单

## 4.1 必改核心文件

```text
skills/spec-mcp-setup/mcp-tools.json
skills/spec-mcp-setup/SKILL.md
skills/spec-mcp-setup/references/supported-mcp-tools.md

skills/spec-mcp-setup/scripts/check-deps.sh
skills/spec-mcp-setup/scripts/check-deps.ps1

skills/spec-mcp-setup/scripts/install-mcp.sh
skills/spec-mcp-setup/scripts/install-mcp.ps1

skills/spec-mcp-setup/scripts/configure-host.sh
skills/spec-mcp-setup/scripts/configure-host.ps1

skills/spec-mcp-setup/scripts/detect-tools.sh
skills/spec-mcp-setup/scripts/detect-tools.ps1

skills/spec-mcp-setup/scripts/verify-tools.sh
skills/spec-mcp-setup/scripts/verify-tools.ps1

skills/spec-mcp-setup/scripts/uninstall-mcp.sh
skills/spec-mcp-setup/scripts/uninstall-mcp.ps1

skills/spec-graph-bootstrap/SKILL.md

CHANGELOG.md
package.json
```

---

## 4.2 新增文件

```text
skills/spec-mcp-setup/scripts/install-helpers.sh
skills/spec-mcp-setup/scripts/install-helpers.ps1

skills/spec-mcp-setup/scripts/write-provider-config.sh
skills/spec-mcp-setup/scripts/write-provider-config.ps1
```

可选但推荐新增：

```text
skills/spec-mcp-setup/scripts/lib-toml.sh
skills/spec-mcp-setup/scripts/lib-toml.ps1
```

用于统一 Codex TOML section 写入、检测、删除逻辑。

---

## 4.3 必须同步的 source-of-truth surface

这些不能漏：

```text
templates/claude/commands/spec/mcp-setup.md
templates/codex/commands/spec-mcp-setup.md

templates/claude/commands/spec/graph-bootstrap.md
templates/codex/commands/spec-graph-bootstrap.md

README.md
README.zh-CN.md

docs/10-prompt/skills/spec-mcp-setup/SKILL.md
docs/10-prompt/skills/spec-graph-bootstrap/SKILL.md

src/cli/instruction-bootstrap.js
```

如果 `docs/10-prompt` 是镜像文档或发布源，也必须同步，否则后续 bootstrap 可能重新生成旧内容。

---

## 4.4 删除或清理

```text
Playwright MCP registry entry
Playwright MCP 文档
Playwright MCP 测试
quick/custom 参数说明
optional tools 逻辑
optional-pending 状态
顶层 crg ledger 字段
spec-first 内置 crg readiness 检测
旧 graph-bootstrap 对 crg 字段的依赖
```

---

# 5. `mcp-tools.json` 终版设计

## 5.1 schema 升级

从：

```json
{
  "schema_version": "3"
}
```

升级为：

```json
{
  "schema_version": "5"
}
```

新增字段：

```json
{
  "category": "mcp | graph-provider",
  "provider_role": "global_knowledge | impact_context | null",
  "package": "optional package name for templated package-backed tools",
  "version": "optional package version for templated package-backed tools",
  "provider_config": {}
}
```

终版 summary columns：

```json
{
  "summary_columns": [
    "tool",
    "type",
    "required",
    "dependency",
    "host_config",
    "project_bootstrap",
    "result",
    "next_action"
  ]
}
```

---

## 5.2 tools 列表固定为 5 个

```text
serena
sequential-thinking
context7
gitnexus
code-review-graph
```

断言：

```text
不包含 playwright
不包含 agent-browser
所有 tools required=true
所有 tools 必须有 category
graph-provider 必须有 provider_role
graph-provider 必须有 provider_config.capabilities
```

---

## 5.3 Serena entry 要求

Serena 保持现有 host config 和 project bootstrap。

必须增加：

```json
{
  "category": "mcp",
  "provider_role": null,
  "dependencies": ["uv", "uvx"]
}
```

注意：

```text
只要 warmup / host config / bootstrap 中实际调用 uvx，
dependencies 就必须显式包含 uvx。
```

---

## 5.4 Sequential Thinking entry 要求

保留现有 Node / npx 配置。

增加：

```json
{
  "category": "mcp",
  "provider_role": null,
  "dependencies": ["node", "npx"]
}
```

---

## 5.5 Context7 entry 要求

保留：

```text
npx -y @upstash/context7-mcp
```

增加：

```json
{
  "category": "mcp",
  "provider_role": null,
  "dependencies": ["node", "npx"]
}
```

---

## 5.6 GitNexus entry

新增：

```json
{
  "id": "gitnexus",
  "name": "GitNexus",
  "summary_label": "GitNexus",
  "required": true,
  "category": "graph-provider",
  "provider_role": "global_knowledge",
  "description": "Global codebase knowledge graph provider for architecture facts, dependency maps, execution flows, and repo knowledge.",
  "dependencies": ["node", "npm", "npx"],
  "installation": {
    "kind": "warmup",
    "unix": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "--help"]
    },
    "windows": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "--help"]
    }
  },
  "host_config": {
    "claude": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"],
      "scope": "managed",
      "targets": {
        "managed": {
          "config_path": {
            "macos": "/Library/Application Support/ClaudeCode/managed-mcp.json",
            "linux": "/etc/claude-code/managed-mcp.json",
            "wsl": "/etc/claude-code/managed-mcp.json",
            "windows": "C:\\Program Files\\ClaudeCode\\managed-mcp.json"
          },
          "config_format": "json",
          "precedence": 100,
          "writable_check": "parent-or-file"
        },
        "user": {
          "config_path": "$HOME/.claude.json",
          "config_format": "json",
          "precedence": 10,
          "writable_check": "parent-or-file"
        }
      },
      "fallback_order": ["managed", "user"],
      "uninstall_targets": ["managed", "user"]
    },
    "codex": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"],
      "startup_timeout_sec": 90,
      "scope": "user",
      "targets": {
        "user": {
          "config_path": "$HOME/.codex/config.toml",
          "config_format": "toml",
          "precedence": 50,
          "writable_check": "parent-or-file"
        },
        "system": {
          "config_path": "/etc/codex/config.toml",
          "config_format": "toml",
          "precedence": 100,
          "writable_check": "file-only"
        }
      },
      "fallback_order": ["user"],
      "uninstall_targets": ["user", "system"]
    }
  },
  "detection": {
    "kind": "host_config_exact",
    "key": "gitnexus"
  },
  "project_bootstrap": {
    "kind": "none",
    "required": false
  },
  "provider_config": {
    "enabled_for_bootstrap": true,
    "query_ready_after_setup": false,
    "role": "global_knowledge",
    "capabilities": [
      "build_global_graph",
      "architecture_map",
      "dependency_map",
      "execution_flow",
      "repo_wiki",
      "query_global_graph"
    ]
  },
  "license_notice": {
    "required": true,
    "message": "Review GitNexus licensing terms before commercial use."
  }
}
```

注意：

```text
spec-mcp-setup 只 warmup GitNexus 并配置 MCP。
不运行 npx gitnexus analyze。
```

---

## 5.7 code-review-graph entry

新增：

```json
{
  "id": "code-review-graph",
  "name": "code-review-graph",
  "summary_label": "code-review-graph",
  "required": true,
  "category": "graph-provider",
  "provider_role": "impact_context",
  "description": "Impact radius, minimal context, review context, and related test provider for spec-first work/review workflows.",
  "dependencies": ["uv", "uvx"],
  "installation": {
    "kind": "warmup",
    "unix": {
      "command": "uvx",
      "args": ["code-review-graph", "--help"]
    },
    "windows": {
      "command": "uvx",
      "args": ["code-review-graph", "--help"]
    }
  },
  "host_config": {
    "claude": {
      "command": "uvx",
      "args": [
        "code-review-graph",
        "serve",
        "--tools",
        "get_minimal_context_tool,get_impact_radius_tool,get_review_context_tool,query_graph_tool,detect_changes_tool,list_graph_stats_tool"
      ],
      "scope": "managed",
      "targets": {
        "managed": {
          "config_path": {
            "macos": "/Library/Application Support/ClaudeCode/managed-mcp.json",
            "linux": "/etc/claude-code/managed-mcp.json",
            "wsl": "/etc/claude-code/managed-mcp.json",
            "windows": "C:\\Program Files\\ClaudeCode\\managed-mcp.json"
          },
          "config_format": "json",
          "precedence": 100,
          "writable_check": "parent-or-file"
        },
        "user": {
          "config_path": "$HOME/.claude.json",
          "config_format": "json",
          "precedence": 10,
          "writable_check": "parent-or-file"
        }
      },
      "fallback_order": ["managed", "user"],
      "uninstall_targets": ["managed", "user"]
    },
    "codex": {
      "command": "uvx",
      "args": [
        "code-review-graph",
        "serve",
        "--tools",
        "get_minimal_context_tool,get_impact_radius_tool,get_review_context_tool,query_graph_tool,detect_changes_tool,list_graph_stats_tool"
      ],
      "startup_timeout_sec": 120,
      "scope": "user",
      "targets": {
        "user": {
          "config_path": "$HOME/.codex/config.toml",
          "config_format": "toml",
          "precedence": 50,
          "writable_check": "parent-or-file"
        },
        "system": {
          "config_path": "/etc/codex/config.toml",
          "config_format": "toml",
          "precedence": 100,
          "writable_check": "file-only"
        }
      },
      "fallback_order": ["user"],
      "uninstall_targets": ["user", "system"]
    }
  },
  "detection": {
    "kind": "host_config_exact",
    "key": "code-review-graph"
  },
  "project_bootstrap": {
    "kind": "none",
    "required": false
  },
  "provider_config": {
    "enabled_for_bootstrap": true,
    "query_ready_after_setup": false,
    "role": "impact_context",
    "capabilities": [
      "detect_changes",
      "blast_radius",
      "minimal_context",
      "review_context",
      "related_tests",
      "graph_stats"
    ]
  }
}
```

注意：

```text
spec-mcp-setup 只 warmup code-review-graph 并配置 MCP。
不运行 code-review-graph build。
```

同时必须在开发前验证：

```text
uvx code-review-graph serve --help 是否存在
--tools 参数是否存在
这些 tool name 是否和当前版本一致
未 build 时 MCP server 是否可以正常启动
```

如果验证失败，优先调整 MCP server 命令，而不是在 setup 阶段运行 build。

---

# 6. dependency model 终版设计

## 6.1 Unix required dependencies

```text
node
npm
npx
uv
uvx
jq
python3
```

其中：

```text
node / npm / npx:
  GitNexus、Sequential Thinking、Context7、agent-browser CLI、skills CLI

uv / uvx:
  Serena、code-review-graph

jq:
  shell JSON processing

python3:
  当前 configure-host.sh 的 Codex TOML section replace 依赖 python3
```

如果后续完全移除 Python TOML 写入逻辑，才可以把 `python3` 从 required dependencies 删除。

---

## 6.2 Git 依赖

`git` 在 host setup 阶段不是硬阻断。

但它影响 repo-local provider config。

规则：

```text
如果当前目录是 git repo:
  写 .spec-first/config/graph-providers.json

如果当前目录不是 git repo:
  host setup 可以继续
  provider config 跳过
  ledger 写 repo_config_status = skipped-no-git-repo
```

不要在非 repo 目录盲写：

```text
.spec-first/config/graph-providers.json
```

---

## 6.3 Windows dependencies

PowerShell 版本必须检测：

```text
node
npm
npx
uv
uvx
git
```

Windows 不强制 `jq` 和 `python3`，除非 `.ps1` 实现实际依赖它们。

---

# 7. `check-deps.*` 终版改造

## 7.1 输出 shape

```json
{
  "schema_version": "deps.v2",
  "platform": "macos",
  "dependencies": {
    "node": {
      "required": true,
      "installed": true,
      "version": "v20.11.0",
      "install_suggestion": null
    },
    "npm": {
      "required": true,
      "installed": true,
      "version": "10.2.4",
      "install_suggestion": null
    },
    "npx": {
      "required": true,
      "installed": true,
      "version": "10.2.4",
      "install_suggestion": null
    },
    "uv": {
      "required": true,
      "installed": true,
      "version": "uv 0.4.0",
      "install_suggestion": null
    },
    "uvx": {
      "required": true,
      "installed": true,
      "version": "uvx 0.4.0",
      "install_suggestion": null
    },
    "jq": {
      "required": true,
      "installed": true,
      "version": "jq-1.7",
      "install_suggestion": null
    },
    "python3": {
      "required": true,
      "installed": true,
      "version": "Python 3.11.0",
      "install_suggestion": null
    },
    "git": {
      "required": false,
      "installed": true,
      "version": "git version 2.44.0",
      "install_suggestion": null
    }
  },
  "required_ready": true,
  "warnings": []
}
```

---

## 7.2 依赖失败规则

```text
required dependency missing:
  check-deps exits non-zero
  setup stops before install

git missing:
  warning
  host setup continues
  repo provider config skipped
```

---

# 8. `install-helpers.*` 终版设计

## 8.1 helper 范围

当前只有一个 required helper：

```text
agent-browser
```

未来如果增加 helper，不进入 `mcp-tools.json`，而是在 `install-helpers.*` 管理。

---

## 8.2 必须支持两个模式

```bash
install-helpers.sh
install-helpers.sh --install
install-helpers.sh --verify-only
```

PowerShell：

```powershell
.\install-helpers.ps1
.\install-helpers.ps1 -Install
.\install-helpers.ps1 -VerifyOnly
```

语义：

```text
默认模式 / --install:
  允许写入系统或全局环境
  缺失时安装 agent-browser CLI
  运行 agent-browser install
  安装 global agent-browser skill

--verify-only:
  只检测
  不 npm install
  不 agent-browser install
  不 npx skills add
  不写任何全局环境
```

---

## 8.3 默认安装行为

Unix 伪代码：

```bash
#!/usr/bin/env bash
set -euo pipefail

MODE="install"
if [ "${1:-}" = "--verify-only" ]; then
  MODE="verify-only"
fi

status="ready"
dependency_status="ready"
install_status="ready"
skill_status="ready"
project_status="not-applicable"
next_action=""

if ! command -v agent-browser >/dev/null 2>&1; then
  dependency_status="missing"

  if [ "$MODE" = "verify-only" ]; then
    status="action-required"
    install_status="action-required"
    next_action="install agent-browser CLI"
  else
    if CI=true npm install -g agent-browser; then
      dependency_status="ready"
    else
      status="action-required"
      install_status="action-required"
      next_action="npm install -g agent-browser failed"
    fi
  fi
fi

if [ "$status" = "ready" ] && [ "$MODE" = "install" ]; then
  if ! agent-browser install; then
    status="action-required"
    install_status="action-required"
    next_action="run agent-browser install manually"
  fi
fi

if [ "$status" = "ready" ] && [ "$MODE" = "install" ]; then
  if ! npx skills add vercel-labs/agent-browser; then
    status="action-required"
    skill_status="action-required"
    next_action="install global agent-browser skill manually"
  fi
fi

if [ "$status" = "ready" ] && [ "$MODE" = "verify-only" ]; then
  if ! command -v agent-browser >/dev/null 2>&1; then
    status="action-required"
    dependency_status="missing"
    next_action="install agent-browser CLI"
  fi
fi

jq -n \
  --arg status "$status" \
  --arg dependency_status "$dependency_status" \
  --arg install_status "$install_status" \
  --arg skill_status "$skill_status" \
  --arg project_status "$project_status" \
  --arg next_action "$next_action" \
  '{
    helper_tools: {
      "agent-browser": {
        required: true,
        type: "helper",
        dependency_status: $dependency_status,
        host_config_status: "not-applicable",
        install_status: $install_status,
        skill_status: $skill_status,
        project_status: $project_status,
        result: $status,
        next_action: $next_action
      }
    }
  }'
```

---

## 8.4 输出 shape 统一

必须固定输出：

```json
{
  "helper_tools": {
    "agent-browser": {
      "required": true,
      "type": "helper",
      "dependency_status": "ready",
      "host_config_status": "not-applicable",
      "install_status": "ready",
      "skill_status": "ready",
      "project_status": "not-applicable",
      "result": "ready",
      "next_action": ""
    }
  }
}
```

不要一处输出：

```json
{
  "agent-browser": {}
}
```

另一处又要求：

```json
{
  "helper_tools": {
    "agent-browser": {}
  }
}
```

---

# 9. `install-mcp.*` 终版设计

## 9.1 删除旧逻辑

删除：

```text
--skip
SKIP_FILTER
SKIP_ARRAY
optional tool selection
quick/custom mode branching
optional-pending
```

---

## 9.2 默认安装全部 tools

安装范围来自：

```bash
jq -r '.tools[].id' mcp-tools.json
```

也就是固定：

```text
serena
sequential-thinking
context7
gitnexus
code-review-graph
```

---

## 9.3 保留内部调试参数

可以保留：

```bash
--only serena
--only gitnexus
--only code-review-graph
```

但不要写入 `SKILL.md` 用户路径。

---

## 9.4 安装流程

每个 tool：

```text
1. 读取 dependencies
2. 检查 dependency_status
3. 执行 warmup
4. 调用 configure-host.*
5. 如果是 Serena，执行 activate-serena.*
6. 写 tool result
```

伪代码：

```bash
for tool_id in $(jq -r '.tools[].id' "$TOOLS_JSON"); do
  category="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .category' "$TOOLS_JSON")"
  install_kind="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .installation.kind' "$TOOLS_JSON")"

  status="ready"
  reason_code=""
  next_action=""

  if ! check_tool_dependencies "$tool_id"; then
    status="action-required"
    reason_code="dependency_missing"
    next_action="install required dependency"
  fi

  if [ "$status" = "ready" ] && [ "$install_kind" = "warmup" ]; then
    if ! run_warmup "$tool_id"; then
      status="action-required"
      reason_code="warmup_failed"
      next_action="check network and tool package availability"
    fi
  fi

  if [ "$status" = "ready" ]; then
    if ! "$SCRIPT_DIR/configure-host.sh" --tool "$tool_id"; then
      status="action-required"
      reason_code="configure_failed"
      next_action="check host config permissions"
    fi
  fi

  if [ "$tool_id" = "serena" ] && [ "$status" = "ready" ]; then
    if ! "$SCRIPT_DIR/activate-serena.sh"; then
      status="partial"
      reason_code="serena_bootstrap_failed"
      next_action="check current repo Serena bootstrap"
    fi
  fi

  append_result "$tool_id" "$status" "$reason_code" "$next_action"
done
```

---

## 9.5 明确禁止行为

`install-mcp.*` 不得执行：

```text
gitnexus analyze
code-review-graph build
code-review-graph install
project-map generation
review context generation
```

---

# 10. `configure-host.*` 终版设计

## 10.1 Claude config

Claude 写入：

```json
{
  "mcpServers": {
    "serena": {},
    "sequential-thinking": {},
    "context7": {},
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"]
    },
    "code-review-graph": {
      "command": "uvx",
      "args": [
        "code-review-graph",
        "serve",
        "--tools",
        "get_minimal_context_tool,get_impact_radius_tool,get_review_context_tool,query_graph_tool,detect_changes_tool,list_graph_stats_tool"
      ]
    }
  }
}
```

保留：

```text
Claude managed target 优先
无法写 managed 时 fallback 到 user target
fallback-active 必须可被 detect-tools 识别
```

---

## 10.2 Codex config

Codex TOML 写入：

```toml
[mcp_servers.gitnexus]
command = "npx"
args = ["-y", "gitnexus@latest", "mcp"]
startup_timeout_sec = 90

[mcp_servers."code-review-graph"]
command = "uvx"
args = [
  "code-review-graph",
  "serve",
  "--tools",
  "get_minimal_context_tool,get_impact_radius_tool,get_review_context_tool,query_graph_tool,detect_changes_tool,list_graph_stats_tool"
]
startup_timeout_sec = 120
```

---

## 10.3 TOML key formatter

必须统一实现：

```bash
toml_table_key() {
  local key="$1"
  if printf '%s' "$key" | grep -Eq '^[A-Za-z0-9_]+$'; then
    printf 'mcp_servers.%s' "$key"
  else
    local escaped="${key//\"/\\\"}"
    printf 'mcp_servers."%s"' "$escaped"
  fi
}
```

PowerShell：

```powershell
function Get-TomlTableKey {
  param([string]$Key)

  if ($Key -match '^[A-Za-z0-9_]+$') {
    return "mcp_servers.$Key"
  }

  $escaped = $Key.Replace('"', '\"')
  return "mcp_servers.`"$escaped`""
}
```

---

## 10.4 TOML section replace 必须删除 quoted 和 unquoted 两种旧 section

写入 `code-review-graph` 前，必须删除：

```toml
[mcp_servers.code-review-graph]
```

和：

```toml
[mcp_servers."code-review-graph"]
```

否则会重复。

建议集中实现：

```text
remove_toml_mcp_section(key)
write_toml_mcp_section(key, body)
extract_toml_mcp_section(key)
```

并由以下脚本复用：

```text
configure-host.*
detect-tools.*
uninstall-mcp.*
```

---

# 11. `detect-tools.*` 终版设计

## 11.1 职责

`detect-tools.*` 只负责检测：

```text
MCP tools
graph-provider MCP config
Serena project bootstrap 状态
host config selected scope
```

不负责：

```text
agent-browser
baseline_ready
write ledger
write provider config
```

---

## 11.2 删除旧 CRG 检测

删除或停止调用：

```text
crg_cli_status
crg_native_modules_status
crg_can_resolve_module
```

删除输出：

```json
"crg": {}
```

---

## 11.3 输出 shape

```json
{
  "schema_version": "tool-facts.v2",
  "host": "claude",
  "platform": "macos",
  "repo_root": "/path/to/repo",
  "repo_status": "git-repo",
  "tools": {
    "serena": {
      "required": true,
      "type": "mcp",
      "dependency_status": "ready",
      "host_config_status": "ready",
      "project_status": "ready",
      "selected_scope": "managed",
      "next_action": ""
    },
    "sequential-thinking": {
      "required": true,
      "type": "mcp",
      "dependency_status": "ready",
      "host_config_status": "ready",
      "project_status": "not-applicable",
      "selected_scope": "managed",
      "next_action": ""
    },
    "context7": {
      "required": true,
      "type": "mcp",
      "dependency_status": "ready",
      "host_config_status": "ready",
      "project_status": "not-applicable",
      "selected_scope": "managed",
      "next_action": ""
    },
    "gitnexus": {
      "required": true,
      "type": "graph-provider",
      "dependency_status": "ready",
      "host_config_status": "ready",
      "project_status": "not-applicable",
      "selected_scope": "managed",
      "configured": true,
      "query_ready": false,
      "bootstrap_required": true,
      "next_action": "run spec-graph-bootstrap"
    },
    "code-review-graph": {
      "required": true,
      "type": "graph-provider",
      "dependency_status": "ready",
      "host_config_status": "ready",
      "project_status": "not-applicable",
      "selected_scope": "managed",
      "configured": true,
      "query_ready": false,
      "bootstrap_required": true,
      "next_action": "run spec-graph-bootstrap"
    }
  },
  "graph_providers": {
    "gitnexus": {
      "required": true,
      "role": "global_knowledge",
      "dependency_status": "ready",
      "host_config_status": "ready",
      "configured": true,
      "enabled_for_bootstrap": true,
      "query_ready": false,
      "bootstrap_required": true,
      "capabilities": [
        "build_global_graph",
        "architecture_map",
        "dependency_map",
        "execution_flow",
        "repo_wiki",
        "query_global_graph"
      ],
      "next_action": "run spec-graph-bootstrap"
    },
    "code-review-graph": {
      "required": true,
      "role": "impact_context",
      "dependency_status": "ready",
      "host_config_status": "ready",
      "configured": true,
      "enabled_for_bootstrap": true,
      "query_ready": false,
      "bootstrap_required": true,
      "capabilities": [
        "detect_changes",
        "blast_radius",
        "minimal_context",
        "review_context",
        "related_tests",
        "graph_stats"
      ],
      "next_action": "run spec-graph-bootstrap"
    }
  },
  "next_actions": []
}
```

---

# 12. `verify-tools.*` 终版设计

## 12.1 职责

`verify-tools.*` 是最终 readiness 计算器。

它负责：

```text
1. 调用 detect-tools.*
2. 调用 install-helpers.* --verify-only
3. 合并 tool facts 和 helper facts
4. 统一计算 baseline_ready
5. 写 host readiness ledger v2
6. 调用 write-provider-config.* 写项目级 provider config
```

它不能：

```text
1. npm install
2. agent-browser install
3. npx skills add
4. gitnexus analyze
5. code-review-graph build
```

---

## 12.2 baseline_ready 计算

`baseline_ready=true` 当且仅当：

```text
所有 tools:
  dependency_status == ready
  host_config_status == ready 或 fallback-active
  project_status == ready 或 not-applicable

并且:
  helper_tools.agent-browser.result == ready
```

注意：

```text
graph provider query_ready=false 不影响 baseline_ready
```

因为 baseline_ready 表示 runtime ready，不表示 graph query ready。

---

## 12.3 ledger v2 schema

```json
{
  "schema_version": "v2",
  "host": "claude",
  "platform": "macos",
  "repo_root": "/path/to/repo",
  "repo_status": "git-repo",
  "repo_config_status": "written",
  "overall_status": "ready",
  "baseline_ready": true,
  "host_runtime_ready": true,
  "graph_bootstrap_required": true,
  "completed_at": "2026-04-27T00:00:00Z",
  "tools": {
    "serena": {},
    "sequential-thinking": {},
    "context7": {},
    "gitnexus": {},
    "code-review-graph": {}
  },
  "graph_providers": {
    "gitnexus": {
      "configured": true,
      "enabled_for_bootstrap": true,
      "query_ready": false,
      "bootstrap_required": true
    },
    "code-review-graph": {
      "configured": true,
      "enabled_for_bootstrap": true,
      "query_ready": false,
      "bootstrap_required": true
    }
  },
  "helper_tools": {
    "agent-browser": {
      "required": true,
      "type": "helper",
      "dependency_status": "ready",
      "host_config_status": "not-applicable",
      "install_status": "ready",
      "skill_status": "ready",
      "project_status": "not-applicable",
      "result": "ready",
      "next_action": ""
    }
  },
  "next_actions": [
    "run spec-graph-bootstrap"
  ]
}
```

---

## 12.4 ledger path

保持：

```text
Claude Code:
  ~/.claude/spec-first/host-setup.json

Codex:
  ~/.codex/spec-first/host-setup.json
```

---

## 12.5 repo 非 git 时的 ledger

如果当前目录不是 git repo：

```json
{
  "repo_status": "not-git-repo",
  "repo_config_status": "skipped-no-git-repo",
  "repo_config_path": null,
  "baseline_ready": true,
  "graph_bootstrap_required": true,
  "next_actions": [
    "enter a git repo and run spec-graph-bootstrap"
  ]
}
```

host setup 可以成功，但不写 `.spec-first/config/graph-providers.json`。

---

# 13. `write-provider-config.*` 终版设计

## 13.1 输出路径

```text
.spec-first/config/graph-providers.json
```

只在明确 git repo 内写入。

---

## 13.2 输出 JSON

```json
{
  "schema_version": "graph-providers.v1",
  "generated_by": "spec-mcp-setup",
  "generated_at": "2026-04-27T00:00:00Z",
  "repo_root": "/path/to/repo",
  "providers": {
    "gitnexus": {
      "configured": true,
      "enabled_for_bootstrap": true,
      "query_ready": false,
      "bootstrap_required": true,
      "required": true,
      "role": "global_knowledge",
      "mcp_server": "gitnexus",
      "dependency_status": "ready",
      "host_config_status": "ready",
      "capabilities": [
        "build_global_graph",
        "architecture_map",
        "dependency_map",
        "execution_flow",
        "repo_wiki",
        "query_global_graph"
      ],
      "next_action": "run spec-graph-bootstrap"
    },
    "code-review-graph": {
      "configured": true,
      "enabled_for_bootstrap": true,
      "query_ready": false,
      "bootstrap_required": true,
      "required": true,
      "role": "impact_context",
      "mcp_server": "code-review-graph",
      "dependency_status": "ready",
      "host_config_status": "ready",
      "capabilities": [
        "detect_changes",
        "blast_radius",
        "minimal_context",
        "review_context",
        "related_tests",
        "graph_stats"
      ],
      "next_action": "run spec-graph-bootstrap"
    }
  },
  "selection": {
    "global_knowledge": "gitnexus",
    "impact_context": "code-review-graph",
    "context_selection": "code-review-graph"
  },
  "boundaries": {
    "setup_only": true,
    "does_not_run_gitnexus_analyze": true,
    "does_not_run_code_review_graph_build": true,
    "graph_bootstrap_required": true
  }
}
```

---

## 13.3 provider 未 ready 时

```json
{
  "configured": false,
  "enabled_for_bootstrap": false,
  "query_ready": false,
  "bootstrap_required": true,
  "required": true,
  "role": "global_knowledge",
  "dependency_status": "missing",
  "host_config_status": "action-required",
  "next_action": "Fix provider setup and rerun spec-mcp-setup."
}
```

---

# 14. `spec-graph-bootstrap` 同步改造

这是必须项，不是兼容项。

因为 `spec-mcp-setup` 删除顶层 `crg` 后，`spec-graph-bootstrap` 不能再读取：

```json
{
  "crg": {
    "cli_status": "...",
    "native_modules_status": "..."
  }
}
```

---

## 14.1 新读取顺序

`spec-graph-bootstrap` 读取：

```text
1. host readiness ledger v2
2. .spec-first/config/graph-providers.json
3. mcp-tools.json provider capabilities
```

---

## 14.2 新逻辑

```text
1. 确认 baseline_ready=true
2. 确认 graph_providers.gitnexus.configured=true
3. 确认 graph_providers.code-review-graph.configured=true
4. 运行 GitNexus 项目级 analyze
5. 运行 code-review-graph 项目级 build
6. 验证 provider query readiness
7. 更新 .spec-first/config/graph-providers.json
8. 可选更新 project-local graph-bootstrap marker
```

---

## 14.3 graph-bootstrap 才能执行

```text
gitnexus analyze
code-review-graph build
```

如果仍需要内置 CRG probe：

```text
spec-graph-bootstrap 自己本地 probe
不要从 mcp-setup ledger 顶层 crg 读取
```

---

## 14.4 graph-bootstrap 完成后更新 provider config

成功后：

```json
{
  "providers": {
    "gitnexus": {
      "configured": true,
      "enabled_for_bootstrap": true,
      "query_ready": true,
      "bootstrap_required": false,
      "last_bootstrapped_at": "2026-04-27T00:00:00Z"
    },
    "code-review-graph": {
      "configured": true,
      "enabled_for_bootstrap": true,
      "query_ready": true,
      "bootstrap_required": false,
      "last_bootstrapped_at": "2026-04-27T00:00:00Z"
    }
  }
}
```

---

# 15. `uninstall-mcp.*` 终版设计

## 15.1 删除范围

只处理 MCP entries：

```text
serena
sequential-thinking
context7
gitnexus
code-review-graph
```

不处理：

```text
agent-browser CLI
global agent-browser skill
agent-browser browser install
```

---

## 15.2 TOML 删除

必须同时删除：

```toml
[mcp_servers.code-review-graph]
```

和：

```toml
[mcp_servers."code-review-graph"]
```

---

## 15.3 不删除

```text
不删除 .serena
不删除 GitNexus index/cache
不删除 code-review-graph graph cache
不删除 agent-browser CLI
不删除 global agent-browser skill
不删除 .spec-first/config/graph-providers.json
```

---

## 15.4 uninstall 后必须刷新 readiness

执行 uninstall 后：

```text
1. 重新运行 verify-tools.* --no-install
2. 更新 host readiness ledger
3. 更新 .spec-first/config/graph-providers.json
```

否则会留下 stale enabled 状态。

---

# 16. `SKILL.md` 终版改造

## 16.1 Frontmatter

```yaml
---
name: spec-mcp-setup
description: "Use when installing the required Harness Runtime for Claude Code or Codex: MCP baseline, graph providers, agent-browser helper, host MCP config, Serena repo bootstrap, readiness ledger v2, and graph provider config."
argument-hint: ""
---
```

---

## 16.2 标题

```md
# Required Harness Runtime Setup
```

---

## 16.3 Entry points

```md
**Claude entry point:** `spec-mcp-setup`
**Codex entry point:** `spec-mcp-setup`
```

---

## 16.4 Overview 表

```md
| Tool | Type | Required | Purpose |
|------|------|----------|---------|
| Serena | MCP | Yes | Symbol-level editing and current-repo bootstrap |
| Sequential Thinking | MCP | Yes | Dynamic reflective problem solving |
| Context7 | MCP | Yes | Latest framework documentation lookup |
| GitNexus | Graph Provider MCP | Yes | Global codebase knowledge and architecture facts |
| code-review-graph | Graph Provider MCP | Yes | Impact radius, minimal context, review context |
| agent-browser | Helper | Yes | Browser automation helper substrate |
```

---

## 16.5 Phase 设计

```md
## Phase 0: Project / Repo Preflight

Detect host, platform, repo root, git repo status.

## Phase 1: Dependency Detection

Run check-deps.*.

Required Unix dependencies:
node, npm, npx, uv, uvx, jq, python3.

Git is warning-level for host setup but required for repo-local provider config.

## Phase 2: Install Required Helpers

Run install-helpers.* in install mode.

agent-browser is required and participates in baseline_ready.

## Phase 3: Install Required MCP Tools and Graph Provider MCP Servers

Run install-mcp.*.

This installs all tools declared in mcp-tools.json.

## Phase 4: Host Config Writing

configure-host.* writes Claude / Codex MCP config.

Codex TOML must support quoted keys.

## Phase 5: Serena Current Repo Bootstrap

activate-serena.* runs only for Serena.

## Phase 6: Tool Facts Detection

detect-tools.* outputs tool facts only.

It does not output baseline_ready.

## Phase 7: Final Readiness Ledger

verify-tools.* merges tool facts and helper facts, then writes ledger v2.

## Phase 8: Provider Config Projection

write-provider-config.* writes .spec-first/config/graph-providers.json if current directory is a git repo.

## Phase 9: Summary and Next Step

Print table and tell user to run graph-bootstrap.
```

---

## 16.6 Scope Boundaries

```md
### Includes

- Required MCP baseline installation
- Required graph provider MCP installation
- Required helper installation
- Claude / Codex MCP host config writing
- Serena current-repo bootstrap
- agent-browser install bootstrap
- host readiness ledger v2 generation
- project-local graph provider config generation

### Excludes

- Playwright MCP installation
- optional MCP selection
- quick/custom mode
- GitNexus analyze
- code-review-graph build
- project-map generation
- architecture-facts generation
- impact-report generation
- context-pack generation
- review evidence generation
```

---

# 17. Final Summary Table

固定输出 6 行：

```text
Tool                | Type               | Required | Dependency | Host Config | Project Bootstrap | Runtime Ready | Query Ready | Next Action
Serena              | MCP                | yes      | ready      | ready       | ready             | ready         | n/a         |
Sequential Thinking | MCP                | yes      | ready      | ready       | n/a               | ready         | n/a         |
Context7            | MCP                | yes      | ready      | ready       | n/a               | ready         | n/a         |
GitNexus            | Graph Provider MCP | yes      | ready      | ready       | n/a               | ready         | false       | run graph-bootstrap
code-review-graph   | Graph Provider MCP | yes      | ready      | ready       | n/a               | ready         | false       | run graph-bootstrap
agent-browser       | Helper             | yes      | ready      | n/a         | n/a               | ready         | n/a         |
```

---

# 18. 测试方案

## 18.1 Registry schema 测试

文件：

```text
tests/unit/spec-mcp-setup-mcp-tools-schema.test.js
```

断言：

```text
schema_version == 5
tools 不包含 playwright
tools 不包含 agent-browser
tools 只包含 serena / sequential-thinking / context7 / gitnexus / code-review-graph
所有 tools required=true
所有 tools 有 category
graph-provider 必须有 provider_role
graph-provider 必须有 provider_config.capabilities
serena dependencies 包含 uv 和 uvx
code-review-graph dependencies 包含 uv 和 uvx
gitnexus dependencies 包含 node / npm / npx
```

---

## 18.2 check-deps 测试

文件：

```text
tests/unit/spec-mcp-setup-check-deps.test.sh
tests/unit/spec-mcp-setup-check-deps.ps1.test
```

断言：

```text
Unix required dependencies 包含 node/npm/npx/uv/uvx/jq/python3
git missing 只 warning
required dependency missing 时 required_ready=false
```

---

## 18.3 install-helpers 测试

文件：

```text
tests/unit/spec-mcp-setup-install-helpers.test.sh
tests/unit/spec-mcp-setup-install-helpers.ps1.test
```

断言：

```text
默认模式缺失 agent-browser 时调用 npm install -g agent-browser
默认模式调用 agent-browser install
默认模式调用 npx skills add vercel-labs/agent-browser
--verify-only 不调用 npm install
--verify-only 不调用 agent-browser install
--verify-only 不调用 npx skills add
输出 helper_tools.agent-browser
project_status=not-applicable
失败时 result=action-required
```

---

## 18.4 install-mcp 测试

文件：

```text
tests/unit/spec-mcp-setup-install-mcp.test.sh
tests/unit/spec-mcp-setup-install-mcp.ps1.test
```

断言：

```text
默认安装全部 tools
不出现 optional branch
不出现 playwright
GitNexus warmup 调用 npx -y gitnexus@latest --help
code-review-graph warmup 调用 uvx code-review-graph --help
Serena 成功后调用 activate-serena
GitNexus 不调用 gitnexus analyze
code-review-graph 不调用 code-review-graph build
```

---

## 18.5 configure-host 测试

文件：

```text
tests/unit/spec-mcp-setup-configure-host.test.js
```

断言：

```text
Claude config 写入 gitnexus
Claude config 写入 code-review-graph
Codex config 写入 [mcp_servers.gitnexus]
Codex config 写入 [mcp_servers."code-review-graph"]
replace_toml_section 删除 quoted 和 unquoted 两种旧 section
fallback-active 可被 detect-tools 识别
```

---

## 18.6 detect-tools 测试

文件：

```text
tests/unit/spec-mcp-setup-detect-tools.test.sh
tests/unit/spec-mcp-setup-detect-tools.ps1.test
```

断言：

```text
输出 schema_version=tool-facts.v2
不输出 baseline_ready
不输出 crg
不输出 playwright
输出 tools.gitnexus
输出 tools.code-review-graph
输出 graph_providers.gitnexus
输出 graph_providers.code-review-graph
graph provider query_ready=false
detect-tools 可识别 [mcp_servers."code-review-graph"]
```

---

## 18.7 verify-tools 测试

文件：

```text
tests/unit/spec-mcp-setup-verify-tools.test.sh
tests/unit/spec-mcp-setup-verify-tools.ps1.test
```

断言：

```text
只调用 install-helpers --verify-only
不执行 npm install
不执行 agent-browser install
不执行 npx skills add
写 host readiness ledger schema_version=v2
写 helper_tools.agent-browser
baseline_ready 包含 agent-browser
graph provider query_ready=false 不影响 baseline_ready
任一 required tool 失败 baseline_ready=false
任一 required helper 失败 baseline_ready=false
调用 write-provider-config
```

---

## 18.8 write-provider-config 测试

文件：

```text
tests/unit/spec-mcp-setup-write-provider-config.test.sh
tests/unit/spec-mcp-setup-write-provider-config.ps1.test
```

断言：

```text
git repo 内创建 .spec-first/config/graph-providers.json
非 git repo 不写 provider config
selection.global_knowledge=gitnexus
selection.impact_context=code-review-graph
selection.context_selection=code-review-graph
providers.*.configured=true
providers.*.enabled_for_bootstrap=true
providers.*.query_ready=false
providers.*.bootstrap_required=true
boundaries.setup_only=true
does_not_run_gitnexus_analyze=true
does_not_run_code_review_graph_build=true
```

---

## 18.9 spec-graph-bootstrap consumer 测试

文件：

```text
tests/unit/spec-graph-bootstrap-ledger-v2-consumer.test.js
```

断言：

```text
读取 ledger v2
读取 .spec-first/config/graph-providers.json
不读取顶层 crg
不要求 crg.cli_status
不要求 crg.native_modules_status
provider configured=true 时允许 bootstrap
bootstrap 成功后 query_ready=true
```

---

## 18.10 integration 测试

文件：

```text
tests/integration/spec-mcp-setup-required-runtime.test.js
```

模拟：

```text
tmp HOME
tmp repo
fake node/npm/npx
fake uv/uvx
fake jq
fake python3
fake agent-browser
fake Claude config path
fake Codex config path
```

断言：

```text
~/.claude/spec-first/host-setup.json 或 ~/.codex/spec-first/host-setup.json 存在
schema_version=v2
baseline_ready=true
host_runtime_ready=true
tools 包含 5 个 required tools
graph_providers 包含 gitnexus 和 code-review-graph
helper_tools 包含 agent-browser
.spec-first/config/graph-providers.json 存在
Playwright 不出现
optional-pending 不出现
crg 不出现
query_ready=false
```

---

## 18.11 package.json 测试入口

如果删除旧测试，必须同步更新：

```text
package.json
```

要求：

```text
npm run test:unit 不再引用已删除的 tests/unit/mcp-setup.sh
删除或重写锁定 spec-mcp-setup [quick|custom] 的 Jest contract
保留新 runtime smoke test
```

不能只删除测试文件，否则 CI 直接失败。

---

# 19. 实施顺序

## Phase 1：修方案和 source-of-truth

修改：

```text
mcp-tools.json
SKILL.md
supported-mcp-tools.md
templates/claude/commands/spec/mcp-setup.md
templates/codex/commands/spec-mcp-setup.md
README.md
README.zh-CN.md
docs/10-prompt 镜像
CHANGELOG.md
package.json
```

完成：

```text
删除 Playwright
删除 optional
删除 quick/custom
添加 GitNexus
添加 code-review-graph
明确 agent-browser 是 required helper
明确 setup 不使 graph providers query_ready
```

---

## Phase 2：Unix 脚本

修改 / 新增：

```text
check-deps.sh
install-helpers.sh
install-mcp.sh
configure-host.sh
detect-tools.sh
verify-tools.sh
write-provider-config.sh
uninstall-mcp.sh
```

完成：

```text
默认安装全部 required tools
默认安装 agent-browser
verify-only 无副作用
Codex TOML quoted key 支持
ledger v2
graph-providers.json
```

---

## Phase 3：PowerShell 镜像

修改 / 新增：

```text
check-deps.ps1
install-helpers.ps1
install-mcp.ps1
configure-host.ps1
detect-tools.ps1
verify-tools.ps1
write-provider-config.ps1
uninstall-mcp.ps1
```

要求：

```text
行为与 Unix 对齐
输出 JSON shape 对齐
测试断言对齐
```

---

## Phase 4：改 `spec-graph-bootstrap`

修改：

```text
skills/spec-graph-bootstrap/SKILL.md
templates/claude/commands/spec/graph-bootstrap.md
templates/codex/commands/spec-graph-bootstrap.md
docs/10-prompt/skills/spec-graph-bootstrap/SKILL.md
```

完成：

```text
读取 ledger v2
读取 graph-providers.json
不读取顶层 crg
负责执行 gitnexus analyze
负责执行 code-review-graph build
bootstrap 成功后更新 query_ready=true
```

---

## Phase 5：测试重构

完成：

```text
删除旧 optional / quick-custom / Playwright 测试
删除或重写旧 crg ledger v1 测试
补齐 required runtime 新测试
更新 package.json test scripts
确保 npm run test:unit 可通过
```

---

# 20. 验收标准

执行：

```text
spec-mcp-setup
```

或：

```text
spec-mcp-setup
```

必须满足：

```text
1. 安装并配置 Serena
2. 安装并配置 Sequential Thinking
3. 安装并配置 Context7
4. 安装并配置 GitNexus MCP
5. 安装并配置 code-review-graph MCP
6. 安装 agent-browser CLI
7. 运行 agent-browser install
8. 安装 agent-browser global skill
9. 不安装 Playwright MCP
10. 不存在 optional tools
11. 不存在 quick/custom mode
12. readiness ledger schema_version=v2
13. baseline_ready=true
14. host_runtime_ready=true
15. tools 包含 serena / sequential-thinking / context7 / gitnexus / code-review-graph
16. graph_providers 包含 gitnexus 和 code-review-graph
17. helper_tools 包含 agent-browser
18. 不存在顶层 crg
19. graph providers configured=true
20. graph providers query_ready=false
21. graph_bootstrap_required=true
22. git repo 内生成 .spec-first/config/graph-providers.json
23. 非 git repo 不写 provider config，但 host setup 可成功
24. 最后提示用户运行 spec-graph-bootstrap 或 spec-graph-bootstrap
```

---

# 21. 开发提示词

可以直接把下面这段交给开发 agent：

```text
你是 spec-first 项目的核心维护者。请基于当前 master 分支重构 skills/spec-mcp-setup，使它从可选 MCP 安装器升级为 Required Harness Runtime Setup。

重要约束：
- 不考虑向下兼容。
- 但当前新工作流必须完整可运行。
- 所有源码改动必须同步更新 CHANGELOG.md。
- 不要只删除测试文件，必须同步更新 package.json 测试入口。

目标：
1. 删除 Playwright MCP。
2. 删除 optional tools、quick/custom mode、optional-pending。
3. mcp-tools.json schema 升级为 4。
4. mcp-tools.json 只保留 serena、sequential-thinking、context7、gitnexus、code-review-graph。
5. 所有 mcp-tools.json tools 都 required=true。
6. 所有 tools 增加 category 字段：mcp 或 graph-provider。
7. agent-browser 不进入 mcp-tools.json。
8. agent-browser 作为 required helper，由 install-helpers.sh / install-helpers.ps1 管理。
9. install-helpers 默认模式必须：
   - 缺失时安装 agent-browser CLI
   - 运行 agent-browser install
   - 安装 global agent-browser skill
10. install-helpers --verify-only 必须只检测，不写入，不安装。
11. install-helpers 输出 shape 必须是：
    {
      "helper_tools": {
        "agent-browser": {}
      }
    }
12. check-deps Unix required dependencies 包含：
    node, npm, npx, uv, uvx, jq, python3。
13. serena 和 code-review-graph dependencies 必须包含 uv 和 uvx。
14. 新增 GitNexus graph provider：
    - warmup: npx -y gitnexus@latest --help
    - MCP: npx -y gitnexus@latest mcp
    - role: global_knowledge
15. 新增 code-review-graph graph provider：
    - warmup: uvx code-review-graph --help
    - MCP: uvx code-review-graph serve --tools get_minimal_context_tool,get_impact_radius_tool,get_review_context_tool,query_graph_tool,detect_changes_tool,list_graph_stats_tool
    - role: impact_context
16. spec-mcp-setup 不得运行 gitnexus analyze。
17. spec-mcp-setup 不得运行 code-review-graph build。
18. detect-tools.* 删除顶层 crg 字段。
19. detect-tools.* 不输出 baseline_ready，只输出 tool facts。
20. verify-tools.* 合并 detect-tools facts 和 install-helpers --verify-only facts。
21. verify-tools.* 统一计算 baseline_ready。
22. verify-tools.* 输出 readiness ledger schema_version=v2。
23. baseline_ready 必须包含 MCP tools、graph providers、agent-browser。
24. graph provider 在 setup 后只能 configured=true、enabled_for_bootstrap=true、query_ready=false。
25. 新增 write-provider-config.sh / write-provider-config.ps1。
26. write-provider-config 只在 git repo 内生成 .spec-first/config/graph-providers.json。
27. .spec-first/config/graph-providers.json 不是第二个 registry，只是 provider selection projection。
28. configure-host.* 必须支持 Codex TOML quoted table key：
    [mcp_servers."code-review-graph"]
29. configure-host.* 写入前必须删除 quoted 和 unquoted 两种旧 section。
30. detect-tools.* 和 uninstall-mcp.* 必须复用同一 TOML key formatter/parser。
31. uninstall-mcp.* 必须能删除 gitnexus 和 code-review-graph。
32. uninstall 后必须刷新 readiness ledger 和 provider config。
33. spec-graph-bootstrap 必须同步改造：
    - 读取 ledger v2
    - 读取 .spec-first/config/graph-providers.json
    - 不再读取顶层 crg
    - graph-bootstrap 自己负责 gitnexus analyze
    - graph-bootstrap 自己负责 code-review-graph build
    - bootstrap 成功后更新 query_ready=true
34. 更新 SKILL.md、supported-mcp-tools.md、README.md、README.zh-CN.md、templates、docs/10-prompt 镜像。
35. 更新 package.json test scripts。
36. 删除或重写旧 quick/custom、optional、Playwright、crg v1 测试。
37. 补齐新测试：
    - mcp-tools schema v5
    - helper install / verify-only
    - dependency detection
    - Codex TOML quoted key
    - detect-tools facts v2
    - ledger v2
    - graph-providers.json
    - graph-bootstrap ledger v2 consumer
    - required runtime integration
```

---

# 22. 最终一句话

终版 `spec-mcp-setup` 的定位是：

> **固定安装 Serena、Sequential Thinking、Context7、GitNexus MCP、code-review-graph MCP 和 agent-browser；删除 Playwright、optional、quick/custom；输出 readiness ledger v2 和 `.spec-first/config/graph-providers.json`；但不执行任何图谱构建。图谱构建和 query_ready 状态由 `spec-graph-bootstrap` 负责。**
