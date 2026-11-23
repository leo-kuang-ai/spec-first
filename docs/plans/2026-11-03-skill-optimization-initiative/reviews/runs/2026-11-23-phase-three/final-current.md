# 第三阶段：整改后逐项对账

本账与[四包先行整改](current-review.md)、[共享引用](after-shared.md)、[知识刷新](after-compound.md)、[技能编写](after-write-skill.md)、[运行入口及提供方](after-runtime-surface.md)、[工作区和运行事实](after-runtime-lib.md)合读。当前 269 个路径，相对冻结范围的 129 项差异各登记一次（127 项包或共享源文件、2 项回归产生的本机缓存）。表内路径相对各包。工具核对增删改、执行位和字节身份；中文判断由审阅者记录，不能由散列值推出。快照 SHA-256：`8e70bc35d5fb3b71fdc166445c7f97419bc8b2f3ca63479860ccb2f634bcc0ff`。

## spec-sweep

| 文件 | 变更 | 判断 |
|---|---|---|
| `evals/cases/headless-first-run-stops.yaml` | 改 | 未配置且没有操作员时，只收正确停止状态；即使答复正确，误写配置或反馈计划也拒绝。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 改 | 夹具的请求与服务器分工改为真实的两项手填字段，不用虚构输入解释反馈。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 删 | 此用例要求停止，不要求提问；无消费者的问号判据不能证明停止。 |
| `references/interview.md` | 改 | 授权值要按原样确认，区分连接器用到的值和本机配置的可见范围。 |
| `references/plan-template.md` | 改 | 首屏交代实际覆盖、已验证关闭项、遗漏来源和下一步决策，不把未读取说成没有反馈。 |
| `references/run.md` | 改 | 已有标签无法确认是本身份添加时，保留游标，等待对账；重复添加不是归属证据。 |
| `references/sources/github-issues.md` | 改 | 分别确认仓库读取能力、写权限及已有确认的身份。不向真实工单写入以探测权限。 |
| `references/state-schema.md` | 改 | 统计必须是 JSON 对象，错误状态及旧回执保留与实际实现一致。 |
| `scripts/analyze_riffrec_zip.py` | 改 | 同字节分发反馈分析器，事件有时点但无可用截图时，不再给调查者发送无效查看指示。 |
| `scripts/sweep-state.py` | 改 | 解析统计出错或值不是对象时返回拒绝，不能用空统计覆盖上次记录。 |
| `scripts/__pycache__/sweep-state.cpython-312.pyc` | 改 | 回归导入模块后从 38363 变为 38529 字节。按当前绝对源路径、文件头时间戳和大小内存重建，全部字节一致。本机派生差异，不提交。 |

## spec-riffrec-feedback-analysis

| 文件 | 变更 | 判断 |
|---|---|---|
| `evals/cases/generic-audio-not-triggered.yaml` | 改 | 普通会议录音只选通用转写；恢复错选及双选的可证伪性。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 删 | 问号与录音归属无关，既无消费者也不能判定路由。 |
| `evals/fixtures/scripts/check-generic-refused.sh` | 删 | 移除会误收仅提到产品名的词表，更换为夹具内的明确选择。 |
| `references/quick-bug-report.md` | 改 | 快速报告也要读取分析回执，不能从截图缺失反推没有故障。 |
| `references/spec-first-feedback-format.md` | 改 | 用可观察影响、待评估影响、明确期望、推断或未知替换预填严重度及凭空的行为义务。 |
| `scripts/analyze_riffrec_zip.py` | 改 | 由实际数据决定是否引导看图；含源路径的清单默认私密，不能仅凭生成成功建议提交。 |
| `scripts/__pycache__/analyze_riffrec_zip.cpython-312.pyc` | 改 | 导入测试改写了原有缓存，从 79897 变为 80024 字节；用当前源码进行相同内存重建，全字节一致。最终运行禁写字节码并在测试后复查快照。 |

## spec-runtime-setup

| 文件 | 变更 | 判断 |
|---|---|---|
| `scripts/lib/preflight.cjs` | 改 | L11：保留本地配置无效状态及具体恢复指示；文件已存在时继续反映忽略规则。 |
| `scripts/lib/human-output.cjs` | 改 | L11：无效配置先交给用户修正，不能和“继续下一工作流”同时显示。 |
| `scripts/lib/project-config.cjs` | 改 | L12：用 Git 实际判定忽略是否生效。已跟踪、被明确重新纳入或无法核对的配置不盲改，普通新增仍读回确认。 |
| `scripts/lib/configured-dependencies.cjs` | 改 | L13：配置文档形状不对时保留错误并扫描其他源；禁止的命令是策略，不产生安装要求。 |
| `scripts/lib/workspace-child-hook.cjs` | 改 | L14：移除受管段时保留用户脚本当前权限，不把仅所有者可读执行的钩子改为全员可读执行。 |
| `scripts/lib/toml-section-editor.cjs` | 改 | L15：映射顺序不决定配置漂移；命令参数数组换序仍是变更。 |
| `scripts/lib/workspace-async-refresh.cjs` | 改 | L16：只有布尔回执确认成功与失败；不能因为字符串非空就报告刷新成功。 |
| `setup-registry.schema.json` | 改 | 四个平台引用同一互斥定义，安装只能由注册表命令或提供方命令之一负责；不改变现有合法条目的格式。 |
| `scripts/lib/registry.cjs` | 改 | 内置加载器实际执行并遍历 `oneOf` 方言，不仅在外部 schema 中描述互斥。四个平台各验证单一命令、仅展示、两者同时存在和均不存在。 |

## 验证边界

[独立试读及两份样张](reader-check.md)固定了试读时的三份源文件摘要。依据试读修订新反馈计划的首屏顺序，旧计划原位更新、不移动人工笔记；短报改为确有事件即可引用，不要求补写预期、时间戳、引语或截图。试读本身不是对修订后版本的二次签收。

`tests/unit/runtime-setup-local-state-regression.test.js` 使用临时 Git 仓和普通配置逐条检查 L11–L16。`replay.cjs` 同时向本地判题器传递答复与真实夹具目录，校准拒绝条件，不生成模型答复。两个反馈分析器的实际合成输入输出与失败不改旧状态由 `spec-riffrec-evidence-coverage`、`sweep-state-safety` 校验。工具能力、文件落盘、模型语义、真实读者是否看懂是四类不同的证据。
