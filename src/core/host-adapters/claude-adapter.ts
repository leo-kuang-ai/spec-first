import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { detectHostPaths, type HostPaths } from '../../shared/host-paths.js';
import { hasRequiredClaudeMcpBaseline } from '../../shared/host-mcp-baseline.js';
import { getHostCapability } from '../tool-integration/capability-matrix.js';
import type { HostAdapter, HostBaselinePart, HostBaselineState } from './types.js';

export class ClaudeAdapter implements HostAdapter {
  id = 'claude' as const;

  detect(paths: HostPaths = detectHostPaths()): boolean {
    return (
      existsSync(paths.claudeCommandsDir) ||
      existsSync(paths.claudeConfigDir) ||
      paths.claudeConfigFiles.some((filePath) => existsSync(filePath))
    );
  }

  capabilities(paths?: HostPaths) {
    return getHostCapability(this.id, paths);
  }

  summary(paths: HostPaths = detectHostPaths()): string {
    return `claude commands=${paths.claudeCommandsDir} config=${paths.claudeConfigDir} baseline=${this.computeBaseline(paths).state}`;
  }

  maturity() {
    return 'stable' as const;
  }

  remediation(detected: boolean): string {
    return detected
      ? '如需刷新 Claude 基线能力，运行 spec-first update --host claude'
      : '安装 Claude Code 后运行 spec-first update --host claude 补齐 commands / MCP / hooks';
  }

  baselineState(paths: HostPaths = detectHostPaths()) {
    return this.computeBaseline(paths).state;
  }

  missingBaseline(paths: HostPaths = detectHostPaths()) {
    return this.computeBaseline(paths).missing;
  }

  private computeBaseline(paths: HostPaths): {
    state: HostBaselineState;
    missing: HostBaselinePart[];
  } {
    if (!this.detect(paths)) {
      return { state: 'unknown', missing: [] };
    }

    const missing: HostBaselinePart[] = [];
    if (!hasRequiredClaudeMcpBaseline(paths.claudeConfigFiles)) {
      missing.push('mcp');
    }
    if (!existsSync(join(paths.claudeCommandsDir, 'spec-first'))) {
      missing.push('skills');
    }

    return {
      state: missing.length === 0 ? 'ready' : 'partial',
      missing,
    };
  }
}
