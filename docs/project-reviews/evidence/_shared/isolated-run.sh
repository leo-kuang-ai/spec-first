#!/bin/bash
# 在隔离环境中运行一个命令（skill-up run、claude -p 或 codex exec）。
# - HOME 指向 <临时根目录>/home，不加载用户级 skills、CLAUDE.md、AGENTS.md、插件、hooks 与 MCP；
# - Claude：只从 ~/.claude/settings.json 的 env 注入 ANTHROPIC_* 与 CLAUDE_CODE_SUBAGENT_MODEL；
# - codex：在临时 HOME 写入裁剪后的 ~/.codex/config.toml（只保留 model、model_provider、
#   model_reasoning_effort 与 [model_providers.custom]），命令结束后删除该文件。
# 凭证只进入子进程环境与临时文件，不打印、不写入证据目录。
# 用法：bash isolated-run.sh <临时根目录> <命令> [参数...]；工作目录须在仓库之外。
set -euo pipefail
ROOT="$1"; shift
HOME_DIR="$ROOT/home"
mkdir -p "$HOME_DIR/.codex"
CODEX_CFG="$HOME_DIR/.codex/config.toml"
cleanup() { rm -f "$CODEX_CFG"; }
trap cleanup EXIT
python3 - "$HOME/.codex/config.toml" "$CODEX_CFG" <<'PY'
import re, sys
out, section = [], None
for line in open(sys.argv[1]).read().splitlines():
    m = re.match(r'^\s*\[([^\]]+)\]', line)
    if m:
        section = m.group(1)
    if section is None:
        if line.split('=')[0].strip() in ('model', 'model_provider', 'model_reasoning_effort'):
            out.append(line)
    elif section == 'model_providers.custom':
        out.append(line)
open(sys.argv[2], 'w').write('\n'.join(out) + '\n')
PY
chmod 600 "$CODEX_CFG"
python3 - "$HOME_DIR" "$@" <<'PY'
import json, os, subprocess, sys
home, cmd = sys.argv[1], sys.argv[2:]
src = json.load(open(os.path.expanduser('~/.claude/settings.json'))).get('env', {})
env = {k: v for k, v in os.environ.items() if k in ('PATH', 'LANG', 'LC_ALL', 'TMPDIR', 'USER', 'LOGNAME', 'SHELL', 'TERM')}
for k, v in src.items():
    if k.startswith('ANTHROPIC_') or k == 'CLAUDE_CODE_SUBAGENT_MODEL':
        env[k] = str(v)
env['HOME'] = home
env['DISABLE_AUTOUPDATER'] = '1'
sys.exit(subprocess.call(cmd, env=env))
PY
