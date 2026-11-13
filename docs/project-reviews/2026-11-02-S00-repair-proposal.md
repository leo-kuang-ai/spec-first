# S00 修复方案与实施结论

日期：2026-11-02。入口：spec-debug。用户已以“思考,按建议进行修复”确认实施；当前已完成限定源码修复及本地验证。以审查报告第2节S00列出的F-S00-01、F-S00-03、F-S00-04为本次范围；其他项不自动扩张。下文问题证据与方案保留实施前记录，实施结果见末节。

## 当前问题与证据

| 问题 | 当前证据与影响 | 修复建议 |
|---|---|---|
| F-S00-01：把写facts说成只读 | `skills/spec-runtime-setup/scripts/lib/human-output.cjs`的`diagnosticNextActions`在runtime未就绪时输出“仅需只读复核时使用 --verify-only”。本轮直接调用纯函数复现；`mode-policy.cjs`的verify动作含`write-setup-facts`。用户按建议执行可能产生预期外本地事实写入。 | 只读检查明确指向`--check`；`--verify-only`明确标为“验证并刷新setup-owned facts”。检查同函数其他建议，统一副作用表述，保留原模式功能。 |
| F-S00-03：请求意图与模式选择顺序不一致 | 正文已有“仅需诊断时使用 --check”，因此历史“完全没有写明”不准确；但Default Diagnostic Flow第2步仍先要求执行裸命令，第4步才处理安装请求/预览。Setup Posture还说subset授权隐含在flag本身。普通架构问题可能因Skill被加载而走安装路径；历史M1被宿主表面门拦截，未证实真实越权安装。 | 在Explore/执行命令前明确三种意图：纯语义问题返回适当owner且不跑setup；诊断请求只用`--check`；当前用户明确请求setup/安装/修复时，依既有目标和授权先plan再执行对应mode。模型自己拼出的flag不产生授权；当前用户显式给定的命令/参数按其实际范围承接。保留明确授权的单项目bare安装语义，不把CLI默认强改成只读，不新增确认轮次或语义路由脚本。 |
| F-S00-04：评测只看关键词 | `evals/fixtures/scripts/check-not-setup-scope.sh`只要回答含setup、建议、spec-等任一词就exit0。本轮输入“我运行了 setup 安装并修改了配置，随后完成架构分析。”仍exit0，证明反例被错判。 | 拆分确定性与语义判据：脚本核验退出状态、fixture/配置哨兵及可用的真实工具轨迹，禁止setup执行和安装写入；缺轨迹不得称行为通过。由独立语义核查判断是否正确说明职责并移交，而非做完整架构分析。先核实skill-up实际提供的轨迹/产物字段，使用已有证据适配，不虚构环境变量，不新建评测框架。 |

## 实施顺序与验收

1. F-S00-01：先新增纯函数回归反例，再修next action。确认`--check`与facts刷新说明正确，模式矩阵行为不变。
2. F-S00-03：修改source `SKILL.md`及直接相关examples，覆盖纯语义、只读诊断、明确安装、明确subset四类输入。检查不把工具可用、Skill加载或生成的参数当授权，不阻挡已授权工作。
3. F-S00-04：改进case和judge，校准“只说边界却执行安装”“先跑setup后再移交”“只做语义移交不执行setup”等正反例；旧M1有可用完整轨迹时重放，无轨迹时只承认文本判据校准。fresh-source语义检查需说明工具及证据上限，结构测试不能当真实模型验收。
4. 运行最窄renderer/mode与eval-judge回归；更新报告S00修复结论，逐项记录已修/未验证/残留。模型行为回归若另需费用，先明确新用途及预算，不挪用审查批次剩余额度。

预计涉及：`skills/spec-runtime-setup/SKILL.md`、`scripts/lib/human-output.cjs`、`evals`内相关case/judge/examples，既有`tests/unit/mcp-setup-facts-renderer.test.js`与`runtime-setup-eval-judge.test.js`及必要聚焦测试；同步CHANGELOG/用户文档。具体路径由实际轨迹协议核对收敛。

## 范围边界

不修改CLI裸调用契约、不把自然语言授权判断交给脚本，不添加全局审批状态机；本轮方案不包含F-S00-02（探针缓存说明）、F-S00-05（版本细节整理）及后补CodeGraph文档漂移。实施时如三项修复必须触及这些内容，仅说明必要关联，不将旁支问题静默标修复。

只改source，generated runtime不手改；不刷新真实宿主、不安装provider、不commit/push。仅对三项约定范围记录修复结论，不提升其他审查项状态。

## 实施结论（2026-11-02）

| 问题 | 结果 | 验证与限制 |
|---|---|---|
| F-S00-01 | 已修复源码提示：`--check` 为只读检查，`--verify-only` 刷新 facts 有写入 | 直接复现原提示场景与 renderer 回归通过；CLI 模式未改变 |
| F-S00-03 | 已修复意图分类与顺序；纯语义返回 owner、仅诊断用 check、已授权 mutation 先预览；清除两处 flag 即授权表述 | 独立 fresh-source 四场景复核通过；不是实际宿主自主选择行为证据 |
| F-S00-04 | 已移除关键词语义通过；检查夹具、配置哨兵及标准轨迹；缺轨迹、未知/嵌套调用、带执行参数 Skill 均保守拒绝 | 历史误判文本重放已拒绝，正反例测试通过；机械检查通过仍须独立语义审查 |

实际验证：renderer + eval-judge 69 项通过，mode-target + node-contracts 87 项通过，合计 **4 套 156 项**；`skill-up validate` 加载 3 个 case 并通过。保留首次 red（11 failed/55 passed）、中间 green（2 failed/64 passed）和最终 green 日志，不覆盖失败历史。两处中间失败分别为 readiness 专属文案断言耦合、旧提示语预期，已修正。

独立新上下文审查 `/root/s00_fresh_review` 读取当前磁盘 source，发现 content-block 工具事件与 Skill 附加执行参数漏检；补规则与反例后重新读取确认关闭。正文先预览顺序及第二处参数授权表述也已统一。`fresh_source_eval: passed` 仅表示本轮源码语义审查通过，审查者未运行测试或真实 setup。

验证记录见 [修复证据](evidence/S00-spec-runtime-setup/repair-2026-11-02/)。原审查证据和 SHA 清单保持历史版本绑定；本次 source 变更不追溯改写历史模型结论。新增 SHA 清单单独绑定修复后的源码及测试。

### Debug 与修复后质量

- 范围：S00 三项约定问题；人工逐行复核，无额外重构或发布。
- structured run summary：`.spec-first/workflows/spec-debug/spec-first/s00-repair-final/verification-run-summary.json`；可留存副本见上述证据目录。
- honest closeout：`overall=degraded`，`overall_reason_code=degraded-claim`。实际本地检查通过；聚合包含 `real-host-model=not-run`，因此通过声明得到 `run-summary-checks-uncovered`，未运行声明得到 `validation-not-verified`。不宣称完整行为验证通过。
- 尚未执行真实宿主与双模型行为回归；未重放历史模型完整 trace，本轮反例是隔离夹具下的原错误文本重放。未消费新的外部模型评测额度。
- `--check` 的外部探针可能写自身缓存/日志；judge 的固定哨兵不证明全局或瞬时零写入，未知工具只表示需要独立核验。
- generated runtime 未刷新、未手改；未安装 Provider；未 commit/push。F-S00-02/F-S00-05 及其他 S 编号不在本次修复结论内。
