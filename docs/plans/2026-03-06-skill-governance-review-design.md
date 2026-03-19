# Skill Governance Review Design

**Date:** 2026-03-06
**Scope:** `skills/spec-first/*`, skill runtime, stage governance, skill asset quality

## Goal

在开发期直接收紧 `spec-first` 技能体系，确保：

1. 全链路阶段流转与 skill 入口约束一致。
2. stage-bound skills 不能脱离当前阶段执行。
3. 每个 skill 的资产质量可被自动验证，而不是依赖人工记忆。

## Current Problems

1. `SKILL.md` 文档声明的阶段要求与 runtime hard-gate 不一致。
2. 个别 skill 资产存在质量缺口，例如命令声明缺失、参考文件路径错误。
3. 目前缺少一组覆盖全 skill catalog 的自动化校验，导致文档漂移不易被发现。

## Design Decisions

### 1. Runtime 以“文档声明可执行”为准

对所有明确绑定阶段的核心 skills 建立 hard-gate：

- `spec` → `01_specify`
- `spec-review` → `01_specify`
- `design` / `research` → `02_design`
- `task` → `03_plan`
- `code` / `code-review` → `04_implement`
- `test` / `verify` → `05_verify`
- `archive` → `06_wrap_up`

不绑定阶段的工具类 skill 继续保持免 stage-gate，但允许保留上下文校验。

### 2. Skill 资产按“可发现、可引用、可流转”校验

每个正式 skill 至少满足：

- front matter 合法
- 命令入口声明存在，或明确标记为非命令型 utility
- 本地引用路径真实存在
- 若为 stage-bound skill，则必须在 runtime hard-gate 中有映射

### 3. 先修治理缺口，再修文档缺口

优先级：

1. runtime hard-gate 覆盖不完整
2. `SKILL.md` 中会误导执行或破坏 discoverability 的问题
3. 自动化测试补齐，防止回归

## Non-Goals

- 本轮不重写所有 skill 文案风格
- 本轮不引入新的流程阶段
- 本轮不做平台 capability check 扩展

## Verification

新增或更新测试覆盖：

- hard-gate: 新增 stage-bound skills 的阻断测试
- skill catalog: front matter / command / references / hard-gate mapping 一致性测试
- 现有 skill runtime 测试回归
