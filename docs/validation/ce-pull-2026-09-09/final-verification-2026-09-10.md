# CE 129 提交同步补审——最终验证记录（2026-09-10）

## 范围与终态

- 上游窗口 `bbf995a4..153e605e`（129 提交）与任务表 129 行一一对应：行数、SHA 唯一性、集合相等、无重复均已程序化审计通过；每行有「已完成核对」状态、可达证据链接与本轮（或前轮）真实提交归属。
- 本轮（U50–U129，承接 U1–U49）共 89 个提交（41b36fb5..HEAD），238 文件 +19663/-14177；逐项证据位于 `docs/validation/ce-pull-2026-09-09/050-*.md` 至 `129-*.md` 与 `110-129` 各文件。
- 裁决分布：适用且融合（含最小补齐）31 项；已有等价实现经核证成立 21 项；纯文档/测试/发布元数据/宿主设施排除 42 项；产品排除（babysit-pr、CE 专属配置/路由）12 项；**产品面差异记录 3 项**（U122 ce-bakeoff、U127/U128 bakeoff 标注、U129 ce-noslop——均为上游新 public skill，按计划记录为待决策产品面，本窗口不新增重复 public Skill）。

## 最终组合验证（实际命令与结果）

| 命令 | 结果 |
|---|---|
| `npm run typecheck` | 通过（259 files） |
| `npm run lint:skill-entrypoints` | 通过（490 files） |
| `npm run test:unit`（含 shell+Jest） | 2725 passed / 2725 total |
| `npm run test:smoke` | 5 passed / 5 total |
| `npm run test:integration` | 68 passed / 70（2 skipped，既有跳过项） |
| `npm run build`（npm pack --dry-run） | 通过（5922 files，shasum 1c536929…） |

全量 unit 相对 session 起点 41b36fb5 的既有 22 项失败已全部归因并修复：runtime drift（经 `spec-first init` 八宿主重生成 + 锚清单对齐重构后源）、CHANGELOG 历史轮次格式/顺序缺陷、host-neutral 入口声明缺失、冻结哈希未随内容更新、脚本解析指引丢失、doctor 退出码过宽武装、ce-localization 工件陈旧（上游裁定 carry-over 重绑 + 语义 delta + closeout 同态重生成）。无未归因失败。

## 独立只读审查

按授权执行一次 fresh-source 只读审查（独立 subagent，读取磁盘当前源码），五项检查 4 PASS / 1 FAIL：spec-explain 家族的 4 个静态自测节矛盾点（本批 c6b7ffc7 移植不完整）。全部 6 项 actionable findings 已修复并复验（见提交 00f01d6c 及其后）：explainer 双渲染器措辞、SKILL 两处矛盾/悬空引用、orchestration 相位数、CHANGELOG 头部位移、doctor 退出码武装矩阵单测、persona 示例笔误。

## 已知边界与限制（如实披露）

1. **产品面待决策**：ce-bakeoff 与 ce-noslop 两个上游新 skill 未在本窗口引入（见 112/117/119 证据），留待产品决策；兄弟 prose 路由钩子因无本地 noslop 而不落地。
2. **ce-localization closeout 的评审天花板**：本轮语义 delta 与上游裁定重绑为 inline 非独立 carry-over（工件内如实标注 `independent: false`、`inline-same-context`），不声明独立双模型复审；closeout 拓扑校验基线改为录制 inventory（结构上不可能的提交后 HEAD 绑定已在测试内注释说明），保留活体计数守卫。
3. **Windows 行为未实测**：peer-job-runner 的 PID 重用防护（U78/U116）在 macOS 上仅经 `py_compile`、parity 存在性断言与 POSIX 路径实测；Windows ctypes 路径未运行。
4. **已知再生成特性**：`docs/validation/ce-localization/ce-setup-*.json` 在每次全量测试后按当前 HEAD 重绑（无用户内容），属确定性工件已知 churn。
5. 本地源码级验证不冒充真实模型、provider、CI 或现场收益证明。

## 工作树 fingerprint

- 终态 HEAD：见本记录提交后的 `git rev-parse HEAD`（提交本记录后回填于 PR 描述）。
- 工作树在最终验证时 clean（除上述已知 churn 文件随本记录一并提交）。
- 待推送提交：`41b36fb5..HEAD`（89+ 提交，全部归属本计划；无无关工作混入——独立审查确认 diff 仅触及 skills/、docs/、tests/、src/、CHANGELOG）。
