import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  computeHash,
  loadHashes,
  saveHashes,
  updateHashes,
  updateHashFromFile,
  removeHash,
  renameHash,
  isTemplateModified,
  matchesOriginalTemplate,
  getModificationStatus,
  initializeHashes,
} from "../../src/utils/template-hash.js";

// =============================================================================
// computeHash — pure function (EASY)
// =============================================================================

describe("computeHash", () => {
  it("returns a 64-character hex string (SHA256)", () => {
    const hash = computeHash("hello");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns consistent hash for same input", () => {
    const hash1 = computeHash("test content");
    const hash2 = computeHash("test content");
    expect(hash1).toBe(hash2);
  });

  it("returns different hash for different input", () => {
    const hash1 = computeHash("content A");
    const hash2 = computeHash("content B");
    expect(hash1).not.toBe(hash2);
  });

  it("handles empty string", () => {
    const hash = computeHash("");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles unicode content", () => {
    const hash = computeHash("你好世界 🌍");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces known SHA256 for 'hello'", () => {
    // Known SHA256 of "hello"
    expect(computeHash("hello")).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });
});

// =============================================================================
// loadHashes / saveHashes — fs operations (MEDIUM)
// =============================================================================

describe("loadHashes / saveHashes", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-test-"));
    // Create .spec-first directory for hashes file
    fs.mkdirSync(path.join(tmpDir, ".spec-first"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("loadHashes returns empty object when file does not exist", () => {
    const hashes = loadHashes(tmpDir);
    expect(hashes).toEqual({});
  });

  it("saveHashes writes and loadHashes reads back correctly", () => {
    const data = { "file.txt": "abc123", "dir/file.md": "def456" };
    saveHashes(tmpDir, data);

    const loaded = loadHashes(tmpDir);
    expect(loaded).toEqual(data);
  });

  it("loadHashes returns empty object for invalid JSON", () => {
    const hashesPath = path.join(tmpDir, ".spec-first", ".template-hashes.json");
    fs.writeFileSync(hashesPath, "not valid json");

    const hashes = loadHashes(tmpDir);
    expect(hashes).toEqual({});
  });

  it("saveHashes overwrites existing data", () => {
    saveHashes(tmpDir, { old: "hash" });
    saveHashes(tmpDir, { new: "hash2" });

    const loaded = loadHashes(tmpDir);
    expect(loaded).toEqual({ new: "hash2" });
    expect(loaded).not.toHaveProperty("old");
  });
});

// =============================================================================
// updateHashes — incremental update
// =============================================================================

describe("updateHashes", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-test-"));
    fs.mkdirSync(path.join(tmpDir, ".spec-first"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("adds new entries without removing existing ones", () => {
    saveHashes(tmpDir, { existing: "hash1" });

    const files = new Map<string, string>();
    files.set("new-file.txt", "content");
    updateHashes(tmpDir, files);

    const loaded = loadHashes(tmpDir);
    expect(loaded).toHaveProperty("existing", "hash1");
    expect(loaded).toHaveProperty("new-file.txt");
    expect(loaded["new-file.txt"]).toBe(computeHash("content"));
  });

  it("overwrites hash for existing path", () => {
    saveHashes(tmpDir, { "file.txt": "old-hash" });

    const files = new Map<string, string>();
    files.set("file.txt", "new content");
    updateHashes(tmpDir, files);

    const loaded = loadHashes(tmpDir);
    expect(loaded["file.txt"]).toBe(computeHash("new content"));
    expect(loaded["file.txt"]).not.toBe("old-hash");
  });
});

// =============================================================================
// updateHashFromFile — reads file and updates hash
// =============================================================================

describe("updateHashFromFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-test-"));
    fs.mkdirSync(path.join(tmpDir, ".spec-first"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("updates hash from actual file content", () => {
    const content = "file content here";
    fs.writeFileSync(path.join(tmpDir, "test.txt"), content);

    updateHashFromFile(tmpDir, "test.txt");

    const loaded = loadHashes(tmpDir);
    expect(loaded["test.txt"]).toBe(computeHash(content));
  });

  it("does nothing when file does not exist", () => {
    saveHashes(tmpDir, { other: "hash" });
    updateHashFromFile(tmpDir, "nonexistent.txt");

    const loaded = loadHashes(tmpDir);
    expect(loaded).toEqual({ other: "hash" });
    expect(loaded).not.toHaveProperty("nonexistent.txt");
  });
});

// =============================================================================
// removeHash
// =============================================================================

describe("removeHash", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-test-"));
    fs.mkdirSync(path.join(tmpDir, ".spec-first"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("removes specified entry", () => {
    saveHashes(tmpDir, { "a.txt": "hash1", "b.txt": "hash2" });
    removeHash(tmpDir, "a.txt");

    const loaded = loadHashes(tmpDir);
    expect(loaded).not.toHaveProperty("a.txt");
    expect(loaded).toHaveProperty("b.txt", "hash2");
  });

  it("does not crash when removing nonexistent key", () => {
    saveHashes(tmpDir, { "a.txt": "hash1" });
    expect(() => removeHash(tmpDir, "nonexistent")).not.toThrow();

    const loaded = loadHashes(tmpDir);
    expect(loaded).toHaveProperty("a.txt", "hash1");
  });
});

// =============================================================================
// renameHash
// =============================================================================

describe("renameHash", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-test-"));
    fs.mkdirSync(path.join(tmpDir, ".spec-first"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("moves hash from old path to new path", () => {
    saveHashes(tmpDir, { "old.txt": "hash1" });
    renameHash(tmpDir, "old.txt", "new.txt");

    const loaded = loadHashes(tmpDir);
    expect(loaded).not.toHaveProperty("old.txt");
    expect(loaded).toHaveProperty("new.txt", "hash1");
  });

  it("does nothing when old path does not exist in hashes", () => {
    saveHashes(tmpDir, { "other.txt": "hash1" });
    renameHash(tmpDir, "nonexistent.txt", "new.txt");

    const loaded = loadHashes(tmpDir);
    expect(loaded).toEqual({ "other.txt": "hash1" });
    expect(loaded).not.toHaveProperty("new.txt");
  });
});

// =============================================================================
// isTemplateModified
// =============================================================================

describe("isTemplateModified", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-test-"));
    fs.mkdirSync(path.join(tmpDir, ".spec-first"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns false when file does not exist", () => {
    const result = isTemplateModified(tmpDir, "missing.txt", {});
    expect(result).toBe(false);
  });

  it("returns true when no stored hash (conservative)", () => {
    fs.writeFileSync(path.join(tmpDir, "file.txt"), "content");
    const result = isTemplateModified(tmpDir, "file.txt", {});
    expect(result).toBe(true);
  });

  it("returns false when file matches stored hash", () => {
    const content = "original content";
    fs.writeFileSync(path.join(tmpDir, "file.txt"), content);
    const hashes = { "file.txt": computeHash(content) };

    const result = isTemplateModified(tmpDir, "file.txt", hashes);
    expect(result).toBe(false);
  });

  it("returns true when file content differs from stored hash", () => {
    fs.writeFileSync(path.join(tmpDir, "file.txt"), "modified content");
    const hashes = { "file.txt": computeHash("original content") };

    const result = isTemplateModified(tmpDir, "file.txt", hashes);
    expect(result).toBe(true);
  });
});

// =============================================================================
// matchesOriginalTemplate
// =============================================================================

describe("matchesOriginalTemplate", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns false when file does not exist", () => {
    expect(matchesOriginalTemplate(tmpDir, "missing.txt", "content")).toBe(false);
  });

  it("returns true when file matches original content exactly", () => {
    const content = "template content";
    fs.writeFileSync(path.join(tmpDir, "file.txt"), content);
    expect(matchesOriginalTemplate(tmpDir, "file.txt", content)).toBe(true);
  });

  it("returns false when file content differs", () => {
    fs.writeFileSync(path.join(tmpDir, "file.txt"), "modified");
    expect(matchesOriginalTemplate(tmpDir, "file.txt", "original")).toBe(false);
  });
});

// =============================================================================
// getModificationStatus — batch check
// =============================================================================

describe("getModificationStatus", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-test-"));
    fs.mkdirSync(path.join(tmpDir, ".spec-first"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns Map with correct status for each file", () => {
    const content1 = "unmodified";
    const content2 = "modified content";
    fs.writeFileSync(path.join(tmpDir, "a.txt"), content1);
    fs.writeFileSync(path.join(tmpDir, "b.txt"), content2);

    const hashes = {
      "a.txt": computeHash(content1),
      "b.txt": computeHash("original content"),
    };

    const status = getModificationStatus(tmpDir, ["a.txt", "b.txt"], hashes);
    expect(status.get("a.txt")).toBe(false); // unmodified
    expect(status.get("b.txt")).toBe(true); // modified
  });

  it("handles missing files", () => {
    const status = getModificationStatus(tmpDir, ["nonexistent.txt"], {});
    expect(status.get("nonexistent.txt")).toBe(false);
  });
});

// =============================================================================
// initializeHashes — scans directories
// =============================================================================

describe("initializeHashes", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns 0 when no template directories exist", () => {
    // Create .spec-first dir for saving hashes but no template files
    fs.mkdirSync(path.join(tmpDir, ".spec-first"), { recursive: true });
    const count = initializeHashes(tmpDir);
    expect(count).toBe(0);
  });

  it("hashes files in managed directories", () => {
    // Create .spec-first with a script and .claude with a command
    fs.mkdirSync(path.join(tmpDir, ".spec-first", "scripts"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".spec-first", "scripts", "task.py"), "print('hello')");

    fs.mkdirSync(path.join(tmpDir, ".claude", "commands"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".claude", "commands", "start.md"), "# Start");

    const count = initializeHashes(tmpDir);
    expect(count).toBeGreaterThanOrEqual(2);

    const hashes = loadHashes(tmpDir);
    expect(hashes).toHaveProperty(".spec-first/scripts/task.py");
    expect(hashes).toHaveProperty(".claude/commands/start.md");
  });

  it("excludes workspace and tasks directories", () => {
    fs.mkdirSync(path.join(tmpDir, ".spec-first", "workspace"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".spec-first", "workspace", "data.md"), "user data");
    fs.mkdirSync(path.join(tmpDir, ".spec-first", "tasks"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".spec-first", "tasks", "task.json"), "{}");

    const count = initializeHashes(tmpDir);
    const hashes = loadHashes(tmpDir);

    // These should be excluded
    expect(hashes).not.toHaveProperty(".spec-first/workspace/data.md");
    expect(hashes).not.toHaveProperty(".spec-first/tasks/task.json");
    expect(count).toBe(0);
  });

  it("excludes spec/ directory files from hashing", () => {
    fs.mkdirSync(path.join(tmpDir, ".spec-first", "spec", "guides"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, ".spec-first", "spec", "frontend"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, ".spec-first", "spec", "backend"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".spec-first", "spec", "guides", "index.md"), "# Guides");
    fs.writeFileSync(path.join(tmpDir, ".spec-first", "spec", "frontend", "index.md"), "# Frontend");
    fs.writeFileSync(path.join(tmpDir, ".spec-first", "spec", "backend", "index.md"), "# Backend");

    const count = initializeHashes(tmpDir);
    const hashes = loadHashes(tmpDir);

    // All spec/ files should be excluded
    expect(hashes).not.toHaveProperty(".spec-first/spec/guides/index.md");
    expect(hashes).not.toHaveProperty(".spec-first/spec/frontend/index.md");
    expect(hashes).not.toHaveProperty(".spec-first/spec/backend/index.md");
    expect(count).toBe(0);
  });
});
