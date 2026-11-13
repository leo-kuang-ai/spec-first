<!-- model: glm-5.3 via Claude Code 2.1.311, isolated HOME, tools Read/Grep/Glob, turns 20, input 51034, cache_read 271232, output 8658 -->

逐题复核结论（只读，未改动任何文件）：

**Q1 — 部分成立**
① SKILL.md:16 将无关问题路由到 `using-spec-first` 入口（spec-plan 等），:114 仅说“仅需诊断时使用 `--check`”，未针对无关问题指定某个 setup 模式。② mode-policy.cjs:142-143 使 bare 复用 `only` 动作集（27-32 行）：install-tools、write-host-config、provider-mutation、write-setup-facts，全部为 mutation（6-8 行的只读 bare 是死条目）。③ 不成立：SKILL.md:90/110/114/147 均定义 bare 为“自主安装收敛”入口，通篇无“用户未请求安装/修复时不得 bare 调用”的表述。

**Q2 — 不一致（该不一致成立）**
human-output.cjs:78 称“仅需**只读复核**时使用 --verify-only”，将其表述为只读；而 SKILL.md:115/144 定义 `--verify-only` 为 facts-only **mutation** 模式，可写 setup-owned facts、scenario fingerprint 与 ledger；evals/README.md:8 亦确认“允许写 setup-owned facts，不能冒充严格只读”。两者矛盾。

**Q3 — 判定过宽**
check-not-setup-scope.sh:4-12 的通过条件：`EVAL_FINAL_MESSAGE` 非空，且含任一关键词（不属于/超出/setup/职责/边界/不是本/范围/scope/spec-/建议）。若先 bare 调用再完成完整架构评审，最终输出几乎必含"setup""spec-"（如 spec-runtime-setup 字样）或“建议”，仍判**通过**——脚本只做关键词正向匹配，无“未做深度分析”的反向校验，属可误报的宽松判定。

**Q4 — 不一致，且事实依据失效**
顶部提示（AGENTS-top.md:10-11）建议先零指导 baseline、出错才加载 skill；入口治理块（AGENTS-top.md:14-15）却要求实质性工作前必须加载 `using-spec-first`，两者方向相反。report-20260820-line3.md:1 的 2026-09-20 勘误明确“零指导”“无差异”等结论不应直接用于当前决策：复算数据不同、无支持显著性的统计检验、两个 spec arm 仅追加各自 SKILL.md。故顶部提示的依据不再成立。

**Q5 — 不成立**
检索范围：`spec-plan/SKILL.md` 全文及 `references/` 全部文件（含 `agents/` 子目录），关键词含 依赖/dependency/package/npm/版本/version/来源/provenance/等价/equivalent/install，并抽读了命中的省略长行。最接近的仅有：planning-evidence-boundaries.md:39-81（项目**内** capability 的 reuse/extend/compose/new 盘点）、deepening-workflow.md:93（外部依赖假设须写明）、security-sentinel.md:61（既有依赖漏洞清单）。无任何“新增外部依赖包须核实存在性/来源/版本或检查项目内等价依赖”的要求。
