/**
 * Constitution 合规性校验器（C11）
 * 负责 constitution.md 的元数据、版本一致性、权威映射校验
 */
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { exists } from '../../shared/fs-utils.js';

export function evaluateConstitutionCompliance(
  featureId: string,
  projectRoot: string
): { pass: boolean; detail: string } {
  const constitutionPath = join(projectRoot, 'specs', featureId, 'constitution.md');
  if (!exists(constitutionPath)) {
    return {
      pass: false,
      detail: `C11 FAIL: constitution.md missing; fix: create specs/${featureId}/constitution.md with Version/Ratified/Last Amended/Amendment History`,
    };
  }

  const designPath = join(projectRoot, 'specs', featureId, 'design.md');
  if (!exists(designPath)) {
    return {
      pass: false,
      detail: `C11 FAIL: design.md missing; fix: create specs/${featureId}/design.md and add Constitution Clause references`,
    };
  }

  const constitution = readFileSync(constitutionPath, 'utf-8');
  const design = readFileSync(designPath, 'utf-8');

  const meta = parseConstitutionMeta(constitution);
  const failures: string[] = [];

  if (!meta.version) {
    failures.push('missing version');
  } else if (!/^\d+\.\d+\.\d+$/.test(meta.version.replace(/^v/i, ''))) {
    failures.push(`invalid version (${meta.version})`);
  }
  if (!meta.ratified) failures.push('missing ratified date');
  if (!meta.lastAmended) failures.push('missing last_amended date');
  if (!meta.hasAmendmentHistory) failures.push('missing amendment history section');
  if (!hasConstitutionReference(design, meta.version)) {
    failures.push('design.md missing constitution clause reference');
  }

  const mainCopy = evaluateConstitutionMainCopyConsistency(projectRoot, constitution, meta);
  if (!mainCopy.pass) {
    failures.push(...mainCopy.failures);
  }

  const authorityMapping = evaluateConstitutionAuthorityMapping(projectRoot);
  if (!authorityMapping.pass) {
    failures.push(...authorityMapping.failures);
  }

  if (failures.length > 0) {
    const fixes = getC11FailureFixHints(featureId, failures);
    return {
      pass: false,
      detail: `C11 FAIL: ${failures.join('; ')}; fix: ${fixes.join(' | ')}`,
    };
  }

  return {
    pass: true,
    detail: `C11 PASS: version=${meta.version}, ratified=${meta.ratified}, last_amended=${meta.lastAmended}, authority_mapping=ok`,
  };
}

export function getC11FailureFixHints(featureId: string, failures: string[]): string[] {
  const hints: string[] = [];
  const push = (hint: string) => {
    if (!hints.includes(hint)) hints.push(hint);
  };

  for (const failure of failures) {
    if (failure === 'missing version' || failure.startsWith('invalid version')) {
      push(`specs/${featureId}/constitution.md: set semantic Version (e.g. 1.0.0)`);
      continue;
    }
    if (failure === 'missing ratified date') {
      push(`specs/${featureId}/constitution.md: add Ratified date (YYYY-MM-DD)`);
      continue;
    }
    if (failure === 'missing last_amended date') {
      push(`specs/${featureId}/constitution.md: add Last Amended date (YYYY-MM-DD)`);
      continue;
    }
    if (failure === 'missing amendment history section') {
      push(`specs/${featureId}/constitution.md: add '## Amendment History' section`);
      continue;
    }
    if (failure === 'design.md missing constitution clause reference') {
      push(`specs/${featureId}/design.md: add 'Constitution Clause <id> (v<version>)' references`);
      continue;
    }
    if (failure === 'global constitution missing version') {
      push('.spec-first/constitution.md: set semantic Version (e.g. 1.1.0)');
      continue;
    }
    if (failure.startsWith('global constitution version mismatch')) {
      push(
        `specs/${featureId}/constitution.md: sync Version with .spec-first/constitution.md or add explicit override reason`
      );
      continue;
    }
    if (failure.startsWith('global constitution content mismatch')) {
      push(
        `specs/${featureId}/constitution.md: sync content with .spec-first/constitution.md or add explicit override reason`
      );
      continue;
    }
    if (failure === 'constitution-authority.md missing') {
      push(
        'skills/03-spec/references/constitution-authority.md: create authority mapping doc'
      );
      continue;
    }
    if (failure === 'constitution-authority.md missing Level 0-3 hierarchy') {
      push(
        'skills/03-spec/references/constitution-authority.md: add Level 0-3 hierarchy'
      );
      continue;
    }
    if (failure === 'constitution-authority.md missing conflict arbitration rule') {
      push(
        'skills/03-spec/references/constitution-authority.md: add conflict arbitration rule'
      );
      continue;
    }
    if (failure === '03-spec/SKILL.md missing') {
      push(
        'skills/03-spec/SKILL.md: restore skill doc and reference constitution-authority.md'
      );
      continue;
    }
    if (failure === '03-spec/SKILL.md missing constitution-authority reference') {
      push(
        'skills/03-spec/SKILL.md: add reference to references/constitution-authority.md'
      );
      continue;
    }
    if (failure === '04-design/SKILL.md missing') {
      push(
        'skills/04-design/SKILL.md: restore skill doc and reference constitution-authority.md'
      );
      continue;
    }
    if (failure === '04-design/SKILL.md missing constitution-authority reference') {
      push(
        'skills/04-design/SKILL.md: add reference to ../03-spec/references/constitution-authority.md'
      );
      continue;
    }
    if (failure === '08-review/SKILL.md missing') {
      push(
        'skills/08-review/SKILL.md: restore skill doc and reference constitution-authority.md'
      );
      continue;
    }
    if (failure === '08-review/SKILL.md missing constitution-authority reference') {
      push(
        'skills/08-review/SKILL.md: add reference to ../03-spec/references/constitution-authority.md'
      );
      continue;
    }
    push(`manual check required for: ${failure}`);
  }

  return hints.length > 0 ? hints : ['manual check required'];
}

function evaluateConstitutionAuthorityMapping(projectRoot: string): {
  pass: boolean;
  failures: string[];
} {
  const failures: string[] = [];
  const authorityRefPath = join(projectRoot, 'skills', '03-spec', 'references', 'constitution-authority.md');
  const specSkillPath = join(projectRoot, 'skills', '03-spec', 'SKILL.md');
  const designSkillPath = join(projectRoot, 'skills', '04-design', 'SKILL.md');
  const codeReviewSkillPath = join(projectRoot, 'skills', '08-review', 'SKILL.md');

  if (!exists(authorityRefPath)) {
    failures.push('constitution-authority.md missing');
  } else {
    const authorityRef = readFileSync(authorityRefPath, 'utf-8');
    const hasLevels = /Level\s*0[\s\S]*Level\s*1[\s\S]*Level\s*2[\s\S]*Level\s*3/i.test(
      authorityRef
    );
    const hasArbitrationRule = /(任意与\s*Constitution\s*冲突|any.*Constitution.*conflict)/i.test(
      authorityRef
    );
    if (!hasLevels) failures.push('constitution-authority.md missing Level 0-3 hierarchy');
    if (!hasArbitrationRule)
      failures.push('constitution-authority.md missing conflict arbitration rule');
  }

  if (!exists(specSkillPath)) {
    failures.push('03-spec/SKILL.md missing');
  } else if (!/constitution-authority\.md/i.test(readFileSync(specSkillPath, 'utf-8'))) {
    failures.push('03-spec/SKILL.md missing constitution-authority reference');
  }

  if (!exists(designSkillPath)) {
    failures.push('04-design/SKILL.md missing');
  } else if (!/constitution-authority\.md/i.test(readFileSync(designSkillPath, 'utf-8'))) {
    failures.push('04-design/SKILL.md missing constitution-authority reference');
  }

  if (!exists(codeReviewSkillPath)) {
    failures.push('08-review/SKILL.md missing');
  } else if (!/constitution-authority\.md/i.test(readFileSync(codeReviewSkillPath, 'utf-8'))) {
    failures.push('08-review/SKILL.md missing constitution-authority reference');
  }

  return { pass: failures.length === 0, failures };
}

function parseConstitutionMeta(content: string): {
  version?: string;
  ratified?: string;
  lastAmended?: string;
  hasAmendmentHistory: boolean;
} {
  const versionMatch = content.match(
    /(?:\*\*)?\s*(?:version|版本)\s*(?:\*\*)?\s*[:：]\s*([vV]?\d+\.\d+\.\d+)/i
  );
  const dateOrDateTime =
    '(\\d{4}-\\d{2}-\\d{2}(?:[T\\s]\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})?)?)';
  const ratifiedMatch = content.match(
    new RegExp(
      `(?:\\*\\*)?\\s*(?:ratified|批准日期|通过日期|生效日期)\\s*(?:\\*\\*)?\\s*[:：]\\s*${dateOrDateTime}`,
      'i'
    )
  );
  const amendedMatch = content.match(
    new RegExp(
      `(?:\\*\\*)?\\s*(?:last[_\\s-]*amended|最近修订|最后修订)\\s*(?:\\*\\*)?\\s*[:：]\\s*${dateOrDateTime}`,
      'i'
    )
  );
  const hasAmendmentHistory =
    /(?:^|\n)##\s*(amendment history|修订历史)\b/i.test(content) ||
    /(?:amendment history|修订历史)/i.test(content);
  return {
    version: versionMatch?.[1],
    ratified: ratifiedMatch?.[1],
    lastAmended: amendedMatch?.[1],
    hasAmendmentHistory,
  };
}

function evaluateConstitutionMainCopyConsistency(
  projectRoot: string,
  featureConstitution: string,
  featureMeta: { version?: string }
): { pass: boolean; failures: string[] } {
  const globalPath = join(projectRoot, '.spec-first', 'constitution.md');
  if (!exists(globalPath)) return { pass: true, failures: [] };

  const globalContent = readFileSync(globalPath, 'utf-8');
  const globalMeta = parseConstitutionMeta(globalContent);
  const failures: string[] = [];

  if (!globalMeta.version) {
    failures.push('global constitution missing version');
    return { pass: false, failures };
  }

  const globalVersion = normalizeSemver(globalMeta.version);
  const featureVersion = normalizeSemver(featureMeta.version);
  if (!globalVersion || !featureVersion) return { pass: failures.length === 0, failures };

  const hasOverrideReason = hasConstitutionOverrideReason(featureConstitution);

  if (globalVersion !== featureVersion) {
    if (!hasOverrideReason) {
      failures.push(
        `global constitution version mismatch (global=${globalVersion}, feature=${featureVersion})`
      );
    }
  }

  const globalHash = hashNormalizedConstitution(globalContent);
  const featureHash = hashNormalizedConstitution(featureConstitution);
  if (globalHash !== featureHash && !hasOverrideReason) {
    failures.push(
      `global constitution content mismatch (global_sha256=${globalHash}, feature_sha256=${featureHash})`
    );
  }

  return { pass: failures.length === 0, failures };
}

function normalizeSemver(version?: string): string | undefined {
  return version?.trim().replace(/^v/i, '');
}

function hasConstitutionOverrideReason(content: string): boolean {
  return /(feature\s*override|特例覆盖|覆盖原因|override\s*reason)/i.test(content);
}

function hashNormalizedConstitution(content: string): string {
  const normalized = content
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();
  return createHash('sha256').update(normalized).digest('hex');
}

function hasConstitutionReference(designContent: string, version?: string): boolean {
  const lines = designContent.split('\n');
  const hasClauseStyleRef = lines.some(
    (line) =>
      /(constitution|宪法)/i.test(line) &&
      /(clause|条款|principle|原则|version|版本|v\d+\.\d+\.\d+)/i.test(line)
  );
  if (hasClauseStyleRef) return true;

  if (version) {
    const normalized = version.replace(/^v/i, '');
    const byVersion = new RegExp(
      `(constitution|宪法)[^\\n]{0,48}(v)?${escapeRegExp(normalized)}`,
      'i'
    );
    if (byVersion.test(designContent)) return true;
  }

  return false;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
