import { describe, expect, it } from "vitest";
import { getAllSkills } from "../../src/templates/kiro/index.js";

const EXPECTED_SKILL_NAMES = [
  "before-dev",
  "brainstorm",
  "break-loop",
  "check",
  "check-cross-layer",
  "create-command",
  "finish-work",
  "integrate-skill",
  "onboard",
  "record-session",
  "start",
  "update-spec",
];

describe("kiro getAllSkills", () => {
  it("returns the expected skill set (without parallel)", () => {
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

  it("skill content uses .kiro/skills/ paths instead of .agents/skills/", () => {
    const skills = getAllSkills();
    for (const skill of skills) {
      expect(skill.content).not.toContain(".agents/skills/");
    }
  });
});
