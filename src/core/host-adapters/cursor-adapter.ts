import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { detectHostPaths, type HostPaths } from '../../shared/host-paths.js';
import { hasRequiredJsonMcpBaseline } from '../../shared/host-mcp-baseline.js';
import { getHostCapability } from '../tool-integration/capability-matrix.js';
import type { HostAdapter, HostBaselinePart, HostBaselineState } from './types.js';

export class CursorAdapter implements HostAdapter {
  id = 'cursor' as const;

  detect(paths: HostPaths = detectHostPaths()): boolean {
    return Boolean(
      (paths.cursorHomeDir && existsSync(paths.cursorHomeDir)) ||
      (paths.cursorConfigDir && existsSync(paths.cursorConfigDir))
    );
  }

  capabilities(paths?: HostPaths) {
    return getHostCapability(this.id, paths);
  }

  summary(paths: HostPaths = detectHostPaths()): string {
    return `cursor home=${paths.cursorHomeDir} config=${paths.cursorConfigDir} baseline=${this.describeBaselineState(paths)}`;
  }

  maturity() {
    return 'experimental' as const;
  }

  remediation(detected: boolean, paths: HostPaths = detectHostPaths()): string {
    if (!detected) {
      return '安装 Cursor 或设置 CURSOR_HOME 后，运行 spec-first update --host cursor 补齐 skills / MCP';
    }
    return this.hasBaselineAssets(paths)
      ? '运行 spec-first update --host cursor 刷新 Cursor 基线能力；当前为实验性接入'
      : 'Cursor 宿主已检测到，但 baseline 未补齐；运行 spec-first update --host cursor 补齐缺失的 skills / MCP';
  }

  baselineState(paths: HostPaths = detectHostPaths()) {
    return this.computeBaseline(paths).state;
  }

  missingBaseline(paths: HostPaths = detectHostPaths()) {
    return this.computeBaseline(paths).missing;
  }

  private hasBaselineAssets(paths: HostPaths): boolean {
    return this.computeBaseline(paths).state === 'ready';
  }

  private describeBaselineState(paths: HostPaths): HostBaselineState {
    return this.computeBaseline(paths).state;
  }

  private computeBaseline(paths: HostPaths): {
    state: HostBaselineState;
    missing: HostBaselinePart[];
  } {
    if (!this.detect(paths)) {
      return { state: 'unknown', missing: [] };
    }

    const missing: HostBaselinePart[] = [];
    if (!hasRequiredJsonMcpBaseline(paths.cursorMcpConfigPath, ['mcpServers', 'servers'])) {
      missing.push('mcp');
    }
    if (!existsSync(join(paths.cursorHomeDir, 'skills', 'spec-first'))) missing.push('skills');
    return {
      state: missing.length === 0 ? 'ready' : 'partial',
      missing,
    };
  }
}
