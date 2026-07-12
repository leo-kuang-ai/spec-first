# Anonymous Variant Y

分类：`generated/advisory/disposable`。输入仅含两个 sanitized synthetic fixture；无 PRD、源码、Figma、runtime 或 known-defect labels。未创建 IR。

## Sample 1: Checkout -> Submit -> Error -> Retry

直接输出三个候选 finding：Retry 可能导致重复提交/并发请求；Error -> Retry 状态恢复可能不完整；Android/iOS 提交状态 ownership 可能不一致。每条包含 journey steps、direct evidence、missing evidence、conclusion cap、counterexample、verification environment、actions、oracle 和 limitations。

最低成本验证任务：首次请求服务端成功但客户端超时后 Retry；Error 分支解除 submitting；Retry 连续点击；Android/iOS 相同失败序列；Error 状态下后台恢复/界面重建。Design alignment 因无 materialized Figma 为 `not_evaluable`。

## Sample 2: Feature entry -> Permission denied -> Settings -> Resume

直接输出四个候选 finding：Settings 返回后可能未重读权限；denied 流程可能缺少取消/安全退出；Resume 可能重复导航或权限请求；权限状态可能被压缩为单一 denied。每条包含 evidence/missing evidence/counterexample/actions/oracle/limitations。

最低成本验证任务：Settings 授权后 Resume；不授权后 Resume；permanently denied/restricted 的退出；Resume 与 Screen 重绑并发；Android/iOS 权限状态映射；快速多次前后台切换。

## 成本与限制

- 粗略墙钟：12 分钟
- 输出字符：约 12,800
- 自估 token：约 3,200
- 没有 source evidence，所有缺陷结论保持 candidate/advisory。
- 未对视觉、具体技术栈或 KMP ownership 作无证据断言。
