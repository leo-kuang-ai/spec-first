import { describe, expect, it } from "vitest";
import {
  scriptsInit,
  commonInit,
  commonPaths,
  commonDeveloper,
  commonGitContext,
  commonWorktree,
  commonTaskQueue,
  commonTaskUtils,
  commonPhase,
  commonRegistry,
  commonCliAdapter,
  multiAgentInit,
  multiAgentStart,
  multiAgentCleanup,
  multiAgentStatus,
  multiAgentCreatePr,
  multiAgentPlan,
  getDeveloperScript,
  initDeveloperScript,
  taskScript,
  currentTaskScript,
  getContextScript,
  addSessionScript,
  createBootstrapScript,
  workflowMdTemplate,
  worktreeYamlTemplate,
  gitignoreTemplate,
  getAllScripts,
} from "../../src/templates/spec-first/index.js";

// =============================================================================
// Template Constants — module-level string exports
// =============================================================================

describe("spec template constants", () => {
  const allTemplates = {
    scriptsInit,
    commonInit,
    commonPaths,
    commonDeveloper,
    commonGitContext,
    commonWorktree,
    commonTaskQueue,
    commonTaskUtils,
    commonPhase,
    commonRegistry,
    commonCliAdapter,
    multiAgentInit,
    multiAgentStart,
    multiAgentCleanup,
    multiAgentStatus,
    multiAgentCreatePr,
    multiAgentPlan,
    getDeveloperScript,
    initDeveloperScript,
    taskScript,
    currentTaskScript,
    getContextScript,
    addSessionScript,
    createBootstrapScript,
    workflowMdTemplate,
    worktreeYamlTemplate,
    gitignoreTemplate,
  };

  it("all templates are non-empty strings", () => {
    for (const [name, content] of Object.entries(allTemplates)) {
      expect(content.length, `${name} should be non-empty`).toBeGreaterThan(0);
    }
  });

  it("Python scripts contain valid Python syntax indicators", () => {
    // scriptsInit (__init__.py) only has docstrings, so use scripts with actual code
    const pyScripts = [
      commonInit,
      commonPaths,
      getDeveloperScript,
      taskScript,
    ];
    for (const script of pyScripts) {
      expect(
        script.includes("import") ||
          script.includes("def ") ||
          script.includes("class ") ||
          script.includes("#"),
      ).toBe(true);
    }
  });

  it("scriptsInit is a Python docstring module", () => {
    expect(scriptsInit).toContain('"""');
  });

  it("workflowMdTemplate is markdown", () => {
    expect(workflowMdTemplate).toContain("#");
  });

  it("gitignoreTemplate contains ignore patterns", () => {
    expect(gitignoreTemplate).toContain(".developer");
    expect(gitignoreTemplate).toContain("__pycache__");
  });
});

// =============================================================================
// getAllScripts — pure function assembling pre-loaded strings
// =============================================================================

describe("getAllScripts", () => {
  it("returns a Map", () => {
    const scripts = getAllScripts();
    expect(scripts).toBeInstanceOf(Map);
  });

  it("contains expected script entries", () => {
    const scripts = getAllScripts();
    expect(scripts.has("__init__.py")).toBe(true);
    expect(scripts.has("common/__init__.py")).toBe(true);
    expect(scripts.has("common/paths.py")).toBe(true);
    expect(scripts.has("task.py")).toBe(true);
    expect(scripts.has("current_task.py")).toBe(true);
    expect(scripts.has("get_developer.py")).toBe(true);
    expect(scripts.has("multi_agent/start.py")).toBe(true);
  });

  it("has at least one entry", () => {
    const scripts = getAllScripts();
    expect(scripts.size).toBeGreaterThan(0);
  });

  it("all values are non-empty strings", () => {
    const scripts = getAllScripts();
    for (const [key, value] of scripts) {
      expect(value.length, `${key} should be non-empty`).toBeGreaterThan(0);
    }
  });

  it("values match the exported constants", () => {
    const scripts = getAllScripts();
    expect(scripts.get("__init__.py")).toBe(scriptsInit);
    expect(scripts.get("common/__init__.py")).toBe(commonInit);
    expect(scripts.get("task.py")).toBe(taskScript);
    expect(scripts.get("current_task.py")).toBe(currentTaskScript);
  });
});
