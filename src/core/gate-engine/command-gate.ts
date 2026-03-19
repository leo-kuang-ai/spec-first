import { execFileSync } from 'node:child_process';

const COMMAND_TIMEOUT_MS = 30_000;
const COMMAND_DETAIL_MAX_CHARS = 200;
const ALLOWED_LAYER2_EXECUTABLES = new Set([
  'npm',
  'pnpm',
  'yarn',
  'npx',
  'node',
  'python',
  'python3',
  'pytest',
  'ruff',
  'diff-cover',
  'swiftlint',
  'xcodebuild',
  'go',
  'gofmt',
  'sqlfluff',
  'alembic',
  'test',
]);

interface CommandExecutionResult {
  pass: boolean;
  detail: string;
  stdout: string;
}

function tailDetail(text: string): string {
  const trimmed = text.trim();
  return trimmed ? trimmed.slice(-COMMAND_DETAIL_MAX_CHARS) : 'OK';
}

function isSafeRelativeExecutable(executable: string): boolean {
  if (!executable.startsWith('./')) return false;
  if (executable.includes('..')) return false;
  return /^[./A-Za-z0-9_-]+$/.test(executable);
}

function isAllowedExecutable(executable: string): boolean {
  if (ALLOWED_LAYER2_EXECUTABLES.has(executable)) return true;
  return isSafeRelativeExecutable(executable);
}

function tokenizeCommandSegment(segment: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let escaping = false;

  const pushCurrent = () => {
    if (current.length > 0) {
      tokens.push(current);
      current = '';
    }
  };

  for (let i = 0; i < segment.length; i += 1) {
    const ch = segment[i];

    if (escaping) {
      current += ch;
      escaping = false;
      continue;
    }

    if (ch === '\\' && !inSingle) {
      escaping = true;
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }

    if (!inSingle && !inDouble && /\s/.test(ch)) {
      pushCurrent();
      continue;
    }

    current += ch;
  }

  if (escaping || inSingle || inDouble) {
    throw new Error('invalid command: unclosed quote or escape');
  }
  pushCurrent();
  return tokens;
}

function scanTopLevelOperator(expression: string): string | undefined {
  let inSingle = false;
  let inDouble = false;
  let subshellDepth = 0;

  for (let i = 0; i < expression.length; i += 1) {
    const ch = expression[i];
    const next = expression[i + 1];

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if (inSingle || inDouble) continue;

    if (ch === '$' && next === '(') {
      subshellDepth += 1;
      i += 1;
      continue;
    }
    if (ch === ')' && subshellDepth > 0) {
      subshellDepth -= 1;
      continue;
    }
    if (subshellDepth > 0) continue;

    if (ch === '&' && next === '&') {
      i += 1;
      continue;
    }
    if (ch === '|' && next === '|') return '||';
    if (ch === ';' || ch === '|' || ch === '<' || ch === '>' || ch === '`') return ch;
    if (ch === '\n' || ch === '\r') return 'newline';
  }

  if (subshellDepth !== 0 || inSingle || inDouble) {
    return 'unbalanced';
  }
  return undefined;
}

function splitByLogicalAnd(expression: string): string[] {
  const segments: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let subshellDepth = 0;

  for (let i = 0; i < expression.length; i += 1) {
    const ch = expression[i];
    const next = expression[i + 1];

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      current += ch;
      continue;
    }

    if (!inSingle && !inDouble) {
      if (ch === '$' && next === '(') {
        subshellDepth += 1;
        current += '$(';
        i += 1;
        continue;
      }
      if (ch === ')' && subshellDepth > 0) {
        subshellDepth -= 1;
        current += ch;
        continue;
      }
      if (subshellDepth === 0 && ch === '&' && next === '&') {
        const trimmed = current.trim();
        if (!trimmed) throw new Error('invalid command: empty segment around &&');
        segments.push(trimmed);
        current = '';
        i += 1;
        continue;
      }
    }

    current += ch;
  }

  if (inSingle || inDouble || subshellDepth !== 0) {
    throw new Error('invalid command: unbalanced expression');
  }

  const tail = current.trim();
  if (tail) segments.push(tail);
  return segments;
}

function executeArgvCommand(segment: string, cwd: string): CommandExecutionResult {
  const tokens = tokenizeCommandSegment(segment);
  if (tokens.length === 0) {
    return { pass: false, detail: 'Blocked command: empty command segment', stdout: '' };
  }

  const [executable, ...args] = tokens;
  if (!isAllowedExecutable(executable)) {
    return {
      pass: false,
      detail: `Blocked command: executable "${executable}" is not allowed`,
      stdout: '',
    };
  }

  try {
    const stdout = execFileSync(executable, args, {
      cwd,
      timeout: COMMAND_TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });
    return { pass: true, detail: tailDetail(stdout), stdout };
  } catch (err: unknown) {
    if (err instanceof Error) {
      const typed = err as Error & { stderr?: Buffer | string; stdout?: Buffer | string };
      const stderr =
        typeof typed.stderr === 'string' ? typed.stderr : typed.stderr?.toString('utf-8');
      const stdout =
        typeof typed.stdout === 'string' ? typed.stdout : typed.stdout?.toString('utf-8');
      return {
        pass: false,
        detail: tailDetail(stderr || stdout || typed.message),
        stdout: stdout ?? '',
      };
    }
    return { pass: false, detail: tailDetail(String(err)), stdout: '' };
  }
}

function executeCommandSegment(segment: string, cwd: string): CommandExecutionResult {
  const trimmed = segment.trim();
  if (!trimmed) {
    return { pass: false, detail: 'Blocked command: empty command segment', stdout: '' };
  }

  const testZeroMatch = trimmed.match(/^test\s+-z\s+"?\$\(([\s\S]+)\)"?$/);
  if (testZeroMatch?.[1]) {
    const inner = executeCommandExpression(testZeroMatch[1].trim(), cwd);
    if (!inner.pass) return inner;
    if (inner.stdout.trim() === '') {
      return { pass: true, detail: 'OK', stdout: '' };
    }
    return {
      pass: false,
      detail: `test -z failed: output is not empty (${tailDetail(inner.stdout)})`,
      stdout: inner.stdout,
    };
  }

  return executeArgvCommand(trimmed, cwd);
}

function executeCommandExpression(expression: string, cwd: string): CommandExecutionResult {
  const blockedOp = scanTopLevelOperator(expression);
  if (blockedOp) {
    return {
      pass: false,
      detail: `Blocked command: operator "${blockedOp}" is not allowed`,
      stdout: '',
    };
  }

  let lastStdout = '';
  try {
    const segments = splitByLogicalAnd(expression);
    if (segments.length === 0) {
      return { pass: false, detail: 'Blocked command: empty expression', stdout: '' };
    }
    for (const segment of segments) {
      const result = executeCommandSegment(segment, cwd);
      if (!result.pass) return result;
      lastStdout = result.stdout;
    }
    return { pass: true, detail: tailDetail(lastStdout), stdout: lastStdout };
  } catch (err: unknown) {
    return {
      pass: false,
      detail: tailDetail(err instanceof Error ? err.message : String(err)),
      stdout: '',
    };
  }
}

/** 执行 Layer2 命令 Gate，返回 pass/fail + 输出摘要 */
export function runCommandGate(command: string, cwd: string): { pass: boolean; detail: string } {
  const result = executeCommandExpression(command, cwd);
  return { pass: result.pass, detail: result.detail };
}
