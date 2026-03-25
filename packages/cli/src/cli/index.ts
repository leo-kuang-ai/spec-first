import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { init } from "../commands/init.js";
import { update } from "../commands/update.js";
import { BRAND } from "../config/brand.js";
import { DIR_NAMES } from "../constants/paths.js";
import { VERSION, PACKAGE_NAME } from "../constants/version.js";
import { compareVersions } from "../utils/compare-versions.js";

// Re-export for backwards compatibility (consumers should prefer constants/version.js)
export { VERSION, PACKAGE_NAME };

/**
 * Initialize global developer identity
 */
function initGlobalDeveloper(name: string, lang: string = "zh"): void {
  const globalDir = path.join(os.homedir(), DIR_NAMES.WORKFLOW);
  const globalDevFile = path.join(globalDir, ".developer");

  // Create global directory if needed
  if (!fs.existsSync(globalDir)) {
    fs.mkdirSync(globalDir, { recursive: true });
  }

  // Check if already exists
  if (fs.existsSync(globalDevFile)) {
    const content = fs.readFileSync(globalDevFile, "utf-8");
    for (const line of content.split("\n")) {
      if (line.startsWith("name=")) {
        const existingName = line.split("=")[1]?.trim();
        console.log(chalk.yellow(`Global developer already set: ${existingName}`));
        console.log(chalk.gray(`  File: ${globalDevFile}`));
        console.log();
        console.log("To change, remove the file first:");
        console.log(chalk.gray(`  rm ${globalDevFile}`));
        return;
      }
    }
  }

  // Write global developer file
  const now = new Date().toISOString();
  const content = `name=${name}\nlang=${lang}\ninitialized_at=${now}\n`;
  fs.writeFileSync(globalDevFile, content, "utf-8");

  console.log();
  console.log(chalk.green(`✓ Global developer initialized`));
  console.log();
  console.log(chalk.white("  Developer:"), chalk.cyan(name));
  console.log(chalk.white("  Language:"), chalk.cyan(lang === "zh" ? "中文" : "English"));
  console.log(chalk.white("  File:"), chalk.gray(globalDevFile));
  console.log();
  console.log(chalk.gray("  ┌─────────────────────────────────────────────────┐"));
  console.log(chalk.gray("  │ File content:                                   │"));
  console.log(chalk.gray("  │") + chalk.white(`  name=${name}`.padEnd(48) + chalk.gray("│")));
  console.log(chalk.gray("  │") + chalk.white(`  lang=${lang}`.padEnd(48) + chalk.gray("│")));
  console.log(chalk.gray("  │") + chalk.white(`  initialized_at=${now.slice(0, 19)}Z`.padEnd(41) + chalk.gray("│")));
  console.log(chalk.gray("  └─────────────────────────────────────────────────┘"));
  console.log();
  console.log(chalk.white("All projects will now use this identity by default."));
  console.log();
  console.log(chalk.gray("Next steps:"));
  console.log(chalk.cyan(`  cd your-project && ${BRAND.cliCommand} init --claude`));
  console.log();
}

/**
 * Check if a CLI update is available (compare project version with CLI version)
 */
function checkForUpdates(cwd: string): void {
  const versionFile = path.join(cwd, DIR_NAMES.WORKFLOW, ".version");

  if (!fs.existsSync(versionFile)) return;

  const projectVersion = fs.readFileSync(versionFile, "utf-8").trim();
  const cliVersion = VERSION;
  const comparison = compareVersions(cliVersion, projectVersion);

  if (comparison > 0) {
    // CLI is newer than project - update available
    console.log(
      chalk.yellow(
        `\n⚠️  ${BRAND.displayName} update available: ${projectVersion} → ${cliVersion}`,
      ),
    );
    console.log(chalk.gray(`   Run: ${BRAND.cliCommand} update\n`));
  } else if (comparison < 0) {
    // CLI is older than project - CLI needs updating
    console.log(
      chalk.yellow(
        `\n⚠️  Your CLI (${cliVersion}) is older than project (${projectVersion})`,
      ),
    );
    console.log(chalk.gray(`   Run: npm install -g ${PACKAGE_NAME}\n`));
  }
}

// Check for updates at CLI startup when the managed workflow root exists
const cwd = process.cwd();
if (fs.existsSync(path.join(cwd, DIR_NAMES.WORKFLOW))) {
  checkForUpdates(cwd);
}

const program = new Command();

program
  .name(BRAND.cliCommand)
  .description(
    "Spec-driven AI development workflow framework for Cursor, Claude Code and more",
  )
  .version(VERSION, "-v, --version", "output the version number");

program
  .command("init")
  .description(`Initialize ${BRAND.displayName} in the current project`)
  .option("--cursor", "Include Cursor commands")
  .option("--claude", "Include Claude Code commands")
  .option("--iflow", "Include iFlow CLI commands")
  .option("--opencode", "Include OpenCode commands")
  .option("--codex", "Include Codex skills")
  .option("--kilo", "Include Kilo CLI commands")
  .option("--kiro", "Include Kiro Code skills")
  .option("--gemini", "Include Gemini CLI commands")
  .option("--antigravity", "Include Antigravity workflows")
  .option("--qoder", "Include Qoder commands")
  .option("--codebuddy", "Include CodeBuddy commands")
  .option("-y, --yes", "Skip prompts and use defaults")
  .option(
    "-u, --user <name>",
    "Initialize developer identity with specified name",
  )
  .option(
    "-g, --global",
    "Initialize global developer identity (~/.spec-first/.developer)",
  )
  .option(
    "-l, --lang <lang>",
    "Language preference (zh or en, default: zh)",
    "zh",
  )
  .option("-f, --force", "Overwrite existing files without asking")
  .option("-s, --skip-existing", "Skip existing files without asking")
  .option("--monorepo", "Force monorepo mode")
  .option("--no-monorepo", "Skip monorepo detection")
  .option(
    "-t, --template <name>",
    "Use a remote spec template (e.g., electron-fullstack)",
  )
  .option(
    "--overwrite",
    "Overwrite existing spec directory when using template",
  )
  .option("--append", "Only add missing files when using template")
  .option(
    "-r, --registry <source>",
    "Use a custom template registry (e.g., gh:myorg/myrepo/specs)",
  )
  .action(async (options: Record<string, unknown>) => {
    try {
      // Handle --global flag for global developer initialization
      if (options.global) {
        if (!options.user) {
          console.log(chalk.red("Error: --global requires -u <name>"));
          console.log();
          console.log("Example:");
          console.log(chalk.gray(`  ${BRAND.cliCommand} init --global -u kuang`));
          process.exit(1);
        }
        const lang = options.lang as string;
        if (lang !== "zh" && lang !== "en") {
          console.log(chalk.red(`Error: --lang must be 'zh' or 'en', got '${lang}'`));
          process.exit(1);
        }
        initGlobalDeveloper(options.user as string, lang);
        return;
      }

      await init(options);
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

program
  .command("update")
  .description(`Update ${BRAND.displayName} configuration and commands to latest version`)
  .option("--dry-run", "Preview changes without applying them")
  .option("-f, --force", "Overwrite all changed files without asking")
  .option("-s, --skip-all", "Skip all changed files without asking")
  .option("-n, --create-new", "Create .new copies for all changed files")
  .option("--allow-downgrade", "Allow downgrading to an older version")
  .option("--migrate", "Apply pending file migrations (renames/deletions)")
  .action(async (options: Record<string, unknown>) => {
    try {
      await update({
        dryRun: options.dryRun as boolean,
        force: options.force as boolean,
        skipAll: options.skipAll as boolean,
        createNew: options.createNew as boolean,
        allowDowngrade: options.allowDowngrade as boolean,
        migrate: options.migrate as boolean,
      });
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

program.parse();
