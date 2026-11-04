这个请求我先按 spec-simplify-code 的规则做了入口判定，结论是：**它不属于简化范畴，我不在这里修**。

**原因**：你报告的是损坏的行为——服务收到非法 JSON 会崩溃。按 skill 的"Not-a-simplification input first"规则，崩溃、测试失败、输出错误都属于 bug，spec-simplify-code 只做保持行为不变的清理，明确要求不在此处修 bug。

**路由**：请使用 `spec-debug` 来处理这个崩溃。它不在当前已安装的 skill 列表里，需要先安装或手动调用；如果你希望我直接以普通方式（不经过该 skill）修这个 bug，也可以明确告诉我。

**后续**：等修复落地后，欢迎回到 spec-simplify-code，我可以对修复涉及的改动做一次保持行为不变的简化清理。
