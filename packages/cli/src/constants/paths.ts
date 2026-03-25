/**
 * Path constants for the current workflow structure.
 *
 * The public protocol root is `.spec-first/`. Keep all runtime path values
 * centralized here so the CLI, templates, and generated project files stay in
 * sync.
 *
 * All paths should be relative to the project root.
 */

// Directory names (can be renamed)
export const DIR_NAMES = {
  /** Root workflow directory */
  WORKFLOW: ".spec-first",
  /** Workspace directory (under .spec-first/) - developer work areas */
  WORKSPACE: "workspace",
  /** Tasks directory (under .spec-first/) - unified task storage */
  TASKS: "tasks",
  /** Archive directory (under tasks/) */
  ARCHIVE: "archive",
  /** Spec/guidelines directory (under .spec-first/) */
  SPEC: "spec",
  /** Scripts directory (under .spec-first/) */
  SCRIPTS: "scripts",
} as const;

// File names
export const FILE_NAMES = {
  /** Developer identity file */
  DEVELOPER: ".developer",
  /** Current task pointer */
  CURRENT_TASK: ".current-task",
  /** Task metadata */
  TASK_JSON: "task.json",
  /** Requirements document */
  PRD: "prd.md",
  /** Workflow guide */
  WORKFLOW_GUIDE: "workflow.md",
  /** Journal file prefix */
  JOURNAL_PREFIX: "journal-",
} as const;

// Constructed paths (relative to project root)
export const PATHS = {
  /** .spec-first/ */
  WORKFLOW: DIR_NAMES.WORKFLOW,
  /** .spec-first/workspace/ */
  WORKSPACE: `${DIR_NAMES.WORKFLOW}/${DIR_NAMES.WORKSPACE}`,
  /** .spec-first/tasks/ */
  TASKS: `${DIR_NAMES.WORKFLOW}/${DIR_NAMES.TASKS}`,
  /** .spec-first/spec/ */
  SPEC: `${DIR_NAMES.WORKFLOW}/${DIR_NAMES.SPEC}`,
  /** .spec-first/scripts/ */
  SCRIPTS: `${DIR_NAMES.WORKFLOW}/${DIR_NAMES.SCRIPTS}`,
  /** .spec-first/.developer */
  DEVELOPER_FILE: `${DIR_NAMES.WORKFLOW}/${FILE_NAMES.DEVELOPER}`,
  /** .spec-first/.current-task */
  CURRENT_TASK_FILE: `${DIR_NAMES.WORKFLOW}/${FILE_NAMES.CURRENT_TASK}`,
  /** .spec-first/workflow.md */
  WORKFLOW_GUIDE_FILE: `${DIR_NAMES.WORKFLOW}/${FILE_NAMES.WORKFLOW_GUIDE}`,
} as const;

/**
 * Get developer's workspace directory path
 * @example getWorkspaceDir("john") => ".spec-first/workspace/john"
 */
export function getWorkspaceDir(developer: string): string {
  return `${PATHS.WORKSPACE}/${developer}`;
}

/**
 * Get task directory path
 * @example getTaskDir("01-21-my-task") => ".spec-first/tasks/01-21-my-task"
 */
export function getTaskDir(taskName: string): string {
  return `${PATHS.TASKS}/${taskName}`;
}

/**
 * Get archive directory path
 * @example getArchiveDir() => ".spec-first/tasks/archive"
 */
export function getArchiveDir(): string {
  return `${PATHS.TASKS}/${DIR_NAMES.ARCHIVE}`;
}
