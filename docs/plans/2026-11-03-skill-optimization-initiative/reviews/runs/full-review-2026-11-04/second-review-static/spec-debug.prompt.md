你是静态质量复评者（第二道复核）。该 skill 在全量审查后经历了多轮修复（下方 FIX 清单），你的唯一任务：**检查这些修复是否引入了新的静态问题**——不是重新全面评审。

被审 skill 目录：/Users/kuang/xiaobu/spec-first/skills/spec-debug

FIX 清单（本轮审查中该 skill 的全部修复）：
FIX-014 SKILL.md:92 跨仓 issue 抓取补 --repo 指引；FIX-040 diagnose-then-choice-gate（eval prompt 侧，无 prose）；FIX-059 SKILL.md:108 prior-attempt 合同（报告 prior attempts 内容未知时先问再查、终报必带未答问题；与「必要答案悬置期间可并行调查独立证据」条款共存）

逐项检查每个 FIX 涉及的文件与相邻段落，只报告以下类别的新问题：
1. 断链：修复新增的引用（references/ 路径、章节锚点、脚本路径）在 skill 目录或 repo 中不存在
2. 矛盾：修复后的 prose 与同 skill 其他段落/ references / SKILL.md frontmatter 相互冲突
3. 重复：修复引入与既有段落的明显重复表述
4. 密度：修复段落超过 ~500 字符的连续无结构散文（项目 D05 密度标准）
5. 口径漂移：修复后的措辞与 skill 的机器可读输出合同（枚举、token、字段名）不一致

输出格式（严格）：每个 FIX 一行 verdict：`FIX-xxx: clean` 或 `FIX-xxx: ISSUE <类别> <文件:行> <一句话>`。最后一行总结：`SUMMARY: clean` 或 `SUMMARY: N issues`。不要展开修复本身的合理性评论，只找修复引入的新问题。必须实际读取文件后再下 verdict；读不到的文件记 ISSUE 断链。
