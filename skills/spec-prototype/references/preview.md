# Preview

Resolve one private run root, then reuse its canonical absolute path for every server operation. Prefer the ignored in-repo `.context/compound-engineering/ce-prototype` root. When that root is unsafe, not ignored, declined, or outside a Git repository, use a Node helper based on `os.tmpdir()` so Windows, macOS, and Linux use their native private temporary root.

```javascript
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const preferredRoot = path.join(repoRoot, '.context', 'compound-engineering', 'ce-prototype');
const fallbackRoot = path.join(os.tmpdir(), 'spec-first-ce-prototype');
const selectedRoot = preferredRootIsIgnoredAndSafe ? preferredRoot : fallbackRoot;
fs.mkdirSync(selectedRoot, { recursive: true, mode: 0o700 });
const runDir = fs.mkdtempSync(path.join(fs.realpathSync(selectedRoot), 'run-'));
process.stdout.write(`${fs.realpathSync(runDir)}\n`);
```

The preview server must receive the printed `RUN_DIR` through the `--root` argument. Re-check that the directory is owned by the current user and is not a symlink before each start, status, or stop call.

Start with the default `127.0.0.1` binding or explicit `--host ::1`; every other host is rejected. The server emits a CSP that permits only same-origin assets/connections plus inline prototype code, keeps an owner-private instance token out of user output, and proves lifecycle ownership through a token-bound loopback identity endpoint. Stop asks the identified server to close itself; it never sends a signal directly to a PID. A blocked stop is a limitation requiring manual owner inspection, not permission to send a broader signal.
