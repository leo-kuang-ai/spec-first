{
  "mode": "pipeline-return",
  "status": "blocked",
  "blocker": {
    "kind": "skill-invocation-disabled",
    "message": "目标技能禁止通过 Skill 工具调用，工具同时禁止绕过调用限制复现其工作流，因此未生成经该技能契约验证的返回结果。",
    "next_step": "请直接运行 /spec-resolve-pr-feedback mode:pipeline-return。"
  },
  "evidence": {
    "kind": "fixture-only",
    "source": "pr-snapshot.json",
    "limitation": "仅为离线夹具中的模拟提供方证据；未联系真实提供方，不代表真实远端状态。"
  },
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
    "updated_at": "2026-10-29T00:00:00Z",
    "last_comment_id": "C12"
  },
  "thread_id": "T1",
  "root_comment_id": 11,
  "verdict": "not-addressing",
  "reason": "持久化存储不属于已确定的内存演示范围。",
  "observed_reply": {
    "id": 12,
    "url": "https://github.fixture.invalid/upstream/project/pull/42#discussion_r12",
    "body": "> Please introduce persistent storage in this small in-memory demo.\n\nNot addressing: persistence is outside the settled in-memory demo scope.",
    "submitted": true,
    "visible": true,
    "observed_at": "2026-10-29T00:01:00Z"
  },
  "conversation": {
    "pending_review": null,
    "thread_resolved": false,
    "additional_reply_needed": false,
    "remaining_conditions": [
      "夹具显示现有回复已提交且可见，与既定的不处理结论一致，无须追加回复。",
      "讨论线程仍然开放；缺少线程解决授权，保持开放，不宣称讨论已闭环。"
    ]
  },
  "authority": {
    "local_fix": false,
    "commit": false,
    "landing": false,
    "reply": false,
    "thread_resolution": false,
    "worker_dispatch": false
  },
  "execution": {
    "preparation_runs": 1,
    "fixture_baseline_commit": "3444bf1",
    "code_changes": false,
    "additional_commits": false,
    "provider_contacted": false,
    "reply_posted": false,
    "thread_resolved": false,
    "workers_dispatched": false,
    "source_files_and_post_preparation_git_state_preserved": true
  }
}
