# S20 修复与裁决

2026-11-02；修复前HEAD：fcf793cb3。范围：K-01、F-S20-01、F-S20-02。用户已授权自主连续修复与逐项本地提交。

- K-01：CLAUDE顶部仍建议零指导优先，与入口治理冲突，且其历史实验已经勘误。改为准确的历史限制说明，通过canonical generator派生AGENTS；未改runtime镜像。
- F-S20-01：独立加载Skill时明确修复/失败、命名入口、PR反馈、绿PR、技术采用与handoff规则，保留活跃owner与Direct Lane边界。
- F-S20-02：回源统计38个单行description共11867字符（见description-facts.json），旧11905并非当前值；字符和、token预算、宿主可见列表是不同事实。当前没有截断或误选的直接证据，不能把旧预算阈值当已成立缺陷。正文明确证据边界；不盲目删减全部description。此项完成事实纠正，真实宿主截断风险仍未验证，出现菜单快照/路由反例时重开。

## 验证

sync通过；2套17项测试通过；6个eval配置加载有效；entrypoint lint扫描510文件通过。日志为同目录txt文件。源码/文档修复采用直接前后对比和已有contract验证，不新增关键词镜像测试。

独立fresh-source审查：/root/s20_fresh_review，重新读当前磁盘diff、route map及历史勘误，明确修复、活跃失败、handoff、仅推荐、纯问答五场景无阻断冲突。审查者另核历史results与run.py佐证勘误，但未执行真实模型。

结构化verification摘要与honest closeout见同目录JSON；overall=verified，all-claims-consistent，仅针对本次四项本地检查。没有真实宿主路由/模型对照或description截断实验，不把这两项声明为通过。流程简化：本项是小范围prose与派生文档修改，无额外重构。未push、未安装provider、未刷新runtime。
