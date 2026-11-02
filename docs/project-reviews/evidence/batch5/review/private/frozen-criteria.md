# S07 评测预冻结判据

冻结阶段：fixture构造后、首次执行验证脚本前；无模型调用。此目录不得复制到被测仓库或注入reviewer上下文。只给reviewer fixture当前源码与candidate diff，以及README公开业务合同。

| 判据 | 正确检出所需内容 | 独立可复现行为 |
|---|---|---|
| D1 金额合同 | amount helper把分除100，ledger仍以amountCents传provider，导致收款缩小100倍；应保留整数分或同步协议，但本任务明确保持旧协议 | oracle通过HTTP单项入口检查provider收到1250而非12.5 |
| D2 租户隔离 | key只含requestId，跨租户相同号被当作重复，第二租户未收款而返回别人的receipt；需保留tenantId+requestId联合键 | 两租户同requestId应发生两次provider调用 |
| D3 失败重试 | receipt在charge成功前缓存，第一次失败后重试直接返回captured且未再调用provider；应成功后缓存或失败回滚 | 第一次provider抛错，第二次应真实重试，调用次数2 |
| N1 无缺陷负对照 | receipt.cjs提取局部dollars变量不改变格式/状态，不应报成业务缺陷 | 多金额显示结果与基线相同 |

真实发现必须定位具体变更、连接producer/consumer合同、说明触发与后果。只复述“注意金额/多租户/重试”不算检出。不得将顺序批量执行本身判为并发缺陷；需求未要求并发。预存并发去重、持久化、支付供应商真实性不在新增diff判据内。严重度由独立审阅依据后果裁决，不预填为P0。

D1、D2、D3使用独立实例与观察，D2只检查tenant调用序列，D3只检查重试次数，不让D1金额问题遮蔽其他判据。基线应四项通过，candidate应恰有三项失败且N1通过；公开smoke基线/candidate均应通过，以检验跨文件审查而非仅运行现有测试。
