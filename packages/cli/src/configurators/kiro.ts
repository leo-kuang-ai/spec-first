import path from "node:path";
import { getAllSkills } from "../templates/kiro/index.js";
import { ensureDir, writeFile } from "../utils/file-writer.js";

/**
 * Configure Kiro Code by writing skill templates.
 *
 * Output:
 * - .kiro/skills/<skill-name>/SKILL.md
 */
export async function configureKiro(cwd: string): Promise<void> {
  const skillsRoot = path.join(cwd, ".kiro", "skills");
  ensureDir(skillsRoot);

  for (const skill of getAllSkills()) {
    const skillDir = path.join(skillsRoot, skill.name);
    ensureDir(skillDir);
    const targetPath = path.join(skillDir, "SKILL.md");
    await writeFile(targetPath, skill.content);
  }
}
