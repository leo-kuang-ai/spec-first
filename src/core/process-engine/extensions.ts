import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { exists } from '../../shared/fs-utils.js';

interface RawExtensionManifest {
  namespace?: unknown;
  version?: unknown;
  enabled?: unknown;
  skills_dir?: unknown;
  rules?: unknown;
  hooks?: unknown;
}

export interface ExtensionHookConfig {
  type: 'PreToolUse' | 'PostToolUse' | 'Stop';
  matcher?: string;
  command: string;
}

export interface ExtensionDescriptor {
  namespace: string;
  version: string;
  enabled: boolean;
  rootDir: string;
  skillsDir: string;
  rules?: Record<string, unknown>;
  hooks: ExtensionHookConfig[];
}

const EXT_ROOT = '.spec-first/extensions';

function parseManifest(path: string): RawExtensionManifest | undefined {
  try {
    const raw = readFileSync(path, 'utf-8');
    const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
    return parsed as RawExtensionManifest;
  } catch {
    return undefined;
  }
}

function normalizeHooks(rawHooks: unknown): ExtensionHookConfig[] {
  if (!Array.isArray(rawHooks)) return [];
  const hooks: ExtensionHookConfig[] = [];
  for (const raw of rawHooks) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    if (item.enabled === false) continue;
    const type = typeof item.type === 'string' ? item.type : '';
    const command = typeof item.command === 'string' ? item.command.trim() : '';
    const matcher = typeof item.matcher === 'string' ? item.matcher : undefined;
    if (!command) continue;
    if (type !== 'PreToolUse' && type !== 'PostToolUse' && type !== 'Stop') continue;
    hooks.push({ type, matcher, command });
  }
  return hooks;
}

export function loadEnabledExtensions(projectRoot: string): ExtensionDescriptor[] {
  const extRoot = join(projectRoot, EXT_ROOT);
  if (!exists(extRoot)) return [];

  const out: ExtensionDescriptor[] = [];
  for (const entry of readdirSync(extRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const rootDir = join(extRoot, entry.name);
    const yamlPath = exists(join(rootDir, 'extension.yaml'))
      ? join(rootDir, 'extension.yaml')
      : join(rootDir, 'extension.yml');
    if (!exists(yamlPath)) continue;

    const manifest = parseManifest(yamlPath);
    if (!manifest) continue;
    if (manifest.enabled === false) continue;

    const namespace = typeof manifest.namespace === 'string' ? manifest.namespace.trim() : '';
    const version = typeof manifest.version === 'string' ? manifest.version.trim() : '';
    if (!namespace || !/^[a-z][a-z0-9_-]{1,31}$/i.test(namespace)) continue;
    if (!version) continue;

    const skillsDirRel =
      typeof manifest.skills_dir === 'string' && manifest.skills_dir.trim().length > 0
        ? manifest.skills_dir.trim()
        : 'skills';
    const skillsDir = join(rootDir, skillsDirRel);

    out.push({
      namespace,
      version,
      enabled: true,
      rootDir,
      skillsDir,
      rules:
        manifest.rules && typeof manifest.rules === 'object' && !Array.isArray(manifest.rules)
          ? (manifest.rules as Record<string, unknown>)
          : undefined,
      hooks: normalizeHooks(manifest.hooks),
    });
  }

  return out.sort((a, b) => a.namespace.localeCompare(b.namespace));
}
