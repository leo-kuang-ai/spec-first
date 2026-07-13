
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);
const SOURCE_DIRECTORIES = {
  commands: 'templates/claude/commands/spec',
  skills: 'skills',
  agents: 'agents',
};
const BUNDLED_AGENT_SOURCE_DIRECTORY = 'agents';
const SUPPORTED_PLATFORM_IDS = ['claude', 'codex', 'cursor', 'kiro', 'qoder'];
const SUPPORTED_PLATFORMS = new Set(SUPPORTED_PLATFORM_IDS);
const ENTRY_SURFACES = new Set(['workflow_command', 'standalone_skill', 'internal_only']);
const HOST_SCOPES = new Set(['dual_host', 'host_exclusive', 'target_host_maintenance']);
const HOST_DELIVERIES = new Set(['command', 'skill', 'internal', 'none']);

function loadPluginManifest() {
  const manifest = buildPluginManifestFromSources();
  validateManifest(manifest);
  return manifest;
}

function buildPluginManifestFromSources() {
  const pkg = readJsonFile(PACKAGE_JSON_PATH, 'package metadata');
  const governance = readJsonFile(GOVERNANCE_PATH, 'skills governance truth source');
  const commands = [...(governance.skills || [])]
    .filter((record) => record && record.entry_surface === 'workflow_command')
    .flatMap((record) => {
      if (typeof record.command_name !== 'string' || record.command_name.length === 0) {
        throw new Error(`Governed workflow skill "${record.skill_name || '<unknown>'}" is missing command_name.`);
      }
      if (typeof record.skill_name !== 'string' || record.skill_name.length === 0) {
        throw new Error(`Governed workflow command "${record.command_name}" is missing skill_name.`);
      }

      const primaryFilename = `${record.command_name}.md`;
      const templatePath = path.join(REPO_ROOT, SOURCE_DIRECTORIES.commands, primaryFilename);
      const skillSourcePath = path.join(REPO_ROOT, SOURCE_DIRECTORIES.skills, record.skill_name, 'SKILL.md');
      const metadata = readCommandTemplateMetadata(templatePath, record.command_name, skillSourcePath);

      const primary = {
        name: record.command_name,
        filename: primaryFilename,
        description: metadata.description,
        argumentHint: metadata['argument-hint'] || '',
        skill: record.skill_name,
        sourceSkill: record.skill_name,
        isLegacyAlias: false,
      };

      const legacyCommandNames = Array.isArray(record.legacy_aliases && record.legacy_aliases.command_names)
        ? record.legacy_aliases.command_names
        : [];
      const legacySkillNames = Array.isArray(record.legacy_aliases && record.legacy_aliases.skill_names)
        ? record.legacy_aliases.skill_names
        : [];

      const aliases = legacyCommandNames.map((commandName, index) => {
        const aliasSkill = legacySkillNames[index] || legacySkillNames[0] || record.skill_name;
        return {
          name: commandName,
          filename: `${commandName}.md`,
          description: metadata.description,
          argumentHint: metadata['argument-hint'] || '',
          skill: aliasSkill,
          sourceSkill: record.skill_name,
          isLegacyAlias: true,
          canonicalCommandName: record.command_name,
          canonicalSkillName: record.skill_name,
        };
      });

      return [primary, ...aliases];
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    schemaVersion: 1,
    directories: { ...SOURCE_DIRECTORIES },
    commands,
    skills: listSkillDirectoryNames(path.join(REPO_ROOT, SOURCE_DIRECTORIES.skills)),
    agents: listAgentMarkdownEntries(path.join(REPO_ROOT, SOURCE_DIRECTORIES.agents)),
    name: typeof pkg.name === 'string' ? pkg.name : 'spec-first',
    version: typeof pkg.version === 'string' ? pkg.version : '0.0.0',
  };
}

function readJsonFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Bundled ${label} not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readCommandTemplateMetadata(templatePath, commandName, skillSourcePath) {
  const sourcePath = fs.existsSync(templatePath) ? templatePath
    : (skillSourcePath && fs.existsSync(skillSourcePath)) ? skillSourcePath
    : null;

  if (!sourcePath) {
    throw new Error(`Bundled workflow command template not found for "${commandName}": ${templatePath}`);
  }

  const { frontmatter } = splitMarkdownFrontmatter(fs.readFileSync(sourcePath, 'utf8'));
  const fields = parseSimpleFrontmatterFields(frontmatter);

  if (typeof fields.description !== 'string' || fields.description.length === 0) {
    throw new Error(`Bundled workflow command template "${commandName}" is missing description frontmatter.`);
  }
  if (typeof fields['argument-hint'] !== 'string') {
    // SKILL.md fallback: allow missing argument-hint, default to empty string
    fields['argument-hint'] = '';
  }

  return fields;
}

function splitMarkdownFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return { frontmatter: '', body: content };
  }

  const closingIndex = content.indexOf('\n---', 4);
  if (closingIndex === -1) {
    return { frontmatter: '', body: content };
  }

  return {
    frontmatter: content.slice(4, closingIndex),
    body: content.slice(closingIndex + 5),
  };
}

function parseSimpleFrontmatterFields(frontmatter) {
  const fields = {};

  for (const line of String(frontmatter || '').split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;

    fields[match[1]] = unquoteFrontmatterScalar(match[2].trim());
  }

  return fields;
}

function unquoteFrontmatterScalar(value) {
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Bundled plugin manifest must be a JSON object.');
  }

  if (!Array.isArray(manifest.commands)) {
    throw new Error('Bundled plugin manifest is missing a valid commands array.');
  }

  if (!manifest.directories || typeof manifest.directories !== 'object') {
    throw new Error('Bundled plugin manifest is missing directories metadata.');
  }

  for (const field of ['commands', 'skills']) {
    if (typeof manifest.directories[field] !== 'string' || manifest.directories[field].length === 0) {
      throw new Error(`Bundled plugin manifest is missing directories.${field}.`);
    }
  }
}

function getSkillsGovernancePath() {
  return GOVERNANCE_PATH;
}

function getBundledPath(kind) {
  if (kind === 'agents') {
    return path.join(REPO_ROOT, BUNDLED_AGENT_SOURCE_DIRECTORY);
  }

  const manifest = loadPluginManifest();
  return path.join(REPO_ROOT, manifest.directories[kind]);
}

function loadSkillsGovernance() {
  if (!fs.existsSync(GOVERNANCE_PATH)) {
    throw new Error(`Bundled skills governance truth source not found: ${GOVERNANCE_PATH}`);
  }

  const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
  validateSkillsGovernance(governance);

  return {
    schemaVersion: governance.schemaVersion,
    skills: governance.skills
      .map((record) => ({
        skill_name: record.skill_name,
        entry_surface: record.entry_surface,
        command_name: record.command_name,
        host_scope: record.host_scope,
        owner_host: record.owner_host,
        host_delivery: {
          claude: record.host_delivery.claude,
          codex: record.host_delivery.codex,
          cursor: record.host_delivery.cursor,
          kiro: record.host_delivery.kiro,
          qoder: record.host_delivery.qoder,
        },
        ...(record.legacy_aliases
          ? {
            legacy_aliases: {
              skill_names: Array.isArray(record.legacy_aliases.skill_names)
                ? [...record.legacy_aliases.skill_names]
                : [],
              command_names: Array.isArray(record.legacy_aliases.command_names)
                ? [...record.legacy_aliases.command_names]
                : [],
            },
          }
          : {}),
      }))
      .sort((a, b) => a.skill_name.localeCompare(b.skill_name)),
  };
}

function validateSkillsGovernance(governance) {
  if (!governance || typeof governance !== 'object' || Array.isArray(governance)) {
    throw new Error('Bundled skills governance truth source must be a JSON object.');
  }

  if (governance.schemaVersion !== 1) {
    throw new Error('Bundled skills governance truth source must declare schemaVersion=1.');
  }

  if (!Array.isArray(governance.skills)) {
    throw new Error('Bundled skills governance truth source is missing a valid skills array.');
  }

  const manifest = loadPluginManifest();
  const bundledSkills = listBundledSkills();
  const manifestCommandBySkill = new Map(manifest.commands.map((command) => [command.skill, command.name]));
  const seen = new Set();

  for (const [index, record] of governance.skills.entries()) {
    const prefix = `Bundled skills governance truth source skills[${index}]`;

    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error(`${prefix} must be an object.`);
    }

    if (typeof record.skill_name !== 'string' || record.skill_name.length === 0) {
      throw new Error(`${prefix} is missing skill_name.`);
    }

    if (!bundledSkills.includes(record.skill_name)) {
      throw new Error(`${prefix} references unknown bundled skill "${record.skill_name}".`);
    }

    if (seen.has(record.skill_name)) {
      throw new Error(`Bundled skills governance truth source duplicates skill "${record.skill_name}".`);
    }
    seen.add(record.skill_name);

    if (!ENTRY_SURFACES.has(record.entry_surface)) {
      throw new Error(`${prefix} has invalid entry_surface "${record.entry_surface}".`);
    }

    if (!HOST_SCOPES.has(record.host_scope)) {
      throw new Error(`${prefix} has invalid host_scope "${record.host_scope}".`);
    }

    if (!record.host_delivery || typeof record.host_delivery !== 'object' || Array.isArray(record.host_delivery)) {
      throw new Error(`${prefix} is missing host_delivery.`);
    }

    for (const platform of SUPPORTED_PLATFORM_IDS) {
      if (!HOST_DELIVERIES.has(record.host_delivery[platform])) {
        throw new Error(`${prefix} has invalid host_delivery.${platform}="${record.host_delivery[platform]}".`);
      }
    }

    const manifestCommandName = manifestCommandBySkill.get(record.skill_name) || null;
    if (record.entry_surface === 'workflow_command') {
      if (!manifestCommandName) {
        throw new Error(`${prefix} declares workflow_command but manifest has no command for "${record.skill_name}".`);
      }

      if (typeof record.command_name !== 'string' || record.command_name !== manifestCommandName) {
        throw new Error(
          `${prefix} must declare command_name="${manifestCommandName}" for workflow skill "${record.skill_name}".`,
        );
      }
    } else {
      if (manifestCommandName) {
        throw new Error(
          `${prefix} must use entry_surface="workflow_command" because manifest declares "${record.skill_name}" as a command-backed workflow.`,
        );
      }

      if (record.command_name !== null) {
        throw new Error(`${prefix} must set command_name=null for non-workflow skills.`);
      }

      if (record.entry_surface === 'standalone_skill') {
        for (const platform of SUPPORTED_PLATFORM_IDS) {
          if (record.host_delivery[platform] === 'command') {
            throw new Error(`${prefix} cannot deliver standalone skill "${record.skill_name}" as a command.`);
          }
        }
      }
    }

    if (record.entry_surface === 'internal_only') {
      for (const platform of SUPPORTED_PLATFORM_IDS) {
        if (record.host_delivery[platform] === 'command' || record.host_delivery[platform] === 'skill') {
          throw new Error(`${prefix} cannot expose internal_only skill "${record.skill_name}" as a user-visible delivery.`);
        }
      }

      continue;
    }

    if (record.host_scope === 'dual_host') {
      if (record.owner_host !== null) {
        throw new Error(`${prefix} must set owner_host=null for dual_host skills.`);
      }

      for (const platform of SUPPORTED_PLATFORM_IDS) {
        if (record.host_delivery[platform] === 'none' || record.host_delivery[platform] === 'internal') {
          throw new Error(`${prefix} must deliver dual_host skill "${record.skill_name}" to ${platform}.`);
        }
      }
    }

    if (record.host_scope === 'host_exclusive') {
      if (!SUPPORTED_PLATFORMS.has(record.owner_host)) {
        throw new Error(`${prefix} must set owner_host for host_exclusive skills.`);
      }

      const activePlatforms = SUPPORTED_PLATFORM_IDS.filter((platform) => (
        record.host_delivery[platform] !== 'none' && record.host_delivery[platform] !== 'internal'
      ));

      if (activePlatforms.length !== 1 || activePlatforms[0] !== record.owner_host) {
        throw new Error(
          `${prefix} must only deliver host_exclusive skill "${record.skill_name}" to owner_host="${record.owner_host}".`,
        );
      }
    }

    if (record.host_scope === 'target_host_maintenance') {
      if (!SUPPORTED_PLATFORMS.has(record.owner_host)) {
        throw new Error(`${prefix} must set owner_host for target_host_maintenance skills.`);
      }

      const activePlatforms = SUPPORTED_PLATFORM_IDS.filter((platform) => (
        record.host_delivery[platform] !== 'none' && record.host_delivery[platform] !== 'internal'
      ));

      if (activePlatforms.length === 0) {
        throw new Error(`${prefix} must expose target_host_maintenance skill "${record.skill_name}" on at least one host.`);
      }

      if (!activePlatforms.includes(record.owner_host)) {
        throw new Error(
          `${prefix} must deliver target_host_maintenance skill "${record.skill_name}" on owner_host="${record.owner_host}".`,
        );
      }

      const nonOwnerPlatforms = activePlatforms.filter((platform) => platform !== record.owner_host);
      if (nonOwnerPlatforms.length === 0) {
        throw new Error(
          `${prefix} must also deliver target_host_maintenance skill "${record.skill_name}" on at least one non-owner host.`,
        );
      }
    }

    if (record.legacy_aliases !== undefined) {
      if (!record.legacy_aliases || typeof record.legacy_aliases !== 'object' || Array.isArray(record.legacy_aliases)) {
        throw new Error(`${prefix} legacy_aliases must be an object when present.`);
      }

      const legacySkillNames = record.legacy_aliases.skill_names;
      const legacyCommandNames = record.legacy_aliases.command_names;

      if (legacySkillNames !== undefined) {
        if (!Array.isArray(legacySkillNames) || legacySkillNames.some((name) => typeof name !== 'string' || name.length === 0)) {
          throw new Error(`${prefix} legacy_aliases.skill_names must be an array of non-empty strings.`);
        }
        for (const aliasName of legacySkillNames) {
          if (aliasName === record.skill_name || seen.has(aliasName) || bundledSkills.includes(aliasName)) {
            throw new Error(`${prefix} legacy skill alias "${aliasName}" collides with a primary skill name.`);
          }
        }
      }

      if (legacyCommandNames !== undefined) {
        if (!Array.isArray(legacyCommandNames) || legacyCommandNames.some((name) => typeof name !== 'string' || name.length === 0)) {
          throw new Error(`${prefix} legacy_aliases.command_names must be an array of non-empty strings.`);
        }
        if (record.entry_surface !== 'workflow_command') {
          throw new Error(`${prefix} can only declare command aliases for workflow_command skills.`);
        }
        for (const aliasName of legacyCommandNames) {
          if (aliasName === record.command_name) {
            throw new Error(`${prefix} legacy command alias "${aliasName}" collides with the primary command_name.`);
          }
        }
      }
    }

  }

  const missingSkills = bundledSkills.filter((skillName) => !seen.has(skillName));
  if (missingSkills.length > 0) {
    throw new Error(`Bundled skills governance truth source is missing skills: ${missingSkills.join(', ')}`);
  }
}

function listBundledCommands() {
  const manifest = loadPluginManifest();
  return manifest.commands.map((command) => {
    if (!command || typeof command !== 'object') {
      throw new Error('Bundled plugin manifest contains an invalid command entry.');
    }

    for (const field of ['name', 'filename', 'description', 'skill']) {
      if (typeof command[field] !== 'string' || command[field].length === 0) {
        throw new Error(`Bundled plugin manifest command is missing ${field}.`);
      }
    }
    if (typeof command.argumentHint !== 'string') {
      throw new Error('Bundled plugin manifest command is missing argumentHint.');
    }

    return { ...command };
  });
}

function listBundledSkills() {
  const sourceDir = getBundledPath('skills');
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Bundled skills directory not found: ${sourceDir}`);
  }

  return listSkillDirectoryNames(sourceDir);
}

function listBundledAgents() {
  const sourceDir = getBundledPath('agents');
  if (!fs.existsSync(sourceDir)) {
    return [];
  }

  return listAgentMarkdownEntries(sourceDir);
}

function listBundledAgentNames() {
  return listBundledAgents()
    .map((entry) => entry.replace(/^.*[\\/]/, ''))
    .filter((name) => name.endsWith('.agent.md'))
    .map((name) => name.replace(/\.agent\.md$/, ''));
}

function listBundledAgentSupportFiles() {
  const sourceDir = getBundledPath('agents');
  if (!fs.existsSync(sourceDir)) {
    return [];
  }

  return fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .flatMap((entry) => walkAgentSupportEntries(path.join(sourceDir, entry.name), entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function listSkillDirectoryNames(sourceDir) {
  if (!fs.existsSync(sourceDir)) {
    return [];
  }

  return fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function listAgentMarkdownEntries(sourceDir) {
  if (!fs.existsSync(sourceDir)) {
    return [];
  }

  return fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .flatMap((entry) => walkAgentEntries(path.join(sourceDir, entry.name), entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function walkAgentEntries(absolutePath, relativePath) {
  if (shouldIgnoreBundledSupportPath(relativePath)) {
    return [];
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    return fs
      .readdirSync(absolutePath, { withFileTypes: true })
      .flatMap((entry) =>
        walkAgentEntries(
          path.join(absolutePath, entry.name),
          path.join(relativePath, entry.name),
        ),
      );
  }

  return relativePath.endsWith('.md') ? [relativePath] : [];
}

function walkAgentSupportEntries(absolutePath, relativePath) {
  if (shouldIgnoreBundledSupportPath(relativePath)) {
    return [];
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    return fs
      .readdirSync(absolutePath, { withFileTypes: true })
      .flatMap((entry) =>
        walkAgentSupportEntries(
          path.join(absolutePath, entry.name),
          path.join(relativePath, entry.name),
        ),
      );
  }

  return relativePath.endsWith('.md') ? [] : [relativePath];
}

function readBundledCommandTemplate(commandName) {
  const command = listBundledCommands().find((entry) => entry.name === commandName);
  if (!command) {
    throw new Error(`Unknown bundled command template: ${commandName}`);
  }

  // Alias commands reuse the canonical command template (or primary skill frontmatter).
  const templateFilename = command.isLegacyAlias && command.canonicalCommandName
    ? `${command.canonicalCommandName}.md`
    : command.filename;
  const templatePath = path.join(getBundledPath('commands'), templateFilename);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf8');
  }

  const sourceSkillName = command.sourceSkill || command.skill;
  const skillPath = path.join(getBundledPath('skills'), sourceSkillName, 'SKILL.md');
  if (fs.existsSync(skillPath)) {
    return fs.readFileSync(skillPath, 'utf8');
  }

  return `---\ndescription: ${JSON.stringify(command.description)}\nargument-hint: ${JSON.stringify(command.argumentHint)}\n---\n`;
}

function resolveBundledSkillSourceName(skillName) {
  const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
  for (const record of governance.skills || []) {
    if (record.skill_name === skillName) {
      return skillName;
    }
    const aliases = record.legacy_aliases && Array.isArray(record.legacy_aliases.skill_names)
      ? record.legacy_aliases.skill_names
      : [];
    if (aliases.includes(skillName)) {
      return record.skill_name;
    }
  }
  return skillName;
}

function readBundledSkillSource(skillName) {
  const sourceSkillName = resolveBundledSkillSourceName(skillName);
  return fs.readFileSync(path.join(getBundledPath('skills'), sourceSkillName, 'SKILL.md'), 'utf8');
}

function shouldIgnoreBundledSupportPath(relativePath) {
  const normalizedPath = String(relativePath || '').replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  const basename = parts[parts.length - 1] || '';
  return (
    parts.includes('__pycache__')
    || basename === '.DS_Store'
    || basename.endsWith('.pyc')
    || basename.endsWith('.pyo')
  );
}

module.exports = {
  getBundledPath,
  getSkillsGovernancePath,
  listBundledAgentNames,
  listBundledAgentSupportFiles,
  listBundledAgents,
  listBundledCommands,
  listBundledSkills,
  loadPluginManifest,
  loadSkillsGovernance,
  readBundledCommandTemplate,
  readBundledSkillSource,
  resolveBundledSkillSourceName,
  shouldIgnoreBundledSupportPath,
  validateSkillsGovernance,
};
