/**
 * First Index 单元测试
 * @see 00-first skill 产物索引管理
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getIndexFilePath,
  indexExists,
  readIndex,
  writeIndex,
  createIndex,
  updateProductInIndex,
  getProductEntry,
  listIndexedProducts,
  isIndexStale,
  markIndexStale,
  clearStaleMark,
  deleteIndex,
  formatIndexSummary,
  type ProductIndex,
} from '../../src/core/skill-runtime/first-index.js';

const TEST_DIR = join(import.meta.dirname, '../fixtures/first-index');

describe('getIndexFilePath', () => {
  it('返回正确的索引文件路径', () => {
    const path = getIndexFilePath('docs/first');
    expect(path).toContain('.index.yaml');
    expect(path).toContain('docs/first');
  });
});

describe('indexExists', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('索引文件不存在返回 false', () => {
    expect(indexExists(TEST_DIR)).toBe(false);
  });

  it('索引文件存在返回 true', () => {
    writeFileSync(join(TEST_DIR, '.index.yaml'), 'version: 1.0.0\n');
    expect(indexExists(TEST_DIR)).toBe(true);
  });
});

describe('readIndex & writeIndex', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('写入并读取索引', () => {
    const index: ProductIndex = {
      version: '1.0.0',
      last_run: '2026-03-02T12:00:00Z',
      mode: 'quick',
      platform_type: 'backend',
      git_commit: 'abc1234',
      products: {
        'tech-stack.md': {
          mode: 'quick',
          last_updated: '2026-03-02T12:00:00Z',
          file_hash: 'hash123',
        },
      },
    };

    writeIndex(TEST_DIR, index);
    expect(indexExists(TEST_DIR)).toBe(true);

    const read = readIndex(TEST_DIR);
    expect(read).toEqual(index);
  });

  it('读取不存在的索引返回 null', () => {
    const read = readIndex(TEST_DIR);
    expect(read).toBeNull();
  });

  it('读取损坏的索引返回 null', () => {
    writeFileSync(join(TEST_DIR, '.index.yaml'), 'invalid: yaml: content');
    const read = readIndex(TEST_DIR);
    expect(read).toBeNull();
  });
});

describe('createIndex', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('创建 quick 模式索引', () => {
    const index = createIndex({
      firstDir: TEST_DIR,
      mode: 'quick',
      platformType: 'backend',
      projectName: 'test-project',
      gitCommit: 'abc1234',
      products: [
        { name: 'tech-stack.md', fileHash: 'hash1', mode: 'quick' },
        { name: 'api-docs.md', fileHash: 'hash2', mode: 'quick' },
      ],
    });

    expect(index.version).toBe('1.0.0');
    expect(index.mode).toBe('quick');
    expect(index.platform_type).toBe('backend');
    expect(index.project_name).toBe('test-project');
    expect(index.git_commit).toBe('abc1234');
    expect(index.products['tech-stack.md']).toEqual({
      mode: 'quick',
      last_updated: expect.any(String),
      file_hash: 'hash1',
      healthy: true,
    });
  });

  it('创建时不包含 products 仍有效', () => {
    const index = createIndex({
      firstDir: TEST_DIR,
      mode: 'deep',
    });

    expect(index.products).toEqual({});
  });
});

describe('updateProductInIndex', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('更新现有产物的字段', () => {
    const index = createIndex({
      firstDir: TEST_DIR,
      mode: 'quick',
      products: [
        { name: 'tech-stack.md', fileHash: 'oldhash', mode: 'quick' },
      ],
    });

    const updated = updateProductInIndex(TEST_DIR, 'tech-stack.md', {
      file_hash: 'newhash',
      healthy: false,
    });

    expect(updated?.products['tech-stack.md'].file_hash).toBe('newhash');
    expect(updated?.products['tech-stack.md'].healthy).toBe(false);
  });

  it('更新不存在的产物创建新条目', () => {
    createIndex({ firstDir: TEST_DIR, mode: 'quick' });

    const updated = updateProductInIndex(TEST_DIR, 'new-product.md', {
      file_hash: 'hash123',
    });

    expect(updated?.products['new-product.md']).toBeDefined();
  });

  it('索引不存在时返回 null', () => {
    const updated = updateProductInIndex(TEST_DIR, 'tech-stack.md', {
      file_hash: 'hash',
    });
    expect(updated).toBeNull();
  });
});

describe('getProductEntry', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('获取存在的产物条目', () => {
    createIndex({
      firstDir: TEST_DIR,
      mode: 'quick',
      products: [
        { name: 'tech-stack.md', fileHash: 'hash1', mode: 'quick' },
      ],
    });

    const entry = getProductEntry(TEST_DIR, 'tech-stack.md');
    expect(entry).toEqual({
      mode: 'quick',
      last_updated: expect.any(String),
      file_hash: 'hash1',
      healthy: true,
    });
  });

  it('获取不存在的产物返回 null', () => {
    createIndex({ firstDir: TEST_DIR, mode: 'quick' });

    const entry = getProductEntry(TEST_DIR, 'nonexistent.md');
    expect(entry).toBeNull();
  });

  it('索引不存在时返回 null', () => {
    const entry = getProductEntry(TEST_DIR, 'tech-stack.md');
    expect(entry).toBeNull();
  });
});

describe('listIndexedProducts', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('列出所有已索引的产物', () => {
    createIndex({
      firstDir: TEST_DIR,
      mode: 'quick',
      products: [
        { name: 'tech-stack.md', fileHash: 'h1', mode: 'quick' },
        { name: 'api-docs.md', fileHash: 'h2', mode: 'quick' },
      ],
    });

    const products = listIndexedProducts(TEST_DIR);
    expect(products).toEqual(['tech-stack.md', 'api-docs.md']);
  });

  it('索引不存在返回空数组', () => {
    const products = listIndexedProducts(TEST_DIR);
    expect(products).toEqual([]);
  });
});

describe('isIndexStale', () => {
  it('7 天内的索引不是过期', () => {
    const index: ProductIndex = {
      version: '1.0.0',
      last_run: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      mode: 'quick',
      products: {},
    };

    const result = isIndexStale(index);
    expect(result.stale).toBe(false);
  });

  it('超过 7 天的索引是过期', () => {
    const index: ProductIndex = {
      version: '1.0.0',
      last_run: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      mode: 'quick',
      products: {},
    };

    const result = isIndexStale(index);
    expect(result.stale).toBe(true);
    expect(result.reason).toContain('10 天');
  });

  it('commit 不匹配是过期', () => {
    const index: ProductIndex = {
      version: '1.0.0',
      last_run: new Date().toISOString(),
      mode: 'quick',
      git_commit: 'abc1234',
      products: {},
    };

    const result = isIndexStale(index, 'xyz5678');
    expect(result.stale).toBe(true);
    expect(result.reason).toContain('不匹配');
  });
});

describe('markIndexStale & clearStaleMark', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('标记索引为过期', () => {
    createIndex({ firstDir: TEST_DIR, mode: 'quick' });

    const updated = markIndexStale(TEST_DIR, '测试过期原因');

    expect(updated?.status).toBe('stale');
    expect(updated?.stale_reason).toBe('测试过期原因');

    const read = readIndex(TEST_DIR);
    expect(read?.status).toBe('stale');
  });

  it('清除过期标记', () => {
    createIndex({ firstDir: TEST_DIR, mode: 'quick' });
    markIndexStale(TEST_DIR, '原因');

    const cleared = clearStaleMark(TEST_DIR);

    expect(cleared?.status).toBe('current');
    expect(cleared?.stale_reason).toBeUndefined();

    const read = readIndex(TEST_DIR);
    expect(read?.status).toBe('current');
  });
});

describe('deleteIndex', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('删除存在的索引文件', () => {
    createIndex({ firstDir: TEST_DIR, mode: 'quick' });

    const deleted = deleteIndex(TEST_DIR);

    expect(deleted).toBe(true);
    expect(indexExists(TEST_DIR)).toBe(false);
  });

  it('删除不存在的索引返回 false', () => {
    const deleted = deleteIndex(TEST_DIR);
    expect(deleted).toBe(false);
  });
});

describe('formatIndexSummary', () => {
  it('格式化索引摘要', () => {
    const index: ProductIndex = {
      version: '1.0.0',
      last_run: '2026-03-02T12:00:00Z',
      mode: 'quick',
      platform_type: 'backend',
      project_name: 'my-project',
      git_commit: 'abc1234def5678',
      git_branch: 'main',
      products: {
        'tech-stack.md': {
          mode: 'quick',
          last_updated: '2026-03-02T11:00:00Z',
          file_hash: 'hash1',
        },
        'api-docs.md': {
          mode: 'quick',
          last_updated: '2026-03-02T11:30:00Z',
          file_hash: 'hash2',
        },
      },
    };

    const summary = formatIndexSummary(index);

    expect(summary).toContain('产物索引摘要');
    expect(summary).toContain('quick');
    expect(summary).toContain('backend');
    expect(summary).toContain('my-project');
    expect(summary).toContain('abc1234');
    expect(summary).toContain('2 个');
  });
});
