/**
 * Gate 条件定义注册表
 * 仅基于阶段状态、文档存在性、文档引用、关键证据文件存在性进行校验
 */
import { join } from 'node:path';
import { readFileSync, statSync } from 'node:fs';
import type { Stage, StageState } from '../../shared/types.js';
import { exists } from '../../shared/fs-utils.js';
import {
  loadDocumentLinks,
  validateStageDocumentLinks,
  listMissingDocumentFiles,
} from '../document-links.js';
import { validatePrd } from './prd-validator.js';
import { RELEASE_REQUIRED_ARTIFACTS } from '../rules/truth-source.js';
import { evaluateConstitutionCompliance } from './constitution-validator.js';
import { analyzeArtifacts, getCriticalCountFromAnalysisReport } from './sca.js';

export interface GateConditionDef {
  id: string;
  description: string;
  blocking?: boolean;
  evaluate: (ctx: EvalContext) => {
    pass: boolean;
    detail?: string;
    blocking?: boolean;
  };
}

export interface EvalContext {
  featureId: string;
  projectRoot: string;
  stage: Stage;
  state: StageState;
}

export const GATE_CONDITIONS: Partial<Record<Stage, GateConditionDef[]>> = {};

GATE_CONDITIONS['00_init' as Stage] = [
  {
    id: 'G-INIT-01',
    description: 'Feature directory exists',
    evaluate: (ctx) => {
      const dir = join(ctx.projectRoot, 'specs', ctx.featureId);
      return { pass: exists(dir), detail: dir };
    },
  },
  {
    id: 'G-INIT-02',
    description: 'Mode/Size/Platforms confirmed',
    evaluate: (ctx) => {
      const { mode, size, platforms } = ctx.state;
      const pass = !!mode && !!size && Array.isArray(platforms) && platforms.length > 0;
      return { pass, detail: `mode=${mode} size=${size} platforms=${platforms.join(',')}` };
    },
  },
  {
    id: 'G-INIT-03',
    description: 'stage-state.json exists',
    evaluate: (ctx) => {
      const filePath = join(ctx.projectRoot, 'specs', ctx.featureId, 'stage-state.json');
      return { pass: exists(filePath), detail: filePath };
    },
  },
];

GATE_CONDITIONS['01_specify' as Stage] = [
  {
    id: 'G-SPEC-00',
    description: 'PRD exists and C-PRD ≥ 85% (warning)',
    blocking: false,
    evaluate: (ctx) => {
      const prdPath = join(ctx.projectRoot, 'specs', ctx.featureId, 'prd.md');
      if (!exists(prdPath)) {
        return { pass: false, detail: 'prd.md not found', blocking: false };
      }
      const result = validatePrd(prdPath);
      return {
        pass: result.valid && result.score >= 85,
        detail: `C-PRD=${result.score}% errors=${result.errors.length}`,
        blocking: false,
      };
    },
  },
  {
    id: 'G-SPEC-01',
    description: 'spec.md exists',
    evaluate: (ctx) => ({
      pass: exists(join(ctx.projectRoot, 'specs', ctx.featureId, 'spec.md')),
    }),
  },
  {
    id: 'G-SPEC-02',
    description: 'document-links.yaml declares spec.md',
    evaluate: (ctx) => {
      const links = loadDocumentLinks(ctx.featureId, ctx.projectRoot);
      const result = validateStageDocumentLinks(links, ctx.stage);
      return { pass: result.pass, detail: result.detail };
    },
  },
  {
    id: 'G-SPEC-03',
    description: 'Spec quality score (C10) ≥ 80% (warning)',
    blocking: false,
    evaluate: (ctx) => {
      const c10 = evaluateSpecQualityScore(ctx.featureId, ctx.projectRoot);
      return { pass: c10.pass, detail: c10.detail, blocking: false };
    },
  },
];

GATE_CONDITIONS['02_design' as Stage] = [
  {
    id: 'G-DESIGN-01',
    description: 'design.md exists',
    evaluate: (ctx) => ({
      pass: exists(join(ctx.projectRoot, 'specs', ctx.featureId, 'design.md')),
    }),
  },
  {
    id: 'G-DESIGN-02',
    description: 'design.md references spec.md',
    evaluate: (ctx) => {
      const links = loadDocumentLinks(ctx.featureId, ctx.projectRoot);
      const result = validateStageDocumentLinks(links, ctx.stage);
      return { pass: result.pass, detail: result.detail };
    },
  },
  {
    id: 'G-DESIGN-03',
    description: 'Constitution compliance (warning)',
    blocking: false,
    evaluate: (ctx) => {
      const result = evaluateConstitutionCompliance(ctx.featureId, ctx.projectRoot);
      return { pass: result.pass, detail: result.detail, blocking: false };
    },
  },
];

GATE_CONDITIONS['03_plan' as Stage] = [
  {
    id: 'G-PLAN-01',
    description: 'task_plan.md exists',
    evaluate: (ctx) => ({
      pass: exists(join(ctx.projectRoot, 'specs', ctx.featureId, 'task_plan.md')),
    }),
  },
  {
    id: 'G-PLAN-02',
    description: 'task_plan.md references spec.md and design.md',
    evaluate: (ctx) => {
      const links = loadDocumentLinks(ctx.featureId, ctx.projectRoot);
      const result = validateStageDocumentLinks(links, ctx.stage);
      return { pass: result.pass, detail: result.detail };
    },
  },
  {
    id: 'G-PLAN-03',
    description: 'Analyze CRITICAL findings = 0',
    evaluate: (ctx) => evaluateAnalyzeCriticalFindings(ctx.featureId, ctx.projectRoot),
  },
];

GATE_CONDITIONS['04_implement' as Stage] = [
  {
    id: 'G-IMPL-01',
    description: 'Declared documents exist on disk',
    evaluate: (ctx) => {
      const links = loadDocumentLinks(ctx.featureId, ctx.projectRoot);
      const missing = listMissingDocumentFiles(links, ctx.featureId, ctx.projectRoot);
      return {
        pass: missing.length === 0,
        detail: missing.length === 0 ? 'all declared docs exist' : `missing: ${missing.join(', ')}`,
      };
    },
  },
];

GATE_CONDITIONS['05_verify' as Stage] = [
  {
    id: 'G-VERIFY-01',
    description: 'reports/test-report.md exists',
    evaluate: (ctx) => {
      const filePath = join(ctx.projectRoot, 'specs', ctx.featureId, 'reports', 'test-report.md');
      return { pass: exists(filePath), detail: filePath };
    },
  },
  {
    id: 'G-VERIFY-03',
    description: 'reports/security-scan.md exists',
    evaluate: (ctx) => {
      const filePath = join(
        ctx.projectRoot,
        'specs',
        ctx.featureId,
        'reports',
        'security-scan.md'
      );
      return { pass: exists(filePath), detail: filePath };
    },
  },
];

GATE_CONDITIONS['06_wrap_up' as Stage] = [
  {
    id: 'G-WRAP-01',
    description: 'retro.md exists',
    evaluate: (ctx) => ({
      pass: exists(join(ctx.projectRoot, 'specs', ctx.featureId, 'retro.md')),
    }),
  },
  {
    id: 'G-WRAP-02',
    description: 'release evidence exists',
    evaluate: (ctx) => {
      const missing = RELEASE_REQUIRED_ARTIFACTS.filter(
        (relativePath) => !exists(join(ctx.projectRoot, 'specs', ctx.featureId, relativePath))
      );
      return {
        pass: missing.length === 0,
        detail: missing.length === 0 ? 'release evidence complete' : `missing: ${missing.join(', ')}`,
      };
    },
  },
];

GATE_CONDITIONS['07_release' as Stage] = RELEASE_REQUIRED_ARTIFACTS.map((relativePath, index) => ({
  id: index === 0 ? 'G-REL-01' : 'G-REL-02',
  description: relativePath,
  evaluate: (ctx) => ({
    pass: exists(join(ctx.projectRoot, 'specs', ctx.featureId, relativePath)),
  }),
}));

export function shouldSkipCondition(conditionId: string, projectType: string): boolean {
  if (projectType === 'css-only') return conditionId === 'G-DESIGN-03';
  return false;
}

function evaluateSpecQualityScore(
  featureId: string,
  projectRoot: string
): { pass: boolean; detail: string } {
  const specDir = join(projectRoot, 'specs', featureId);
  const candidates = [
    join(specDir, 'checklists', 'spec-review.md'),
    join(specDir, 'spec-review.md'),
    join(specDir, 'checklist.md'),
  ];
  const source = candidates.find((filePath) => exists(filePath));
  if (!source) {
    return {
      pass: false,
      detail: 'C10 unavailable: missing checklists/spec-review.md',
    };
  }

  const content = readFileSync(source, 'utf-8');
  const totalChecks = (content.match(/^\s*[-*]\s*\[[ xX]\]\s+/gm) ?? []).length;
  const passedChecks = (content.match(/^\s*[-*]\s*\[[xX]\]\s+/gm) ?? []).length;

  if (totalChecks === 0) {
    return {
      pass: false,
      detail: `C10 unavailable: no checklist items parsed in ${toFeatureRelativePath(featureId, projectRoot, source)}`,
    };
  }

  const score = passedChecks / totalChecks;
  return {
    pass: score >= 0.8,
    detail: `C10=${(score * 100).toFixed(1)}% (${passedChecks}/${totalChecks}) source=${toFeatureRelativePath(featureId, projectRoot, source)}`,
  };
}

function evaluateAnalyzeCriticalFindings(
  featureId: string,
  projectRoot: string
): { pass: boolean; detail: string } {
  const reportPath = join(projectRoot, 'specs', featureId, 'reports', 'analysis-report.md');

  if (exists(reportPath)) {
    const ageMs = Date.now() - statSync(reportPath).mtime.getTime();
    if (ageMs > 5 * 60 * 1000) {
      analyzeArtifacts(featureId, projectRoot);
    }
  } else {
    return {
      pass: false,
      detail: 'Analyze report missing: run `spec-first analyze <featureId>` first',
    };
  }

  const content = readFileSync(reportPath, 'utf-8');
  const critical = getCriticalCountFromAnalysisReport(content);
  return {
    pass: critical === 0,
    detail: `Analyze CRITICAL=${critical} (source=reports/analysis-report.md)`,
  };
}

function toFeatureRelativePath(
  featureId: string,
  projectRoot: string,
  absolutePath: string
): string {
  const prefix = `${join(projectRoot, 'specs', featureId)}/`;
  return absolutePath.startsWith(prefix) ? absolutePath.slice(prefix.length) : absolutePath;
}
