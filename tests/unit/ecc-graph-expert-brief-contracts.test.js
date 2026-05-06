'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const { routeCandidates } = require('../../scripts/route-ecc-agent-candidates');
const {
  hashStatusText,
  prepareGraphExpertBrief,
} = require('../../scripts/prepare-ecc-graph-expert-brief');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_DIR = path.join(REPO_ROOT, 'src', 'cli', 'contracts', 'agent-registry');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(repoRoot, relativePath, value) {
  const fullPath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function git(repoRoot, args) {
  return execFileSync('git', ['-C', repoRoot, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Test User',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'Test User',
      GIT_COMMITTER_EMAIL: 'test@example.com',
    },
  }).trimEnd();
}

function commitTree(repoRoot, message) {
  const tree = git(repoRoot, ['write-tree']);
  const commit = git(repoRoot, ['commit-tree', tree, '-m', message]);
  git(repoRoot, ['update-ref', 'refs/heads/master', commit]);
  return commit;
}

function createRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-graph-brief-'));
  fs.writeFileSync(path.join(repoRoot, '.gitignore'), '.spec-first/\n');
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# Fixture\n');
  git(repoRoot, ['init']);
  git(repoRoot, ['add', '.gitignore', 'README.md']);
  commitTree(repoRoot, 'initial');
  return repoRoot;
}

function currentHead(repoRoot) {
  return git(repoRoot, ['rev-parse', '--verify', 'HEAD^{commit}']);
}

function currentStatusHash(repoRoot) {
  const status = git(repoRoot, ['status', '--porcelain']);
  return hashStatusText(status);
}

function writeGraphArtifacts(repoRoot, overrides = {}) {
  const providers = overrides.providers || [
    {
      schema_version: 'provider-status.v1',
      provider: 'gitnexus',
      graph_ready: true,
      query_ready: true,
      status: 'ready',
      limitations: [],
    },
    {
      schema_version: 'provider-status.v1',
      provider: 'code-review-graph',
      graph_ready: true,
      query_ready: true,
      status: 'ready',
      limitations: [],
    },
  ];
  const workflowMode = overrides.workflow_mode || 'primary';
  const graphFacts = {
    schema_version: 'graph-facts.v1',
    generated_at: '2026-05-06T00:00:00Z',
    repo_root: repoRoot,
    source_revision: overrides.source_revision || currentHead(repoRoot),
    worktree_dirty: overrides.worktree_dirty === true,
    worktree_status_hash: overrides.worktree_status_hash || currentStatusHash(repoRoot),
    workflow_mode: workflowMode,
    provider_summary: {
      ready_primary_providers: providers.filter((provider) => provider.query_ready).map((provider) => provider.provider),
      degraded_providers: providers.filter((provider) => !provider.query_ready && provider.status !== 'skipped').map((provider) => provider.provider),
      not_applicable_providers: [],
      skipped_primary_providers: [],
      partial_primary_available: providers.some((provider) => provider.query_ready),
    },
    canonical_artifacts: {
      provider_status: '.spec-first/graph/provider-status.json',
      impact_capabilities: '.spec-first/impact/bootstrap-impact-capabilities.json',
    },
    capabilities: {
      query_global_graph: providers.some((provider) => provider.provider === 'gitnexus' && provider.query_ready),
      impact_context: providers.some((provider) => provider.provider === 'code-review-graph' && provider.query_ready),
    },
    staleness_hints: {
      compare_source_revision: true,
      compare_worktree_dirty: true,
      worktree_status_hash: overrides.worktree_status_hash || currentStatusHash(repoRoot),
    },
    confidence: workflowMode === 'primary' ? 'high' : 'medium',
    limitations: workflowMode === 'primary' ? [] : ['Graph facts are partial.'],
    ...overrides.graph_facts,
  };
  const providerStatus = {
    schema_version: 'graph-provider-status.v1',
    generated_at: '2026-05-06T00:00:00Z',
    workflow_mode: workflowMode,
    ready_primary_providers: providers.filter((provider) => provider.query_ready).map((provider) => provider.provider),
    failed_primary_providers: providers.filter((provider) => !provider.query_ready && provider.status !== 'skipped').map((provider) => provider.provider),
    not_applicable_providers: [],
    skipped_primary_providers: [],
    partial_primary_available: providers.some((provider) => provider.query_ready),
    providers,
    confidence: workflowMode === 'primary' ? 'high' : 'medium',
    limitations: workflowMode === 'primary' ? [] : ['One or more graph providers are degraded.'],
    ...overrides.provider_status,
  };
  const impactCapabilities = {
    schema_version: 'bootstrap-impact-capabilities.v1',
    generated_at: '2026-05-06T00:00:00Z',
    workflow_mode: workflowMode,
    capabilities: {
      context_selection: {
        support_level: providers.some((provider) => provider.query_ready) ? 'full' : 'partial',
        primary_providers: providers.filter((provider) => provider.query_ready).map((provider) => provider.provider),
        fallback_support: {},
        confidence: providers.some((provider) => provider.query_ready) ? 'high' : 'medium',
        limitations: [],
      },
      impact_radius: {
        support_level: providers.some((provider) => provider.provider === 'code-review-graph' && provider.query_ready) ? 'full' : 'partial',
        primary_providers: providers.filter((provider) => provider.provider === 'code-review-graph' && provider.query_ready).map((provider) => provider.provider),
        fallback_support: {},
        confidence: providers.some((provider) => provider.provider === 'code-review-graph' && provider.query_ready) ? 'high' : 'unknown',
        limitations: [],
      },
      review_support: {
        support_level: providers.some((provider) => provider.provider === 'code-review-graph' && provider.query_ready) ? 'partial' : 'none',
        primary_providers: providers.filter((provider) => provider.provider === 'code-review-graph' && provider.query_ready).map((provider) => provider.provider),
        fallback_support: {},
        confidence: providers.some((provider) => provider.provider === 'code-review-graph' && provider.query_ready) ? 'medium' : 'unknown',
        limitations: ['Readiness only.'],
      },
    },
    downstream_guidance: {
      canonical_graph_facts: '.spec-first/graph/graph-facts.json',
      provider_status: '.spec-first/graph/provider-status.json',
      limitations_required: workflowMode !== 'primary',
    },
    ...overrides.impact_capabilities,
  };

  writeJson(repoRoot, '.spec-first/graph/graph-facts.json', graphFacts);
  writeJson(repoRoot, '.spec-first/graph/provider-status.json', providerStatus);
  writeJson(repoRoot, '.spec-first/impact/bootstrap-impact-capabilities.json', impactCapabilities);
}

describe('ECC Graph-aware Expert brief', () => {
  test('prepares primary graph context without selecting final agents', () => {
    const repoRoot = createRepo();
    writeGraphArtifacts(repoRoot);
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'graph-expert-brief.schema.json'));
    const output = prepareGraphExpertBrief({
      workflow: 'spec-plan',
      changed_files: ['src/api/user.ts'],
      risk_signals: ['api_changed'],
    }, { repoRoot });

    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output).not.toHaveProperty('selected_agents');
    expect(output).not.toHaveProperty('final_verdict');
    expect(output.graph_readiness).toMatchObject({
      status: 'primary',
      confidence: 'high',
      limitations_required: false,
    });
    expect(output.decision_boundary.requires_skill_decision).toBe(true);
    expect(output.forbidden_actions).toEqual(expect.arrayContaining([
      'run_provider_commands',
      'write_graph_artifacts',
      'semantic_impact_conclusion',
    ]));
    expect(output.expert_graph_context.map((context) => context.agent_id)).toEqual(expect.arrayContaining([
      'spec-architecture-strategist',
      'spec-repo-research-analyst',
      'spec-api-contract-reviewer',
    ]));
    expect(output.expert_graph_context.find((context) => context.agent_id === 'spec-architecture-strategist'))
      .toMatchObject({
        graph_use_case: 'architecture_impact',
        confidence_ceiling: 'high',
        allowed_graph_artifacts: expect.arrayContaining([
          {
            path: '.spec-first/graph/graph-facts.json',
            allowed_use: 'primary_evidence',
          },
        ]),
      });
  });

  test('downgrades stale graph facts when source revision no longer matches HEAD', () => {
    const repoRoot = createRepo();
    writeGraphArtifacts(repoRoot);
    fs.appendFileSync(path.join(repoRoot, 'README.md'), '\nSecond commit\n');
    git(repoRoot, ['add', 'README.md']);
    commitTree(repoRoot, 'second');

    const output = prepareGraphExpertBrief({
      workflow: 'spec-plan',
    }, { repoRoot });

    expect(output.graph_readiness.status).toBe('stale');
    expect(output.graph_readiness.confidence).toBe('low');
    expect(output.graph_readiness.reason_codes).toContain('source_revision_mismatch');
    expect(output.expert_graph_context[0].confidence_ceiling).toBe('low');
    expect(output.expert_graph_context[0].allowed_graph_artifacts[0].allowed_use).toBe('orientation_only');
    expect(output.expert_graph_context[0].required_disclosures).toContain('source_revision_mismatch');
  });

  test('marks dirty worktree fingerprint mismatch as dirty-uncertain', () => {
    const repoRoot = createRepo();
    writeGraphArtifacts(repoRoot);
    fs.appendFileSync(path.join(repoRoot, 'README.md'), '\nUncommitted change\n');

    const output = prepareGraphExpertBrief({
      workflow: 'spec-code-review',
    }, { repoRoot });

    expect(output.graph_readiness.status).toBe('dirty-uncertain');
    expect(output.graph_readiness.reason_codes).toContain('worktree_status_hash_mismatch');
    expect(output.expert_graph_context.every((context) => context.confidence_ceiling === 'low')).toBe(true);
    expect(output.expert_graph_context[0].fallback_guidance.join(' ')).toContain('orientation only');
  });

  test('reports missing artifacts without semantic conclusions', () => {
    const repoRoot = createRepo();
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'graph-expert-brief.schema.json'));
    const output = prepareGraphExpertBrief({
      workflow: 'spec-code-review',
    }, { repoRoot });

    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output.graph_readiness.status).toBe('missing');
    expect(output.graph_readiness.confidence).toBe('unknown');
    expect(output.graph_readiness.reason_codes).toEqual(expect.arrayContaining([
      'graph_facts_missing',
      'provider_status_missing',
      'impact_capabilities_missing',
    ]));
    expect(output).not.toHaveProperty('semantic_impact_conclusion');
    expect(output).not.toHaveProperty('selected_agents');
    expect(output.expert_graph_context[0].allowed_graph_artifacts[0].allowed_use).toBe('unavailable');
  });

  test('router candidates restrict graph-aware context and keep Skill decision boundary', () => {
    const repoRoot = createRepo();
    writeGraphArtifacts(repoRoot);
    const routerCandidates = routeCandidates({
      workflow: 'spec-code-review',
      changed_files: ['openapi.yaml'],
      risk_signals: [],
    });

    const output = prepareGraphExpertBrief({
      workflow: 'spec-code-review',
      router_candidates: routerCandidates,
    }, { repoRoot });

    expect(output.router_context.available).toBe(true);
    expect(output.router_context.requires_skill_decision).toBe(true);
    expect(output.router_context.candidate_agents).toEqual(expect.arrayContaining(['spec-api-contract-reviewer']));
    expect(output.expert_graph_context.map((context) => context.agent_id)).toEqual(
      output.router_context.graph_aware_candidate_agents,
    );
    expect(output.expert_graph_context.map((context) => context.agent_id)).toContain('spec-api-contract-reviewer');
    expect(output.non_graph_agents.map((agent) => agent.agent_id)).toEqual(
      output.router_context.non_graph_candidate_agents,
    );
  });

  test('rejects router workflow mismatch instead of mixing graph contexts', () => {
    const repoRoot = createRepo();
    writeGraphArtifacts(repoRoot);
    const routerCandidates = routeCandidates({
      workflow: 'spec-code-review',
      changed_files: ['openapi.yaml'],
      risk_signals: [],
    });

    expect(() => prepareGraphExpertBrief({
      workflow: 'spec-plan',
      router_candidates: routerCandidates,
    }, { repoRoot })).toThrow('router candidate workflow mismatch');
  });

  test('rejects unsupported workflow names', () => {
    const repoRoot = createRepo();
    expect(() => prepareGraphExpertBrief({
      workflow: 'spec-skill-audit',
    }, { repoRoot })).toThrow('unsupported workflow');
  });

  test('uses the same empty status hash format as graph bootstrap', () => {
    expect(hashStatusText('')).toBe(`sha256:${crypto.createHash('sha256').update('').digest('hex')}`);
  });
});
