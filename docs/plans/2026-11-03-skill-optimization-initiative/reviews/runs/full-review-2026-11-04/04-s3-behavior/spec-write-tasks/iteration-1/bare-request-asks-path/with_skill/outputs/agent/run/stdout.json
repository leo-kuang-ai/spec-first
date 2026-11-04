CLI 可用（`hash` 和 `validate` 子命令都在），后续确定性校验具备条件。但当前工作目录里除了 skill 本身没有任何源计划——`docs/plans/`、`.spec-first/` 都不存在，整个目录只有 `.claude/skills/spec-write-tasks/`。

按 skill 规则，裸拆分请求必须先解析出**唯一一份本地源计划**，解析不到就不能进入 compile 分支，也不能凭空发明范围。需要你提供：

1. **源计划路径**（例如 `docs/plans/xxx.md`），计划需已定稿（`status: active`），包含需求、范围边界、实施单元、验证契约等章节；
2. 如果计划不在当前目录，告诉我它所在的仓库/目录路径。

拿到路径后我会执行完整流程：读取计划 → 计算规范化哈希（`spec-first tasks hash`）→ 拆分任务卡与执行波次 → 生成任务包（`docs/tasks/`）→ `spec-first tasks validate` 确定性校验 → 返回交接信封。

本次运行的决策信封：

```yaml
decision: return-to-plan
reason_code: source_plan_missing
identity_basis: source-plan-path+body-hash
artifact_root: null
repo_root: null
source_plan: null
task_pack: null
task_pack_validity: not-applicable
deterministic_handoff: false
validity_scope: identity-freshness-structure-only
semantic_posture: not-applicable
reason: 工作目录内未解析到任何本地源计划，裸拆分请求无法定位唯一 source plan，等待用户提供计划路径。
dispatch_authorization: not_applicable
validation: null
orientation:
  provider: direct-repo-reads
  posture: bounded
  evidence_refs:
    - "find <artifact-root> -name '*.md' -o -name '*.json' ..." # 仅命中 skill 自身文件
    - "ls <artifact-root>" # 仅 .claude/
  limitations:
    - 工作目录只有 skill 文件，无 docs/plans/ 或 .spec-first/ 下的计划
    - 未执行 spec-first 校验：无可校验的任务包产物
next_action: stop
```

请把源计划的路径发给我，我立即继续。
