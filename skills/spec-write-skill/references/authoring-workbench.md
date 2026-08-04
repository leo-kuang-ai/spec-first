# Authoring Workbench

只有完成 qualification、确认单一 project-owned source owner，且 `base_operation=create|revise`、`effect=apply` 后才读取本 reference。它是本轮 preview/closeout 的 Markdown semantic envelope，不是持久 schema、通用 Skill IR 或 scaffold writer。

## Tier A Short Path

仅当 revision 限于 typo、计数、metadata/术语修正、明确不可达内容删除或等价结构整理，且不改变 trigger、schema、contract、threshold、gate、roster 或 model routing，才可以跳过本 reference 的 Design Record 与 pre-patch eval plan。仍必须确认 owner、当前授权覆盖 exact write set，生成并验证 mutation preview/write-set binding，并运行最窄结构验证。任一承重行为变化立即回到完整 authoring path。

## Minimum Design Record

在大量正文写入前，以最小必要格式记录 `Skill Design Record`：recurring job 与用户可见 outcome、真实 inputs、required outputs/consumer、positive 与 negative/near-neighbor、source owner、authority/side effects、主要 failure mode、first verification target 与 invalidation condition。复用已经确认的事实，不为表格完整性重复抄写；未知项标成风险或问题，不用想象填补。

只有出现多个 capability owner/consumer/runtime carrier、资源抽取/删除/新增取舍，或高风险/TCO 决策时，才展开 `Desired Capability Map`。只保留会改变决策的列，可从 `capability | owner | consumer | risk | source/runtime carrier | gate/eval | protected behavior | TCO | disposition` 中选择；需要 disposition 时使用 `keep|extract|remove|add`。没有这些信号时不创建 map，也不输出 `not_applicable` 仪式性占位。脚本不解析该记录、更不能替人决定。

## Shape And Module Decision

只有 shape 会改变 resource placement、eval family 或 architecture 时，才显式记录 Skill shape 与 supporting facts；否则采用能解释当前 patch 的最简单形态并继续。可选形态包括 entry governor、knowledge/reference、deterministic setup/validation、artifact-producing workflow、prose/agentic workflow、long-horizon loop 或 multi-agent/hybrid；它们是决策辅助，不是脚本 enum。

multi-agent/hybrid 先做 ArchitectureFit：独立子问题是否有不同证据方向、是否能合并、协调开销是否小于可信收益、是否仍保有单一 owner。任何一项不充分时，采用 single-agent + 按需 specialist；不要按用户给出的 agent 数量创建固定 roster。

当 module/resource placement 确实改变时，再分配 `SKILL.md` spine、triggered references、deterministic scripts、output assets、maintainer-only evals、target sidecar 和 project governance。Context topology、measurement、optimization 与 lifecycle 只有在对应信号存在时加载；不会影响 consumer、风险或交付的未选项无需逐项记录。

## Eval And Topology Preview

full apply 在 source patch 前先按 `evaluation-design.md` 形成最小 eval plan。create 至少有 positive、negative/near-neighbor、主要 failure/adversarial 三例；revise 固定旧版 protected behavior 与 before baseline，不能按候选实现反向编写。每个承重行为给出 `protected_behavior → source carrier → contract assertion → semantic eval case`；没有新增 assertion 或 semantic case 时，旧测试全绿不构成覆盖。

只有文件集合、resource placement 或 runtime carrier 发生变化时才展开 package topology preview，区分 spine、triggered references、scripts、assets、maintainer-only evals、target sidecar 与 project governance；单文件 revise 只需报告 changed surfaces。新增或变更的 runtime reference 仍要记录 consumer、trigger condition、must-read、fallback 与 eval case；未满足时不得声称 runtime closure。

## Preview Handoff

把语义 preview 与私有 manifest 分开。manifest 只承载 canonical/authorized root、snapshot、would-change（path、before hash、after hash、collision disposition）、preserve/generated/not-touch、planned side effects 和 residual risks；不要把 Design Record 正文写入 machine contract。snapshot 至少覆盖 canonical `SKILL.md`、所有已存在的声明路径，以及新文件最近现存父目录的 entry hash。宿主 scope 还要给出 preview-time dirty paths；任何将被改写的 dirty path 必须在 manifest 中逐项记录 current hash、replace/preserve disposition，并说明当前请求已明确覆盖该替换或取得重新确认。

在宿主创建的私有临时目录中，以 `0700` directory、`0600` exclusive-create file 保存 run-local manifest/scope/write-set。调用：

```bash
node "$SKILL_DIR/scripts/validate-authoring-preview.cjs" <manifest.json> \
  --authorized-root <confirmed-root> --allowed-paths <scope.json> --write-set <write-set.json> --json
```

脚本只验证结构、hash、containment、snapshot、collision、scope 与 write-set binding。`authorization_claim` 只是结构字段；宿主必须确认 exact write set 仍在当前授权内，仅在 root/scope 扩大、未覆盖的 dirty overwrite 或新增 external/network/高风险副作用时重新确认。只有通过且宿主能使用原子 conditional patch primitive（expected-old-hash / expected-nonexistence，拒绝 symlink/ancestor substitution）时才可写 canonical source。缺少该 primitive 或精确 pre-write binding 时 mutation readiness 是 `not-ready`，停止 apply；不得用最终 recheck 或 loud convention 掩盖 TOCTOU。写后 receipt 必须携带该 primitive 产出的实际 changed/unchanged paths，再逐 path 核对 after hash；缺少实际清单不得完成声明。partial failure 报告当前 diff、失败原因和 rollback preview，但不自动回滚。
