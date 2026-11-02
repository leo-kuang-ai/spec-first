# S00 workspace graph 与 provider currentness 补审

日期：2026-11-02。证据类型：源码静态审查与既有测试断言阅读。继承主审上下文，不是盲评；不作新增行为、真实 provider、真实宿主或付费模型验证。只新增此证据文件，不改被审 source 或主报告。

## 结论

在本次指定的 freshness、生命周期与最终出口范围内，未发现新增高置信的关键能力缺口。不能把图存在、历史 query_verified 或历史事实时间戳等同于当前可用性；源码已经存在对应降级与重核机制。该结论是设计机制判断，不代表真实 Graphify/CodeGraph、并发恢复或 Windows 效果已验证。

1. `workspace-graph-status.cjs` 是消费侧检查，不调用 provider 建图。ready 同时依赖各 child 图、合并图、state、hook、routing、确认的 repo 集合；pending confirmation、async in-flight/failed、lifecycle busy/abandoned/cleanup residue 可降为 partial。检查前后两次 lifecycle 观测降低并发读到旧 ready 的风险，但不宣称持有全局文件系统读锁。
2. 状态不是仅看 Git HEAD：state 对比 HEAD 与 worktree 字节指纹，untracked 内容和 symlink target 均进入指纹；构建前后 source 不一致使最终 receipt 为 partial。merged artifact 校验路径、大小、mtime、inode/dev 与内容摘要；廉价 gate 已失败时可跳过 hash，避免无谓大文件成本。源码检查的范围不等于检索召回或关系语义正确性。
3. build/clean/async 共用 `.spec-first/` lifecycle lease；token、PID 与 start marker 校验阻止活跃 owner 被按年龄抢锁，未知进程身份 fail closed。继承者不能 release；隔离旧锁后对照 snapshot，恢复采用 no-clobber。build、clean 和 async 出口有 release 失败降级/保留诊断机制，不能因为 provider 命令成功就声明整个 lifecycle 完成。
4. doctor 的当前身份消费者已接通：`computeDecisionInputHealth` 调用 source 比对、provider identity 比对与 Graphify receipt/CodeGraph artifact evidence。CodeGraph 查询证据同时绑定 7 天 TTL、repo root、安装身份、source 内容、DB/WAL/journal 摘要。缺失、过期、已变和无法读取分别降级，不静默维持 fresh。
5. Graphify 当前 receipt 比对 scope、artifact root、graph SHA-256 与 source；安装身份包含 package/version/command/interpreter/installer/inventory。CodeGraph identity 在 version probe 前后重核 inventory。此处确认调用与判据存在，不声称读完所有 Python/npm launcher 解析算法或执行了真实二进制。

## 文档漂移候选

`docs/contracts/project-graph-consumption.md` 的“Setup facts 来源快照”仍称 **CodeGraph database currentness 的闭环仍未完成**。当前 `setup-facts.js:636–646,665–668` 与 `codegraph-artifact-evidence.cjs` 已有实际消费者和比较逻辑，故该文字不能再作为能力缺口证据。建议后续文档修正时描述当前 bounded DB/source/identity 验证及真实运行限制；本次审查不修改被审合同。此项是可定位的文档与源码不一致，未提升为 P0/P1 或真实行为缺陷。

## 已核对的测试断言

阅读 `mcp-setup-workspace-graph-status.test.js` 的实际断言：fakeExec 完成构建后 ready；父目录不猜默认 child；negative_authority=false；promotion cleanup pending 保留；首次检查后新 writer 出现则 partial；dirty 内容变化即使 porcelain 路径不变也 stale；state 写入前 source 变化则 partial；合并图变化、subgraph 丢失与外部 symlink 不得 ready。fakeExec 是 fixture，不能据此声称 provider 真实语义或本轮测试通过。本轮没有运行测试。

## 覆盖边界与真正剩余项

这份证据闭合主审指定的 workspace status、共享 lifecycle lease、最终状态降级出口与 doctor currentness 消费者补读。与主审已读 path-safety、regular-file-publication、source-snapshot 共享，不重复审读。

未全读 workspace build/merge 的 provider 算法、async trigger/coalescing 的全部内部实现、Python/npm 全部安装与 launcher 搜索链：它们超出本次 freshness/出口语义判断，不支持对其实现无缺陷的结论。需要评判 provider 生成准确性、大仓性能、所有竞争时序或全部宿主兼容性时，须增加专门实测；本次不能借必要出口已审提升为这些能力已验证。

S00 剩余静态闭合由主审结合另一份 `final-S00-config-review.md` 与原 analysis 阅读清单统一判断。本证据本身没有发现必须先扩大源码审查才能保留上述有限结论的关键未知引用。整体 22 项是否完成及 S06/S07 行为缺口不由此证据关闭。

## 阅读清单与内容绑定

以下 SHA-256 绑定本次磁盘内容；范围列区分全文、片段与检索。hash 不是内容备份，不证明执行结果。

| 路径 | 阅读范围 | SHA-256 |
|---|---|---|
| `skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs` | 1–563（全文，1–205 为压缩前已读） | `a9028493bf8cb523ef8ca523df41931c42b837238a08d22092f334cbed6112bd` |
| `skills/spec-runtime-setup/scripts/lib/workspace-graph-state.cjs` | 1–238（全文） | `43d1f529973677bc74f3a8fb382041cee6ba63284b9b09ea47d57f62cd2f01d2` |
| `skills/spec-runtime-setup/scripts/lib/workspace-graph-lifecycle-lease.cjs` | 1–634（全文） | `aada47c0d55368df53b6b4090cd894b9b6ff387cc3e1175067dcad787b17c581` |
| `skills/spec-runtime-setup/scripts/lib/workspace-graph-executor.cjs` | 150–264、350–420 | `bd37b82bb0a8e6d9994cbe2c3c520db50b94c78633bad7714c633af0af989874` |
| `skills/spec-runtime-setup/scripts/lib/workspace-graph-clean.cjs` | 40–92；另以符号检索定位 assertOwned 出口，非全文 | `f6cf7744a558755d7a8a753857fd2e5ce091a6c27966dcd8670bd206fa068a53` |
| `skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs` | 746–867；另以符号检索定位 lifecycle 出口，非全文 | `322787ff7efcde66c062c4a9a3bc68e93438280b9f609088130e6dde114c9611` |
| `src/cli/helpers/setup-facts.js` | 274–315、337–417、569–647；665–668 调用链检索，648–770 由主审共享 | `f56a5fd05d0cf5721b15d95103c44a136915e446036065482eca0a9d846bf587` |
| `skills/spec-runtime-setup/scripts/providers/graphify.cjs` | 1091–1255、1348–1415 | `72d8ed5ebd894105d972347e86cc0d88ab60ad9755ae042397d87378739e2dfe` |
| `skills/spec-runtime-setup/scripts/providers/codegraph.cjs` | 123–155 | `332cce29ff1731ebe34be4e5d1d3e456fd0c0990bc90ba6645a5ba92052ea515` |
| `skills/spec-runtime-setup/scripts/providers/codegraph-artifact-evidence.cjs` | 全文 | `6e3c81e0e09d4b0c05d72478ac0c59583dabc79905d4afcb0631dd0a8e43aed2` |
| `tests/unit/mcp-setup-workspace-graph-status.test.js` | 119–222、544–600、671–720 | `6df16f3cdfe9b5f2f24fae81e39e5fc5e8fc82707a6c328cba774e4160cba915` |
| `docs/contracts/project-graph-consumption.md` | 有界阅读：开头到 Target And Artifact Boundary、Workspace 第6/7条及 Setup facts 来源快照；中间输出截断，不称全文 | `b16b3960b52b3ddbda7ae8f1dca7e2514dde4efaa5671e961783a4d34aa6bf04` |
