'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PointerBasedAdapter = require('../../src/cli/adapters/pointer-based-adapter');
const CursorAdapter = require('../../src/cli/adapters/cursor');
const KiroAdapter = require('../../src/cli/adapters/kiro');
const QoderAdapter = require('../../src/cli/adapters/qoder');
const { applyOperationPlan } = require('../../src/cli/state');

class TestPointerAdapter extends PointerBasedAdapter {
  get id() {
    return 'testhost';
  }

  get pointerPath() {
    return '.testhost/rules/spec-first.md';
  }

  get skillsRoot() {
    return '.testhost/skills';
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
    expect(operation.contents).toContain(
      'Workflow entry routing lives in `.testhost/skills/using-spec-first/SKILL.md`.',
    );
  });

  test.each([
    [CursorAdapter, '.cursor/skills/using-spec-first/SKILL.md'],
    [KiroAdapter, '.kiro/skills/using-spec-first/SKILL.md'],
    [QoderAdapter, '.qoder/skills/using-spec-first/SKILL.md'],
  ])('%p points at its installed using-spec-first runtime', (Adapter, expectedPath) => {
    const pointer = new Adapter().buildPointerContent();

    expect(pointer).toContain(`Workflow entry routing lives in \`${expectedPath}\`.`);
    expect(pointer).not.toContain(
      'Workflow entry routing lives in `skills/using-spec-first/SKILL.md`.',
    );
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

  test('reports managed pointer body drift', () => {
    const projectRoot = tempProject();
    const adapter = new TestPointerAdapter();

    applyOperationPlan(projectRoot, adapter.planRuntimeFilesSync(projectRoot));
    writeText(
      path.join(projectRoot, adapter.pointerPath),
      adapter.buildPointerContent().replace(
        '.testhost/skills/using-spec-first/SKILL.md',
        'skills/using-spec-first/SKILL.md',
      ),
    );

    expect(adapter.inspectRuntimeFiles(projectRoot)[0]).toMatchObject({
      level: 'WARNING',
      drift: true,
      reasonCode: 'host_native_pointer_content_drift',
      message: 'TestHost host-native spec-first pointer drifted from expected content',
    });
  });

  test('preserves user-owned pointer collisions without classifying them as managed drift', () => {
    const projectRoot = tempProject();
    const adapter = new TestPointerAdapter();
    const userOwnedContents = '# User-owned rule\n';
    writeText(path.join(projectRoot, adapter.pointerPath), userOwnedContents);

    const syncPlan = adapter.planRuntimeFilesSync(projectRoot);
    expect(syncPlan.operations).toEqual([]);
    expect(syncPlan.diagnostics).toEqual([
      expect.objectContaining({
        level: 'warn',
        code: 'host_native_pointer_user_owned_collision',
      }),
    ]);
    expect(fs.readFileSync(path.join(projectRoot, adapter.pointerPath), 'utf8'))
      .toBe(userOwnedContents);
    expect(adapter.inspectRuntimeFiles(projectRoot)[0]).toMatchObject({
      level: 'WARNING',
      drift: false,
      reasonCode: 'host_native_pointer_user_owned_collision',
    });
  });
});
