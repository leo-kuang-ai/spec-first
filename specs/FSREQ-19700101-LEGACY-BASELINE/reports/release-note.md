# Release Note — FSREQ-19700101-LEGACY-BASELINE

> **版本**: 1.0.0
> **发布时间**: 2026-03-24T23:37:24Z
> **负责人**: Codex

## 变更摘要

建立“存量系统可分析基线”的完整基线包，覆盖 PRD、spec、design、task plan、findings、verify、wrap-up 与 release 证据链，并完成宿主安装态与外部边界纳入。

## 影响范围

- **平台**: node, web
- **模块**: CLI, Core, Skill Runtime, Template, Host Integration, Batch Executor, Metrics, AI Orchestrator

## 变更列表

- [doc] 完成 `prd.md`、`spec.md`、`design.md`、`task_plan.md`、`findings.md` 的连续收口
- [doc] 生成 `verify.md`、`wrap_up.md`、`retro.md`
- [doc] `document-links.yaml` 纳入 `findings.md` 并完成本地结构校验
- [doc] 宿主安装态、命令注册、同步结果与外部边界纳入正式范围
- [doc] `skills/` 目录扁平化，去除 `skills/spec-first` 命名空间层级

## 已知问题

- `runtime 真源` 仍为 `missing`
- `docs 输出` 仍为 `missing`
- 当前 CLI 未暴露 `spec-first gate check` 与 `spec-first docs links validate` 子命令，验证阶段使用本地替代检查
