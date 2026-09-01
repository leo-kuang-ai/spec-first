'use strict';

const { getGlobalDeveloperPath, readDeveloperFile } = require('./developer');

const DEFAULT_CLI_LANG = 'zh';

// CLI 命令的用户语言解析：全局 developer profile 的 lang（init 时写入）优先，
// 缺失、损坏或尚未 init 时回退中文。只读一个小文件，无网络、无交互、无副作用，
// 因此失败静默回退——语言选择永远不应让命令本身失败。
function resolveUserLanguage(options = {}) {
  const readProfile = options.readProfile
    || (() => readDeveloperFile(getGlobalDeveloperPath()));
  try {
    const profile = readProfile();
    if (profile && (profile.lang === 'zh' || profile.lang === 'en')) {
      return profile.lang;
    }
  } catch (_) {
    // profile 不可读时使用默认语言即可，不阻塞命令输出。
  }
  return DEFAULT_CLI_LANG;
}

module.exports = {
  DEFAULT_CLI_LANG,
  resolveUserLanguage,
};
