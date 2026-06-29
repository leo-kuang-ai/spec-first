'use strict';

const RUNTIME_PATH_PATTERN = '(?:\\.claude(?:/|\\b)|\\.codex(?:/|\\b)|\\.agents/skills(?:/|\\b))';
const EN_RUNTIME_WRITE_VERB_PATTERN = '(?:^|[\\s`"(\\[])(?:modify|write|edit|patch|overwrite|fix|update|change|repair)\\b(?![-\\w])';
const ZH_RUNTIME_WRITE_VERB_PATTERN = '(?:修改|编辑|覆盖|修复|更新|手改|写入|改动|直接改)';
const RUNTIME_WRITE_VERB_PATTERN = `(?:${EN_RUNTIME_WRITE_VERB_PATTERN}|${ZH_RUNTIME_WRITE_VERB_PATTERN})`;

const DANGEROUS_PATTERNS = [
	  {
	    code: 'REMOTE_SCRIPT_PIPE',
	    severity: 'P0',
	    category: 'security',
	    regex: /(?:\b(?:curl|wget)\b[^\n|]*\|\s*(?:sudo\s+)?(?:bash|sh)\b|\b(?:irm|iwr|Invoke-RestMethod|Invoke-WebRequest)\b[^\n|]*\|\s*(?:iex|Invoke-Expression)\b)/i,
	    title: 'Remote script pipe execution',
	    recommendation: 'Require explicit human confirmation and avoid piping remote content directly into a shell.',
	  },
  {
	    code: 'SECRET_READ',
	    severity: 'P1',
	    category: 'security',
	    regex: /(?:\.ssh\b|id_rsa\b|(?:^|[\s"'`\/\\=])\.env(?:\b|[.*_-])|wallet|browser profile|Google\/Chrome|Login Data)/i,
	    title: 'Potential secret or credential access',
	    recommendation: 'Do not read credentials, browser profiles, wallet data, or environment secrets during skill execution.',
	  },
  {
    code: 'GENERATED_RUNTIME_WRITE',
    severity: 'P0',
    category: 'runtime_governance',
    regex: new RegExp(`(?:${RUNTIME_WRITE_VERB_PATTERN}[^\\n]*${RUNTIME_PATH_PATTERN}|${RUNTIME_PATH_PATTERN}[^\\n]*${RUNTIME_WRITE_VERB_PATTERN})`, 'i'),
    title: 'Generated runtime assets may be modified directly',
    recommendation: 'Modify source-of-truth files and rerun init instead of editing generated runtime assets.',
  },
  {
    code: 'IGNORE_GOVERNANCE',
    severity: 'P0',
    category: 'instruction_security',
    regex: /(?:ignore (?:all )?(?:previous|system) instructions|bypass governance|disable guardrails|绕过(?:治理|规则)|忽略(?:系统|治理)指令)/i,
    title: 'Instruction attempts to bypass governance',
    recommendation: 'Remove instructions that ask the agent to ignore system, developer, or governance rules.',
  },
  {
    code: 'DESTRUCTIVE_RM',
    severity: 'P1',
    category: 'security',
    regex: /\brm\s+-[^\n]*r[^\n]*f\b/i,
    title: 'Destructive recursive remove command',
    recommendation: 'Avoid destructive deletion commands or require explicit scoped confirmation.',
  },
  {
    code: 'SUDO_USAGE',
    severity: 'P1',
    category: 'security',
    regex: /\bsudo\b/i,
    title: 'Privileged command usage',
    recommendation: 'Avoid privileged commands in skill automation unless the user explicitly requests them.',
  },
  {
    code: 'CHMOD_777',
    severity: 'P1',
    category: 'security',
    regex: /\bchmod\s+-R\s+777\b/i,
    title: 'Over-broad file permission change',
    recommendation: 'Use the narrowest required permission change and avoid recursive world-writable permissions.',
  },
  {
    code: 'UPLOAD_SECRETS',
    severity: 'P0',
    category: 'security',
    regex: /\b(?:upload|exfiltrate|send|post)\b[^\n]*(?:secret|token|credential|private key|ssh key)/i,
    title: 'Potential secret exfiltration instruction',
    recommendation: 'Never upload or transmit secrets from the user workspace.',
  },
];

const PROHIBITION_HINTS = [
  /\bdo not\b/i,
  /\bnever\b/i,
  /\bavoid\b/i,
  /\bmust not\b/i,
  /\bwill not\b/i,
  /\bforbid/i,
  /禁止/,
  /不要/,
  /不得/,
  /避免/,
  /不允许/,
  /只建议/,
];

// 边界说明词：声明路径"不是"source 或"排除"这些路径
// 仅在当前行不含"动词直接指向 runtime 路径"时降级，防止混合行误降
const BOUNDARY_HINTS = [
  /\bare not\b/i,
  /\bdoes not\b/i,
  /\bexcludes?\b/i,
  /\bnot source\b/i,
  /\bnot owned\b/i,
];

// 写入动词直接指向 runtime 路径（动词在前→路径在后）。
// 只守 verb-before-path 形态:这是真实危险写入指令的常见形态（"edit .claude/x"、"overwrite .codex/y"）。
// 不扩展到 path-before-verb 双向匹配——因为 runtime 边界 prose 普遍是 "path ... are not source.
// If scripts change, update source first" 形态（路径在前、动词在后但动词宾语是 source 而非 runtime path），
// 双向匹配会把这类合法边界说明误判为 actionable，重新打破 R-01 的核心降级目标。
// 取舍:宁可漏掉罕见的 path-before-verb 危险指令（仍可被其他 dangerous pattern 或 review 捕获），
// 也不重新淹没高频边界 prose。
const DIRECT_WRITE_TO_RUNTIME = new RegExp(
  `${EN_RUNTIME_WRITE_VERB_PATTERN}[^\\n]*${RUNTIME_PATH_PATTERN}`,
  'i'
);

function classifyPatternContext(line) {
  const text = String(line || '');

  if (PROHIBITION_HINTS.some((hint) => hint.test(text))) {
    return {
      context: 'prohibited_pattern',
      severityOverride: 'P3',
      confidence: 'medium',
    };
  }

  // 边界说明词仅在行内无"写入动词直接指向 runtime 路径"时降级，防止混合行误降
  if (BOUNDARY_HINTS.some((hint) => hint.test(text)) && !DIRECT_WRITE_TO_RUNTIME.test(text)) {
    return {
      context: 'prohibited_pattern',
      severityOverride: 'P3',
      confidence: 'medium',
    };
  }

  if (/^\s*[-*]\s+/.test(text) && /pattern|风险|高危|danger|threat/i.test(text)) {
    return {
      context: 'documented_pattern',
      severityOverride: 'P3',
      confidence: 'medium',
    };
  }

  if (/^\s*(?:code|regex|title|recommendation|category|severity):/.test(text)) {
    return {
      context: 'documented_pattern',
      severityOverride: 'P3',
      confidence: 'medium',
    };
  }

  return {
    context: 'actionable_pattern',
    severityOverride: null,
    confidence: 'high',
  };
}

module.exports = {
  classifyPatternContext,
  DANGEROUS_PATTERNS,
  BOUNDARY_HINTS,
};
