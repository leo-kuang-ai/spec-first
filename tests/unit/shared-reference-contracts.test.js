'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = name => read(`skills/_shared/references/${name}.md`);

test('维护索引恰好覆盖实际同步的包内路径', () => {
  const readme = read('skills/_shared/README.md');
  const rows = [...readme.matchAll(/^\| `([\w-]+\.md)` \| ([^|]+) \|/gm)];
  const documented = rows.flatMap(([, file, packages]) =>
    [...packages.matchAll(/`(spec-[\w-]+)`/g)].map(([, name]) => `skills/${name}/references/${file}`));
  const output = execFileSync(process.execPath, ['scripts/sync-shared-references.js', '--check'], { cwd: root, encoding: 'utf8' });
  const actual = [...output.matchAll(/^OK\s+(\S+)$/gm)].map(([, file]) => file);
  expect(actual.length).toBeGreaterThan(0);
  expect(documented.sort()).toEqual(actual.sort());
  expect(rows.map(([, file]) => file).sort()).toEqual(fs.readdirSync(path.join(root, 'skills/_shared/references')).sort());
});

test('两种模式共用建单对账，标签失败不能绕过', () => {
  const tracker = source('tracker-defer');
  const failure = tracker.split('## Failure path')[1].split('## Per-tracker behavior')[0];
  const common = failure.split('**Interactive mode:**')[0];
  expect(common).toMatch(/both modes/i);
  expect(common).toMatch(/read-only.*original authorized destination.*`finding_id`/i);
  expect(common).toMatch(/empty or partial search[^.]+does not establish absence/i);
  expect(common).toMatch(/confirmed match[^\n]+`filed`[^\n]+URL/i);
  expect(common).toMatch(/unresolved[^\n]+`failed`[^\n]+`reason`[^\n]+do not retry or switch/i);
  expect(failure).toMatch(/\*\*Interactive mode:\*\*[^\n]+confirmed non-creation/i);
  const github = tracker.split('\n').find(line => line.startsWith('| GitHub Issues |'));
  expect(github).toMatch(/only after[^|]+label[^|]+not created/i);
  expect(github).not.toMatch(/on first failure/i);
  expect(tracker).toMatch(/`no_sink` for findings with no attempted write/);
});

test('源码引用指向已发布的具体版本，未提交内容退回相对路径', () => {
  const links = source('html-rendering').split('### Hyperlink the reference index')[1].split('### Stable section anchors')[0];
  expect(links).not.toContain('/blob/main/');
  expect(links).toContain('/blob/<commit>/<path>');
  expect(links).toMatch(/published commit/);
  expect(links).toMatch(/uncommitted changes[^.]+repo-relative path as text/s);
});

test.each(['html-rendering', 'markdown-rendering'])('%s 按产物类型保留各自首屏', name => {
  const anatomy = source(name).split('## Section anatomy')[1].split('## Diagrams')[0].replace(/\s+/g, ' ');
  expect(anatomy).toMatch(/implementation-ready plan[^;]+(?:review|decision)[^;]+(?:check|acceptance)/i);
  expect(anatomy).toMatch(/requirements-only output[^.]+product authority and open blockers/i);
  expect(anatomy).toMatch(/ideation[^.]+under-title candidate lead/i);
});

test('创意模板先给候选及代价，仍保留原有章节', () => {
  const skeleton = read('skills/spec-ideate/references/ideation-sections.md').split('# Ideation: <Title>')[1];
  const lead = skeleton.split('## Grounding Context')[0];
  expect(lead).toMatch(/candidate/i);
  expect(lead).toMatch(/tradeoff/i);
  expect(lead).not.toMatch(/^## /m);
  expect(skeleton.match(/^## .+$/gm).slice(0, 4)).toEqual(['## Grounding Context', '## Topic Axes', '## Ranked Ideas', '## Rejection Summary']);
});
