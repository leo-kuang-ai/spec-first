#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_FIXTURE = path.join(__dirname, 'examples.json');
const SCHEMA_VERSION = 'spec-prd-eval-run.v1';
const FIXTURE_SCHEMA_VERSION = 'spec-prd-evals.v1';
const VALID_INTENTS = new Set(['create', 'refine', 'validate']);

function parseArgs(argv) {
  const args = {
    fixture: DEFAULT_FIXTURE,
    json: false,
    help: false,
    error: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--fixture') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) {
        args.error = 'missing value for --fixture';
        break;
      }
      args.fixture = argv[i + 1];
      i += 1;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      args.error = `unknown argument: ${arg}`;
      break;
    }
  }

  return args;
}

function usage() {
  return [
    'usage: run-evals.js [--fixture <path>] [--json]',
    '',
    'Checks spec-prd eval fixture structure, coverage buckets, and reason-code facts.',
    'It does not run PRD generation, call an LLM, or judge semantic output quality.',
  ].join('\n');
}

function createReport(fixture) {
  return {
    schema_version: SCHEMA_VERSION,
    status: 'failed',
    fixture,
    case_count: 0,
    coverage: {},
    case_types: {},
    missing_required_buckets: [],
    invalid_cases: [],
    reason_code: 'fixture_contract_failed',
  };
}

function addInvalid(report, id, reasonCode, field, message) {
  report.invalid_cases.push({
    id,
    reason_code: reasonCode,
    field,
    message,
  });
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function missingRequiredStrings(actual, required) {
  if (!Array.isArray(required) || required.length === 0) return [];
  const actualSet = new Set(Array.isArray(actual) ? actual : []);
  return required.filter((value) => !actualSet.has(value));
}

function validateFixture(fixture, fixturePath) {
  const report = createReport(fixturePath);

  if (!fixture || typeof fixture !== 'object' || Array.isArray(fixture)) {
    addInvalid(report, '<fixture>', 'fixture_not_object', 'root', 'fixture must be a JSON object');
    return report;
  }

  if (fixture.schema_version !== FIXTURE_SCHEMA_VERSION) {
    addInvalid(
      report,
      '<fixture>',
      'schema_version_invalid',
      'schema_version',
      `expected ${FIXTURE_SCHEMA_VERSION}`,
    );
  }

  const contract = fixture.case_contract;
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    addInvalid(report, '<fixture>', 'case_contract_missing', 'case_contract', 'case contract is required');
  }

  const allowedCaseTypes = new Set(
    contract && Array.isArray(contract.case_types) ? contract.case_types : [],
  );
  const requiredBuckets = contract && Array.isArray(contract.required_quality_buckets)
    ? contract.required_quality_buckets
    : [];
  const mustNotRequiredBuckets = new Set(
    contract && Array.isArray(contract.must_not_required_quality_buckets)
      ? contract.must_not_required_quality_buckets
      : [],
  );

  if (allowedCaseTypes.size === 0) {
    addInvalid(report, '<fixture>', 'case_types_missing', 'case_contract.case_types', 'case types are required');
  }
  if (requiredBuckets.length === 0) {
    addInvalid(
      report,
      '<fixture>',
      'required_quality_buckets_missing',
      'case_contract.required_quality_buckets',
      'required quality buckets are required',
    );
  }

  if (!Array.isArray(fixture.cases)) {
    addInvalid(report, '<fixture>', 'cases_missing', 'cases', 'cases must be an array');
    return report;
  }

  report.case_count = fixture.cases.length;
  const ids = new Set();
  const casesById = new Map();

  fixture.cases.forEach((entry, index) => {
    const id = isNonEmptyString(entry && entry.id) ? entry.id : `<case:${index}>`;

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      addInvalid(report, id, 'case_not_object', 'case', 'case must be an object');
      return;
    }
    if (!isNonEmptyString(entry.id)) {
      addInvalid(report, id, 'id_missing', 'id', 'id must be a non-empty string');
    } else if (ids.has(entry.id)) {
      addInvalid(report, entry.id, 'id_duplicate', 'id', 'id must be unique');
    } else {
      ids.add(entry.id);
      casesById.set(entry.id, entry);
    }

    if (!VALID_INTENTS.has(entry.intent)) {
      addInvalid(report, id, 'intent_invalid', 'intent', 'intent must be create, refine, or validate');
    }
    if (!allowedCaseTypes.has(entry.case_type)) {
      addInvalid(report, id, 'case_type_invalid', 'case_type', 'case_type must be declared by case_contract');
    } else {
      increment(report.case_types, entry.case_type);
    }
    if (!isNonEmptyString(entry.input_shape)) {
      addInvalid(report, id, 'input_shape_missing', 'input_shape', 'input_shape must be a non-empty string');
    }
    if (!isStringArray(entry.expected)) {
      addInvalid(report, id, 'expected_invalid', 'expected', 'expected must be a non-empty string array');
    }
    if (!isStringArray(entry.coverage_tags)) {
      addInvalid(report, id, 'coverage_tags_invalid', 'coverage_tags', 'coverage_tags must be a non-empty string array');
    }
    if (!isStringArray(entry.quality_buckets)) {
      addInvalid(report, id, 'quality_buckets_invalid', 'quality_buckets', 'quality_buckets must be a non-empty string array');
    } else {
      entry.quality_buckets.forEach((bucket) => {
        if (!/^[a-z0-9][a-z0-9-]*$/.test(bucket)) {
          addInvalid(report, id, 'quality_bucket_invalid', 'quality_buckets', `invalid quality bucket: ${bucket}`);
        }
        increment(report.coverage, bucket);
      });

      const requiresMustNot = entry.quality_buckets.some((bucket) => mustNotRequiredBuckets.has(bucket));
      if (requiresMustNot && !isStringArray(entry.must_not)) {
        addInvalid(
          report,
          id,
          'must_not_missing',
          'must_not',
          'must_not is required for high-risk quality buckets',
        );
      }
    }
  });

  const sentinelCases = contract && Array.isArray(contract.sentinel_cases)
    ? contract.sentinel_cases
    : [];
  sentinelCases.forEach((sentinel, index) => {
    const sentinelId = isNonEmptyString(sentinel && sentinel.id)
      ? sentinel.id
      : `<sentinel:${index}>`;
    if (!sentinel || typeof sentinel !== 'object' || Array.isArray(sentinel)) {
      addInvalid(report, sentinelId, 'sentinel_case_invalid', 'case_contract.sentinel_cases', 'sentinel case must be an object');
      return;
    }
    if (!isNonEmptyString(sentinel.id)) {
      addInvalid(report, sentinelId, 'sentinel_case_id_missing', 'case_contract.sentinel_cases.id', 'sentinel case id is required');
      return;
    }

    const entry = casesById.get(sentinel.id);
    if (!entry) {
      addInvalid(report, sentinel.id, 'sentinel_case_missing', 'case_contract.sentinel_cases', 'required sentinel case is missing');
      return;
    }

    const requires = sentinel.requires && typeof sentinel.requires === 'object' && !Array.isArray(sentinel.requires)
      ? sentinel.requires
      : {};
    if (isNonEmptyString(requires.case_type) && entry.case_type !== requires.case_type) {
      addInvalid(report, sentinel.id, 'sentinel_case_requirement_missing', 'case_type', `expected sentinel case_type: ${requires.case_type}`);
    }
    ['quality_buckets', 'coverage_tags', 'expected', 'must_not'].forEach((field) => {
      missingRequiredStrings(entry[field], requires[field]).forEach((missing) => {
        addInvalid(
          report,
          sentinel.id,
          'sentinel_case_requirement_missing',
          field,
          `missing sentinel ${field}: ${missing}`,
        );
      });
    });
  });

  report.missing_required_buckets = requiredBuckets.filter((bucket) => !report.coverage[bucket]);
  if (report.missing_required_buckets.length > 0) {
    report.missing_required_buckets.forEach((bucket) => {
      addInvalid(
        report,
        '<fixture>',
        'required_quality_bucket_missing',
        'case_contract.required_quality_buckets',
        `missing quality bucket: ${bucket}`,
      );
    });
  }

  if (report.invalid_cases.length === 0) {
    report.status = 'passed';
    report.reason_code = 'eval_fixture_passed';
  }

  return report;
}

function printReport(report, json) {
  if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  process.stdout.write(`spec-prd eval fixture: ${report.status}\n`);
  process.stdout.write(`reason_code=${report.reason_code}\n`);
  process.stdout.write(`case_count=${report.case_count}\n`);
  process.stdout.write(`missing_required_buckets=${report.missing_required_buckets.join(',') || 'none'}\n`);
  if (report.invalid_cases.length > 0) {
    report.invalid_cases.forEach((entry) => {
      process.stdout.write(`${entry.id}: ${entry.reason_code} (${entry.field}) ${entry.message}\n`);
    });
  }
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  if (args.error) {
    process.stderr.write(`reason_code=bad_arguments\n${args.error}\n${usage()}\n`);
    return 2;
  }

  const fixturePath = path.resolve(args.fixture);
  let text;
  try {
    text = fs.readFileSync(fixturePath, 'utf8');
  } catch (err) {
    const report = createReport(fixturePath);
    report.status = 'error';
    report.reason_code = 'fixture_read_failed';
    addInvalid(report, '<fixture>', 'fixture_read_failed', 'fixture', `cannot read fixture: ${fixturePath}`);
    printReport(report, args.json);
    return 2;
  }

  let fixture;
  try {
    fixture = JSON.parse(text);
  } catch (err) {
    const report = createReport(fixturePath);
    report.status = 'error';
    report.reason_code = 'fixture_json_invalid';
    addInvalid(report, '<fixture>', 'fixture_json_invalid', 'fixture', err.message);
    printReport(report, args.json);
    return 2;
  }

  const report = validateFixture(fixture, fixturePath);
  printReport(report, args.json);
  return report.status === 'passed' ? 0 : 1;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  main,
  parseArgs,
  validateFixture,
};
