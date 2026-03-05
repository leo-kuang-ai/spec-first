---
name: "spec-first:init"
description: "定位项目根目录并初始化 Feature 工作区"
version: 1.0.0
last_updated: {{DATE}}
changelog: Initial version with standardized metadata
---

# Skill: init

初始化 Feature 工作区，收集参数并生成阶段状态文件。

## 触发条件
- 阶段: 任意（通常在 `00_init` 之前）
- Command: `/spec-first:init`（无参数，引导式交互）

## 原则
- `spec-first init` 默认只做项目内初始化；仅在显式 `--bootstrap` 时执行宿主 Preflight（MCP + skills 检查/自动修复）。
- 日常建议将宿主自修复放在 `spec-first update`，Skill 不应重复手工执行宿主安装脚本；仅在 CLI 返回错误时展示修复建议。

## 执行阶段
- P0: 定位项目根目录，确认为目标仓库；校验 `00-first` 已完成（`docs/first/.index.yaml` + quick 核心产物）
- P1: 读取 `.spec-first/layer2/*.yaml` 平台模板（仅文件名，不读宿主名）
- P2: 收集初始化参数（`feat/mode/size/platforms/title/feature-id`）
- P3: 参数确认（必须先过约束再确认）
- P4: 执行 `spec-first init ...`
- P5: 执行 `spec-first stage current <featureId>` 验证阶段，输出摘要（featureId、目录、平台、hooks/AI hooks/Skill 命令状态；仅显式 `--bootstrap` 时包含 bootstrap 状态）

## 00-first 前置检查（强制）
- 必须存在目录：`docs/first/`
- 必须存在索引：`docs/first/.index.yaml`
- quick 核心产物至少包含：
  - `docs/first/tech-stack.md`
  - `docs/first/codebase-overview.md`
  - `docs/first/domain-model.md`
  - `docs/first/api-docs.md`
- 若缺失任一项，必须中止并提示先执行 `/spec-first:first`
- 同时检查项目初始化文件状态（用于提示）：`.spec-first/`、`.spec-first/layer2/`、`.spec-first/meta/config.yaml`

## 参数约束（强制）
- `feat` 必须匹配：`^[A-Z][A-Z0-9]{0,15}$`
  - 示例：`AUTH`、`REPORT`、`URPT`
  - 禁止：`user-report`、`report_v2`、中文
- `platforms` 必须来自 `.spec-first/layer2/*.yaml` 文件名
  - 例如存在 `h5.yaml`、`java-backend.yaml`，则仅可选 `h5,java-backend`
  - CLI 会对 `platforms` 自动去重并稳定排序；若输入重复值，CLI 会给出警告提示
  - 禁止把宿主/工具名当平台：`claude-code`、`codex`、`mcp`
- 当 `.spec-first/layer2/` 不存在或为空时，必须中止并提示先创建平台 YAML，再继续 init

## CLI 依赖
- `spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>] [--title <title>] [--bootstrap]`
- `spec-first stage current <featureId>`
- CLI 可用性探测建议：`command -v spec-first >/dev/null && spec-first --help >/dev/null`
- `spec-first --version` 为合法探测路径，可作为补充诊断信息

## 输出路径
- `specs/{featureId}/stage-state.json`
- `specs/{featureId}/constitution.md`
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/findings.md`
- `specs/{featureId}/task_plan.md`
- `specs/.feat-registry.md`
- `.spec-first/current`
- `.spec-first/meta/config.yaml`（缺失时补齐）
- `.claude/settings.json`（缺失时补齐）

## 确认策略
- 推荐: strict

## 成功标准
- CLI init 成功退出（exit code = 0）
- 生成目录 `specs/{featureId}/`
- 新建场景：`stage-state.json` 存在且阶段为 `00_init`
- 幂等场景：不重置既有阶段状态，且 `.spec-first/current` 已修复指向目标 featureId
- `.spec-first/meta/config.yaml` 存在（若缺失则已补齐）
- `.claude/settings.json` 存在（若缺失则已补齐）
- 非阻断副作用（允许告警但不影响 init 成功）：
  - Skill 命令刷新（`.claude/commands/spec-first/*.md`）
  - 若为 Git 仓库：hooks 安装/更新（`prepare-commit-msg`、`commit-msg`、`pre-push`、`pre-commit`）
  - AI Runtime Hooks 注册
