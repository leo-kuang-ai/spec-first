`pr-snapshot.json` 是另一个 review 线程的存档，但它透露了一个重要背景：之前有 reviewer 要求加持久化存储，最终以“超出已确定的 in-memory demo 范围”为由婉拒（`not-addressing`）。这对评估意见 2 有参考价值。

以下是评估，未动任何代码：

---

## 意见 1：README 标题 "Known rough edges" → "Known limitations"

**建议：采纳。** 纯文档措辞，零风险零成本。

- "Known limitations" 是 README 的通用标准节名，"rough edges" 偏口语，reviewer 的建议合理。
- **顺带发现一个更值得修的问题**：`README.md:8` 写 "adding an entry requires five fields typed by hand"，但代码里 `POST /entries`（`src/server.js:10`）只接收 `amount` 和 `note` 两个用户输入字段，`id`/`ts` 由服务端生成，README 自己也只描述了 4 个字段。无论按哪种口径数都不是 5。如果采纳意见 1，建议把这处事实错误一并修正。

## 意见 2：GET /entries 支持分页

**建议：婉拒或标记 deferred**，理由如下——但如果你计划让这个 demo 继续演进，采纳也说得过去，实现点我列在后面。

**倾向婉拒的依据：**

1. **项目定位**：README 自述 "tiny personal expense-tracking **demo** app"，数据存内存、重启即丢（`src/server.js:3`）。个人记账规模下，全量返回没有实际症状。
2. **范围先例**：`pr-snapshot.json` 记录了此前“引入持久化存储”的 review 意见，正是以“超出已确定的 in-memory demo 范围”为由关闭的。分页与持久化同属“为假想数据规模加健壮性”的要求，沿用同一范围口径是自洽的。

**如果决定做，需要注意两个联动点（不只是加个参数）：**

- `src/server.js:16` 用 `req.url === '/entries'` 严格相等匹配，一旦带 `?limit=&offset=`，URL 不再严格相等，会直接落到 404。必须先改成按 pathname 解析（如 `new URL(req.url, 'http://localhost').pathname`）。
- 响应形状需要决策：保持裸数组加 query 参数（向后兼容，`?limit=10&offset=0`，无参数时返回全量），还是改成 `{items, total}` 分页对象（信息更全，但对现有调用方是 breaking change）。对内存 demo，前者够用。
- 另有一个与分页设计相关但当前无害的点：id 用 `entries.length + 1` 生成（`src/server.js:11`），将来一旦加删除功能会重复，届时若再做 cursor 分页会踩到。

---

## 汇总

| 意见 | 建议 | 成本 |
|---|---|---|
| 1. 标题改名 | 采纳，顺带修正 "five fields" 事实错误 | ~1 行 |
| 2. /entries 分页 | 婉拒（引用 in-memory demo 范围先例）或 deferred | 若做：~10 行 + URL 匹配改造 + 响应形状决策 |

你看完定夺：意见 1 是否连同内容错误一起改？意见 2 走婉拒回复还是实现？另外，如果你想走 `spec-resolve-pr-feedback` 的完整流程，需要你自己运行 `/spec-resolve-pr-feedback`（它禁止我代为调用）。
