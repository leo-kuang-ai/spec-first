#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

function measureHostQuality(platform) {
  try {
    // Use local bin/spec-first.js instead of global spec-first command
    const localBin = path.join(__dirname, '..', 'bin', 'spec-first.js');
    const output = execSync(`node "${localBin}" doctor --${platform} --json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const report = JSON.parse(output);

    const checks = report.checks || [];
    const passCount = checks.filter(c => c.level === 'PASS').length;
    const totalCount = checks.length;
    const passRate = totalCount > 0 ? Math.round(passCount / totalCount * 100) : 0;

    // 输出百分比供 autoresearch 使用
    console.log(passRate);

  } catch (error) {
    // 错误时输出 0
    console.log(0);
  }
}

const platform = process.argv[2] || 'claude';
measureHostQuality(platform);
