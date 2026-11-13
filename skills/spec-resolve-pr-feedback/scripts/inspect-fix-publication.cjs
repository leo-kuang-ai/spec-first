#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');

// Read-only publication facts. These do not grant reply/resolution authority or
// decide whether a source-backed judgment is still semantically valid.
function inspectFixPublication(input, read = (host, endpoint) => JSON.parse(execFileSync('gh', [
  'api', '--hostname', host, '--method', 'GET', endpoint,
], { encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024 }))) {
  const result = { verified: false, reason_code: 'publication-input-invalid', observed_at: new Date().toISOString() };
  const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
  const shaPattern = /^[0-9a-f]{40}$/;
  if (!input || !/^[A-Za-z0-9][A-Za-z0-9.-]*$/.test(input.host || '')
    || !repoPattern.test(input.base_repo || '') || !repoPattern.test(input.head_repo || '')
    || !Number.isSafeInteger(input.number) || input.number < 1
    || typeof input.head_ref !== 'string' || !input.head_ref.trim()
    || /[\x00-\x20\x7f]/.test(input.head_ref) || !shaPattern.test(input.fix_commit || '')) return result;
  try {
    const pr = read(input.host, `repos/${input.base_repo}/pulls/${input.number}`);
    const expectedUrl = `https://${input.host}/${input.base_repo}/pull/${input.number}`;
    if (pr.number !== input.number || pr.html_url !== expectedUrl
      || pr.base?.repo?.full_name !== input.base_repo || pr.head?.repo?.full_name !== input.head_repo
      || pr.head?.ref !== input.head_ref || !shaPattern.test(pr.head?.sha || '')) {
      return { ...result, reason_code: 'publication-pr-identity-changed' };
    }
    const identity = { host: input.host, base_repo: input.base_repo, number: input.number, url: pr.html_url,
      head_repo: pr.head.repo.full_name, head_ref: pr.head.ref, head_sha: pr.head.sha, fix_commit: input.fix_commit };
    const comparison = read(input.host, `repos/${input.head_repo}/compare/${input.fix_commit}...${pr.head.sha}`);
    const verified = ['ahead', 'identical'].includes(comparison.status)
      && comparison.merge_base_commit?.sha === input.fix_commit;
    return { ...result, ...identity, verified, reason_code: verified ? 'fix-reachable-from-pr-head' : 'fix-not-proven-reachable',
      comparison_status: comparison.status || null, merge_base_sha: comparison.merge_base_commit?.sha || null };
  } catch (_) {
    // Provider errors may contain credentials or arbitrary content. Retain a
    // bounded reason; the caller owns protected diagnostic capture if needed.
    return { ...result, reason_code: 'publication-read-unavailable' };
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const keys = { '--host': 'host', '--base-repo': 'base_repo', '--pr': 'number', '--head-repo': 'head_repo', '--head-ref': 'head_ref', '--fix-sha': 'fix_commit' };
  const input = {};
  let invalid = false;
  for (let index = 0; index < args.length; index += 2) {
    const key = keys[args[index]];
    if (!key || Object.hasOwn(input, key) || index + 1 >= args.length) { invalid = true; break; }
    input[key] = key === 'number' ? (/^[1-9][0-9]*$/.test(args[index + 1]) ? Number(args[index + 1]) : null) : args[index + 1];
  }
  const result = inspectFixPublication(invalid ? null : input);
  process.stdout.write(JSON.stringify(result) + '\n');
  process.exitCode = result.verified ? 0 : 1;
}

module.exports = { inspectFixPublication };
