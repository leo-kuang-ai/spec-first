import { describe, expect, it } from 'vitest';
import {
  buildDocumentMap,
  hasDocumentReference,
  isDocumentLinksFile,
  validateDocumentLinksData,
} from '../../src/core/document-links.js';
import { Stage } from '../../src/shared/types.js';

describe('document-links', () => {
  it('accepts minimal valid document-links structure', () => {
    expect(
      isDocumentLinksFile({
        version: 1,
        featureId: 'FSREQ-20260323-AUTH-001',
        documents: [
          {
            path: 'spec.md',
            kind: 'requirements',
            stage: Stage.SPECIFY,
            references: [],
          },
        ],
      })
    ).toBe(true);
  });

  it('rejects invalid structure', () => {
    expect(
      isDocumentLinksFile({
        version: 1,
        featureId: 'FSREQ-20260323-AUTH-001',
        documents: [{ path: 'spec.md', kind: 'requirements', stage: Stage.SPECIFY }],
      })
    ).toBe(false);
  });

  it('reports duplicate paths and missing references', () => {
    const result = validateDocumentLinksData({
      version: 1,
      featureId: 'FSREQ-20260323-AUTH-001',
      documents: [
        {
          path: 'spec.md',
          kind: 'requirements',
          stage: Stage.SPECIFY,
          references: [],
        },
        {
          path: 'design.md',
          kind: 'design',
          stage: Stage.DESIGN,
          references: ['spec.md', 'missing.md'],
        },
        {
          path: 'design.md',
          kind: 'design',
          stage: Stage.DESIGN,
          references: ['spec.md'],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      'document-links.yaml 包含重复文档路径：design.md',
      'document-links.yaml 存在缺失引用：design.md -> missing.md',
    ]);
  });

  it('builds map and resolves references explicitly', () => {
    const file = {
      version: 1 as const,
      featureId: 'FSREQ-20260323-AUTH-001',
      documents: [
        {
          path: 'spec.md',
          kind: 'requirements',
          stage: Stage.SPECIFY,
          references: [],
        },
        {
          path: 'task_plan.md',
          kind: 'plan',
          stage: Stage.PLAN,
          references: ['spec.md', 'design.md'],
        },
      ],
    };

    const map = buildDocumentMap(file);
    expect(map.get('spec.md')?.kind).toBe('requirements');
    expect(hasDocumentReference(file, 'task_plan.md', 'spec.md')).toBe(true);
    expect(hasDocumentReference(file, 'task_plan.md', 'missing.md')).toBe(false);
  });
});
