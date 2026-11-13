# Nuxt dev-server recipe (auto-detect fallback)

Read only when classification resolves to `nuxt` and the startup command is still missing. Preserve selected cwd, environment, and numeric port; use the port resolver only for a missing port.

## Signature

- `nuxt.config.js`, `nuxt.config.mjs`, or `nuxt.config.ts` exists
- `package.json` contains a `nuxt` dependency

## Start command

Standard:

```bash
npm run dev
```

Also valid (read `package.json` scripts to confirm which the project uses):

```bash
pnpm dev
yarn dev
bun run dev
```

Prefer the package manager indicated by the lockfile:
- `pnpm-lock.yaml` -> `pnpm dev`
- `yarn.lock` -> `yarn dev`
- `bun.lock` / `bun.lockb` -> `bun run dev`
- `package-lock.json` or none -> `npm run dev`

## Port

Default: `3000`. Nuxt respects `--port <port>` and the `PORT` env var. Overrides follow the cascade in `references/dev-server-detection.md`.

## Stub generation

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Nuxt dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3000
    }
  ]
}
```

Substitute the resolved package manager (`npm` / `pnpm` / `yarn` / `bun`) and port.

## Common gotchas

- **Nitro server engine:** Nitro (Nuxt's server engine) adds its own dev server behind Nuxt's; polish only cares about the Nuxt port. Do not probe the Nitro internal port separately.
- **Port auto-increment:** Nuxt may choose another port when the requested one is occupied. Resolve unrelated collisions before launch, and use the selected server's actual URL for attributed reachability and handoff.
- **Nuxt 3 vs Nuxt 2:** Nuxt 3 uses `nuxt.config.ts`, Nuxt 2 uses `nuxt.config.js` -- both are detected by the signature check. The dev-server command and port defaults are the same across both versions.
