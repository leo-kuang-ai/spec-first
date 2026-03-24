---
name: "spec-first:integrate-skill"
description: "Use when an external skill must be assessed and integrated into spec-first governance assets."
version: "1.0.0"
last_updated: "2026-03-25"
user-invocable: true
---

# Skill: integrate-skill

将外部 skill 接入 spec-first 的治理体系。

当前阶段只支持 `report-only` MVP：先解析来源、映射分类、检测冲突、生成报告，再决定是否进入后续 guideline / draft 晋升流程。

## 输入上下文

执行此 skill 时，优先加载以下信息：

| 产物 | 优先级 | 用途 |
|------|--------|------|
| `summary` | 推荐 | 项目概览，帮助判断输出目录和既有治理约定 |
| `entry-guide` | 可选 | 定位当前仓库的命令入口与工作区约定 |
| `conventions` | 可选 | 了解文档、命令和命名风格 |

## 触发条件

- 用户要求集成某个外部 skill
- 需要为外部 skill 生成治理级评估报告
- 需要检查名称、能力、技术栈或 stage 冲突

## Command

- Command: `/spec-first:integrate-skill <skill-name> [options]`

```text
/spec-first:integrate-skill <skill-name> [--source <path>] [--target <guideline|draft|both>] [--report-only] [--allow-missing-source] [--dry-run] [--rename <new-name>] [--yes]
```

## 当前约束

- 只输出 report-only 集成结果
- 不自动晋升为正式 skill
- 不自动修改宿主命令注册
- 任何写入都要先经过冲突检测
- 若通过 CLI 路由执行，必须显式 `--yes`

## 输出

- `docs/reports/skill-integrations/<date>-<skill>.md`

## 推荐流程

1. 解析 source
2. 解析 skill 内容
3. 映射 category / stage
4. 检测冲突
5. 生成 integration report
6. 再根据审查结果决定是否进入下一阶段
