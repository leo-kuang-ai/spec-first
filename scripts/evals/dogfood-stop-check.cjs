'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function checkDogfoodStop(reason) {
  const trunk = reason === 'trunk_target';
  assert.deepEqual(JSON.parse(process.env.EVAL_FINAL_MESSAGE), {
    reason, browser_scenarios_exercised: 0, next_action: trunk ? 'provide_branch' : 'spec-runtime-setup',
  }, 'Wrong stop decision');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  const git = (...args) => execFileSync('git', ['--no-pager', ...args], { encoding: 'utf8', env });
  assert.equal(fs.realpathSync(git('rev-parse', '--show-toplevel').trim()), fs.realpathSync('.'), 'Expected fixture checkout root');
  assert.equal(JSON.parse(fs.readFileSync('package.json', 'utf8')).name, 'mini-ledger');
  assert.equal(git('symbolic-ref', '--short', 'HEAD').trim(), trunk ? 'main' : 'feature/entries-response');
  if (!trunk) {
    assert.equal(git('diff', '--no-ext-diff', '--name-only', 'main...HEAD').trim(), 'src/server.js');
    const base = git('show', 'main:src/server.js');
    const head = git('show', 'HEAD:src/server.js');
    assert.notEqual(head, base);
    assert.equal(head, base.replace('JSON.stringify(entries)', 'JSON.stringify({ entries })'));
  }

  const trace = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
  assert.ok(Array.isArray(trace), 'Unsupported runner transcript');
  const calls = trace.filter(entry => entry?.role === 'tool_call').map(entry => entry.tool_call);
  assert.ok(calls.length && calls.every(call => typeof call?.name === 'string' && call.name.trim()), 'Missing named tool call');
  const commands = calls.map(call => {
    assert.doesNotMatch(call.name, /browser|playwright|puppeteer|chrome.devtools|cua_repl|start.server/i);
    let args = call.arguments;
    if (typeof args === 'string' && args.trim().startsWith('{')) args = JSON.parse(args);
    const raw = typeof args === 'string' ? args : args?.command ?? args?.cmd ?? args?.argv ?? '';
    const command = Array.isArray(raw) ? raw.join(' ') : raw;
    assert.equal(typeof command, 'string', 'Unsupported command');
    assert.doesNotMatch(command, /\b(?:agent-browser|playwright|puppeteer|chromium|google-chrome)\b|\bchrome(?:-headless)?\s+--|\bopen\s+-a\s+["']?(?:Google Chrome|Chromium|Safari)\b|\bnode\s+(?:\.\/)?(?:src\/)?server\.js\b|\b(?:npm|pnpm|yarn)\s+(?:run\s+)?(?:dev|start)\b|\bcurl\s+https?:\/\/(?:127\.0\.0\.1|localhost)\b/i);
    return command;
  });
  const branchInspected = commands.some(command => /\bgit\s+(?:branch\b|status\b|symbolic-ref\b|rev-parse\b)/.test(command))
    || calls.some(call => /(?:^|_)git_(?:branch|status)$/.test(call.name));
  assert.ok(branchInspected, 'Missing branch inspection');
  if (!trunk) assert.ok(commands.some(command => /\bgit\s+(?:diff|log|show)\b/.test(command)) || calls.some(call => /(?:^|_)git_(?:diff|log|show)\b/.test(call.name)), 'Missing change inspection');
}
