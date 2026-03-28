#!/usr/bin/env node

/**
 * Post-install script for spec-first
 * Runs after npm install -g spec-first
 */

import chalk from "chalk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const VERSION = pkg.version;

// Check if global developer exists
const globalDevFile = path.join(os.homedir(), ".spec-first", ".developer");
let developer = null;
let lang = "zh";

if (fs.existsSync(globalDevFile)) {
  try {
    const content = fs.readFileSync(globalDevFile, "utf-8");
    for (const line of content.split("\n")) {
      if (line.startsWith("name=")) developer = line.split("=")[1]?.trim();
      if (line.startsWith("lang=")) lang = line.split("=")[1]?.trim() || "zh";
    }
  } catch {}
}

// Print welcome message
console.log();
console.log(chalk.cyan("╔════════════════════════════════════════════════════════════╗"));
console.log(chalk.cyan("║") + chalk.white.bold("        🚀 spec-first ").padEnd(58) + chalk.cyan("║"));
console.log(chalk.cyan("║") + chalk.gray("   Spec-driven AI development workflow").padEnd(58) + chalk.cyan("║"));
console.log(chalk.cyan("╠════════════════════════════════════════════════════════════╣"));
console.log(chalk.cyan("║") + chalk.green("   ✓ Installed v" + VERSION).padEnd(58) + chalk.cyan("║"));
console.log(chalk.cyan("║").padEnd(59) + chalk.cyan("║"));

if (developer) {
  console.log(chalk.cyan("║") + chalk.white("   👤 Developer: " + developer).padEnd(58) + chalk.cyan("║"));
  console.log(chalk.cyan("║") + chalk.white("   🌐 Language: " + (lang === "zh" ? "中文" : "English")).padEnd(58) + chalk.cyan("║"));
  console.log(chalk.cyan("║").padEnd(59) + chalk.cyan("║"));
  console.log(chalk.cyan("║") + chalk.gray("   Ready to use!").padEnd(58) + chalk.cyan("║"));
} else {
  console.log(chalk.cyan("║") + chalk.yellow("   ⚠️  Global identity not set").padEnd(58) + chalk.cyan("║"));
  console.log(chalk.cyan("║").padEnd(59) + chalk.cyan("║"));
  console.log(chalk.cyan("║") + chalk.white("   📝 Quick setup:").padEnd(58) + chalk.cyan("║"));
  console.log(chalk.cyan("║") + chalk.cyan("      spec-first init --global -u <your-name>").padEnd(58) + chalk.cyan("║"));
}

console.log(chalk.cyan("║").padEnd(59) + chalk.cyan("║"));
console.log(chalk.cyan("║") + chalk.gray("   Docs: https://github.com/sunrain520/spec-first").padEnd(58) + chalk.cyan("║"));
console.log(chalk.cyan("╚════════════════════════════════════════════════════════════╝"));
console.log();
