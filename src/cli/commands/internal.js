'use strict';

const { runContextBundle } = require('../helpers/context-bundle');
const { runScenarioFingerprint } = require('../helpers/scenario-fingerprint');
const { runCli: runSecretDenyPatternsCli } = require('../helpers/secret-deny-patterns');
const { runCli: runHonestCloseoutCli } = require('../helpers/honest-closeout');
const { runCli: runSpecWorkRunArtifactCli } = require('../helpers/spec-work-run-artifact');
const { runCli: runVerificationProfileCli } = require('../helpers/verification-profile');
const { runCli: runVerificationRunSummaryCli } = require('../helpers/verification-run-summary');
const { runCli: runTaskGovernanceSignalsCli } = require('../helpers/task-governance-signals');
const { runCli: runResourceGovernanceLensCli } = require('../helpers/resource-governance-lens');
const { runCli: runRuleMaturityCli } = require('../helpers/rule-maturity');
const { runCli: runPlanStatusCli } = require('../helpers/plan-status');

function runInternal(argv) {
  const args = Array.isArray(argv) ? [...argv] : [];
  const subcommand = args[0];

  if (subcommand === 'context-bundle') {
    return runContextBundle(args.slice(1));
  }

  if (subcommand === 'compute-scenario-fingerprint') {
    return runScenarioFingerprint(args.slice(1));
  }

  if (subcommand === 'secret-deny') {
    return runSecretDenyPatternsCli(args.slice(1));
  }

  if (subcommand === 'honest-closeout') {
    return runHonestCloseoutCli(args.slice(1));
  }

  if (subcommand === 'spec-work-run-artifact') {
    return runSpecWorkRunArtifactCli(args.slice(1));
  }

  if (subcommand === 'verification-profile') {
    return runVerificationProfileCli(args.slice(1));
  }

  if (subcommand === 'verification-run-summary') {
    return runVerificationRunSummaryCli(args.slice(1));
  }

  if (subcommand === 'task-governance-signals') {
    return runTaskGovernanceSignalsCli(args.slice(1));
  }

  if (subcommand === 'resource-governance-lens') {
    return runResourceGovernanceLensCli(args.slice(1));
  }

  if (subcommand === 'rule-maturity') {
    return runRuleMaturityCli(args.slice(1));
  }

  if (subcommand === 'plan-status') {
    return runPlanStatusCli(args.slice(1));
  }

  if (args.includes('--json')) {
    process.stdout.write(`${JSON.stringify({
      ok: false,
      error: {
        code: 'internal-subcommand-unknown',
        message: `Unknown internal subcommand: ${subcommand || '<missing>'}`,
      },
    }, null, 2)}\n`);
  } else {
    console.error(`Unknown internal subcommand: ${subcommand || '<missing>'}`);
  }
  return 2;
}

module.exports = {
  runInternal,
};
