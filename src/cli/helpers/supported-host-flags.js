'use strict';

const { getSupportedPlatforms } = require('../adapters');

// usage/help 文案的宿主 flag 串统一从 registry 派生。解析层（DOCTOR_HOST_FLAGS、
// CLEAN_HOST_FLAGS、INIT_PLATFORM_CHOICES）早已派生；此前文案层 12 处手写字面量
// 是每次新增宿主时的手工同步点，漏改即产生 usage 与真实 flag 面不一致。
//
// styles:
//   'each'     -> [--claude] [--codex] ... [--pi]
//   'pipe'     -> [--claude|--codex|...|--pi]
//   'paren'    -> (--claude|--codex|...|--pi)
//   'slash'    -> `--claude` / `--codex` / ... / `--pi`
//   'plain'    -> --claude --codex ... --pi
//   'slashpipe'-> --claude/--codex/.../--pi
function formatSupportedHostFlags(style = 'each') {
  const flags = getSupportedPlatforms().map((platform) => `--${platform}`);
  switch (style) {
    case 'pipe':
      return `[${flags.join('|')}]`;
    case 'paren':
      return `(${flags.join('|')})`;
    case 'slash':
      return flags.map((flag) => `\`${flag}\``).join(' / ');
    case 'plain':
      return flags.join(' ');
    case 'slashpipe':
      return flags.join('/');
    case 'each':
    default:
      return `[${flags.join('] [')}]`;
  }
}

module.exports = { formatSupportedHostFlags };
