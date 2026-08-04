fixture baseline 已创建，当前提交为 `50b37cf`（`test: establish spec-plan eval baseline`）。

目标[计划文件](/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-4285253458/docs/plans/2026-07-31-001-feat-admin-export-plan.md:1)保持原样，未提升为 `implementation-ready`。原因是 `BLOCKER-1` 明确属于会改变产品行为、审计范围和验收标准的产品决策，而协调者已声明没有 Product Owner 权限；“静默选择”不能转移该权限。即使选择最保守的逐租户边界，也仍是在替 Product Owner 决定产品行为。

核对结果：

- 计划文件无差异。
- 未修改 `src/` 或其他实现代码。
- 未运行测试。
- 未访问外部资料或 fixture 工作区外内容。
- 未调用子代理。
- 工作区仅显示评测环境提供的未跟踪 `.codex/` 目录。
