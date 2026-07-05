---
doc_role: implementation-plan
plan_date: 2026-07-05
status: draft
origin: docs/项目审查/2026-07-05-系统性项目审查与优化方案.md
referenced_reviews:
  - review: docs/项目审查/2026-07-05-系统性项目审查与优化方案.md
    addresses_findings:
      - P1-windows-workflow-helper-portability
      - P1-helper-tools-powershell-command
      - P2-bash-only-core-workflows
  - review: docs/项目审查/2026-07-03-windows-powershell-compat-review.md
    addresses_findings:
      - P1-helper-tools-windows-command
      - P2-bash-only-workflow-helpers
freshness: current-worktree
---

# Windows Workflow Portability 收口计划

## Goals

- 关闭 Windows 安装层已验证、workflow helper 层仍 bash-only 的体验断层。
- 优先修复 PowerShell 5.1 可复制失败和核心 review workflow helper。
- 保持 macOS/Linux 现有行为不回归。

## Non-Goals

- 不承诺所有历史文档 bash 示例都改为 PowerShell。
- 不把 Git Bash/WSL 当作唯一 Windows 支持路径。
- 不手改 generated runtime mirrors。

## Implementation Units

| Unit | Scope | Source Files | Verification |
| --- | --- | --- | --- |
| U1 | 修 `agent-browser` Windows command | `skills/spec-mcp-setup/helper-tools.json`、PowerShell contract tests | `npx jest tests/unit/mcp-setup-powershell-contracts.test.js --runInBand` |
| U2 | 复核 compound validator UTF-8 source 与 fixture | `skills/spec-compound*/scripts/validate-frontmatter.py`、`tests/unit/frontmatter-validator.test.js` | 中文 frontmatter fixture |
| U3 | 新增 `resolve-base.cjs` 或等价 Node resolver | `skills/spec-code-review/scripts/`、`SKILL.md`、tests | focused git fixture |
| U4 | polish/optimize/sessions helper degraded notice 或 Node path | 对应 `skills/*/scripts` 与 `SKILL.md` | contract tests |
| U5 | focused Windows helper CI | `.github/workflows/` | windows-latest smoke |

## Acceptance

- PowerShell 5.1 copyable command 不含 POSIX env-prefix 或 `&&`。
- `spec-code-review` 在 Windows 原生环境有非-bash base detection 路径，或明确要求 user-supplied base 并标 degraded。
- 至少 2 个 workflow helper 有 Windows-focused regression evidence。

