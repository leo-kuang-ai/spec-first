# spec-polish 全量源码对照审查

- 状态：`source_review_complete`，只代表源码比较和融合裁定；未实施产品修改。
- 两方包内47个文本文件、6825行全部全文审读：入口、所有reference、八类启动recipe、四个共用辅助脚本、本地eval/fixture、CE detect-riffrec及完整2841行live-endpoint。同hash共用reader/package-manager已核对；逐文件账见 `../file-tables/spec-polish.md`。
- 本地source：`skills/spec-polish/`；CE source：`/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-polish/`。无真实浏览器、服务、语音、外发、安装、提交或远程端点操作。

## 意图与双方执行链

共同目标是将用户亲自使用页面时的反馈转为范围明确的polish编辑。传统路径为workspace→启动事实元组→服务归属/可达验证→用户反馈迭代→核验与收尾。本地深度优化集中在授权分离、启动事实保真和自动浏览器单owner；CE新增页面内语音/标注→unit→checkpoint batch→agent→durable board实时路径，不能视为传统路径的免费替换。

本地已保留并增强launch.json、框架/子项目、package manager和port cascade。应补局部一致性，先借鉴反馈与恢复语义，不整体迁入实时runtime。

## 能力对照与融合裁定

| 研发能力 | CE源码事实 | spec-first源码事实 | 裁定与最小融合 | 验证与成本 |
| --- | --- | --- | --- | --- |
| 保真启动实际项目 | run与全部recipes、四个scripts提供主要启动能力 | `run.md:20-47`冻结command/cwd/env/port，仅派生缺失事实；classifier物理containment且按所选cwd定位 | 保留本地增强，不用猜测覆盖配置；resolver结果仍需caller字段校验 | 已跑3个port、3个classifier fixture测试；未启动真实框架 |
| 复用服务不误伤进程 | helper`:489-543`检查PID ownership，unknown拒绝信号 | `run.md:51-59`核验project/command/cwd，区分reused/run-owned，actual URL可修正 | 保留本地传统流程；未来长期helper可借whole argv ownership及unknown fail-closed，不仅凭PID/basename | 中；未向真实服务发信号 |
| 反馈处理中断恢复 | `live-loop.md:24-28,87`、helper`:756-768,999-1016,1267-1307,2498-2545`：批次重投/持久确认分离，ack后unit仍在board，结束reconcile | `SKILL.md:61-67`是对话循环与紧凑收尾，无逐反馈durable record | **建议吸收协议**：有价值反馈记录statement、route/anchor、范围、结果和验证ref；恢复先查欠账，收尾给residual。复用run artifact，不新增中央状态机 | 低至中；在处理前/后/记录前中断验证。状态词不等于真实完成 |
| 编辑后页面失联 | loop`:77-79`、helper`:1590-1664`：应用后观察连接，失联恢复/回滚并blocked | 仅明确启动时reachability，循环hot reload无健康检查责任 | 吸收轻量反馈：必要时验证原目标可用；只恢复本次编辑，不能安全恢复则留residual；自动检查仍归browser owner | 不迁入SSE/timer服务；HTTP200不足以证明交互可用 |
| 小修改/澄清/上游决策 | loop`:55-73`有clear/ambiguous/beyond-polish、重复标注合并与residual | 本地已排除broad audit/requirements/planning，缺具体交接产物 | 吸收分类与带anchors的residual，携当前事实/限制回work或plan；保留LLM判断 | 低；模糊颜色、多元素、设计变更、重复标注任务 |
| 浏览器与隐私边界 | page/agent双token、精确CORS、private files、body/disk caps、secret scan、受限frame replay | 入口`:64`把exact-origin/effects/synthetic-input/private-evidence/cleanup交test-browser | **保留单owner**；服务保护仅在真引入服务时复用，不能替代外发授权。非loopback actual URL显式human-only或setup原因 | browser合同按当前hash复用；无真实浏览器/语音 |
| 实时工具持续会话 | install修改React项目、npm依赖和setup commit；helper mint OpenAI secret、接archive、replay到另endpoint | 无此产品面，传统loop覆盖更广框架；commit/landing独立授权 | **暂缓整体移入**；真实需求、React依赖/成本/数据流/egress和维护owner明确后做独立opt-in实验 | 高；菜单、配置、页面内容或API key存在不产生新增授权 |
| 自动应用与收尾 | Instant歧义best reading、默认并行；传统/live默认commit；页面compound unit转知识流程 | `SKILL.md:38-53,65-67`授权非传递，done不授权commit，仅run-owned verified paths | **保留本地边界**；不迁入默认commit、猜测编辑、自动知识提升、默认并行；页面材料始终untrusted | 静态授权合同通过；无独立模型行为验证 |

## 已复现问题与源码冲突

证据：`../polish-boundary-probe.py`、`../polish-boundary-probe.json`。仅自动清理的临时Git fixture，无服务或外发。PL01–PL07两方结果一致，CE当前版本不能直接修复这些共有问题。

1. **P2：缺参数值可使resolver不结束。** 两方 `resolve-port.sh:53-70`的`shift 2`失败后参数未前进，且没有set -e。PL04四个子进程均0.5秒超时终止。解析前验证数量、未知选项和数值；正常caller提供值时不触发，不能泛化所有启动卡住。
2. **P2：launch reader违反单配置/错误哨兵合同。** `read-launch-json.sh:61-86`不验证configurations数组或名字唯一。PL01指定不存在名仍返回唯一dev；PL02重名输出两个JSON行；PL03字符串返回MULTIPLE无名字数组，jq报错但exit0。验证数组/entry、先遵守显式选择、拒绝非唯一匹配。caller仍拒绝不可用字段，未声称已错误启动真实项目。
3. **P2：port regex把注释当事实。** PL05对注释4999后实际server.port4300输出4999；framework-config同组也未按具体框架限制文件。返回带来源的候选，不可靠解析交caller确认，避免执行任意配置。actual attribution/collision保护不等于解析正确。
4. **P2：Procfile-only分类与recipe不一致。** PL07输出procfile，Procfile.dev不存在；recipe`:7`接纳两者，`:15,21,46`固定`-f Procfile.dev`。按存在且已确认用途的真实文件派生元组，不能保存不存在模板。
5. **低优先候选：组合签名多义。** PL06 Astro+Vite输出multiple，recipe却声称Astro primary signature；SvelteKit+Vite同类结构。保留真正多app选择，对框架正常配套配置用有据优先关系，不将所有multiple视为错。
6. **本地人工/自动目标边界需明确。** run`:55`认可HTTPS或修正URL，入口`:64`固定verified-loopback-origin。自动owner仅支持loopback时显式human-only，不把可用人工页面一起判不可polish。
7. **服务收尾处置不足。** 本地closeout未明确run-owned/reused server是否仍运行、日志位置/期限；CE明确still-running app URL。建议报告处置，不擅自停复用服务。

## CE新扩展自身限制

- live-start`:22,75`还说GitHub commit pin，install-riffrec实际npm `^2.2.1`。detect-riffrec对installed/live_build独立探针可保留，声明不是事实。
- live-start`:49`笼统说未stop就resume；helper`:1282-1283`仅未结束或仍欠账的ended会恢复，ended+drained mint新token。stream contract`:108`更准确，应统一。
- stream contract`:68`表缺working，helper接受且loop依赖；resume分支loop`:28`只明说triaging/accepted，working后中断责任需明确。
- 多文件同步写/异常回滚**不等于crash原子性**。stream contract`:135-144`承认窗口；“几微秒”及可接受后果是CE声明，本轮没有测量或故障验证。
- key不经过页面的文案与helper`:2240`接受page header key不同；不要因实现支持就提供默认路径。Replay也是额外外发，token/目标授权需独立处理。

## 验证与最小落地顺序

实际4 suites/19 tests通过：resolve-port-script、spec-polish-project-type、mutation-authority-contracts、specialized-skill-calibration-contracts。证据 `../polish-tests.json`、`../polish-tests.log`。port/classifier是临时fixture行为，授权/文案多数为静态合同，无现有eval真实模型/宿主执行。两个eval仅检查输出含spec-code-review，不能证明启动、反馈、编辑或浏览器质量；fixture是API demo，没有页面。

先修共有helper输入和Procfile事实选择，再在现有loop补反馈/验证/residual及服务处置；最后用真实任务评估恢复。语音和远程runtime独立延后，不加默认依赖或workflow engine。无真实host/模型对照，不宣称效率提升。
