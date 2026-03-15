import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { detectHostPaths } from '../../shared/host-paths.js';
import { hasRequiredJsonMcpBaseline } from '../../shared/host-mcp-baseline.js';
import { getHostCapability } from '../tool-integration/capability-matrix.js';
import type { HostAdapter, HostBaselinePart, HostBaselineState } from './types.js';

export class CursorAdapter implements HostAdapter {
  id = 'cursor' as const;

  detect(): boolean {
    const paths = detectHostPaths();
    return Boolean(
      (paths.cursorHomeDir && existsSync(paths.cursorHomeDir)) ||
        (paths.cursorConfigDir && existsSync(paths.cursorConfigDir))
    );
  }

  capabilities() {
    return getHostCapability(this.id);
  }

  summary(): string {
    const paths = detectHostPaths();
    return `cursor home=${paths.cursorHomeDir} config=${paths.cursorConfigDir} baseline=${this.describeBaselineState(paths)}`;
  }

  maturity() {
    return 'experimental' as const;
  }

  remediation(detected: boolean): string {
    if (!detected) {
      return '安装 Cursor 或设置 CURSOR_HOME 后，运行 spec-first update --host cursor 补齐 skills / MCP';
    }
    return this.hasBaselineAssets(detectHostPaths())
      ? '运行 spec-first update --host cursor 刷新 Cursor 基线能力；当前为实验性接入'
      : 'Cursor 宿主已检测到，但 baseline 未补齐；运行 spec-first update --host cursor 补齐缺失的 skills / MCP';
  }

  baselineState() {
    return this.computeBaseline(detectHostPaths()).state;
  }

  missingBaseline() {
    return this.computeBaseline(detectHostPaths()).missing;
  }

  private hasBaselineAssets(paths: ReturnType<typeof detectHostPaths>): boolean {
    return this.computeBaseline(paths).state === 'ready';
  }

  private describeBaselineState(paths: ReturnType<typeof detectHostPaths>): HostBaselineState {
    return this.computeBaseline(paths).state;
  }

  private computeBaseline(paths: ReturnType<typeof detectHostPaths>): {
    state: HostBaselineState;
    missing: HostBaselinePart[];
  } {
    if (!this.detect()) {
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
