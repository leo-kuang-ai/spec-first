const fs = require('node:fs');
const path = require('node:path');

const {
  buildFileWriteOperation,
  buildRelativeOperation,
  summarizeOperationPlan,
} = require('../state');
const { formatInitGuidance } = require('../init-guidance');

const HOST_NATIVE_POINTER_START = '<!-- spec-first:host-native-pointer:start -->';
const HOST_NATIVE_POINTER_END = '<!-- spec-first:host-native-pointer:end -->';

function buildHostNativePointer({
  hostLabel,
  initCommand,
  frontmatter = '',
  rootInstruction = 'AGENTS.md',
  workflowPolicy = 'skills/using-spec-first/SKILL.md',
}) {
  return [
    normalizeFrontmatter(frontmatter),
    HOST_NATIVE_POINTER_START,
    '# spec-first',
    '',
    'This file is a spec-first managed host-native pointer.',
    `Project-level spec-first guidance lives in repository root \`${rootInstruction}\`.`,
    `Workflow entry routing lives in \`${workflowPolicy}\`.`,
    'Do not treat this file as a second source of truth.',
    `Regenerate it with \`${initCommand}\`.`,
    '',
    `Host: ${hostLabel}`,
    HOST_NATIVE_POINTER_END,
    '',
  ].filter((part) => part !== '').join('\n');
}

function planHostNativePointerSync(projectRoot, relativePath, contents) {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return plan([buildFileWriteOperation(projectRoot, absolutePath, contents, 'managed_host_native_pointer')]);
  }

  const existing = fs.readFileSync(absolutePath, 'utf8');
  if (!isManagedHostNativePointer(existing)) {
    return plan([]);
  }

  return plan([buildFileWriteOperation(projectRoot, absolutePath, contents, 'managed_host_native_pointer')]);
}

function planHostNativePointerRemoval(projectRoot, relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return plan([]);
  }

  const existing = fs.readFileSync(absolutePath, 'utf8');
  if (!isManagedHostNativePointer(existing)) {
    return plan([]);
  }

  return plan([buildRelativeOperation('remove_file', relativePath, 'managed_host_native_pointer')]);
}

function inspectHostNativePointer(projectRoot, relativePath, { hostId, hostLabel, expectedPrefix = '' }) {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      level: 'WARNING',
      name: relativePath,
      message: `${hostLabel} host-native spec-first pointer is missing`,
      fix: formatInitGuidance(hostId, `in this project to write ${relativePath}`),
    };
  }

  const existing = fs.readFileSync(absolutePath, 'utf8');
  if (!isManagedHostNativePointer(existing)) {
    return {
      level: 'WARNING',
      name: relativePath,
      message: `${hostLabel} host-native rule file exists but is not spec-first managed; init will not overwrite user-owned content`,
      fix: `Move custom guidance to another file or add the spec-first managed pointer markers before rerunning \`spec-first init --${hostId}\`.`,
    };
  }

  const normalizedExpectedPrefix = normalizeFrontmatter(expectedPrefix);
  if (normalizedExpectedPrefix && !existing.startsWith(normalizedExpectedPrefix)) {
    return {
      level: 'WARNING',
      name: relativePath,
      message: `${hostLabel} host-native spec-first pointer drifted from expected metadata`,
      fix: formatInitGuidance(hostId, `in this project to refresh ${relativePath}`),
    };
  }

  return {
    level: 'PASS',
    name: relativePath,
    message: `${hostLabel} host-native spec-first pointer is installed`,
  };
}

function isManagedHostNativePointer(content) {
  return typeof content === 'string'
    && content.includes(HOST_NATIVE_POINTER_START)
    && content.includes(HOST_NATIVE_POINTER_END)
    && content.indexOf(HOST_NATIVE_POINTER_START) < content.indexOf(HOST_NATIVE_POINTER_END);
}

function normalizeFrontmatter(frontmatter) {
  const trimmed = String(frontmatter || '').trim();
  return trimmed ? `${trimmed}\n` : '';
}

function plan(operations) {
  return {
    operations,
    summary: summarizeOperationPlan(operations),
  };
}

module.exports = {
  HOST_NATIVE_POINTER_END,
  HOST_NATIVE_POINTER_START,
  buildHostNativePointer,
  inspectHostNativePointer,
  isManagedHostNativePointer,
  planHostNativePointerRemoval,
  planHostNativePointerSync,
};
