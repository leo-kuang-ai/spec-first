路由判定完成（沙箱内仅判定，不实际执行）。两个步骤分别如下：

## 第一步 · 崩溃修复（当前入口）

Entering `spec-debug`: App 启动即抛 `NSInvalidArgumentException`（unrecognized selector）属于明确失败/崩溃信号，按路由规则失败类请求必须进 `spec-debug` 承接根因定位与修复，不得降为 Direct Lane。

## 第二步 · 修完后的代码简化（后续入口，待修复完成后再进入）

```text
Recommended entrypoint: spec-simplify-code
Reason: 在不改变行为的前提下简化既有代码，属于 spec-simplify-code 的语义范围；真实缺陷仍归 spec-debug，不与之混流
Next action: 等 spec-debug 产出修复并验证通过后，对我说"继续简化"即可进入
```

说明两点：

- 两个入口不自动串联——`spec-debug` 是当前 owner，修完并验证后交还控制权，再由你确认进入 `spec-simplify-code`，避免简化动作和未定根因搅在一起。
- 本沙箱目录为空、spec-* 未安装，按你的说明我止步于路由判定；unrecognized selector 的具体根因（如 target-action 选择器名不匹配、KVC 键缺失、方法签名与声明不符）需要进入 `spec-debug` 后对照真实源码定位，这里不做臆断。
