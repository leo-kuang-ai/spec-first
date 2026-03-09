/**
 * Security Utilities - 安全相关工具函数
 */

// Feature ID 格式校验正则
const FEATURE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * 安全地提取并校验 featureId
 * @param {string} raw - 从 URL 解析的原始字符串
 * @returns {string|null} 校验通过的 featureId，或 null（校验失败）
 */
export function sanitizeFeatureId(raw) {
  if (!raw || typeof raw !== 'string') return null;

  // URL 解码
  let decoded;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null; // 无效的 URL 编码
  }

  // 正则校验：只允许字母、数字、下划线、短横线
  if (!FEATURE_ID_PATTERN.test(decoded)) return null;

  // 额外检查：拒绝路径遍历模式
  if (decoded.includes('..') || decoded.includes('/') || decoded.includes('\\')) {
    return null;
  }

  return decoded;
}

/**
 * HTML 转义，防止 XSS 攻击
 * @param {unknown} input - 需要转义的输入
 * @returns {string} 转义后的安全字符串
 */
export function escapeHtml(input) {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 校验 featureId 是否符合格式要求
 * @param {string} featureId
 * @returns {boolean}
 */
export function isValidFeatureId(featureId) {
  if (!featureId || typeof featureId !== 'string') return false;
  return FEATURE_ID_PATTERN.test(featureId);
}
