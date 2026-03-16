import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AFFECTED_ARTIFACTS,
  EXACT_FILE_TO_ARTIFACT_MAP,
  FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP,
  PREFIX_FILE_TO_ARTIFACT_MAP,
  matchArtifactsByChangedFile,
} from '../../src/core/skill-runtime/first-artifact-mapping.js';

describe('first-artifact-mapping', () => {
  it('包含核心精确映射规则', () => {
    expect(EXACT_FILE_TO_ARTIFACT_MAP['package.json']).toEqual(['tech-stack.md', 'external-deps.md']);
    expect(EXACT_FILE_TO_ARTIFACT_MAP['Dockerfile']).toEqual(['architecture.md', 'local-setup.md']);
  });

  it('包含核心目录前缀映射规则', () => {
    const srcRule = PREFIX_FILE_TO_ARTIFACT_MAP.find(([prefix]) => prefix === 'src/');
    expect(srcRule).toBeDefined();
    expect(srcRule?.[1]).toContain('codebase-overview.md');
    expect(srcRule?.[1]).toContain('call-graph.md');
  });

  it('优先命中精确规则', () => {
    const result = matchArtifactsByChangedFile('package.json');
    expect(result).toEqual(['tech-stack.md', 'external-deps.md']);
  });

  it('命中目录前缀规则', () => {
    const result = matchArtifactsByChangedFile('src/core/index.ts');
    expect(result).toContain('architecture.md');
    expect(result).toContain('api-docs.md');
  });

  it('未知路径回退到默认产物', () => {
    const result = matchArtifactsByChangedFile('unknown/path/file.txt');
    expect(result).toEqual([...DEFAULT_AFFECTED_ARTIFACTS]);
  });
});


describe('first runtime projection mapping', () => {
  it('declares runtime artifacts and docs projection targets', async () => {
    const mapping = await import('../../src/core/skill-runtime/first-artifact-mapping.js');

    expect(mapping.FIRST_RUNTIME_ARTIFACTS).toEqual([
      'summary.json',
      'role-views.json',
      'stage-views.json',
      'steering.json',
      'conventions.json',
      'critical-flows.json',
      'change-map.json',
      'entry-guide.json',
      'reboot-guide.json',
    ]);
    expect(mapping.getProjectionDocsForRuntimeArtifact('summary.json')).toContain('docs/first/README.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('summary.json')).toContain('docs/first/summary.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('summary.json')).not.toContain('docs/first/tech-stack.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('role-views.json')).toContain('docs/first/role-views.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('stage-views.json')).toContain('docs/first/README.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('stage-views.json')).toContain('docs/first/stage-views.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('steering.json')).toContain('docs/first/steering.md');
    expect(mapping.matchRuntimeArtifactsByChangedFile('src/core/skill-runtime/first-conventions.ts')).toEqual(['conventions.json']);
    expect(mapping.matchRuntimeArtifactsByChangedFile('src/core/skill-runtime/first-critical-flows.ts')).toEqual(['critical-flows.json']);
    expect(mapping.getProjectionDocsForRuntimeArtifact('critical-flows.json')).toContain('docs/first/critical-flows.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('change-map.json')).toContain('docs/first/change-map.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('change-map.json')).toContain('docs/first/common-playbooks.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('entry-guide.json')).toContain('docs/first/entry-guide.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('entry-guide.json')).toContain('docs/first/common-playbooks.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('reboot-guide.json')).toContain('docs/first/reboot-guide.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('reboot-guide.json')).toContain('docs/first/known-risks-and-traps.md');
  });

  it('keeps README and summary/role/stage/steering views as the only canonical projection docs', () => {
    const projectionDocs = Array.from(
      new Set(Object.values(FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP).flat())
    ).sort();

    expect(projectionDocs).toEqual([
      'docs/first/README.md',
      'docs/first/change-map.md',
      'docs/first/common-playbooks.md',
      'docs/first/conventions.md',
      'docs/first/critical-flows.md',
      'docs/first/entry-guide.md',
      'docs/first/known-risks-and-traps.md',
      'docs/first/reboot-guide.md',
      'docs/first/role-views.md',
      'docs/first/stage-views.md',
      'docs/first/steering.md',
      'docs/first/summary.md',
    ]);
  });

  it('treats projection source changes as docs refresh triggers', async () => {
    const mapping = await import('../../src/core/skill-runtime/first-artifact-mapping.js');

    expect(mapping.matchRuntimeArtifactsByChangedFile('src/core/skill-runtime/first-doc-projection.ts')).toEqual([
      'summary.json',
      'role-views.json',
      'stage-views.json',
      'steering.json',
      'conventions.json',
      'critical-flows.json',
      'change-map.json',
      'entry-guide.json',
      'reboot-guide.json',
    ]);
    expect(mapping.collectProjectionDocsForChangedFiles(['src/core/skill-runtime/first-doc-projection.ts'])).toContain('docs/first/README.md');
  });
});
