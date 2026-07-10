'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');

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
      expect(fs.existsSync(path.join('skills/spec-prd', relativePath))).toBe(true);
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

    expect(skill).toContain('## Template Trigger Map');
    for (const relativePath of TEMPLATE_ASSETS) {
      expect(skill).toContain(relativePath);
    }
    expect(skill).toContain('Load `assets/templates/00-generic.md` for every PRD artifact');
    expect(skill).toContain('Do not load `assets/overlays/securities.md` without a securities/trading signal');
    expect(skill).toContain('All human questions go to the current conversation user');
  });

  test('projects every template asset into all supported host runtimes', () => {
    const packageFiles = require('../../package.json').files;
    expect(packageFiles).toContain('skills/');

    for (const platform of getSupportedPlatforms()) {
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-templates-${platform}-`));
      const adapter = getAdapter(platform);
      const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
      const operationPaths = new Set(plan.operations.map((operation) => operation.path));
      const runtimeRoot = adapter.workflowsRoot || adapter.skillsRoot;

      for (const relativePath of TEMPLATE_ASSETS) {
        const expectedPath = path.join(runtimeRoot, 'spec-prd', relativePath).replace(/\\/g, '/');
        expect(operationPaths).toContain(expectedPath);
      }
    }
  });
});
