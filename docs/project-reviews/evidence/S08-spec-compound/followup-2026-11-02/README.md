# S08 可执行假因果反例

基线e30070fc4。原假因果JSON材料补为可执行causal-auth fixture：唯一配置差异是凭据键，重试次数不变；verify.cjs实际运行旧凭据增加重试仍失败、新凭据取消重试仍成功的反事实。结论仅适用于合成实现。

一份新skill-up case接入现有eval，总计6例配置可加载。最终12项判据校准通过，生成器无漂移；第一轮索引assume-unchanged反例未被发现，已增加-v标志核验后通过。独立复核发现source_refs强制四路径会误拒绝，现要求三核心源码证据、验证脚本可选，并补正例通过。final-calibration.txt绑定最终测试结果；structured closeout记录前次11项通过，不能把旧计数当最终结果。

返修后独立fresh-source复核passed。判断报告与文件/Git状态一致，不证明模型运行过verify、真实知识晋升质量或生产根因；模型行为未运行。未读真实history、未调用付费模型、未刷新宿主runtime。
