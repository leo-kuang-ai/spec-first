## POV：MySQL → PostgreSQL？

**结论：Reject（framing-rejected）——不换；而且「换」这个前提在本仓库根本不成立：这里没有 MySQL，没有任何数据库。**

- **Grade**：Reject（框架不成立）——针对「从 MySQL 迁到 PostgreSQL」这一提案；无物可迁。
- **Incumbent**：声称是在位 MySQL；实际在位者是内存数组——`src/server.js:3` 的 `const entries = []`，重启即丢。
- **冻结候选集处置**：
  - 迁移到 PostgreSQL → framing-rejected（无在位系统可迁）；
  - 「维持 MySQL 现状」→ framing-rejected（MySQL 不存在；真实现状是内存存储，维持它不需要任何动作）；
  - 拒绝框架 → 即本结论。
- **Verified facts（项目）**：全仓库唯一存储逻辑为 `src/server.js:3,11,18`（内存 push / JSON.stringify）；`package.json` 零依赖，无 `mysql`/`mysql2`/`pg`/ORM、无锁文件；git 零提交、无 `docs/`、无 ADR（无先例决策）。
- **Verified facts（外部）**：不适用——判决完全由项目本地事实承载，无承重外部主张，故未做（也不需要）MySQL vs PostgreSQL 外部调研。
- **条件（"yes, if"）**：
  1. 若你的真实问题是「该不该给这个 demo 加持久化、加哪种」——那是 **net-new adoption**，另开一次 POV；且对 25 行的单文件 demo，成比例的首选更可能是 SQLite/文件存储，而非两个服务器级数据库（此为比例直觉，非本次判决）。
  2. 若「我们的 MySQL」指的是另一个仓库/环境——本结论不覆盖它，需要拿那个仓库的证据重跑。
- **Reversal trigger**（Tier 2）：本仓库真的出现 MySQL 依赖或连接代码，或你指出实际跑 MySQL 的代码库——判决失效，应重跑一次真正的对比迁移评估。
- **Handoff**：Reject 按规不挂接下游。一句话延续：想问的其实是「要不要加数据库」，直接说，我按 net-new 重新立框跑。

Grounding 模式：inline 串行（本次未获子代理派发授权，未声称独立 scout 覆盖）；precedent 部分 tracker/PR 不可达（零提交、无 remote），本地决策记录已查、无先例。
