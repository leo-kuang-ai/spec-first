# Skill: init

## Trigger
- Stage: any (typically before `00_init`)
- Command: `/spec-first:init` (no args, guided interaction)

## Principle
- `spec-first init` 已内置 Preflight Bootstrap（MCP + skills 检查/自动修复）。
- Skill 不应重复手工执行宿主安装脚本；仅在 CLI 返回错误时展示修复建议。

## Phases
- P0: 定位项目根目录，确认为目标仓库
- P1: 读取 `.spec-first/layer2/*.yaml` 平台模板（仅文件名，不读宿主名）
- P2: 收集初始化参数（`feat/mode/size/platforms/title/feature-id`）
- P3: 参数确认（必须先过约束再确认）
- P4: 执行 `spec-first init ...`
- P5: 执行 `spec-first stage current <featureId>` 验证阶段
- P6: 输出摘要（featureId、目录、平台、bootstrap 与 hooks 状态）

## Parameter Constraints (Mandatory)
- `feat` 必须匹配：`^[A-Z][A-Z0-9]{0,15}$`
  - 示例：`AUTH`、`REPORT`、`URPT`
  - 禁止：`user-report`、`report_v2`、中文
- `platforms` 必须来自 `.spec-first/layer2/*.yaml` 文件名
  - 例如存在 `h5.yaml`、`java-backend.yaml`，则仅可选 `h5,java-backend`
  - 禁止把宿主/工具名当平台：`claude-code`、`codex`、`mcp`
- 当 `.spec-first/layer2/` 不存在或为空时，必须中止并提示先创建平台 YAML，再继续 init

## CLI Dependencies
- `spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>] [--title <title>]`
- `spec-first stage current <featureId>`
- CLI 可用性探测使用：`command -v spec-first >/dev/null && spec-first --help >/dev/null`
- 禁止使用：`which spec-first && spec-first --version || echo CLI_NOT_FOUND`（`--version` 失败会误判为未安装）

## Output Paths
- `specs/{featureId}/stage-state.json`
- `specs/{featureId}/constitution.md`
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/progress.md`
- `specs/{featureId}/findings.md`
- `specs/{featureId}/task_plan.md`
- `specs/.feat-registry.md`
- `.spec-first/current`

## confirm_policy
- Recommended: strict

## Success Criteria
- CLI init 成功退出（exit code = 0）
- 生成目录 `specs/{featureId}/`
- `stage-state.json` 存在且阶段为 `00_init`
- `.spec-first/current` 指向新 featureId
- `.claude/commands/spec-first/*.md` 入口文件已刷新
- 若为 Git 仓库：hooks 已安装/更新（`prepare-commit-msg`、`commit-msg`、`pre-push`、`pre-commit`）
