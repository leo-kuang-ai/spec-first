import path from "node:path";
import {
  getAllAgents,
  getAllCodexSkills,
  getAllHooks,
  getAllSkills,
  getConfigTemplate,
  getHooksConfig,
} from "../templates/codex/index.js";
import { ensureDir, writeFile } from "../utils/file-writer.js";

/**
 * Configure Codex by writing:
 * - .agents/skills/<skill-name>/SKILL.md   (shared, cross-platform)
 * - .codex/skills/<skill-name>/SKILL.md    (Codex-specific)
 * - .codex/agents/<agent-name>.toml
 * - .codex/hooks/session-start.py
 * - .codex/hooks.json
 * - .codex/config.toml
 */
export async function configureCodex(cwd: string): Promise<void> {
  // Shared skills → .agents/skills/
  const sharedSkillsRoot = path.join(cwd, ".agents", "skills");
  ensureDir(sharedSkillsRoot);

  for (const skill of getAllSkills()) {
    const skillDir = path.join(sharedSkillsRoot, skill.name);
    ensureDir(skillDir);
    await writeFile(path.join(skillDir, "SKILL.md"), skill.content);
  }

  const codexRoot = path.join(cwd, ".codex");

  // Codex-specific skills → .codex/skills/
  const codexSkillsRoot = path.join(codexRoot, "skills");
  ensureDir(codexSkillsRoot);

  for (const skill of getAllCodexSkills()) {
    const skillDir = path.join(codexSkillsRoot, skill.name);
    ensureDir(skillDir);
    await writeFile(path.join(skillDir, "SKILL.md"), skill.content);
  }

  // Custom agents → .codex/agents/
  const codexAgentsRoot = path.join(codexRoot, "agents");
  ensureDir(codexAgentsRoot);

  for (const agent of getAllAgents()) {
    await writeFile(
      path.join(codexAgentsRoot, `${agent.name}.toml`),
      agent.content,
    );
  }

  // Hooks → .codex/hooks/
  const hooksDir = path.join(codexRoot, "hooks");
  ensureDir(hooksDir);

  for (const hook of getAllHooks()) {
    await writeFile(path.join(hooksDir, hook.name), hook.content);
  }

  // Hooks config → .codex/hooks.json
  await writeFile(path.join(codexRoot, "hooks.json"), getHooksConfig());

  // Config → .codex/config.toml
  const config = getConfigTemplate();
  await writeFile(path.join(codexRoot, config.targetPath), config.content);
}
