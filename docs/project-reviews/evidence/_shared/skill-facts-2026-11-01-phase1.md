# Skill 统计事实

- 采集时间：2026-11-01 16:12:29 +0800
- commit：1aa272a606710407e69b22d0452a34cd9b0d1f8f
- 采集命令：`bash docs/project-reviews/evidence/_shared/collect-skill-facts.sh `

| Skill | skills/ 下未提交改动 | SKILL.md 行数 | SKILL.md SHA-256 | description 字符数 | references Markdown 行数 | 引用其他 .md 的 reference 文件数 | 英文强制措辞（SKILL.md / references） | 中文强制措辞（SKILL.md / references） | 推理外显措辞（全部 .md） | 提及调用策略字段的文件数 | evals 文件数 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| spec-runtime-setup | 0 | 380 | `cb04249d533b` | 174 | 160 | 1 | 0 / 0 | 49 / 3 | 0 | 0 | 14 |
| spec-ideate | 0 | 105 | `dd427fca3e50` | 218 | 2572 | 11 | 0 / 1 | 0 / 0 | 0 | 1 | 12 |
| spec-brainstorm | 0 | 78 | `d3df96643040` | 294 | 2377 | 10 | 0 / 1 | 0 / 0 | 0 | 3 | 13 |
| spec-prd | 0 | 345 | `25cc60f639d8` | 581 | 1910 | 1 | 0 / 0 | 7 / 4 | 0 | 1 | 26 |
| spec-plan | 0 | 123 | `bcc0e89dd04b` | 455 | 5396 | 12 | 1 / 4 | 0 / 4 | 0 | 9 | 48 |
| spec-write-tasks | 0 | 141 | `cdfa20fd18d9` | 535 | 823 | 2 | 0 / 0 | 1 / 6 | 0 | 1 | 18 |
| spec-work | 0 | 126 | `3a192fe50952` | 517 | 1802 | 10 | 0 / 0 | 0 / 38 | 0 | 0 | 38 |
| spec-code-review | 0 | 76 | `c6f93d057756` | 327 | 3331 | 7 | 0 / 2 | 0 / 25 | 0 | 0 | 26 |
| spec-compound | 0 | 61 | `02da78aefef1` | 288 | 1598 | 6 | 0 / 2 | 0 / 0 | 0 | 0 | 22 |
| spec-doc-review | 0 | 74 | `c96d48de5841` | 224 | 2402 | 13 | 0 / 8 | 0 / 17 | 0 | 0 | 19 |
| spec-debug | 0 | 368 | `2a34444a5f6c` | 209 | 650 | 2 | 0 / 0 | 0 / 0 | 0 | 0 | 16 |
| spec-test-browser | 0 | 90 | `bfe3cdc6e964` | 225 | 133 | 1 | 0 / 0 | 0 / 0 | 0 | 0 | 4 |
| spec-test-xcode | 0 | 31 | `e9397a88ddba` | 183 | 70 | 1 | 0 / 0 | 0 / 0 | 0 | 1 | 2 |
| spec-resolve-pr-feedback | 0 | 126 | `594de7ca1be7` | 188 | 678 | 5 | 0 / 0 | 0 / 10 | 0 | 1 | 15 |
| spec-handoff | 0 | 99 | `4bc4a2e1da3a` | 401 | 108 | 0 | 0 / 0 | 0 / 0 | 0 | 0 | 30 |
| spec-compound-refresh | 0 | 164 | `b0a5dccac1b7` | 336 | 1300 | 6 | 0 / 1 | 0 / 0 | 0 | 0 | 6 |
| spec-lfg | 0 | 81 | `6bd097a450c0` | 226 | 674 | 5 | 4 / 0 | 0 / 1 | 0 | 0 | 12 |
| spec-commit | 0 | 126 | `47bc11e7407b` | 172 | 0 | 0 | 0 / 0 | 2 / 0 | 0 | 0 | 9 |
| spec-commit-push-pr | 0 | 132 | `caf7ac9387d1` | 198 | 752 | 3 | 0 / 0 | 0 / 0 | 0 | 0 | 9 |
| spec-worktree | 0 | 156 | `12438f6bff6c` | 176 | 0 | 0 | 0 / 0 | 1 / 0 | 0 | 0 | 14 |
| using-spec-first | 0 | 48 | `21a73e2da3f2` | 431 | 121 | 0 | 0 / 0 | 0 / 0 | 0 | 0 | 8 |
| spec-simplify-code | 0 | 108 | `ed1f1b0d4c19` | 201 | 53 | 0 | 0 / 0 | 2 / 0 | 0 | 0 | 20 |

- 全部 source skill 数：38；description 合计字符数：11905（对照 Codex 在上下文未知时 8,000 字符的初始列表预算，见调研记录 R23）
- SHA-256 只截取前 12 位用于识别版本；作为结论依据的未提交文件须另行记录完整 hash。
- 计数只用于定位检查重点：计数高不等于写得差，计数低也不等于没有问题。
