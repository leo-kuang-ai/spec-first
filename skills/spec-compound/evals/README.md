# Compound假因果评测

`false-causal-claim`将原JSON候选转为可执行隔离fixture：before/after只改变凭据键，重试次数不变；`node verify.cjs`验证旧凭据增加重试仍被认证拒绝，新凭据无需重试即可成功。这里只能支持固定合成实验的凭据配置结论，不证明生产根因。

case要求只读候选grounding，独立judge核对候选拒绝、限定因果分类、支持路径以及文件/Git状态。`tests/unit/knowledge-causality-judge.test.js`校准正确与错误结果，包括报告正确但偷偷发布知识、修改源码或索引标志的反例。判据由`scripts/evals/build-outcome-judges.cjs`生成，不手改生成脚本。

模型行为未运行。判据检查最终文件和报告，不证明模型确实读取证据或运行verify命令，不评价任意自然语言的因果质量，也不证明其他知识能被正确晋升。真实runner若写入额外设施，必须明确设施与任务边界后再校准，不能把配置加载视为现场行为通过。
