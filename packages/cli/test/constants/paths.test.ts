import { describe, expect, it } from "vitest";
import {
  DIR_NAMES,
  FILE_NAMES,
  PATHS,
  getWorkspaceDir,
  getTaskDir,
  getArchiveDir,
} from "../../src/constants/paths.js";

// =============================================================================
// DIR_NAMES — constant structure
// =============================================================================

describe("DIR_NAMES", () => {
  it("has all expected keys", () => {
    expect(DIR_NAMES).toHaveProperty("WORKFLOW");
    expect(DIR_NAMES).toHaveProperty("WORKSPACE");
    expect(DIR_NAMES).toHaveProperty("TASKS");
    expect(DIR_NAMES).toHaveProperty("ARCHIVE");
    expect(DIR_NAMES).toHaveProperty("SPEC");
    expect(DIR_NAMES).toHaveProperty("SCRIPTS");
  });

  it("WORKFLOW is .spec-first", () => {
    expect(DIR_NAMES.WORKFLOW).toBe(".spec-first");
  });

  it("all values are non-empty strings", () => {
    for (const value of Object.values(DIR_NAMES)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// FILE_NAMES — constant structure
// =============================================================================

describe("FILE_NAMES", () => {
  it("has all expected keys", () => {
    expect(FILE_NAMES).toHaveProperty("DEVELOPER");
    expect(FILE_NAMES).toHaveProperty("CURRENT_TASK");
    expect(FILE_NAMES).toHaveProperty("TASK_JSON");
    expect(FILE_NAMES).toHaveProperty("PRD");
    expect(FILE_NAMES).toHaveProperty("WORKFLOW_GUIDE");
    expect(FILE_NAMES).toHaveProperty("JOURNAL_PREFIX");
  });

  it("all values are non-empty strings", () => {
    for (const value of Object.values(FILE_NAMES)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// PATHS — derived from DIR_NAMES + FILE_NAMES
// =============================================================================

describe("PATHS", () => {
  it("WORKFLOW equals DIR_NAMES.WORKFLOW", () => {
    expect(PATHS.WORKFLOW).toBe(DIR_NAMES.WORKFLOW);
  });

  it("all paths start with DIR_NAMES.WORKFLOW", () => {
    for (const value of Object.values(PATHS)) {
      expect(value.startsWith(DIR_NAMES.WORKFLOW)).toBe(true);
    }
  });

  it("WORKSPACE is WORKFLOW/workspace", () => {
    expect(PATHS.WORKSPACE).toBe(`${DIR_NAMES.WORKFLOW}/${DIR_NAMES.WORKSPACE}`);
  });

  it("TASKS is WORKFLOW/tasks", () => {
    expect(PATHS.TASKS).toBe(`${DIR_NAMES.WORKFLOW}/${DIR_NAMES.TASKS}`);
  });

  it("SPEC is WORKFLOW/spec", () => {
    expect(PATHS.SPEC).toBe(`${DIR_NAMES.WORKFLOW}/${DIR_NAMES.SPEC}`);
  });

  it("SCRIPTS is WORKFLOW/scripts", () => {
    expect(PATHS.SCRIPTS).toBe(`${DIR_NAMES.WORKFLOW}/${DIR_NAMES.SCRIPTS}`);
  });

  it("DEVELOPER_FILE is WORKFLOW/.developer", () => {
    expect(PATHS.DEVELOPER_FILE).toBe(
      `${DIR_NAMES.WORKFLOW}/${FILE_NAMES.DEVELOPER}`,
    );
  });

  it("CURRENT_TASK_FILE is WORKFLOW/.current-task", () => {
    expect(PATHS.CURRENT_TASK_FILE).toBe(
      `${DIR_NAMES.WORKFLOW}/${FILE_NAMES.CURRENT_TASK}`,
    );
  });

  it("WORKFLOW_GUIDE_FILE is WORKFLOW/workflow.md", () => {
    expect(PATHS.WORKFLOW_GUIDE_FILE).toBe(
      `${DIR_NAMES.WORKFLOW}/${FILE_NAMES.WORKFLOW_GUIDE}`,
    );
  });

  it("uses / separator (not backslash)", () => {
    for (const value of Object.values(PATHS)) {
      expect(value).not.toContain("\\");
    }
  });
});

// =============================================================================
// getWorkspaceDir — pure string concatenation
// =============================================================================

describe("getWorkspaceDir", () => {
  it("returns correct path for developer name", () => {
    expect(getWorkspaceDir("john")).toBe(".spec-first/workspace/john");
  });

  it("handles hyphenated names", () => {
    expect(getWorkspaceDir("john-doe")).toBe(".spec-first/workspace/john-doe");
  });

  it("handles empty string", () => {
    expect(getWorkspaceDir("")).toBe(".spec-first/workspace/");
  });
});

// =============================================================================
// getTaskDir — pure string concatenation
// =============================================================================

describe("getTaskDir", () => {
  it("returns correct path for task name", () => {
    expect(getTaskDir("01-21-my-task")).toBe(".spec-first/tasks/01-21-my-task");
  });

  it("handles nested-looking names", () => {
    expect(getTaskDir("sub/task")).toBe(".spec-first/tasks/sub/task");
  });

  it("handles empty string", () => {
    expect(getTaskDir("")).toBe(".spec-first/tasks/");
  });
});

// =============================================================================
// getArchiveDir — pure, no arguments
// =============================================================================

describe("getArchiveDir", () => {
  it("returns correct archive path", () => {
    expect(getArchiveDir()).toBe(".spec-first/tasks/archive");
  });

  it("is under PATHS.TASKS", () => {
    expect(getArchiveDir().startsWith(PATHS.TASKS + "/")).toBe(true);
  });
});
