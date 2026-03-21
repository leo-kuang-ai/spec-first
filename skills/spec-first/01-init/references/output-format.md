# Init 输出格式

> 该文档描述 `spec-first init` 的推荐输出语义，帮助用户在降级背景状态下继续初始化，而不是把 `00-first` 是否完整当作阻断条件。

## 1. 基本原则

- `first` 是优先背景输入，不是硬阻断前置。
- 当 `backgroundInputStatus` 为 `degraded` 时，`init` 仍应继续执行。
- 当 `backgroundInputStatus` 为 `blind` 时，`init` 仍应继续执行，但要明确提示补跑 `/spec-first:first`。

## 2. 推荐输出语义

### 2.1 正常状态

- 输出 `00-first Skill 已完成`
- 输出项目摘要、代码量、API 端点信息
- 继续进入参数收集与 Feature 创建

### 2.2 降级状态

- 输出 `当前以降级背景状态初始化`
- 输出缺失的背景信息
- 明确提示后续补跑 `/spec-first:first`
- 不输出阻断式错误信息来替代降级说明

### 2.3 感知不到背景状态

- 输出 `当前背景信息不足，按降级模式继续`
- 允许继续收集 `feat`、`mode`、`size`、`platforms` 等参数
- 在完成初始化后提示补跑 `/spec-first:first`

## 3. 输出要求

- 不把背景状态不完整描述成初始化失败
- 不把 `degraded` 误写成 `blocked`
- 不把 `first` 的缺口传播成 `init` 的硬错误
