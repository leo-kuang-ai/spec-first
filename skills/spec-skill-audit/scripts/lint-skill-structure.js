#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { createFinding } = require('./lib/finding');

const REQUIRED_SECTIONS = [
  { normalized: 'purpose', title: 'Purpose', severity: 'P2' },
  { normalized: 'when-to-use', title: 'When To Use', severity: 'P1' },
  { normalized: 'when-not-to-use', title: 'When Not To Use', severity: 'P1' },
  { normalized: 'inputs', title: 'Inputs', severity: 'P2' },
  { normalized: 'outputs', title: 'Outputs', severity: 'P1' },
  { normalized: 'workflow', title: 'Workflow', severity: 'P1' },
  { normalized: 'failure-modes', title: 'Failure Modes', severity: 'P2' },
];

// R-25: internal_only skill 缺 section 的风险低于 public workflow——这些 skill 不是
// 用户入口,缺 When-To-Use/Outputs 等 section 不应与 public workflow 同级淹没 audit 信号。
// 对 internal_only,missing_section severity 整体降一级(P1→P2、P2→P3)。
// 其他 entry_surface(workflow_command/standalone_skill)或未知 entry_surface 保持原 severity(保守)。
const SECTION_SEVERITY_DOWNGRADE = { P1: 'P2', P2: 'P3' };

function downgradeSeverity(severity) {
  return SECTION_SEVERITY_DOWNGRADE[severity] || severity;
}

// 目录名与 frontmatter name 故意不一致的已治理别名。
// spec-dhh-rails-style 目录承载 name: dhh-rails-style:改 name 会破坏既有 runtime 引用契约
// (best-practices-researcher 等按 dhh-rails-style 引用),故保留别名而非强制同名。
const ALLOWED_FRONTMATTER_NAME_ALIASES = new Map([
  ['spec-dhh-rails-style', 'dhh-rails-style'],
]);

function lintSkillStructure(inventory, options = {}) {
  const findings = [];
  // R-25: 解析 entry_surface 映射(skill_name → entry_surface)。
  // 优先用调用方传入的 map;否则从 repo_root 下的 governance registry 派生;
  // 解析失败时为空 map,各 skill 走"未知 entry_surface 不降级"的保守分支。
  const entrySurfaceMap = options.entrySurfaceMap
    || loadEntrySurfaceMap(inventory.repo_root || process.cwd());

  for (const skill of inventory.skills || []) {
    findings.push(...lintSingleSkill(skill, entrySurfaceMap));
  }

  return findings;
}

function loadEntrySurfaceMap(repoRoot) {
  const map = new Map();
  try {
    const governancePath = path.join(
      repoRoot, 'src', 'cli', 'contracts', 'dual-host-governance', 'skills-governance.json',
    );
    const governance = JSON.parse(fs.readFileSync(governancePath, 'utf8'));
    for (const entry of governance.skills || []) {
      if (entry.skill_name && entry.entry_surface) {
        map.set(entry.skill_name, entry.entry_surface);
      }
    }
  } catch (_error) {
    // 保守:无法读取 governance 时返回空 map,不降级任何 skill 的 finding
  }
  return map;
}

function lintSingleSkill(skill, entrySurfaceMap = new Map()) {
  const findings = [];
  const evidenceFile = skill.skill_file || skill.source_path;
  // skill_id 即目录名;governance 用 skill_name(spec-* 前缀)。两者在本 repo 对齐:
  // 目录名 = skill_name。internal_only 才降级,其余(含未知)保持原 severity。
  const entrySurface = entrySurfaceMap.get(skill.skill_id) || null;
  const isInternalOnly = entrySurface === 'internal_only';

  if (!skill.has_skill_md) {
    findings.push(createFinding({
      severity: 'P0',
      category: 'missing_skill_md',
      skill_id: skill.skill_id,
      title: 'Missing SKILL.md',
      evidence: [{ file: evidenceFile }],
      reason: 'A skill directory cannot be discovered or loaded without SKILL.md.',
      recommendation: 'Add SKILL.md or remove the directory from bundled source skills.',
      confidence: 'high',
    }));
    return findings;
  }

  if (!skill.has_frontmatter) {
    findings.push(createFinding({
      severity: 'P1',
      category: 'frontmatter',
      skill_id: skill.skill_id,
      title: 'Missing YAML frontmatter',
      evidence: [{ file: evidenceFile }],
      reason: 'Host skill discovery relies on frontmatter metadata.',
      recommendation: 'Add frontmatter with at least name and description.',
      confidence: 'high',
    }));
  }

  if (!skill.frontmatter || !skill.frontmatter.name) {
    findings.push(createFinding({
      severity: 'P1',
      category: 'frontmatter',
      skill_id: skill.skill_id,
      title: 'Missing frontmatter name',
      evidence: [{ file: evidenceFile }],
      reason: 'Skill identity is missing from frontmatter.',
      recommendation: 'Set frontmatter name to the skill directory name.',
      confidence: 'high',
    }));
  } else if (!isAcceptedFrontmatterName(skill)) {
    findings.push(createFinding({
      severity: 'P1',
      category: 'frontmatter',
      skill_id: skill.skill_id,
      title: 'Frontmatter name does not match directory name',
      evidence: [{ file: evidenceFile, excerpt: `name: ${skill.frontmatter.name}` }],
      reason: 'Name/directory drift weakens runtime governance and source lookup.',
      recommendation: `Use name: ${skill.skill_id} or rename the directory intentionally.`,
      confidence: 'high',
    }));
  }

  if (!skill.frontmatter || !skill.frontmatter.description) {
    findings.push(createFinding({
      severity: 'P1',
      category: 'frontmatter',
      skill_id: skill.skill_id,
      title: 'Missing frontmatter description',
      evidence: [{ file: evidenceFile }],
      reason: 'Skill routing depends heavily on the description field.',
      recommendation: 'Add a concrete description that states when to use the workflow.',
      confidence: 'high',
    }));
  } else if (String(skill.frontmatter.description).length < 40) {
    findings.push(createFinding({
      severity: 'P2',
      category: 'description_quality',
      skill_id: skill.skill_id,
      title: 'Description is very short',
      evidence: [{ file: evidenceFile, excerpt: String(skill.frontmatter.description) }],
      reason: 'Short descriptions often under-specify trigger conditions.',
      recommendation: 'Expand the description with specific trigger language.',
      confidence: 'medium',
    }));
  }

  const sectionNames = new Set((skill.sections || []).map((section) => section.normalized));
  for (const section of REQUIRED_SECTIONS) {
    if (sectionNames.has(section.normalized)) continue;
    const severity = isInternalOnly ? downgradeSeverity(section.severity) : section.severity;
    findings.push(createFinding({
      severity,
      category: 'missing_section',
      skill_id: skill.skill_id,
      title: `Missing ${section.title} section`,
      evidence: [{ file: evidenceFile }],
      reason: `The ${section.title} section is part of the minimum skill audit contract.`,
      recommendation: `Add a concise ${section.title} section or document why the contract is intentionally not applicable.`,
      confidence: 'medium',
    }));
  }

  if (!skill.has_scripts && !skill.has_references && !skill.has_examples) {
    findings.push(createFinding({
      severity: 'P3',
      category: 'progressive_disclosure',
      skill_id: skill.skill_id,
      title: 'No scripts, references, or examples directory',
      evidence: [{ file: skill.source_path }],
      reason: 'Leaf skills can be self-contained, but larger workflows usually benefit from progressive disclosure.',
      recommendation: 'Add references, examples, or scripts when the main file starts carrying detailed implementation logic.',
      confidence: 'low',
    }));
  }

  for (const link of skill.local_links || []) {
    if (link.exists) continue;
    findings.push(createFinding({
      severity: 'P2',
      category: 'broken_local_link',
      skill_id: skill.skill_id,
      title: 'Local markdown link target is missing',
      evidence: [{ file: evidenceFile, excerpt: link.target }],
      reason: 'Broken local references reduce workflow reliability and progressive disclosure.',
      recommendation: `Fix or remove the link to ${link.target}.`,
      confidence: 'high',
    }));
  }

  return findings;
}

function isAcceptedFrontmatterName(skill) {
  const declaredName = skill.frontmatter && skill.frontmatter.name;
  if (declaredName === skill.skill_id) return true;
  return ALLOWED_FRONTMATTER_NAME_ALIASES.get(skill.skill_id) === declaredName;
}

function main(argv = process.argv.slice(2)) {
  const filePath = argv[0];
  if (!filePath) throw new Error('Usage: node lint-skill-structure.js <skill-source-inventory.json>');
  const inventory = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  process.stdout.write(`${JSON.stringify({ findings: lintSkillStructure(inventory) }, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  ALLOWED_FRONTMATTER_NAME_ALIASES,
  isAcceptedFrontmatterName,
  lintSkillStructure,
  lintSingleSkill,
  REQUIRED_SECTIONS,
};
