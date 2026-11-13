# S10 同根核查澄清

2026-11-02；基线e27c017ea。F-S10-01保持“原条款不禁止普通检查，历史漏修不能证明Skill诱发”的裁决；F-S10-03仍为保护性分支策略观察，不改。

fix.md新增根因确认后的有界失败签名/共享入口/直接消费者检查，发现一个同根位置也核实并验证；搜索候选不等于confirmed finding，范围外记录证据移交。三处阈值仅控制额外纵深防御与复盘，不自动扩张修复范围。没有新增框架或要求全仓扫描。

same-root-probe.cjs在临时Git仓库创建基线，保留两个相同缺失lines失败入口；只修total后它通过，唯一另一同根位置tax仍失败；再修tax后两处正常及缺失输入通过。它验证判据能发现遗漏，不证明模型会发现或修复该位置；并非新指令的模型RED/GREEN。8项现有contract tests及5例配置加载通过；原始日志、源码SHA与structured closeout在本目录，verified只覆盖实际本地命令。

独立fresh-source /root/s04_source_review复核新增段、原阈值和probe后passed；未重复运行测试。无新抽象，simplify不适用；未新增付费评测、真实宿主运行或runtime刷新。实际模型同根覆盖率与成本仍未测。
