/**
 * Claude Code templates
 *
 * These are GENERIC templates for user projects.
 * Do NOT use spec-first project's own .claude/ directory (which may be customized).
 *
 * Directory structure:
 *   claude/
 *   ├── commands/       # Slash commands
 *   ├── agents/         # Multi-agent pipeline agents
 *   ├── hooks/          # Context injection hooks
 *   └── settings.json   # Settings configuration
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readTemplate(relativePath: string): string {
  return readFileSync(join(__dirname, relativePath), "utf-8");
}

function listFiles(dir: string): string[] {
  try {
    return readdirSync(join(__dirname, dir), { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function listDirectories(dir: string): string[] {
  try {
    return readdirSync(join(__dirname, dir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function listFilesRecursive(dir: string): string[] {
  const root = join(__dirname, dir);

  try {
    return readdirSync(root, { withFileTypes: true })
      .flatMap((entry) => {
        const relativePath = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          return listFilesRecursive(relativePath);
        }
        return [relativePath];
      })
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

// Settings
export const settingsTemplate = readTemplate("settings.json");

/**
 * Command template with name and content
 */
export interface CommandTemplate {
  name: string;
  content: string;
}

/**
 * Agent template with name and content
 */
export interface AgentTemplate {
  name: string;
  content: string;
}

/**
 * Skill template with name and content
 */
export interface SkillTemplate {
  name: string;
  content: string;
}

/**
 * Skill file template with target path and content
 */
export interface SkillFileTemplate {
  targetPath: string;
  content: string;
}

/**
 * Hook template with target path and content
 */
export interface HookTemplate {
  targetPath: string;
  content: string;
}

/**
 * Get all command templates
 * Commands are stored in commands/spec/ subdirectory
 * This creates commands like /spec:start, /spec:finish-work, etc.
 */
export function getAllCommands(): CommandTemplate[] {
  const commands: CommandTemplate[] = [];
  const files = listFiles("commands/spec");

  for (const file of files) {
    if (file.endsWith(".md")) {
      const name = file.replace(".md", "");
      const content = readTemplate(`commands/spec/${file}`);
      commands.push({ name, content });
    }
  }

  return commands;
}

/**
 * Get all agent templates
 */
export function getAllAgents(): AgentTemplate[] {
  const agents: AgentTemplate[] = [];
  const files = listFiles("agents");

  for (const file of files) {
    if (file.endsWith(".md")) {
      const name = file.replace(".md", "");
      const content = readTemplate(`agents/${file}`);
      agents.push({ name, content });
    }
  }

  return agents;
}

/**
 * Get top-level Claude skills from skills/<name>/SKILL.md
 */
export function getAllSkills(): SkillTemplate[] {
  const skills: SkillTemplate[] = [];

  for (const name of listDirectories("skills")) {
    const content = readTemplate(`skills/${name}/SKILL.md`);
    skills.push({ name, content });
  }

  return skills;
}

/**
 * Get all Claude skill files for recursive template tracking.
 */
export function getAllSkillFiles(): SkillFileTemplate[] {
  const files: SkillFileTemplate[] = [];

  for (const name of listDirectories("skills")) {
    for (const targetPath of listFilesRecursive(`skills/${name}`)) {
      files.push({
        targetPath,
        content: readTemplate(targetPath),
      });
    }
  }

  return files;
}

/**
 * Get all hook templates
 */
export function getAllHooks(): HookTemplate[] {
  const hooks: HookTemplate[] = [];
  const files = listFiles("hooks");

  for (const file of files) {
    const content = readTemplate(`hooks/${file}`);
    hooks.push({ targetPath: `hooks/${file}`, content });
  }

  return hooks;
}

/**
 * Get settings template
 */
export function getSettingsTemplate(): HookTemplate {
  return {
    targetPath: "settings.json",
    content: settingsTemplate,
  };
}
