import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AFFECTED_ARTIFACTS,
  EXACT_FILE_TO_ARTIFACT_MAP,
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

    expect(mapping.FIRST_RUNTIME_ARTIFACTS).toEqual(['summary.json', 'role-views.json', 'stage-views.json']);
    expect(mapping.getProjectionDocsForRuntimeArtifact('summary.json')).toContain('docs/first/README.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('summary.json')).toContain('docs/first/summary.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('role-views.json')).toContain('docs/first/role-views.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('stage-views.json')).toContain('docs/first/README.md');
    expect(mapping.getProjectionDocsForRuntimeArtifact('stage-views.json')).toContain('docs/first/stage-views.md');
  });

  it('treats projection source changes as docs refresh triggers', async () => {
    const mapping = await import('../../src/core/skill-runtime/first-artifact-mapping.js');

    expect(mapping.matchRuntimeArtifactsByChangedFile('src/core/skill-runtime/first-doc-projection.ts')).toEqual([
      'summary.json',
      'role-views.json',
      'stage-views.json',
    ]);
    expect(mapping.collectProjectionDocsForChangedFiles(['src/core/skill-runtime/first-doc-projection.ts'])).toContain('docs/first/README.md');
  });
});
