import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadFirstContext } from './first-context.js';
import { FIRST_RUNTIME_ARTIFACTS, getProjectionDocsForRuntimeArtifact } from './first-artifact-mapping.js';

const ROLE_LABELS = {
  product: 'Product',
  dev: 'Developer',
  qa: 'QA',
  architect: 'Architect',
} as const;

const STAGE_LABELS = {
  spec: 'Spec View',
  design: 'Design View',
  code: 'Code View',
  verify: 'Verify View',
} as const;

function renderList(items: string[], emptyLabel: string = '无'): string[] {
  return items.length > 0 ? items.map(item => `- ${item}`) : [`- ${emptyLabel}`];
}

function renderSection(title: string, items: string[], emptyLabel?: string): string[] {
  return ['', `## ${title}`, ...renderList(items, emptyLabel)];
}

function renderSubsection(title: string, items: string[], emptyLabel?: string): string[] {
  return ['', `### ${title}`, ...renderList(items, emptyLabel)];
}

function renderOverviewDoc(context: ReturnType<typeof loadFirstContext>): string {
  const summaryDoc = 'docs/first/summary.md';
  const roleViewsDoc = 'docs/first/role-views.md';
  const stageViewsDoc = 'docs/first/stage-views.md';

  return [
    '# First Runtime Projection',
    '',
    `- project: ${context.summary.project.name}`,
    `- mode: ${context.summary.mode}`,
    `- generatedAt: ${context.summary.generatedAt}`,
    '',
    '## Canonical Docs',
    `- ${summaryDoc}`,
    `- ${roleViewsDoc}`,
    `- ${stageViewsDoc}`,
    '',
    '## Runtime Assets',
    '- .spec-first/runtime/first/summary.json',
    '- .spec-first/runtime/first/role-views.json',
    '- .spec-first/runtime/first/stage-views.json',
  ].join('\n');
}

function renderSummaryDoc(context: ReturnType<typeof loadFirstContext>): string {
  return [
    '# First Runtime Summary',
    '',
    '## 项目概览',
    `- 项目: ${context.summary.project.name}`,
    `- 模式: ${context.summary.mode}`,
    `- 平台: ${context.summary.project.platformType ?? 'unknown'}`,
    `- 生成时间: ${context.summary.generatedAt}`,
    `- 概述: ${context.summary.project.overview ?? '未提供'}`,
    ...renderSection('Capabilities', context.summary.capabilities),
    ...renderSection('Modules', context.summary.modules),
    ...renderSection('Entry Points', context.summary.entryPoints),
    ...renderSection('Data Models', context.summary.dataModels),
    ...renderSection('API Surface', context.summary.apiSurface),
    ...renderSection('Risks', context.summary.risks),
    ...renderSection('Evidence', context.summary.evidence),
  ].join('\n');
}

function renderRoleViewsDoc(context: ReturnType<typeof loadFirstContext>): string {
  const lines = ['# First Runtime Role Views'];

  for (const role of Object.keys(context.roleViews) as Array<keyof typeof context.roleViews>) {
    const view = context.roleViews[role];
    lines.push('', `## ${ROLE_LABELS[role]}`, '', `- Summary: ${view.summary}`);
    lines.push(...renderSubsection('Focus', view.focus));
    lines.push(...renderSubsection('Warnings', view.warnings));
  }

  return lines.join('\n');
}

function renderStageViewsDoc(context: ReturnType<typeof loadFirstContext>): string {
  const lines = ['# First Runtime Stage Views'];

  for (const stage of Object.keys(context.stageViews) as Array<keyof typeof context.stageViews>) {
    if (stage === 'spec') {
      const view = context.stageViews.spec;
      lines.push('', `## ${STAGE_LABELS[stage]}`, '', `- Summary: ${view.summary}`);
      lines.push(...renderSubsection('Business Capabilities', view.businessCapabilities));
      lines.push(...renderSubsection('Core Entities', view.coreEntities));
      lines.push(...renderSubsection('Dependencies', view.dependencies));
      lines.push(...renderSubsection('Warnings', view.warnings));
      continue;
    }

    if (stage === 'design') {
      const view = context.stageViews.design;
      lines.push('', `## ${STAGE_LABELS[stage]}`, '', `- Summary: ${view.summary}`);
      lines.push(...renderSubsection('Module Boundaries', view.moduleBoundaries));
      lines.push(...renderSubsection('Integration Points', view.integrationPoints));
      lines.push(...renderSubsection('Technical Constraints', view.technicalConstraints));
      lines.push(...renderSubsection('Risks', view.risks));
      continue;
    }

    if (stage === 'code') {
      const view = context.stageViews.code;
      lines.push('', `## ${STAGE_LABELS[stage]}`, '', `- Summary: ${view.summary}`);
      lines.push(...renderSubsection('Entry Points', view.entryPoints));
      lines.push(...renderSubsection('Likely Change Areas', view.likelyChangeAreas));
      lines.push(...renderSubsection('Call Path Hints', view.callPathHints ?? []));
      lines.push(...renderSubsection('Coupling Points', view.couplingPoints ?? []));
      lines.push(...renderSubsection('Change Hazards', view.changeHazards));
      lines.push(...renderSubsection('Verification Hooks', view.verificationHooks));
      continue;
    }

    const view = context.stageViews.verify;
    lines.push('', `## ${STAGE_LABELS[stage]}`, '', `- Summary: ${view.summary}`);
    lines.push(...renderSubsection('Critical Flows', view.criticalFlows ?? []));
    lines.push(...renderSubsection('Validation Focus', view.validationFocus ?? []));
    lines.push(...renderSubsection('Test Focus', view.testFocus));
    lines.push(...renderSubsection('Risk Areas', view.riskAreas));
    lines.push(...renderSubsection('Recommended Checks', view.recommendedChecks ?? []));
    lines.push(...renderSubsection('Validation Hooks', view.validationHooks));
    lines.push(...renderSubsection('Release Blockers', view.releaseBlockers));
  }

  return lines.join('\n');
}

function renderGenericProjectedDoc(docPath: string, context: ReturnType<typeof loadFirstContext>): string {
  const fileName = docPath.split('/').at(-1) ?? 'first-doc';

  return [
    `# ${fileName}`,
    '',
    `- project: ${context.summary.project.name}`,
    `- generatedAt: ${context.summary.generatedAt}`,
    '- projection: runtime-derived document',
    '- canonical-docs:',
    '  - docs/first/summary.md',
    '  - docs/first/role-views.md',
    '  - docs/first/stage-views.md',
    '',
    '## Notes',
    '- This document is projected from the current first runtime assets.',
    '- Prefer canonical docs for detailed review and stage-specific decisions.',
  ].join('\n');
}

export function renderProjectedDoc(docPath: string, context: ReturnType<typeof loadFirstContext>): string {
  if (docPath.endsWith('README.md')) {
    return renderOverviewDoc(context);
  }
  if (docPath.endsWith('summary.md')) {
    return renderSummaryDoc(context);
  }
  if (docPath.endsWith('role-views.md')) {
    return renderRoleViewsDoc(context);
  }
  if (docPath.endsWith('stage-views.md')) {
    return renderStageViewsDoc(context);
  }

  return renderGenericProjectedDoc(docPath, context);
}

export function refreshFirstDocsFromRuntime(projectRoot: string, runtimeArtifacts: string[] = [...FIRST_RUNTIME_ARTIFACTS]): string[] {
  const context = loadFirstContext(projectRoot);
  const docs = Array.from(new Set(
    runtimeArtifacts
      .filter((artifact): artifact is (typeof FIRST_RUNTIME_ARTIFACTS)[number] => FIRST_RUNTIME_ARTIFACTS.includes(artifact as (typeof FIRST_RUNTIME_ARTIFACTS)[number]))
      .flatMap(artifact => getProjectionDocsForRuntimeArtifact(artifact)),
  ));

  for (const relativeDocPath of docs) {
    const fullPath = join(projectRoot, relativeDocPath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, renderProjectedDoc(relativeDocPath, context), 'utf-8');
  }

  return docs;
}

export { getProjectionDocsForRuntimeArtifact };
