# Repository Guidelines

> **⚠️ 关于本项目的 36166 行指令（2026-08-20 测试结论）**
> 
> 45 次行为门测试显示 Claude Sonnet 5 在零指导下正确率 100%（20/20），与加载完整 spec-first 指令的正确率无差异。
> 测试覆盖根因修复、代码复用、安全默认、过度设计判断四个维度。这些指令可能已被模型训练语料内化。
> 
> **建议：先用 baseline（零指导）尝试你的任务。** 只有在模型犯了特定错误（臆测修复、过度设计、忘记读既有代码）时，
> 才加载对应 skill。详见 `benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md`

### Workflow 入口治理
<!-- spec-first:workflow-entry:using-spec-first -->
- 在执行实质性工作前，加载当前宿主已安装的 `using-spec-first` skill；完整入口路由与边界由该 skill 提供。
- 入口硬规则：存在失败、回归、flake、报错或明确修复意图（"修一下"、bug 引用）时必须进入 `spec-debug`，此类信号存在时不得走 Direct Lane；活跃 workflow 执行中出现的失败由该 workflow 反馈回路处理，不触发重新路由，根因超出任务范围时由当前 owner 显式移交 `spec-debug`；用户显式点名 workflow、要求处理 GitHub PR review 反馈、要求一条龙到绿 PR、要求外部技术采用裁决、要求跨会话交接时，必须进入对应入口（`spec-resolve-pr-feedback` / `spec-lfg` / `spec-pov` / `spec-handoff`），不得降级 Direct Lane。
- definition 组判别：从零发散新方向用 `spec-ideate`；已有想法但目标用户或成功标准未定用 `spec-brainstorm`。
