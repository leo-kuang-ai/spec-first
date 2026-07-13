'use strict';

// Projected skill runtimes do not carry this package's node_modules. Keep the
// workspace manifest contract self-contained and deliberately small: this is a
// strict parser for the documented schema, not a general YAML implementation.
const schema = require('../contracts/workspace-manifest.schema.json');

function parseWorkspaceManifest(source) {
  const lines = String(source || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const data = {};
  let section = '';
  let currentRepo = null;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    if (raw.includes('\t')) return invalid('workspace-manifest-unparseable');

    const indent = raw.length - raw.trimStart().length;
    const text = stripComment(raw.trim());
    if (!text) continue;

    if (indent === 0) {
      currentRepo = null;
      const match = text.match(/^([a-z_]+):(?:\s*(.*))?$/);
      if (!match) return invalid('workspace-manifest-unparseable');
      const [, key, rawValue = ''] = match;
      if (Object.prototype.hasOwnProperty.call(data, key)) return invalid('workspace-manifest-duplicate-key');
      if (key === 'repos' || key === 'exclusions') {
        if (rawValue.trim()) {
          if (data.schema_version && data.schema_version !== schema.properties.schema_version.const) {
            return invalid('workspace-manifest-version-mismatch');
          }
          return invalid('workspace-manifest-unparseable');
        }
        data[key] = [];
        section = key;
      } else {
        data[key] = parseScalar(rawValue);
        if (data[key] === null) return invalid('workspace-manifest-unparseable');
        section = '';
      }
      continue;
    }

    if (section === 'repos' && indent === 2 && text.startsWith('- ')) {
      const field = parseField(text.slice(2));
      if (!field || field.key !== 'path') return invalid('workspace-manifest-unparseable');
      currentRepo = { path: field.value };
      data.repos.push(currentRepo);
      continue;
    }
    if (section === 'repos' && indent === 4 && currentRepo) {
      const field = parseField(text);
      if (!field || Object.prototype.hasOwnProperty.call(currentRepo, field.key)) {
        return invalid('workspace-manifest-duplicate-key');
      }
      currentRepo[field.key] = field.value;
      continue;
    }
    if (section === 'exclusions' && indent === 2 && text.startsWith('- ')) {
      const value = parseScalar(text.slice(2));
      if (value === null) return invalid('workspace-manifest-unparseable');
      data.exclusions.push(value);
      continue;
    }
    return invalid('workspace-manifest-unparseable');
  }

  const validation = validateWorkspaceManifest(data);
  if (!validation.ok) return validation;
  return { ok: true, data };
}

function parseField(text) {
  const match = text.match(/^([a-z_]+):\s*(.*)$/);
  if (!match) return null;
  const value = parseScalar(match[2]);
  if (value === null) return null;
  return { key: match[1], value };
}

function parseScalar(rawValue) {
  const value = String(rawValue).trim();
  if (!value) return null;
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'string' ? parsed : null;
    } catch (_error) {
      return null;
    }
  }
  if (/^[\[\]{}&*!|>@`]/.test(value) || /:\s/.test(value)) return null;
  return value;
}

function stripComment(value) {
  let single = false;
  let double = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "'" && !double) single = !single;
    if (char === '"' && !single && value[index - 1] !== '\\') double = !double;
    if (char === '#' && !single && !double && (index === 0 || /\s/.test(value[index - 1]))) {
      return value.slice(0, index).trimEnd();
    }
  }
  return value;
}

function validateWorkspaceManifest(data) {
  const contract = schema;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return invalid('workspace-manifest-empty');
  const allowed = new Set(Object.keys(contract.properties || {}));
  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) return invalid('workspace-manifest-schema-invalid');
  }
  for (const key of contract.required || []) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return invalid('workspace-manifest-schema-invalid');
  }
  if (data.schema_version !== contract.properties.schema_version.const) {
    return invalid('workspace-manifest-version-mismatch');
  }
  if (data.repos !== undefined) {
    if (!Array.isArray(data.repos)) return invalid('workspace-manifest-schema-invalid');
    const repoSchema = contract.properties.repos.items;
    const repoAllowed = new Set(Object.keys(repoSchema.properties || {}));
    for (const repo of data.repos) {
      if (!repo || typeof repo !== 'object' || Array.isArray(repo)) return invalid('workspace-manifest-schema-invalid');
      if (!repoSchema.required.every((key) => Object.prototype.hasOwnProperty.call(repo, key))) {
        return invalid('workspace-manifest-schema-invalid');
      }
      if (Object.keys(repo).some((key) => !repoAllowed.has(key))) return invalid('workspace-manifest-schema-invalid');
      if (typeof repo.path !== 'string' || repo.path.length < 1) return invalid('workspace-manifest-schema-invalid');
      if (repo.alias !== undefined && (typeof repo.alias !== 'string' || repo.alias.length < 1)) {
        return invalid('workspace-manifest-schema-invalid');
      }
    }
  }
  if (data.exclusions !== undefined && (
    !Array.isArray(data.exclusions)
    || data.exclusions.some((entry) => typeof entry !== 'string' || entry.length < 1)
  )) return invalid('workspace-manifest-schema-invalid');
  return { ok: true };
}

function invalid(reasonCode) {
  return { ok: false, reason_code: reasonCode };
}

module.exports = {
  parseWorkspaceManifest,
};
