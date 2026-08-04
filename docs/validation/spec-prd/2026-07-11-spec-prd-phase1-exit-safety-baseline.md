---
schema_version: spec-prd-phase1-exit-safety-baseline/v1
artifact_type: confirmed
producer: spec-work/U1
freshness: 2026-07-11T15:59:36+08:00
authority_level: confirmed-current-source
reason_code: phase1_p0_reproduced
consumer: spec-prd-phase1-exit-safety
source_revision: a574194b13ee3e53e1d7cd36bbfc86ac058db0cc
---

# spec-prd Phase 1 Exit Safety Baseline

## 结论

当前 source 可复现计划列出的四类 P0：组合模板产生两个 canonical `Outstanding Questions` section；ready intent 缺 machine receipt 时 `--check-only` 仍允许 closeout；缺少 `Summary`、`Requirements` 或 `Acceptance Examples` 时 final intent 仍可 finalize；`validate` 与 `refine` 共用“诊断后重写”合同，未形成 report-only mutation boundary。

本记录只确认确定性出口与当前 source prose 的事实，不声称 PRD 产品质量、owner answer 真实性或模型语义质量已被验证。

## Baseline Identity

- Git revision：`a574194b13ee3e53e1d7cd36bbfc86ac058db0cc`
- Node：`v22.22.3`
- 支持宿主：`claude,codex,cursor,kiro,qoder`
- 生产 source 状态：下表文件与 HEAD 一致；工作树另有用户拥有的计划 / Changelog 改动和本单元新增测试，不作为 baseline production source。
- Hook capability：Claude 与 Qoder 有 managed hook source；Codex、Cursor、Kiro 当前没有同等 PRD ready-field hard hook，本记录不把 prose discipline 描述为硬强制。

| Source | SHA-256 |
| --- | --- |
| `skills/spec-prd/SKILL.md` | `acbffeea62d143a420555c14242b3f36ad6f1625e0b01eac7e0c0374a94e21bf` |
| `skills/spec-prd/assets/templates/00-generic.md` | `d7e805a1b8add1a3fac8fa02ed750c9cd9315fabf2b8e24f08d4f62088e85489` |
| `skills/spec-prd/references/prd-output-template.md` | `6d5878aad7e0d28c78984bca197a52cab0f5b423f288c5c18d119d98931246c9` |
| `skills/spec-prd/references/prd-readiness-lens.md` | `98a9f0b6c0c594c1f6e59cc8902adfb5c6d862358b1107f3382af38e43a63579` |
| `skills/spec-prd/scripts/check-prd-artifact.js` | `13981af3cb3adf0695c67883fb5eeebdde2cf27ab77c67f6c44b9aa5d498860e` |
| `skills/spec-prd/scripts/finalize-prd-artifact.js` | `acc2c4b41013c82023b7bd660528cbe317f5043dfa6fabc5efd14c7a702df181` |
| `skills/spec-prd/scripts/lib/reason-codes.js` | `0b68e0738cddb464e40e2463daf56470317830a64f7ab264807fd97d2753a206` |
| `templates/claude/hooks/prd-prewrite-guard` | `b60c665b0b04fd53ef8a80a79b865525b991c56676c3ae52a3079d9eee221847` |
| `templates/claude/hooks/prd-readiness-guard` | `e41ddced3e49bb0db636c60fe62930ae39b9f25e32d161c928bda98eca7d2f7b` |
| `templates/qoder/hooks/prd-prewrite-guard` | `d17ab17ba284b91f2976c9b0020f4d50132bb71f04baed83c33dc36bded29611` |
| `templates/qoder/hooks/prd-readiness-guard` | `8d504cb6216565e4f2244b768e2efa2f6810f16d5db15dd395e4a4debf7d9236` |

## Reproduction

命令：

```bash
npx jest --runTestsByPath tests/unit/spec-prd-exit-safety.test.js --runInBand
```

首次运行结果：`1 failed suite / 6 failed tests`。这些失败是 U1 预期红探针，不是验证通过。

| P0 | 输入 | 当前实际结果 | 预期安全结果 | Baseline reason |
| --- | --- | --- | --- | --- |
| Duplicate OQ | 组合 `assets/templates/00-generic.md` 与 `references/prd-output-template.md` | 匹配到 `2` 个 `## Outstanding Questions` headings | 只有 output contract 拥有一个 canonical machine schema | `duplicate_oq_schema_reproduced` |
| Ready / receipt fail-open | `status: draft` + `write_mode: final-prd` + `can_enter_spec_plan: yes`，receipt 缺失，`checkOnly=true` | checker 能看到 `ready_receipt_absent`，但 finalize 返回 `can_finalize=true`、`should_block_closeout=false`，`blocking_reason_codes=[]` | check-only 必须阻断；写模式仍应能原子补 receipt | `ready_intent_missing_receipt_fail_open` |
| Core floor fail-open | 分别删除 `Summary`、`Requirements`、`Acceptance Examples` 后执行 final intent check-only | checker 仅产生 advisory `template_structure_hint`（Acceptance 删除还会产生 `requirement_without_acceptance_ref`）；三个变体均 `can_finalize=true` | final/ready/finalize claim 必须以确定性 core reason code 阻断；checkpoint 仍可不完整 | `core_section_finalize_fail_open` |
| Validate mutation ambiguity | `validate` 现有 PRD，明确要求零写入；输入带远程 Figma URL 且 provider 不可用 | `prd-output-template.md` 把 `refine or validate` 合并为 diagnose-before-rewrite，随后要求 `produce the final rewritten PRD` | validate 必须 report-only，只允许 checker/finalizer check-only，不 rewrite/finalize/materialize design output | `validate_report_only_boundary_absent` |

### Validate fresh-source evidence

一个全新只读 generic reviewer 直接读取当前磁盘 source、未调用缓存 typed skill，得到以下结果：

- 严格 report-only：否（置信度 `0.99`）。
- rewrite PRD 可达：是；`skills/spec-prd/SKILL.md:293-297` 与 `skills/spec-prd/references/prd-output-template.md:301-316` 都把 validate 带入 rewrite。
- finalize 写路径可达：是；`skills/spec-prd/SKILL.md:303-321` 与 `skills/spec-prd/references/prd-readiness-lens.md:33-39` 未把 validate 固定为 `--check-only`。
- provider 不可用时远程 Figma materialization：当前 source 倾向不发生，并会记录 degraded/unread residue；证据为 `skills/spec-prd/references/design-source-evidence.md:16-33`、`:49-59`、`:96-106`。但缺少精确的 validate 禁止 screenshot/JSON 持久化边界，仍由 U4 补齐。

Reviewer 未修改文件、未运行 runtime generation。

## Limitations

- Duplicate、receipt 与 core-floor 由当前脚本 / 模板聚焦测试直接复现，属于 confirmed deterministic evidence。
- Validate 项已由 source contract、聚焦测试和 fresh-source read-only evaluator 共同确认；U4 仍需用 mutation sentinel 验证修复后的零写入行为。
- 未运行 `spec-first init`，未检查任何 generated runtime mirror；U5 才验证五宿主临时投射与 drift。
- 未执行真实 PRD outcome eval；fixture、字符串检查和本记录不能支持 Contract Reset rollout，Gate A 仍须独立完成。
