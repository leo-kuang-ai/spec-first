
'use strict';

const {
  listBundledAgentSupportFiles,
  listBundledAgents,
  listBundledCommands,
  loadSkillsGovernance,
} = require('./plugin-manifest');

function buildFilteredAssetSet(platformOrAdapter) {
  const platform = resolvePlatformId(platformOrAdapter);
  const governance = loadSkillsGovernance();
  const allCommands = listBundledCommands().map((command) => ({ ...command }));
  const commandBySkill = new Map(allCommands.map((command) => [command.skill, { ...command }]));
  const workflowSkills = [];
  const skills = [];
  const internalSkills = [];
  const commands = [];
  const skipped = [];

  for (const record of governance.skills) {
    const delivery = record.host_delivery[platform];
    const reason = `${record.entry_surface} excluded on ${platform} because host_delivery.${platform}=${delivery}`;
    const legacySkillNames = Array.isArray(record.legacy_aliases && record.legacy_aliases.skill_names)
      ? record.legacy_aliases.skill_names
      : [];

    if (record.entry_surface === 'workflow_command') {
      if (delivery === 'command') {
        const command = commandBySkill.get(record.skill_name);
        if (!command) {
          throw new Error(`Missing bundled command definition for governed workflow skill: ${record.skill_name}`);
        }

        // Primary + legacy alias commands all map to the same product surface.
        const relatedCommands = allCommands.filter((entry) => (
          entry.skill === record.skill_name
          || entry.sourceSkill === record.skill_name
          || entry.canonicalSkillName === record.skill_name
        ));
        commands.push(...relatedCommands);

        workflowSkills.push(record.skill_name, ...legacySkillNames);
        continue;
      }

      if (delivery === 'skill') {
        // Skill-delivery hosts project the primary skill and any legacy skill aliases
        // so old discovery names continue to resolve.
        workflowSkills.push(record.skill_name, ...legacySkillNames);
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

  const uniqueCommands = [];
  const seenCommandNames = new Set();
  for (const command of commands.sort((a, b) => a.name.localeCompare(b.name))) {
    if (seenCommandNames.has(command.name)) continue;
    seenCommandNames.add(command.name);
    uniqueCommands.push(command);
  }

  return {
    platform,
    commands: uniqueCommands,
    workflowSkills: [...new Set(workflowSkills)].sort((a, b) => a.localeCompare(b)),
    skills: skills.sort((a, b) => a.localeCompare(b)),
    internalSkills: internalSkills.sort((a, b) => a.localeCompare(b)),
    agents: platformSupportsAgents(platformOrAdapter) ? listBundledAgents() : [],
    agentSupportFiles: platformSupportsAgents(platformOrAdapter) ? listBundledAgentSupportFiles() : [],
    skipped: skipped.sort((a, b) => a.skillName.localeCompare(b.skillName)),
  };
}

function resolvePlatformId(platformOrAdapter) {
  const platform = typeof platformOrAdapter === 'string'
    ? platformOrAdapter
    : platformOrAdapter && typeof platformOrAdapter.id === 'string'
      ? platformOrAdapter.id
      : '';

  if (!getSupportedPlatformIds().includes(platform)) {
    throw new Error(`Unknown platform for filtered asset set: ${platform}`);
  }

  return platform;
}

function platformSupportsAgents(platformOrAdapter) {
  if (platformOrAdapter && typeof platformOrAdapter === 'object') {
    return platformOrAdapter.supportsAgents !== false;
  }
  const { getAdapter } = require('./adapters');
  return getAdapter(resolvePlatformId(platformOrAdapter)).supportsAgents !== false;
}

function getSupportedPlatformIds() {
  const { getSupportedPlatforms } = require('./adapters');
  return getSupportedPlatforms();
}

module.exports = {
  buildFilteredAssetSet,
  platformSupportsAgents,
  resolvePlatformId,
};
