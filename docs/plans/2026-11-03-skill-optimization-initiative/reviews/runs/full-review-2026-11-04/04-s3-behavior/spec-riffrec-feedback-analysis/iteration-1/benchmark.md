# Skill Benchmark: spec-riffrec-feedback-analysis

**Date**: 2026-11-04T12:17:58Z
**Evals**: Check local evidence, 通用音频转写请求不应触发 Riffrec 分析 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 50% ± 50% |

## Per-Case Results

### Check local evidence (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-riffrec-feedback-analysis/evals/fixtures/scripts/check-local-evidence.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ {
+   events: {
+     analyzed: '1/1（全部本地事件）',
+     detail: '1 × console_error，消息 "checkout failed"，t=5s；moment M1（event_moments 与 moments 均为 1，未截断）'
+   },
+   findings: {
+     F1: '事件存在已确认；产品影响未知，未经 owner 晋升不得转为需求',
+     candidates: 1
+   },
+   frames: {
+     extracted: 0,
+     human_visual_review: 'not performed（无可检视帧）',
+     reason: 'no video source（M1 screenshot_status）'
+   },
+   requirements: {
+     confirmed: 0,
+     kickoff_r_ids: 'R1/R2 为通用证据处理脚手架，非本 capture 的产品需求，按指示视为 unconfirmed'
+   },
+   session: {
+     analysis_batch_id: '20261104T121712Z-16f74fff',
+     duration_seconds: 10,
+     source_kind: 'riffrec_directory',
+     source_sha256: '54fcf89d081333b04ac2debac348cda1a5e55f562d882e79e00b5223c259b825'
+   },
+   source_mapping: 'not_applicable（工作区无产品源码）',
+   transcript: {
+     egress_authorization: 'missing',
+     missing_intervals: 'unknown（不可用于主张无问题）',
+     provider: 'openai-audio-transcriptions',
+     provider_request_sent: false,
+     status: 'skipped'
+   },
+   workflow_dispatch: {
+     execution: 'inline/serial',
+     fallback_reason: 'dispatch_authorization_missing',
+     worker_dispatch_authorization: 'missing'
+   }
+ }
- 'events-only'

    at [stdin]:206:8
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3)
    at node:internal/main/eval_stdin:53:5
    at ReadStream.<anonymous> (node:internal/process/execution:201:5)
    at ReadStream.emit (node:events:519:28) {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: {
    session: {
      duration_seconds: 10,
      source_kind: 'riffrec_directory',
      analysis_batch_id: '20261104T121712Z-16f74fff',
      source_sha256: '54fcf89d081333b04ac2debac348cda1a5e55f562d882e79e00b5223c259b825'
    },
    events: {
      analyzed: '1/1（全部本地事件）',
      detail: '1 × console_error，消息 "checkout failed"，t=5s；moment M1（event_moments 与 moments 均为 1，未截断）'
    },
    transcript: {
      status: 'skipped',
      egress_authorization: 'missing',
      provider: 'openai-audio-transcriptions',
      provider_request_sent: false,
      missing_intervals: 'unknown（不可用于主张无问题）'
    },
    frames: {
      extracted: 0,
      reason: 'no video source（M1 screenshot_status）',
      human_visual_review: 'not performed（无可检视帧）'
    },
    findings: { candidates: 1, F1: '事件存在已确认；产品影响未知，未经 owner 晋升不得转为需求' },
    requirements: {
      kickoff_r_ids: 'R1/R2 为通用证据处理脚手架，非本 capture 的产品需求，按指示视为 unconfirmed',
      confirmed: 0
    },
    source_mapping: 'not_applicable（工作区无产品源码）',
    workflow_dispatch: {
      worker_dispatch_authorization: 'missing',
      execution: 'inline/serial',
      fallback_reason: 'dispatch_authorization_missing'
    }
  },
  expected: 'events-only',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

### 通用音频转写请求不应触发 Riffrec 分析 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-riffrec-feedback-analysis/evals/fixtures/scripts/check-generic-refused.sh | ✅ | script passed (exit code 0) |

