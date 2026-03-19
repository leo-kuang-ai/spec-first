# Evidence Pack 规范

> 规范主线程与 subagents 之间如何传递证据。
> 目标是把“证据包”标准化为结构化输入，避免主线程把长证据直接塞给每个 agent。

## 1. Evidence Pack 目录结构

建议的逻辑结构如下：

```text
evidence-pack/
  manifest.json
  shared/
  runtime/
  docs/
```

- `manifest.json`：本轮包的摘要、范围、版本、生成时间
- `shared/`：runtime 与 docs 共享的最小事实
- `runtime/`：runtime agents 可读的证据集合
- `docs/`：docs agents 可读的证据集合

## 2. runtime wave 可读范围

- 允许读取 `manifest.json`
- 允许读取 `shared/`
- 允许读取 `runtime/`
- 不允许重新扩展为长篇背景分析

## 3. docs wave 可读范围

- 允许读取 `manifest.json`
- 允许读取 `shared/`
- 允许读取本轮已确认的 runtime 结果
- 不允许重新取证或反向修正 runtime 真源

## 4. 传递原则

- 主线程只发包，不发长证据
- subagent 只消费与自己波次相关的 evidence slice
- 缺证据时必须标记 `[待确认]`
- 不得把猜测写成确定事实
