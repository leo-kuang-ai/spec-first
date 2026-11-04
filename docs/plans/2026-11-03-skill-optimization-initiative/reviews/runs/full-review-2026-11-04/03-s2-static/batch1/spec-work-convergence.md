# spec-work 收敛报告（批次1）

**K=3**：R1 zhipu/glm-5.3 / R2 hst-2/gpt-6.1-sol（v2 重跑，首跑未完成必读覆盖已存档）/ R3 kiro/kimi-k3　**冻结**：5b59293b

## 一致率（R2-v2 口径）：全一致 12/18（67%）、多数 6/18、全分歧 0（免仲裁）

## 最终逐项裁决：18/18 pass

- 6 项多数分歧（D04/D05/B02/B05/X01/X04）均为 R1+R3 pass vs R2-v2 fail，采纳多数 pass；**但 R2-v2 的 fail 主张经主会话确定性核实成立**（见下），作为 confirmed finding 进修复，不因多数裁决湮没

## R2-v2 六个 fail 的根因核实（主会话验证，非转述）

**同一根因：run.json 恢复状态初始化断链。**
- 代码事实：`writeSpecWorkRunState` 先 `readSpecWorkRunState`（src/cli/helpers/spec-work-run-artifact.js:595,708），`readFileSync` 失败即拒（`artifact-unreadable`）——state-write 要求 run.json 先存在；测试靠 `seedLegacyRun` 预置，未覆盖缺失分支
- prose 事实：shipping-workflow.md:58 要求「Before and after each mutation... record `started`」从 Step 1 起；唯一创建指示是 Step D closeout 条件 producer（:177「没有 trigger 时不调用 producer」）；workspace-setup.md/SKILL.md 零创建指示
- git 事实：两句均诞生于 e9fe0769（2026-08-04）同一合并，原生设计缺口非退化
- **结论：fresh run 首个 mutation 的 `started` 记录按现 prose 必然拒写——R2-v2 正确，R1/R3 漏查**

**处置（FIX-004）**：shipping-workflow.md:58 已修——append-only 状态契约圈定为「durable run.json 存在之后」（resumed runs + Step D 落地后的后续事务）；fresh run 在 artifact 落地前中断走 workspace fingerprint + task-pack pins + git state 恢复，并显式提示 state-write 会拒写。不新增 CLI、不破坏 immutability。

- B05 附加子主张（tracker-defer.md:132-159 建单失败重试未区分「确定未创建/已创建但响应未知」）：主会话未复核，记录为未验证 sub-claim，进 P3 待办

## 合并 Findings（进入优化阶段修复清单）

**P1（已修）**
1. run.json 状态初始化断链（R2-v2 D04/D05/B02/B05/X01/X04 共因，FIX-004）

**P3（未修，待排期）**
2. R1 F1：work-intake.md:33 trivial 路由「no execution loop」与 SKILL.md:95 必读 implementation-loop 矛盾
3. R1 F2：shipping Step 6 Post-Deploy「every change」REQUIRED 但唯一承载位是 PR description，无 PR 出口未定义
4. R1 F3：simplify 阈值双口径（phase boundary「substantive human-authored」vs final「changed」）边界情形反向判定
5. R1 F4：workspace-setup.md:44-45 与 :34-36 整段重复
6. R1 F5：mutation worker 要求「write-deny + credential-isolation receipt」宿主基本无法出具——建议登记重估条件
7. R3 #1：SKILL.md:24「script-verified」总结句弱化 LLM-owned reconciliation 语义
8. R3 #2：SKILL.md:40 return-to-caller unreadable fallback 未指向 envelope 定义
9. R3 #3：envelope 字段变更与 outcome judge 校准链耦合未显式化
10. R3 #5：fingerprint 稳定性依赖 `.spec-first/workflows/` 被忽略的隐式前置，无 check-ignore 断言
11. B05 附加：tracker-defer 重试区分（未验证 sub-claim）

## 结论

- **spec-work 静态层：18/18 pass**（多数口径），附 1 项已修 P1 + 10 项 P3/观察
- 行为层/成本/收益：未验证（S3 另测）
- R2-v2 首跑教训已固化进批次2+ 提示词（完成性指令）

## 产物

spec-work-R1-glm53.md / -R2-sol-attempt1（存档，16 nv 未完成覆盖）/ -R2-sol-v2.md / -R3-kimi.md
