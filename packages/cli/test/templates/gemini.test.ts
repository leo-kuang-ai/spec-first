import { describe, expect, it } from "vitest";
import { getAllCommands } from "../../src/templates/gemini/index.js";

// Gemini uses subdirectory namespacing: commands/spec/<name>.toml (no parallel)
const EXPECTED_COMMAND_NAMES = [
  "before-dev",
  "brainstorm",
  "break-loop",
  "check-cross-layer",
  "check",
  "create-command",
  "finish-work",
  "integrate-skill",
  "onboard",
  "record-session",
  "start",
  "update-spec",
];

describe("gemini getAllCommands", () => {
  it("returns the expected command set", () => {
    const commands = getAllCommands();
    const names = commands.map((c) => c.name);
    expect(names).toEqual(EXPECTED_COMMAND_NAMES);
  });

  it("each command has non-empty content", () => {
    const commands = getAllCommands();
    for (const command of commands) {
      expect(command.name.length).toBeGreaterThan(0);
      expect(command.content.length).toBeGreaterThan(0);
    }
  });

  it("command names do not include .toml extension", () => {
    const commands = getAllCommands();
    for (const cmd of commands) {
      expect(cmd.name).not.toContain(".toml");
    }
  });

  it("all commands have valid TOML structure", () => {
    const commands = getAllCommands();
    for (const cmd of commands) {
      expect(
        cmd.content,
        `${cmd.name} should contain description`,
      ).toContain("description = ");
      expect(
        cmd.content,
        `${cmd.name} should contain prompt with triple-quoted string`,
      ).toContain('prompt = """');
    }
  });
});
