## GATE：流水线在 Step 1 前被阻断

**阻断条件**：`spec-lfg` 依赖的下游 skill 均未在本会话注册。宿主可用 skill 列表中只有 `spec-lfg` 本体（安装在项目 `.claude/skills/spec-lfg/`），而流水线必需的 `spec-plan`（Step 1）、`spec-work`（Step 2/6.5）、`spec-simplify-code`（Step 3）、`spec-code-review`（Step 4）、`spec-test-browser`（Step 6）、`spec-commit-push-pr`（Step 8）全部不在列表中——裸名与命名空间变体都不存在。按 spec-lfg 自身的解析规则，只能对照列表逐字匹配调用，未注册即无法调用。

我只读侦察确认了机器上存在完整配套家族（含上述全部依赖），但都未安装到本环境：
- `/Users/kuang/xiaobu/spec-first/skills/`（完整 spec-first 家族）
- `/Users/kuang/knowledge/.agents/skills/`（同一家族副本）

我不会擅自把这些 skill 拷贝进你的环境再执行——安装 skill 代码不在本次 spec-lfg 准入授权范围内（准入覆盖 commit/push/PR/CI/一次委派评审），且会话中途拷贝通常也不会被宿主注册。

**归属**：环境装配，由你决定。

**恢复路径**（三选一）：
1. **安装后重跑**：把 `/Users/kuang/xiaobu/spec-first/skills/` 中的 `spec-plan`、`spec-work`、`spec-simplify-code`、`spec-code-review`、`spec-test-browser`、`spec-commit-push-pr`（及其共享依赖）拷入 `~/.claude/skills/` 或本项目 `.claude/skills/`，然后新开会话（或重进本会话）再调用 spec-lfg。
2. **授权我代装**：你确认后我把上述 skill 拷入本项目 `.claude/skills/`，若宿主支持中途注册则继续，否则需要你重启会话再跑。
3. **放弃流水线**：不走 spec-lfg，我按常规流程直接实现 `month=YYYY-MM` 过滤（无委派独立评审、不自动 commit/push/PR——这些授权随流水线一起作废）。

**当前状态**：未写任何文件、未提交、工作树未动，无残留副作用。
