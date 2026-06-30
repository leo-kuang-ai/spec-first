#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_OUTPUT = '.spec-first/diagnostics/claude-hook-payload-probe.ndjson';
const MAX_KEY_COUNT = 64;

function parseArgs(argv) {
  const args = { output: DEFAULT_OUTPUT, help: false, error: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      return args;
    }
    if (arg === '--output') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        args.error = 'missing value for --output';
        break;
      }
      args.output = value;
      i += 1;
      continue;
    }
    args.error = `unknown option: ${arg}`;
    break;
  }
  return args;
}

function objectKeys(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.keys(value).slice(0, MAX_KEY_COUNT).sort();
}

function safeStringSummary(value) {
  if (typeof value !== 'string') return null;
  return {
    type: 'string',
    length: value.length,
    has_newline: value.includes('\n'),
  };
}

function summarizeToolInput(toolInput) {
  if (!toolInput || typeof toolInput !== 'object' || Array.isArray(toolInput)) {
    return {
      keys: [],
      path_fields: {},
      string_fields: {},
    };
  }

  const pathFields = {};
  ['file_path', 'path', 'target', 'old_path', 'new_path'].forEach((field) => {
    if (typeof toolInput[field] === 'string') {
      pathFields[field] = toolInput[field];
    }
  });

  const stringFields = {};
  ['content', 'old_string', 'new_string', 'command', 'description'].forEach((field) => {
    const summary = safeStringSummary(toolInput[field]);
    if (summary) {
      stringFields[field] = summary;
    }
  });

  return {
    keys: objectKeys(toolInput),
    path_fields: pathFields,
    string_fields: stringFields,
  };
}

function summarizePayload(payload) {
  const toolInput = payload && typeof payload === 'object' ? payload.tool_input : null;
  return {
    schema_version: 'claude-hook-payload-probe.v1',
    captured_at: new Date().toISOString(),
    hook_event_name: typeof payload.hook_event_name === 'string' ? payload.hook_event_name : null,
    tool_name: typeof payload.tool_name === 'string' ? payload.tool_name : null,
    top_level_keys: objectKeys(payload),
    tool_input: summarizeToolInput(toolInput),
  };
}

function appendProbe(outputPath, summary, cwd = process.cwd()) {
  const absoluteOutput = path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(cwd, outputPath);
  fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
  fs.appendFileSync(absoluteOutput, `${JSON.stringify(summary)}\n`, 'utf8');
  return absoluteOutput;
}

function printHelp() {
  process.stdout.write('probe-claude-hook-payload.js — append a redacted Claude hook payload shape summary.\n');
  process.stdout.write('usage: probe-claude-hook-payload.js [--output <path>]\n');
  process.stdout.write('Reads one JSON hook payload from stdin and writes NDJSON summaries. It records tool names, keys, paths, and string lengths, not raw content.\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return 0;
  }
  if (args.error) {
    process.stderr.write(`${args.error}\n`);
    return 2;
  }

  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch (err) {
    process.stderr.write(`cannot read stdin: ${err.message}\n`);
    return 2;
  }

  let payload;
  try {
    payload = JSON.parse(raw || '{}');
  } catch (err) {
    process.stderr.write(`invalid hook payload JSON: ${err.message}\n`);
    return 2;
  }

  const outputPath = appendProbe(args.output, summarizePayload(payload));
  process.stdout.write(JSON.stringify({
    status: 'recorded',
    output: path.relative(process.cwd(), outputPath) || outputPath,
  }) + '\n');
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  parseArgs,
  summarizePayload,
  appendProbe,
  main,
};
