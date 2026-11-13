# Dev-server port detection

Port resolution runs via `scripts/resolve-port.sh`. This document explains the probe order, framework defaults, and the script's intentional parsing choices.

Run this cascade only while the port remains unresolved. Preserve a selected usable numeric port and all other startup facts. Resolve against the selected project directory. The table's Unknown fallback is a script default, not authority to start an unclassified project; unresolved classification still requires the user's startup facts. The resolved port seeds a URL candidate, while server output and attributed reachability determine the actual handoff URL.

## Priority order

1. **Explicit `--port` flag** -- if the caller passed `--port <n>`, validate an integer in `1..65535` and use it directly. Missing values, unknown flags/types, and extra positional arguments fail with an `ERROR:` on stderr.
2. **Framework config files** -- `next.config.*`, `vite.config.*`, `nuxt.config.*`, `astro.config.*` scoped to the selected framework (Vite for SvelteKit/modern Remix), then scanned lexically without executing config. Comments and string/template bodies are ignored; only literal numeric properties are candidates. Conflicting literal ports and dynamic expressions fall through. This is not JavaScript semantic evaluation: unrelated object properties or regular-expression literals may still be ambiguous; use an explicit startup fact when needed. Node is required for this optional probe.
3. **Rails `config/puma.rb`** -- grep for `port <n>`.
4. **`Procfile.dev`, otherwise `Procfile`** -- web line scanned for `-p <n>` / `--port <n>` / `-p=<n>` / `--port=<n>`.
5. **`docker-compose.yml`** -- line-anchored grep for `"<n>:<n>"` port mapping patterns. Not full YAML parsing.
6. **`package.json`** -- `dev`/`start` scripts scanned for `--port <n>` / `-p <n>` / `--port=<n>` / `-p=<n>`.
7. **`.env` files** -- checked in override order: `.env.local` -> `.env.development` -> `.env` (first hit wins). Parses `PORT=<n>` with quote stripping and comment truncation.
8. **Framework default lookup table** -- see table below.

All emitted ports are numeric and in `1..65535`; invalid discovered candidates are skipped. Missing or dynamic config is not evidence of the framework's actual listening port.

## Framework defaults

| Framework | Default port |
|-----------|-------------|
| Rails | 3000 |
| Next.js | 3000 |
| Nuxt | 3000 |
| Remix (classic) | 3000 |
| Vite | 5173 |
| SvelteKit | 5173 |
| Astro | 4321 |
| Procfile | 3000 |
| Unknown | 3000 |

## `.env` parsing choices

`resolve-port.sh` makes two deliberate parsing choices for real-world `.env` files; do not "simplify" them away:

**(a) Quote stripping on `.env` values.** Strips surrounding `"` and `'` from `PORT=` values (so `PORT="3001"` resolves to `3001`), because quoting is common in real `.env` files.

**(b) Comment stripping on `.env` values.** Truncates at `#` after trimming whitespace (so `PORT=3001 # dev only` resolves to `3001`), because inline comments are common.

**(c) No instruction-file port grep.** `resolve-port.sh` does not scan `AGENTS.md` / `CLAUDE.md` for port references. Instruction files may mention ports in unrelated examples or troubleshooting. Framework configuration and `.env` supply startup facts for the `spec-polish` caller; already-loaded guidance may provide an explicit override. `spec-test-browser` consumes a caller-supplied exact origin and performs no port resolution or listener scan.
