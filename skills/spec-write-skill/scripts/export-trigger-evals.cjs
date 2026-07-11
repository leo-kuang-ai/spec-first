#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CASES_PATH = path.join(__dirname, '..', 'evals', 'trigger-cases.json');

function loadCases() {
  return JSON.parse(fs.readFileSync(CASES_PATH, 'utf8'));
}

function toSkillCreator(source) {
  return {
    skill_name: source.skill,
    evals: source.cases.map((entry, index) => ({
      id: index + 1,
      prompt: entry.prompt,
      expected_output: `${entry.expected_trigger ? 'Route to' : 'Do not route to'} ${source.skill}; effect=${entry.expected_effect}; result=${entry.expected_layer_result}; avoid=${entry.forbidden_signals.join(', ')}`,
      files: [],
      assertions: [
        `Expected trigger is ${entry.expected_trigger}`,
        `Expected effect is ${entry.expected_effect}`,
        ...entry.forbidden_signals.map((signal) => `Output does not ${signal}`),
      ],
    })),
  };
}

function toYao(source) {
  const result = { should_trigger: [], should_not_trigger: [], near_neighbor: [] };
  for (const entry of source.cases) {
    const item = { text: entry.prompt, family: entry.reason_code };
    if (entry.expected_trigger) result.should_trigger.push(item);
    else if (entry.case_type === 'near-neighbor') result.near_neighbor.push(item);
    else result.should_not_trigger.push(item);
  }
  return result;
}

function exportCases(format, source = loadCases()) {
  if (format === 'skill-creator') return toSkillCreator(source);
  if (format === 'yao') return toYao(source);
  if (format === 'native') return source;
  throw new Error(`Unsupported format: ${format}`);
}

function main() {
  const args = process.argv.slice(2);
  const formatIndex = args.indexOf('--format');
  const format = formatIndex === -1 ? 'native' : args[formatIndex + 1];
  try {
    process.stdout.write(`${JSON.stringify(exportCases(format), null, 2)}\n`);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}

if (require.main === module) main();

module.exports = { exportCases, loadCases, toSkillCreator, toYao };
