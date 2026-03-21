#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const [namespaceEncoded = '', commandEncoded = ''] = process.argv.slice(2);

function decode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

try {
  const namespace = decode(namespaceEncoded);
  const command = decode(commandEncoded);
  execFileSync('sh', ['-lc', command], {
    stdio: 'inherit',
    env: {
      ...process.env,
      SPEC_FIRST_EXTENSION_NAMESPACE: namespace,
    },
  });
} catch (error) {
  const status =
    error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
      ? error.status
      : 1;
  process.exit(status);
}
