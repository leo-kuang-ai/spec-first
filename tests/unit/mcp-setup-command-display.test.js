'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { hostConfigRepairCommand } = require('../../skills/spec-runtime-setup/scripts/lib/host-config-repair-command.cjs');
const { inspectProjectConfig } = require('../../skills/spec-runtime-setup/scripts/lib/project-config.cjs');

describe('setup repair command argument identity', () => {
  (process.platform === 'win32' ? test.skip : test)('POSIX copy/paste preserves path bytes without executing substitutions', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-display-'));
    const target = path.join(root, 'space \' quote " $HOME $(touch injected) `touch injected2`');
    try {
      fs.mkdirSync(target);
      fs.writeFileSync(path.join(root, 'spec-runtime-setup'), '#!/bin/sh\nprintf "%s\\n" "$@"\n', { mode: 0o700 });
      const command = hostConfigRepairCommand({ actionPlan: {
        args: { folder: target }, selected_ids: ['graphify'], mode: 'check',
      } }, { shell: 'posix' });
      const result = spawnSync('/bin/sh', ['-c', command], {
        cwd: root, encoding: 'utf8', env: { ...process.env, PATH: `${root}:${process.env.PATH}` },
      });
      expect(result.status).toBe(0);
      expect(result.stdout.trimEnd().split('\n')).toEqual(['--only', 'graphify', '--folder', target, '--repair-host-config']);
      expect(fs.existsSync(path.join(root, 'injected'))).toBe(false);
      expect(fs.existsSync(path.join(root, 'injected2'))).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('folder config repair retains the selected target kind', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-folder-display-'));
    try {
      const facts = inspectProjectConfig({ repoRoot: root, targetKind: 'non-git-folder' });
      expect(facts.example_config.next_action).toContain('--folder');
      expect(facts.example_config.next_action).not.toContain('--repo');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
