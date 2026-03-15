import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { detectHostPaths } from '../../shared/host-paths.js';
import { hasRequiredClaudeMcpBaseline } from '../../shared/host-mcp-baseline.js';
import { getHostCapability } from '../tool-integration/capability-matrix.js';
import type { HostAdapter, HostBaselinePart, HostBaselineState } from './types.js';

export class ClaudeAdapter implements HostAdapter {
  id = 'claude' as const;

  detect(): boolean {
    const paths = detectHostPaths();
    return (
      existsSync(paths.claudeCommandsDir) ||
      existsSync(paths.claudeConfigDir) ||
      paths.claudeConfigFiles.some((filePath) => existsSync(filePath))
    );
  }

  capabilities() {
    return getHostCapability(this.id);
  }

  summary(): string {
    const paths = detectHostPaths();
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

  baselineState() {
    return this.computeBaseline(detectHostPaths()).state;
  }

  missingBaseline() {
    return this.computeBaseline(detectHostPaths()).missing;
  }

  private computeBaseline(paths: ReturnType<typeof detectHostPaths>): {
    state: HostBaselineState;
    missing: HostBaselinePart[];
  } {
    if (!this.detect()) {
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
