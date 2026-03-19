export interface SharedContractCoverageItem {
  contractName: 'background-quality' | 'orchestration-governance';
  contractPath: string;
  targetPath: string;
  mustContain: string[];
}

export const SHARED_CONTRACT_COVERAGE: SharedContractCoverageItem[] = [
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/01-init/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/02-catchup/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/03-spec/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/04-design/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/06-task/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/07-code/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/08-review/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/11-plan/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/12-verify/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/14-status/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status', 'runtime 真源', 'docs 输出', '同步状态'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/15-doctor/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status', 'runtime 真源', 'docs 输出'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/21-analyze/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status', 'runtime 真源', 'docs 输出', '同步状态'],
  },
  {
    contractName: 'orchestration-governance',
    contractPath: 'skills/spec-first/shared/orchestration-governance-contract.md',
    targetPath: 'skills/spec-first/11-plan/SKILL.md',
    mustContain: ['shared/orchestration-governance-contract.md', 'dependencyStrength', 'riskCategory', 'riskSignals'],
  },
  {
    contractName: 'orchestration-governance',
    contractPath: 'skills/spec-first/shared/orchestration-governance-contract.md',
    targetPath: 'skills/spec-first/13-orchestrate/SKILL.md',
    mustContain: ['shared/orchestration-governance-contract.md', 'background_status', 'dependency_strength', 'risk_category', 'risk_signals', 'recommended_action'],
  },
];
