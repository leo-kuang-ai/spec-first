# r3 有效配对记录：S06 GLM 与 S07 codex

日期：2026-11-02。r3 环境 = r2 环境合同 + 全局 spec-first 安装隐藏（见 [environment-contract-r2.md](environment-contract-r2.md) 与 [r2-work-glm-pair-invalid.md](r2-work-glm-pair-invalid.md)）。机器可读：[r3-observations-review-codex.json](r3-observations-review-codex.json)（S06 GLM 指标见本文表格，trace hash 见运行目录）。

## S06 work × GLM（glm-5.3 / claude_code 2.1.311）——有效

| 核验项 | A（with_skill） | B（without_skill） |
|---|---|---|
| Skill 接触 | 原生 `Skill(spec-work, mode:return-to-caller ...)` + 挂载版 8 个 references 读取 + 挂载版 `working-tree-fingerprint.cjs` 直跑；全局副本 0 读取 | 0 读取；末答明示"检查 ~/.claude/skills、项目 .claude/skills、npm 全局包、PATH 及会话技能列表均不存在"后走回退路径 |
| CLI 可用性 | `command -v spec-first` → MISSING（隐藏生效） | 同 |
| workspace | HEAD `bb7a5fa78`，dirty 3 文件 + `.claude/` 挂载 | 同 HEAD，dirty 仅 3 文件 |
| 独立 oracle | 5/5 | 5/5 |
| 回归 | 12/12（新增 7） | 11/11（新增 6） |
| 测试强度 | missing_audit 2 fail、paid_allowed 2 fail | missing_audit 3 fail、paid_allowed 2 fail（单行 guard 首次变异未命中为工具缺陷，单行删除重做后确认） |
| 成本 | input 51,044 / output 17,380 / cache_read 774,784；263s；40 工具调用 | input 17,286 / output 9,788 / cache_read 192,320；204s；26 工具调用 |

结论（仅本场景与 glm-5.3 成立）：业务结果无差异（双 5/5、回归全绿、测试强度同等）；A 成本 ≈3.0× input / 1.8× output / 1.3× 时长；A 产出收尾结构化证据路径与工作树指纹（经挂载脚本，非全局 CLI）。

## S07 review × codex（gpt-6-astra / codex 0.166.0）——有效

| 核验项 | A（with_skill） | B（without_skill） |
|---|---|---|
| Skill 接触 | 读挂载版 `.codex/skills/spec-code-review/SKILL.md` + modes-and-output/scope/intent-and-plan/finish-review 等 references | 0 目标 Skill 读取；曾读引擎自带 `.codex/skills/.system/review-agent/SKILL.md`（codex 0.166 系统资产，两组共同背景，非目标 Skill）；末答明示"未安装，直接审查" |
| workspace | fixture HEAD + candidate.patch 脏 diff（4 文件） | 同 |
| 冻结判据 D1/D2/D3 | **3/3 检出**：amount.cjs:4 /100 合同、ledger.cjs:7 去重键丢租户、ledger.cjs:11 先缓存后扣款；均带定位、合同连接、触发后果与本地复现 | **3/3 检出**：同三处定位与复现 |
| N1 负对照 | receipt.cjs 判为行为等价，未报缺陷 ✓ | 同 ✓ |
| 顺序批量入口 | 未误判并发缺陷 ✓ | 同 ✓ |
| 成本 | 302,095 token / 104.1s / 7 工具调用 | 88,627 / 59.7s / 4 |
| 证据出口 | 产出审查工件 findings.json、actionable-findings.json、metadata.json、report.md（Skill 的结构化输出合同）；诚实声明未做独立复核与冻结快照，不冒充完整门禁 | 纯文本报告 |

结论（仅本场景与 gpt-6-astra 成立）：**检出饱和**——两组均 3/3 检出且负对照正确、无误报；无检出差异。差异在结构化证据出口（A 有 findings schema 工件）与成本（A ≈3.4× token、1.7× 时长）。不因饱和断言 Skill 无价值（证据出口与流程合同是设计目标，未计入检出分）。

## 与既有结论的关系

- S06：与历史"gpt 无差异、成本约 5 倍（W5 重构）"方向一致，本场景成本倍数更低（3.0–3.5×）；GLM 侧首次获得有效 A/B，业务同样无差异。
- S07：历史小 diff 饱和 + 本跨 4 文件场景仍饱和；两组均无漏报误报。
- 两个场景的"业务检出/正确性无差异 + 过程证据结构化差异 + 成本上升"构成一致模式；样本量 1 对/场景/模型，不做统计显著声明。
