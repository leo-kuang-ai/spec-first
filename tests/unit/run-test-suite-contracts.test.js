'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  INTEGRATION_TEST_PATHS,
  MCP_SETUP_TEST_PATHS,
  assertTestPathsExist,
  runJestFiles,
} = require('../../scripts/run-test-suite.cjs');

const repoRoot = path.resolve(__dirname, '..', '..');

describe('run-test-suite active inventory', () => {
  test('accepts declared paths only when every file exists', () => {
    expect(() => assertTestPathsExist(['tests/smoke/cli-smoke.test.js'])).not.toThrow();
  });

  test('fails fast when any declared test path is missing', () => {
    expect(() => assertTestPathsExist([
      'tests/smoke/cli-smoke.test.js',
      'tests/integration/retired.integration.test.js',
    ])).toThrow('声明的测试路径不存在：tests/integration/retired.integration.test.js');
  });

  test('does not run Jest when the declared path is missing', () => {
    expect(() => runJestFiles(['tests/integration/retired.integration.test.js']))
      .toThrow('声明的测试路径不存在');
  });

  test('runs every mcp-setup Node contract through test:mcp-setup', () => {
    const prefixedPaths = fs.readdirSync(path.join(repoRoot, 'tests', 'unit'))
      .filter((fileName) => /^mcp-setup-.*\.test\.js$/.test(fileName))
      .map((fileName) => `tests/unit/${fileName}`);
    const expectedPaths = [
      ...prefixedPaths,
      'tests/unit/host-runtime-projection-contracts.test.js',
      'tests/unit/plugin-modules.test.js',
    ].sort();

    expect([...MCP_SETUP_TEST_PATHS].sort()).toEqual(expectedPaths);
    expect(() => assertTestPathsExist(MCP_SETUP_TEST_PATHS)).not.toThrow();
  });

  test('runs every integration test file through test:integration', () => {
    const expectedPaths = fs.readdirSync(path.join(repoRoot, 'tests', 'integration'), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.test.js'))
      .map((entry) => `tests/integration/${entry.name}`)
      .sort((left, right) => left.localeCompare(right));

    expect([...INTEGRATION_TEST_PATHS]).toEqual(expectedPaths);
    expect(() => assertTestPathsExist(INTEGRATION_TEST_PATHS)).not.toThrow();
  });

  test('runs the dedicated mcp-setup suite in Windows CI before the full test chain', () => {
    const workflow = fs.readFileSync(
      path.join(repoRoot, '.github', 'workflows', 'windows-compatibility.yml'),
      'utf8',
    );
    const typecheckIndex = workflow.indexOf('run: npm run typecheck');
    const mcpSetupIndex = workflow.indexOf('run: npm run test:mcp-setup');
    const fullTestIndex = workflow.indexOf('run: npm test');
    const buildIndex = workflow.indexOf('run: npm run build');

    expect(typecheckIndex).toBeGreaterThanOrEqual(0);
    expect(mcpSetupIndex).toBeGreaterThan(typecheckIndex);
    expect(fullTestIndex).toBeGreaterThan(mcpSetupIndex);
    expect(buildIndex).toBeGreaterThan(fullTestIndex);
    expect(workflow).toContain('replay-runtime-contracts.cjs --platform windows');
    expect(workflow).toContain('uses: actions/upload-artifact@v4');
    expect(workflow).toContain('name: mcp-setup-legacy-windows-node-${{ matrix.node }}');
    expect(workflow).toContain('if: always()');
    expect(workflow).toContain('if-no-files-found: error');
  });
});
