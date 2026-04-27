'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const CRG_NATIVE_MODULES = [
  {
    name: 'better-sqlite3',
    requiredFor: 'crg_database',
    required: true,
    fix: 'Run `spec-first doctor --repair-native` or `npm rebuild better-sqlite3`.',
  },
  {
    name: 'tree-sitter',
    requiredFor: 'crg_parser_core',
    required: false,
    fix: 'Run `npm rebuild tree-sitter` if parser coverage is required.',
  },
  { name: 'tree-sitter-c', requiredFor: 'c_parser', required: false },
  { name: 'tree-sitter-c-sharp', requiredFor: 'csharp_parser', required: false },
  { name: 'tree-sitter-cpp', requiredFor: 'cpp_parser', required: false },
  { name: 'tree-sitter-go', requiredFor: 'go_parser', required: false },
  { name: 'tree-sitter-java', requiredFor: 'java_parser', required: false },
  { name: 'tree-sitter-javascript', requiredFor: 'javascript_parser', required: false },
  {
    name: 'tree-sitter-kotlin',
    requiredFor: 'kotlin_parser',
    required: false,
    sourceBuildExpected: true,
    fix: 'Install C++ build tools and run `npm rebuild tree-sitter-kotlin`; otherwise Kotlin files use module-level CRG indexing.',
  },
  { name: 'tree-sitter-objc', requiredFor: 'objc_parser', required: false },
  { name: 'tree-sitter-php', requiredFor: 'php_parser', required: false },
  { name: 'tree-sitter-python', requiredFor: 'python_parser', required: false },
  { name: 'tree-sitter-ruby', requiredFor: 'ruby_parser', required: false },
  { name: 'tree-sitter-rust', requiredFor: 'rust_parser', required: false },
  { name: 'tree-sitter-scala', requiredFor: 'scala_parser', required: false },
  { name: 'tree-sitter-swift', requiredFor: 'swift_parser', required: false },
  { name: 'tree-sitter-typescript', requiredFor: 'typescript_parser', required: false },
];

function buildNativeDiagnostics(options = {}) {
  const platform = options.platform || process.platform;
  const arch = options.arch || process.arch;
  const modules = (options.modules || CRG_NATIVE_MODULES).map((definition) => inspectNativeModule(definition, { platform, arch }));
  const byName = Object.fromEntries(modules.map((entry) => [entry.name, entry]));
  const betterSqliteReady = byName['better-sqlite3'] && byName['better-sqlite3'].status === 'ready';
  const treeSitterReady = byName['tree-sitter'] && byName['tree-sitter'].status === 'ready';
  const unavailableOptional = modules.filter((entry) => !entry.required && entry.status !== 'ready');
  const requiredUnavailable = modules.filter((entry) => entry.required && entry.status !== 'ready');
  let crgStatus = 'ready';

  if (!betterSqliteReady || requiredUnavailable.length > 0) {
    crgStatus = 'unavailable';
  } else if (!treeSitterReady || unavailableOptional.length > 0) {
    crgStatus = 'degraded';
  }

  return {
    node: {
      version: process.version,
      abi: process.versions.modules || null,
      napi: process.versions.napi || null,
      platform,
      arch,
    },
    crg_status: crgStatus,
    modules,
    unavailable_modules: modules.filter((entry) => entry.status !== 'ready').map((entry) => entry.name),
    recommended_actions: buildRecommendedActions({ crgStatus, modules, platform }),
  };
}

function inspectNativeModule(definition, options = {}) {
  const platform = options.platform || process.platform;
  const arch = options.arch || process.arch;
  const packageInfo = resolvePackageInfo(definition.name);
  const prebuild = packageInfo.packageDir
    ? inspectPrebuild(packageInfo.packageDir, platform, arch)
    : { expected_dir: `${platform}-${arch}`, available: false, available_dirs: [] };
  const load = probeRequire(definition.name);
  const sourceBuildExpected = Boolean(definition.sourceBuildExpected || (
    packageInfo.install_script &&
    packageInfo.install_script.includes('node-gyp-build') &&
    !prebuild.available
  ));

  let status = 'ready';
  if (!packageInfo.packageDir) {
    status = sourceBuildExpected ? 'source_build_required' : 'missing';
  } else if (!load.ok) {
    status = sourceBuildExpected ? 'source_build_required' : 'unloadable';
  }

  return {
    name: definition.name,
    required_for: definition.requiredFor,
    required: Boolean(definition.required),
    status,
    version: packageInfo.version,
    package_dir: packageInfo.packageDir,
    install_script: packageInfo.install_script,
    prebuild,
    source_build_expected: sourceBuildExpected,
    error: load.ok ? null : load.error,
    fix: definition.fix || buildDefaultFix(definition.name, sourceBuildExpected),
  };
}

function resolvePackageInfo(packageName) {
  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return {
      packageDir: path.dirname(packageJsonPath),
      version: packageJson.version || null,
      install_script: packageJson.scripts && packageJson.scripts.install ? packageJson.scripts.install : null,
    };
  } catch (_error) {
    return {
      packageDir: null,
      version: null,
      install_script: null,
    };
  }
}

function inspectPrebuild(packageDir, platform, arch) {
  const prebuildsDir = path.join(packageDir, 'prebuilds');
  const expectedDir = `${platform}-${arch}`;
  if (!fs.existsSync(prebuildsDir)) {
    return {
      expected_dir: expectedDir,
      available: false,
      available_dirs: [],
    };
  }

  let availableDirs = [];
  try {
    availableDirs = fs.readdirSync(prebuildsDir)
      .filter((entry) => {
        try {
          return fs.statSync(path.join(prebuildsDir, entry)).isDirectory();
        } catch (_error) {
          return false;
        }
      })
      .sort();
  } catch (_error) {
    availableDirs = [];
  }

  return {
    expected_dir: expectedDir,
    available: availableDirs.includes(expectedDir),
    available_dirs: availableDirs,
  };
}

function probeRequire(packageName) {
  const script = [
    'try {',
    `  require(${JSON.stringify(packageName)});`,
    '  process.exit(0);',
    '} catch (error) {',
    '  process.stderr.write((error && error.code ? error.code + ": " : "") + (error && error.message ? error.message.split("\\n")[0] : String(error)));',
    '  process.exit(1);',
    '}',
  ].join('\n');
  const result = spawnSync(process.execPath, ['-e', script], {
    encoding: 'utf8',
    timeout: 5000,
  });

  if (result.status === 0) {
    return { ok: true, error: null };
  }

  return {
    ok: false,
    error: (result.stderr || result.error && result.error.message || 'module not loadable').trim(),
  };
}

function buildRecommendedActions({ crgStatus, modules, platform }) {
  if (crgStatus === 'ready') return [];

  const actions = [];
  const betterSqlite = modules.find((entry) => entry.name === 'better-sqlite3');
  if (betterSqlite && betterSqlite.status !== 'ready') {
    actions.push('Run `spec-first doctor --repair-native` to retry downloading the better-sqlite3 prebuild.');
    if (platform === 'win32') {
      actions.push('For restricted networks, run `spec-first doctor --repair-native --mirror=npmmirror`.');
      actions.push('If source build is required, install VS Build Tools 2022 with "Desktop development with C++" and run `spec-first doctor --repair-native --build-from-source`.');
    }
  }

  const kotlin = modules.find((entry) => entry.name === 'tree-sitter-kotlin');
  if (kotlin && kotlin.status !== 'ready') {
    actions.push('Kotlin parser is optional; without C++ build tools Kotlin files fall back to module-level indexing.');
  }

  return actions;
}

function buildDefaultFix(packageName, sourceBuildExpected) {
  if (sourceBuildExpected) {
    return `Run \`npm rebuild ${packageName}\` after installing C++ build tools.`;
  }
  return `Run \`npm rebuild ${packageName}\`.`;
}

function formatNativeSummary(diagnostics) {
  if (diagnostics.crg_status === 'ready') {
    return 'ready';
  }

  const unavailable = diagnostics.modules
    .filter((entry) => entry.status !== 'ready')
    .slice(0, 4)
    .map((entry) => `${entry.name}=${entry.status}`)
    .join(', ');
  const suffix = diagnostics.unavailable_modules.length > 4
    ? `, +${diagnostics.unavailable_modules.length - 4} more`
    : '';
  return `${diagnostics.crg_status} (${unavailable}${suffix})`;
}

function windowsBuildToolsHint() {
  if (process.platform !== 'win32') return null;

  const major = Number.parseInt(process.version.slice(1).split('.')[0], 10);
  if (major === 21) {
    return 'Node 21 is not recommended for CRG native modules; use Node 22/24 or install VS Build Tools 2022 for source builds.';
  }

  return 'Install VS Build Tools 2022 with "Desktop development with C++" when source builds are required.';
}

function hostMirrorEnv(mirror) {
  if (mirror === 'npmmirror') {
    return {
      npm_config_better_sqlite3_binary_host: 'https://registry.npmmirror.com/-/binary/better-sqlite3',
    };
  }
  return {};
}

function repairBetterSqliteNative(options = {}) {
  if (probeRequire('better-sqlite3').ok) {
    return {
      ok: true,
      method: 'already_ready',
      message: 'better-sqlite3 is already loadable.',
    };
  }

  const info = resolvePackageInfo('better-sqlite3');
  if (!info.packageDir) {
    return {
      ok: false,
      method: 'not_found',
      message: 'better-sqlite3 package is not installed.',
    };
  }

  const prebuildBin = findPrebuildInstallBin(info.packageDir);
  if (prebuildBin) {
    const prebuild = spawnSync(process.execPath, [prebuildBin, '--tag-prefix', 'v'], {
      cwd: info.packageDir,
      env: { ...process.env, ...hostMirrorEnv(options.mirror) },
      timeout: 60000,
      encoding: 'utf8',
    });
    if (prebuild.status === 0 && probeRequire('better-sqlite3').ok) {
      return {
        ok: true,
        method: options.mirror ? `prebuild:${options.mirror}` : 'prebuild',
        message: 'better-sqlite3 prebuild installed.',
      };
    }

    if (!options.buildFromSource) {
      return {
        ok: false,
        method: options.mirror ? `prebuild:${options.mirror}` : 'prebuild',
        message: firstNonEmptyLine(prebuild.stderr, prebuild.stdout) || 'prebuild download failed.',
      };
    }
  } else if (!options.buildFromSource) {
    return {
      ok: false,
      method: 'prebuild',
      message: 'prebuild-install is not available.',
    };
  }

  const rebuild = spawnSync('node-gyp', ['rebuild', '--release'], {
    cwd: info.packageDir,
    timeout: 120000,
    encoding: 'utf8',
    shell: true,
  });
  if (rebuild.status === 0 && probeRequire('better-sqlite3').ok) {
    return {
      ok: true,
      method: 'source',
      message: 'better-sqlite3 rebuilt from source.',
    };
  }

  return {
    ok: false,
    method: 'source',
    message: firstNonEmptyLine(rebuild.stderr, rebuild.stdout) || 'node-gyp rebuild failed.',
  };
}

function findPrebuildInstallBin(packageDir) {
  const searchPaths = [
    packageDir,
    path.join(packageDir, 'node_modules'),
    path.join(__dirname, '..', '..', 'node_modules'),
  ];
  try {
    return require.resolve('prebuild-install/bin.js', { paths: searchPaths });
  } catch (_error) {
    return null;
  }
}

function firstNonEmptyLine(...values) {
  for (const value of values) {
    const line = String(value || '')
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .find(Boolean);
    if (line) return line;
  }
  return '';
}

module.exports = {
  CRG_NATIVE_MODULES,
  buildNativeDiagnostics,
  formatNativeSummary,
  hostMirrorEnv,
  repairBetterSqliteNative,
  windowsBuildToolsHint,
};
