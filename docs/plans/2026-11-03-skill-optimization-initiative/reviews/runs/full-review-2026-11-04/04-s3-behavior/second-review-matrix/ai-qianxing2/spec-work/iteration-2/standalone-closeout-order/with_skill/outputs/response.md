```json
{
  "status": "blocked",
  "summary": "已仅将 README.md 中的 Known rough edges 替换为 Known limitations；本地检查通过，但结构化收尾失败，不能声明整体 verified。",
  "changed_files": ["README.md"],
  "verification": [
    {
      "id": "readme-exact",
      "ran": true,
      "exit_code": 0,
      "result": "精确替换符合预期，已跟踪文件仅 README.md 有变更"
    },
    {
      "id": "diff-check",
      "ran": true,
      "exit_code": 0
    }
  ],
  "verification_run_summary_ref": null,
  "verification_run_summary_result": {
    "status": "rejected",
    "reason_code": "run-summary-schema-invalid",
    "errors": [
      "root.checks[0].command: expected string length at most 500, received 666"
    ]
  },
  "honest_closeout_verdict": {
    "overall": "unsupported",
    "overall_reason_code": "unsupported-claim",
    "claims": [
      {
        "claim_type": "validation",
        "asserted_status": "passed",
        "verdict": "unsupported",
        "reason_code": "run-summary-not-provided"
      }
    ]
  },
  "run_artifact_path": null,
  "run_artifact_reason_code": "no-trigger-matched",
  "claim_limitations": [
    "真实验证命令超过摘要 schema 的 500 字符上限；保留原始命令，未缩写或改写证据。",
    "验证输出为 transcribed，不声明 provider-confirmed。",
    "验证配置返回 not-configured / verification-scripts-missing；本次采用精确内容检查及 git diff --check。",
    "证据目录未被 gitignore 覆盖，保留为未跟踪的 .spec-first/。",
    "所需证明意图已由实际检查覆盖，但摘要记录失败导致结构化收尾受阻。"
  ],
  "review": "机械文字替换，跳过专项审查及 simplify；无已发现的可操作残留。",
  "plan_lifecycle": "不适用：本次为明确的单文件请求，未修改计划。",
  "authorization": {
    "task_commit": "未授权，未执行",
    "landing": "未授权，未执行",
    "changes": "保留为未提交修改"
  },
  "recovery_path": "如需完成结构化收尾，另行执行较短的等价验证命令并记录其真实结果；不得把本次长命令改写成未执行过的命令。",
  "post_deploy_monitoring_and_validation": "无需额外运行监控：仅修改 README 文字，无运行时影响。"
}
```
