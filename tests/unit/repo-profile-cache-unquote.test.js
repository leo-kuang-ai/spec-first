'use strict';

// Regression coverage for the repo-profile-cache freshness cardinal rule:
// a git-quoted profile-input path (core.quotepath emits \NNN octal / named
// C escapes for non-ASCII or control bytes) must be decoded back to its real
// path so `is_profile_input` still recognizes it. Without decoding, a dirty
// manifest under a non-ASCII directory would leave \NNN text in the path,
// slip past the input set, and serve a STALE profile at an unchanged HEAD —
// an under-invalidation, the one failure mode the input set must never allow.

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const SCRIPT = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-debug',
  'scripts',
  'repo-profile-cache.py',
);

// Import the canonical script as a module and emit JSON probe results. All
// nine skill copies are byte-identical (enforced by the parity test), so
// exercising one copy covers them all.
function probe() {
  const py = `
import importlib.util, json
spec = importlib.util.spec_from_file_location("rpc", ${JSON.stringify(SCRIPT)})
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
print(json.dumps({
    "octal": m.git_unquote(r'".github/workflows/caf\\303\\251.yml"'),
    "named_tab": m.git_unquote(r'"a\\tb/package.json"'),
    "passthrough": m.git_unquote("package.json"),
    "input_quoted_prefix": m.is_profile_input(m.git_unquote(r'".github/workflows/caf\\303\\251.yml"')),
    "input_quoted_manifest": m.is_profile_input(m.git_unquote(r'"caf\\303\\251/package.json"')),
    "non_input": m.is_profile_input("src/app.ts"),
}))
`;
  const out = execFileSync('python3', ['-c', py], { encoding: 'utf8' });
  return JSON.parse(out);
}

describe('repo-profile-cache git_unquote', () => {
  const r = probe();

  test('decodes octal-escaped non-ASCII path bytes to real UTF-8', () => {
    expect(r.octal).toBe('.github/workflows/café.yml');
  });

  test('decodes named C escapes', () => {
    expect(r.named_tab).toBe('a\tb/package.json');
  });

  test('returns unquoted tokens unchanged', () => {
    expect(r.passthrough).toBe('package.json');
  });

  test('a quoted profile input is still recognized after decode', () => {
    expect(r.input_quoted_prefix).toBe(true);
    expect(r.input_quoted_manifest).toBe(true);
  });

  test('a non-input path is still not treated as an input', () => {
    expect(r.non_input).toBe(false);
  });
});
