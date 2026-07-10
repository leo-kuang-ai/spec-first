'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CLI_PATH = path.join(REPO_ROOT, 'bin', 'spec-first.js');
const SUPPORTED_PLATFORMS = getSupportedPlatforms();

const TEMPLATE_ASSETS = [
  'assets/templates/00-generic.md',
  'assets/templates/10-app.md',
  'assets/templates/20-admin.md',
  'assets/templates/30-backend.md',
  'assets/templates/40-h5-pc.md',
  'assets/templates/50-cli-devtool.md',
  'assets/templates/60-mixed.md',
  'assets/templates/70-large-requirement-index.md',
  'assets/overlays/securities.md',
];

const TEMPLATE_REQUIRED_ANCHORS = {
  'assets/templates/00-generic.md': ['## Requirements [core]', '## Acceptance Examples [core]'],
  'assets/templates/10-app.md': ['## App 属性确认', '## 页面与组件状态'],
  'assets/templates/20-admin.md': ['## Admin 属性确认', '## 权限矩阵'],
  'assets/templates/30-backend.md': ['## Backend 属性确认', '## 状态语义'],
  'assets/templates/40-h5-pc.md': ['## Web 属性确认', '## 页面状态'],
  'assets/templates/50-cli-devtool.md': ['## Tool 属性确认', '## Preview / Mutation Boundary'],
  'assets/templates/60-mixed.md': ['## Mixed 属性确认', '## Source-Of-Truth Resolution'],
  'assets/templates/70-large-requirement-index.md': ['## 子 PRD 清单', '## 整体验收'],
  'assets/overlays/securities.md': ['## 一、行业横切关注点必查清单', '## 七、监管与标准参考（写 PRD 时只作线索）'],
};

const RETIRED_DOC_TEMPLATES = [
  '00-通用增量需求模板.md',
  '10-App客户端需求模板.md',
  '20-Admin中后台需求模板.md',
  '30-Backend中台服务需求模板.md',
  '40-H5-PC端需求模板.md',
  '50-CLI-DevTool需求模板.md',
  '60-Mixed跨端需求模板.md',
  '70-大需求总索引模板.md',
  '90-证券行业需求关注点与参考附录.md',
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('spec-prd product-bundled template assets', () => {
  test('keeps one packaged template source and retires normative docs mirrors', () => {
    for (const relativePath of TEMPLATE_ASSETS) {
      const assetPath = path.join('skills/spec-prd', relativePath);
      expect(fs.existsSync(assetPath)).toBe(true);

      const content = read(assetPath);
      for (const anchor of TEMPLATE_REQUIRED_ANCHORS[relativePath]) {
        expect(content).toContain(anchor);
      }
      expect(content).not.toMatch(/^\s*(?:[-*]\s*)?(?:status:\s*ready-for-planning|readiness_verified_[^:]+:|readiness_(?:prd|inputs)_hash:)/m);
    }

    for (const filename of RETIRED_DOC_TEMPLATES) {
      expect(fs.existsSync(path.join('docs/需求文档模版/标准模版', filename))).toBe(false);
    }

    const docsReadme = read('docs/需求文档模版/标准模版/README.md');
    expect(docsReadme).toContain('skills/spec-prd/assets/templates/');
    expect(docsReadme).toContain('skills/spec-prd/assets/overlays/securities.md');
    expect(docsReadme).toContain('不作为 runtime authoring contract');

    const outputContract = read('skills/spec-prd/references/prd-output-template.md');
    expect(outputContract).not.toContain('## Embedded Standard Skeleton');
    expect(outputContract).not.toContain('<One paragraph: actor, increment, intended outcome, and current system anchor.>');
  });

  test('routes templates lazily from the skill entry contract', () => {
    const skill = read('skills/spec-prd/SKILL.md');
    const outputContract = read('skills/spec-prd/references/prd-output-template.md');

    expect(skill).toContain('## Template Trigger Map');
    for (const relativePath of TEMPLATE_ASSETS) {
      expect(skill).toContain(relativePath);
    }
    expect(skill).toContain('每个会产出 PRD artifact 的 run 都读取 `assets/templates/00-generic.md`');
    expect(skill).toContain('无行业信号时不得加载');
    expect(skill).toContain('所有人类问题都询问当前执行对话的用户');
    expect(skill).not.toContain('template composition/routing');

    expect(outputContract).toContain('`SKILL.md` `Template Trigger Map`');
    expect(outputContract).not.toContain('| clarification_view | Packaged asset |');
    expect(outputContract).not.toContain('| Industry context | Overlay source |');
    expect(outputContract).not.toContain('template routing semantics');
  });

  test('projects every template asset into all supported host runtimes', () => {
    const packageFiles = require('../../package.json').files;
    expect(packageFiles).toContain('skills/');

    for (const platform of SUPPORTED_PLATFORMS) {
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-templates-${platform}-`));
      try {
        const adapter = getAdapter(platform);
        const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
        const operationPaths = new Set(plan.operations.map((operation) => operation.path));
        const runtimeRoot = adapter.workflowsRoot || adapter.skillsRoot;

        for (const relativePath of TEMPLATE_ASSETS) {
          const expectedPath = path.join(runtimeRoot, 'spec-prd', relativePath).replace(/\\/g, '/');
          expect(operationPaths).toContain(expectedPath);
        }
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });

  test('installs every template asset through one all-supported-host init', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-all-host-init-'));
    const home = path.join(projectRoot, 'home');
    try {
      fs.mkdirSync(home, { recursive: true });
      const hostFlags = SUPPORTED_PLATFORMS.map((platform) => `--${platform}`);
      const result = spawnSync(process.execPath, [
        CLI_PATH,
        'init',
        ...hostFlags,
        '-y',
        '-u',
        'spec-prd-template-test',
        '--lang',
        'zh',
        '--no-sync-user-language',
      ], {
        cwd: projectRoot,
        env: { ...process.env, HOME: home },
        encoding: 'utf8',
        timeout: 60000,
      });

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);

      for (const platform of SUPPORTED_PLATFORMS) {
        const adapter = getAdapter(platform);
        const runtimeRoot = adapter.workflowsRoot || adapter.skillsRoot;
        for (const relativePath of TEMPLATE_ASSETS) {
          expect(fs.existsSync(path.join(
            projectRoot,
            runtimeRoot,
            'spec-prd',
            relativePath,
          ))).toBe(true);
        }
      }

      const integrityPlatform = SUPPORTED_PLATFORMS.includes('codex') ? 'codex' : SUPPORTED_PLATFORMS[0];
      const integrityAdapter = getAdapter(integrityPlatform);
      const integrityRuntimeRoot = integrityAdapter.workflowsRoot || integrityAdapter.skillsRoot;
      fs.rmSync(path.join(
        projectRoot,
        integrityRuntimeRoot,
        'spec-prd',
        'assets/templates/00-generic.md',
      ));

      const specPrdDrift = plugin.inspectInstalledAssets(projectRoot, integrityAdapter).skills.drifted
        .find((entry) => entry.skillName === 'spec-prd');
      expect(specPrdDrift).toBeDefined();
      expect(specPrdDrift.issues).toContain('missing_file:assets/templates/00-generic.md');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
