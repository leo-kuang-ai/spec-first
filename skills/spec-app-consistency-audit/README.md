# spec-app-consistency-audit

`spec-app-consistency-audit` 当前是 opt-in App Assurance Compiler Trial。它在 build、模拟器和真机前，把一个 changed feature 的关键 journey 从本地 PRD、已物化 Figma、源码和平台 ownership 事实编译为 Behavior IR、proof obligations、candidate counterexamples、evidence-adjudicated findings 与 verification plan。

U0 在相同合成样本、证据 allowance 和预算下比较了 direct App lens 与 disposable IR thin slice，并经独立盲审得到 `ir_go`，因此允许继续实现 durable Trial。这个结论只证明“值得继续实验”，不证明默认路径成熟、普遍优于 Code Review 或已经产生 field outcome。

## 当前公共合同

- 入口保持独立，不并入 `spec-code-review`。
- 当前可执行主路径是 `mode:headless base:<ref>`；没有 base 就 fail closed。
- 只处理 KMP、Android、iOS changed-feature critical journeys，不构建全 App knowledge graph。
- 生命周期是 `prepare → host-owned semantic stage → finalize`；`abort` 负责同等 cleanup。
- Runner 只准备/校验确定性 facts，不调用模型或生成语义 verdict。
- 无 semantic stage 时记录 `issue_synthesis_status:not_run`，空 issues 不是通过。
- 无本地 materialized Figma 时 design alignment 为 `not_evaluable`。
- 不执行 build/test/simulator/device，不修改产品代码。
- Trial 没有默认 Code Review consumer；任何集成都等待 U8 owner verdict。

## 快速入口

```bash
node skills/spec-app-consistency-audit/scripts/run-audit.js \
  phase:prepare mode:headless base:main run-id:<run-id> source:app

# 宿主在 <run-dir>/input/ 写入受约束的 ephemeral semantic artifacts

node skills/spec-app-consistency-audit/scripts/run-audit.js \
  phase:finalize mode:headless base:main run-id:<run-id> source:app \
  --issue-synthesis-status llm_provided
```

同一 run 的 base、source、PRD/Figma materialization 和 run ID 必须保持一致。Finalize 会重新检查 freshness，并在成功或失败 closeout 时清理 `input/`。宿主 transcript 不在 cleanup 权限范围内。

## Artifact spine

```text
metadata/preflight/contracts/context
→ app-behavior-model.json
→ proof-obligations.json
→ counterexamples.json
→ issues.json
→ verification-plan.json
→ audit-report.json
→ artifact-manifest.json / headless-envelope.txt
```

IR/counterexamples 是 generated/advisory；obligation 按 item 保留 authority；verification plan 是生成的待执行计划，不是 confirmed evidence。

## 维护导航

- [`SKILL.md`](./SKILL.md)：公共 Trial hot path、路由、阶段、authority 和 stop conditions。
- [`references/headless-runner.md`](./references/headless-runner.md)：runner/receipt/cleanup。
- [`references/app-behavior-model.md`](./references/app-behavior-model.md)：Behavior IR。
- [`references/proof-and-counterexample-method.md`](./references/proof-and-counterexample-method.md)：proof/counterexample。
- [`references/report-format.md`](./references/report-format.md)：journey report。
- [`references/verification-ladder.md`](./references/verification-ladder.md)：verification kind×environment matrix。
- [`references/pilot-validation.md`](./references/pilot-validation.md)：U8 promotion evidence。

`evals/` 是 maintainer-only source evidence，不属于普通 runtime hot path。Source 改动完成后由主线单独决定是否运行 `spec-first init`；不要手改 generated mirrors。
