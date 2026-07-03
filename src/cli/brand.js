const BrandColors = {
  brand: '\x1b[36m',
  write: '\x1b[32m',
  remove: '\x1b[31m',
  untrack: '\x1b[33m',
  secondary: '\x1b[2m',
  reset: '\x1b[0m',
};

// 厚重 block 字形(figlet ansi_shadow,"spec" / "-" / "first" 分段拼接),6 行矩形等宽。
// 连字符前后各留两列空格,使 spec、-、first 三段之间有清晰视觉空隙。
// 字符集仅 █(U+2588) 与 box-drawing(U+2550–U+255D),主流等宽终端稳定渲染。
const LOGO_LINES = [
  '███████╗██████╗ ███████╗ ██████╗          ███████╗██╗██████╗ ███████╗████████╗',
  '██╔════╝██╔══██╗██╔════╝██╔════╝          ██╔════╝██║██╔══██╗██╔════╝╚══██╔══╝',
  '███████╗██████╔╝█████╗  ██║       █████╗  █████╗  ██║██████╔╝███████╗   ██║   ',
  '╚════██║██╔═══╝ ██╔══╝  ██║       ╚════╝  ██╔══╝  ██║██╔══██╗╚════██║   ██║   ',
  '███████║██║     ███████╗╚██████╗          ██║     ██║██║  ██║███████║   ██║   ',
  '╚══════╝╚═╝     ╚══════╝ ╚═════╝          ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ',
];
const TAGLINE = 'AI coding harness for Claude Code, Codex, and Kiro';
// art 与品牌行左侧缩进,保持与分隔线对齐的呼吸感。
const INDENT = ' ';

function detectColorSupport() {
  if (Object.prototype.hasOwnProperty.call(process.env, 'NO_COLOR')) {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(process.env, 'FORCE_COLOR')) {
    return true;
  }
  if (process.stdout.isTTY !== true) {
    return false;
  }
  if (process.env.TERM === 'dumb') {
    return false;
  }
  return true;
}

function colorize(text, colorCode, useColor) {
  if (!useColor) {
    return text;
  }
  return `${colorCode}${text}${BrandColors.reset}`;
}

function versionText(version) {
  return `Spec-First v${version || 'unknown'}`;
}

// 分隔线宽度跟随实际内容宽度(art 最大行宽 / 版本行 / tagline 取 max),
// 版本号变长只会增大 contentWidth,上下两线同步等长,不会错位。
function computeContentWidth(version) {
  const artWidth = LOGO_LINES.reduce((max, line) => Math.max(max, [...line].length), 0);
  const candidates = [
    INDENT.length + artWidth,
    INDENT.length + versionText(version).length,
    INDENT.length + TAGLINE.length,
  ];
  return candidates.reduce((max, width) => Math.max(max, width), 0);
}

function renderFullArt(version, opts = {}) {
  const useColor = resolveUseColor(opts);
  const divider = colorize('─'.repeat(computeContentWidth(version)), BrandColors.brand, useColor);
  const lines = [
    divider,
    ...LOGO_LINES.map((line) => `${INDENT}${colorize(line, BrandColors.brand, useColor)}`),
    `${INDENT}${colorize(versionText(version), BrandColors.secondary, useColor)}`,
    `${INDENT}${colorize(TAGLINE, BrandColors.secondary, useColor)}`,
    divider,
  ];

  return `${lines.join('\n')}\n`;
}

function renderWordmark(version, opts = {}) {
  const useColor = resolveUseColor(opts);
  const prefix = colorize('─', BrandColors.brand, useColor);
  return `${prefix} ${colorize('spec-first', BrandColors.brand, useColor)} v${version || 'unknown'}`;
}

function resolveUseColor(opts) {
  if (Object.prototype.hasOwnProperty.call(opts, 'useColor')) {
    return opts.useColor === true;
  }
  return detectColorSupport();
}

module.exports = {
  BrandColors,
  colorize,
  detectColorSupport,
  renderFullArt,
  renderWordmark,
};
