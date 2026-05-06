#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../src/contracts/schema-validator');

const REPO_ROOT = path.join(__dirname, '..');
const FINDING_CORE_SCHEMA = 'src/cli/contracts/agent-registry/finding-core.schema.json';

const WORKFLOW_NATIVE_SCHEMAS = {
  'spec-code-review': 'skills/spec-code-review/references/findings-schema.json',
  'spec-doc-review': 'skills/spec-doc-review/references/findings-schema.json',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string').map((item) => item.trim()) : [];
}

function nativeSchemaForWorkflow(workflow) {
  const nativeSchema = WORKFLOW_NATIVE_SCHEMAS[workflow];
  if (!nativeSchema) {
    throw new Error(`unsupported workflow for Finding Core projection: ${workflow}`);
  }
  return nativeSchema;
}

function loadNativeSchema(workflow) {
  return readJson(path.join(REPO_ROOT, nativeSchemaForWorkflow(workflow)));
}

function severityDisplay(severity) {
  if (severity === 'P0') return 'blocker';
  if (severity === 'P1') return 'high';
  if (severity === 'P2') return 'medium';
  return 'low';
}

function confidenceDisplay(confidence) {
  if (confidence === 100 || confidence === 75) return 'high';
  if (confidence === 50) return 'medium';
  if (confidence === 25) return 'low';
  return 'reject';
}

function projectionStatus(finding) {
  if (finding.confidence === 0) return 'rejected_by_native_confidence';
  if (!Array.isArray(finding.evidence) || finding.evidence.length === 0) return 'degraded_missing_evidence';
  return 'projected';
}

function normalizeEvidence(finding) {
  return normalizeList(finding.evidence).map((value) => ({
    type: 'native_evidence',
    value,
    trust_level: 'primary',
  }));
}

function nativePreserved(workflow, finding) {
  if (workflow === 'spec-code-review') {
    return {
      file: finding.file,
      line: finding.line,
      autofix_class: finding.autofix_class,
      owner: finding.owner,
      requires_verification: finding.requires_verification,
      pre_existing: finding.pre_existing,
      suggested_fix: finding.suggested_fix || null,
    };
  }

  return {
    section: finding.section,
    finding_type: finding.finding_type,
    autofix_class: finding.autofix_class,
    suggested_fix: finding.suggested_fix || null,
  };
}

function notReviewed(workflow, finding) {
  const values = [];
  if (workflow === 'spec-code-review' && finding.requires_verification) {
    values.push('native finding requires verification; reviewer did not execute fix validation');
  }
  return values;
}

function adapterNotes(finding) {
  const notes = [
    'workflow-native schema wins; Finding Core is a read-only compatibility view',
    'severity_display and confidence_display are deterministic labels, not final synthesis verdicts',
  ];
  if (!finding.suggested_fix) {
    notes.push('native finding did not provide suggested_fix; recommendation remains null');
  }
  if (finding.pre_existing) {
    notes.push('native finding is marked pre_existing and must not become a blocking current-change finding without Skill review');
  }
  if (projectionStatus(finding) !== 'projected') {
    notes.push(`projection_status=${projectionStatus(finding)} requires Skill synthesis handling`);
  }
  return notes;
}

function projectFinding(workflow, nativeInput, finding, index, options = {}) {
  const nativeSchema = nativeSchemaForWorkflow(workflow);
  const agentId = options.agentId || nativeInput.reviewer;
  return {
    schema_version: 'spec-first.finding-core.v1',
    workflow,
    agent_id: agentId,
    native_schema: nativeSchema,
    native_finding_ref: `#${index + 1}`,
    category: finding.category || nativeInput.reviewer,
    title: finding.title,
    severity_native: finding.severity,
    severity_display: severityDisplay(finding.severity),
    confidence_native: finding.confidence,
    confidence_display: confidenceDisplay(finding.confidence),
    projection_status: projectionStatus(finding),
    evidence: normalizeEvidence(finding),
    impact: finding.why_it_matters,
    recommendation: finding.suggested_fix || null,
    not_reviewed: notReviewed(workflow, finding),
    adapter_notes: adapterNotes(finding),
    native_preserved: nativePreserved(workflow, finding),
  };
}

function validateNativeInput(workflow, nativeInput) {
  const schema = loadNativeSchema(workflow);
  const result = validateAgainstSchema(schema, nativeInput);
  if (!result.valid) {
    throw new Error(`native finding input failed schema validation: ${result.errors.join('; ')}`);
  }
}

function projectFindingCore(input, options = {}) {
  const workflow = options.workflow || input.workflow;
  const nativeInput = input.native || input;
  const nativeSchema = nativeSchemaForWorkflow(workflow);

  validateNativeInput(workflow, nativeInput);

  return {
    schema_version: 'spec-first.finding-core-projection.v1',
    generated_from: 'scripts/project-ecc-finding-core.js',
    workflow,
    native_schema: nativeSchema,
    source_artifacts: {
      native_schema: nativeSchema,
      finding_core_schema: FINDING_CORE_SCHEMA,
    },
    native_summary: {
      reviewer: nativeInput.reviewer,
      finding_count: nativeInput.findings.length,
      residual_risks: normalizeList(nativeInput.residual_risks),
      testing_gaps: normalizeList(nativeInput.testing_gaps),
      deferred_questions: normalizeList(nativeInput.deferred_questions),
    },
    finding_core: nativeInput.findings.map((finding, index) =>
      projectFinding(workflow, nativeInput, finding, index, options),
    ),
    requires_skill_synthesis: true,
    forbidden_actions: [
      'rewrite_native_schema',
      'write_workflow_runtime',
      'selected_agents',
      'final_verdict',
      'confirmed_standards_write',
    ],
  };
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') {
      result.inputPath = argv[index + 1];
      index += 1;
    } else if (arg === '--workflow') {
      result.workflow = argv[index + 1];
      index += 1;
    } else if (arg === '--agent-id') {
      result.agentId = argv[index + 1];
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }
  return result;
}

function usage() {
  return [
    'Usage: node scripts/project-ecc-finding-core.js --workflow <spec-code-review|spec-doc-review> --input <native-findings.json> [--agent-id <id>]',
    '',
    'Projects workflow-native findings into read-only Finding Core compatibility facts.',
    'Native workflow schemas remain authoritative; Skills still perform synthesis.',
  ].join('\n');
}

function readInput(inputPath) {
  if (!inputPath) {
    throw new Error('missing --input <native-findings.json>');
  }
  return readJson(inputPath);
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (!args.workflow) {
    throw new Error('missing --workflow <spec-code-review|spec-doc-review>');
  }
  const input = readInput(args.inputPath);
  const output = projectFindingCore(input, args);
  console.log(`${JSON.stringify(output, null, 2)}\n`);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  FINDING_CORE_SCHEMA,
  WORKFLOW_NATIVE_SCHEMAS,
  confidenceDisplay,
  nativeSchemaForWorkflow,
  projectFindingCore,
  severityDisplay,
};
