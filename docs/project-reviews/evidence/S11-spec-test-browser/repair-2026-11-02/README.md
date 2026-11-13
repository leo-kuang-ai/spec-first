# S11 内部能力定位复核

2026-11-02；基线94fe0b631。F-S11-01确认需求把内部能力误列主体：source为user-invocable:false，governance为internal_only，由LFG/dogfood等调用方消费。修正需求和总表分类，保留浏览器验证责任；Skill本身无需重复改动。S17已提供Codex显式调用metadata，此项只核对消费者投射。

55项browser合同/清理测试及聚焦多宿主metadata projection通过，独立fresh-source复核通过。投射不证明Codex实际隐式选择被阻止，也不证明真实页面路线覆盖、视觉/交互结果或清理完成。未启动浏览器、未刷新runtime。
