# 需求澄清单元顺序 Replay 证据

> Artifact type: confirmed（文件/hash/执行顺序）+ advisory（fresh-source semantic judgment）

该目录补齐 U2/U3/U4/U5/U6 的可复核 unit-exit provenance。Replay 从基准 commit `89c732603b0d544bdd2aeb2fd520525c6301a574` 构造隔离副本，按 `U2 → U3 → U4 → U5 → U6` 应用当前实现，并在每个出口保存：

- unit patch 与 patch SHA-256；
- pre/post 路径集合、存在状态、字节数与文件 SHA-256；
- 实际注入 fresh reviewer 的 before/after bundle 内容与 bundle SHA-256；
- 原始 reviewer JSON、presentation order、M1-M7、countermetrics 与 limitations；
- replay final source 与当前工作树 34 个目标 source 的逐字 equivalence 检查。

`final-source-snapshot.json` 固化这 34 个目标 source 的自包含 UTF-8 内容快照，并以分块的 `gzip+base64` payload、manifest SHA-256、压缩体 SHA-256 与解压后 payload SHA-256 形成可复核绑定。它保留原始 source revision 作为 provenance，但验证不再通过 `git log` / `git show` 读取该 revision；因此 squash/rebase、浅克隆或 topic branch 删除不会破坏 fixture replay。

`aggregate.json` 是消费入口。U2-U5 计数 reviewer 为 A、B、G；Reviewer C 因在单一 session 内错误生成内部三重复数组而不计入 matched-repeat gate，但原始文件保留供审计。U6 首轮 finding 促成 direct-bootstrap authority refinement，最终由 D、E、F 三个新的独立 session 复核。

`U6-after-bundle.json` 保留 refinement 前的第一次 replay 结果；最终计数输入是 `U6-after-refined-bundle.json`，并由 `U6-record.json` 的 `after_bundle_file` 指向。前者用于说明 finding 的来源，不进入最终 U6 gate。

总 fresh session accounting 为 16 / 36：历史 baseline/paired/recheck 9，持久 replay A/B/C 3，格式替换 G 1，U6 refinement recheck D/E/F 3。所有计数 case 均 3/3 同方向通过；最终 P0=0、P1=0。

边界：该证据证明 source sequence、source equivalence 与 fresh-source semantic comparison，不是实际用户 transcript 或 field outcome。U4 只支持 helper surface removal、conversation-native closure 与 future-evidence honesty，不证明视觉决策正确性提升。
