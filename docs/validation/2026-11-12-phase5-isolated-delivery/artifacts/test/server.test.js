const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { server } = require('../src/server');

let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  // fetch 的 keep-alive 连接会让 close 的回调一直挂起，先断开全部连接
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

async function postEntry(entry) {
  return fetch(`${baseUrl}/entries`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(entry),
  });
}

async function listEntries(query = '') {
  const res = await fetch(`${baseUrl}/entries${query}`);
  assert.equal(res.status, 200);
  return res.json();
}

test('POST /entries 返回 ok，新条目进入列表且字段恰为 {id, amount, note, ts}（AE5）', async () => {
  const res = await postEntry({ amount: 10, note: 'coffee' });
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'ok');

  const entries = await listEntries();
  const added = entries[entries.length - 1];
  assert.equal(added.amount, 10);
  assert.equal(added.note, 'coffee');
  assert.equal(added.id, entries.length);
  assert.ok(typeof added.ts === 'number' && added.ts > 0);
  assert.deepEqual(Object.keys(added).sort(), ['amount', 'id', 'note', 'ts']);
});

test('两条录入后 GET /entries 返回含两条的数组，顺序与录入一致（AE4）', async () => {
  await postEntry({ amount: 20, note: 'first' });
  await postEntry({ amount: 30, note: 'second' });

  const entries = await listEntries();
  assert.ok(entries.length >= 2);
  const first = entries[entries.length - 2];
  const second = entries[entries.length - 1];
  assert.equal(first.note, 'first');
  assert.equal(second.note, 'second');
  assert.equal(second.id, first.id + 1);
});

test('GET /entries?month=YYYY-MM 仅返回该月条目，期望值按基线公式从全量列表推导（AE4）', async () => {
  const all = await listEntries();
  const anchor = all[all.length - 1];
  // 期望集合刻意按实现同一公式从全量列表推导：表征用例钉的是现状过滤语义，不是日历正确性
  const month = new Date(anchor.ts).toISOString().slice(0, 7);
  const expected = all.filter((e) => new Date(e.ts).toISOString().slice(0, 7) === month);

  const filtered = await listEntries(`?month=${month}`);
  assert.deepEqual(filtered, expected);
});

test('GET /entries/:id 命中现存条目，返回 200、application/json 与该条目（AE1）', async () => {
  await postEntry({ amount: 40, note: 'single' });
  const all = await listEntries();
  const target = all[all.length - 1];

  const res = await fetch(`${baseUrl}/entries/${target.id}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/json');
  assert.deepEqual(await res.json(), target);
});

test('GET /entries/:id 超出范围返回 404 not found（AE2）', async () => {
  const all = await listEntries();
  const maxId = all[all.length - 1].id;

  const res = await fetch(`${baseUrl}/entries/${maxId + 1}`);
  assert.equal(res.status, 404);
  assert.equal(await res.text(), 'not found');
});

test('GET /entries/abc 非数字 id 返回 404（AE3）', async () => {
  const res = await fetch(`${baseUrl}/entries/abc`);
  assert.equal(res.status, 404);
  assert.equal(await res.text(), 'not found');
});

test('畸形与越界子路径一律 404：1.5、-1、空段、尾斜杠、超大数值', async () => {
  for (const sub of ['1.5', '-1', '', '5/', '99999999999999999999']) {
    const res = await fetch(`${baseUrl}/entries/${sub}`);
    assert.equal(res.status, 404, `GET /entries/${sub}`);
    assert.equal(await res.text(), 'not found', `GET /entries/${sub}`);
  }
});

test('前导零归一化：GET /entries/02 返回 id 2 的条目', async () => {
  const all = await listEntries();
  const expected = all.find((e) => e.id === 2);
  assert.ok(expected, '前置条件：账本中存在 id 2');

  const res = await fetch(`${baseUrl}/entries/02`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), expected);
});

test('查询串容忍：GET /entries/1?x=1 忽略 query 返回条目 1', async () => {
  const all = await listEntries();
  const expected = all.find((e) => e.id === 1);
  assert.ok(expected, '前置条件：账本中存在 id 1');

  const res = await fetch(`${baseUrl}/entries/1?x=1`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), expected);
});

test('非 GET 方法 × 子路径：POST /entries/5 返回 404', async () => {
  const res = await fetch(`${baseUrl}/entries/5`, { method: 'POST' });
  assert.equal(res.status, 404);
});
