import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { init } from '../../src/core/process-engine/init.js';
import { checkGoLive } from '../../src/core/gate-engine/golive.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-release-flow');
const ROOT = join(import.meta.dirname, '../../skills/spec-first');

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  mkdirSync(join(TMP, 'specs'), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({ version: '1.0', gate: { pilot_mode: true } }));
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), yaml.dump({ platform: 'h5' }));
});
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('release flow governance', () => {
  it('documents canonical stage and command flow', () => {
    const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8');
    expect(readme).toContain('05_verify → 06_wrap_up → 07_release → 08_done');
    expect(readme).toContain('verify → archive → golive → done');
  });

  it('blocks golive when release and security evidence are missing', () => {
    const { featureId } = init({ feat: 'REL', mode: 'N', size: 'S', platforms: ['h5'], projectRoot: TMP });
    const result = checkGoLive(featureId, TMP);
    expect(result.pass).toBe(false);
    expect(result.checks.some((item) => item.id === 'GL-03' && item.pass === false)).toBe(true);
    expect(result.checks.some((item) => item.id === 'GL-05' && item.pass === false)).toBe(true);
  });
});
