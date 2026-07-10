
'use strict';

const {
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
  validateSkillsGovernance,
} = require('./plugin-manifest');
const { buildFilteredAssetSet } = require('./plugin-governance');
const {
  inspectInstalledAssets,
  planBundledAssetSync,
  syncAgents,
  syncBundledAssets,
  syncCommands,
  syncSkills,
} = require('./plugin-sync');

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
