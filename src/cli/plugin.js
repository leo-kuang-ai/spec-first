const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const MANIFEST_PATH = path.join(REPO_ROOT, '.claude-plugin', 'plugin.json');
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

function loadPluginManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Bundled plugin manifest not found: ${MANIFEST_PATH}`);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  validateManifest(manifest);
  return manifest;
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

function getManifestPath() {
  return MANIFEST_PATH;
}

function getBundledPath(kind) {
  const manifest = loadPluginManifest();
  return path.join(REPO_ROOT, manifest.directories[kind]);
}

function listBundledCommands() {
  const manifest = loadPluginManifest();
  return manifest.commands.map((command) => {
    if (!command || typeof command !== 'object') {
      throw new Error('Bundled plugin manifest contains an invalid command entry.');
    }

    for (const field of ['name', 'filename', 'description', 'argumentHint', 'skill']) {
      if (typeof command[field] !== 'string' || command[field].length === 0) {
        throw new Error(`Bundled plugin manifest command is missing ${field}.`);
      }
    }

    return { ...command };
  });
}

function listBundledSkills() {
  const sourceDir = getBundledPath('skills');
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Bundled skills directory not found: ${sourceDir}`);
  }

  return fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function listBundledAgents() {
  const sourceDir = getBundledPath('agents');
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Bundled agents directory not found: ${sourceDir}`);
  }

  return fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .flatMap((entry) => walkAgentEntries(path.join(sourceDir, entry.name), entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function walkAgentEntries(absolutePath, relativePath) {
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

function readBundledCommandTemplate(commandName) {
  const command = listBundledCommands().find((entry) => entry.name === commandName);
  if (!command) {
    throw new Error(`Unknown bundled command template: ${commandName}`);
  }

  return fs.readFileSync(path.join(getBundledPath('commands'), command.filename), 'utf8');
}

function syncBundledAssets(projectRoot, adapter) {
  const commands = adapter.hasCommands ? syncCommands(projectRoot, adapter) : [];
  const skills = syncSkills(projectRoot, adapter);
  const agents = syncAgents(projectRoot, adapter);

  return { commands, skills, agents };
}

function syncCommands(projectRoot, adapter) {
  const targetRoot = path.join(projectRoot, adapter.commandRoot);
  fs.mkdirSync(targetRoot, { recursive: true });

  const commands = listBundledCommands().map((command) => ({
    ...command,
    filename: adapter.commandFilename(command),
  }));
  for (const command of commands) {
    const content = readBundledCommandTemplate(command.name);
    const transformed = adapter.transformSkillContent(content);
    fs.writeFileSync(
      path.join(targetRoot, command.filename),
      transformed,
      'utf8',
    );
  }

  return commands;
}

function syncSkills(projectRoot, adapter) {
  const targetRoot = path.join(projectRoot, adapter.skillsRoot);
  fs.mkdirSync(targetRoot, { recursive: true });

  const sourceRoot = getBundledPath('skills');
  const skillNames = listBundledSkills();

  for (const skillName of skillNames) {
    const sourceDir = path.join(sourceRoot, skillName);
    const targetDir = path.join(targetRoot, skillName);
    fs.rmSync(targetDir, { recursive: true, force: true });
    copyDirectoryWithTransform(sourceDir, targetDir, (content) =>
      adapter.transformSkillContent(content, { skillName }),
    );
  }

  return skillNames;
}

function syncAgents(projectRoot, adapter) {
  const targetRoot = path.join(projectRoot, adapter.agentsRoot);
  fs.mkdirSync(targetRoot, { recursive: true });

  const sourceRoot = getBundledPath('agents');
  const agentPaths = listBundledAgents();

  for (const agentPath of agentPaths) {
    const sourcePath = path.join(sourceRoot, agentPath);
    const targetPath = path.join(targetRoot, agentPath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileWithTransform(sourcePath, targetPath, (content) =>
      adapter.transformAgentContent(content),
    );
  }

  return agentPaths;
}

function inspectInstalledAssets(projectRoot, adapter) {
  const commands = listBundledCommands();
  const skills = listBundledSkills();
  const agents = listBundledAgents();

  return {
    commands: adapter.hasCommands
      ? inspectCommands(projectRoot, commands, adapter)
      : { targetRoot: path.join(projectRoot, adapter.commandRoot), entries: [], missing: [] },
    skills: inspectSkills(projectRoot, skills, adapter),
    agents: inspectAgents(projectRoot, agents, adapter),
  };
}

function inspectCommands(projectRoot, commands = listBundledCommands(), adapter) {
  const targetRoot = path.join(projectRoot, adapter.commandRoot);
  const runtimeCommands = commands.map((command) => ({
    ...command,
    filename: adapter.commandFilename(command),
  }));
  const missing = runtimeCommands.filter((command) => !fs.existsSync(path.join(targetRoot, command.filename)));
  return { targetRoot, entries: runtimeCommands, missing };
}

function inspectSkills(projectRoot, skillNames = listBundledSkills(), adapter) {
  const targetRoot = path.join(projectRoot, adapter.skillsRoot);
  const missing = skillNames.filter((skillName) => {
    return !fs.existsSync(path.join(targetRoot, skillName, 'SKILL.md'));
  });
  return { targetRoot, entries: skillNames, missing };
}

function inspectAgents(projectRoot, agentPaths = listBundledAgents(), adapter) {
  const targetRoot = path.join(projectRoot, adapter.agentsRoot);
  const missing = agentPaths.filter((agentPath) => !fs.existsSync(path.join(targetRoot, agentPath)));
  return { targetRoot, entries: agentPaths, missing };
}

module.exports = {
  getBundledPath,
  getManifestPath,
  inspectInstalledAssets,
  listBundledAgents,
  listBundledCommands,
  listBundledSkills,
  loadPluginManifest,
  readBundledCommandTemplate,
  syncAgents,
  syncBundledAssets,
  syncCommands,
  syncSkills,
};

function copyDirectoryWithTransform(sourceDir, targetDir, transformText) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryWithTransform(sourcePath, targetPath, transformText);
      continue;
    }

    if (entry.isFile()) {
      copyFileWithTransform(sourcePath, targetPath, transformText);
    }
  }
}

function copyFileWithTransform(sourcePath, targetPath, transformText) {
  const stat = fs.statSync(sourcePath);
  if (isTextFile(sourcePath)) {
    const original = fs.readFileSync(sourcePath, 'utf8');
    const transformed = transformText(original);
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

