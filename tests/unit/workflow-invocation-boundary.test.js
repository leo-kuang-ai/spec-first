'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectMarkdownFiles(rootPath) {
  const files = [];

  function walk(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(REPO_ROOT, entryPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (relativePath.endsWith('/scripts')) continue;
        walk(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(entryPath);
      }
    }
  }

  walk(rootPath);
  return files;
}

function workflowSkillNames() {
  const governance = JSON.parse(read(GOVERNANCE_PATH));
  return governance.skills
    .filter((skill) => skill.entry_surface === 'workflow_command')
    .map((skill) => skill.skill_name)
    .sort();
}

describe('workflow invocation boundary', () => {
  test('public workflows are not installed agent types', () => {
    const workflows = workflowSkillNames();
    const agentNames = fs.readdirSync(path.join(REPO_ROOT, 'agents'))
      .filter((fileName) => fileName.endsWith('.agent.md'))
      .map((fileName) => fileName.replace(/\.agent\.md$/, ''));

    for (const workflow of workflows) {
      expect(agentNames).not.toContain(workflow);
    }
  });

  test('runtime-facing prose does not describe workflow handoffs as skill calls', () => {
    const workflows = workflowSkillNames();
    const files = [
      ...collectMarkdownFiles(path.join(REPO_ROOT, 'agents')),
      ...collectMarkdownFiles(path.join(REPO_ROOT, 'skills')),
      ...collectMarkdownFiles(path.join(REPO_ROOT, 'templates')),
    ];
    const violations = [];

    for (const filePath of files) {
      const relativePath = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
      const lines = read(filePath).split(/\r?\n/);

      lines.forEach((line, index) => {
        if (/Skill\(["']spec-/.test(line)) {
          violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
        }

        for (const workflow of workflows) {
          const quotedName = `\`${escapeRegExp(workflow)}\``;
          const ambiguousWorkflowCall = new RegExp(
            `\\b(?:load|run|invoke|call|start|re-run|rerun|use)\\s+(?:the\\s+)?${quotedName}\\s+skill\\b`,
            'i',
          );

          if (ambiguousWorkflowCall.test(line)) {
            violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
          }

          const ambiguousWorkflowRerun = new RegExp(
            `\\b(?:re-run|rerun)\\s+${quotedName}\\b`,
            'i',
          );

          if (ambiguousWorkflowRerun.test(line)) {
            violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
          }

          const workflowDescribedAsSkill = new RegExp(
            `\\b${escapeRegExp(workflow)}\\s+skill\\b|${quotedName}\\s+skill\\b`,
            'i',
          );

          if (workflowDescribedAsSkill.test(line)) {
            violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  test('document review declares the workflow-vs-agent boundary at the entrypoint', () => {
    const skill = read(path.join(REPO_ROOT, 'skills', 'spec-doc-review', 'SKILL.md'));

    expect(skill).toContain('## Invocation Boundary');
    expect(skill).toContain('workflow orchestrator, not an agent type');
    expect(skill).toContain('Do not invoke it through Agent/Task/subagent primitives');
    expect(skill).toContain('current host\'s document-review entrypoint');
    expect(skill).not.toContain('/spec:doc-review <path>` on Claude Code');
    expect(skill).not.toContain('$spec-doc-review <path>` on Codex');
    const legacyHostSpecificSentence = [
      'Claude' + ' users',
      'call `/spec:doc-review <path>`;',
      'Codex' + ' users',
      'call `$spec-doc-review <path>`',
    ].join(' ');
    expect(skill).not.toContain(legacyHostSpecificSentence);
    expect(skill).toContain('Phase 2');
    expect(skill).toContain('persona agents');
  });

  test('runtime-facing prose does not duplicate host command mappings beside current-host entrypoints', () => {
    const files = collectMarkdownFiles(path.join(REPO_ROOT, 'skills'));
    const violations = [];

    for (const filePath of files) {
      const relativePath = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
      if (relativePath === 'skills/using-spec-first/SKILL.md') continue;

      const lines = read(filePath).split(/\r?\n/);
      lines.forEach((line, index) => {
        if (
          /current host's .*(entrypoint|workflow).*(on Claude Code|on Codex|\/spec:|\$spec-)/i.test(line)
        ) {
          violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  test('large-requirements design doc keeps unified entrypoints and public task compilation boundaries', () => {
    const text = read(path.join(REPO_ROOT, 'docs', '02-架构设计', '需求拆分', '大需求拆分.md'));

    expect(text).toContain('supported hosts 的用户可见 workflow 入口统一为 `spec-*`');
    expect(text).toContain('spec-brainstorm');
    expect(text).toContain('spec-plan');
    expect(text).toContain('spec-work');
    expect(text).toContain('spec-code-review');
    expect(text).toContain('spec-compound');
    expect(text).toContain('`spec-write-tasks` 已提升为公开 workflow');
    expect(text).toContain('spec-write-tasks');
    expect(text).toContain('当前不存在 `spec-requirements` workflow 入口');
    expect(text).not.toContain('/spec:');
    expect(text).not.toContain('$spec-');
    expect(text).toContain('spec-requirements validate <packet-dir>');
  });
});
