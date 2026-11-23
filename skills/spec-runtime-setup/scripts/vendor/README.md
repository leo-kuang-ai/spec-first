# Vendored runtime dependency

`js-yaml-3.15.1.min.js` is the browser distribution from the `js-yaml` 3.15.1 npm package.
It is vendored because `spec-runtime-setup` is projected into host Skill roots that must run
without resolving dependencies from the target project's `node_modules`.

- Upstream: https://github.com/nodeca/js-yaml
- Version: 3.15.1
- License: MIT; see `js-yaml-LICENSE`.
- npm archive: `js-yaml-3.15.1.tgz`, integrity `sha512-S99WuO3HlhO3XN41EtYUNl9zzXjoJx7QvmipxsJVxtCBT0YHEFy+iOJhjSvrmV12nYhWpZaM8lPHkJm0yUMbag==`.
- Compare `package/dist/js-yaml.min.js` and `package/LICENSE` byte for byte when updating. The project config reader uses `safeLoad`; the target project's installed parser is not the source for this copy.
