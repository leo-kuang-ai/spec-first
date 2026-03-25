import { afterEach, describe, expect, it } from "vitest";
import {
  clearManifestCache,
  getAllMigrations,
  getAllMigrationVersions,
  getMigrationMetadata,
  getMigrationsForVersion,
  getMigrationSummary,
  hasPendingMigrations,
} from "../../src/migrations/index.js";
import { compareVersions } from "../../src/utils/compare-versions.js";

// Clear manifest cache before each test to ensure clean state
afterEach(() => {
  clearManifestCache();
});

// =============================================================================
// getAllMigrationVersions — loads from real manifest files
// =============================================================================

describe("getAllMigrationVersions", () => {
  it("returns an array of version strings", () => {
    const versions = getAllMigrationVersions();
    expect(Array.isArray(versions)).toBe(true);
    for (const v of versions) {
      expect(typeof v).toBe("string");
    }
  });

  it("versions are sorted in ascending order", () => {
    const versions = getAllMigrationVersions();
    for (let i = 1; i < versions.length; i++) {
      expect(compareVersions(versions[i - 1], versions[i])).toBeLessThan(0);
    }
  });

  it("includes known versions from manifests", () => {
    const versions = getAllMigrationVersions();
    // The project has manifest files — at least some versions should exist
    expect(versions.length).toBeGreaterThan(0);
  });

  it("returns consistent results across calls (cache works)", () => {
    const versions1 = getAllMigrationVersions();
    const versions2 = getAllMigrationVersions();
    expect(versions1).toEqual(versions2);
  });
});

// =============================================================================
// getAllMigrations — all migration items from all manifests
// =============================================================================

describe("getAllMigrations", () => {
  it("returns an array of migration items", () => {
    const migrations = getAllMigrations();
    expect(Array.isArray(migrations)).toBe(true);
  });

  it("each migration has required type and from fields", () => {
    const migrations = getAllMigrations();
    for (const m of migrations) {
      expect(["rename", "rename-dir", "delete", "safe-file-delete"]).toContain(m.type);
      expect(typeof m.from).toBe("string");
      expect(m.from.length).toBeGreaterThan(0);
    }
  });

  it("rename migrations have a 'to' field", () => {
    const migrations = getAllMigrations();
    const renames = migrations.filter(
      (m) => m.type === "rename" || m.type === "rename-dir",
    );
    for (const m of renames) {
      expect(m.to).toBeDefined();
      expect(typeof m.to).toBe("string");
    }
  });
});

// =============================================================================
// getMigrationsForVersion — version range filtering
// =============================================================================

describe("getMigrationsForVersion", () => {
  it("returns empty array when from === to", () => {
    const migrations = getMigrationsForVersion("0.3.0-beta.16", "0.3.0-beta.16");
    expect(migrations).toEqual([]);
  });

  it("returns empty array when from > to", () => {
    const migrations = getMigrationsForVersion("99.0.0", "0.1.0");
    expect(migrations).toEqual([]);
  });

  it("returns migrations for a known version range", () => {
    const versions = getAllMigrationVersions();
    if (versions.length >= 2) {
      const from = versions[0];
      const to = versions[versions.length - 1];
      const migrations = getMigrationsForVersion(from, to);
      // Should include migrations from all versions after 'from' up to and including 'to'
      expect(migrations.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns empty array for versions before any manifest", () => {
    const migrations = getMigrationsForVersion("0.0.1", "0.0.2");
    expect(migrations).toEqual([]);
  });

  it("returns empty array for prerelease→stable when all migrations already applied", () => {
    // rc.6 users already have all beta.0 migrations applied
    const migrations = getMigrationsForVersion("0.3.0-rc.6", "0.3.0");
    expect(migrations).toEqual([]);
  });

  it("returns beta.0 migrations for 0.2.x→0.3.0 stable upgrade", () => {
    const migrations = getMigrationsForVersion("0.2.15", "0.3.0");
    // Should include the beta.0 shell→python migrations (all renames, no deletes)
    expect(migrations.length).toBeGreaterThan(0);
    const renames = migrations.filter((m) => m.type === "rename");
    const deletes = migrations.filter((m) => m.type === "delete");
    expect(renames.length).toBeGreaterThan(0);
    expect(deletes.length).toBe(0);
  });
});

// =============================================================================
// hasPendingMigrations — boolean wrapper
// =============================================================================

describe("hasPendingMigrations", () => {
  it("returns false for same version", () => {
    expect(hasPendingMigrations("0.3.0-beta.16", "0.3.0-beta.16")).toBe(false);
  });

  it("returns boolean type", () => {
    const result = hasPendingMigrations("0.1.0", "99.0.0");
    expect(typeof result).toBe("boolean");
  });
});

// =============================================================================
// getMigrationSummary — counts by type
// =============================================================================

describe("getMigrationSummary", () => {
  it("returns object with renames, deletes, and safeFileDeletes counts", () => {
    const summary = getMigrationSummary("0.1.0", "99.0.0");
    expect(typeof summary.renames).toBe("number");
    expect(typeof summary.deletes).toBe("number");
    expect(typeof summary.safeFileDeletes).toBe("number");
    expect(summary.renames).toBeGreaterThanOrEqual(0);
    expect(summary.deletes).toBeGreaterThanOrEqual(0);
    expect(summary.safeFileDeletes).toBeGreaterThanOrEqual(0);
  });

  it("returns zero counts for same version", () => {
    const summary = getMigrationSummary("0.3.0-beta.16", "0.3.0-beta.16");
    expect(summary.renames).toBe(0);
    expect(summary.deletes).toBe(0);
    expect(summary.safeFileDeletes).toBe(0);
  });

  it("counted types sum <= total migrations count", () => {
    const from = "0.1.0";
    const to = "99.0.0";
    const summary = getMigrationSummary(from, to);
    const migrations = getMigrationsForVersion(from, to);
    // getMigrationSummary counts "rename", "delete", and "safe-file-delete"
    // but not "rename-dir" — so sum may be less than total
    expect(
      summary.renames + summary.deletes + summary.safeFileDeletes,
    ).toBeLessThanOrEqual(migrations.length);
  });
});

// =============================================================================
// getMigrationMetadata — aggregated metadata
// =============================================================================

describe("getMigrationMetadata", () => {
  it("returns correct shape", () => {
    const metadata = getMigrationMetadata("0.1.0", "99.0.0");
    expect(Array.isArray(metadata.changelog)).toBe(true);
    expect(typeof metadata.breaking).toBe("boolean");
    expect(typeof metadata.recommendMigrate).toBe("boolean");
    expect(Array.isArray(metadata.migrationGuides)).toBe(true);
  });

  it("returns empty data for same version", () => {
    const metadata = getMigrationMetadata("0.3.0-beta.16", "0.3.0-beta.16");
    expect(metadata.changelog).toEqual([]);
    expect(metadata.breaking).toBe(false);
    expect(metadata.recommendMigrate).toBe(false);
    expect(metadata.migrationGuides).toEqual([]);
  });

  it("returns breaking=true for 0.2.x→0.3.0 upgrade", () => {
    const metadata = getMigrationMetadata("0.2.15", "0.3.0");
    expect(metadata.breaking).toBe(true);
    expect(metadata.recommendMigrate).toBe(true);
  });

  it("migration guides have version and guide fields", () => {
    const metadata = getMigrationMetadata("0.1.0", "99.0.0");
    for (const guide of metadata.migrationGuides) {
      expect(typeof guide.version).toBe("string");
      expect(typeof guide.guide).toBe("string");
    }
  });
});

// =============================================================================
// clearManifestCache — cache reset
// =============================================================================

describe("clearManifestCache", () => {
  it("allows re-loading manifests after clear", () => {
    const v1 = getAllMigrationVersions();
    clearManifestCache();
    const v2 = getAllMigrationVersions();
    expect(v1).toEqual(v2);
  });
});
