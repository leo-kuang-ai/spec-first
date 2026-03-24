import type { IntegrationPlan } from './integration-planner.js';

export function formatIntegrationResult(plan: IntegrationPlan): string {
  return [
    `Integration Result: SUCCESS`,
    `Skill: ${plan.requestedName}`,
    `Category: ${plan.targetConfig.category}`,
    `Recommended Stage: ${plan.targetConfig.primaryStage}`,
    `Mode: ${plan.mode}`,
  ].join('\n');
}

