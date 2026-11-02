# S07 修复与事实裁决

2026-11-02；修复前HEAD：da379b91d。目标F-S07-02；F-S07-01保持撤回。

根因：scope.md未定义无提交仓库的缺基线恢复；普通untracked排除规则与仅暂存建议不能补出有效base。helper已有commit端点校验，缺HEAD返回unknown，空diff也已有skipped/gate不合格规则，故不扩展脚本。入口新增缺基线failed、范围披露和本地有效commit的显式base恢复说明；暂存必须另有授权，report-only不创建提交、不fetch。没有实现自动空树基线。

新增隔离Git回归观察：无HEAD缺base→unknown；仅暂存仍unknown；准备真实commit对象后显式base→精确包含已暂存文件、排除无关untracked；helper前后porcelain不变、HEAD仍不存在。它验证现有helper行为，不证明模型会实际遵循新增说明。修复前缺口由源码直接确认；此测试不是宣称脚本先红后绿。

2套84项测试与5例eval配置加载通过，原始日志、source SHA及structured closeout见本目录。独立fresh-source /root/s04_source_review读取最终diff、helper及范围合同后passed，无阻断发现；其未运行测试，不冒充独立运行。无新抽象，simplify不适用。未调用真实宿主/模型，不证明新恢复输出行为或相对收益。structured verified仅覆盖本地tests/eval命令。
