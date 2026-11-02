# 认证配置与重试的因果核查

本仓库是固定合成实验。before.json和after.json代表唯一配置变更；src/client.cjs在两次实验中相同。运行`node verify.cjs`读取真实分支结果，再检查candidate.md的因果归属。已知当前输入不是一次完整生产现场，结论只能覆盖这个实验，不外推所有认证或网络失败。
