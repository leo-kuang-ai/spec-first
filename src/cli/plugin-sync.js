
'use strict';

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
const {
  getBundledPath,
  listBundledAgentNames,
  listBundledAgentSupportFiles,
  listBundledAgents,
  listBundledCommands,
  readBundledCommandTemplate,
  readBundledSkillSource,
} = require('./plugin-manifest');
const {
  buildFilteredAssetSet,
  DELIVERED_INTERNAL_SKILLS,
} = require('./plugin-governance');

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
    'references/plan-sections.md',
    'universal-planning.md',
  ],
  'spec-work': [
    "Derive tasks from the plan's implementation units",
    'Test Discovery',
    'System-Wide Test Check',
    'references/shipping-workflow.md',
    'Residual Work Gate',
    'Phase 3-4: Quality Check and Finishing Work',
  ],
  'spec-code-review': [
    'Plan discovery (requirements verification)',
    'requires_verification',
    'validator-template.md',
    'pipe-delimited finding tables',
    'Actionable Findings',
  ],
};
const HIGH_VALUE_COMMAND_ANCHORS = {
  'spec-plan': [
    'Implementation Units',
    'Concrete requirements traceability',
    'Test scenarios',
    'references/plan-sections.md',
    'universal-planning.md',
  ],
  'spec-work': [
    "Derive tasks from the plan's implementation units",
    'Test Discovery',
    'System-Wide Test Check',
    'references/shipping-workflow.md',
    'Residual Work Gate',
    'Phase 3-4: Quality Check and Finishing Work',
  ],
  'spec-code-review': [
    'Plan discovery (requirements verification)',
    'requires_verification',
    'validator-template.md',
    'pipe-delimited finding tables',
    'Actionable Findings',
  ],
};

function syncBundledAssets(projectRoot, adapter) {
  const filteredAssetSet = buildFilteredAssetSet(adapter);
  const commands = adapter.hasCommands ? syncCommands(projectRoot, adapter, filteredAssetSet.commands) : [];
  const { skills, workflowSkills, internalSkills } = syncSkills(projectRoot, adapter, filteredAssetSet);
  const { agents, agentSupportFiles } = adapter.supportsAgents === false
    ? { agents: [], agentSupportFiles: [] }
    : syncAgents(projectRoot, adapter);

  return { commands, skills, workflowSkills, internalSkills, agents, agentSupportFiles, skipped: filteredAssetSet.skipped };
}

function planBundledAssetSync(projectRoot, adapter, filteredAssetSet = buildFilteredAssetSet(adapter)) {
  const commandPlan = adapter.hasCommands
    ? planCommandsSync(projectRoot, adapter, filteredAssetSet.commands)
    : { plan: emptyPlan(), runtimeCommands: [] };
  const skillsPlan = planSkillsSync(projectRoot, adapter, filteredAssetSet);
  const agentsPlan = adapter.supportsAgents === false
    ? { plan: emptyPlan(), agents: [], agentSupportFiles: [] }
    : planAgentsSync(projectRoot, adapter);

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
  const sourceRoot = getBundledPath('agents');
  const agentPaths = listBundledAgents();
  const agentSupportFiles = listBundledAgentSupportFiles();
  if (agentPaths.length === 0 && agentSupportFiles.length === 0) {
    return { agents: [], agentSupportFiles: [] };
  }

  const targetRoot = path.join(projectRoot, adapter.agentsRoot);
  fs.mkdirSync(targetRoot, { recursive: true });

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
  const sourceRoot = getBundledPath('agents');
  const agentPaths = listBundledAgents();
  const agentSupportFiles = listBundledAgentSupportFiles();
  if (agentPaths.length === 0 && agentSupportFiles.length === 0) {
    return {
      plan: emptyPlan(),
      agents: [],
      agentSupportFiles: [],
    };
  }

  const targetRoot = path.join(projectRoot, adapter.agentsRoot);
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
  const filteredAssetSet = buildFilteredAssetSet(adapter);
  const agents = adapter.supportsAgents === false ? [] : listBundledAgents();
  const agentSupportFiles = adapter.supportsAgents === false ? [] : listBundledAgentSupportFiles();

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

module.exports = {
  inspectInstalledAssets,
  planBundledAssetSync,
  syncAgents,
  syncBundledAssets,
  syncCommands,
  syncSkills,
};
