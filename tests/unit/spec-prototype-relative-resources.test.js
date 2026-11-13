'use strict';

// 回归测试：SUP-12 - 原型默认 URL 丢失 question 子目录，导致相对资源 404
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:165-171
//
// 核心修复验证：
// 1. 子目录原型在默认 URL 注入 <base> 标签
// 2. 浏览器可以正确解析相对资源（CSS、JS）
// 3. 单文件根目录原型不注入 <base>

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const server = path.resolve(__dirname, '../../skills/spec-prototype/scripts/light-webserver.js');

function run(args, cwd) {
  return execFileSync(process.execPath, [server, ...args], { cwd, encoding: 'utf8' });
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8')
      }));
    }).on('error', reject);
  });
}

describe('Prototype relative resource handling — SUP-12', () => {
  test('子目录原型注入 <base> 标签，相对 CSS 可访问', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sup12-css-'));

    try {
      fs.mkdirSync(path.join(root, 'screens', 'question'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'screens', 'question', 'index.html'),
        '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><h1>Question</h1></body></html>'
      );
      fs.writeFileSync(
        path.join(root, 'screens', 'question', 'style.css'),
        'body { background: blue; }'
      );

      const info = JSON.parse(run(['start', '--root', root], root));
      expect(info.status).toBe('started');

      // SUP-12 修复：/ 返回 HTML 并注入 <base href="/question/">
      const rootResponse = await get(info.url);
      expect(rootResponse.status).toBe(200);
      expect(rootResponse.body).toContain('Question');
      expect(rootResponse.body).toMatch(/<base href="\/question\/"/i);

      // 核心验证：相对 CSS 可以访问（浏览器基于 <base> 解析为 /question/style.css）
      const cssResponse = await get(`${info.url}/question/style.css`);
      expect(cssResponse.status).toBe(200);
      expect(cssResponse.body).toContain('background: blue');

      expect(JSON.parse(run(['stop', '--root', root])).status).toBe('stopped');

    } finally {
      try { run(['stop', '--root', root], root); } catch {}
      fs.rmSync(root, { recursive: true, force: true });
    }
  }, 15000);

  test('单文件根目录原型不注入 <base>', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sup12-root-'));

    try {
      fs.mkdirSync(path.join(root, 'screens'));
      fs.writeFileSync(
        path.join(root, 'screens', 'prototype.html'),
        '<!doctype html><html><head><style>body{color:red;}</style></head><body><h1>Root</h1></body></html>'
      );

      const info = JSON.parse(run(['start', '--root', root], root));
      expect(info.status).toBe('started');

      const rootResponse = await get(info.url);
      expect(rootResponse.status).toBe(200);
      expect(rootResponse.body).toContain('Root');
      expect(rootResponse.body).not.toMatch(/<base /i);

      expect(JSON.parse(run(['stop', '--root', root])).status).toBe('stopped');

    } finally {
      try { run(['stop', '--root', root], root); } catch {}
      fs.rmSync(root, { recursive: true, force: true });
    }
  }, 15000);

  test('子目录原型注入 <base> 后相对 JS 可访问', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sup12-js-'));

    try {
      fs.mkdirSync(path.join(root, 'screens', 'density-question'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'screens', 'density-question', 'index.html'),
        '<!doctype html><html><head><script src="app.js"></script></head><body><h1>Density</h1></body></html>'
      );
      fs.writeFileSync(
        path.join(root, 'screens', 'density-question', 'app.js'),
        'console.log("app");'
      );

      const info = JSON.parse(run(['start', '--root', root], root));
      expect(info.status).toBe('started');

      const rootResponse = await get(info.url);
      expect(rootResponse.status).toBe(200);
      expect(rootResponse.body).toContain('Density');
      expect(rootResponse.body).toMatch(/<base href="\/density-question\/"/i);

      const jsResponse = await get(`${info.url}/density-question/app.js`);
      expect(jsResponse.status).toBe(200);
      expect(jsResponse.body).toContain('app');

      expect(JSON.parse(run(['stop', '--root', root])).status).toBe('stopped');

    } finally {
      try { run(['stop', '--root', root], root); } catch {}
      fs.rmSync(root, { recursive: true, force: true });
    }
  }, 15000);
});
