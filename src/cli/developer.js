const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSyncWithTimeout } = require('./external-command');

const GLOBAL_DEVELOPER_RELATIVE_PATH = path.join('.spec-first', '.developer');
const PROJECT_VERSION = require('../../package.json').version;
const SUPPORTED_LANGS = new Set(['zh', 'en']);

function getGlobalDeveloperPath() {
  return path.join(os.homedir(), GLOBAL_DEVELOPER_RELATIVE_PATH);
}

function readDeveloperFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  const contents = fs.readFileSync(filePath, 'utf8');
  return parseDeveloperContents(contents);
}

function parseDeveloperContents(contents) {
  if (typeof contents !== 'string') {
    return null;
  }

  const developer = {};
  for (const line of contents.split(/\r?\n/)) {
    if (!line || line.trim().length === 0) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key || !value) {
      continue;
    }

    developer[key] = value;
  }

  return normalizeDeveloper(developer);
}

function resolveDeveloperIdentity(projectRoot, options = {}) {
  const explicitName = normalizeName(options.user);
  const explicitLang = normalizeLang(options.lang);
  const globalDeveloper = readDeveloperFile(getGlobalDeveloperPath());
  const gitUserName = readGitUserName(projectRoot);

  const name =
    explicitName ||
    (globalDeveloper && globalDeveloper.name) ||
    gitUserName;
  const lang =
    explicitLang ||
    (globalDeveloper && globalDeveloper.lang) ||
    'zh';

  if (!name) {
    throw new Error(
      'Unable to determine developer name. Run `spec-first init` in an interactive terminal and choose a developer name, or pass `-u <name>` for non-interactive setup.',
    );
  }

  if (!SUPPORTED_LANGS.has(lang)) {
    throw new Error(`Unsupported developer language: ${lang}. Expected zh or en.`);
  }

  const developer = {
    name,
    lang,
    initializedAt: new Date().toISOString(),
    version: PROJECT_VERSION,
  };
  if (globalDeveloper && typeof globalDeveloper.syncUserLanguage === 'boolean') {
    developer.syncUserLanguage = globalDeveloper.syncUserLanguage;
  }
  return developer;
}

function writeGlobalDeveloperFile(developer) {
  const filePath = getGlobalDeveloperPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, formatDeveloperContents(developer), 'utf8');
}

function formatDeveloperContents(developer) {
  const normalized = normalizeDeveloper(developer);
  if (!normalized) {
    throw new Error('Developer record must be a non-empty object.');
  }

  const lines = [
    `name=${normalized.name}`,
    `lang=${normalized.lang}`,
    `initialized_at=${normalized.initializedAt}`,
    `version=${normalized.version}`,
  ];
  if (normalized.hosts.length > 0) {
    lines.push(`hosts=${normalized.hosts.join(',')}`);
  }
  if (typeof normalized.syncUserLanguage === 'boolean') {
    lines.push(`sync_user_language=${normalized.syncUserLanguage ? 'true' : 'false'}`);
  }
  return `${lines.join('\n')}\n`;
}

function normalizeDeveloper(raw) {
  const safe = raw && typeof raw === 'object' ? raw : {};
  const name = normalizeName(safe.name);
  const lang = normalizeLang(safe.lang);
  const initializedAt = normalizeText(safe.initializedAt || safe.initialized_at);
  const version = normalizeText(safe.version);
  const hosts = normalizeHosts(safe.hosts);
  const syncUserLanguage = normalizeSyncUserLanguage(
    Object.prototype.hasOwnProperty.call(safe, 'syncUserLanguage')
      ? safe.syncUserLanguage
      : safe.sync_user_language,
  );

  if (
    !name &&
    !lang &&
    !initializedAt &&
    !version &&
    hosts.length === 0 &&
    typeof syncUserLanguage !== 'boolean'
  ) {
    return null;
  }

  return {
    name: name || '',
    lang: lang || '',
    initializedAt: initializedAt || '',
    version: version || '',
    hosts,
    syncUserLanguage,
  };
}

// hosts 字段:接受数组或逗号分隔字符串,去空白、去重、稳定排序。
// 此处不按受支持 host 集合过滤——过滤在 init 读取侧按 INIT_PLATFORM_CHOICES 进行,
// 避免 developer.js 反向依赖 commands/init.js。
function normalizeHosts(value) {
  const raw = Array.isArray(value)
    ? value
    : (typeof value === 'string' ? value.split(',') : []);
  const cleaned = raw
    .map((entry) => normalizeText(entry))
    .filter((entry) => entry.length > 0);
  return [...new Set(cleaned)].sort((a, b) => a.localeCompare(b));
}

function normalizeName(value) {
  const text = normalizeText(value);
  return text || '';
}

function normalizeLang(value) {
  const text = normalizeText(value);
  return text || '';
}

function normalizeSyncUserLanguage(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  const text = normalizeText(value).toLowerCase();
  if (text === 'true') {
    return true;
  }
  if (text === 'false') {
    return false;
  }
  return null;
}

function normalizeText(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

function readGitUserName(projectRoot) {
  const result = spawnSyncWithTimeout('git', ['config', 'user.name'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return '';
  }

  return normalizeText(result.stdout);
}

module.exports = {
  formatDeveloperContents,
  getGlobalDeveloperPath,
  parseDeveloperContents,
  readDeveloperFile,
  readGitUserName,
  resolveDeveloperIdentity,
  writeGlobalDeveloperFile,
};
