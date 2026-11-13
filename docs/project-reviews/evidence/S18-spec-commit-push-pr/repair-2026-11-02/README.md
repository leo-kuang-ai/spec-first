# S18 受控 push 合同复验

2026-11-02；基线9a7d20233。唯一授权endpoint、显式单分支refspec、禁额外tag和子模块的合同保留。新增发现：本机Apple Git 2.50.1在remote mirror配置为true时，原命令即使有--no-mirror仍拒绝显式refspec；这是安全失败，不是越权发布证据。

修复以单次`-c remote.<push-remote>.mirror=false`覆盖配置，不修改持久配置。push-contract-probe.cjs读取当前source命令，在两个临时bare remote验证：多pushurl和不匹配endpoint阻断；唯一授权endpoint且开启followTags、mirror、通配push配置时只收到feature分支，另一端、tag和无关分支未改变。endpoint门禁由probe模拟文案判断，不证明模型执行了门禁。red-mirror.txt保留旧失败。

真实本地probe及5项现有contract测试通过，structured closeout只覆盖列出的命令。独立fresh-source审查者/root/s04_source_review复核源码、probe和日志后passed，无阻断发现，未重复运行。没有真实发布、runtime刷新或模型行为评测；其他Git版本未验证。X-02内部调用限制留给S17共享生成修复及消费者复验。
