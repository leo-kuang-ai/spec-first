export interface SharedContractCoverageItem {
  contractName: 'background-quality' | 'orchestration-governance';
  contractPath: string;
  targetPath: string;
  mustContain: string[];
}

export const SHARED_CONTRACT_COVERAGE: SharedContractCoverageItem[] = [
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/01-init/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/02-catchup/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/03-spec/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/04-design/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/06-task/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/07-code/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/08-review/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/11-plan/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'backgroundInputStatus', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/12-verify/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/14-status/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status', 'runtime 真源', 'docs 输出', '同步状态'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/15-doctor/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status', 'runtime 真源', 'docs 输出'],
  },
  {
    contractName: 'background-quality',
    contractPath: 'skills/shared/background-quality-contract.md',
    targetPath: 'skills/21-analyze/SKILL.md',
    mustContain: ['shared/background-quality-contract.md', 'background_input_status', 'runtime 真源', 'docs 输出', '同步状态'],
  },
  {
    contractName: 'orchestration-governance',
    contractPath: 'skills/shared/orchestration-governance-contract.md',
    targetPath: 'skills/11-plan/SKILL.md',
    mustContain: ['shared/orchestration-governance-contract.md', 'dependencyStrength', 'riskCategory', 'riskSignals'],
  },
  {
    contractName: 'orchestration-governance',
    contractPath: 'skills/shared/orchestration-governance-contract.md',
    targetPath: 'skills/13-orchestrate/SKILL.md',
    mustContain: ['shared/orchestration-governance-contract.md', 'background_status', 'dependency_strength', 'risk_category', 'risk_signals', 'recommended_action'],
  },
];
