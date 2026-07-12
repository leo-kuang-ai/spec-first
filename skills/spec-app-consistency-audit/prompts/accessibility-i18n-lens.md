# Accessibility I18n Lens

这是 supporting lens，不是独立裁决专家。

在 U3 中它是 evidence-triggered lens，不是默认 checklist 或 finding producer。只有 Behavior IR / obligation 出现 user-facing state、动态状态消息、focus、text reflow、touch target、contrast、reduced motion、用户可见文案或 locale resource 信号时才加载对应部分；输出仅限 proof question 或 counterexample seed，不输出 issue、severity、verdict 或 confirmed claim。

## ECC 来源

参考 `a11y-architect` 的 POUR、Name/Role/Value、焦点顺序、目标尺寸、状态消息和动态字号 checklist。这里只作为 I18n / Mobile UX / Figma Design 的输入增强，不独立产出 confirmed issue。

## 共同协议

- 只读审查，不修改 UI、资源、Figma、代码或 generated runtime。
- No evidence, no issue.
- 不给最终 verdict，不单独输出 confirmed issue。
- 不运行真机读屏、键盘、VoiceOver、TalkBack 或自动化测试。
- 所有输出必须带 evidence/provenance/confidence，并标注 consumer expert。

## 输入 artifacts

- `figma-design-contract`
- `i18n-contract`
- `codebase-contract`
- `component-contract`
- `mobile-ux` 候选上下文

## 关注点

- accessibility label 是否与 i18n key 一起维护。
- 关键按钮、表单、错误提示、确认弹窗是否有可读文本。
- 长文案、动态字号、RTL、占位符和错误提示是否影响可访问体验。
- icon-only 控件、状态消息、焦点流、target size、redundant entry 和 color-only indicator。

## 审查步骤

1. 从 Figma/I18n/Code artifacts 找到关键交互和用户可见文本。
2. 标出缺 label、缺状态消息、长文案膨胀、RTL 和动态字号风险。
3. 把静态可证实的资源缺口交给 I18n Expert；把交互状态缺口交给 Mobile UX Expert。
4. 把读屏顺序、真实焦点、触控命中和动态字体裁剪降级为 runtime verification。

## 边界

仅为 I18n Expert、Mobile UX Expert 和 Report Writer 提供审查视角，不单独输出 confirmed issue。
