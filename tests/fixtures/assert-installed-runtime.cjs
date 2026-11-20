const assert = require('node:assert/strict');
const fs = require('node:fs');

function assertInstalledRuntime(report, host) {
  assert.deepEqual(report.platforms, [host]);
  assert.ok(['pass', 'warn'].includes(report.runtime_asset_health));
  const checks = report.platform_checks[host];
  for (const name of [`.${host}/spec-first/state.json`, host === 'codex' ? '.agents/skills' : '.cursor/skills']) {
    assert.ok(checks.some((check) => check.name === name && check.level === 'PASS'), name);
  }
  const unexpected = checks.filter((check) => check.level !== 'PASS' && !(check.level === 'WARNING' && (
    check.degradedByDesign === true && check.drift === false ||
    check.disposition === 'optional' || check.reasonCode === `${host}_cli_not_found`
  )));
  assert.deepEqual(unexpected, []);
}

if (require.main === module) assertInstalledRuntime(JSON.parse(fs.readFileSync(0, 'utf8')), process.argv[2]);
module.exports = { assertInstalledRuntime };
