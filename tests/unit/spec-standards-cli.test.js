'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  deriveTargetSlug,
  checkSpecs,
  indexSpecs,
  initSpecs,
  listSpecs,
  promoteRun,
  refreshSpecs,
  resolveSpecs,
  validateSpecs,
  validateProposalPayload,
  validateRun,
  writeProposal,
} = require('../../src/cli/commands/specs');

const { classifyUnresolvedImportTarget } = require('../../src/crg/graph');

const REPO_ROOT = path.join(__dirname, '..', '..');
const FIXTURE_ROOT = path.join(REPO_ROOT, 'tests', 'fixtures', 'specs');

function makeTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-standards-target-'));
}

function loadPayloadFixture(name, targetRoot) {
  const targetSlug = deriveTargetSlug(targetRoot);
  const raw = fs
    .readFileSync(path.join(FIXTURE_ROOT, name), 'utf8')
    .replaceAll('__TARGET_REPO__', targetRoot)
    .replaceAll('__TARGET_SLUG__', targetSlug);
  return JSON.parse(raw);
}

function writePayloadFile(targetRoot, payload) {
  const filePath = path.join(targetRoot, 'proposal-payload.json');
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return filePath;
}

describe('spec-first specs MVP-A helper', () => {
  test('write-proposal writes a proposal-only run under workflow artifact slug/run-id', () => {
    const targetRoot = makeTempRepo();

    try {
      const payload = loadPayloadFixture('proposal-payload-valid.json', targetRoot);
      const payloadPath = writePayloadFile(targetRoot, payload);
      const result = writeProposal({
        'run-id': payload.run_id,
        target: targetRoot,
        payload: payloadPath,
      });

      expect(result).toMatchObject({
        ok: true,
        run_id: payload.run_id,
        target_slug: deriveTargetSlug(targetRoot),
      });
      expect(result.run_dir).toBe(
        path.join('.spec-first', 'workflows', 'spec-standards', deriveTargetSlug(targetRoot), payload.run_id),
      );

      const runDir = path.join(targetRoot, result.run_dir);
      expect(fs.existsSync(path.join(runDir, 'preview.md'))).toBe(true);
      expect(fs.existsSync(path.join(runDir, 'run-state.json'))).toBe(true);
      expect(fs.existsSync(path.join(runDir, 'detected-profiles.json'))).toBe(true);
      expect(fs.existsSync(path.join(runDir, 'evidence-map.json'))).toBe(true);
      expect(fs.existsSync(path.join(runDir, 'drafts', 'common', 'architecture.md'))).toBe(true);
      expect(fs.existsSync(path.join(runDir, 'rejected', 'inferred-rules.md'))).toBe(true);

      const state = JSON.parse(fs.readFileSync(path.join(runDir, 'run-state.json'), 'utf8'));
      expect(state.schema_version).toBe('standards-run-state/v1');
      expect(state.consumer).toBe('spec-standards');
      expect(state.status).toBe('completed');

      expect(validateRun({ 'run-id': payload.run_id, target: targetRoot })).toMatchObject({
        valid: true,
        errors: [],
      });
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('write-proposal fails closed when the same run already exists', () => {
    const targetRoot = makeTempRepo();

    try {
      const payload = loadPayloadFixture('proposal-payload-valid.json', targetRoot);
      const payloadPath = writePayloadFile(targetRoot, payload);
      writeProposal({ 'run-id': payload.run_id, target: targetRoot, payload: payloadPath });

      expect(() => {
        writeProposal({ 'run-id': payload.run_id, target: targetRoot, payload: payloadPath });
      }).toThrow(/already exists/);
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('payload validation rejects paths outside drafts', () => {
    const targetRoot = makeTempRepo();

    try {
      const payload = loadPayloadFixture('proposal-payload-invalid-path.json', targetRoot);
      const errors = validateProposalPayload(payload, {
        runId: payload.run_id,
        targetRoot,
        targetSlug: deriveTargetSlug(targetRoot),
      });

      expect(errors.join('\n')).toContain('must stay under drafts/');
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('payload validation rejects secret-like values before writing artifacts', () => {
    const targetRoot = makeTempRepo();

    try {
      const payload = loadPayloadFixture('proposal-payload-redaction-risk.json', targetRoot);
      const payloadPath = writePayloadFile(targetRoot, payload);

      expect(() => {
        writeProposal({ 'run-id': payload.run_id, target: targetRoot, payload: payloadPath });
      }).toThrow(/secret-like value/);
      expect(fs.existsSync(path.join(targetRoot, '.spec-first'))).toBe(false);
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('validate-run reports incomplete proposal artifacts', () => {
    const targetRoot = makeTempRepo();

    try {
      const payload = loadPayloadFixture('proposal-payload-valid.json', targetRoot);
      const runDir = path.join(
        targetRoot,
        '.spec-first',
        'workflows',
        'spec-standards',
        deriveTargetSlug(targetRoot),
        payload.run_id,
      );
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'preview.md'), '# Preview\n', 'utf8');

      const result = validateRun({ 'run-id': payload.run_id, target: targetRoot });
      expect(result.valid).toBe(false);
      expect(result.errors.join('\n')).toContain('missing required file: run-state.json');
      expect(result.errors.join('\n')).toContain('drafts must contain at least one markdown file');
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('init creates formal docs/specs structure without overwriting proposal runs', () => {
    const targetRoot = makeTempRepo();

    try {
      const result = initSpecs({ target: targetRoot });

      expect(result).toMatchObject({
        ok: true,
        specs_root: 'docs/specs',
      });
      for (const rel of [
        'README.md',
        'SPEC.md',
        '_index',
        'common',
        'backend',
        'frontend',
        'custom',
      ]) {
        expect(fs.existsSync(path.join(targetRoot, 'docs', 'specs', rel))).toBe(true);
      }
      expect(fs.existsSync(path.join(targetRoot, '.spec-first', 'workflows', 'spec-standards'))).toBe(false);
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('promote requires explicit human confirmation flags', () => {
    const targetRoot = makeTempRepo();

    try {
      const payload = loadPayloadFixture('proposal-payload-valid.json', targetRoot);
      const payloadPath = writePayloadFile(targetRoot, payload);
      writeProposal({ 'run-id': payload.run_id, target: targetRoot, payload: payloadPath });

      expect(() => {
        promoteRun({ 'run-id': payload.run_id, target: targetRoot });
      }).toThrow(/requires --accept-all or at least one of --accept/);
      expect(fs.existsSync(path.join(targetRoot, 'docs', 'specs', 'common', 'architecture.md'))).toBe(false);
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('promote copies confirmed drafts into docs/specs and rebuilds index', () => {
    const targetRoot = makeTempRepo();

    try {
      const payload = loadPayloadFixture('proposal-payload-valid.json', targetRoot);
      const payloadPath = writePayloadFile(targetRoot, payload);
      writeProposal({ 'run-id': payload.run_id, target: targetRoot, payload: payloadPath });

      const result = promoteRun({
        'run-id': payload.run_id,
        target: targetRoot,
        'accept-all': true,
      });

      expect(result.ok).toBe(true);
      expect(result.promoted).toEqual(['docs/specs/common/architecture.md']);
      const promotedPath = path.join(targetRoot, 'docs', 'specs', 'common', 'architecture.md');
      expect(fs.readFileSync(promotedPath, 'utf8')).toContain('confirmation_status: confirmed');
      expect(fs.existsSync(path.join(targetRoot, 'docs', 'specs', '_index', 'specs-index.json'))).toBe(true);

      const specsIndex = JSON.parse(
        fs.readFileSync(path.join(targetRoot, 'docs', 'specs', '_index', 'specs-index.json'), 'utf8'),
      );
      expect(specsIndex.specs).toHaveLength(3);
      expect(specsIndex.specs.map((entry) => entry.path)).toEqual(
        expect.arrayContaining([
          'docs/specs/README.md',
          'docs/specs/SPEC.md',
          'docs/specs/common/architecture.md',
        ]),
      );
      expect(specsIndex.specs.find((entry) => entry.path === 'docs/specs/common/architecture.md')).toMatchObject({
        id: 'common-architecture',
        confirmation_status: 'confirmed',
        priority: 80,
      });
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('promote supports file-level accept and defer decisions', () => {
    const targetRoot = makeTempRepo();

    try {
      const payload = loadPayloadFixture('proposal-payload-valid.json', targetRoot);
      payload.drafts.push({
        path: 'drafts/backend/api.md',
        source: 'extracted',
        confirmation_status: 'inferred',
        lifecycle_status: 'active',
        content: [
          '---',
          'spec_id: backend-api',
          'title: Backend API',
          'source: extracted',
          'confirmation_status: inferred',
          'lifecycle_status: active',
          'level: L3',
          'priority: 80',
          'severity: medium',
          'confidence: medium',
          'status: active',
          '---',
          '# Backend API',
          '',
        ].join('\n'),
      });
      const payloadPath = writePayloadFile(targetRoot, payload);
      writeProposal({ 'run-id': payload.run_id, target: targetRoot, payload: payloadPath });

      const result = promoteRun({
        'run-id': payload.run_id,
        target: targetRoot,
        accept: 'drafts/common/architecture.md',
        defer: 'drafts/backend/api.md',
      });

      expect(result.promoted).toEqual(['docs/specs/common/architecture.md']);
      expect(result.skipped).toEqual([
        { path: 'drafts/backend/api.md', reason: 'deferred_by_user' },
      ]);
      expect(fs.existsSync(path.join(targetRoot, 'docs', 'specs', 'common', 'architecture.md'))).toBe(true);
      expect(fs.existsSync(path.join(targetRoot, 'docs', 'specs', 'backend', 'api.md'))).toBe(false);
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('index supports manual markdown without frontmatter and marks inferred metadata', () => {
    const targetRoot = makeTempRepo();

    try {
      initSpecs({ target: targetRoot });
      const manualPath = path.join(targetRoot, 'docs', 'specs', 'backend', 'payment.md');
      fs.writeFileSync(manualPath, '# Payment\n\n## Summary for Agent\n\n- Payment callbacks must verify signatures.\n', 'utf8');

      const result = indexSpecs({ target: targetRoot });
      expect(result.ok).toBe(true);

      const specsIndex = JSON.parse(
        fs.readFileSync(path.join(targetRoot, 'docs', 'specs', '_index', 'specs-index.json'), 'utf8'),
      );
      const payment = specsIndex.specs.find((entry) => entry.path === 'docs/specs/backend/payment.md');
      expect(payment).toMatchObject({
        source: 'manual',
        confirmation_status: 'manual',
        metadata_inferred: true,
        priority: 85,
        severity: 'medium',
      });
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('resolve builds a task-specific load plan and optional workflow context files', () => {
    const targetRoot = makeTempRepo();

    try {
      initSpecs({ target: targetRoot });
      fs.writeFileSync(path.join(targetRoot, 'docs', 'specs', 'backend', 'api.md'), [
        '---',
        'spec_id: backend-api',
        'title: Backend API',
        'source: manual',
        'confirmation_status: manual',
        'lifecycle_status: active',
        'level: L4',
        'scope:',
        '  - backend',
        'profiles:',
        '  - backend-java-spring',
        'categories:',
        '  - api',
        'keywords:',
        '  - login',
        '  - auth',
        '  - controller',
        'applies_to_paths:',
        '  - "src/main/java/**/controller/**"',
        'priority: 100',
        'severity: high',
        'confidence: high',
        'status: active',
        '---',
        '# Backend API',
        '',
        '## Summary for Agent',
        '',
        '- Login APIs must follow backend API standards.',
        '',
        '## Rules',
        '',
        '### RULE-BACKEND-API-001 Unified response',
        '',
      ].join('\n'));
      fs.writeFileSync(path.join(targetRoot, 'docs', 'specs', 'common', 'security.md'), [
        '---',
        'spec_id: common-security',
        'title: Security',
        'source: manual',
        'confirmation_status: manual',
        'lifecycle_status: active',
        'level: L4',
        'scope:',
        '  - common',
        'categories:',
        '  - security',
        'keywords:',
        '  - auth',
        '  - login',
        'priority: 90',
        'severity: critical',
        'confidence: high',
        'status: active',
        '---',
        '# Security',
        '',
        '## Summary for Agent',
        '',
        '- Authentication changes require security review.',
        '',
      ].join('\n'));
      indexSpecs({ target: targetRoot });

      const result = resolveSpecs({
        target: targetRoot,
        task: '新增 login API，包含 auth 校验',
        files: 'src/main/java/com/example/user/controller/LoginController.java',
        consumer: 'spec-work',
        'task-id': 'login-api',
      });

      expect(result.task_id).toBe('login-api');
      expect(result.task_type).toBe('backend_api_development');
      expect(result.load_full.map((entry) => entry.path)).toContain('docs/specs/backend/api.md');
      expect(result.load_summary.map((entry) => entry.path)).toContain('docs/specs/common/security.md');
      expect(result.metadata.hard_gate).toBe(false);

      const contextDir = path.join(targetRoot, '.spec-first', 'workflows', 'spec-work', 'login-api');
      expect(fs.existsSync(path.join(contextDir, 'resolve-result.json'))).toBe(true);
      expect(fs.readFileSync(path.join(contextDir, 'implement.jsonl'), 'utf8')).toContain('"mode":"full"');
      expect(fs.readFileSync(path.join(contextDir, 'check.jsonl'), 'utf8')).toContain('docs/specs/backend/api.md');
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('check writes review-assistance reports from resolved standards without hard gating', () => {
    const targetRoot = makeTempRepo();

    try {
      initSpecs({ target: targetRoot });
      fs.writeFileSync(path.join(targetRoot, 'docs', 'specs', 'backend', 'api.md'), [
        '---',
        'spec_id: backend-api',
        'title: Backend API',
        'source: manual',
        'confirmation_status: manual',
        'lifecycle_status: active',
        'level: L4',
        'scope:',
        '  - backend',
        'categories:',
        '  - api',
        'keywords:',
        '  - login',
        '  - auth',
        'applies_to_paths:',
        '  - "src/main/java/**/controller/**"',
        'priority: 100',
        'severity: high',
        'confidence: high',
        'status: active',
        '---',
        '# Backend API',
        '',
        '## Summary for Agent',
        '',
        '- Login APIs must follow backend API standards.',
        '',
        '## Rules',
        '',
        '### RULE-BACKEND-API-001 Unified response',
        '',
      ].join('\n'));
      indexSpecs({ target: targetRoot });

      const result = checkSpecs({
        target: targetRoot,
        files: 'src/main/java/com/example/user/controller/LoginController.java',
        task: 'check login API changes',
        'task-id': 'login-check',
      });

      expect(result).toMatchObject({
        ok: true,
        status: 'needs_review',
        hard_gate: false,
        blocking_suggestions: 1,
        report_json: 'docs/specs/reports/spec-check-report.json',
        report_markdown: 'docs/specs/reports/spec-check-report.md',
        resolve_context: path.join('.spec-first', 'workflows', 'spec-check', 'login-check'),
      });

      const report = JSON.parse(
        fs.readFileSync(path.join(targetRoot, 'docs', 'specs', 'reports', 'spec-check-report.json'), 'utf8'),
      );
      expect(report.hard_gate).toBe(false);
      expect(report.standards.find((entry) => entry.path === 'docs/specs/backend/api.md')).toMatchObject({
        enforcement: 'blocking_suggestion',
        load_mode: 'full',
      });
      expect(report.review_items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule_id: 'RULE-BACKEND-API-001',
            enforcement: 'blocking_suggestion',
            status: 'needs_llm_review',
          }),
        ]),
      );
      expect(fs.readFileSync(path.join(targetRoot, 'docs', 'specs', 'reports', 'spec-check-report.md'), 'utf8'))
        .toContain('This report is review assistance, not an automatic gate.');
      expect(fs.existsSync(path.join(targetRoot, '.spec-first', 'workflows', 'spec-check', 'login-check', 'check.jsonl'))).toBe(true);
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('refresh --index-only rebuilds index and report without modifying standards markdown', () => {
    const targetRoot = makeTempRepo();

    try {
      initSpecs({ target: targetRoot });
      const standardPath = path.join(targetRoot, 'docs', 'specs', 'custom', 'team-overrides.md');
      const standardContent = [
        '---',
        'spec_id: custom-team-overrides',
        'title: Team Overrides',
        'source: manual',
        'confirmation_status: manual',
        'lifecycle_status: active',
        'level: L4',
        'scope:',
        '  - all',
        'categories:',
        '  - governance',
        'priority: 100',
        'severity: high',
        'confidence: high',
        'status: active',
        '---',
        '# Team Overrides',
        '',
        '## Summary for Agent',
        '',
        '- Manual standards must not be overwritten.',
        '',
      ].join('\n');
      fs.writeFileSync(standardPath, standardContent, 'utf8');

      expect(() => refreshSpecs({ target: targetRoot })).toThrow(/requires --index-only/);
      const result = refreshSpecs({ target: targetRoot, 'index-only': true });

      expect(result).toMatchObject({
        ok: true,
        mode: 'index-only',
        hard_gate: false,
        modified_standards: [],
        manual_overwrites: [],
        report_json: 'docs/specs/reports/spec-refresh-report.json',
        report_markdown: 'docs/specs/reports/spec-refresh-report.md',
      });
      expect(fs.readFileSync(standardPath, 'utf8')).toBe(standardContent);
      expect(fs.existsSync(path.join(targetRoot, 'docs', 'specs', '_index', 'specs-index.json'))).toBe(true);

      const report = JSON.parse(
        fs.readFileSync(path.join(targetRoot, 'docs', 'specs', 'reports', 'spec-refresh-report.json'), 'utf8'),
      );
      expect(report).toMatchObject({
        schema_version: 'standards-refresh-report/v1',
        mode: 'index-only',
        hard_gate: false,
        modified_standards: [],
        manual_overwrites: [],
      });
      expect(report.updated_indexes).toContain('docs/specs/_index/specs-index.json');
      expect(fs.readFileSync(path.join(targetRoot, 'docs', 'specs', 'reports', 'spec-refresh-report.md'), 'utf8'))
        .toContain('does not modify standards markdown');
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('refresh --changed writes proposal request without modifying standards markdown', () => {
    const targetRoot = makeTempRepo();

    try {
      initSpecs({ target: targetRoot });
      const standardPath = path.join(targetRoot, 'docs', 'specs', 'backend', 'api.md');
      const standardContent = [
        '---',
        'spec_id: backend-api',
        'title: Backend API',
        'source: manual',
        'confirmation_status: manual',
        'lifecycle_status: active',
        'level: L4',
        'scope:',
        '  - backend',
        'categories:',
        '  - api',
        'keywords:',
        '  - login',
        '  - auth',
        '  - controller',
        'applies_to_paths:',
        '  - "src/main/java/**/controller/**"',
        'priority: 100',
        'severity: high',
        'confidence: high',
        'status: active',
        '---',
        '# Backend API',
        '',
        '## Summary for Agent',
        '',
        '- Login APIs must follow backend API standards.',
        '',
      ].join('\n');
      fs.writeFileSync(standardPath, standardContent, 'utf8');
      indexSpecs({ target: targetRoot });

      const result = refreshSpecs({
        target: targetRoot,
        files: 'src/main/java/com/example/user/controller/LoginController.java',
        task: 'refresh standards proposal for login controller changes',
        'run-id': '20260427-150300-a1b2c3',
      });

      expect(result).toMatchObject({
        ok: true,
        mode: 'changed',
        hard_gate: false,
        changed_files: ['src/main/java/com/example/user/controller/LoginController.java'],
        proposal_request: path.join(
          '.spec-first',
          'workflows',
          'spec-standards-refresh',
          deriveTargetSlug(targetRoot),
          '20260427-150300-a1b2c3',
          'refresh-request.json',
        ),
        modified_standards: [],
        manual_overwrites: [],
      });
      expect(fs.readFileSync(standardPath, 'utf8')).toBe(standardContent);

      const runDir = path.join(
        targetRoot,
        '.spec-first',
        'workflows',
        'spec-standards-refresh',
        deriveTargetSlug(targetRoot),
        '20260427-150300-a1b2c3',
      );
      expect(fs.existsSync(path.join(runDir, 'refresh-request.json'))).toBe(true);
      expect(fs.existsSync(path.join(runDir, 'preview.md'))).toBe(true);
      expect(fs.existsSync(path.join(runDir, 'check.jsonl'))).toBe(true);

      const request = JSON.parse(fs.readFileSync(path.join(runDir, 'refresh-request.json'), 'utf8'));
      expect(request).toMatchObject({
        schema_version: 'standards-refresh-proposal-request/v1',
        mode: 'changed',
        hard_gate: false,
        changed_files: ['src/main/java/com/example/user/controller/LoginController.java'],
      });
      expect(request.proposal_instruction.join('\n')).toContain('$spec-standards');
      expect(request.resolve_result.load_full.map((entry) => entry.path)).toContain('docs/specs/backend/api.md');

      const report = JSON.parse(
        fs.readFileSync(path.join(targetRoot, 'docs', 'specs', 'reports', 'spec-refresh-report.json'), 'utf8'),
      );
      expect(report).toMatchObject({
        schema_version: 'standards-refresh-report/v1',
        mode: 'changed',
        hard_gate: false,
        proposal_request: result.proposal_request,
        modified_standards: [],
        manual_overwrites: [],
      });
      expect(fs.readFileSync(path.join(targetRoot, 'docs', 'specs', 'reports', 'spec-refresh-report.md'), 'utf8'))
        .toContain('only prepares a proposal request');
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('list and validate read formal standards without modifying them', () => {
    const targetRoot = makeTempRepo();

    try {
      initSpecs({ target: targetRoot });
      const standardPath = path.join(targetRoot, 'docs', 'specs', 'backend', 'api.md');
      fs.writeFileSync(standardPath, [
        '---',
        'spec_id: backend-api',
        'title: Backend API',
        'source: manual',
        'confirmation_status: manual',
        'lifecycle_status: active',
        'level: L4',
        'scope:',
        '  - backend',
        'categories:',
        '  - api',
        'priority: 100',
        'severity: high',
        'confidence: high',
        'status: active',
        '---',
        '# Backend API',
        '',
      ].join('\n'), 'utf8');
      indexSpecs({ target: targetRoot });

      const listed = listSpecs({ target: targetRoot, scope: 'backend' });
      expect(listed.ok).toBe(true);
      expect(listed.specs.map((entry) => entry.path)).toContain('docs/specs/backend/api.md');
      expect(listed.specs.find((entry) => entry.path === 'docs/specs/backend/api.md')).toMatchObject({
        id: 'backend-api',
        source: 'manual',
        confirmation_status: 'manual',
      });

      const validation = validateSpecs({ target: targetRoot });
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
      expect(validation.warnings).toEqual([]);
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });
});

// SECRET_PATTERNS tests (Fix 15a)
describe('SECRET_PATTERNS', () => {
  // Access the patterns indirectly by testing containsSecretLikeValue through validateProposalPayload
  function makeBarePayload(targetRoot) {
    const targetSlug = deriveTargetSlug(targetRoot);
    return {
      schema_version: 'standards-proposal-payload/v1',
      run_id: '20260101-000000-abcdef',
      target_slug: targetSlug,
      target_repo: targetRoot,
      consumer: 'spec-standards',
      evidence_mode: 'direct-only',
      preview_markdown: 'preview',
      detected_profiles: [],
      evidence_map: {
        version: 1,
        run_id: '20260101-000000-abcdef',
        target_slug: targetSlug,
        consumer: 'spec-standards',
        evidence_mode: 'direct-only',
        drafts: [],
      },
      drafts: [
        {
          path: 'drafts/common/test.md',
          source: 'extracted',
          confirmation_status: 'confirmed',
          lifecycle_status: 'draft',
          content: '---\nspec_id: test\nsource: extracted\nconfirmation_status: confirmed\nlifecycle_status: draft\n---\n# Test\n',
        },
      ],
      rejected: null,
    };
  }

  test('pattern 1: PEM private key header is detected', () => {
    const targetRoot = makeTempRepo();
    try {
      const payload = makeBarePayload(targetRoot);
      payload.preview_markdown = '-----BEGIN RSA PRIVATE KEY-----\nMIIE...';
      const errors = validateProposalPayload(payload, {
        runId: payload.run_id,
        targetRoot,
        targetSlug: deriveTargetSlug(targetRoot),
      });
      expect(errors.join('\n')).toContain('secret-like value');
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('pattern 2: API token prefix is detected', () => {
    const targetRoot = makeTempRepo();
    try {
      const payload = makeBarePayload(targetRoot);
      payload.preview_markdown = 'token=sk-AbcDef1234567890abcdef12345';
      const errors = validateProposalPayload(payload, {
        runId: payload.run_id,
        targetRoot,
        targetSlug: deriveTargetSlug(targetRoot),
      });
      expect(errors.join('\n')).toContain('secret-like value');
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('pattern 3: password assignment is detected', () => {
    const targetRoot = makeTempRepo();
    try {
      const payload = makeBarePayload(targetRoot);
      payload.preview_markdown = 'password: supersecret123';
      const errors = validateProposalPayload(payload, {
        runId: payload.run_id,
        targetRoot,
        targetSlug: deriveTargetSlug(targetRoot),
      });
      expect(errors.join('\n')).toContain('secret-like value');
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('pattern 4: env-style SECRET assignment is detected', () => {
    const targetRoot = makeTempRepo();
    try {
      const payload = makeBarePayload(targetRoot);
      payload.preview_markdown = 'DB_SECRET=somevalue123';
      const errors = validateProposalPayload(payload, {
        runId: payload.run_id,
        targetRoot,
        targetSlug: deriveTargetSlug(targetRoot),
      });
      expect(errors.join('\n')).toContain('secret-like value');
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('benign strings do not trigger secret detection', () => {
    const targetRoot = makeTempRepo();
    try {
      const payload = makeBarePayload(targetRoot);
      payload.preview_markdown = 'This is a benign string with no secrets at all.';
      const errors = validateProposalPayload(payload, {
        runId: payload.run_id,
        targetRoot,
        targetSlug: deriveTargetSlug(targetRoot),
      });
      expect(errors.join('\n')).not.toContain('secret-like value');
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });
});

// promote overwrite guard tests (Fix 15b)
describe('promote overwrite guard', () => {
  test('promote refuses to overwrite an existing manual spec file', () => {
    const targetRoot = makeTempRepo();
    try {
      const payload = loadPayloadFixture('proposal-payload-valid.json', targetRoot);
      const payloadPath = writePayloadFile(targetRoot, payload);
      writeProposal({ 'run-id': payload.run_id, target: targetRoot, payload: payloadPath });

      // Pre-create the destination file as a manual spec
      initSpecs({ target: targetRoot });
      const destPath = path.join(targetRoot, 'docs', 'specs', 'common', 'architecture.md');
      fs.writeFileSync(destPath, [
        '---',
        'spec_id: common-architecture',
        'title: Architecture',
        'source: manual',
        'confirmation_status: manual',
        'lifecycle_status: active',
        'level: L4',
        'priority: 100',
        'severity: high',
        'confidence: high',
        'status: active',
        '---',
        '# Architecture (manual)',
        '',
      ].join('\n'), 'utf8');

      expect(() => {
        promoteRun({ 'run-id': payload.run_id, target: targetRoot, 'accept-all': true });
      }).toThrow(/Refusing to overwrite manual\/custom standard/);
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });

  test('promote refuses to overwrite a spec in the custom/ directory', () => {
    const targetRoot = makeTempRepo();
    try {
      // Build a payload whose draft lands in custom/
      const payload = loadPayloadFixture('proposal-payload-valid.json', targetRoot);
      payload.drafts[0].path = 'drafts/custom/architecture.md';
      const draftContent = payload.drafts[0].content
        .replace(/^source: .*$/m, 'source: extracted')
        .replace(/^confirmation_status: .*$/m, 'confirmation_status: confirmed')
        .replace(/^lifecycle_status: .*$/m, 'lifecycle_status: active');
      payload.drafts[0].content = draftContent;
      payload.drafts[0].source = 'extracted';
      payload.drafts[0].confirmation_status = 'confirmed';
      payload.drafts[0].lifecycle_status = 'active';
      const payloadPath = writePayloadFile(targetRoot, payload);
      writeProposal({ 'run-id': payload.run_id, target: targetRoot, payload: payloadPath });

      // Pre-create the destination file in custom/
      initSpecs({ target: targetRoot });
      const destPath = path.join(targetRoot, 'docs', 'specs', 'custom', 'architecture.md');
      fs.writeFileSync(destPath, '# Custom Architecture\n', 'utf8');

      expect(() => {
        promoteRun({ 'run-id': payload.run_id, target: targetRoot, 'accept-all': true });
      }).toThrow(/Refusing to overwrite/);
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });
});

// promote not_selected branch (Fix 15c)
describe('promote not_selected branch', () => {
  test('draft not in any decision set gets status not_selected in skipped', () => {
    const targetRoot = makeTempRepo();
    try {
      const payload = loadPayloadFixture('proposal-payload-valid.json', targetRoot);
      // Add a second draft so there is one to accept and one to leave unselected
      payload.drafts.push({
        path: 'drafts/backend/api.md',
        source: 'extracted',
        confirmation_status: 'confirmed',
        lifecycle_status: 'active',
        content: [
          '---',
          'spec_id: backend-api',
          'title: Backend API',
          'source: extracted',
          'confirmation_status: confirmed',
          'lifecycle_status: active',
          'level: L3',
          'priority: 80',
          'severity: medium',
          'confidence: medium',
          'status: active',
          '---',
          '# Backend API',
          '',
        ].join('\n'),
      });
      const payloadPath = writePayloadFile(targetRoot, payload);
      writeProposal({ 'run-id': payload.run_id, target: targetRoot, payload: payloadPath });

      // Only accept the first draft; the second is neither accepted, rejected, nor deferred
      const result = promoteRun({
        'run-id': payload.run_id,
        target: targetRoot,
        accept: 'drafts/common/architecture.md',
      });

      const notSelected = result.skipped.find((entry) => entry.path === 'drafts/backend/api.md');
      expect(notSelected).toBeDefined();
      expect(notSelected.reason).toBe('not_selected');
    } finally {
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
  });
});

// classifyUnresolvedImportTarget tests (Fix 15d)
describe('classifyUnresolvedImportTarget', () => {
  test('platform_external: java.util.List', () => {
    const result = classifyUnresolvedImportTarget('java.util.List', []);
    expect(result.category).toBe('platform_external');
    expect(result.packageRoot).toBe('java');
  });

  test('platform_external: kotlin.collections.Map', () => {
    const result = classifyUnresolvedImportTarget('kotlin.collections.Map', []);
    expect(result.category).toBe('platform_external');
    expect(result.packageRoot).toBe('kotlin');
  });

  test('repo_internal_candidate: matches known package root', () => {
    const result = classifyUnresolvedImportTarget('com.example.service.UserService', ['com.example']);
    expect(result.category).toBe('repo_internal_candidate');
    expect(result.packageRoot).toBe('com.example');
  });

  test('third_party_external_candidate: unknown qualified name', () => {
    const result = classifyUnresolvedImportTarget('org.springframework.web.bind.annotation.RestController', []);
    expect(result.category).toBe('third_party_external_candidate');
  });

  test('relative_or_local: relative path', () => {
    const result = classifyUnresolvedImportTarget('./utils/helper', []);
    expect(result.category).toBe('relative_or_local');
  });

  test('unknown: empty string', () => {
    const result = classifyUnresolvedImportTarget('', []);
    expect(result.category).toBe('unknown');
  });
});
