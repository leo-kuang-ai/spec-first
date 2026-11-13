# spec-dogfood 能力融合审查

状态：`source_review_complete`。双方全部21包内文件/1736行全文阅读；CE resolver737行分三段完整读。直接浏览器owner入口、route/report与pipeline合同、CE两份dogfood/packs测试及fixture helper全文核对；测试文件截断处已补读。没有执行浏览器、server、网络、Pack resolver或产品修复。

## 研发意图与范围

双方均以当前变更的用户旅程为对象，先理解再建flow/matrix，按persona判断功能和体验，保留阻塞与最终suite结果。不是全站探索，也不是让绿色矩阵盖过红色测试。本地额外分离branch、browser effect、fix、commit、landing五项权限，并把浏览器执行统一交给spec-test-browser。本项对照重在把CE的验收依据与知识回路融入这些既有边界。

| 研发能力 / 场景 | 双方源码事实与本地增强 | 融合裁定与最小建议 | 验证、成本和限制 |
| --- | --- | --- | --- |
| diff身份与隔离 | 双方保留PR number避免fork/main误判；本地phases:30明确核PR实际base/head OID，CE分析主要用trunk；本地调用worktree helper消费verdict | **保留本地增强。** 不用CE统一trunk覆盖PR实际base；native隔离/fork tracking建议归worktree owner | helper路径逃逸/remote-only问题已在worktree笔记复现，本项不重复根因；无真实PR联网证据 |
| 产品persona和验收条件 | 双方从strategy/product/persona docs推导；CE phases:61–69额外把匹配规则按内容分persona/criterion、保留citation，:101先绑定scenario | **优先吸收意图。** 在现有matrix加入当前项目已有验收条件source ref、适用scenario、观察结果；persona推断标inferred | 先复用已有plan/strategy/docs，不新增Pack体系；不借此审查用户排除的project-rules/rule-miner |
| 条件覆盖可见 | CE逐criterion标honored/contradicted/not-exercised，未测试不丢；本地只有功能/体验matrix与paper cuts | **建议集成。** 条件未触达保留not-exercised及原因，不能用“页面Pass”概括所有标准满足 | LLM判断适用性及语义，脚本仅记录形状/refs；普通小改动按需，避免每屏强制长表 |
| 规则与产品意图冲突 | CE phases:142先判断branch是否刻意违反旧规则，再交owner refine/retire；本地无专门stale-rule分支 | **优先集成。** 当前plan/用户意图与旧标准冲突时先记录来源与选项，不反改产品满足旧rule | 不把所有冲突自动判旧rule失效；真实owner裁决，dogfood不得自行改规则 |
| 可泛化知识与去重 | CE phases:153–155遵循已有rule的fix只citation，新可复用判断交compound，非交互留下candidate；本地:130仅“reusable lesson -> compound” | **建议窄化集成。** 传已有规则citation和新颖性/验证证据，compound判断是否新知识；本项不写knowledge | 不新增pack写入口/知识目录，不因paper cut主观评价直接晋升confirmed |
| Pack发现机制 | CE resolver支持本地/Git source、固定ref、cache、error/warning、symlink containment；所有7副本应byte-identical的CE测试明确断言 | **暂不直接引入。** 737行resolver、远程fetch/cache、双层配置和新registry超出本地此能力最小机制 | 分支ref缓存不会刷新，测试明确接受；exit0可带errors。discover可能联网/写cache，不能假称只读；本轮只读实现与测试，未运行 |
| 浏览器执行与效果 | 本地唯一owner exact-origin、合成输入、expected effect、独立cleanup；CE直接agent-browser argv | **保留本地增强。** 吸收条件判断/体验观察而非第二浏览器路径、自动commit、无授权fix | 本地test-browser入口明确origin不证明branch身份；缺provider/conformance如实not_supported |
| 服务器身份 | 本地phases:100与CE均“port已监听就reuse”；后面browser owner只接受origin不核served HEAD | **建议补source绑定事实。** 启动/复用前记录server归属和所服务checkout/构建身份；无法核对则降级当前源码通过claim | 已确认caller与callee边界均无这一保证，不是exact-origin缺陷；尚未构造真实server反例，不称独立验证缺陷 |
| resume与新鲜度 | 本地phases:17按branch-slug找报告，Pass/Fixed/Skipped保留done；报告有base/head字段但resume未要求重新比对；CE等价 | **建议优先补核。** 比较当前base/head和dirty相关内容，重核受变更影响的rows；缺身份只作历史线索 | 不要求所有旧rows一律重测；保持terminal blocker，不伪造旧截图为当前证据 |
| 修复与完成边界 | 本地fix/commit/landing独立且suite unavailable不可passed；CE默认fix/commit，双方保持suite红则not-ready | **保留本地设计。** 已授权的fix持续有效，外部human leg可阻塞单scenario并继续其他项 | phases:113“pause ask”与pipeline human-only Skip需caller统一为Blocked并保存原因，不能把Skip视Pass；未运行真实host |
| eval是否证明owner gate | local owner case以纯API且main模拟owner缺失，但没有移除owner工具；judge以runtime词或stop词OR过；trunk judge也是词表 | **建议结果eval。** 非trunk明确owner缺失注入，记录零browser calls、零产品写；trunk单独验证早退 | API无UI不等owner不可用，main先拒绝会掩盖目标gate；无需为了改能力数量引入新schema |

## 收敛建议

先把criteria来源/覆盖与stale-rule处理加入现有flow/matrix/report，再补resume source身份和server绑定；最后加强结果导向eval。继续保留本地授权、PR identity、唯一browser owner与not-ready边界。Pack远程分发只有出现真实复用需求及独立权限/新鲜度合同后再评估。

本项是源码比较完成；没有融合实施、fresh-source模型行为评测、真实浏览器或独立reviewer证据。直接callee文件已审不等于test-browser全包完成，其脚本另逐项审读。
