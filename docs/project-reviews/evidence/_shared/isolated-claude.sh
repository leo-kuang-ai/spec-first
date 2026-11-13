#!/bin/bash
# 在隔离环境中运行一个命令（如 claude -p 或 skill-up run）：
# - HOME 指向新建的临时目录，因此不加载用户级 skills、CLAUDE.md、插件、hooks 与 MCP 配置；
# - 只从用户 ~/.claude/settings.json 的 env 中注入 ANTHROPIC_* 与 CLAUDE_CODE_SUBAGENT_MODEL，
#   用于认证与模型选择；值只进入子进程环境，不写盘、不打印。
# 用法：bash isolated-claude.sh <临时根目录> <命令> [参数...]
# 工作目录由调用方决定，必须位于本仓库之外，避免加载项目 CLAUDE.md / AGENTS.md。
set -euo pipefail
ROOT="$1"; shift
mkdir -p "$ROOT/home"
exec python3 - "$ROOT/home" "$@" <<'PY'
import json, os, sys
home = sys.argv[1]
cmd = sys.argv[2:]
src = json.load(open(os.path.expanduser('~/.claude/settings.json'))).get('env', {})
env = {k: v for k, v in os.environ.items() if k in ('PATH', 'LANG', 'LC_ALL', 'TMPDIR', 'USER', 'LOGNAME', 'SHELL', 'TERM')}
for k, v in src.items():
    if k.startswith('ANTHROPIC_') or k == 'CLAUDE_CODE_SUBAGENT_MODEL':
        env[k] = str(v)
env['HOME'] = home
env['DISABLE_AUTOUPDATER'] = '1'
os.execvpe(cmd[0], cmd, env)
PY
