'use strict';

module.exports = {
  'Context Harness': {
    'bounded direct source reads': {
      type: 'content',
      paths: [
        'skills/spec-mcp-setup/SKILL.md',
        'skills/spec-brainstorm/SKILL.md',
        'skills/spec-work/SKILL.md',
      ],
      pattern: 'bounded direct source reads',
    },
    '`rg`': {
      type: 'content',
      paths: [
        'skills/spec-mcp-setup/SKILL.md',
        'skills/spec-debug/SKILL.md',
        'skills/spec-work/SKILL.md',
      ],
      pattern: '`rg`',
    },
    'ast-grep': {
      type: 'content',
      paths: [
        'docs/contracts/ai-coding-harness.md',
        'skills/spec-mcp-setup/SKILL.md',
        'skills/spec-work/SKILL.md',
      ],
      pattern: 'ast-grep',
    },
    'context bundle': {
      type: 'path',
      anyOf: [
        'src/cli/helpers/context-bundle.js',
        'docs/contracts/context-bundle.md',
      ],
    },
    'docs/solutions': {
      type: 'path',
      anyOf: ['docs/solutions'],
    },
  },
  'Execution Harness': {
    'spec-plan → tasks → spec-work 执行骨架': {
      type: 'content',
      paths: ['README.md', 'README.zh-CN.md'],
      pattern: /plans\s*->\s*tasks\s*->\s*work/,
    },
  },
  'Evidence Harness': {
    'source reads': {
      type: 'content',
      paths: [
        'docs/contracts/ai-coding-harness.md',
        'skills/spec-work/SKILL.md',
        'skills/spec-debug/SKILL.md',
      ],
      pattern: 'source reads',
    },
    'git diff': {
      type: 'content',
      paths: [
        'skills/spec-work/SKILL.md',
        'skills/spec-code-review/SKILL.md',
        'docs/contracts/governance/task-governance-signals.md',
      ],
      pattern: 'git diff',
    },
    'tests/logs': {
      type: 'content',
      paths: [
        'skills/spec-mcp-setup/SKILL.md',
        'skills/spec-work/SKILL.md',
        'skills/spec-write-tasks/SKILL.md',
      ],
      pattern: 'tests/logs',
    },
    coverage: {
      type: 'aspirational',
      reason: 'HC-004: role contract names coverage, but no general Evidence Harness coverage producer/instrumentation is registered yet.',
    },
    'hypothesis ledger': {
      type: 'content',
      paths: ['skills/spec-debug/SKILL.md', 'tests/unit/spec-debug-contracts.test.js'],
      pattern: 'hypothesis ledger',
    },
  },
  'Evaluation Harness': {
    'debug 命中率': {
      type: 'aspirational',
      reason: 'HC-001: debug hit-rate is not instrumented as a durable metric yet.',
    },
    'review 漏判率': {
      type: 'aspirational',
      reason: 'HC-001: review miss-rate is not instrumented as a durable metric yet.',
    },
    'workflow 质量反馈（由 artifact 产出，不由 LLM 自评）': {
      type: 'content',
      paths: [
        'src/verification/quality-feedback.js',
        'docs/contracts/quality-gates/quality-feedback-topics.schema.json',
        'tests/unit/quality-feedback.test.js',
      ],
      pattern: 'passive-quality-feedback',
    },
    'eval fixture 基础设施（`skills/spec-prd/evals/`，by `test:eval-fixtures`）': {
      type: 'path',
      anyOf: ['skills/spec-prd/evals/examples.json'],
    },
  },
  'Governance Harness': {
    redaction: {
      type: 'content',
      paths: [
        'src/cli/helpers/verification-run-summary.js',
        'docs/contracts/verification/verification-run-summary.md',
        'src/cli/helpers/spec-work-run-artifact.js',
      ],
      pattern: 'redaction_status',
    },
    'mutation gate': {
      type: 'content',
      paths: [
        'docs/contracts/ai-coding-harness.md',
        'docs/contracts/source-runtime-customization-boundary.md',
      ],
      pattern: 'mutation gate',
    },
    'MCP/helper readiness': {
      type: 'content',
      paths: ['README.md', 'README.zh-CN.md'],
      pattern: 'MCP/helper readiness',
    },
    'hook budget': {
      type: 'aspirational',
      reason: 'HC-003: hook budget is named in the role contract, but no source-owned budget mechanism is registered yet.',
    },
  },
  'Knowledge Harness': {
    'spec-compound': {
      type: 'path',
      anyOf: ['skills/spec-compound/SKILL.md'],
    },
    'docs/solutions/': {
      type: 'path',
      anyOf: ['docs/solutions'],
    },
    'project standards': {
      type: 'content',
      paths: [
        'skills/spec-work/SKILL.md',
        'skills/spec-code-review/SKILL.md',
        'skills/spec-work/SKILL.md',
      ],
      pattern: 'project standards',
    },
  },
};
