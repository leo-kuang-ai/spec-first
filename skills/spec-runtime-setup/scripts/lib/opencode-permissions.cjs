'use strict';

const fs = require('node:fs');
const path = require('node:path');

const POLICY_SCHEMA_VERSION = 'opencode-permission-policy.v1';
const POLICY_KIND = 'opencode-governed-assets-v1';
const DANGEROUS_TOOLS = Object.freeze([
  'bash',
  'edit',
  'task',
  'webfetch',
  'websearch',
]);
const ACTIONS = new Set(['allow', 'ask', 'deny']);

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function wildcardMatches(input, pattern) {
  const normalized = String(input).replaceAll('\\', '/');
  let escaped = String(pattern)
    .replaceAll('\\', '/')
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  if (escaped.endsWith(' .*')) escaped = `${escaped.slice(0, -3)}( .*)?`;
  return new RegExp(`^${escaped}$`, process.platform === 'win32' ? 'si' : 's').test(normalized);
}

function exactSkillNames(assetSet) {
  const collections = [
    assetSet && assetSet.workflowSkills,
    assetSet && assetSet.skills,
    assetSet && assetSet.internalSkills,
  ];
  const names = collections.flatMap((entries) => Array.isArray(entries) ? entries : []);
  return [...new Set(names.map((name) => String(name)))].sort((left, right) => left.localeCompare(right));
}

function readProjectedOpenCodeAssetSet(skillRoot) {
  if (typeof skillRoot !== 'string' || skillRoot.length === 0) {
    return { ok: false, reason_code: 'opencode-permission-runtime-state-unavailable' };
  }
  const statePath = path.resolve(skillRoot, '..', '..', 'spec-first', 'state.json');
  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (_error) {
    return { ok: false, reason_code: 'opencode-permission-runtime-state-unavailable' };
  }
  const validSkillNames = (values) => Array.isArray(values)
    && values.every((name) => typeof name === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name));
  if (!isObject(state)
    || state.platform !== 'opencode'
    || !validSkillNames(state.skills)
    || !validSkillNames(state.workflowSkills)) {
    return { ok: false, reason_code: 'opencode-permission-runtime-state-invalid' };
  }
  return {
    ok: true,
    reason_code: 'opencode-permission-runtime-state-loaded',
    assetSet: {
      skills: state.skills,
      workflowSkills: state.workflowSkills,
      internalSkills: [],
    },
    state_path: statePath,
  };
}

function readSourceOpenCodeAssetSet(skillRoot) {
  if (typeof skillRoot !== 'string' || skillRoot.length === 0) return null;
  const modulePath = path.resolve(skillRoot, '..', '..', 'src', 'cli', 'plugin-governance.js');
  if (!fs.existsSync(modulePath)) return null;
  try {
    const { buildFilteredAssetSet } = require(modulePath);
    return buildFilteredAssetSet('opencode');
  } catch (_error) {
    return null;
  }
}

function deriveOpenCodePermissionPolicy({ assetSet, buildAssetSet, skillRoot } = {}) {
  let governedAssets = assetSet;
  try {
    if (!governedAssets && typeof buildAssetSet === 'function') {
      governedAssets = buildAssetSet('opencode');
    }
  } catch (_error) {
    return {
      ok: false,
      reason_code: 'opencode-permission-asset-derivation-failed',
    };
  }
  if (!governedAssets) {
    const projected = readProjectedOpenCodeAssetSet(skillRoot);
    governedAssets = projected.ok
      ? projected.assetSet
      : readSourceOpenCodeAssetSet(skillRoot);
    if (!governedAssets) return projected;
  }
  const skillNames = exactSkillNames(governedAssets);
  if (skillNames.length === 0) {
    return {
      ok: false,
      reason_code: 'opencode-permission-asset-set-empty',
    };
  }
  const permissionEntries = {
    skill: Object.fromEntries(skillNames.map((name) => [name, 'allow'])),
    ...Object.fromEntries(DANGEROUS_TOOLS.map((tool) => [tool, 'ask'])),
  };
  const policy = {
    schema_version: POLICY_SCHEMA_VERSION,
    kind: POLICY_KIND,
    skill_names: skillNames,
    permission_entries: permissionEntries,
  };
  const validation = validateOpenCodePermissionPolicy(policy);
  return validation.ok
    ? { ok: true, reason_code: 'opencode-permission-policy-derived', policy }
    : validation;
}

function validateOpenCodePermissionPolicy(policy) {
  if (!isObject(policy)
    || policy.schema_version !== POLICY_SCHEMA_VERSION
    || policy.kind !== POLICY_KIND
    || !Array.isArray(policy.skill_names)
    || !isObject(policy.permission_entries)) {
    return { ok: false, reason_code: 'opencode-permission-policy-invalid' };
  }
  if (Object.prototype.hasOwnProperty.call(policy.permission_entries, '*')
    && policy.permission_entries['*'] === 'allow') {
    return { ok: false, reason_code: 'opencode-permission-global-allow-rejected' };
  }
  const skillNames = policy.skill_names.map((name) => String(name));
  if (skillNames.some((name) => !/^[a-z0-9][a-z0-9-]*$/.test(name))) {
    return { ok: false, reason_code: 'opencode-permission-wildcard-rejected' };
  }
  if (new Set(skillNames).size !== skillNames.length) {
    return { ok: false, reason_code: 'opencode-permission-policy-invalid' };
  }
  const allowedKeys = new Set(['skill', ...DANGEROUS_TOOLS]);
  if (Object.keys(policy.permission_entries).some((key) => !allowedKeys.has(key))) {
    return { ok: false, reason_code: 'opencode-permission-policy-invalid' };
  }
  const skillRules = policy.permission_entries.skill;
  if (!isObject(skillRules)
    || Object.keys(skillRules).length !== skillNames.length
    || skillNames.some((name) => skillRules[name] !== 'allow')
    || Object.keys(skillRules).some((name) => !skillNames.includes(name))) {
    return { ok: false, reason_code: 'opencode-permission-policy-invalid' };
  }
  if (DANGEROUS_TOOLS.some((tool) => policy.permission_entries[tool] !== 'ask')) {
    return { ok: false, reason_code: 'opencode-permission-policy-invalid' };
  }
  return { ok: true, reason_code: 'opencode-permission-policy-valid' };
}

function lastMatchingEntry(entries, input) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (wildcardMatches(input, entries[index][0])) {
      return { key: entries[index][0], value: entries[index][1], index };
    }
  }
  return null;
}

function inspectSkillRules(permission, policy, operation) {
  const skillNames = policy.skill_names;
  if (!Object.prototype.hasOwnProperty.call(permission, 'skill')) {
    return operation === 'remove'
      ? { missing: [], conflicts: [], unsafe: [], removable: [] }
      : { missing: skillNames.map((name) => `permission.skill.${name}`), conflicts: [], unsafe: [], removable: [] };
  }
  const rules = permission.skill;
  if (!isObject(rules)) {
    return operation === 'remove'
      ? { missing: [], conflicts: [], unsafe: [], removable: [] }
      : { missing: [], conflicts: ['permission.skill'], unsafe: [], removable: [] };
  }
  const entries = Object.entries(rules);
  const result = { missing: [], conflicts: [], unsafe: [], removable: [] };
  for (const name of skillNames) {
    if (!Object.prototype.hasOwnProperty.call(rules, name)) {
      if (operation !== 'remove') result.missing.push(`permission.skill.${name}`);
      continue;
    }
    if (rules[name] !== 'allow') {
      result.conflicts.push(`permission.skill.${name}`);
      continue;
    }
    if (operation === 'remove') {
      result.removable.push(name);
      continue;
    }
    const effective = lastMatchingEntry(entries, name);
    if (!effective || effective.key !== name) result.unsafe.push(`permission.skill.${name}`);
  }
  if (operation !== 'remove') {
    const topLevelEffective = lastMatchingEntry(Object.entries(permission), 'skill');
    if (topLevelEffective && topLevelEffective.key !== 'skill') {
      result.unsafe.push('permission.skill');
    }
  }
  return result;
}

function dangerousRuleSafety(value) {
  if (typeof value === 'string') {
    if (!ACTIONS.has(value)) return { safe: false, conflict: true };
    if (value === 'allow') return { safe: false, conflict: true };
    return { safe: true, override: value === 'deny' };
  }
  if (!isObject(value)) return { safe: false, conflict: true };
  const entries = Object.entries(value);
  if (entries.length === 0) return { safe: false, unsafe: true };
  const [pattern, action] = entries[entries.length - 1];
  if (pattern !== '*') return { safe: false, unsafe: true };
  if (action === 'allow') return { safe: false, conflict: true };
  if (action !== 'ask' && action !== 'deny') return { safe: false, conflict: true };
  return { safe: true, override: true };
}

function inspectDangerousRules(permission, operation) {
  const entries = Object.entries(permission);
  const result = { missing: [], conflicts: [], unsafe: [], removable: [], safeOverrides: [] };
  for (const tool of DANGEROUS_TOOLS) {
    if (!Object.prototype.hasOwnProperty.call(permission, tool)) {
      if (operation !== 'remove') result.missing.push(`permission.${tool}`);
      continue;
    }
    const value = permission[tool];
    if (operation === 'remove') {
      if (value === 'ask') result.removable.push(tool);
      else result.conflicts.push(`permission.${tool}`);
      continue;
    }
    const effective = lastMatchingEntry(entries, tool);
    if (!effective || effective.key !== tool) {
      result.unsafe.push(`permission.${tool}`);
      continue;
    }
    const safety = dangerousRuleSafety(value);
    if (safety.unsafe) result.unsafe.push(`permission.${tool}`);
    else if (safety.conflict || !safety.safe) result.conflicts.push(`permission.${tool}`);
    else if (safety.override) result.safeOverrides.push(`permission.${tool}`);
  }
  return result;
}

function inspectPermissionValue(value, policy, { operation = 'upsert' } = {}) {
  if (!isObject(value)) {
    return {
      ok: false,
      configured: false,
      conflict: false,
      reason_code: 'host-config-opencode-document-invalid',
      permission_status: 'action-required',
    };
  }
  if (!Object.prototype.hasOwnProperty.call(value, 'permission')) {
    return operation === 'remove'
      ? {
        ok: true,
        configured: true,
        conflict: false,
        reason_code: 'host-config-opencode-permission-removal-current',
        permission_status: 'removed',
        permission_rule_count: policy.skill_names.length + DANGEROUS_TOOLS.length,
        permission_mutation_required: false,
      }
      : {
        ok: true,
        configured: false,
        conflict: false,
        reason_code: 'host-config-opencode-permission-missing',
        permission_status: 'missing',
        permission_rule_count: policy.skill_names.length + DANGEROUS_TOOLS.length,
      };
  }
  if (!isObject(value.permission)) {
    return operation === 'remove'
      ? {
        ok: true,
        configured: true,
        conflict: false,
        reason_code: 'host-config-opencode-permission-removal-current',
        permission_status: 'preserved-user-rule',
        permission_rule_count: policy.skill_names.length + DANGEROUS_TOOLS.length,
        permission_mutation_required: false,
      }
      : {
        ok: true,
        configured: false,
        conflict: true,
        reason_code: 'host-config-opencode-permission-conflict',
        conflict_fields: ['permission'],
        permission_status: 'action-required',
        permission_rule_count: policy.skill_names.length + DANGEROUS_TOOLS.length,
      };
  }

  const skill = inspectSkillRules(value.permission, policy, operation);
  const dangerous = inspectDangerousRules(value.permission, operation);
  const unsafe = [...new Set([...skill.unsafe, ...dangerous.unsafe])];
  const conflicts = [...new Set([...skill.conflicts, ...dangerous.conflicts])];
  const missing = [...new Set([...skill.missing, ...dangerous.missing])];
  const common = {
    permission_rule_count: policy.skill_names.length + DANGEROUS_TOOLS.length,
    permission_safe_overrides: dangerous.safeOverrides || [],
  };
  if (unsafe.length > 0) {
    return {
      ok: true,
      configured: false,
      conflict: true,
      reason_code: 'host-config-opencode-permission-order-unsafe',
      conflict_fields: unsafe,
      permission_status: 'action-required',
      ...common,
    };
  }
  if (conflicts.length > 0) {
    return {
      ok: true,
      configured: false,
      conflict: true,
      reason_code: 'host-config-opencode-permission-conflict',
      conflict_fields: conflicts,
      permission_status: 'action-required',
      ...common,
    };
  }
  if (missing.length > 0) {
    return {
      ok: true,
      configured: false,
      conflict: false,
      reason_code: 'host-config-opencode-permission-missing',
      missing_fields: missing,
      permission_status: 'missing',
      ...common,
    };
  }
  return {
    ok: true,
    configured: true,
    conflict: false,
    reason_code: operation === 'remove'
      ? 'host-config-opencode-permission-removal-current'
      : 'host-config-opencode-permission-current',
    permission_status: operation === 'remove' ? 'removed' : 'ready',
    removable_skill_names: skill.removable,
    removable_dangerous_tools: dangerous.removable,
    permission_mutation_required: operation === 'remove'
      && (skill.removable.length > 0 || dangerous.removable.length > 0),
    ...common,
  };
}

function mutatePermissionValue(value, policy, { operation = 'upsert' } = {}) {
  const inspection = inspectPermissionValue(value, policy, { operation });
  if (!inspection.ok || inspection.conflict) {
    return {
      ...inspection,
      ok: false,
      changed: false,
    };
  }
  const result = clone(value);
  let changed = false;
  if (operation === 'remove') {
    if (!isObject(result.permission)) {
      return { ok: true, changed: false, value: result, ...inspection };
    }
    if (isObject(result.permission.skill)) {
      for (const name of inspection.removable_skill_names || []) {
        delete result.permission.skill[name];
        changed = true;
      }
    }
    for (const tool of inspection.removable_dangerous_tools || []) {
      delete result.permission[tool];
      changed = true;
    }
  } else {
    if (!isObject(result.permission)) {
      result.permission = {};
      changed = true;
    }
    if (!Object.prototype.hasOwnProperty.call(result.permission, 'skill')) {
      result.permission.skill = {};
      changed = true;
    }
    for (const name of policy.skill_names) {
      if (!Object.prototype.hasOwnProperty.call(result.permission.skill, name)) {
        result.permission.skill[name] = 'allow';
        changed = true;
      }
    }
    for (const tool of DANGEROUS_TOOLS) {
      if (!Object.prototype.hasOwnProperty.call(result.permission, tool)) {
        result.permission[tool] = 'ask';
        changed = true;
      }
    }
  }
  const verified = inspectPermissionValue(result, policy, { operation });
  if (!verified.ok || !verified.configured || verified.conflict) {
    return {
      ok: false,
      changed: false,
      reason_code: 'host-config-opencode-permission-post-write-verify-failed',
      conflict_fields: verified.conflict_fields || [],
      permission_status: 'action-required',
    };
  }
  return {
    ok: true,
    changed,
    value: result,
    reason_code: changed
      ? (operation === 'remove'
        ? 'host-config-opencode-permission-removed'
        : 'host-config-opencode-permission-updated')
      : verified.reason_code,
    permission_status: verified.permission_status,
    permission_rule_count: verified.permission_rule_count,
    permission_safe_overrides: verified.permission_safe_overrides || [],
  };
}

function createOpenCodePermissionEditor({
  host,
  assetSet,
  buildAssetSet,
  skillRoot,
  policy,
} = {}) {
  if (host !== 'opencode') {
    return {
      ok: true,
      applicable: false,
      editor: null,
      reason_code: 'opencode-permission-not-applicable',
    };
  }
  const derived = policy
    ? { ok: true, policy }
    : deriveOpenCodePermissionPolicy({ assetSet, buildAssetSet, skillRoot });
  if (!derived.ok) return { ...derived, applicable: true, editor: null };
  const validation = validateOpenCodePermissionPolicy(derived.policy);
  if (!validation.ok) return { ...validation, applicable: true, editor: null };
  const editor = {
    kind: POLICY_KIND,
    inspect: (value, options) => inspectPermissionValue(value, derived.policy, options),
    mutate: (value, options) => mutatePermissionValue(value, derived.policy, options),
    permission_rule_count: derived.policy.skill_names.length + DANGEROUS_TOOLS.length,
  };
  return {
    ok: true,
    applicable: true,
    editor,
    reason_code: 'opencode-permission-editor-ready',
  };
}

module.exports = {
  DANGEROUS_TOOLS,
  POLICY_KIND,
  POLICY_SCHEMA_VERSION,
  createOpenCodePermissionEditor,
  deriveOpenCodePermissionPolicy,
  validateOpenCodePermissionPolicy,
};
