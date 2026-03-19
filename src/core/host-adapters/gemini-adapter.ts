import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { detectHostPaths, type HostPaths } from '../../shared/host-paths.js';
import { hasRequiredJsonMcpBaseline } from '../../shared/host-mcp-baseline.js';
import { getHostCapability } from '../tool-integration/capability-matrix.js';
import type { HostAdapter, HostBaselinePart, HostBaselineState } from './types.js';

export class GeminiAdapter implements HostAdapter {
  id = 'gemini' as const;

  detect(paths: HostPaths = detectHostPaths()): boolean {
    return Boolean(
      (paths.geminiHomeDir && existsSync(paths.geminiHomeDir)) ||
      (paths.geminiConfigDir && existsSync(paths.geminiConfigDir))
    );
  }

  capabilities(paths?: HostPaths) {
    return getHostCapability(this.id, paths);
  }

  summary(paths: HostPaths = detectHostPaths()): string {
    return `gemini home=${paths.geminiHomeDir} config=${paths.geminiConfigDir} baseline=${this.describeBaselineState(paths)}`;
  }

  maturity() {
    return 'experimental' as const;
  }

  remediation(detected: boolean, paths: HostPaths = detectHostPaths()): string {
    if (!detected) {
      return '安装 Gemini CLI 或设置 GEMINI_HOME 后，运行 spec-first update --host gemini 补齐 skills / MCP';
    }
    return this.hasBaselineAssets(paths)
      ? '运行 spec-first update --host gemini 刷新 Gemini 基线能力；当前为实验性接入'
      : 'Gemini 宿主已检测到，但 baseline 未补齐；运行 spec-first update --host gemini 补齐缺失的 skills / MCP';
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
    if (!hasRequiredJsonMcpBaseline(paths.geminiSettingsPath, ['mcpServers', 'mcp_servers'])) {
      missing.push('mcp');
    }
    if (!existsSync(join(paths.geminiHomeDir, 'skills', 'spec-first'))) missing.push('skills');
    return {
      state: missing.length === 0 ? 'ready' : 'partial',
      missing,
    };
  }
}
