# Security Fixes Implementation Guide

**Date**: 2026-03-02
**Purpose**: Step-by-step guide to implement security fixes from Phase 2 audit

---

## Quick Start - Immediate Fixes (P0)

### Fix 1: Upgrade esbuild (CVE-001)

**File**: `package.json`

**Change**:
```json
{
  "pnpm": {
    "overrides": {
      "rollup": "^4.59.0",
      "minimatch": "^3.1.3",
      "esbuild": "^0.25.0"  // ADD THIS LINE
    }
  }
}
```

**Verify**:
```bash
pnpm install
pnpm audit
# Expected: 0 vulnerabilities
```

---

### Fix 2: Template Validation (VULN-003)

**File**: `src/core/template/renderer.ts`

**Add imports**:
```typescript
import Handlebars from 'handlebars';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { exists, ensureDir, writeMarkdown } from '../../shared/fs-utils.js';
```

**Add validation function**:
```typescript
// Create secure Handlebars instance
const secureHandlebars = Handlebars.create();

// Disable prototype pollution (Handlebars 4.7.5+)
if (typeof secureHandlebars.disablePrototypePollution === 'function') {
  secureHandlebars.disablePrototypePollution();
}

/**
 * Validate template content for security
 * @throws Error if template contains forbidden patterns
 */
function validateTemplateContent(source: string): void {
  const forbiddenPatterns = [
    { pattern: /__proto__/i, message: 'Template contains __proto__ reference' },
    { pattern: /constructor\s*\(/i, message: 'Template contains constructor call' },
    { pattern: /eval\s*\(/i, message: 'Template contains eval call' },
    { pattern: /Function\s*\(/i, message: 'Template contains Function constructor' },
    { pattern: /process\./i, message: 'Template contains process reference' },
    { pattern: /require\s*\(/i, message: 'Template contains require call' },
    { pattern: /import\s+/i, message: 'Template contains import statement' },
  ];

  for (const { pattern, message } of forbiddenPatterns) {
    if (pattern.test(source)) {
      throw new Error(`Security violation: ${message}`);
    }
  }
}
```

**Update renderTemplate function**:
```typescript
export function renderTemplate(
  templateName: string,
  context: TemplateContext,
  outputPath: string,
  projectRoot: string,
): boolean {
  // 文件已存在则跳过
  if (exists(outputPath)) return false;

  const tplPath = findTemplatePath(templateName, projectRoot);
  if (!tplPath) {
    throw new Error(
      `Template not found: ${templateName}.hbs. Check template directories.`,
    );
  }

  const source = readFileSync(tplPath, 'utf-8');

  // ✅ NEW: Validate template content
  validateTemplateContent(source);

  // ✅ NEW: Use secure Handlebars instance with strict mode
  const compiled = secureHandlebars.compile(source, {
    strict: true,           // Throw on undefined variables
    noEscape: false,        // Enable HTML escaping (default)
  });

  const rendered = compiled(context);

  ensureDir(dirname(outputPath));
  writeMarkdown(outputPath, rendered);
  return true;
}
```

**Update renderToString function**:
```typescript
export function renderToString(
  templateName: string,
  context: TemplateContext,
  projectRoot: string,
): string {
  const tplPath = findTemplatePath(templateName, projectRoot);
  if (!tplPath) {
    throw new Error(
      `Template not found: ${templateName}.hbs. Check template directories.`,
    );
  }

  const source = readFileSync(tplPath, 'utf-8');

  // ✅ NEW: Validate template content
  validateTemplateContent(source);

  // ✅ NEW: Use secure Handlebars instance
  const compiled = secureHandlebars.compile(source, {
    strict: true,
    noEscape: false,
  });

  return compiled(context);
}
```

**Test**:
```typescript
// tests/unit/template-security.test.ts
import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/core/template/renderer.js';

describe('Template Security', () => {
  it('should reject template with __proto__', () => {
    // Create malicious template file
    // ... setup code

    expect(() => renderToString('malicious', {}, projectRoot))
      .toThrow('Template contains __proto__ reference');
  });

  it('should reject template with eval', () => {
    // ... test code
  });
});
```

---

### Fix 3: YAML Schema Enforcement (VULN-004)

**File**: `src/core/skill-runtime/first-index.ts`

**Add YAML safety options**:
```typescript
import yaml from 'js-yaml';

// ✅ NEW: Safe YAML options
const SAFE_YAML_OPTIONS: yaml.LoadOptions = {
  schema: yaml.JSON_SCHEMA,  // Only allow JSON-compatible types
  json: true,                // Enable JSON mode
};
```

**Update readIndex function**:
```typescript
export function readIndex(firstDir: string): ProductIndex | null {
  const indexPath = getIndexFilePath(firstDir);

  if (!existsSync(indexPath)) {
    return null;
  }

  try {
    const content = readFileSync(indexPath, 'utf-8');
    // ✅ UPDATED: Use safe YAML options
    const index = yaml.load(content, SAFE_YAML_OPTIONS) as ProductIndex;

    // ✅ NEW: Validate structure
    if (!validateIndexStructure(index)) {
      console.error('Invalid index file structure');
      return null;
    }

    return index;
  } catch {
    return null;
  }
}
```

**Add structure validation**:
```typescript
/**
 * Validate ProductIndex structure
 */
function validateIndexStructure(data: unknown): data is ProductIndex {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (typeof obj.version !== 'string') return false;
  if (typeof obj.last_run !== 'string') return false;
  if (obj.mode !== 'quick' && obj.mode !== 'deep') return false;
  if (typeof obj.products !== 'object' || obj.products === null) return false;

  // Validate products structure
  const products = obj.products as Record<string, unknown>;
  for (const [name, entry] of Object.entries(products)) {
    if (typeof entry !== 'object' || entry === null) return false;

    const productEntry = entry as Record<string, unknown>;
    if (productEntry.mode !== 'quick' && productEntry.mode !== 'deep') return false;
    if (typeof productEntry.last_updated !== 'string') return false;
    if (typeof productEntry.file_hash !== 'string') return false;
  }

  return true;
}
```

**Verify front-matter.ts already uses JSON_SCHEMA**:
```typescript
// src/core/skill-runtime/front-matter.ts:49
// ✅ ALREADY SECURE
const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
```

**Test**:
```typescript
// tests/unit/yaml-security.test.ts
import { describe, it, expect } from 'vitest';
import { readIndex } from '../../src/core/skill-runtime/first-index.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('YAML Security', () => {
  it('should reject YAML with !!js/function', () => {
    const tempDir = join(tmpdir(), 'spec-first-test-' + Date.now());
    mkdirSync(tempDir, { recursive: true });

    const maliciousYaml = `
version: "1.0.0"
last_run: "2026-03-02T00:00:00Z"
mode: quick
products: !!js/function >
  function() { return process.exit(1); }
`;

    const indexPath = join(tempDir, '.index.yaml');
    writeFileSync(indexPath, maliciousYaml);

    const result = readIndex(tempDir);
    expect(result).toBeNull();  // Should reject malicious YAML
  });

  it('should accept valid YAML', () => {
    // ... test code
  });
});
```

---

## Week 2 Fixes (P1)

### Fix 4: Security Event Logging (VULN-007)

**Create new file**: `src/shared/security-logger.ts`

```typescript
/**
 * Security Audit Logger
 * Logs security-relevant events for monitoring and incident response
 */
import { appendJsonl, exists } from './fs-utils.js';
import { readFileSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type SecurityEventType =
  | 'git_operation_failed'
  | 'template_validation_failed'
  | 'yaml_parse_error'
  | 'credential_access'
  | 'path_traversal_blocked'
  | 'permission_denied'
  | 'suspicious_path_access'
  | 'file_integrity_violation';

export type SecuritySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SecurityAuditEntry {
  type: SecurityEventType;
  timestamp: string;
  severity: SecuritySeverity;
  message: string;
  context?: Record<string, unknown>;
  userAgent?: string;
  pid?: number;
  hostname?: string;
}

const SECURITY_LOG_PATH = '.spec-first/security-audit.jsonl';
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Write security event to audit log
 */
export function writeSecurityLog(
  event: Omit<SecurityAuditEntry, 'timestamp' | 'pid' | 'hostname'>
): void {
  const entry: SecurityAuditEntry = {
    ...event,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'localhost',
  };

  // Check log rotation
  if (exists(SECURITY_LOG_PATH)) {
    try {
      const stats = readFileSync(SECURITY_LOG_PATH, 'utf-8');
      if (stats.length > MAX_LOG_SIZE) {
        rotateSecurityLog();
      }
    } catch {
      // Ignore errors
    }
  }

  // Write to log
  try {
    appendJsonl(SECURITY_LOG_PATH, entry);
  } catch (error) {
    // Fallback to console if file write fails
    console.error('Failed to write security log:', error);
    console.error('Security event:', entry);
  }

  // Also log to console for visibility
  logToConsole(entry);
}

/**
 * Log to console with appropriate severity
 */
function logToConsole(entry: SecurityAuditEntry): void {
  const prefix = {
    info: 'ℹ️ ',
    warning: '⚠️ ',
    error: '❌',
    critical: '🚨',
  }[entry.severity];

  const stream = entry.severity === 'info' ? console.log : console.error;
  stream(`${prefix} [${entry.type}] ${entry.message}`);

  if (entry.context && entry.severity !== 'info') {
    stream('  Context:', entry.context);
  }
}

/**
 * Rotate security log
 */
function rotateSecurityLog(): void {
  const now = new Date();
  const suffix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const archivePath = `${SECURITY_LOG_PATH}.${suffix}`;

  let finalPath = archivePath;
  let seq = 1;
  while (exists(finalPath)) {
    finalPath = `${archivePath}.${seq}`;
    seq++;
  }

  try {
    renameSync(SECURITY_LOG_PATH, finalPath);
  } catch (error) {
    console.error('Failed to rotate security log:', error);
  }
}

/**
 * Redact sensitive information from objects
 */
export function redactCredentials(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE_KEYS = [
    'password', 'passwd', 'pwd',
    'secret', 'token', 'api_key', 'apikey', 'api-key',
    'credential', 'auth', 'authorization',
    'database_url', 'db_url', 'database-url', 'db-url',
    'connection_string', 'connectionstring',
    'private_key', 'privatekey', 'private-key',
  ];

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = redactCredentials(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'object' && item !== null
          ? redactCredentials(item as Record<string, unknown>)
          : item
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Sanitize database URL for logging
 */
export function sanitizeDbUrl(url: string): string {
  // postgresql://user:password@host:port/db → postgresql://user:***@host:port/db
  // mysql://user:password@host:port/db → mysql://user:***@host:port/db
  return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
}
```

**Update first-change-detector.ts**:
```typescript
import { writeSecurityLog } from '../../shared/security-logger.js';

function runGit(projectRoot: string, args: string[]): string {
  try {
    return execFileSync('git', args, {
      cwd: projectRoot,
      encoding: 'utf-8',
      timeout: GIT_COMMAND_TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (error) {
    // ✅ NEW: Log security event
    writeSecurityLog({
      type: 'git_operation_failed',
      severity: 'warning',
      message: `Git operation failed: git ${args.join(' ')}`,
      context: {
        projectRoot: projectRoot.slice(0, 100),  // Truncate long paths
        args,
        error: error instanceof Error ? error.message.slice(0, 200) : String(error),
      },
    });
    throw error;
  }
}
```

---

### Fix 5: Credential Redaction in Logs (VULN-008)

**Update logger.ts**:
```typescript
import { redactCredentials } from './security-logger.js';

export function writeLog(path: string, entry: Record<string, unknown>): void {
  // ✅ NEW: Redact sensitive information before logging
  const safeEntry = redactCredentials(entry);

  const record = { ...safeEntry, timestamp: new Date().toISOString() };

  // ... rest of function
}
```

---

### Fix 6: Error Message Sanitization (VULN-006)

**Create new file**: `src/shared/error-utils.ts`

```typescript
/**
 * Error sanitization utilities
 * Remove sensitive information from errors before display
 */

/**
 * Sanitize error message for user display
 */
export function sanitizeErrorMessage(
  error: unknown,
  options: {
    isProduction?: boolean;
    maxMessageLength?: number;
    hidePaths?: boolean;
  } = {}
): string {
  const {
    isProduction = process.env.NODE_ENV === 'production',
    maxMessageLength = 500,
    hidePaths = isProduction,
  } = options;

  let message = error instanceof Error ? error.message : String(error);

  // Truncate long messages
  if (message.length > maxMessageLength) {
    message = message.slice(0, maxMessageLength) + '...';
  }

  // Remove absolute paths in production
  if (hidePaths) {
    message = message
      .replace(/\/[^\s]+?\//g, '[PATH]')  // Unix paths
      .replace(/[A-Z]:\\[^\s]+?\\/g, '[PATH]');  // Windows paths
  }

  // Remove potential secrets
  message = message
    .replace(/[a-zA-Z0-9]{32,}/g, '[REDACTED]')  // Long hex strings (tokens, hashes)
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');  // Email addresses

  return message;
}

/**
 * Create safe error for logging
 */
export function createSafeError(
  error: unknown,
  context?: Record<string, unknown>
): {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
} {
  const safeMessage = sanitizeErrorMessage(error, { isProduction: false });
  const safeStack = error instanceof Error ? error.stack : undefined;

  return {
    message: safeMessage,
    stack: safeStack,
    context,
  };
}
```

**Update router.ts**:
```typescript
import { sanitizeErrorMessage } from '../shared/error-utils.js';

// In dispatch function
} catch (err) {
  const msg = sanitizeErrorMessage(err);
  console.error(`错误：${msg}`);
  return ExitCode.UNKNOWN_ERROR;
}
```

**Update renderer.ts**:
```typescript
throw new Error(
  `Template not found: ${templateName}.hbs. Check template directories.`
);
```

---

### Fix 7: Path Whitelist (VULN-005)

**Update fs-utils.ts**:
```typescript
import { isAbsolute, resolve, relative } from 'node:path';

// ✅ NEW: Allowed base directories
const DEFAULT_ALLOWED_DIRS = [
  process.cwd(),  // Project root
  '/tmp',         // Temporary files (Unix)
  '/var/tmp',     // Temporary files (Unix)
  'C:\\Windows\\Temp',  // Temporary files (Windows)
];

// ✅ NEW: Sensitive file patterns
const SENSITIVE_FILE_PATTERNS = [
  /\/\.ssh\//i,           // SSH keys
  /\/\.gnupg\//i,         // GPG keys
  /\/\.aws\//i,           // AWS credentials
  /\/\.env$/i,            // Environment files
  /\.pem$/i,              // Certificate files
  /\.key$/i,              // Key files
  /\/etc\/passwd$/i,      // Unix password file
  /\/etc\/shadow$/i,      // Unix shadow file
  /id_rsa/i,              // SSH private key
  /id_dsa/i,              // SSH private key
  /id_ecdsa/i,            // SSH private key
  /id_ed25519/i,          // SSH private key
];

function assertSafePath(
  path: string,
  allowedDirs: string[] = DEFAULT_ALLOWED_DIRS
): string {
  // Original validation
  if (typeof path !== 'string' || path.trim() === '') {
    throw new Error('路径不能为空');
  }

  if (path.includes('\0')) {
    throw new Error(`非法路径（包含空字节）: ${path}`);
  }

  if (!isAbsolute(path)) {
    throw new Error(`检测到路径遍历: ${path}`);
  }

  const resolvedPath = resolve(path);

  // ✅ NEW: Check if path is within allowed directories
  const isAllowed = allowedDirs.some(allowedDir => {
    const normalizedAllowed = resolve(allowedDir);
    const relativePath = relative(normalizedAllowed, resolvedPath);
    return !relativePath.startsWith('..') && !relativePath.startsWith('/');
  });

  if (!isAllowed) {
    throw new Error(
      `路径不在允许的目录内: ${resolvedPath}`
    );
  }

  // ✅ NEW: Check for sensitive file patterns
  for (const pattern of SENSITIVE_FILE_PATTERNS) {
    if (pattern.test(resolvedPath)) {
      throw new Error(`拒绝访问敏感文件: ${resolvedPath}`);
    }
  }

  return resolvedPath;
}

// ✅ NEW: Context-aware validation for file operations
export function writeMarkdown(
  path: string,
  content: string,
  projectRoot?: string
): void {
  const allowedDirs = projectRoot
    ? [projectRoot, ...DEFAULT_ALLOWED_DIRS.filter(d => d !== process.cwd())]
    : DEFAULT_ALLOWED_DIRS;

  const safePath = assertSafePath(path, allowedDirs);
  ensureDir(dirname(safePath));
  writeFileSync(safePath, content, 'utf-8');
}
```

---

## Month 1 Fixes (P2)

### Fix 8: Atomic File Writes (VULN-009)

**Update first-index.ts**:
```typescript
import { writeFileSync, renameSync, mkdtempSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

export function writeIndex(firstDir: string, index: ProductIndex): void {
  const indexPath = getIndexFilePath(firstDir);

  // 确保目录存在
  if (!existsSync(firstDir)) {
    mkdirSync(firstDir, { recursive: true });
  }

  const content = yamlDump(index);

  // ✅ NEW: Atomic write using temp file + rename
  const tempDir = mkdtempSync(join(tmpdir(), 'spec-first-index-'));
  const tempPath = join(tempDir, 'index.tmp');

  try {
    // 1. Write to temporary file
    writeFileSync(tempPath, content, 'utf-8');

    // 2. Atomic rename (POSIX guarantees atomicity)
    renameSync(tempPath, indexPath);
  } finally {
    // 3. Cleanup temp directory
    try {
      rmdirSync(tempDir);
    } catch {
      // Ignore cleanup errors
    }
  }
}
```

---

## Testing Checklist

After implementing fixes, run these tests:

```bash
# 1. Unit tests
npm test

# 2. Security-specific tests
npm run test:security  # (create this script)

# 3. Dependency audit
pnpm audit

# 4. SAST scan
semgrep --config=auto src/

# 5. Secret detection
git secrets --scan-history

# 6. Template validation test
# Create malicious template and verify it's rejected

# 7. YAML security test
# Create malicious YAML and verify it's rejected

# 8. Path traversal test
# Try to access files outside allowed directories
```

---

## CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Dependency audit
        run: pnpm audit --audit-level=moderate

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/ci

      - name: Run tests
        run: npm test

      - name: Check for secrets
        run: |
          pip install git-secrets
          git secrets --register-aws
          git secrets --scan-history
```

---

## Rollback Plan

If fixes cause issues:

1. **Template Validation**: Set environment variable `SKIP_TEMPLATE_VALIDATION=true` to disable
2. **YAML Schema**: Add fallback to legacy parser with warning
3. **Path Whitelist**: Temporarily expand allowed directories via config
4. **Atomic Writes**: Fallback to non-atomic writes with warning

---

## Monitoring

After deployment, monitor:

1. **Security logs**: Check `.spec-first/security-audit.jsonl` for anomalies
2. **Error rates**: Monitor for increase in template/YAML parse errors
3. **Performance**: Atomic writes may be slightly slower, monitor impact
4. **User reports**: Watch for false positives in security validations

---

**Next Steps**: Proceed to Phase 3 (Testing & Documentation) to create comprehensive tests for these security fixes.
