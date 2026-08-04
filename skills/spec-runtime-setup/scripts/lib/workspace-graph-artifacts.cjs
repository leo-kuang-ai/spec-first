'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { TextDecoder } = require('node:util');
const { assertContainedPath } = require('./path-safety.cjs');
const { readStableRegularFile } = require('./regular-file-snapshot.cjs');

const JSON_READ_CHUNK_SIZE = 128 * 1024;
const MAX_JSON_NESTING_DEPTH = 100000;

function codegraphArtifactHasContent(repoRoot, workspaceRoot = repoRoot) {
  const databasePath = path.join(repoRoot, '.codegraph', 'codegraph.db');
  try {
    assertContainedPath(workspaceRoot, databasePath, {
      reasonCode: 'codegraph-artifact-escapes-workspace',
    });
    const snapshot = readStableRegularFile(databasePath, {
      read: (_descriptor, stat) => stat.size > 0,
      rootPath: workspaceRoot,
    });
    return snapshot.ok && snapshot.value === true;
  } catch (_error) {
    return false;
  }
}

function jsonFileHasContent(filePath, rootPath = null) {
  const snapshot = readStableRegularFile(filePath, {
    read: (descriptor, stat) => jsonFileDescriptorHasContent(descriptor, stat),
    rootPath,
  });
  return snapshot.ok && snapshot.value === true;
}

function jsonFileDescriptorHasContent(fd, stat) {
  return inspectJsonFileDescriptor(fd, stat).valid;
}

function jsonFileReceipt(filePath, rootPath = null) {
  const snapshot = readStableRegularFile(filePath, {
    read: (descriptor, stat) => inspectJsonFileDescriptor(descriptor, stat, { includeSha256: true }),
    rootPath,
  });
  if (!snapshot.ok || !snapshot.value.valid) return null;
  return {
    sha256: snapshot.value.sha256,
    generation: snapshot.stat,
  };
}

function jsonFileReceiptMatches(filePath, receipt, rootPath = null) {
  if (!receipt || typeof receipt.sha256 !== 'string' || !receipt.generation) return false;
  const snapshot = readStableRegularFile(filePath, {
    read: () => true,
    rootPath,
  });
  return snapshot.ok && sameSnapshotGeneration(snapshot.stat, receipt.generation);
}

function inspectJsonFileDescriptor(fd, stat, { includeSha256 = false } = {}) {
  if (!stat.isFile() || stat.size === 0) return { valid: false, sha256: null };
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const validator = createJsonSyntaxValidator();
    const hash = includeSha256 ? crypto.createHash('sha256') : null;
    const buffer = Buffer.allocUnsafe(Math.min(JSON_READ_CHUNK_SIZE, stat.size));
    let offset = 0;
    while (offset < stat.size) {
      const bytesRead = fs.readSync(
        fd,
        buffer,
        0,
        Math.min(buffer.length, stat.size - offset),
        offset,
      );
      if (bytesRead === 0) return { valid: false, sha256: null };
      offset += bytesRead;
      const chunk = buffer.subarray(0, bytesRead);
      if (hash) hash.update(chunk);
      if (!validator.write(decoder.decode(chunk, { stream: true }))) {
        return { valid: false, sha256: null };
      }
    }
    const finalText = decoder.decode();
    const valid = (!finalText || validator.write(finalText)) && validator.end();
    return {
      valid,
      sha256: valid && hash ? hash.digest('hex') : null,
    };
  } catch (_error) {
    return { valid: false, sha256: null };
  }
}

function sameSnapshotGeneration(left, right) {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.mode === right.mode
    && left.size === right.size
    && left.mtime_ms === right.mtime_ms
    && left.ctime_ms === right.ctime_ms;
}

// Graphify 大图不能整份 JSON.parse 进内存；这里仅做完整语法校验，不构造对象。
function createJsonSyntaxValidator() {
  const stack = [];
  let rootState = 'value';
  let token = null;
  let valid = true;

  function currentContext() {
    return stack.length > 0 ? stack[stack.length - 1] : { kind: 'root', state: rootState };
  }

  function completeValue() {
    const context = currentContext();
    if (context.kind === 'root' && context.state === 'value') {
      rootState = 'done';
      return true;
    }
    if (context.kind === 'array' && ['value-or-end', 'value'].includes(context.state)) {
      context.state = 'comma-or-end';
      return true;
    }
    if (context.kind === 'object' && context.state === 'value') {
      context.state = 'comma-or-end';
      return true;
    }
    return false;
  }

  function pushContainer(kind) {
    if (stack.length >= MAX_JSON_NESTING_DEPTH) return false;
    stack.push({
      kind,
      state: kind === 'object' ? 'key-or-end' : 'value-or-end',
    });
    return true;
  }

  function closeContainer(kind) {
    const context = currentContext();
    if (context.kind !== kind) return false;
    stack.pop();
    return completeValue();
  }

  function startString(role) {
    token = { type: 'string', role, escaped: false, unicodeRemaining: 0 };
    return true;
  }

  function startValue(character) {
    if (character === '{') return pushContainer('object');
    if (character === '[') return pushContainer('array');
    if (character === '"') return startString('value');
    if (character === '-') {
      token = { type: 'number', state: 'minus' };
      return true;
    }
    if (character === '0') {
      token = { type: 'number', state: 'zero' };
      return true;
    }
    if (/[1-9]/.test(character)) {
      token = { type: 'number', state: 'integer' };
      return true;
    }
    const literal = character === 't'
      ? 'true'
      : (character === 'f' ? 'false' : (character === 'n' ? 'null' : null));
    if (!literal) return false;
    token = { type: 'literal', expected: literal, index: 1 };
    return true;
  }

  function consumeStructural(character) {
    if (isJsonWhitespace(character)) return true;
    const context = currentContext();
    if (context.kind === 'root') {
      return context.state === 'value' ? startValue(character) : false;
    }
    if (context.kind === 'array') {
      if (context.state === 'value-or-end') {
        return character === ']' ? closeContainer('array') : startValue(character);
      }
      if (context.state === 'value') return startValue(character);
      if (context.state === 'comma-or-end') {
        if (character === ']') return closeContainer('array');
        if (character === ',') {
          context.state = 'value';
          return true;
        }
      }
      return false;
    }
    if (context.state === 'key-or-end') {
      if (character === '}') return closeContainer('object');
      return character === '"' ? startString('key') : false;
    }
    if (context.state === 'key') return character === '"' ? startString('key') : false;
    if (context.state === 'colon') {
      if (character !== ':') return false;
      context.state = 'value';
      return true;
    }
    if (context.state === 'value') return startValue(character);
    if (context.state === 'comma-or-end') {
      if (character === '}') return closeContainer('object');
      if (character === ',') {
        context.state = 'key';
        return true;
      }
    }
    return false;
  }

  function consumeString(character) {
    if (token.unicodeRemaining > 0) {
      if (!/[0-9a-fA-F]/.test(character)) return false;
      token.unicodeRemaining -= 1;
      return true;
    }
    if (token.escaped) {
      token.escaped = false;
      if (character === 'u') {
        token.unicodeRemaining = 4;
        return true;
      }
      return '"\\/bfnrt'.includes(character);
    }
    if (character === '\\') {
      token.escaped = true;
      return true;
    }
    if (character === '"') {
      const role = token.role;
      token = null;
      if (role === 'key') {
        const context = currentContext();
        if (context.kind !== 'object' || !['key-or-end', 'key'].includes(context.state)) return false;
        context.state = 'colon';
        return true;
      }
      return completeValue();
    }
    return character.codePointAt(0) >= 0x20;
  }

  function finishNumber(character) {
    token = null;
    return completeValue() && consumeStructural(character);
  }

  function consumeNumber(character) {
    const state = token.state;
    if (state === 'minus') {
      if (character === '0') token.state = 'zero';
      else if (/[1-9]/.test(character)) token.state = 'integer';
      else return false;
      return true;
    }
    if (state === 'zero') {
      if (character === '.') token.state = 'decimal-point';
      else if (/[eE]/.test(character)) token.state = 'exponent';
      else return isNumberDelimiter(character) ? finishNumber(character) : false;
      return true;
    }
    if (state === 'integer') {
      if (/[0-9]/.test(character)) return true;
      if (character === '.') token.state = 'decimal-point';
      else if (/[eE]/.test(character)) token.state = 'exponent';
      else return isNumberDelimiter(character) ? finishNumber(character) : false;
      return true;
    }
    if (state === 'decimal-point') {
      if (!/[0-9]/.test(character)) return false;
      token.state = 'fraction';
      return true;
    }
    if (state === 'fraction') {
      if (/[0-9]/.test(character)) return true;
      if (/[eE]/.test(character)) token.state = 'exponent';
      else return isNumberDelimiter(character) ? finishNumber(character) : false;
      return true;
    }
    if (state === 'exponent') {
      if (/[+-]/.test(character)) token.state = 'exponent-sign';
      else if (/[0-9]/.test(character)) token.state = 'exponent-digits';
      else return false;
      return true;
    }
    if (state === 'exponent-sign') {
      if (!/[0-9]/.test(character)) return false;
      token.state = 'exponent-digits';
      return true;
    }
    if (state === 'exponent-digits') {
      if (/[0-9]/.test(character)) return true;
      return isNumberDelimiter(character) ? finishNumber(character) : false;
    }
    return false;
  }

  function consumeLiteral(character) {
    if (character !== token.expected[token.index]) return false;
    token.index += 1;
    if (token.index === token.expected.length) {
      token = null;
      return completeValue();
    }
    return true;
  }

  function consume(character) {
    if (!token) return consumeStructural(character);
    if (token.type === 'string') return consumeString(character);
    if (token.type === 'number') return consumeNumber(character);
    return consumeLiteral(character);
  }

  return {
    write(chunk) {
      if (!valid) return false;
      for (const character of chunk) {
        if (!consume(character)) {
          valid = false;
          return false;
        }
      }
      return true;
    },
    end() {
      if (!valid) return false;
      if (token && token.type === 'number'
        && ['zero', 'integer', 'fraction', 'exponent-digits'].includes(token.state)) {
        token = null;
        valid = completeValue();
      }
      return valid && token === null && stack.length === 0 && rootState === 'done';
    },
  };
}

function isJsonWhitespace(character) {
  return character === ' ' || character === '\t' || character === '\r' || character === '\n';
}

function isNumberDelimiter(character) {
  return isJsonWhitespace(character) || character === ',' || character === ']' || character === '}';
}

function sha256FileDescriptor(fd) {
  const hash = crypto.createHash('sha256');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let offset = 0;
  while (true) {
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, offset);
    if (bytesRead === 0) break;
    hash.update(buffer.subarray(0, bytesRead));
    offset += bytesRead;
  }
  return hash.digest('hex');
}

function sha256File(filePath) {
  const snapshot = readStableRegularFile(filePath, {
    read: (descriptor) => sha256FileDescriptor(descriptor),
  });
  if (!snapshot.ok) throw new Error(`无法读取稳定普通文件：${filePath}`);
  return snapshot.value;
}

module.exports = {
  codegraphArtifactHasContent,
  jsonFileDescriptorHasContent,
  jsonFileHasContent,
  jsonFileReceipt,
  jsonFileReceiptMatches,
  sha256FileDescriptor,
  sha256File,
};
