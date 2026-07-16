# Anti-Rationalization Pattern Contract

Anti-rationalization tables are light-contract workflow prose that names a likely shortcut thought and pairs it with the action that should happen before the workflow proceeds.

This pattern comes from `docs/项目审查/2026-06-15-行业对标研究档案.md` §6/§12, where comparable projects use Red Flags / Common Rationalizations tables to harden agent attention. In spec-first, the borrowed mechanism is intentionally narrower: no Iron Laws, no HARD-GATE language, no state machine, and no scripted semantic enforcement.

## Canonical Shape

Each workflow section uses this heading:

```markdown
## Anti-Rationalization Red Flags
```

The body is one Markdown table:

| 红旗念头 | 停下来做什么 |
| --- | --- |
| `<workflow-specific shortcut thought>` | `<concrete corrective action>` |

The section sits near the workflow's main execution discipline, such as feedback-loop, root-cause, or review-evidence guidance. It should be close enough to shape execution, not buried in release notes or reference indexes.

## Hard Constants

- C1 minimum rows: every table has at least 3 data rows. `spec-code-review` intentionally stays at exactly 3 rows because that skill is already large.
- C2 canonical best-effort statement: every table is followed by this exact sentence:

```text
这是注意力提醒,不是 gate,也不替代 LLM 判断;最终是否停下、如何处理仍由你按当前证据决定。
```

`tests/unit/anti-rationalization-contracts.test.js` enforces only the section heading, scoped table data-row counts, and the C2 sentence. It does not freeze the exact red-flag wording.

## Boundary

The table is attention-hardening prose. It is not a checklist, approval state, mandatory ceremony, or programmatic gate. Scripts may detect whether the source prose still exists; LLMs decide whether a red flag applies in context and what action is warranted.

Good rows are workflow-specific and evidence-shaped:

- `spec-work`: fake completion, skipped validation, broad opportunistic edits, orphaned output.
- `spec-debug`: skipped reproduction, intuition-only root cause, weak post-fix evidence.
- `spec-code-review`: skipped adversarial review, advisory evidence treated as confirmed, unstructured residual risk.

Avoid generic motivation text, copied third-party slogans, or language that implies automatic blocking.
