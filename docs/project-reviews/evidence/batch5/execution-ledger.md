# 第五批执行台账（交接快照）

用户已回复ok批准最多24次运行。交接前中止当前runner，不启动新调用。

## Resume 会话投入（2026-11-02，additive 记录，不回填历史工时）

- 会话窗口约 09:58–12:30 CST（zcode/GLM-5.3 作为审查 owner）：终止遗留 runner、环境合同核验与两次可逆隐藏/恢复、驱动 18 次模型运行（r2×4、r3×6、r4×8）并逐次判读核验、文档回填与哈希刷新。owner 侧工时为近似窗口，非精算（与 #24 历史缺口同理不回填）。

| 尝试 | 配置/组 | 状态 | 限制 |
|---|---|---|---|
| 1 | S06 Codex A，沙箱内 | DNS受阻中止 | 无有效回答，保守计入24次。resume时发现其codex exec孤儿进程存活8h20m（thread_id 01a19833与trace吻合，stdout 466行中464行为Reconnecting错误、0条模型消息），已于2026-11-02 10:02 CST终止；不改变计数 |
| 2 | S06 Codex A，联网后 | 完成，业务oracle5/5、回归通过 | 实际读取Skill；缺fixture内收尾工具，诚实blocked |
| 3 | S06 Codex B | 中止，无完整结果 | 读源后约20分钟无进展，末尾有追加活动；不可判能力失败 |
| 4 | S06 GLM A | 模型末答及实现存在；runner归档未完成 | 独立oracle5/5；调用全局安装spec-first并读其源码，环境差异待核 |
| 未启动 | S06 GLM B；S07全部组 | 未运行 | 不计消耗 |
| 5 | r2 S06 Codex A（with_skill） | 完成：oracle 5/5、回归 11/11、测试强度两变体可捕获、真实加载挂载 Skill、未调用全局 CLI | 487,747 token/129.8s；见 r2-work-codex-pair.md |
| 6 | r2 S06 Codex B（without_skill） | 完成：oracle 5/5、回归 13/13、测试强度两变体可捕获、无 Skill 污染 | 140,810 token/75.5s；同上 |
| 7 | r2 S06 GLM A（with_skill） | 有效 A 样本：原生 Skill 调用+挂载版 10 引用读取、oracle 5/5、回归 11/11；调用了全局 CLI（caveat 记录） | input 62,241/output 22,096/cache_read 1,239,424；455.4s；见 r2-work-glm-pair-invalid.md |
| 8 | r2 S06 GLM B（without_skill） | **无效**：经 npm root -g 找到并读取全局安装的 spec-work SKILL.md+6 引用并照做 | 计入24次；见 r2-work-glm-pair-invalid.md；r3 隐藏全局安装后重跑 |

剩余最多16次运行；不是免费重试。r3 计划：S06 GLM 重跑 + S07 两对 = 6 次（隐藏全局安装环境，恢复脚本先行）。
| 9 | r3 S06 GLM A（with_skill，隐藏环境） | 有效：原生 Skill 调用+挂载版 8 引用、oracle 5/5、回归 12/12、测试强度两变体可捕获；CLI 探测 MISSING 后用挂载脚本做指纹 | input 51,044/output 17,380/cache 774,784；263s；见 r3-pairs-record.md |
| 10 | r3 S06 GLM B（without_skill，隐藏环境） | 有效：零 Skill 读取、明示"未安装"回退、oracle 5/5、回归 11/11、测试强度可捕获 | input 17,286/output 9,788/cache 192,320；204s；同上 |
| 11 | r3 S07 Codex A（with_skill） | 有效：读挂载 SKILL.md+多引用；D1/D2/D3 3/3 检出、N1 正确、无误报；产出 findings/report 工件；302,095 token/104s | r3-pairs-record.md |
| 12 | r3 S07 Codex B（without_skill） | 有效：零目标 Skill 读取（读引擎自带 .system/review-agent 属共同背景）；D1/D2/D3 3/3、N1 正确；88,627 token/60s | 同上 |
| 13 | r3 S07 GLM A（with_skill） | 有效：原生调用+9 挂载触达；D1/D2/D3 3/3（P0×2+P1×1）、N1 正确；结构化 findings schema+诚实降级标注 | input 60,152/output 23,837/cache 542,592；469s；r3-observations-glm.json |
| 14 | r3 S07 GLM B（without_skill） | 有效：零读取；D1/D2/D3 3/3、N1 正确、独立复现含并发窗口附注 | input 9,127/output 6,681/cache 76,928；181s；同上 |

**四对有效 A/B 配对完成（S06/S07 × 两模型），14/24 次已耗、10 次未用即停；累计观测约9.5M token，未达 12M 停止线。** 全局安装隐藏窗口 10:39–11:07 CST，已恢复并验证 RESTORED_OK。r3 后不再计划新调用；重复样本是否补跑另需决定，本批按首对有效即收口。
| 15 | r4 S06 Codex A（重复2） | 有效：oracle 5/5、回归 12/12、测试强度可捕获；测试写入既有 invoices.test.js（行为变体） | 527,251 token/142s；见 r4-pairs-record.md |
| 16 | r4 S06 Codex B（重复2） | 有效：oracle 5/5、回归 12/12、零 Skill 读取 | 159,250 token/94s；同上 |
| 17 | r4 S06 GLM A（重复2） | 有效：oracle 5/5、回归 11/11、原生调用+12 挂载触达 | input 54,870/output 20,438；400s；r4-observations-work-glm.json |
| 18 | r4 S06 GLM B（重复2） | 有效：oracle 5/5、回归 10/10、零读取 | input 15,080/output 7,459；136s；同上 |
| 19 | r4 S07 Codex A（重复2） | 有效：D1/D2/D3 3/3、N1 正确、结构化工件 | 353,919 token/142s；r4-observations-review.json |
| 20 | r4 S07 Codex B（重复2） | 有效：D1/D2/D3 3/3、N1 正确 | 106,283 token/64s；同上 |
| 21 | r4 S07 GLM A（重复2） | 有效：D1/D2/D3 3/3、N1 正确、mutation_detected:false | input 70,033/output 29,768；406s；同上 |
| 22 | r4 S07 GLM B（重复2） | 有效：D1/D2/D3 3/3、N1 正确 | input 12,191/output 7,773；126s；同上 |

**最终收口：22/24 次已耗（2 次保留未用），四对配对各 n=2，饱和与成本模式稳定复现；r4 隐藏窗口 12:00–12:26 CST 已恢复验证。** token 观测合计（codex 累计口径 + GLM 按 message id 去重 in+out+cache_read）：历史尝试约 1.98M、r2 约 3.39M、r3 约 2.17M、r4 约 3.38M，**全批合计约 10.92M，未达 12M 停止线**。第三轮重复（原案每组3次）不再执行，如需另行申请。此前12M token观察上限仍有效。Codex可观察token为362418+142561，GLM去重观测字段见recovered-glm-a1/recovery.json；中止调用的服务端费用不确定。

原始日志与隔离home：/tmp/spec-first-batch5-runs；可恢复实现已选取三份合成源码/测试保存至recovered-glm-a1。未复制凭证、全home或完整transcript。交接时进程表核对未见指定runner、三个统一exec会话均已退出130，但该结论不完整：resume复核发现尝试1的codex exec孤儿进程（PPID=1）仍在沙箱断网重连循环中存活，已终止并确认全机无其他评测进程。后续任何resume仍须重做进程核验。
