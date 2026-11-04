输入分类完成，但这次运行无法进入编译分支，先说结论：

**这个请求被 `spec-write-tasks` 的输入契约拒绝了，而且 URL 本身也探测不到。**

两 个独立的问题：

1. **远程仓库不是合法输入。** 该 skill 的契约明确要求输入必须是本地、source-owned 的 spec-plan 计划（`Inputs must stay local and source-owned; remote repos ... are rejected`）。它只编译已经落在本地的计划文档，不会去拉取、解析远程仓库里的材料。
2. **该 URL 实际不可访问。** 我探测了 `https://github.com/someone/their-ledger`，GitHub API 返回 `404`——要么仓库不存在（`someone/their-ledger` 看起来像占位符，请确认你朋友的真实仓库地址），要么是私有仓库（GitHub 对无权限访问的私有仓库同样返回 404）。

## 要继续的话，需要你做两件事

1. **给我真实仓库地址，并把它 clone 到本地**（或至少把里面的计划文档放到本地某个目录）。
2. **确认里面的计划是 spec-plan 产物**：带 frontmatter、`status: active`（非 `active` 的历史计划不能编译成可执行任务包）、明确的范围/验收标准/仓库归属。拿到本地路径后我就能按正常流程编译任务包。

如果那边的计划不是 spec-plan 格式，正确的路径是先走 `spec-plan` 把它整理成合格计划，再回来拆任务。

## Final Decision Envelope

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
reason: 输入是远程 GitHub 仓库 URL（契约拒绝远程输入），且该 URL 经探测返回 404，无法解析到任何本地 source plan。
dispatch_authorization: not_applicable
validation: null
orientation:
  provider: skipped
  posture: unavailable
  evidence_refs: []
  limitations:
    - remote-repo-input-rejected-by-contract
    - github-url-returned-404
next_action: revise-plan
```

`validation: null` 是按契约如实报告：没有本地计划或任务包可运行 `spec-first tasks validate`，不虚构确定性验证结果。拿到本地计划路径后随时继续。
