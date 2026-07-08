'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SOURCE_ROOTS = [
  path.join(__dirname, '..', '..', 'skills'),
  path.join(__dirname, '..', '..', 'agents'),
];

function walkMarkdownFiles(dir) {
  const out = [];

  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMarkdownFiles(full));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }

  return out;
}

function listSourceMarkdownFiles() {
  return SOURCE_ROOTS.flatMap(walkMarkdownFiles);
}

function findPreResolutionCommands(body) {
  const found = [];
  const regex = /!`([^`]*)`/g;
  let match;

  while ((match = regex.exec(body)) !== null) {
    const lineNumber = body.slice(0, match.index).split(/\r?\n/).length;
    found.push({ lineNumber, command: match[1] });
  }

  return found;
}

function hasTopLevelMixedAndOr(cmd) {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let andAtDepth0 = false;
  let orAtDepth0 = false;

  for (let i = 0; i < cmd.length; i += 1) {
    const c = cmd[i];
    const next = cmd[i + 1];

    if (!inDoubleQuote && c === "'") {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (!inSingleQuote && c === '"') {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    if (inSingleQuote || inDoubleQuote) continue;

    if (c === '$' && next === '(') {
      depth += 1;
      i += 1;
      continue;
    }
    if (c === '(') {
      depth += 1;
      continue;
    }
    if (c === ')') {
      depth -= 1;
      continue;
    }

    if (depth === 0) {
      if (c === '&' && next === '&') {
        andAtDepth0 = true;
        i += 1;
        continue;
      }
      if (c === '|' && next === '|') {
        orAtDepth0 = true;
        i += 1;
      }
    }
  }

  return andAtDepth0 && orAtDepth0;
}

function findCommandSubstitutionContents(cmd) {
  const results = [];
  let i = 0;
  let inSingleQuote = false;

  while (i < cmd.length) {
    const c = cmd[i];
    if (c === "'" && !inSingleQuote) {
      inSingleQuote = true;
      i += 1;
      continue;
    }
    if (c === "'" && inSingleQuote) {
      inSingleQuote = false;
      i += 1;
      continue;
    }
    if (inSingleQuote) {
      i += 1;
      continue;
    }
    if (c === '$' && cmd[i + 1] === '(') {
      let depth = 1;
      let j = i + 2;
      const start = j;
      while (j < cmd.length && depth > 0) {
        if (cmd[j] === '$' && cmd[j + 1] === '(') {
          depth += 1;
          j += 2;
          continue;
        }
        if (cmd[j] === '(') {
          depth += 1;
          j += 1;
          continue;
        }
        if (cmd[j] === ')') {
          depth -= 1;
          j += 1;
          continue;
        }
        j += 1;
      }
      results.push(cmd.slice(start, Math.max(start, j - 1)));
      i = j;
      continue;
    }
    i += 1;
  }

  return results;
}

function hasNestedQuotedStringInCommandSubst(cmd) {
  return findCommandSubstitutionContents(cmd).some((value) => value.includes('"'));
}

function hasUnguardedErrorSuppression(cmd) {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let lastSeparatorEnd = 0;

  for (let i = 0; i < cmd.length; i += 1) {
    const c = cmd[i];
    const next = cmd[i + 1];

    if (!inDoubleQuote && c === "'") {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (!inSingleQuote && c === '"') {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    if (inSingleQuote || inDoubleQuote) continue;

    if (c === '$' && next === '(') {
      depth += 1;
      i += 1;
      continue;
    }
    if (c === '(') {
      depth += 1;
      continue;
    }
    if (c === ')') {
      depth -= 1;
      continue;
    }

    if (depth === 0) {
      if (c === ';') {
        lastSeparatorEnd = i + 1;
        continue;
      }
      if (c === '&' && next === '&') {
        lastSeparatorEnd = i + 2;
        i += 1;
        continue;
      }
      if (c === '|' && next === '|') {
        lastSeparatorEnd = i + 2;
        i += 1;
      }
    }
  }

  return cmd.slice(lastSeparatorEnd).includes('2>/dev/null');
}

function hasParameterExpansion(cmd) {
  return /\$\{[A-Za-z_][A-Za-z0-9_]*[%#/:^][^}]*\}/.test(cmd);
}

describe('findPreResolutionCommands', () => {
  test('captures single-line `!` blocks with correct line numbers', () => {
    const sample = 'intro\n!`echo hi` mid !`echo bye`\nend';
    expect(findPreResolutionCommands(sample)).toEqual([
      { lineNumber: 2, command: 'echo hi' },
      { lineNumber: 2, command: 'echo bye' },
    ]);
  });

  test('captures multi-line `!` blocks', () => {
    const sample = 'intro\n!`one`\ngap\n!`split\nover\nlines`\nend';
    expect(findPreResolutionCommands(sample)).toEqual([
      { lineNumber: 2, command: 'one' },
      { lineNumber: 4, command: 'split\nover\nlines' },
    ]);
  });
});

describe('skill and agent `!` pre-resolution commands avoid Claude Code shell denylist', () => {
  const files = listSourceMarkdownFiles();

  for (const filePath of files) {
    const rel = path.relative(path.join(__dirname, '..', '..'), filePath);
    const body = fs.readFileSync(filePath, 'utf8');
    const preResolutionCommands = findPreResolutionCommands(body);
    if (preResolutionCommands.length === 0) continue;

    test(`${rel} pre-resolution commands contain no case/esac`, () => {
      const offenders = preResolutionCommands.filter(({ command }) =>
        /\bcase\b/.test(command) && /\besac\b/.test(command),
      );
      const formatted = offenders
        .map(({ lineNumber, command }) => `  line ${lineNumber}: ${command}`)
        .join('\n');

      expect(offenders).toEqual([]);
      if (offenders.length > 0) {
        throw new Error([
          'Claude Code rejects `case ... esac` in `!` pre-resolution commands.',
          'Use if/then/else, &&/|| chaining, or `git rev-parse --path-format=absolute --git-common-dir`.',
          `Offending commands:\n${formatted}`,
        ].join('\n'));
      }
    });
  }

  for (const filePath of files) {
    const rel = path.relative(path.join(__dirname, '..', '..'), filePath);
    const body = fs.readFileSync(filePath, 'utf8');
    const preResolutionCommands = findPreResolutionCommands(body);
    if (preResolutionCommands.length === 0) continue;

    test(`${rel} pre-resolution commands avoid ambiguous top-level &&/||`, () => {
      const offenders = preResolutionCommands.filter(({ command }) => hasTopLevelMixedAndOr(command));
      const formatted = offenders
        .map(({ lineNumber, command }) => `  line ${lineNumber}: ${command}`)
        .join('\n');

      expect(offenders).toEqual([]);
      if (offenders.length > 0) {
        throw new Error([
          'Claude Code rejects top-level `[A] && B || C` style pre-resolution commands.',
          'Use a subshell, split to a script, or keep only one top-level boolean operator family.',
          `Offending commands:\n${formatted}`,
        ].join('\n'));
      }
    });

    test(`${rel} pre-resolution commands avoid quoted strings inside command substitution`, () => {
      const offenders = preResolutionCommands.filter(({ command }) =>
        hasNestedQuotedStringInCommandSubst(command),
      );
      const formatted = offenders
        .map(({ lineNumber, command }) => `  line ${lineNumber}: ${command}`)
        .join('\n');

      expect(offenders).toEqual([]);
      if (offenders.length > 0) {
        throw new Error([
          'Claude Code rejects nested quoted-string command substitutions such as `basename "$(dirname "$common")"`.',
          'Use simpler pre-resolution or move the logic into a script.',
          `Offending commands:\n${formatted}`,
        ].join('\n'));
      }
    });

    test(`${rel} trailing 2>/dev/null pre-resolution commands have fallbacks`, () => {
      const offenders = preResolutionCommands.filter(({ command }) =>
        hasUnguardedErrorSuppression(command),
      );
      const formatted = offenders
        .map(({ lineNumber, command }) => `  line ${lineNumber}: ${command}`)
        .join('\n');

      expect(offenders).toEqual([]);
      if (offenders.length > 0) {
        throw new Error([
          'Pre-resolution commands that suppress stderr must include a fallback so non-git directories do not fail skill load.',
          'Use `|| true` or a stable sentinel fallback.',
          `Offending commands:\n${formatted}`,
        ].join('\n'));
      }
    });

    test(`${rel} pre-resolution commands avoid bash parameter expansion operators`, () => {
      const offenders = preResolutionCommands.filter(({ command }) => hasParameterExpansion(command));
      const formatted = offenders
        .map(({ lineNumber, command }) => `  line ${lineNumber}: ${command}`)
        .join('\n');

      expect(offenders).toEqual([]);
      if (offenders.length > 0) {
        throw new Error([
          'Claude Code rejects bash parameter expansion operators in `!` pre-resolution commands.',
          'Use simple variable references or move the logic into a script.',
          `Offending commands:\n${formatted}`,
        ].join('\n'));
      }
    });
  }
});
