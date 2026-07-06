---
date: 2026-04-01
topic: npm-version-reminder
---

# npm 版本提醒

## Problem Frame

`spec-first` 目前只有本地版本展示和安装后欢迎信息，没有任何“npm 上有新版本”的提醒机制。结果是：用户即使已经安装了旧版本，也不会在后续正常使用 CLI 时自然发现可升级版本，只能靠手动检查或偶然看到发布信息。

这个需求要解决的是“已安装用户如何及时知道有新版本可用”，而不是自动升级或强制升级。目标是把提醒放到最合适、最不打扰的地方：用户真正执行 CLI 命令时提示一次版本差异，帮助他们决定是否升级。

## Requirements

**版本检查触发时机**

- R1. 当用户执行真实 CLI 命令时，`spec-first` 必须检查当前安装版本与 npm 最新发布版本是否一致
- R2. 版本检查不应在 `--help`、`--version` 等纯信息命令中触发
- R3. 版本检查不应阻塞命令执行；无论检查成功、失败或超时，CLI 都必须继续正常完成当前命令

**提醒行为**

- R4. 若发现当前安装版本落后于 npm 最新版本，CLI 必须输出明确的升级提醒，包含当前版本与可升级到的最新版本
- R5. 同一旧版本在每次执行真实命令时都应重复提示，不做静默去重或冷却期
- R6. 若版本检查失败、网络不可用或 npm 端返回异常，CLI 不应向用户展示错误堆栈，也不应打断当前命令

**触发范围**

- R7. 提醒逻辑适用于真实子命令入口，至少覆盖 `init`、`doctor`、`clean`
- R8. 提醒逻辑不改变现有命令语义，不引入自动更新、自动安装或强制退出

## Success Criteria

- 已安装旧版本的用户在执行 `spec-first init`、`spec-first doctor` 或 `spec-first clean` 时能看到升级提醒
- `spec-first --help` 和 `spec-first --version` 保持安静，不额外输出升级提醒
- 网络失败或 npm 查询失败时，CLI 仍能完成原命令，不把版本检查失败当作用户可见错误
- 用户升级到最新版本后，后续真实命令不再提示升级

## Scope Boundaries

- 不实现自动更新或一键升级
- 不要求在所有辅助信息命令中提醒版本更新
- 不要求离线缓存历史版本或做复杂频控
- 不修改现有命令输出的主要语义，只增加非阻塞提醒

## Key Decisions

- **触发点选择为真实命令**：把提醒放在 `init`、`doctor`、`clean` 这类真正执行工作的入口，避免干扰 `--help` / `--version`
- **每次都提示旧版本**：不做一次性提醒或冷却期，保证旧版本用户每次使用都能看到升级信号
- **失败静默**：版本检查只是辅助信息，不应成为 CLI 可用性的风险点

## Dependencies / Assumptions

- npm registry 可作为最新版本的权威来源
- 当前项目已存在稳定的 CLI 入口分流，方便把提醒逻辑放在真实命令路径上

## Outstanding Questions

### Deferred to Planning

- [Affects R1, R4][Technical] 版本检查应在每个命令启动前执行，还是在命令输出前异步插入提醒，以尽量降低感知延迟？
- [Affects R4][Technical] 提醒文案是否需要包含精确升级命令示例，例如 `npm install -g spec-first`？

## Next Steps

→ `spec-plan` for structured implementation planning
