'use strict';

const fs = require('node:fs');

function publishRegularFileNoClobber(source, target) {
  try {
    const item = fs.lstatSync(source);
    if (!item.isFile() || item.isSymbolicLink()) return { status: 'failed' };
    fs.linkSync(source, target);
  } catch (error) {
    if (error && error.code === 'EEXIST') return { status: 'contended' };
    try {
      fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
    } catch (copyError) {
      if (copyError && copyError.code === 'EEXIST') return { status: 'contended' };
      return { status: 'failed' };
    }
  }
  return { status: 'published' };
}

function restoreRegularFileNoClobber(source, target) {
  const publication = publishRegularFileNoClobber(source, target);
  if (publication.status !== 'published') return publication;
  try { fs.rmSync(source, { force: true }); } catch (_error) { /* canonical copy is authoritative */ }
  return { status: 'restored' };
}

module.exports = {
  publishRegularFileNoClobber,
  restoreRegularFileNoClobber,
};
