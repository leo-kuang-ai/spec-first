/**
 * hash-registry 模板哈希注册表测试 (TEST-COV-003)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  computeTemplateHashes,
  loadHashRegistry,
  saveHashRegistry,
  compareHashes,
  getChangedTemplates,
} from '../../src/core/template/hash-registry.js';
import type { TemplateHashRegistry } from '../../src/core/template/hash-registry.js';

const TMP = join(process.cwd(), 'tests', 'fixtures', 'hash-registry-test');

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('hash-registry', () => {
  describe('computeTemplateHashes', () => {
    it('扫描 .hbs 文件并计算哈希', async () => {
      writeFileSync(join(TMP, 'a.hbs'), 'hello');
      writeFileSync(join(TMP, 'b.hbs'), 'world');
      writeFileSync(join(TMP, 'c.txt'), 'ignored');
      const hashes = await computeTemplateHashes(TMP, TMP);
      expect(Object.keys(hashes)).toHaveLength(2);
      expect(hashes['a']).toBeDefined();
      expect(hashes['b']).toBeDefined();
      expect(hashes['a'].hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('递归扫描子目录', async () => {
      mkdirSync(join(TMP, 'sub'), { recursive: true });
      writeFileSync(join(TMP, 'sub', 'deep.hbs'), 'nested');
      const hashes = await computeTemplateHashes(TMP, TMP);
      expect(hashes['sub/deep']).toBeDefined();
    });

    it('不存在的目录返回空', async () => {
      const hashes = await computeTemplateHashes(join(TMP, 'nope'), TMP);
      expect(Object.keys(hashes)).toHaveLength(0);
    });

    it('config 模板分类为 Critical', async () => {
      writeFileSync(join(TMP, 'config.hbs'), 'cfg');
      const hashes = await computeTemplateHashes(TMP, TMP);
      expect(hashes['config'].level).toBe('Critical');
    });
  });

  describe('loadHashRegistry / saveHashRegistry', () => {
    it('不存在时返回空注册表', async () => {
      const reg = await loadHashRegistry(TMP);
      expect(reg.version).toBe('1.0.0');
      expect(Object.keys(reg.templates)).toHaveLength(0);
    });

    it('保存后可加载', async () => {
      const reg: TemplateHashRegistry = {
        version: '1.0.0',
        generated: '',
        templates: { foo: { hash: 'abc', level: 'Minor', lastModified: '' } },
      };
      mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
      await saveHashRegistry(reg, TMP);
      const loaded = await loadHashRegistry(TMP);
      expect(loaded.templates['foo'].hash).toBe('abc');
    });
  });

  describe('compareHashes', () => {
    const old: TemplateHashRegistry = {
      version: '1.0.0', generated: '',
      templates: {
        same: { hash: 'aaa', level: 'Minor', lastModified: '' },
        changed: { hash: 'bbb', level: 'Major', lastModified: '' },
        removed: { hash: 'ccc', level: 'Minor', lastModified: '' },
      },
    };
    const newer: TemplateHashRegistry = {
      version: '1.0.0', generated: '',
      templates: {
        same: { hash: 'aaa', level: 'Minor', lastModified: '' },
        changed: { hash: 'ddd', level: 'Major', lastModified: '' },
        added: { hash: 'eee', level: 'Critical', lastModified: '' },
      },
    };

    it('检测新增/修改/删除/未变更', () => {
      const diff = compareHashes(old, newer);
      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].template).toBe('added');
      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].template).toBe('changed');
      expect(diff.deleted).toHaveLength(1);
      expect(diff.deleted[0].template).toBe('removed');
      expect(diff.unchanged).toHaveLength(1);
    });
  });

  describe('getChangedTemplates', () => {
    it('合并 added + modified + deleted', () => {
      const diff = { added: [{ template: 'a' }], modified: [{ template: 'b' }], deleted: [{ template: 'c' }], unchanged: [{ template: 'd' }] } as any;
      expect(getChangedTemplates(diff)).toHaveLength(3);
    });
  });
});
