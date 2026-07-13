'use strict';

const fs = require('node:fs');

function directoryHasEntries(directory) {
  try {
    return fs.readdirSync(directory).length > 0;
  } catch (_error) {
    return false;
  }
}

function fileHasContent(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() && stat.size > 0;
  } catch (_error) {
    return false;
  }
}

// Graphify's documented graph artifacts are JSON. A non-empty regular file is
// not enough evidence that a provider actually produced a usable graph: a
// successful process may leave a truncated or zero-byte file behind. Small
// artifacts are parsed exactly; large graphs are checked with bounded head/tail
// reads because a status probe must not load a hundreds-of-MB graph into memory.
function jsonFileHasContent(filePath) {
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (_error) {
    return false;
  }
  if (!stat.isFile() || stat.size === 0) return false;
  const exactParseLimit = 1024 * 1024;
  if (stat.size <= exactParseLimit) {
    try {
      JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return true;
    } catch (_error) {
      return false;
    }
  }

  const probeSize = 4096;
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const head = Buffer.alloc(Math.min(probeSize, stat.size));
    const tail = Buffer.alloc(Math.min(probeSize, stat.size));
    fs.readSync(fd, head, 0, head.length, 0);
    fs.readSync(fd, tail, 0, tail.length, Math.max(0, stat.size - tail.length));
    const start = head.toString('utf8').trimStart()[0];
    const end = tail.toString('utf8').trimEnd().slice(-1);
    return (start === '{' && end === '}') || (start === '[' && end === ']');
  } catch (_error) {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

module.exports = {
  directoryHasEntries,
  fileHasContent,
  jsonFileHasContent,
};
