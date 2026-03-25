/**
 * Integration tests for the update() command.
 *
 * Tests the full update flow in real temp directories with minimal mocking.
 * Only external dependencies are mocked: figlet, inquirer, child_process, fetch.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// === External dependency mocks (hoisted by vitest) ===

vi.mock("figlet", () => ({
  default: { textSync: vi.fn(() => "TRELLIS") },
}));

vi.mock("inquirer", () => ({
  default: { prompt: vi.fn().mockResolvedValue({ proceed: true }) },
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn().mockReturnValue(""),
}));

// === Imports ===

import { init } from "../../src/commands/init.js";
import { update } from "../../src/commands/update.js";
import { VERSION } from "../../src/constants/version.js";
import { DIR_NAMES, PATHS } from "../../src/constants/paths.js";
import { computeHash } from "../../src/utils/template-hash.js";

// A managed template file that update always handles (Python script)
const MANAGED_FILE = `${PATHS.SCRIPTS}/get_context.py`;

/** Remove a key from a hash object (avoids eslint no-dynamic-delete) */
function removeHashEntry(obj: Record<string, unknown>, key: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));
}

describe("update() integration", () => {
  let tmpDir: string;

  /** Initialize a fresh project in tmpDir */
  async function setupProject(): Promise<void> {
    await init({ yes: true, force: true });
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-update-int-"));
    vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const noop = () => {};
    vi.spyOn(console, "log").mockImplementation(noop);
    vi.spyOn(console, "error").mockImplementation(noop);
    // Mock fetch for npm registry
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: VERSION }),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("#1 same version update is a true no-op (zero file changes, no backup)", async () => {
    await setupProject();

    // Full snapshot before update
    const snapshotBefore = new Map<string, string>();
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else snapshotBefore.set(path.relative(tmpDir, full), fs.readFileSync(full, "utf-8"));
      }
    };
    walk(tmpDir);

    await update({});

    // Full snapshot after update
    const snapshotAfter = new Map<string, string>();
    const walk2 = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk2(full);
        else snapshotAfter.set(path.relative(tmpDir, full), fs.readFileSync(full, "utf-8"));
      }
    };
    walk2(tmpDir);

    // No files added or removed
    const addedFiles = [...snapshotAfter.keys()].filter((k) => !snapshotBefore.has(k));
    const removedFiles = [...snapshotBefore.keys()].filter((k) => !snapshotAfter.has(k));
    expect(addedFiles).toEqual([]);
    expect(removedFiles).toEqual([]);

    // No file contents changed
    const changedFiles: string[] = [];
    for (const [filePath, content] of snapshotBefore) {
      if (snapshotAfter.get(filePath) !== content) {
        changedFiles.push(filePath);
      }
    }
    expect(changedFiles).toEqual([]);

    // No backup directory created
    const entries = fs.readdirSync(path.join(tmpDir, DIR_NAMES.WORKFLOW));
    expect(entries.filter((e) => e.startsWith(".backup-")).length).toBe(0);
  });

  it("#2 dry run makes no file changes even when changes exist", async () => {
    await setupProject();

    // Delete hash + file to simulate a truly new template file
    const target = path.join(tmpDir, MANAGED_FILE);
    const hashFile = path.join(tmpDir, DIR_NAMES.WORKFLOW, ".template-hashes.json");
    const hashes = removeHashEntry(JSON.parse(fs.readFileSync(hashFile, "utf-8")), MANAGED_FILE);
    fs.writeFileSync(hashFile, JSON.stringify(hashes, null, 2));
    fs.unlinkSync(target);

    await update({ dryRun: true });

    // File should still be missing (dry run didn't recreate it)
    expect(fs.existsSync(target)).toBe(false);
    // No backup directory created
    const entries = fs.readdirSync(path.join(tmpDir, DIR_NAMES.WORKFLOW));
    expect(entries.filter((e) => e.startsWith(".backup-")).length).toBe(0);
  });

  it("#3 user-deleted file (with stored hash) is not re-added on update", async () => {
    await setupProject();

    const target = path.join(tmpDir, MANAGED_FILE);
    expect(fs.existsSync(target)).toBe(true);

    // Delete it (simulating user deletion; hash still exists in .template-hashes.json)
    fs.unlinkSync(target);
    expect(fs.existsSync(target)).toBe(false);

    await update({ force: true });

    // File should NOT be re-created (user deleted it, hash still exists)
    expect(fs.existsSync(target)).toBe(false);
  });

  it("#4 auto-updates file when template changed but user did not modify", async () => {
    await setupProject();

    const targetRelative = MANAGED_FILE;
    const targetFull = path.join(tmpDir, targetRelative);
    const templateContent = fs.readFileSync(targetFull, "utf-8");

    // Simulate "old template version": change file + update hash to match
    const oldContent = "# Old version of script\n";
    fs.writeFileSync(targetFull, oldContent);

    const hashFile = path.join(tmpDir, DIR_NAMES.WORKFLOW, ".template-hashes.json");
    const hashes = JSON.parse(fs.readFileSync(hashFile, "utf-8"));
    hashes[targetRelative] = computeHash(oldContent);
    fs.writeFileSync(hashFile, JSON.stringify(hashes, null, 2));

    await update({ force: true });

    // File should be auto-updated back to current template
    expect(fs.readFileSync(targetFull, "utf-8")).toBe(templateContent);
  });

  it("#5 force overwrites user-modified files", async () => {
    await setupProject();

    const targetFull = path.join(tmpDir, MANAGED_FILE);
    const templateContent = fs.readFileSync(targetFull, "utf-8");

    // User modifies file (hash won't match)
    fs.writeFileSync(targetFull, "user customized content");

    await update({ force: true });

    expect(fs.readFileSync(targetFull, "utf-8")).toBe(templateContent);
  });

  it("#6 skipAll preserves user-modified files", async () => {
    await setupProject();

    const targetFull = path.join(tmpDir, MANAGED_FILE);
    fs.writeFileSync(targetFull, "user customized content");

    await update({ skipAll: true });

    expect(fs.readFileSync(targetFull, "utf-8")).toBe("user customized content");
  });

  it("#7 createNew creates .new copy without overwriting original", async () => {
    await setupProject();

    const targetFull = path.join(tmpDir, MANAGED_FILE);
    const templateContent = fs.readFileSync(targetFull, "utf-8");
    fs.writeFileSync(targetFull, "user customized content");

    await update({ createNew: true });

    // Original preserved
    expect(fs.readFileSync(targetFull, "utf-8")).toBe("user customized content");
    // .new file created with template content
    const newFile = targetFull + ".new";
    expect(fs.existsSync(newFile)).toBe(true);
    expect(fs.readFileSync(newFile, "utf-8")).toBe(templateContent);
  });

  it("#8 updates version file after successful update", async () => {
    await setupProject();

    // Simulate older project version
    const versionPath = path.join(tmpDir, DIR_NAMES.WORKFLOW, ".version");
    fs.writeFileSync(versionPath, "0.0.1");

    await update({ force: true });

    // Version is updated even when no file changes are needed
    expect(fs.readFileSync(versionPath, "utf-8")).toBe(VERSION);
  });

  it("#9 creates backup directory before applying changes", async () => {
    await setupProject();

    // Simulate "old template version": change file + update hash to match
    // This triggers auto-update (template changed, user didn't modify)
    const targetFull = path.join(tmpDir, MANAGED_FILE);
    const oldContent = "# Old version of script\n";
    fs.writeFileSync(targetFull, oldContent);
    const hashFile = path.join(tmpDir, DIR_NAMES.WORKFLOW, ".template-hashes.json");
    const hashes = JSON.parse(fs.readFileSync(hashFile, "utf-8"));
    hashes[MANAGED_FILE] = computeHash(oldContent);
    fs.writeFileSync(hashFile, JSON.stringify(hashes, null, 2));

    await update({ force: true });

    const entries = fs.readdirSync(path.join(tmpDir, DIR_NAMES.WORKFLOW));
    const backupDirs = entries.filter((e) => e.startsWith(".backup-"));
    expect(backupDirs.length).toBeGreaterThanOrEqual(1);
  });

  it("#10 downgrade protection prevents update when CLI is older", async () => {
    await setupProject();

    // Set project version to future
    const versionPath = path.join(tmpDir, DIR_NAMES.WORKFLOW, ".version");
    fs.writeFileSync(versionPath, "99.99.99");

    await update({});

    // Version should NOT be changed
    expect(fs.readFileSync(versionPath, "utf-8")).toBe("99.99.99");
  });

  it("#11 allowDowngrade permits update when CLI is older", async () => {
    await setupProject();

    const versionPath = path.join(tmpDir, DIR_NAMES.WORKFLOW, ".version");
    fs.writeFileSync(versionPath, "99.99.99");

    // Remove hash entry + file to simulate a truly new template file
    const target = path.join(tmpDir, MANAGED_FILE);
    const hashFile = path.join(tmpDir, DIR_NAMES.WORKFLOW, ".template-hashes.json");
    const hashes = removeHashEntry(JSON.parse(fs.readFileSync(hashFile, "utf-8")), MANAGED_FILE);
    fs.writeFileSync(hashFile, JSON.stringify(hashes, null, 2));
    fs.unlinkSync(target);

    await update({ allowDowngrade: true, force: true });

    // File recreated (truly new — no stored hash)
    expect(fs.existsSync(target)).toBe(true);
    // Version updated to current
    expect(fs.readFileSync(versionPath, "utf-8")).toBe(VERSION);
  });

  it("#12 prerelease→stable upgrade with no file changes still updates .version", async () => {
    await setupProject();

    // Simulate a project at rc.6 (identical templates, just different version stamp)
    const versionPath = path.join(tmpDir, DIR_NAMES.WORKFLOW, ".version");
    fs.writeFileSync(versionPath, "0.3.0-rc.6");

    await update({});

    // .version must be updated to the current CLI version
    expect(fs.readFileSync(versionPath, "utf-8")).toBe(VERSION);
  });

  it("#13 user-edited spec/guides files are preserved after update with force", async () => {
    await setupProject();

    // User customizes a spec guides file
    const guidesIndex = path.join(tmpDir, PATHS.SPEC, "guides", "index.md");
    expect(fs.existsSync(guidesIndex)).toBe(true);
    const customContent = "# My Custom Guides\n\nEdited by user.\n";
    fs.writeFileSync(guidesIndex, customContent);

    await update({ force: true });

    // User's customized content must be preserved (update should not touch spec/)
    expect(fs.readFileSync(guidesIndex, "utf-8")).toBe(customContent);
  });

  it("#14 deleted spec directory is NOT recreated by update", async () => {
    await setupProject();

    // User deletes the entire spec directory
    const specDir = path.join(tmpDir, PATHS.SPEC);
    fs.rmSync(specDir, { recursive: true, force: true });
    expect(fs.existsSync(specDir)).toBe(false);

    await update({ force: true });

    // spec/ directory should NOT be recreated by update
    expect(fs.existsSync(specDir)).toBe(false);
  });

  it("#15 truly new file (no stored hash) is still added", async () => {
    await setupProject();

    // The hash file should exist
    const hashFile = path.join(tmpDir, DIR_NAMES.WORKFLOW, ".template-hashes.json");
    const hashes = removeHashEntry(JSON.parse(fs.readFileSync(hashFile, "utf-8")), MANAGED_FILE);

    // Remove a hash entry AND the file (simulates a truly new template)
    const targetPath = path.join(tmpDir, MANAGED_FILE);
    fs.writeFileSync(hashFile, JSON.stringify(hashes, null, 2));
    fs.unlinkSync(targetPath);

    // Run update
    await update({ force: true });

    // File SHOULD be created (no hash = truly new)
    expect(fs.existsSync(targetPath)).toBe(true);
  });

  it("#16 config.yaml update.skip prevents file from being updated", async () => {
    await setupProject();

    // Pick a managed template file
    const targetPath = path.join(tmpDir, MANAGED_FILE);

    // Add skip config
    const configPath = path.join(tmpDir, DIR_NAMES.WORKFLOW, "config.yaml");
    const configContent = fs.readFileSync(configPath, "utf-8");
    fs.writeFileSync(configPath, configContent + `\nupdate:\n  skip:\n    - ${MANAGED_FILE}\n`);

    // Modify the file so it would normally trigger a change
    fs.writeFileSync(targetPath, "# modified by user\n");

    // Run update
    await update({ force: true });

    // File should NOT be overwritten (it's in skip list)
    expect(fs.readFileSync(targetPath, "utf-8")).toBe("# modified by user\n");
  });

  it("#17 config.yaml update.skip with directory path skips all files under it", async () => {
    await setupProject();

    // Add skip config for the scripts/common/ directory
    const configPath = path.join(tmpDir, DIR_NAMES.WORKFLOW, "config.yaml");
    const configContent = fs.readFileSync(configPath, "utf-8");
    const skipDir = `${PATHS.SCRIPTS}/common/`;
    fs.writeFileSync(configPath, configContent + `\nupdate:\n  skip:\n    - ${skipDir}\n`);

    // Modify a file under the skipped directory
    const targetPath = path.join(tmpDir, PATHS.SCRIPTS, "common", "paths.py");
    expect(fs.existsSync(targetPath)).toBe(true);
    fs.writeFileSync(targetPath, "# user modified paths.py\n");

    // Run update
    await update({ force: true });

    // File should NOT be overwritten (its directory is in skip list)
    expect(fs.readFileSync(targetPath, "utf-8")).toBe("# user modified paths.py\n");
  });

  it("#18 safe-file-delete preserves user-modified deprecated file", async () => {
    await setupProject();

    // Create a deprecated file that exists in the 0.4.0-beta.1 safe-file-delete manifest
    // but with user-modified content (hash won't match allowed_hashes)
    const deprecatedDir = path.join(tmpDir, ".claude", "commands", "spec");
    fs.mkdirSync(deprecatedDir, { recursive: true });
    const deprecatedFile = path.join(deprecatedDir, "before-backend-dev.md");
    const userContent = "# My customized before-backend-dev command\nUser edited this.\n";
    fs.writeFileSync(deprecatedFile, userContent);

    await update({ force: true });

    // File should be preserved (hash doesn't match allowed_hashes)
    expect(fs.existsSync(deprecatedFile)).toBe(true);
    expect(fs.readFileSync(deprecatedFile, "utf-8")).toBe(userContent);
  });

  it("#19 safe-file-delete handles missing deprecated files without crash", async () => {
    await setupProject();

    // Simulate upgrading from an old version — deprecated files don't exist
    // The manifest has safe-file-delete entries for .claude/commands/spec/before-backend-dev.md etc.
    // but init() doesn't create them (templates removed). update() should not crash.
    const versionPath = path.join(tmpDir, DIR_NAMES.WORKFLOW, ".version");
    fs.writeFileSync(versionPath, "0.3.7");

    // This should complete without errors even though deprecated files don't exist
    await update({ force: true });

    // Version updated successfully
    expect(fs.readFileSync(versionPath, "utf-8")).toBe(VERSION);
  });

  // Original template content for check-backend.md (deleted in 0.4.0-beta.1).
  // Hash: 7a2efa8423e2115d2d60c9f9810c3553be8eb80e229e407739cf1ed25d940230
  const ORIGINAL_CHECK_BACKEND_CONTENT = [
    "Check if the code you just wrote follows the backend development guidelines.",
    "",
    "Execute these steps:",
    "1. Run `git status` to see modified files",
    "2. Read `.spec-first/spec/backend/index.md` to understand which guidelines apply",
    "3. Based on what you changed, read the relevant guideline files:",
    "   - Database changes → `.spec-first/spec/backend/database-guidelines.md`",
    "   - Error handling → `.spec-first/spec/backend/error-handling.md`",
    "   - Logging changes → `.spec-first/spec/backend/logging-guidelines.md`",
    "   - Type changes → `.spec-first/spec/backend/type-safety.md`",
    "   - Any changes → `.spec-first/spec/backend/quality-guidelines.md`",
    "4. Review your code against the guidelines",
    "5. Report any violations and fix them if found",
    "",
  ].join("\n");

  it("#20 safe-file-delete respects update.skip for deprecated files", async () => {
    await setupProject();

    // Sanity: content hash must match the manifest's allowed_hashes
    expect(computeHash(ORIGINAL_CHECK_BACKEND_CONTENT)).toBe(
      "7a2efa8423e2115d2d60c9f9810c3553be8eb80e229e407739cf1ed25d940230",
    );

    // Create a deprecated file with original content (hash matches allowed_hashes)
    // Without update.skip, collectSafeFileDeletes() would delete this file.
    const deprecatedDir = path.join(tmpDir, ".claude", "commands", "spec");
    fs.mkdirSync(deprecatedDir, { recursive: true });
    const deprecatedFile = path.join(deprecatedDir, "check-backend.md");
    fs.writeFileSync(deprecatedFile, ORIGINAL_CHECK_BACKEND_CONTENT);

    // Add the deprecated file's directory to update.skip
    const configPath = path.join(tmpDir, DIR_NAMES.WORKFLOW, "config.yaml");
    const configContent = fs.readFileSync(configPath, "utf-8");
    fs.writeFileSync(
      configPath,
      configContent + `\nupdate:\n  skip:\n    - .claude/commands/spec/\n`,
    );

    await update({ force: true });

    // File should be preserved (directory is in update.skip, overriding safe-file-delete)
    expect(fs.existsSync(deprecatedFile)).toBe(true);
    expect(fs.readFileSync(deprecatedFile, "utf-8")).toBe(ORIGINAL_CHECK_BACKEND_CONTENT);
  });

  it("#21 safe-file-delete deletes file when hash matches allowed_hashes", async () => {
    await setupProject();

    // Sanity: content hash must match the manifest's allowed_hashes
    expect(computeHash(ORIGINAL_CHECK_BACKEND_CONTENT)).toBe(
      "7a2efa8423e2115d2d60c9f9810c3553be8eb80e229e407739cf1ed25d940230",
    );

    // Create deprecated file with original content (hash matches allowed_hashes)
    const deprecatedDir = path.join(tmpDir, ".claude", "commands", "spec");
    fs.mkdirSync(deprecatedDir, { recursive: true });
    const deprecatedFile = path.join(deprecatedDir, "check-backend.md");
    fs.writeFileSync(deprecatedFile, ORIGINAL_CHECK_BACKEND_CONTENT);

    await update({ force: true });

    // File should be DELETED (hash matched allowed_hashes, no update.skip protection)
    expect(fs.existsSync(deprecatedFile)).toBe(false);
  });
});
