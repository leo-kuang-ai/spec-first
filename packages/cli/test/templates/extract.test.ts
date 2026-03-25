import { describe, expect, it } from "vitest";
import fs from "node:fs";
import {
  getSpecFirstTemplatePath,
  getCursorTemplatePath,
  getClaudeTemplatePath,
  getOpenCodeTemplatePath,
  getIflowTemplatePath,
  getCodexTemplatePath,
  getKiloTemplatePath,
  getKiroTemplatePath,
  getGeminiTemplatePath,
  getAntigravityTemplatePath,
  getQoderTemplatePath,
  getCodebuddyTemplatePath,
  readSpecFirstFile,
  readTemplate,
  readScript,
  readMarkdown,
  readCursorFile,
  readClaudeFile,
  readOpenCodeFile,
  readKiloFile,
  readGeminiFile,
} from "../../src/templates/extract.js";

// =============================================================================
// getXxxTemplatePath — returns existing directory paths
// =============================================================================

describe("template path functions", () => {
  it("getSpecFirstTemplatePath returns existing directory", () => {
    const p = getSpecFirstTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getCursorTemplatePath returns existing directory", () => {
    const p = getCursorTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getClaudeTemplatePath returns existing directory", () => {
    const p = getClaudeTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getOpenCodeTemplatePath returns existing directory", () => {
    const p = getOpenCodeTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getIflowTemplatePath returns existing directory", () => {
    const p = getIflowTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getCodexTemplatePath returns existing directory", () => {
    const p = getCodexTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getKiloTemplatePath returns existing directory", () => {
    const p = getKiloTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getKiroTemplatePath returns existing directory", () => {
    const p = getKiroTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getGeminiTemplatePath returns existing directory", () => {
    const p = getGeminiTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getAntigravityTemplatePath returns existing directory", () => {
    const p = getAntigravityTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getQoderTemplatePath returns existing directory", () => {
    const p = getQoderTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getCodebuddyTemplatePath returns existing directory", () => {
    const p = getCodebuddyTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });
});

// =============================================================================
// readSpecFirstFile — reads files from spec template directory
// =============================================================================

describe("readSpecFirstFile", () => {
  it("reads workflow.md from spec templates", () => {
    const content = readSpecFirstFile("workflow.md");
    expect(typeof content).toBe("string");
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("#"); // markdown heading
  });

  it("reads a script file", () => {
    const content = readSpecFirstFile("scripts/task.py");
    expect(typeof content).toBe("string");
    expect(content.length).toBeGreaterThan(0);
  });

  it("throws for nonexistent file", () => {
    expect(() => readSpecFirstFile("nonexistent.txt")).toThrow();
  });
});

// =============================================================================
// readTemplate — reads from category subdirectories
// =============================================================================

describe("readTemplate", () => {
  it("throws for nonexistent category/file", () => {
    expect(() => readTemplate("scripts", "nonexistent.txt")).toThrow();
  });
});

// =============================================================================
// readScript — helper wrapping readSpecFirstFile
// =============================================================================

describe("readScript", () => {
  it("reads a Python script from scripts/", () => {
    const content = readScript("task.py");
    expect(typeof content).toBe("string");
    expect(content.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// readMarkdown — helper wrapping readSpecFirstFile
// =============================================================================

describe("readMarkdown", () => {
  it("reads workflow.md", () => {
    const content = readMarkdown("workflow.md");
    expect(typeof content).toBe("string");
    expect(content).toContain("#");
  });
});

// =============================================================================
// Platform file readers
// =============================================================================

describe("readCursorFile", () => {
  it("reads a file from cursor templates", () => {
    // Cursor templates should have at least a commands directory
    const cursorPath = getCursorTemplatePath();
    const entries = fs.readdirSync(cursorPath);
    if (entries.length > 0) {
      // Find a readable file
      for (const entry of entries) {
        const fullPath = `${cursorPath}/${entry}`;
        if (fs.statSync(fullPath).isFile()) {
          const content = readCursorFile(entry);
          expect(typeof content).toBe("string");
          return;
        }
      }
    }
  });
});

describe("readClaudeFile", () => {
  it("reads settings.json from claude templates", () => {
    const content = readClaudeFile("settings.json");
    expect(typeof content).toBe("string");
    expect(content.length).toBeGreaterThan(0);
    // Should be valid JSON
    expect(() => JSON.parse(content)).not.toThrow();
  });
});

describe("readOpenCodeFile", () => {
  it("can read a file from opencode templates", () => {
    const opencodePath = getOpenCodeTemplatePath();
    const entries = fs.readdirSync(opencodePath);
    if (entries.length > 0) {
      for (const entry of entries) {
        const fullPath = `${opencodePath}/${entry}`;
        if (fs.statSync(fullPath).isFile()) {
          const content = readOpenCodeFile(entry);
          expect(typeof content).toBe("string");
          return;
        }
      }
    }
  });
});

describe("readKiloFile", () => {
  it("can read a file from kilo templates", () => {
    const kiloPath = getKiloTemplatePath();
    const entries = fs.readdirSync(kiloPath);
    if (entries.length > 0) {
      for (const entry of entries) {
        const fullPath = `${kiloPath}/${entry}`;
        if (fs.statSync(fullPath).isFile()) {
          const content = readKiloFile(entry);
          expect(typeof content).toBe("string");
          return;
        }
      }
    }
  });
});

describe("readGeminiFile", () => {
  it("reads a toml file from gemini templates", () => {
    const content = readGeminiFile("commands/spec/start.toml");
    expect(typeof content).toBe("string");
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("description = ");
  });
});
