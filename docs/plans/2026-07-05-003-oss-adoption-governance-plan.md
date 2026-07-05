---
doc_role: implementation-plan
plan_date: 2026-07-05
status: draft
origin: docs/项目审查/2026-07-05-系统性项目审查与优化方案.md
referenced_reviews:
  - review: docs/项目审查/2026-07-05-系统性项目审查与优化方案.md
    addresses_findings:
      - P1-oss-governance-signal-gaps
      - P1-enterprise-adoption-surface-missing
      - P2-english-readme-mixed-language
  - review: docs/项目审查/2026-06-15-项目Review与优化方案.md
    addresses_findings:
      - P0-enterprise-adoption-content-empty
      - P2-oss-hygiene-missing
freshness: current-worktree
---

# OSS 与采纳治理信号计划

## Goals

- 补齐外部评估者 5 分钟内会检查的基础治理 surface。
- 把 adoption-first README 与项目治理文件连接起来。
- 为后续企业采纳指南和真实案例沉淀预留路径。

## Non-Goals

- 不伪造企业案例或用户 ROI。
- 不把 ROADMAP 写成强承诺。
- 不新增新的 public workflow 入口。

## Implementation Units

| Unit | Scope | Source Files | Verification |
| --- | --- | --- | --- |
| U1 | 增 CODE_OF_CONDUCT | `CODE_OF_CONDUCT.md` | docs lint + link check |
| U2 | 增 issue templates | `.github/ISSUE_TEMPLATE/**` | template presence test |
| U3 | 增 CODEOWNERS | `.github/CODEOWNERS` 或 `CODEOWNERS` | ownership scope review |
| U4 | 增 root ROADMAP | `ROADMAP.md` | 与 active plans/reviews 一致性检查 |
| U5 | 英文 README 首屏语言纯化 | `README.md` | 双语 mirror contract |

## Acceptance

- root 或 `.github` 下具备 COC、issue templates、CODEOWNERS、ROADMAP。
- ROADMAP 明确区分 confirmed、planned、exploratory，不把 preview host 说成 full support。
- README 英文首屏不再混入中文自然语言说明。

