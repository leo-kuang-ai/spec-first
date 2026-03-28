import { describe, expect, it } from "vitest";
import {
  getAllAgents,
  getAllCodexSkills,
  getAllSkills,
  getConfigTemplate,
} from "../../src/templates/codex/index.js";

const EXPECTED_SKILL_NAMES = [
  "before-dev",
  "brainstorm",
  "break-loop",
  "check",
  "check-cross-layer",
  "create-command",
  "current-task",
  "finish-work",
  "improve-ut",
  "integrate-skill",
  "onboard",
  "record-session",
  "start",
  "update-spec",
];

const EXPECTED_AGENT_NAMES = [
  "check",
  "implement",
  "research",
];

describe("codex getAllSkills", () => {
  it("returns the expected skill set", () => {
    const skills = getAllSkills();
    const names = skills.map((skill) => skill.name);
    expect(names).toEqual(EXPECTED_SKILL_NAMES);
  });

  it("each skill has matching frontmatter name", () => {
    const skills = getAllSkills();
    for (const skill of skills) {
      expect(skill.content.length).toBeGreaterThan(0);
      expect(skill.content).toContain("description:");
      const nameMatch = skill.content.match(/^name:\s*(.+)$/m);
      expect(nameMatch?.[1]?.trim()).toBe(skill.name);
    }
  });

  it("does not include unsupported platform-specific syntax", () => {
    const skills = getAllSkills();
    for (const skill of skills) {
      expect(skill.content).not.toContain("/spec-first:");
      expect(skill.content).not.toContain(".claude/");
      expect(skill.content).not.toContain(".cursor/");
      expect(skill.content).not.toContain("Task(");
      expect(skill.content).not.toContain("subagent_type");
      expect(skill.content).not.toContain('model: "opus"');
    }
  });

  it("formats current-task tables in the skill instead of relying on script table output", () => {
    const currentTaskSkill = getAllSkills().find((skill) => skill.name === "current-task");
    expect(currentTaskSkill?.content).toContain("current_task.py list --json");
    expect(currentTaskSkill?.content).toContain("Parse the JSON output");
    expect(currentTaskSkill?.content).not.toContain("python3 ./.spec-first/scripts/current_task.py list` | Show active tasks |");
  });
});

describe("codex getAllAgents", () => {
  it("returns the expected custom agent set", () => {
    const agents = getAllAgents();
    const names = agents.map((agent) => agent.name);
    expect(names).toEqual(EXPECTED_AGENT_NAMES);
  });

  it("each agent has required fields (name, description, developer_instructions)", () => {
    for (const agent of getAllAgents()) {
      expect(agent.content.length).toBeGreaterThan(0);
      expect(agent.content).toContain("name = ");
      expect(agent.content).toContain("description = ");
      expect(agent.content).toContain("developer_instructions = ");
    }
  });
});

describe("codex getAllCodexSkills (platform-specific)", () => {
  it("returns codex-specific skills", () => {
    const skills = getAllCodexSkills();
    const names = skills.map((skill) => skill.name);
    expect(names).toEqual(["parallel"]);
  });

  it("codex-specific skills contain --platform codex", () => {
    const skills = getAllCodexSkills();
    for (const skill of skills) {
      expect(skill.content).toContain("--platform codex");
    }
  });
});

describe("codex getConfigTemplate", () => {
  it("returns project config.toml content", () => {
    const config = getConfigTemplate();
    expect(config.targetPath).toBe("config.toml");
    expect(config.content).toContain("project_doc_fallback_filenames");
    expect(config.content).toContain("AGENTS.md");
  });
});
