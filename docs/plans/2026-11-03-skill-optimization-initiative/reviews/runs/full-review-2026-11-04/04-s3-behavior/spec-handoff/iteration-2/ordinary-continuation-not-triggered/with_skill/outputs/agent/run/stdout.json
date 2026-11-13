## 状态与判定

1. **准备工作已完成**:`node prepare-eval.cjs` 已运行一次，生成 baseline 提交 `56ba100 eval fixture baseline`(仅为准备性质，不构成任务提交或落地授权；此后仓库未做任何修改)。
2. **spec-handoff 不适用**：其范围声明明确排除“在当前会话内继续当前工作”的普通延续(`SKILL.md` 第 4、15 行)，而本次要求正是在当前会话继续，因此不触发该技能、不产生 handoff 工件。

## 下一步(在本次回复中执行)

**下一步：消除 README 列出的粗糙点 —— 给 `POST /entries` 增加可选 `category` 字段与输入校验，并新增 `GET /summary` 分类汇总端点。** 因 fixture 仓库对我只读，改动以 diff 形式在回复中交付(不修改跟踪文件、不新建文件、不提交)。

### 针对 `src/server.js` 的建议改动

```diff
@@ const http = require('http');
 const entries = [];
+const CATEGORIES = new Set(['food', 'transport', 'housing', 'fun', 'general']);

 const server = http.createServer((req, res) => {
   if (req.method === 'POST' && req.url === '/entries') {
     let body = '';
     req.on('data', (c) => { body += c; });
     req.on('end', () => {
-      const { amount, note } = JSON.parse(body || '{}');
-      entries.push({ id: entries.length + 1, amount, note, ts: Date.now() });
+      let parsed;
+      try { parsed = JSON.parse(body || '{}'); } catch { res.statusCode = 400; return res.end('bad json'); }
+      const { amount, note, category } = parsed;
+      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
+        res.statusCode = 400; return res.end('invalid amount');
+      }
+      const cat = CATEGORIES.has(category) ? category : 'general';
+      entries.push({ id: entries.length + 1, amount, note: note ?? '', category: cat, ts: Date.now() });
       res.end('ok');
     });
     return;
   }
   if (req.method === 'GET' && req.url === '/entries') { ... }        // 不变
+  if (req.method === 'GET' && req.url === '/summary') {
+    const byCategory = {};
+    let total = 0;
+    for (const e of entries) {
+      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
+      total += e.amount;
+    }
+    res.setHeader('content-type', 'application/json');
+    res.end(JSON.stringify({ total, count: entries.length, byCategory }));
+    return;
+  }
   res.statusCode = 404;
   res.end('not found');
```

### 验证结果(在仓库外临时目录实测，已清理)

- `POST {"amount":12.5,"note":"lunch","category":"food"}` → `ok`,条目含 `category:"food"`
- `POST {"amount":30,"note":"taxi"}`(缺省类别)→ `category:"general"`
- `POST {"amount":"x"}` → `400 invalid amount`;非法 JSON → `400 bad json`
- `GET /summary` → `{"total":42.5,"count":2,"byCategory":{"food":12.5,"general":30}}`

原实现中 `JSON.parse` 抛错会导致请求挂起无响应，此改动顺带修复。README 中“五个字段手打”的表述与实际字段不符的问题，建议在落地时一并修订 README。

**后续步骤(需你授权后才动仓库)**：你确认后我将把上述 diff 应用到 `src/server.js` 并同步更新 README——是否继续？
