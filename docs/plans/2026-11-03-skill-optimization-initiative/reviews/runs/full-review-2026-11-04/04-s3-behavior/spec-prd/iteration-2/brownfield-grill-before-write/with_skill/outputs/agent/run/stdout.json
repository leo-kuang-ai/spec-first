证据收集完成。现在给出 **Requirement Analysis Gate 映射 + Product Expert Lens 风险排序**（run-local），然后开始逐个 grill。

---

## Phase 1 分析结果

**现状快照（均 confirmed-source，已读全文）**

| 现状项 | 证据 |
| --- | --- |
| 记录结构为 `{id, amount, note, ts}`，**没有分类字段**；`POST /entries` 只取 `{amount, note}`，无校验 | `src/server.js:10-11` |
| README 明确列出已知粗糙点："no categories; no summary view" | `README.md:8` |
| 内存存储、无持久化、无认证、单用户 demo；`ts` 为服务端写入的毫秒时间戳 | `src/server.js:3,11,25` |
| 无测试、无前端 UI，纯 HTTP API（Node.js CommonJS） | `package.json`、`src/server.js` |

**关键矛盾（source 与需求冲突）**：你要"分类占比"，但现有系统根本没有分类概念——这不是汇总逻辑能补的，必须先定分类从哪来。

**风险排序（downstream_confirmation_risk，高→低）**

| # | 缺口 | 不关闭的后果（plan 会发明什么） | PRD write target |
| --- | --- | --- | --- |
| 1 | 分类来源未定义 | 分类字段是否必填、分类集合、默认值、旧记录口径 | Change Delta / Requirements / Glossary / BR |
| 2 | "能看到"的交付形式（无 UI 的 demo） | 新 JSON 端点还是极简页面，验收形态 | Summary / Requirements / AE |
| 3 | 月份范围（仅当月 vs 可查历史月）与"月"的边界口径 | 月份参数、自然月/时区口径 | Requirements / BR / AE |
| 4 | 空态、占比精度、兼容（低风险） | — | BR / AE / Negative Acceptance（拟用推荐默认） |

**Decision Card（当前）**：`write_mode=ask-owner-first` · `highest_risk_gap=分类来源未定义` · `question_delivery=chat-fallback`（宿主无阻塞提问工具，已声明降级）

---

## 问题 1／约 3：分类从哪来？

**背景**（source attempt 已做）：`src/server.js:11` 确认数据模型无分类；`README.md:8` 确认这是已知粗糙点。"分类占比"成立的前提是每笔支出有分类。

**我的推荐**：录入侧扩展——`POST /entries` 增加一个**可选**分类输入，系统提供小而固定的预定义集合（建议：餐饮 / 交通 / 购物 / 娱乐 / 居住 / 医疗 / 其他），未提供或值不在集合内时归入**「其他」**。这样：
- 旧调用不带分类也能成功（向后兼容，不破坏现有 demo 行为）
- 分占比只有这一个口径，验收可写
- 内存里的旧记录自然全部归「其他」，无需迁移

**备选**：a) 分类必填（录入门槛高，README 抱怨过录入麻烦，不推荐）；b) 从备注关键词自动推断（demo 里不可靠，不推荐）；c) 你自定义分类集合内容。

你的选择？（回复 1=推荐方案，或直接说你的分类集合/其他想法）
