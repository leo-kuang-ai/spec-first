'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const SCRIPT_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-polish-beta',
  'scripts',
  'detect-project-type.sh',
);
const DEV_SERVER_DETECTION_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-polish-beta',
  'references',
  'dev-server-detection.md',
);
const DEV_SERVER_RAILS_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-polish-beta',
  'references',
  'dev-server-rails.md',
);
const RESOLVE_PORT_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-polish-beta',
  'scripts',
  'resolve-port.sh',
);

describe('spec-polish-beta project detection contracts', () => {
  test('detect-project-type avoids Bash 4 associative arrays', () => {
    const text = fs.readFileSync(SCRIPT_PATH, 'utf8');

    expect(text).toContain('Bash 3.2');
    expect(text).toContain('add_mono_hit()');
    expect(text).toContain('paste -sd, -');
    expect(text).not.toContain('declare -A');
    expect(text).not.toContain('MONO_HITS[');
    expect(text).not.toContain('${!MONO_HITS[@]}');
  });

  test('detect-project-type preserves multiple monorepo hit output shape', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-polish-detect-'));

    try {
      execFileSync('git', ['init'], { cwd: tmpDir, stdio: 'ignore' });

      const webDir = path.join(tmpDir, 'apps', 'web');
      const apiDir = path.join(tmpDir, 'apps', 'api');
      fs.mkdirSync(webDir, { recursive: true });
      fs.mkdirSync(path.join(apiDir, 'bin'), { recursive: true });
      fs.writeFileSync(path.join(webDir, 'next.config.js'), 'module.exports = {};\n');
      fs.writeFileSync(path.join(apiDir, 'Gemfile'), 'source "https://rubygems.org"\n');
      fs.writeFileSync(path.join(apiDir, 'bin', 'dev'), '#!/usr/bin/env bash\n');

      const output = execFileSync('bash', [SCRIPT_PATH], {
        cwd: tmpDir,
        encoding: 'utf8',
      }).trim();

      expect(output).toBe('multiple:next@apps/web,rails@apps/api');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('detect-project-type preserves monorepo paths with spaces', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-polish-space-'));

    try {
      execFileSync('git', ['init'], { cwd: tmpDir, stdio: 'ignore' });

      const webDir = path.join(tmpDir, 'apps', 'web client');
      fs.mkdirSync(webDir, { recursive: true });
      fs.writeFileSync(path.join(webDir, 'vite.config.ts'), 'export default {};\n');

      const output = execFileSync('bash', [SCRIPT_PATH], {
        cwd: tmpDir,
        encoding: 'utf8',
      }).trim();

      expect(output).toBe('vite@apps/web client');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('dev-server port detection does not scan instruction files by default', () => {
    const detection = fs.readFileSync(DEV_SERVER_DETECTION_PATH, 'utf8');
    const rails = fs.readFileSync(DEV_SERVER_RAILS_PATH, 'utf8');
    const resolvePort = fs.readFileSync(RESOLVE_PORT_PATH, 'utf8');

    expect(detection).toContain('Neither `resolve-port.sh` nor the `test-browser` inline cascade scans `AGENTS.md` / `CLAUDE.md` for port references by default');
    expect(detection).toContain('already-loaded project guidance only when it explicitly declares the active dev-server port');
    expect(detection).not.toContain('The `test-browser` inline cascade does. Instruction files');
    expect(detection).not.toContain('Removal of the `AGENTS.md`/`CLAUDE.md` grep');
    expect(rails).toContain('Do not scan `AGENTS.md` / `CLAUDE.md` for Rails ports by default');
    expect(resolvePort).toContain('Prose files (AGENTS.md, CLAUDE.md) are deliberately NOT');
  });
});
