import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  detectProjectType,
  detectMonorepo,
  sanitizePkgName,
  getProjectTypeDescription,
  type DetectedPackage,
} from "../../src/utils/project-detector.js";

/** Assert result is non-null and return narrowed type for further assertions. */
function assertPackages(result: DetectedPackage[] | null): DetectedPackage[] {
  expect(result).not.toBeNull();
  // After the assertion above, result is guaranteed non-null at runtime.
  // Use type narrowing rather than the `!` operator.
  if (result === null) throw new Error("unreachable");
  return result;
}

// =============================================================================
// getProjectTypeDescription — pure function (EASY)
// =============================================================================

describe("getProjectTypeDescription", () => {
  it("returns correct description for frontend", () => {
    expect(getProjectTypeDescription("frontend")).toBe(
      "Frontend project (UI/client-side)",
    );
  });

  it("returns correct description for backend", () => {
    expect(getProjectTypeDescription("backend")).toBe(
      "Backend project (server-side/API)",
    );
  });

  it("returns correct description for fullstack", () => {
    expect(getProjectTypeDescription("fullstack")).toBe(
      "Fullstack project (frontend + backend)",
    );
  });

  it("returns correct description for unknown", () => {
    expect(getProjectTypeDescription("unknown")).toBe(
      "Unknown project type (defaults to fullstack)",
    );
  });

  it("all descriptions are non-empty strings", () => {
    const types = ["frontend", "backend", "fullstack", "unknown"] as const;
    for (const t of types) {
      const desc = getProjectTypeDescription(t);
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// detectProjectType — needs temp directory (MEDIUM)
// =============================================================================

describe("detectProjectType", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-detect-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns 'unknown' for empty directory", () => {
    expect(detectProjectType(tmpDir)).toBe("unknown");
  });

  // Frontend indicators
  it("detects frontend from vite.config.ts", () => {
    fs.writeFileSync(path.join(tmpDir, "vite.config.ts"), "");
    expect(detectProjectType(tmpDir)).toBe("frontend");
  });

  it("detects frontend from next.config.js", () => {
    fs.writeFileSync(path.join(tmpDir, "next.config.js"), "");
    expect(detectProjectType(tmpDir)).toBe("frontend");
  });

  it("detects frontend from package.json with react dependency", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ dependencies: { react: "^18.0.0" } }),
    );
    expect(detectProjectType(tmpDir)).toBe("frontend");
  });

  it("detects frontend from package.json with vue in devDependencies", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ devDependencies: { vue: "^3.0.0" } }),
    );
    expect(detectProjectType(tmpDir)).toBe("frontend");
  });

  // Backend indicators
  it("detects backend from go.mod", () => {
    fs.writeFileSync(path.join(tmpDir, "go.mod"), "");
    expect(detectProjectType(tmpDir)).toBe("backend");
  });

  it("detects backend from Cargo.toml", () => {
    fs.writeFileSync(path.join(tmpDir, "Cargo.toml"), "");
    expect(detectProjectType(tmpDir)).toBe("backend");
  });

  it("detects backend from requirements.txt", () => {
    fs.writeFileSync(path.join(tmpDir, "requirements.txt"), "");
    expect(detectProjectType(tmpDir)).toBe("backend");
  });

  it("detects backend from pyproject.toml", () => {
    fs.writeFileSync(path.join(tmpDir, "pyproject.toml"), "");
    expect(detectProjectType(tmpDir)).toBe("backend");
  });

  it("detects fullstack from package.json with express dependency", () => {
    // Note: package.json itself is in FRONTEND_INDICATORS (file existence check),
    // so having package.json + express dep results in fullstack, not just backend
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ dependencies: { express: "^4.0.0" } }),
    );
    expect(detectProjectType(tmpDir)).toBe("fullstack");
  });

  // Fullstack detection
  it("detects fullstack when both frontend and backend indicators exist", () => {
    fs.writeFileSync(path.join(tmpDir, "vite.config.ts"), "");
    fs.writeFileSync(path.join(tmpDir, "go.mod"), "");
    expect(detectProjectType(tmpDir)).toBe("fullstack");
  });

  it("detects fullstack from package.json with react + express", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({
        dependencies: { react: "^18.0.0", express: "^4.0.0" },
      }),
    );
    expect(detectProjectType(tmpDir)).toBe("fullstack");
  });

  // Edge cases
  it("detects frontend for package.json with no recognized deps", () => {
    // package.json itself is a FRONTEND_INDICATOR (file existence triggers frontend)
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ dependencies: { lodash: "^4.0.0" } }),
    );
    expect(detectProjectType(tmpDir)).toBe("frontend");
  });

  it("detects frontend for invalid package.json", () => {
    // package.json existence alone triggers frontend indicator
    fs.writeFileSync(path.join(tmpDir, "package.json"), "not json");
    expect(detectProjectType(tmpDir)).toBe("frontend");
  });

  it("detects frontend for package.json with no dependencies field", () => {
    // package.json existence alone triggers frontend indicator
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "my-project" }),
    );
    expect(detectProjectType(tmpDir)).toBe("frontend");
  });
});

// =============================================================================
// detectMonorepo — needs temp directory with workspace configs
// =============================================================================

describe("detectMonorepo", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-monorepo-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  /** Create a subdirectory and optionally write a package.json with a name */
  function mkPkg(relPath: string, name?: string): void {
    const dir = path.join(tmpDir, relPath);
    fs.mkdirSync(dir, { recursive: true });
    if (name) {
      fs.writeFileSync(
        path.join(dir, "package.json"),
        JSON.stringify({ name }),
      );
    }
  }

  it("returns null for empty directory", () => {
    expect(detectMonorepo(tmpDir)).toBeNull();
  });

  it("returns null for a single-repo with package.json but no workspaces", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "my-project" }),
    );
    expect(detectMonorepo(tmpDir)).toBeNull();
  });

  // --- pnpm workspace ---

  it("detects pnpm workspace", () => {
    fs.writeFileSync(
      path.join(tmpDir, "pnpm-workspace.yaml"),
      "packages:\n  - 'packages/*'\n",
    );
    mkPkg("packages/foo", "@scope/foo");
    mkPkg("packages/bar", "@scope/bar");

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name).sort()).toEqual(
      ["@scope/bar", "@scope/foo"],
    );
    expect(result.every((p) => !p.isSubmodule)).toBe(true);
  });

  it("returns empty array when pnpm workspace glob matches nothing", () => {
    fs.writeFileSync(
      path.join(tmpDir, "pnpm-workspace.yaml"),
      "packages:\n  - 'nonexistent/*'\n",
    );
    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(0);
  });

  // --- npm/yarn workspaces ---

  it("detects npm workspaces (array form)", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ workspaces: ["packages/*"] }),
    );
    mkPkg("packages/alpha", "alpha");

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("alpha");
  });

  it("detects yarn v1 workspaces (object form)", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({
        workspaces: { packages: ["packages/*"], nohoist: ["**"] },
      }),
    );
    mkPkg("packages/lib", "lib");

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("lib");
  });

  it("handles ! exclusion patterns in workspaces", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ workspaces: ["packages/*", "!packages/excluded"] }),
    );
    mkPkg("packages/kept", "kept");
    mkPkg("packages/excluded", "excluded");

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("kept");
  });

  // --- Cargo workspace ---

  it("detects Cargo workspace", () => {
    fs.writeFileSync(
      path.join(tmpDir, "Cargo.toml"),
      '[workspace]\nmembers = ["crates/*"]\n',
    );
    const crateDir = path.join(tmpDir, "crates", "my-crate");
    fs.mkdirSync(crateDir, { recursive: true });
    fs.writeFileSync(
      path.join(crateDir, "Cargo.toml"),
      '[package]\nname = "my-crate"\nversion = "0.1.0"\n',
    );

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("my-crate");
  });

  it("respects Cargo workspace exclude", () => {
    fs.writeFileSync(
      path.join(tmpDir, "Cargo.toml"),
      '[workspace]\nmembers = ["crates/*"]\nexclude = ["crates/experimental"]\n',
    );
    mkPkg("crates/stable");
    mkPkg("crates/experimental");

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("crates/stable");
  });

  // --- go.work ---

  it("detects go.work (block form)", () => {
    fs.writeFileSync(
      path.join(tmpDir, "go.work"),
      "go 1.21\n\nuse (\n    ./pkg/svc\n    ./pkg/lib\n)\n",
    );
    const svcDir = path.join(tmpDir, "pkg", "svc");
    fs.mkdirSync(svcDir, { recursive: true });
    fs.writeFileSync(
      path.join(svcDir, "go.mod"),
      "module example.com/pkg/svc\n",
    );
    const libDir = path.join(tmpDir, "pkg", "lib");
    fs.mkdirSync(libDir, { recursive: true });
    fs.writeFileSync(
      path.join(libDir, "go.mod"),
      "module example.com/pkg/lib\n",
    );

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name).sort()).toEqual(["lib", "svc"]);
  });

  // --- uv workspace ---

  it("detects uv workspace", () => {
    fs.writeFileSync(
      path.join(tmpDir, "pyproject.toml"),
      '[tool.uv.workspace]\nmembers = ["packages/*"]\n',
    );
    const pyDir = path.join(tmpDir, "packages", "mylib");
    fs.mkdirSync(pyDir, { recursive: true });
    fs.writeFileSync(
      path.join(pyDir, "pyproject.toml"),
      '[project]\nname = "mylib"\n',
    );

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("mylib");
  });

  // --- .gitmodules ---

  it("detects .gitmodules", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".gitmodules"),
      '[submodule "docs-site"]\n\tpath = docs-site\n\turl = https://example.com/spec-first.git\n',
    );
    mkPkg("docs-site", "docs-site");

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("docs-site");
    expect(result[0].isSubmodule).toBe(true);
  });

  it("keeps uninitialized submodule as unknown type", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".gitmodules"),
      '[submodule "missing"]\n\tpath = missing\n\turl = https://example.com/missing.git\n',
    );
    // Don't create the directory — uninitialized

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("unknown");
    expect(result[0].isSubmodule).toBe(true);
  });

  // --- Path normalization ---

  it("normalizes paths and deduplicates", () => {
    // pnpm workspace with ./packages/* (leading ./)
    fs.writeFileSync(
      path.join(tmpDir, "pnpm-workspace.yaml"),
      "packages:\n  - './packages/*'\n",
    );
    // npm workspaces with packages/* (no leading ./)
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ workspaces: ["packages/*"] }),
    );
    mkPkg("packages/dup", "dup");

    const result = assertPackages(detectMonorepo(tmpDir));
    // Should deduplicate to 1 package, not 2
    expect(result).toHaveLength(1);
  });

  it("excludes root workspace entry (.)", () => {
    fs.writeFileSync(
      path.join(tmpDir, "pnpm-workspace.yaml"),
      "packages:\n  - '.'\n  - 'packages/*'\n",
    );
    mkPkg("packages/a", "a");

    const result = assertPackages(detectMonorepo(tmpDir));
    // Only packages/a, not root
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("packages/a");
  });

  // --- Multi-manager merge ---

  it("merges pnpm workspace + .gitmodules and marks submodule", () => {
    fs.writeFileSync(
      path.join(tmpDir, "pnpm-workspace.yaml"),
      "packages:\n  - 'packages/*'\n  - 'docs-site'\n",
    );
    fs.writeFileSync(
      path.join(tmpDir, ".gitmodules"),
      '[submodule "docs-site"]\n\tpath = docs-site\n\turl = https://example.com\n',
    );
    mkPkg("packages/spec-first", "@spec/spec-first");
    mkPkg("docs-site", "docs-site");

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(2);

    const docsPkg = result.find((p) => p.path === "docs-site");
    expect(docsPkg?.isSubmodule).toBe(true);

    const cliPkg = result.find((p) => p.path === "packages/spec-first");
    expect(cliPkg?.isSubmodule).toBe(false);
  });

  // --- Package name ---

  it("falls back to directory name when no config files have name", () => {
    fs.writeFileSync(
      path.join(tmpDir, "pnpm-workspace.yaml"),
      "packages:\n  - 'packages/*'\n",
    );
    // Create directory without package.json
    fs.mkdirSync(path.join(tmpDir, "packages", "nameless"), {
      recursive: true,
    });

    const result = assertPackages(detectMonorepo(tmpDir));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("nameless");
  });
});

describe("sanitizePkgName", () => {
  it("strips npm scope prefix", () => {
    expect(sanitizePkgName("@zhubao/desktop")).toBe("desktop");
    expect(sanitizePkgName("@app/api")).toBe("api");
    expect(sanitizePkgName("@scope/name")).toBe("name");
  });

  it("keeps unscoped names unchanged", () => {
    expect(sanitizePkgName("cli")).toBe("cli");
    expect(sanitizePkgName("my-package")).toBe("my-package");
  });

  it("only strips the first scope prefix", () => {
    expect(sanitizePkgName("@a/@b/c")).toBe("@b/c");
  });
});
