# Frontend Engineering Planning Lens

当请求、Product Contract 或 current source 涉及用户可见的页面、表单、导航、共享组件行为、异步 UI 状态、responsive layout 或 accessibility contract 时，读取本 reference。它负责 plan-time 的 frontend engineering 决策，不取代视觉打磨、browser 执行或 diff review。

## Trigger And Negative Boundary

触发本 lens：

- 新建或实质改变用户可见页面、交互表单、导航、组件公共行为或状态转换；
- 新增 loading、success、empty、error、permission、retry、offline 或并发交互语义；
- 影响 keyboard/focus、semantic structure、label/error announcement、contrast、motion 或 responsive layout；
- 纯 CSS 变更若降低 contrast、移除 focus indicator、破坏 breakpoint/layout 或改变 motion/state expression，也属于 trigger。

通常不触发本 lens：

- backend-only handler、type-only、fixture-only、token-value-only 且不改变 contrast/focus/layout/responsive/motion/状态表达的变更；
- 纯视觉 polish 且没有结构、行为、状态或 accessibility contract 变化；
- 实现后的 race、visual defect 或 browser runtime failure；它们分别归属于对应执行/评审 owner。

文件扩展名不能单独决定 trigger。LLM 根据用户可见行为与 current source 判断适用性；脚本只能验证可读 route、test、artifact 或 command facts。

## Required Planning Landing

适用时，计划应按风险记录以下最小决策，而不是追加固定 UI checklist：

- **Component boundary and reuse**：现有 design-system/component owner、可复用部分、局部 state owner，以及何时需要新组件边界；
- **State matrix**：适用的 initial/loading/success/empty/error/permission/retry/offline/concurrent states、可观察 transition、retry/cancel/duplicate submission posture；
- **Accessible interaction**：semantic element/role、keyboard path、focus order/focus restoration、label/help/error announcement、contrast 与 reduced-motion boundary；
- **Responsive behavior**：关键 viewport、content reflow、overflow/touch target、breakpoint or container constraints；
- **Runtime verification**：哪些 route/state 需要 browser/runtime evidence，哪些能由 component/unit/contract check 支撑，以及未运行时的 claim ceiling。

保留当前 project 的 design system、framework 与 component conventions；不要把具体 CSS framework、ARIA 模板、breakpoint 数字或 visual style 变成跨项目硬规则。

## State And Async Safety

当界面有 async action、subscription、timer、observer 或可重复触发的交互时，计划明确：

- action 的 pending、success、failure 与 cancellation/cleanup edge；
- 重复 click、晚到 response、unmount/remount、权限变化或 network failure 的结果；
- 哪个状态对用户可见，何时禁止、允许或合并重复 action；
- 何处需要真实 runtime/race verification，而不是只凭静态组件断言。

不要在 plan 中直接规定 implementation hook 或依赖库。若 timing/race 是 diff-time defect，交给 `julik-frontend-races-reviewer`；本 lens 只确保计划没有遗漏需要实现和验证的状态契约。

## Owner Boundaries

- `spec-plan` frontend lens：实施前的 component/state/a11y/responsive/runtime-verification 决策。
- `spec-polish`：已实现界面的 browser-visible visual iteration 和细节打磨。
- `spec-test-browser`：具备 capability 时的 browser runtime verification；它不决定 UI product design。
- `spec-dogfood`：branch/PR 用户流 QA 与小范围反馈修复。
- `julik-frontend-races-reviewer`：diff 中 lifecycle、timer、async、concurrency 和 cleanup race finding。
- frontend-quality reviewer（被 code review 条件选中时）：diff 中 a11y/state/responsive quality finding 与相邻 owner 去重。

不要新建 `spec-frontend` public Skill，也不要让 planning lens 直接执行 browser、polish 或 review。

## Failure And Degradation

缺 design artifact、可运行 route、browser capability 或 current component source 时，记录 source ref、owner、reason 与最窄替代 verification；不要宣称 visual/a11y/runtime 已通过。若需要新的 public workflow、第二个 design-system truth source，或无法区分 planning 与 execution/review owner，停止并返回 plan owner。
