tested_definition: runtime-mirror（source 真相源 `skills/autoresearch/SKILL.md` 在本仓库不存在，仅运行时镜像一份，无 diff 可做）

---

## 运行总结 — Classic 指标循环 `[autoresearch] mode: classic`

| 项 | 值 |
|---|---|
| 总迭代 | 3 / 3（达到上限退出，status: BOUNDED） |
| keep / discard / crash | 3 / 0 / 0 |
| 指标（通过测试数） | **0 → 37**（`# tests 37, # pass 37, # fail 0`，冻结 Verify 连续两次复核稳定） |
| 基线 | 0（仓库原本无 `package.json`，`npm test` 零输出、exit 254，原始输出已留存） |

**各迭代贡献（全部 keep，候选未提交）：**
1. **0 → 12**：脚手架（package.json + `scripts/run-tests.sh`）+ `src/stats.js`（sum/mean/median/percentile，空输入显式抛错、不改调用方数组、p50↔median 交叉验证）+ 12 个行为测试。
2. **12 → 25**：`src/strings.js`（slugify NFKD 去变音符/truncate/toCamelCase/titleCase）+ 13 个测试。中途修了两个真缺陷：正则字面量语法错、`truncate` 多字符后缀超出预算的 bug（`repeat`→`slice`）；一处误标定的期望按 lodash 式标准契约校正，断言净增强。
3. **25 → 37**：`src/collections.js`（chunk/unique(SameValueZero)/groupBy/可注入 RNG 的 Fisher–Yates shuffle）+ 12 个测试，含确定性洗牌、排列性质、非突变断言。

**协议要点留痕：**
- **测量修复（迭代前）**：node:test 的 `# pass` 位于 TAP 倒数第 6 行，会被 `tail -5` 切除——测试入口脚本末尾从真实 TAP 输出 grep 提取统计行重印（非硬编码，退出码透传），使真实通过数可经冻结信道读取。
- **作弊路径已拒绝**：无 echo 假计数、无空断言测试、无删除/弱化失败测试；每个通过计数对应真实代码上的真实行为断言。
- **局限**：未配 Guard；无留出集与噪声标定（结尾双次复核仅作稳定性确认）；基线为 0，相对增益百分比无定义，只报绝对增量 +37。
- **Git 所有权**：候选全部保持未提交；既有未跟踪文件（`.claude/`、`README.md`）原样未动。

日志与交付物在 `autoresearch/autoresearch-261112-1508-16c1/`（`results.tsv`、`handoff.json`）。无 `--chain`，流程到此结束；未做任何提交/推送（ship 类操作永不自动批准）。
