'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadRegistry } = require('../../skills/spec-runtime-setup/scripts/lib/registry.cjs');
const skillRoot = path.resolve(__dirname, '../../skills/spec-runtime-setup');

test('registry 对外版本标识与 loader 验证的 source 版本一致', () => {
  const registry = loadRegistry({ skillRoot });
  const schema = JSON.parse(fs.readFileSync(path.join(skillRoot, 'setup-registry.schema.json'), 'utf8'));
  const docs = fs.readFileSync(path.join(skillRoot, 'references/supported-mcp-tools.md'), 'utf8');
  const version = registry.schema_version;
  expect(schema.properties.schema_version.const).toBe(version);
  expect(schema.$id).toBe(`https://spec-first.dev/schemas/${version}.json`);
  expect(schema.title).toBe(`spec-runtime-setup registry ${version.split('.').pop()}`);
  expect(docs).toContain(`schema version 为 \`${version}\``);
});
