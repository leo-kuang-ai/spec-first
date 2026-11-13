已按 skill 执行 Step 0 检测，结果为硬性阻断，**未创建任何隔离**，也无任何写入副作用。汇报如下：

## 检测结果（spec-worktree-detect.v1）

```json
{
  "state": "unknown",
  "reason_code": "not-git-repo",
  "worktree_root": null,
  "main_worktree_root": null
}
```

当前目录 `/private/var/folders/0v/.../skill-up-2870695118` **不是 git 仓库**。按 skill 契约，detect 非零退出即停止并上报 reason_code，禁止回退到裸 `git worktree add`，故流程在此终止。

## 两点契约层面的补充发现

1. **caller 身份不被 skill 承认**：该 helper 的 governed caller 仅限 `spec-dogfood` 与 `spec-work`。"PR 审查隔离" 不在列，且 skill 明确规定 "reverse claim 不能单独建立 integration edge"——仅在对话中声明身份不足以构成合法调用方。本次 intake contract 也不完整（缺 allowed setup side effects、environment-copy 授权、return path consumer 三项）。
2. **目标 ref 语义存疑**：PR 审查场景应隔离 PR head（`pr:<number>` 或特性分支），而不是 `main`。即使在一个以 main 为主 checkout 的仓库里执行 `isolate main`，脚本也会返回 `already_checked_out` 而不创建新 worktree。

## 如需继续

- 请先确认正确的 target repo 路径（须为 git 仓库），我可以重新执行 detect；
- 若目的是审查某个 PR，请提供 PR 号或分支名，改用 `isolate pr:<number>` / `isolate <branch>`；
- 若要以新的 governed caller 身份接入，需先在该 caller 的 public owner source 中补齐 forward invocation 与 intake contract。
