import { describe, expect, it } from "vitest";
import { getAllSkills } from "../../src/templates/qoder/index.js";

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

describe("qoder getAllSkills", () => {
  it("returns the expected skill set", () => {
    const skills = getAllSkills();
    const names = skills.map((s) => s.name);
    expect(names).toEqual(EXPECTED_SKILL_NAMES);
  });

  it("each skill has non-empty content", () => {
    const skills = getAllSkills();
    for (const skill of skills) {
      expect(skill.name.length).toBeGreaterThan(0);
      expect(skill.content.length).toBeGreaterThan(0);
    }
  });
});
