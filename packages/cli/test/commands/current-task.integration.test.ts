import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { init } from "../../src/commands/init.js";
import { DIR_NAMES } from "../../src/constants/paths.js";

describe("current_task.py integration", () => {
  let tmpDir: string;

  async function setupProject(): Promise<void> {
    await init({ yes: true, force: true });
  }

  function writeTask(taskName: string): string {
    const taskDir = path.join(tmpDir, DIR_NAMES.WORKFLOW, DIR_NAMES.TASKS, taskName);
    fs.mkdirSync(taskDir, { recursive: true });
    fs.writeFileSync(
      path.join(taskDir, "task.json"),
      JSON.stringify(
        {
          title: taskName,
          status: "planning",
          assignee: "kuang",
          priority: "P2",
          children: [],
          parent: null,
        },
        null,
        2,
      ),
      "utf-8",
    );
    return taskDir;
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-current-task-"));
    vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("lists tasks and switches by exact task name", async () => {
    await setupProject();
    writeTask("03-26-current-task");

    const listOutput = execFileSync(
      "python3",
      ["./.spec-first/scripts/current_task.py", "list"],
      { cwd: tmpDir, encoding: "utf-8" },
    );
    expect(listOutput).toContain("03-26-current-task");
    expect(listOutput).toContain(".spec-first/tasks/03-26-current-task");

    const switchOutput = execFileSync(
      "python3",
      ["./.spec-first/scripts/current_task.py", "switch", "03-26-current-task"],
      { cwd: tmpDir, encoding: "utf-8" },
    );
    expect(switchOutput).toContain("Current task set to: 03-26-current-task");
    expect(
      fs.readFileSync(path.join(tmpDir, DIR_NAMES.WORKFLOW, ".current-task"), "utf-8").trim(),
    ).toBe(".spec-first/tasks/03-26-current-task");
  });

  it("switches by exact repo-relative path", async () => {
    await setupProject();
    writeTask("03-26-current-task");

    const output = execFileSync(
      "python3",
      ["./.spec-first/scripts/current_task.py", "switch", ".spec-first/tasks/03-26-current-task"],
      { cwd: tmpDir, encoding: "utf-8" },
    );
    expect(output).toContain("Current task set to: 03-26-current-task");
    expect(
      fs.readFileSync(path.join(tmpDir, DIR_NAMES.WORKFLOW, ".current-task"), "utf-8").trim(),
    ).toBe(".spec-first/tasks/03-26-current-task");
  });

  it("switches by absolute path inside the repository", async () => {
    await setupProject();
    const taskDir = writeTask("03-26-current-task");

    const output = execFileSync(
      "python3",
      ["./.spec-first/scripts/current_task.py", "switch", taskDir],
      { cwd: tmpDir, encoding: "utf-8" },
    );
    expect(output).toContain("Current task set to: 03-26-current-task");
    expect(
      fs.readFileSync(path.join(tmpDir, DIR_NAMES.WORKFLOW, ".current-task"), "utf-8").trim(),
    ).toBe(".spec-first/tasks/03-26-current-task");
  });

  it("switch without selection lists tasks and succeeds", async () => {
    await setupProject();
    writeTask("03-26-current-task");

    const output = execFileSync(
      "python3",
      ["./.spec-first/scripts/current_task.py", "switch"],
      { cwd: tmpDir, encoding: "utf-8" },
    );
    expect(output).toContain("Active tasks:");
    expect(output).toContain("03-26-current-task");
  });

  it("rejects suffix-only selections", async () => {
    await setupProject();
    writeTask("03-26-current-task");

    expect(() =>
      execFileSync(
        "python3",
        ["./.spec-first/scripts/current_task.py", "switch", "current-task"],
        { cwd: tmpDir, encoding: "utf-8" },
      ),
    ).toThrow();
  });

  it("task.py start also rejects suffix-only selections", async () => {
    await setupProject();
    writeTask("03-26-current-task");
    const before = fs.readFileSync(
      path.join(tmpDir, DIR_NAMES.WORKFLOW, ".current-task"),
      "utf-8",
    ).trim();

    expect(() =>
      execFileSync(
        "python3",
        ["./.spec-first/scripts/task.py", "start", "current-task"],
        { cwd: tmpDir, encoding: "utf-8" },
      ),
    ).toThrow();
    expect(
      fs.readFileSync(path.join(tmpDir, DIR_NAMES.WORKFLOW, ".current-task"), "utf-8").trim(),
    ).toBe(before);
  });
});
