'use strict';

const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('specialized CE calibration contracts', () => {
  test('compound extractors and headless return remain UTF-8 and non-mutating outside knowledge owners', () => {
    for (const filePath of [
      'skills/spec-compound/scripts/session-history/extract-errors.py',
      'skills/spec-compound/scripts/session-history/extract-skeleton.py',
    ]) {
      const source = read(filePath);
      expect(source).toContain('sys.stdin.reconfigure(encoding="utf-8", errors="replace")');
      expect(source).toContain('sys.stdout.reconfigure(encoding="utf-8", errors="replace")');
      expect(source).toContain('encoding="utf-8"');
    }
    const compound = require('../helpers/compound-contract').readCompoundContract();
    expect(compound).toContain('Report discoverability gaps without editing instruction files');
    expect(compound).toContain('Discoverability recommendation');
    expect(compound).toContain('Documentation skipped');
  });

  test('debug pipeline return never upgrades weak evidence or owns landing', () => {
    const skill = read('skills/spec-debug/SKILL.md');
    const pipeline = read('skills/spec-debug/references/pipeline-return.md');
    expect(skill).toContain('mode:pipeline-return');
    expect(skill).toContain('mode token does not authorize mutation');
    expect(pipeline).toContain('working-hypothesis');
    expect(pipeline).toContain('fixed-not-pushed');
    expect(pipeline).toMatch(/Failed or not-run required verification cannot return `fixed-not-pushed` or `fixed`/);
    expect(pipeline).toMatch(/does not own[\s\S]*commit, push, PR mutation/i);
  });

  test('explain gates ordinary questions and materializes a recoverable destination', () => {
    const skill = read('skills/spec-explain/SKILL.md');
    const html = read('skills/spec-explain/references/explainer-html.md');
    const markdown = read('skills/spec-explain/references/explainer-markdown.md');
    expect(skill).toContain('Operational-question gate');
    expect(skill).toContain('.spec-first/workflows/spec-explain/<run-id>/');
    expect(skill).toContain('Never leave ephemeral `$RUN_DIR` as the only recoverable copy');
    for (const source of [html, markdown]) {
      expect(source).toContain('No internal identifiers in reader content');
      expect(source).toContain('run ids');
    }
  });

  test('polish startup reference keeps each bundled command self-contained', () => {
    const skill = read('skills/spec-polish/SKILL.md');
    expect(skill).toContain('(references/run.md)');
    const run = read('skills/spec-polish/references/run.md');
    const blocks = [...run.matchAll(/```bash\n([\s\S]*?)```/g)].map(match => match[1]);
    const scripts = [];
    for (const block of blocks) {
      expect(block).toMatch(/^SKILL_DIR="[^"\n]+"[;\n]/);
      expect(spawnSync('bash', ['-n'], { input: block, encoding: 'utf8' }).status).toBe(0);
      for (const match of block.matchAll(/"\$SKILL_DIR\/scripts\/([^"\n]+)"/g)) {
        expect(fs.existsSync(`skills/spec-polish/scripts/${match[1]}`)).toBe(true);
        scripts.push(match[1]);
      }
    }
    expect(scripts.sort()).toEqual([
      'detect-project-type.sh', 'read-launch-json.sh',
      'resolve-package-manager.sh', 'resolve-port.sh',
    ]);
  });

  test('product pulse stays host-neutral and preserves its fixed report owner', () => {
    const skill = read('skills/spec-product-pulse/SKILL.md');
    const template = read('skills/spec-product-pulse/references/report-template.md');
    expect(skill).toContain('Interpret the user\'s current request as a time window');
    expect(skill).toContain('Resolve `<repo-root>` at runtime');
    expect(skill).toContain('fixed `docs/pulse-reports/` contract');
    expect(skill).not.toContain('docs_root');
    expect(template).toContain('docs/pulse-reports/');
  });

  test('simplify self-skips no-yield scopes and preserves settled structure', () => {
    const skill = read('skills/spec-simplify-code/SKILL.md');
    expect(skill).toContain('Preflight — skip a no-yield scope');
    expect(skill).toContain('nothing to simplify');
    expect(skill).toContain('never widens beyond caller-authorized paths');
    expect(skill).toContain('session-settled:');
    expect(skill).toMatch(/duplicated package-local runtime\s+assets remain separate/);
  });

  test('commit gathers independent Git facts and rechecks consequential state', () => {
    const skill = read('skills/spec-commit/SKILL.md');
    expect(skill).toContain('each command as its own argv-style shell tool');
    expect(skill).toContain('Do not join commands with shell separators');
    expect(skill).toContain('Re-read the branch and staged paths immediately');
    expect(skill).not.toContain('!`git status`');
    expect(skill).not.toContain('Context fallback');
  });

  test('riffrec and sweep analyzers remain byte-identical', () => {
    const riffrec = fs.readFileSync('skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py');
    const sweep = fs.readFileSync('skills/spec-sweep/scripts/analyze_riffrec_zip.py');
    expect(sweep).toEqual(riffrec);
  });
});
