import { describe, expect, it } from "vitest";
import {
  settingsTemplate,
  getAllCommands,
  getAllAgents,
  getAllHooks,
  getAllSkillFiles,
  getAllSkills,
  getSettingsTemplate,
} from "../../src/templates/claude/index.js";

// =============================================================================
// settingsTemplate — module-level constant
// =============================================================================

describe("settingsTemplate", () => {
  it("is valid JSON", () => {
    expect(() => JSON.parse(settingsTemplate)).not.toThrow();
  });

  it("is a non-empty string", () => {
    expect(settingsTemplate.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// settingsTemplate — SessionStart hook matchers (MIN-231)
// =============================================================================

describe("settingsTemplate SessionStart matchers", () => {
  const settings = JSON.parse(settingsTemplate);
  const sessionStartEntries = settings.hooks.SessionStart as {
    matcher: string;
    hooks: { type: string; command: string; timeout: number }[];
  }[];

  it("includes startup, clear, and compact matchers", () => {
    const matchers = sessionStartEntries.map((e) => e.matcher);
    expect(matchers).toContain("startup");
    expect(matchers).toContain("clear");
    expect(matchers).toContain("compact");
  });

  it("all SessionStart entries invoke the same session-start.py hook", () => {
    for (const entry of sessionStartEntries) {
      expect(entry.hooks).toHaveLength(1);
      expect(entry.hooks[0].command).toContain("session-start.py");
    }
  });

  it("all SessionStart entries use {{PYTHON_CMD}} placeholder", () => {
    for (const entry of sessionStartEntries) {
      expect(entry.hooks[0].command).toContain("{{PYTHON_CMD}}");
    }
  });
});

// =============================================================================
// getAllCommands — reads command templates from filesystem
// =============================================================================

const EXPECTED_COMMAND_NAMES = [
  "before-dev",
  "brainstorm",
  "break-loop",
  "check-cross-layer",
  "check",
  "create-command",
  "current-task",
  "finish-work",
  "integrate-skill",
  "onboard",
  "parallel",
  "record-session",
  "start",
  "update-spec",
];

describe("getAllCommands", () => {
  it("returns the expected command set", () => {
    const commands = getAllCommands();
    const names = commands.map((cmd) => cmd.name);
    expect(names).toEqual(EXPECTED_COMMAND_NAMES);
  });

  it("each command has name and content", () => {
    const commands = getAllCommands();
    for (const cmd of commands) {
      expect(cmd.name.length).toBeGreaterThan(0);
      expect(cmd.content.length).toBeGreaterThan(0);
    }
  });

  it("command names do not include .md extension", () => {
    const commands = getAllCommands();
    for (const cmd of commands) {
      expect(cmd.name).not.toContain(".md");
    }
  });
});

// =============================================================================
// getAllAgents — reads agent templates
// =============================================================================

describe("getAllAgents", () => {
  it("each agent has name and content", () => {
    const agents = getAllAgents();
    for (const agent of agents) {
      expect(agent.name.length).toBeGreaterThan(0);
      expect(agent.content.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// getAllSkills — reads Claude skill templates
// =============================================================================

describe("getAllSkills", () => {
  it("includes normalize-requirements-docs with non-empty content", () => {
    const skills = getAllSkills();
    const skill = skills.find((entry) => entry.name === "normalize-requirements-docs");

    expect(skill).toBeDefined();
    expect(skill?.content.length).toBeGreaterThan(0);
    expect(skill?.content).toContain("spec:normalize-requirements-docs");
    expect(skill?.content).toContain("Converted Markdown Content");
    expect(skill?.content).toContain("Image / Diagram Notes");
    expect(skill?.content).toContain("Clarifications");
    expect(skill?.content).toContain("next available version");
    expect(skill?.content).toContain("Source Language Detection Rules");
    expect(skill?.content).not.toContain("Task Breakdown");
    expect(skill?.content).not.toContain("Review Gate Checklist");
  });
});

describe("getAllSkillFiles", () => {
  it("includes the full normalize-requirements-docs asset tree", () => {
    const files = getAllSkillFiles();
    const paths = files.map((entry) => entry.targetPath);

    expect(paths).toContain("skills/normalize-requirements-docs/SKILL.md");
    expect(paths).toContain(
      "skills/normalize-requirements-docs/templates/normalized-source.md",
    );
    expect(paths).toContain(
      "skills/normalize-requirements-docs/templates/examples/hk-us-brokerage-normalized-source.example.md",
    );
  });
});

// =============================================================================
// getAllHooks — reads hook templates
// =============================================================================

describe("getAllHooks", () => {
  it("each hook has targetPath and content", () => {
    const hooks = getAllHooks();
    for (const hook of hooks) {
      expect(hook.targetPath.startsWith("hooks/")).toBe(true);
      expect(hook.content.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// getSettingsTemplate — returns settings as HookTemplate
// =============================================================================

describe("getSettingsTemplate", () => {
  it("returns correct shape with valid JSON", () => {
    const result = getSettingsTemplate();
    expect(result.targetPath).toBe("settings.json");
    expect(result.content.length).toBeGreaterThan(0);
    expect(() => JSON.parse(result.content)).not.toThrow();
  });
});
