# Preview

Resolve one private run root, then reuse its canonical absolute path for every server operation. Prefer the ignored in-repo `.context/compound-engineering/ce-prototype` root. When that root is unsafe, not ignored, declined, or outside a Git repository, use a Node helper based on `os.tmpdir()` so Windows, macOS, and Linux use their native private temporary root.

Settle durability before claiming the directory. From the resolved repo root, probe `git -C <repo-root> check-ignore -q .context/compound-engineering/`; the trailing slash checks the directory. If the user wants repo-local retention and this path is not ignored, propose the single repo-root `.gitignore` entry and append it only within explicit authorization, preserving existing contents. If they requested no repo copy, skip that offer and use temporary storage. Resolve these facts once, then claim the root; never create a preliminary directory and re-resolve into a suffixed sibling.

Before using the example below, prove `preferredRootIsIgnoredAndSafe` by inspecting every path segment from the canonical repo root, rejecting symlinks, non-directories, and directories not owned by the current user where ownership is supported. An unsafe preferred path falls back to temporary storage; it is not repaired with chmod. The example's fallback uses exclusive `mkdtempSync` directly under the OS temporary root rather than following a shared fixed directory.

```javascript
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const preferredRoot = path.join(repoRoot, '.context', 'compound-engineering', 'ce-prototype');
if (preferredRootIsIgnoredAndSafe) {
  fs.mkdirSync(preferredRoot, { recursive: true, mode: 0o700 });
}
const prefix = preferredRootIsIgnoredAndSafe
  ? path.join(fs.realpathSync(preferredRoot), 'run-')
  : path.join(fs.realpathSync(os.tmpdir()), 'spec-first-ce-prototype-');
const runDir = fs.mkdtempSync(prefix);
process.stdout.write(`${fs.realpathSync(runDir)}\n`);
```

The preview server must receive the printed `RUN_DIR` through the `--root` argument. Re-check that the directory is owned by the current user and is not a symlink before each start, status, or stop call.

Temporary storage offers only best-effort survival. Report that limitation and preserve kept artifacts; do not promise a lifetime or delete the directory during ordinary preview cleanup.

Start with the default `127.0.0.1` binding or explicit `--host ::1`; every other host is rejected. The server emits a CSP that permits only same-origin assets/connections plus inline prototype code, keeps an owner-private instance token out of user output, and proves lifecycle ownership through a token-bound loopback identity endpoint. Stop asks the identified server to close itself; it never sends a signal directly to a PID. A blocked stop is a limitation requiring manual owner inspection, not permission to send a broader signal.
