'use strict';

/**
 * Canonical Runtime Setup entrypoint identity.
 * Historical product spellings (spec-mcp-setup / mcp-setup) are retired;
 * there is no generated compatibility alias surface.
 */
const CANONICAL_SKILL_NAME = 'spec-runtime-setup';
const CANONICAL_COMMAND_NAME = 'runtime-setup';
const ALL_SKILL_NAMES = Object.freeze([CANONICAL_SKILL_NAME]);
const ALL_COMMAND_NAMES = Object.freeze([CANONICAL_COMMAND_NAME]);

function isRuntimeSetupSkillName(value) {
  return ALL_SKILL_NAMES.includes(String(value || ''));
}

function isRuntimeSetupCommandName(value) {
  return ALL_COMMAND_NAMES.includes(String(value || ''));
}

function isRuntimeSetupSurface(context = {}) {
  return isRuntimeSetupSkillName(context.skillName)
    || isRuntimeSetupSkillName(context.runtimeName)
    || isRuntimeSetupCommandName(context.commandName);
}

function normalizeRuntimeSetupSkillName(value) {
  if (isRuntimeSetupSkillName(value)) return CANONICAL_SKILL_NAME;
  return value;
}

function normalizeRuntimeSetupCommandName(value) {
  if (isRuntimeSetupCommandName(value)) return CANONICAL_COMMAND_NAME;
  return value;
}

function resolveRuntimeSetupSourceSkillName(value) {
  if (isRuntimeSetupSkillName(value)) return CANONICAL_SKILL_NAME;
  return value;
}

module.exports = {
  CANONICAL_SKILL_NAME,
  CANONICAL_COMMAND_NAME,
  ALL_SKILL_NAMES,
  ALL_COMMAND_NAMES,
  isRuntimeSetupSkillName,
  isRuntimeSetupCommandName,
  isRuntimeSetupSurface,
  normalizeRuntimeSetupSkillName,
  normalizeRuntimeSetupCommandName,
  resolveRuntimeSetupSourceSkillName,
};
