规划完成。

## 分页方案（Direct 结果）

**选型：offset/limit**。用例是个人记账小工具、同构内存数组、顺序翻页、无高并发写入——cursor 防漂移和 total 总数都是多余的复杂度。

**契约**:
- `GET /entries?offset=<N>&limit=<M>`
- `offset` 默认 0，非负整数，越界返回空 items
- `limit` 默认 50，范围 1..200
- 响应 `{ items, offset, limit, hasMore }`;`hasMore = offset + items.length < entries.length`，客户端据此停止翻页
- 非法参数一律回退默认，不报 400（内部工具，宽松优先）

**关键实现点**（示例代码已写入 `src/server.js:16-49`，含注释）:
1. 现有 `req.url === '/entries'` 精确匹配会吞掉 query string，必须改成前缀匹配 + `new URL(req.url, ...)` 解析
2. `parseInt` + `Number.isFinite` 校验，clamp 到范围
3. `entries.slice(offset, offset + limit)` 切片
4. 包 envelope 返回——**注意这是响应形状变更**（裸数组 → 对象），需同步更新调用方

语法已校验通过，未实测。如需落地，交给 `spec-work` 或自行修改。
