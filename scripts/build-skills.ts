/**
 * Skill Build Script
 * Dev-time skills → Deploy-time skills 自动扁平化
 * Dev:    skills/NN-cmd/SKILL.md
 * Deploy: .claude/commands/spec-first/cmd.md
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const SRC_DIR = join(import.meta.dirname, '..', 'skills');
const DEPLOY_DIR = join(import.meta.dirname, '..', '.claude', 'commands', 'spec-first');

function build(): void {
  if (!existsSync(SRC_DIR)) {
    console.error(`Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  mkdirSync(DEPLOY_DIR, { recursive: true });

  const entries = readdirSync(SRC_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('_') && existsSync(join(SRC_DIR, e.name, 'SKILL.md')))
    .sort((a, b) => a.name.localeCompare(b.name));

  let count = 0;

  for (const entry of entries) {
    // 去掉序号前缀: "07-code" → "code"
    const match = entry.name.match(/^\d+-(.+)$/);
    const cmdName = match ? match[1] : entry.name;

    const skillFile = join(SRC_DIR, entry.name, 'SKILL.md');
    if (!existsSync(skillFile)) {
      console.warn(`  SKIP ${entry.name}: no SKILL.md`);
      continue;
    }

    // 复制 SKILL.md → cmd.md
    const content = readFileSync(skillFile, 'utf-8');
    const deployPath = join(DEPLOY_DIR, `${cmdName}.md`);
    writeFileSync(deployPath, content);

    // 复制 references/ 子目录（如果存在）
    const refsDir = join(SRC_DIR, entry.name, 'references');
    if (existsSync(refsDir)) {
      const deployRefsDir = join(DEPLOY_DIR, cmdName, 'references');
      mkdirSync(deployRefsDir, { recursive: true });
      cpSync(refsDir, deployRefsDir, { recursive: true });
    }

    count++;
    console.log(`  OK ${entry.name} → ${cmdName}.md`);
  }

  console.log(`\nBuild complete: ${count} skills deployed to ${DEPLOY_DIR}`);
}

build();
