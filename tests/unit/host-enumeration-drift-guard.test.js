'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { getSupportedPlatforms } = require('../../src/cli/adapters');
const { PLATFORM_REGISTRY } = require('../../src/cli/adapters/platform-registry');
const { loadRegistry, HOST_IDS } = require('../../skills/spec-runtime-setup/scripts/lib/registry.cjs');
const {
  CANONICAL_HOSTS,
  HOST_SKILL_SURFACES,
} = require('../../skills/spec-runtime-setup/scripts/lib/host-authority.cjs');
const { HOST_ENTRY_FILE } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-routing-inject.cjs');

const repoRoot = path.resolve(__dirname, '..', '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function sorted(values) {
  return [...values].sort();
}

// 单一宿主清单不变量：新增宿主必须同时触及以下全部站点，漏任何一层都会让
// 对应能力面（MCP 写入、host authority、workspace 路由、receipt 校验、schema
// 放行）静默缺位——zcode/pi 接入均发生过逐层遗漏。本测试把"接入清单"从
// reviewer 记忆变为 CI 强制：
//   1. src/cli/adapters（getSupportedPlatforms 权威源 + 各 adapter）
//   2. src/cli/adapters/platform-registry（宿主面登记）
//   3. skills/spec-runtime-setup/setup-registry.json hosts
//   4. skills/spec-runtime-setup/setup-registry.schema.json hosts.required
//   5. skills/spec-runtime-setup/setup-registry.schema.json hostOverrides.properties
//   6. skills/spec-runtime-setup/scripts/lib/registry.cjs HOST_IDS
//   7. skills/spec-runtime-setup/scripts/lib/host-authority.cjs CANONICAL_HOSTS
//   8. skills/spec-runtime-setup/scripts/lib/host-authority.cjs HOST_SKILL_SURFACES
//   9. skills/spec-runtime-setup/scripts/lib/workspace-routing-inject.cjs HOST_ENTRY_FILE
//   10. docs/contracts/verification/host-invocation-receipt.schema.json host enum
describe('host enumeration drift guard', () => {
  test('keeps every host-list site equal to the supported platform set', () => {
    const expected = sorted(getSupportedPlatforms());

    expect(sorted(Object.keys(PLATFORM_REGISTRY))).toEqual(expected);
    expect(sorted(Object.keys(loadRegistry({ skillRoot: path.join(repoRoot, 'skills', 'spec-runtime-setup') }).hosts)))
      .toEqual(expected);

    const registrySchema = readJson('skills/spec-runtime-setup/setup-registry.schema.json');
    expect(sorted(registrySchema.properties.hosts.required)).toEqual(expected);
    expect(sorted(Object.keys(registrySchema.$defs.hostOverrides.properties))).toEqual(expected);

    expect(sorted(HOST_IDS)).toEqual(expected);
    expect(sorted(CANONICAL_HOSTS)).toEqual(expected);
    expect(sorted(Object.keys(HOST_SKILL_SURFACES))).toEqual(expected);
    expect(sorted(Object.keys(HOST_ENTRY_FILE))).toEqual(expected);

    const receiptSchema = readJson('docs/contracts/verification/host-invocation-receipt.schema.json');
    expect(sorted(receiptSchema.properties.host.enum)).toEqual(expected);
  });
});
