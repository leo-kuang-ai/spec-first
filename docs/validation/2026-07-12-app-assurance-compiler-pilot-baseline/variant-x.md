# Anonymous Variant X

分类：`generated/advisory/disposable`。输入仅含两个 sanitized synthetic fixture；无 PRD、源码、Figma、runtime 或 known-defect labels。

## Sample 1: Checkout -> Submit -> Error -> Retry

输出先建立 run-local Feature/Journey/Surface/State/Event/Transition/Navigation/Platform Ownership 图，并逐项标注 `observed|inferred|unknown`、evidence refs 与 limitations。它明确把 Retry 后 terminal outcome 标为 unknown，并生成以下 obligations：提交去重；Error 保留恢复上下文；Retry 替换旧错误并进入可观察状态；Retry 的成功/再失败/取消闭包；Android/iOS 状态语义一致；a11y/i18n 待验证。

Counterexamples 包括：快速双击 Submit；Error 清空请求参数；旧错误覆盖 loading；Retry 再失败后永久 loading；Android/iOS lifecycle 消费差异；错误不可被 screen reader 感知。

验证任务按链路绑定 refs、actions 和 oracle：source inspection；ViewModel 状态机单测；Android/iOS UI 验证；a11y/i18n；design alignment 因无 materialized Figma 为 `not_evaluable`。

## Sample 2: Feature entry -> Permission denied -> Settings -> Resume

输出显式区分 Resume、recheck、granted、still-denied 和 terminal availability，且把 Resume -> recheck 标为 inferred obligation。Obligations 包括：权限状态不能压成单一 boolean；Resume 后必须重读权限；granted/still-denied 均有终态；Settings deep link failure 安全降级；平台细节不泄漏给 FeatureScreen；处理进程重建/重复回调/普通 resume；a11y/i18n。

Counterexamples 包括：Resume 被误当 Granted；授权后 UI 仍缓存 denied；普通前后台触发权限副作用；Settings 无法打开；Android permanently denied 与普通 denied 混淆；iOS restricted/limited 误映射；Settings 中进程被杀后 journey 丢失。

验证任务包括 source inspection、Coordinator 参数化状态机测试、Android/iOS runtime journey、lifecycle trace、a11y/i18n；每项带 actions/oracle/limitations。

## 成本与限制

- 粗略墙钟：8 分钟
- 输出字符：约 16,000
- 自估 token：约 4,000
- 没有 source evidence，所有缺陷结论保持 candidate/advisory。
- 未创建 durable schema；内部结构仅用于本次比较。
