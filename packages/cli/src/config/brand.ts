/**
 * Central brand and protocol baseline for the spec-first replacement.
 *
 * Stage 1 starts by defining a single source of truth here, then wiring
 * runtime behavior to consume these values in controlled slices.
 */

export const BRAND = {
  displayName: "spec-first",
  packageName: "spec-first",
  cliCommand: "spec-first",
  workflowRoot: ".spec-first",
  slashNamespace: "spec",
} as const;
