'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PointerBasedAdapter = require('../../src/cli/adapters/pointer-based-adapter');
const { applyOperationPlan } = require('../../src/cli/state');

class TestPointerAdapter extends PointerBasedAdapter {
  get id() {
    return 'testhost';
  }

  get pointerPath() {
    return '.testhost/rules/spec-first.md';
  }

  get pointerHostLabel() {
    return 'TestHost';
  }

  get pointerFrontmatter() {
    return [
      '---',
      'trigger: always_on',
      '---',
    ].join('\n');
  }
}

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-pointer-adapter-'));
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

describe('PointerBasedAdapter', () => {
  test('plans pointer sync with host frontmatter and managed marker', () => {
    const projectRoot = tempProject();
    const adapter = new TestPointerAdapter();

    const plan = adapter.planRuntimeFilesSync(projectRoot);
    const operation = plan.operations.find((item) => item.path === '.testhost/rules/spec-first.md');

    expect(operation).toMatchObject({
      kind: 'write_file',
      reason: 'managed_host_native_pointer',
    });
    expect(operation.contents).toMatch(/^---\ntrigger: always_on\n---\n/);
    expect(operation.contents).toContain('Host: TestHost');
  });

  test('inspects expected metadata drift and removes managed pointers', () => {
    const projectRoot = tempProject();
    const adapter = new TestPointerAdapter();

    applyOperationPlan(projectRoot, adapter.planRuntimeFilesSync(projectRoot));
    expect(adapter.inspectRuntimeFiles(projectRoot)[0]).toMatchObject({ level: 'PASS' });

    writeText(path.join(projectRoot, adapter.pointerPath), [
      '<!-- spec-first:host-native-pointer:start -->',
      '# spec-first',
      'Host: TestHost',
      '<!-- spec-first:host-native-pointer:end -->',
      '',
    ].join('\n'));
    expect(adapter.inspectRuntimeFiles(projectRoot)[0]).toMatchObject({
      level: 'WARNING',
      message: 'TestHost host-native spec-first pointer drifted from expected metadata',
    });

    const removal = adapter.planRuntimeFilesRemoval(projectRoot);
    expect(removal.operations).toEqual([
      expect.objectContaining({
        kind: 'remove_file',
        path: '.testhost/rules/spec-first.md',
      }),
    ]);
  });
});
