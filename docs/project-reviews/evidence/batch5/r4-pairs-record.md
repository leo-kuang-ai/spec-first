# r4 重复样本记录：四对配对 n=2（结论稳定复现）

日期：2026-11-02。环境与 r3 相同（全局 spec-first 安装隐藏；窗口 12:00–12:26 CST，已恢复并验证）。机器可读：[work-codex](r4-observations-work-codex.json)、[work-glm](r4-observations-work-glm.json)、[review 两组](r4-observations-review.json)。目的：README 原案"每组 3 次"的重复采样意图下，用结余额度补第二轮，检验首对结论稳定性；非新场景。

## 逐对结果（全部有效）

| 配对 | A（with_skill） | B（without_skill） | 业务/检出 | 成本比 |
|---|---|---|---|---|
| S06 codex | oracle 5/5、回归 12/12、10 次挂载 Skill 读取；测试写入既有 `invoices.test.js`（变异体测试：missing_audit 3 fail、paid_allowed 2 fail） | oracle 5/5、回归 12/12、零 Skill 读取；missing_audit 2 fail、paid_allowed 2 fail | 双 5/5 无差异 | 527,251 vs 159,250 token（≈3.3×）；142s vs 94s |
| S06 GLM | oracle 5/5、回归 11/11、原生调用+12 挂载触达、0 全局；missing_audit 3 fail、paid_allowed 2 fail | oracle 5/5、回归 10/10、零读取；missing_audit 3 fail、paid_allowed 2 fail | 双 5/5 无差异 | input 54,870 vs 15,080（≈3.6×）；400s vs 136s |
| S07 codex | D1/D2/D3 3/3（P1×3，含合同引用与复现）、N1 正确、结构化 Actionable Findings、快照复核；353,919 token/142s | D1/D2/D3 3/3、N1 正确、明示"未找到技能，直接审查"；106,283 token/64s | 双 3/3 饱和 | ≈3.3× |
| S07 GLM | D1/D2/D3 3/3（P0×3 + 批量部分失败语义缺口观察 #4，标注"需产品决策"非缺陷）、N1 正确（"纯提取变量重构，行为等价"）、mutation_detected:false；in 70,033/out 29,768/406s | D1/D2/D3 3/3、N1 正确、独立复现含"校验与输出单位自相矛盾"洞察；in 12,191/out 7,773/126s | 双 3/3 饱和 | input ≈5.7× |

## 有效性核验

四对均通过：A 组真实读取挂载 Skill（原生调用或挂载路径 cat/Read，全局副本零接触）；B 组零目标 Skill 读取（codex B 仅触引擎自带 `.system` 资产，GLM B 明示"未安装"回退）；workspace 均在 fixture 基线 HEAD（work `bb7a5fa78` / review `9f04885`）上只含预期 dirty 文件；同调用成对、同环境。测试强度变异两次出现"变异脚本未命中 guard 写法"的工具假阴性（`inv`/`invoice` 变量名、单行无花括号），修正匹配后确认全部有效——已如实记录，判据本身未动。

## n=2 汇总结论（仅对被测两模型组合成立）

- **饱和稳定**：S06 四个有效样本业务全部 5/5（含两轮重复），S07 四对全部 3/3 检出 + N1 正确、无误报。未出现任何一轮翻转。
- **成本模式稳定**：A 组 token 成本倍数 codex≈3.3–3.5×、GLM input≈3.0–3.6×（work）/5.7–6.6×（review）。
- **过程差异稳定**：A 组每轮均产出结构化证据（return-to-caller 信封 / findings schema 工件 / 快照与指纹自查 / 诚实降级标注），B 组均为高质量平铺文本；r4 中 A 组出现"改既有测试文件而非新建"的行为变体，两轮 B 组均含独立复现洞察（并发窗口、单位自相矛盾），两组质量均高。
- 不做统计显著声明（n=2）；不再追加第三轮（余 2 次额度保留备用，如需 3/3 采样另行决定）。
