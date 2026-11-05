```json
{
  "mode": "pipeline-return",
  "evidence_kind": "fixture-only",
  "evidence_limitation": "pr-snapshot.json 为离线 fixture 模拟的 provider 证据，未联系真实 provider，不代表真实远端状态",
  "pr": {
    "host": "github.fixture.invalid",
    "base_repo": "upstream/project",
    "number": 42,
    "url": "https://github.fixture.invalid/upstream/project/pull/42",
    "head_repo": "fork/project",
    "head_ref": "fix/review",
    "head_sha": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  },
  "source": {
    "kind": "thread",
    "id": "T1",
    "url": "https://github.fixture.invalid/upstream/project/pull/42#discussion_r11",
    "root_comment_id": 11,
    "body": "Please introduce persistent storage in this small in-memory demo.",
    "updated_at": "2026-10-29T00:00:00Z",
    "last_comment_id": "C12"
  },
  "reply": {
    "id": 12,
    "url": "https://github.fixture.invalid/upstream/project/pull/42#discussion_r12",
    "submitted": true,
    "visible": true,
    "observed_at": "2026-10-29T00:01:00Z"
  },
  "verdict": "not-addressing",
  "reason": "Persistent storage is outside the settled in-memory demo scope.",
  "remaining_conversation_conditions": {
    "thread_resolved": false,
    "thread_id": "T1",
    "pending_review": null
  },
  "actions_taken": [
    "运行 node prepare-eval.cjs 一次，生成 fixture baseline 提交 a40104f",
    "读取 pr-snapshot.json 作为模拟 provider 证据并保留 fixture-only 限定",
    "核对 git 状态：除 fixture baseline 提交和原有 .claude/ 未跟踪目录外无变更"
  ],
  "actions_not_taken": [
    "本地修复",
    "新提交",
    "落地/合并",
    "新增回复",
    "线程 resolve",
    "worker 分发",
    "联系真实 provider"
  ],
  "missing_authority": [
    "local-fix",
    "commit",
    "landing",
    "reply",
    "thread-resolution",
    "worker-dispatch"
  ],
  "git_state_after": "fixture baseline 提交 a40104f 已存在；源文件与其余 git 状态保持原样"
}
```
