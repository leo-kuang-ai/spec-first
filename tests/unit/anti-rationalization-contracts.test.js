'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SECTION_HEADING = '## Anti-Rationalization Red Flags';
const BEST_EFFORT_STATEMENT = '这是注意力提醒,不是 gate,也不替代 LLM 判断;最终是否停下、如何处理仍由你按当前证据决定。';

const TARGETS = [
  {
    skill: 'spec-work',
    filePath: 'skills/spec-work/SKILL.md',
    minRows: 3,
  },
  {
    skill: 'spec-debug',
    filePath: 'skills/spec-debug/SKILL.md',
    minRows: 3,
  },
  {
    skill: 'spec-code-review',
    filePath: 'skills/spec-code-review/SKILL.md',
    exactRows: 3,
  },
];

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function markdownSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.trim() === heading);
  if (startIndex === -1) {
    throw new Error(`Missing markdown section: ${heading}`);
  }

  const startLevel = heading.match(/^#+/)[0].length;
  const nextIndex = lines.findIndex((line, index) => {
    if (index <= startIndex) return false;
    const match = line.match(/^(#+)\s+/);
    return match && match[1].length <= startLevel;
  });
  const endIndex = nextIndex === -1 ? lines.length : nextIndex;

  return lines.slice(startIndex, endIndex).join('\n');
}

function tableColumns(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return null;
  }
  const columns = trimmed.split('|').slice(1, -1).map((column) => column.trim());
  if (columns.every((column) => /^:?-{3,}:?$/.test(column))) {
    return null;
  }
  return columns;
}

function antiRationalizationRows(section) {
  return section
    .split(/\r?\n/)
    .map(tableColumns)
    .filter((columns) => columns && columns.length === 2)
    .filter(([first, second]) => first !== '红旗念头' && second !== '停下来做什么');
}

describe('anti-rationalization workflow prose contracts', () => {
  test.each(TARGETS)('$skill has a scoped anti-rationalization section', ({ filePath }) => {
    const skill = read(filePath);

    expect(skill).toContain(SECTION_HEADING);
    expect(markdownSection(skill, SECTION_HEADING)).toContain(BEST_EFFORT_STATEMENT);
  });

  test.each(TARGETS)('$skill keeps the expected table data-row count', ({ filePath, minRows, exactRows }) => {
    const section = markdownSection(read(filePath), SECTION_HEADING);
    const rows = antiRationalizationRows(section);

    if (exactRows !== undefined) {
      expect(rows).toHaveLength(exactRows);
    } else {
      expect(rows.length).toBeGreaterThanOrEqual(minRows);
    }
  });
});
