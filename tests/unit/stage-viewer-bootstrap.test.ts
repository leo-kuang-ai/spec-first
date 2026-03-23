import { describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  clearViewerStateFile,
  isStateHealthy,
  isViewerRootHtmlHealthy,
} from '../../scripts/stage-viewer/bootstrap.js';

describe('stage viewer bootstrap health checks', () => {
  it('should reject the missing-index error body and accept the viewer page body', () => {
    expect(isViewerRootHtmlHealthy('<html><h1>Spec-First Viewer</h1></html>')).toBe(true);
    expect(isViewerRootHtmlHealthy('stage viewer index.html missing')).toBe(false);
  });

  it('should require both an open port and a healthy viewer root page', async () => {
    const portOpen = vi.fn(async () => true);
    const rootProbe = vi.fn(async () => false);

    const healthy = await isStateHealthy(
      { projectRoot: '/tmp/project', host: '127.0.0.1', port: 51232 },
      '/tmp/project',
      { portOpen, rootProbe },
    );

    expect(healthy).toBe(false);
    expect(portOpen).toHaveBeenCalledWith('127.0.0.1', 51232);
    expect(rootProbe).toHaveBeenCalledWith('127.0.0.1', 51232);
  });

  it('should accept state only when both checks pass', async () => {
    const portOpen = vi.fn(async () => true);
    const rootProbe = vi.fn(async () => true);

    const healthy = await isStateHealthy(
      { projectRoot: '/tmp/project', host: '127.0.0.1', port: 51128 },
      '/tmp/project',
      { portOpen, rootProbe },
    );

    expect(healthy).toBe(true);
  });

  it('should clear stale viewer state files', () => {
    const tmpDir = join(import.meta.dirname, '../../tests/fixtures/.tmp-stage-viewer-bootstrap');
    const stateFile = join(tmpDir, 'viewer-state.json');
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(stateFile, '{"host":"127.0.0.1","port":1}', 'utf-8');

    clearViewerStateFile(stateFile);

    expect(existsSync(stateFile)).toBe(false);
  });
});
