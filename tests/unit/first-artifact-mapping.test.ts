import { describe, expect, it } from 'vitest';
import {
  CANONICAL_PROJECTION_DOCS,
  CONDITIONAL_PROJECTION_DOCS,
  DEFAULT_AFFECTED_ARTIFACTS,
  EXACT_FILE_TO_ARTIFACT_MAP,
  FIRST_RUNTIME_ARTIFACTS,
  FORMAL_TOPIC_PROJECTION_DOCS,
  PREFIX_FILE_TO_ARTIFACT_MAP,
  getProjectionDocsForRuntimeArtifact,
  matchArtifactsByChangedFile,
  matchRuntimeArtifactsByChangedFile,
} from '../../src/core/skill-runtime/first-artifact-mapping.js';

describe('first-artifact-mapping', () => {
  it('包含核心精确映射规则', () => {
    expect(EXACT_FILE_TO_ARTIFACT_MAP['package.json']).toEqual(['summary.md', 'external-deps.md']);
    expect(EXACT_FILE_TO_ARTIFACT_MAP['Dockerfile']).toEqual(['architecture.md', 'development-guidelines.md']);
  });

  it('包含核心目录前缀映射规则', () => {
    const srcRule = PREFIX_FILE_TO_ARTIFACT_MAP.find(([prefix]) => prefix === 'src/');
    expect(srcRule?.[1]).toContain('codebase-overview.md');
    expect(srcRule?.[1]).toContain('call-graph.md');
  });

  it('未知路径回退到默认产物', () => {
    expect(matchArtifactsByChangedFile('unknown/path/file.txt')).toEqual([...DEFAULT_AFFECTED_ARTIFACTS]);
  });

  it('声明新的 runtime 资产与 projection 映射', () => {
    expect(FIRST_RUNTIME_ARTIFACTS).toEqual([
      'summary.json',
      'steering.json',
      'conventions.json',
      'critical-flows.json',
      'entry-guide.json',
      'api-contracts.json',
      'structure-overview.json',
      'domain-model.json',
      'database-schema.json',
    ]);
    expect(getProjectionDocsForRuntimeArtifact('summary.json')).toContain('docs/first/summary.md');
    expect(getProjectionDocsForRuntimeArtifact('structure-overview.json')).toContain('docs/first/architecture.md');
    expect(getProjectionDocsForRuntimeArtifact('database-schema.json')).toContain('docs/first/database-er.md');
    expect(matchRuntimeArtifactsByChangedFile('src/core/skill-runtime/first-doc-projection.ts')).toEqual([
      'summary.json',
      'steering.json',
      'conventions.json',
      'critical-flows.json',
      'entry-guide.json',
      'api-contracts.json',
      'structure-overview.json',
      'domain-model.json',
      'database-schema.json',
    ]);
  });

  it('声明新的 projection registry', () => {
    expect(FORMAL_TOPIC_PROJECTION_DOCS).toEqual([
      'docs/first/architecture.md',
      'docs/first/call-graph.md',
      'docs/first/development-guidelines.md',
      'docs/first/external-deps.md',
    ]);
    expect(CONDITIONAL_PROJECTION_DOCS).toEqual(['docs/first/database-er.md']);
    expect(CANONICAL_PROJECTION_DOCS).toEqual([
      'docs/first/README.md',
      'docs/first/api-docs.md',
      'docs/first/architecture.md',
      'docs/first/call-graph.md',
      'docs/first/codebase-overview.md',
      'docs/first/conventions.md',
      'docs/first/critical-flows.md',
      'docs/first/database-er.md',
      'docs/first/development-guidelines.md',
      'docs/first/domain-model.md',
      'docs/first/entry-guide.md',
      'docs/first/external-deps.md',
      'docs/first/steering.md',
      'docs/first/summary.md',
    ]);
  });
});
