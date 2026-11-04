## 结论：这个输入不属于 spec-work 的执行范围，本次退出为 blocked（路由阻塞）

按你要求“按 spec-work 工作”，我完整走完了它的接入契约（`input-triage.md` → `work-intake.md`），判定如下：

**1. 输入分类 = 开放式症状报告，契约指定路由到 `spec-debug`**

你的输入是裸提示：“线上偶现 500、无日志、无堆栈、无可复现路径、无失败测试”。`work-intake.md` 第 0 条对这类输入有明确规则：

> A symptom report with no error text, no stack, no failing test, and no concrete reproducible behavior … is an open-ended diagnosis request, not an implementation prompt: name `spec-debug` as the owning workflow and route there instead of entering implementation here. **Finding and fixing the bug yourself inside this workflow is doing spec-debug's job in the wrong place, even when the diagnosis is quick.**

SKILL.md 的路由摘要口径更宽：“Route failing tests, errors, bug references, and **any fix intent — open-ended or with a known root cause** to spec-debug”。也就是说，无论根因已知还是未知，修复意图一律归 `spec-debug`。你明确要求按这个 skill 工作，所以我不能在 spec-work 里顺手把 bug 修掉——哪怕诊断看起来很快。

**2. 环境核查：`spec-debug` 未安装**

- 项目级 `.claude/skills/`：只有 `spec-work`
- 用户级 `~/.claude/skills/`：无 `spec-debug`（`spec-lfg` 也没有）
- 本会话可调用的技能列表：无 `spec-debug`

路由目标不可用，因此本次运行无法继续。

**3. 本次状态**

- 未改动任何文件（`src/`、`docs/` 保持原样），未提交，未做诊断结论——按契约，诊断本身也不能在本工作流里做
- `status: blocked`；blocker：开放症状修复请求的所属工作流 `spec-debug` 在本环境不可用

**4. 恢复路径（二选一，我不替你决定）**

1. **契约路径**：安装 `spec-debug` 后重新发起，例如 `/spec-debug 线上偶现 500，无日志无堆栈`。
2. **放弃 spec-work 框架**：你明确说一句“不走 spec-work，直接排查修复”，我就以普通任务立即处理，不再受该路由契约约束。

你说“别问了、你看着处理”——但“按 spec-work 工作”和“绕开它的路由规则直接修”是相互冲突的两个授权，这个选择只能由你做；两条路都是一句话的事。
