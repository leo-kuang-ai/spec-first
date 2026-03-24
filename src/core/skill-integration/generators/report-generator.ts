import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import type { IntegrationPlan } from '../integration-planner.js';

function loadTemplate(projectRoot: string): string {
  const candidate = join(projectRoot, 'templates', 'skill-integration', 'report.md.hbs');
  if (existsSync(candidate)) {
    return readFileSync(candidate, 'utf-8');
  }

  return `# Skill Integration Report: {{requestedName}}

## Source
- Requested name: {{requestedName}}
- Final name: {{finalName}}
- Mode: {{mode}}

## Skill summary
- Name: {{profile.name}}

## Category/stage
- Category: {{targetConfig.category}}
- Primary stage: {{targetConfig.primaryStage}}
`;
}

export function renderIntegrationReport(plan: IntegrationPlan, projectRoot = process.cwd()): string {
  const template = loadTemplate(projectRoot);
  const compiled = Handlebars.compile(template);
  return compiled(plan);
}

