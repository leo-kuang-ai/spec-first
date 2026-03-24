import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  renderInputContextSection,
  injectInputContextToSkillMd,
  injectInputContextToAllSkills,
  type InjectResult,
} from '../../src/core/skill-runtime/skill-input-injector.js';
import type { SkillInputContract } from '../../src/core/skill-runtime/skill-input-contracts.js';

const TEST_DIR = join(import.meta.dirname, '__test_skill_injector__');
const SKILLS_DIR = join(TEST_DIR, 'skills');

function createTestSkillMd(skillName: string, content: string): string {
  const skillDir = join(SKILLS_DIR, `02-${skillName}`);
  mkdirSync(skillDir, { recursive: true });
  const skillMdPath = join(skillDir, 'SKILL.md');
  writeFileSync(skillMdPath, content, 'utf-8');
  return skillMdPath;
}

function createTestConfig(): void {
  mkdirSync(SKILLS_DIR, { recursive: true });
  writeFileSync(
    join(SKILLS_DIR, 'skill-input-contracts.yaml'),
    `
auto_inject: true
skip_injection:
  - first
  - init
defaults:
  required: [summary]
  recommended: []
  optional: []
descriptions:
  summary: 项目概览
  conventions: 编码规范
  api-contracts: API 契约
skills:
  code:
    required: [summary]
    recommended: [conventions]
    optional: [api-contracts]
  design:
    required: [summary]
    recommended: [structure-overview]
    optional: []
`,
    'utf-8'
  );
}

function cleanup(): void {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

describe('skill-input-injector', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('extractSkillNameFromPath (Windows compatibility)', () => {
    it('should handle Unix paths', () => {
      // 通过创建文件间接测试 extractSkillNameFromPath
      createTestConfig();
      const skillMdPath = createTestSkillMd(
        'code',
        `---
name: "spec-first:code"
---
# Skill: code`
      );

      const result = injectInputContextToSkillMd(skillMdPath, SKILLS_DIR);
      expect(result.skillName).toBe('code');
    });

    it('should handle Windows paths with backslashes', () => {
      createTestConfig();
      const skillMdPath = createTestSkillMd(
        'code',
        `---
name: "spec-first:code"
---
# Skill: code`
      );

      // 模拟 Windows 路径
      const windowsPath = skillMdPath.replace(/\//g, '\\');
      const result = injectInputContextToSkillMd(windowsPath, SKILLS_DIR);
      expect(result.skillName).toBe('code');
    });
  });

  describe('renderInputContextSection', () => {
    it('should render section with required, recommended, and optional assets', () => {
      const contract: SkillInputContract = {
        required: ['summary'],
        recommended: ['conventions'],
        optional: ['api-contracts'],
      };
      const descriptions = {
        summary: '项目概览',
        conventions: '编码规范',
        'api-contracts': 'API 契约',
      };

      const result = renderInputContextSection(contract, descriptions);

      expect(result).toContain('## 输入上下文');
      expect(result).toContain('`summary`');
      expect(result).toContain('**必需**');
      expect(result).toContain('项目概览');
      expect(result).toContain('推荐');
      expect(result).toContain('编码规范');
      expect(result).toContain('可选');
      expect(result).toContain('API 契约');
      expect(result).toContain('/spec-first:first');
    });

    it('should render section with only required assets', () => {
      const contract: SkillInputContract = {
        required: ['summary'],
        recommended: [],
        optional: [],
      };
      const descriptions = { summary: '项目概览' };

      const result = renderInputContextSection(contract, descriptions);

      expect(result).toContain('**必需**');
      expect(result).not.toContain('推荐');
      expect(result).not.toContain('可选');
    });
  });

  describe('injectInputContextToSkillMd', () => {
    it('should inject section to SKILL.md without existing section', () => {
      createTestConfig();
      const skillMdPath = createTestSkillMd(
        'code',
        `---
name: "spec-first:code"
description: "Code skill"
---

# Skill: code

## 触发条件

This is a code skill.
`
      );

      const result = injectInputContextToSkillMd(skillMdPath, SKILLS_DIR);

      expect(result.injected).toBe(true);
      expect(result.skillName).toBe('code');
      expect(result.reason).toBe('success');

      const content = readFileSync(skillMdPath, 'utf-8');
      expect(content).toContain('## 输入上下文');
      expect(content).toContain('`summary`');
    });

    it('should skip injection when section already exists', () => {
      createTestConfig();
      const skillMdPath = createTestSkillMd(
        'code',
        `---
name: "spec-first:code"
---

# Skill: code

## 输入上下文

Existing section.
`
      );

      const result = injectInputContextToSkillMd(skillMdPath, SKILLS_DIR);

      expect(result.injected).toBe(false);
      expect(result.reason).toContain('section already exists');
    });

    it('should override existing section with force option', () => {
      createTestConfig();
      const skillMdPath = createTestSkillMd(
        'code',
        `---
name: "spec-first:code"
---

# Skill: code

## 输入上下文

Old content to be replaced.
`
      );

      const result = injectInputContextToSkillMd(skillMdPath, SKILLS_DIR, { force: true });

      expect(result.injected).toBe(true);
      const content = readFileSync(skillMdPath, 'utf-8');
      expect(content).not.toContain('Old content to be replaced');
      expect(content).toContain('`summary`');
    });

    it('should skip skill in skip_injection list', () => {
      createTestConfig();
      const skillMdPath = createTestSkillMd(
        'first',
        `---
name: "spec-first:first"
---

# Skill: first

Content.
`
      );

      const result = injectInputContextToSkillMd(skillMdPath, SKILLS_DIR);

      expect(result.injected).toBe(false);
      expect(result.reason).toBe('in skip_injection list');
    });

    it('should return error when SKILL.md not found', () => {
      createTestConfig();
      const result = injectInputContextToSkillMd('/nonexistent/SKILL.md', SKILLS_DIR);

      expect(result.injected).toBe(false);
      expect(result.reason).toBe('SKILL.md not found');
    });

    it('should inject before first ## heading', () => {
      createTestConfig();
      const skillMdPath = createTestSkillMd(
        'code',
        `---
name: "spec-first:code"
---

# Skill: code

Some intro text.

## 触发条件

Trigger content.
`
      );

      injectInputContextToSkillMd(skillMdPath, SKILLS_DIR);

      const content = readFileSync(skillMdPath, 'utf-8');
      const inputContextPos = content.indexOf('## 输入上下文');
      const triggerPos = content.indexOf('## 触发条件');
      expect(inputContextPos).toBeLessThan(triggerPos);
    });
  });

  describe('injectInputContextToAllSkills', () => {
    it('should inject to all eligible skills', () => {
      createTestConfig();

      // Create multiple skills
      createTestSkillMd(
        'code',
        `---
name: "spec-first:code"
---
# Skill: code`
      );
      createTestSkillMd(
        'design',
        `---
name: "spec-first:design"
---
# Skill: design`
      );
      createTestSkillMd(
        'first',
        `---
name: "spec-first:first"
---
# Skill: first`
      );

      const results = injectInputContextToAllSkills(SKILLS_DIR);

      expect(results.length).toBe(3);
      const injected = results.filter((r) => r.injected);
      const skipped = results.filter((r) => !r.injected);
      expect(injected.length).toBe(2); // code and design
      expect(skipped.length).toBe(1); // first (in skip_injection)
      expect(skipped[0].skillName).toBe('first');
    });

    it('should filter by skills option', () => {
      createTestConfig();

      createTestSkillMd(
        'code',
        `---
name: "spec-first:code"
---
# Skill: code`
      );
      createTestSkillMd(
        'design',
        `---
name: "spec-first:design"
---
# Skill: design`
      );

      const results = injectInputContextToAllSkills(SKILLS_DIR, {
        skills: ['code'],
      });

      expect(results.length).toBe(1);
      expect(results[0].skillName).toBe('code');
    });

    it('should handle force option', () => {
      createTestConfig();

      createTestSkillMd(
        'code',
        `---
name: "spec-first:code"
---

# Skill: code

## 输入上下文

Old content.
`
      );

      const results = injectInputContextToAllSkills(SKILLS_DIR, { force: true });

      expect(results[0].injected).toBe(true);
    });
  });
});
