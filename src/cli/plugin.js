const fs = require('node:fs');
const path = require('node:path');
const {
  buildEmptyOperationPlan,
  buildFileWriteOperation: buildSharedFileWriteOperation,
  buildRelativeOperation,
  mergeOperationPlans,
  normalizeOperationPath,
  summarizeOperationPlan,
} = require('./state');
const {
  maskAllowedCodexOtherHostPaths,
} = require('./host-comparative-workflows');

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
const SUPPORTED_PLATFORM_IDS = ['claude', 'codex'];
const SUPPORTED_PLATFORMS = new Set(SUPPORTED_PLATFORM_IDS);
const ENTRY_SURFACES = new Set(['workflow_command', 'standalone_skill', 'internal_only']);
const HOST_SCOPES = new Set(['dual_host', 'host_exclusive', 'target_host_maintenance']);
const HOST_DELIVERIES = new Set(['command', 'skill', 'internal', 'none']);
const DELIVERED_INTERNAL_SKILLS = new Set([
  'git-worktree',
]);
const TEXT_FILE_EXTENSIONS = new Set([
  '.md',
  '.json',
  '.yaml',
  '.yml',
  '.sh',
  '.rb',
  '.py',
  '.mjs',
  '.txt',
]);
const CANONICAL_AGENT_NAME_PATTERN = /\bce:[a-z-]+:[a-z-]+\b/;
const CODEX_UNREWRITTEN_PATH_PATTERNS = [
  /\.claude\/commands\/spec\/[a-z-]+\.md/,
  /\.claude\/spec-first\/workflows\//,
  /\.claude\/skills\//,
  /\.claude\/agents\//,
  CANONICAL_AGENT_NAME_PATTERN,
];
const HIGH_VALUE_SKILL_ANCHORS = {
  'spec-plan': [
    'Implementation Units',
    'Concrete requirements traceability',
    'Test scenarios',
    'governance-boundaries.md',
    'universal-planning.md',
  ],
  'spec-work': [
    "Derive tasks from the plan's implementation units",
    'Context Orientation Anchor',
    'direct repo reads',
    'references/shipping-workflow.md',
    'Phase 4',
    'final verification',
  ],
  'spec-code-review': [
    'Plan discovery (requirements verification)',
    'Context Orientation Anchor',
    'requires_verification',
    'validator-template.md',
    'pipe-delimited tables',
  ],
};
const HIGH_VALUE_COMMAND_ANCHORS = {
  'spec-plan': [
    'Implementation Units',
    'Concrete requirements traceability',
    'Test scenarios',
    'governance-boundaries.md',
    'universal-planning.md',
  ],
  'spec-work': [
    "Derive tasks from the plan's implementation units",
    'Context Orientation Anchor',
    'direct repo reads',
    'references/shipping-workflow.md',
    'Phase 4',
    'final verification',
  ],
  'spec-code-review': [
    'Plan discovery (requirements verification)',
    'Context Orientation Anchor',
    'requires_verification',
    'validator-template.md',
    'pipe-delimited tables',
  ],
};

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
    .map((record) => {
      if (typeof record.command_name !== 'string' || record.command_name.length === 0) {
        throw new Error(`Governed workflow skill "${record.skill_name || '<unknown>'}" is missing command_name.`);
      }
      if (typeof record.skill_name !== 'string' || record.skill_name.length === 0) {
        throw new Error(`Governed workflow command "${record.command_name}" is missing skill_name.`);
      }

      const filename = `${record.command_name}.md`;
      const templatePath = path.join(REPO_ROOT, SOURCE_DIRECTORIES.commands, filename);
      const skillSourcePath = path.join(REPO_ROOT, SOURCE_DIRECTORIES.skills, record.skill_name, 'SKILL.md');
      const metadata = readCommandTemplateMetadata(templatePath, record.command_name, skillSourcePath);

      return {
        name: record.command_name,
        filename,
        description: metadata.description,
        argumentHint: metadata['argument-hint'] || '',
        skill: record.skill_name,
      };
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

  for (const field of ['commands', 'skills', 'agents']) {
    if (typeof manifest.directories[field] !== 'string' || manifest.directories[field].length === 0) {
      throw new Error(`Bundled plugin manifest is missing directories.${field}.`);
    }
  }
}

function getSkillsGovernancePath() {
  return GOVERNANCE_PATH;
}

function getBundledPath(kind) {
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
        },
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
    throw new Error(`Bundled agents directory not found: ${sourceDir}`);
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
    throw new Error(`Bundled agents directory not found: ${sourceDir}`);
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

  const templatePath = path.join(getBundledPath('commands'), command.filename);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf8');
  }

  // 无独立模板文件时，用 SKILL.md 内容（frontmatter 已在 buildPluginManifestFromSources 验证）
  const skillPath = path.join(getBundledPath('skills'), command.skill, 'SKILL.md');
  if (fs.existsSync(skillPath)) {
    return fs.readFileSync(skillPath, 'utf8');
  }

  // 最后回退：生成最小 frontmatter
  return `---\ndescription: ${JSON.stringify(command.description)}\nargument-hint: ${JSON.stringify(command.argumentHint)}\n---\n`;
}

function readBundledSkillSource(skillName) {
  return fs.readFileSync(path.join(getBundledPath('skills'), skillName, 'SKILL.md'), 'utf8');
}

function buildFilteredAssetSet(platformOrAdapter) {
  const platform = resolvePlatformId(platformOrAdapter);
  const governance = loadSkillsGovernance();
  const commandBySkill = new Map(listBundledCommands().map((command) => [command.skill, { ...command }]));
  const workflowSkills = [];
  const skills = [];
  const internalSkills = [];
  const commands = [];
  const skipped = [];

  for (const record of governance.skills) {
    const delivery = record.host_delivery[platform];
    const reason = `${record.entry_surface} excluded on ${platform} because host_delivery.${platform}=${delivery}`;

    if (record.entry_surface === 'workflow_command') {
      if (delivery === 'command') {
        const command = commandBySkill.get(record.skill_name);
        if (!command) {
          throw new Error(`Missing bundled command definition for governed workflow skill: ${record.skill_name}`);
        }

        commands.push(command);
        workflowSkills.push(record.skill_name);
        continue;
      }

      if (delivery === 'skill') {
        workflowSkills.push(record.skill_name);
        continue;
      }

      skipped.push({
        skillName: record.skill_name,
        platform,
        reason,
      });
      continue;
    }

    if (record.entry_surface === 'standalone_skill' && delivery === 'skill') {
      skills.push(record.skill_name);
      continue;
    }

    if (
      record.entry_surface === 'internal_only'
      && delivery === 'internal'
      && DELIVERED_INTERNAL_SKILLS.has(record.skill_name)
    ) {
      internalSkills.push(record.skill_name);
      continue;
    }

    skipped.push({
      skillName: record.skill_name,
      platform,
      reason,
    });
  }

  return {
    platform,
    commands: commands.sort((a, b) => a.name.localeCompare(b.name)),
    workflowSkills: workflowSkills.sort((a, b) => a.localeCompare(b)),
    skills: skills.sort((a, b) => a.localeCompare(b)),
    internalSkills: internalSkills.sort((a, b) => a.localeCompare(b)),
    agents: listBundledAgents(),
    agentSupportFiles: listBundledAgentSupportFiles(),
    skipped: skipped.sort((a, b) => a.skillName.localeCompare(b.skillName)),
  };
}

function resolvePlatformId(platformOrAdapter) {
  const platform = typeof platformOrAdapter === 'string'
    ? platformOrAdapter
    : platformOrAdapter && typeof platformOrAdapter.id === 'string'
      ? platformOrAdapter.id
      : '';

  if (!SUPPORTED_PLATFORMS.has(platform)) {
    throw new Error(`Unknown platform for filtered asset set: ${platform}`);
  }

  return platform;
}

function syncBundledAssets(projectRoot, adapter) {
  const filteredAssetSet = buildFilteredAssetSet(adapter.id);
  const commands = adapter.hasCommands ? syncCommands(projectRoot, adapter, filteredAssetSet.commands) : [];
  const { skills, workflowSkills, internalSkills } = syncSkills(projectRoot, adapter, filteredAssetSet);
  const { agents, agentSupportFiles } = syncAgents(projectRoot, adapter);

  return { commands, skills, workflowSkills, internalSkills, agents, agentSupportFiles, skipped: filteredAssetSet.skipped };
}

function planBundledAssetSync(projectRoot, adapter, filteredAssetSet = buildFilteredAssetSet(adapter.id)) {
  const commandPlan = adapter.hasCommands
    ? planCommandsSync(projectRoot, adapter, filteredAssetSet.commands)
    : { plan: emptyPlan(), runtimeCommands: [] };
  const skillsPlan = planSkillsSync(projectRoot, adapter, filteredAssetSet);
  const agentsPlan = planAgentsSync(projectRoot, adapter);

  return {
    plan: mergeOperationPlans(commandPlan.plan, skillsPlan.plan, agentsPlan.plan),
    syncedAssets: {
      commands: commandPlan.runtimeCommands,
      skills: skillsPlan.skills,
      workflowSkills: skillsPlan.workflowSkills,
      internalSkills: skillsPlan.internalSkills,
      agents: agentsPlan.agents,
      agentSupportFiles: agentsPlan.agentSupportFiles,
      skipped: filteredAssetSet.skipped,
    },
  };
}

function syncCommands(projectRoot, adapter, commands = listBundledCommands()) {
  const targetRoot = path.join(projectRoot, adapter.commandRoot);
  fs.mkdirSync(targetRoot, { recursive: true });

  const runtimeCommands = commands.map((command) => ({
    ...command,
    filename: adapter.commandFilename(command),
  }));

  for (const command of runtimeCommands) {
    const transformed = renderRuntimeCommandContent(command, adapter);
    fs.writeFileSync(
      path.join(targetRoot, command.filename),
      transformed,
      'utf8',
    );
  }

  return runtimeCommands;
}

function planCommandsSync(projectRoot, adapter, commands = listBundledCommands()) {
  const targetRoot = path.join(projectRoot, adapter.commandRoot);
  const runtimeCommands = commands.map((command) => ({
    ...command,
    filename: adapter.commandFilename(command),
  }));
  const operations = [buildPlanOperation('ensure_dir', adapter.commandRoot, 'managed_command_root')];

  for (const command of runtimeCommands) {
    const transformed = renderRuntimeCommandContent(command, adapter);
    operations.push(buildFileWriteOperation(
      projectRoot,
      path.join(targetRoot, command.filename),
      transformed,
      'managed_command',
    ));
  }

  return {
    plan: {
      operations,
      summary: summarizeOperationPlan(operations),
    },
    runtimeCommands,
  };
}

function syncSkills(projectRoot, adapter, filteredAssetSet = buildFilteredAssetSet(adapter.id)) {
  const standaloneRoot = path.join(projectRoot, adapter.skillsRoot);
  const workflowRoot = path.join(projectRoot, adapter.workflowsRoot);
  fs.mkdirSync(standaloneRoot, { recursive: true });

  const sourceRoot = getBundledPath('skills');
  const standaloneNames = [...filteredAssetSet.skills];
  const internalNames = [...(filteredAssetSet.internalSkills || [])];
  const workflowNames = [...filteredAssetSet.workflowSkills];
  if (workflowNames.length > 0) {
    fs.mkdirSync(workflowRoot, { recursive: true });
  }
  const workflowNameSet = new Set(workflowNames);
  const skillNames = [...new Set([...standaloneNames, ...internalNames, ...workflowNames])].sort((a, b) =>
    a.localeCompare(b),
  );

  for (const skillName of skillNames) {
    const isWorkflowSkill = workflowNameSet.has(skillName);
    const targetDir = isWorkflowSkill
      ? path.join(workflowRoot, skillName)
      : path.join(standaloneRoot, skillName);
    const transformContext = buildSkillTransformContext(projectRoot, skillName, isWorkflowSkill, targetDir);

    fs.rmSync(targetDir, { recursive: true, force: true });

    if (isWorkflowSkill && workflowRoot !== standaloneRoot) {
      fs.rmSync(path.join(standaloneRoot, skillName), { recursive: true, force: true });
    }

    copyDirectoryWithTransform(path.join(sourceRoot, skillName), targetDir, (content, fileContext) =>
      transformSkillTextFile(adapter, transformContext, content, fileContext),
    );
  }

  return { skills: standaloneNames, workflowSkills: workflowNames, internalSkills: internalNames };
}

function planSkillsSync(projectRoot, adapter, filteredAssetSet = buildFilteredAssetSet(adapter.id)) {
  const standaloneRoot = path.join(projectRoot, adapter.skillsRoot);
  const workflowRoot = path.join(projectRoot, adapter.workflowsRoot);
  const sourceRoot = getBundledPath('skills');
  const standaloneNames = [...filteredAssetSet.skills];
  const internalNames = [...(filteredAssetSet.internalSkills || [])];
  const workflowNames = [...filteredAssetSet.workflowSkills];
  const workflowNameSet = new Set(workflowNames);
  const skillNames = [...new Set([...standaloneNames, ...internalNames, ...workflowNames])].sort((a, b) =>
    a.localeCompare(b),
  );
  const operations = [
    buildPlanOperation('ensure_dir', adapter.skillsRoot, 'managed_skills_root'),
  ];

  if (adapter.workflowsRoot !== adapter.skillsRoot && workflowNames.length > 0) {
    operations.push(buildPlanOperation('ensure_dir', adapter.workflowsRoot, 'managed_workflows_root'));
  }

  for (const skillName of skillNames) {
    const isWorkflowSkill = workflowNameSet.has(skillName);
    const targetDir = isWorkflowSkill
      ? path.join(workflowRoot, skillName)
      : path.join(standaloneRoot, skillName);
    const transformContext = buildSkillTransformContext(projectRoot, skillName, isWorkflowSkill, targetDir);

    operations.push(buildPlanOperation(
      'remove_dir',
      toRelativeProjectPath(targetDir, projectRoot),
      isWorkflowSkill ? 'managed_workflow_skill_reset' : 'managed_skill_reset',
    ));

    if (isWorkflowSkill && workflowRoot !== standaloneRoot) {
      operations.push(buildPlanOperation(
        'remove_dir',
        normalizePathForContent(path.join(adapter.skillsRoot, skillName)),
        'managed_workflow_skill_standalone_cleanup',
      ));
    }

    operations.push(...planDirectoryWithTransform({
      projectRoot,
      sourceDir: path.join(sourceRoot, skillName),
      targetDir,
      reason: isWorkflowSkill ? 'managed_workflow_skill' : 'managed_skill',
      transformText: (content, fileContext) =>
        transformSkillTextFile(adapter, transformContext, content, fileContext),
    }));
  }

  return {
    plan: {
      operations,
      summary: summarizeOperationPlan(operations),
    },
    skills: standaloneNames,
    workflowSkills: workflowNames,
    internalSkills: internalNames,
  };
}

function syncAgents(projectRoot, adapter) {
  const targetRoot = path.join(projectRoot, adapter.agentsRoot);
  fs.mkdirSync(targetRoot, { recursive: true });

  const sourceRoot = getBundledPath('agents');
  const agentPaths = listBundledAgents();
  const agentSupportFiles = listBundledAgentSupportFiles();

  for (const agentPath of agentPaths) {
    const sourcePath = path.join(sourceRoot, agentPath);
    const targetPath = path.join(targetRoot, agentPath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileWithTransform(sourcePath, targetPath, (content) =>
      adapter.transformAgentContent(content),
    );
  }

  for (const supportPath of agentSupportFiles) {
    const sourcePath = path.join(sourceRoot, supportPath);
    const targetPath = path.join(targetRoot, supportPath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileWithTransform(sourcePath, targetPath, (content) => content);
  }

  return { agents: agentPaths, agentSupportFiles };
}

function planAgentsSync(projectRoot, adapter) {
  const targetRoot = path.join(projectRoot, adapter.agentsRoot);
  const sourceRoot = getBundledPath('agents');
  const agentPaths = listBundledAgents();
  const agentSupportFiles = listBundledAgentSupportFiles();
  const operations = [
    buildPlanOperation('ensure_dir', adapter.agentsRoot, 'managed_agents_root'),
  ];

  for (const agentPath of agentPaths) {
    operations.push(...planFileCopyWithTransform({
      projectRoot,
      sourcePath: path.join(sourceRoot, agentPath),
      targetPath: path.join(targetRoot, agentPath),
      reason: 'managed_agent',
      transformText: (content) => adapter.transformAgentContent(content),
    }));
  }

  for (const supportPath of agentSupportFiles) {
    operations.push(...planFileCopyWithTransform({
      projectRoot,
      sourcePath: path.join(sourceRoot, supportPath),
      targetPath: path.join(targetRoot, supportPath),
      reason: 'managed_agent_support_file',
      transformText: (content) => content,
    }));
  }

  return {
    plan: {
      operations,
      summary: summarizeOperationPlan(operations),
    },
    agents: agentPaths,
    agentSupportFiles,
  };
}

function inspectInstalledAssets(projectRoot, adapter) {
  const filteredAssetSet = buildFilteredAssetSet(adapter.id);
  const agents = listBundledAgents();
  const agentSupportFiles = listBundledAgentSupportFiles();

  return {
    commands: adapter.hasCommands
      ? inspectCommands(projectRoot, filteredAssetSet.commands, adapter)
      : { targetRoot: adapter.commandRoot, entries: [], missing: [] },
    skills: inspectSkills(projectRoot, filteredAssetSet, adapter),
    agents: inspectAgents(projectRoot, agents, adapter),
    agentSupportFiles: inspectAgentSupportFiles(projectRoot, agentSupportFiles, adapter),
  };
}

function inspectCommands(projectRoot, commands = listBundledCommands(), adapter) {
  const targetRoot = path.join(projectRoot, adapter.commandRoot);
  const runtimeCommands = commands.map((command) => ({
    ...command,
    filename: adapter.commandFilename(command),
  }));
  const missing = runtimeCommands.filter((command) => !fs.existsSync(path.join(targetRoot, command.filename)));
  const drifted = runtimeCommands
    .filter((command) => fs.existsSync(path.join(targetRoot, command.filename)))
    .map((command) => inspectCommandIntegrity(projectRoot, command, adapter))
    .filter(Boolean);
  return { targetRoot, entries: runtimeCommands, missing, drifted };
}

function inspectSkills(projectRoot, filteredAssetSet, adapter) {
  const standaloneRoot = path.join(projectRoot, adapter.skillsRoot);
  const workflowRoot = path.join(projectRoot, adapter.workflowsRoot);
  const workflowNames = [...(filteredAssetSet && filteredAssetSet.workflowSkills ? filteredAssetSet.workflowSkills : [])];
  const standaloneNames = [...(filteredAssetSet && filteredAssetSet.skills ? filteredAssetSet.skills : [])];
  const internalNames = [...(filteredAssetSet && filteredAssetSet.internalSkills ? filteredAssetSet.internalSkills : [])];
  const workflowNameSet = new Set(workflowNames);
  const skillNames = [...new Set([...standaloneNames, ...internalNames, ...workflowNames])].sort((a, b) =>
    a.localeCompare(b),
  );

  const missing = skillNames.filter((skillName) => {
    const targetRoot = workflowNameSet.has(skillName) ? workflowRoot : standaloneRoot;
    return !fs.existsSync(path.join(targetRoot, skillName, 'SKILL.md'));
  });
  const drifted = skillNames
    .filter((skillName) => !missing.includes(skillName))
    .map((skillName) => inspectSkillIntegrity({
      projectRoot,
      adapter,
      skillName,
      isWorkflowSkill: workflowNameSet.has(skillName),
      standaloneRoot,
      workflowRoot,
    }))
    .filter(Boolean);
  return { targetRoot: standaloneRoot, entries: skillNames, missing, drifted };
}

function inspectAgents(projectRoot, agentPaths = listBundledAgents(), adapter) {
  const targetRoot = path.join(projectRoot, adapter.agentsRoot);
  const missing = agentPaths.filter((agentPath) => !fs.existsSync(path.join(targetRoot, agentPath)));
  const drifted = agentPaths
    .filter((agentPath) => !missing.includes(agentPath))
    .map((agentPath) => inspectAgentIntegrity(projectRoot, agentPath, adapter))
    .filter(Boolean);
  return { targetRoot, entries: agentPaths, missing, drifted };
}

function inspectAgentSupportFiles(projectRoot, supportPaths = listBundledAgentSupportFiles(), adapter) {
  const targetRoot = path.join(projectRoot, adapter.agentsRoot);
  const missing = supportPaths.filter((supportPath) => !fs.existsSync(path.join(targetRoot, supportPath)));
  const drifted = supportPaths
    .filter((supportPath) => !missing.includes(supportPath))
    .map((supportPath) => inspectAgentSupportFileIntegrity(projectRoot, supportPath, adapter))
    .filter(Boolean);
  return { targetRoot, entries: supportPaths, missing, drifted };
}

module.exports = {
  buildFilteredAssetSet,
  getBundledPath,
  getSkillsGovernancePath,
  inspectInstalledAssets,
  listBundledAgentSupportFiles,
  listBundledAgents,
  listBundledAgentNames,
  listBundledCommands,
  listBundledSkills,
  loadPluginManifest,
  loadSkillsGovernance,
  planBundledAssetSync,
  readBundledCommandTemplate,
  syncAgents,
  syncBundledAssets,
  syncCommands,
  syncSkills,
  validateSkillsGovernance,
};

function copyDirectoryWithTransform(sourceDir, targetDir, transformText, relativeRoot = '') {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (shouldIgnoreBundledSupportPath(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    const relativePath = normalizePathForContent(path.join(relativeRoot, entry.name));

    if (entry.isDirectory()) {
      copyDirectoryWithTransform(sourcePath, targetPath, transformText, relativePath);
      continue;
    }

    if (entry.isFile()) {
      copyFileWithTransform(sourcePath, targetPath, transformText, { relativePath });
    }
  }
}

function copyFileWithTransform(sourcePath, targetPath, transformText, fileContext = {}) {
  const stat = fs.statSync(sourcePath);
  if (isTextFile(sourcePath)) {
    const original = fs.readFileSync(sourcePath, 'utf8');
    const transformed = transformText(original, { sourcePath, targetPath, ...fileContext });
    fs.writeFileSync(targetPath, transformed, 'utf8');
    fs.chmodSync(targetPath, stat.mode);
    return;
  }

  fs.copyFileSync(sourcePath, targetPath);
  fs.chmodSync(targetPath, stat.mode);
}

function isTextFile(filePath) {
  return TEXT_FILE_EXTENSIONS.has(path.extname(filePath));
}

function shouldIgnoreBundledSupportPath(relativePath) {
  const normalizedPath = normalizePathForContent(relativePath);
  const parts = normalizedPath.split('/');
  const basename = parts[parts.length - 1] || '';
  return (
    parts.includes('__pycache__')
    || basename === '.DS_Store'
    || basename.endsWith('.pyc')
    || basename.endsWith('.pyo')
  );
}

function transformSkillTextFile(adapter, transformContext, content, fileContext = {}) {
  if (isSkillEvalSupportPath(fileContext.relativePath)) {
    return content;
  }

  return adapter.transformSkillContent(content, transformContext);
}

function isSkillEvalSupportPath(relativePath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    return false;
  }

  const normalizedPath = normalizePathForContent(relativePath);
  return normalizedPath.split('/')[0] === 'evals';
}

function emptyPlan() {
  return buildEmptyOperationPlan();
}

function buildPlanOperation(kind, relativePath, reason, extra = {}) {
  return buildRelativeOperation(kind, relativePath, reason, extra);
}

function toRelativeProjectPath(absolutePath, projectRoot) {
  return normalizeOperationPath(path.relative(projectRoot, absolutePath));
}

function buildFileWriteOperation(projectRoot, absolutePath, contents, reason, mode) {
  return buildSharedFileWriteOperation(projectRoot, absolutePath, contents, reason, mode);
}

function planDirectoryWithTransform({
  projectRoot,
  sourceDir,
  targetDir,
  reason,
  transformText,
  relativeRoot = '',
}) {
  const operations = [
    buildPlanOperation('ensure_dir', toRelativeProjectPath(targetDir, projectRoot), `${reason}_dir`),
  ];

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (shouldIgnoreBundledSupportPath(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const nextTargetPath = path.join(targetDir, entry.name);
    const relativePath = normalizePathForContent(path.join(relativeRoot, entry.name));

    if (entry.isDirectory()) {
      operations.push(...planDirectoryWithTransform({
        projectRoot,
        sourceDir: sourcePath,
        targetDir: nextTargetPath,
        reason,
        transformText,
        relativeRoot: relativePath,
      }));
      continue;
    }

    if (entry.isFile()) {
      operations.push(...planFileCopyWithTransform({
        projectRoot,
        sourcePath,
        targetPath: nextTargetPath,
        reason,
        transformText,
        relativePath,
      }));
    }
  }

  return operations;
}

function planFileCopyWithTransform({
  projectRoot,
  sourcePath,
  targetPath,
  reason,
  transformText,
  relativePath,
}) {
  const operations = [
    buildPlanOperation(
      'ensure_dir',
      toRelativeProjectPath(path.dirname(targetPath), projectRoot),
      `${reason}_parent_dir`,
    ),
  ];
  const stat = fs.statSync(sourcePath);

  if (!isTextFile(sourcePath)) {
    operations.push(buildPlanOperation(
      fs.existsSync(targetPath) ? 'update_file' : 'write_file',
      toRelativeProjectPath(targetPath, projectRoot),
      reason,
      {
        contents: fs.readFileSync(sourcePath),
        encoding: 'buffer',
        mode: stat.mode,
      },
    ));
    return operations;
  }

  const original = fs.readFileSync(sourcePath, 'utf8');
  const transformed = transformText(original, { sourcePath, targetPath, relativePath });
  operations.push(buildFileWriteOperation(projectRoot, targetPath, transformed, reason, stat.mode));
  return operations;
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function normalizePathForContent(filePath) {
  return normalizeOperationPath(filePath);
}

function normalizedWorkflowSkillRuntimePath(adapter, skillName) {
  return normalizePathForContent(path.posix.join(normalizePathForContent(adapter.workflowsRoot), skillName, 'SKILL.md'));
}

function buildSkillTransformContext(projectRoot, skillName, isWorkflowSkill, targetDir) {
  const context = {
    skillName,
    isWorkflowSkill,
  };

  if (!isWorkflowSkill && DELIVERED_INTERNAL_SKILLS.has(skillName)) {
    context.runtimeSkillRoot = normalizePathForContent(toRelativeProjectPath(targetDir, projectRoot));
  }

  return context;
}

function inspectCommandIntegrity(projectRoot, command, adapter) {
  const targetPath = path.join(projectRoot, adapter.commandRoot, command.filename);
  const expectedContent = renderRuntimeCommandContent(command, adapter);
  const actualContent = fs.readFileSync(targetPath, 'utf8');
  const issues = unique([
    ...commandIntegrityIssues(actualContent, command, adapter),
    ...(actualContent === expectedContent ? [] : ['content_mismatch']),
  ]);

  if (issues.length === 0) return null;
  return {
    filename: command.filename,
    commandName: command.name,
    issues,
  };
}

function renderRuntimeCommandContent(command, adapter) {
  const templateContent = readBundledCommandTemplate(command.name);
  const skillContent = readBundledSkillSource(command.skill);
  return adapter.renderCommandContent(command, templateContent, {
    commandName: command.name,
    skillName: command.skill,
    skillContent,
  });
}

function inspectSkillIntegrity({
  projectRoot,
  adapter,
  skillName,
  isWorkflowSkill,
  standaloneRoot,
  workflowRoot,
}) {
  const runtimeRoot = isWorkflowSkill ? workflowRoot : standaloneRoot;
  const targetDir = path.join(runtimeRoot, skillName);
  const targetPath = path.join(targetDir, 'SKILL.md');
  const sourceDir = path.join(getBundledPath('skills'), skillName);
  const sourcePath = path.join(sourceDir, 'SKILL.md');
  const transformContext = buildSkillTransformContext(projectRoot, skillName, isWorkflowSkill, targetDir);
  const expectedContent = adapter.transformSkillContent(
    fs.readFileSync(sourcePath, 'utf8'),
    transformContext,
  );
  const actualContent = fs.readFileSync(targetPath, 'utf8');
  const issues = unique([
    ...skillIntegrityIssues(actualContent, skillName, adapter, { isWorkflowSkill }),
    ...(actualContent === expectedContent ? [] : ['content_mismatch']),
    ...skillSupportFileIntegrityIssues({
      sourceDir,
      targetDir,
      transformText: (content, fileContext) =>
        transformSkillTextFile(adapter, transformContext, content, fileContext),
    }),
  ]);

  if (issues.length === 0) return null;
  return {
    skillName,
    issues,
  };
}

function skillSupportFileIntegrityIssues({ sourceDir, targetDir, transformText }) {
  return listDirectoryFiles(sourceDir)
    .filter((relativePath) => relativePath !== 'SKILL.md')
    .flatMap((relativePath) => {
      const sourcePath = path.join(sourceDir, relativePath);
      const targetPath = path.join(targetDir, relativePath);
      if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
        return [`missing_file:${relativePath}`];
      }

      if (!isTextFile(sourcePath)) {
        const sourceBuffer = fs.readFileSync(sourcePath);
        const targetBuffer = fs.readFileSync(targetPath);
        return Buffer.compare(sourceBuffer, targetBuffer) === 0
          ? []
          : [`content_mismatch:${relativePath}`];
      }

      const expectedContent = transformText(fs.readFileSync(sourcePath, 'utf8'), {
        sourcePath,
        targetPath,
        relativePath,
      });
      const actualContent = fs.readFileSync(targetPath, 'utf8');
      return actualContent === expectedContent
        ? []
        : [`content_mismatch:${relativePath}`];
    });
}

function listDirectoryFiles(rootDir, relativeRoot = '') {
  return fs
    .readdirSync(path.join(rootDir, relativeRoot), { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = path.join(relativeRoot, entry.name);
      if (shouldIgnoreBundledSupportPath(relativePath)) {
        return [];
      }

      if (entry.isDirectory()) {
        return listDirectoryFiles(rootDir, relativePath);
      }

      return entry.isFile() ? [normalizePathForContent(relativePath)] : [];
    })
    .sort((a, b) => a.localeCompare(b));
}

function inspectAgentIntegrity(projectRoot, agentPath, adapter) {
  const targetPath = path.join(projectRoot, adapter.agentsRoot, agentPath);
  const sourcePath = path.join(getBundledPath('agents'), agentPath);
  const expectedContent = adapter.transformAgentContent(fs.readFileSync(sourcePath, 'utf8'));
  const actualContent = fs.readFileSync(targetPath, 'utf8');
  const issues = unique([
    ...transformedContentIntegrityIssues(actualContent, adapter, { kind: 'agent' }),
    ...(actualContent === expectedContent ? [] : ['content_mismatch']),
  ]);

  if (issues.length === 0) return null;
  return {
    agentPath,
    issues,
  };
}

function inspectAgentSupportFileIntegrity(projectRoot, supportPath, adapter) {
  const targetPath = path.join(projectRoot, adapter.agentsRoot, supportPath);
  const sourcePath = path.join(getBundledPath('agents'), supportPath);
  if (!isTextFile(sourcePath)) {
    return null;
  }

  const expectedContent = fs.readFileSync(sourcePath, 'utf8');
  const actualContent = fs.readFileSync(targetPath, 'utf8');
  if (actualContent === expectedContent) {
    return null;
  }

  return {
    supportPath,
    issues: ['content_mismatch'],
  };
}

function commandIntegrityIssues(actualContent, command, adapter) {
  const issues = [];
  const workflowPath = normalizedWorkflowSkillRuntimePath(adapter, command.skill);

  if (actualContent.includes(workflowPath)) {
    issues.push('legacy_workflow_runtime_reference');
  }

  if (adapter.id === 'claude') {
    const missingAnchors = (HIGH_VALUE_COMMAND_ANCHORS[command.skill] || [])
      .filter((anchor) => !actualContent.includes(anchor))
      .map((anchor) => `missing_command_anchor:${anchor}`);
    issues.push(...missingAnchors);
  }

  return issues;
}

function skillIntegrityIssues(actualContent, skillName, adapter, { isWorkflowSkill = false } = {}) {
  const anchorIssues = (HIGH_VALUE_SKILL_ANCHORS[skillName] || [])
    .filter((anchor) => !actualContent.includes(anchor))
    .map((anchor) => `missing_anchor:${anchor}`);

  return unique([
    ...anchorIssues,
    ...transformedContentIntegrityIssues(actualContent, adapter, { kind: 'skill', skillName, isWorkflowSkill }),
  ]);
}

function transformedContentIntegrityIssues(actualContent, adapter, { kind, skillName, isWorkflowSkill = false } = {}) {
  const issues = [];

  if (adapter.id === 'claude' && CANONICAL_AGENT_NAME_PATTERN.test(actualContent)) {
    issues.push('canonical_agent_reference_drift');
  }

  const contentForPathRewriteCheck = codexPathRewriteCheckContent(actualContent, { skillName });
  if (adapter.id === 'codex' && CODEX_UNREWRITTEN_PATH_PATTERNS.some((pattern) => pattern.test(contentForPathRewriteCheck))) {
    issues.push('codex_path_rewrite_drift');
  }

  if (adapter.id === 'codex' && codexBareAgentReferencePattern().test(contentForPathRewriteCheck)) {
    issues.push('codex_agent_rewrite_drift');
  }

  const expectedSkillName = skillName;

  if (adapter.id === 'codex' && kind === 'skill' && expectedSkillName && !actualContent.includes(`name: ${expectedSkillName}`)) {
    issues.push('skill_name_rewrite_drift');
  }

  return issues;
}

function codexPathRewriteCheckContent(content, { skillName } = {}) {
  const masked = maskAllowedCodexOtherHostPaths(content, skillName);

  if (skillName !== 'using-spec-first') return masked;

  return masked.replace(
    'Claude Code installs it as `.claude/skills/using-spec-first/SKILL.md`',
    'Claude Code installs it as `[claude using-spec-first skill path]`',
  );
}

// 检测本应被 Codex adapter 重写成 `.codex/agents/<name>.agent.md` 路径、
// 但在 runtime 内容里仍以裸 `spec-<agent>` 反引号形式残留的已注册 agent 引用。
// 与 codex.js 的重写共享同一份已注册 agent 名事实源,关闭 drift 检测盲区。
let codexBareAgentReferencePatternCache = null;
function codexBareAgentReferencePattern() {
  if (codexBareAgentReferencePatternCache === null) {
    const names = listBundledAgentNames()
      .slice()
      .sort((a, b) => b.length - a.length)
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // 空集合时退化为永不匹配的正则,避免 `\`()\`` 把所有反引号对误判为 drift。
    codexBareAgentReferencePatternCache = names.length === 0
      ? /(?!)/
      : new RegExp(`\`(${names.join('|')})\``);
  }
  return codexBareAgentReferencePatternCache;
}
