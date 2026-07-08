# Pipeline-Mode Server Orchestration

Read and follow this file only when `spec-test-browser` is invoked with `mode:pipeline` by `spec-lfg` or another automated runner. It overrides three things in the main workflow: the headed/headless question, free-port selection, and dev-server startup. Pipeline mode runs unattended, so never block on a question.

## 1. No Headed/Headless Question

Default to headless. Do not ask. Skip the browser-mode question entirely and never pass `--headed`.

## 2. Claim A Free Port And Start The Server

Multiple agents may run on the same machine, so never assume the preferred port is free. Scan upward to the first free port, then start the server there in the background.

Run the scan and startup as **one** command. Shell variables do not survive between separate tool calls, so the free-port scan and startup must share a single block. Set `PORT` on the first line to the preferred port from the main workflow; it defaults to `3000` only if no preferred port was found.

```bash
PORT=3000   # replace 3000 with the preferred port from the main workflow

find_free_port() {
  local p=$1
  while lsof -i ":$p" -sTCP:LISTEN -t >/dev/null 2>&1; do
    p=$((p + 1))
  done
  echo "$p"
}

PORT=$(find_free_port "$PORT")
echo "Using dev server port: $PORT"

echo "Starting dev server on port ${PORT}..."
if [ -f "bin/dev" ]; then
  PORT=${PORT} bin/dev > /tmp/spec-test-browser-dev-server-${PORT}.log 2>&1 &
elif [ -f "bin/rails" ]; then
  bin/rails server -p ${PORT} > /tmp/spec-test-browser-dev-server-${PORT}.log 2>&1 &
elif [ -f "package.json" ]; then
  PORT=${PORT} npm run dev > /tmp/spec-test-browser-dev-server-${PORT}.log 2>&1 &
fi

for i in $(seq 1 30); do
  lsof -i ":${PORT}" -sTCP:LISTEN -t >/dev/null 2>&1 && break
  sleep 1
done

if ! lsof -i ":${PORT}" -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Server did not start in 30s. Last output:"
  tail -20 /tmp/spec-test-browser-dev-server-${PORT}.log 2>/dev/null
  exit 1
fi
```

The scan may land on a different port than the preferred one, and `$PORT` does not survive into later tool calls. Note the literal port printed as `Using dev server port: N` and substitute that number into every subsequent `agent-browser` command. Do not rely on `${PORT}` carrying over into the main workflow snippets.
