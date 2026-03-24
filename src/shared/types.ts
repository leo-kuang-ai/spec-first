/**
 * Spec-First 共享类型定义
 * 消除隐式字符串协议，所有模块统一引用
 */

import type { IdType } from '../core/trace-engine/id-taxonomy.js';

// ─── Stage 枚举 ───────────────────────────────────────────
export enum Stage {
  INIT = '00_init',
  SPECIFY = '01_specify',
  DESIGN = '02_design',
  PLAN = '03_plan',
  IMPLEMENT = '04_implement',
  VERIFY = '05_verify',
  WRAP_UP = '06_wrap_up',
  RELEASE = '07_release',
  DONE = '08_done',
  CANCELLED = '09_cancelled',
}

/** 终态阶段 */
export const TERMINAL_STAGES: ReadonlySet<Stage> = new Set([Stage.DONE, Stage.CANCELLED]);

// ─── ID 类型 ──────────────────────────────────────────────
export {
  ID_PATTERNS,
  ID_SCAN_PATTERN,
  ID_TYPES,
  NEXT_ID_TYPES,
  TC_LEVELS,
  VALID_ID_TYPES,
  VALID_NEXT_ID_TYPES,
  VALID_TC_LEVELS,
  isIdType,
  isNextIdType,
  isTcLevel,
} from '../core/trace-engine/id-taxonomy.js';
export type { IdType, NextIdType, TcLevel } from '../core/trace-engine/id-taxonomy.js';

// ─── Mode / Size ──────────────────────────────────────────
export type Mode = 'N' | 'I';
export type Size = 'S' | 'M' | 'L';

export type BackgroundInputStatus = 'full' | 'degraded' | 'blind';
export type NodeStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'skipped';
export type ChecklistStatus = 'complete' | 'partial' | 'empty';

export interface NodeState {
  status: NodeStatus;
  startedAt?: string;
  completedAt?: string;
  summary?: string;
  checklistStatus?: ChecklistStatus;
  canMarkDone?: boolean;
}

export interface FeatureState {
  featureId: string;
  currentStage: Stage;
  terminal: boolean;
  nodes: Partial<Record<Stage, NodeState>>;
  createdAt: string;
  updatedAt: string;
  title?: string;
  backgroundInputStatus?: BackgroundInputStatus;
  mode?: Mode;
  size?: Size;
  platforms?: string[];
  stageStatus?: StageStatus;
  autoAdvancePolicy?: AutoAdvancePolicy;
  lastVerifiedAt?: string;
  lastSuggestedCommand?: string;
  mergedRules?: {
    profile?: 'default-simplified' | 'strict';
    gateConditions: Record<string, unknown[]>;
    deliverables: Record<string, unknown[]>;
    thresholds: Record<
      string,
      { value: number; direction: 'higher_is_better' | 'lower_is_better' }
    >;
  };
  history?: StageHistoryEntry[];
}

export type StageStatus =
  | 'drafting'
  | 'awaiting_review'
  | 'review_failed'
  | 'ready_to_advance'
  | 'advanced';
export type AutoAdvancePolicy = 'suggest' | 'assisted' | 'auto_advance' | 'auto_run';
// ─── ExitCode ─────────────────────────────────────────────
export enum ExitCode {
  SUCCESS = 0,
  GATE_FAILED = 1,
  VALIDATION_ERROR = 2,
  CONFIG_ERROR = 3,
  IO_ERROR = 4,
  UNKNOWN_ERROR = 5,
  INVALID_ARGS = 6,
  GENERAL_ERROR = 7,
}

// ─── StageState（stage-state.json 结构）─────────────────
export interface StageHistoryEntry {
  from: Stage;
  to: Stage;
  timestamp: string;
  gateResult?: string;
  reason?: string;
}

export interface StageState {
  featureId: string;
  mode: Mode;
  size: Size;
  platforms: string[];
  backgroundInputStatus?: BackgroundInputStatus;
  stageStatus?: StageStatus;
  autoAdvancePolicy?: AutoAdvancePolicy;
  lastVerifiedAt?: string;
  lastSuggestedCommand?: string;
  mergedRules?: {
    profile?: 'default-simplified' | 'strict';
    gateConditions: Record<string, unknown[]>;
    deliverables: Record<string, unknown[]>;
    thresholds: Record<
      string,
      { value: number; direction: 'higher_is_better' | 'lower_is_better' }
    >;
  };
  currentStage: Stage;
  history: StageHistoryEntry[];
  terminal: boolean;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Gate 结果 ────────────────────────────────────────────
export type GateStatus = 'PASS' | 'PASS_WITH_WAIVER' | 'FAIL';

export interface ConditionResult {
  id: string;
  description: string;
  status: 'PASS' | 'WAIVER' | 'FAIL';
  detail?: string;
  /** 与该条件失败直接相关的 FR 列表，用于精确豁免匹配 */
  scopeFrIds?: string[];
  /** false 表示 warning-only，不阻塞流程；默认 true */
  blocking?: boolean;
}

export interface WaiverRef {
  exceptionId: string;
  rfcId: string;
  expiresAt: string;
  rollbackPoint: string;
}

export interface GateResult {
  status: GateStatus;
  stage: Stage;
  timestamp: string;
  conditions: ConditionResult[];
  waivers?: WaiverRef[];
  suggestions?: string[];
}

// ─── RFC 变更管理 ─────────────────────────────────────────
export type RfcStatus = 'draft' | 'approved' | 'closed' | 'rejected';
export type RfcLevel = 'Minor' | 'Major' | 'Critical';

export interface RfcWaiver {
  frId: string;
  reason: string;
  expiresAt: string;
  rollbackPoint: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface RfcRecord {
  id: string;
  featureId: string;
  title: string;
  level: RfcLevel;
  status: RfcStatus;
  motivation?: string;
  description?: string;
  impactIds: string[];
  waivers?: RfcWaiver[];
  by: string;
  approvals: Array<{ by: string; at: string }>;
  createdAt: string;
  updatedAt: string;
}

// ─── 缺陷管理 ─────────────────────────────────────────────
export type DefectStatus = 'open' | 'fixing' | 'fixed' | 'verified' | 'wontfix';
export type SecuritySeverity = 'S1' | 'S2' | 'S3' | 'S4';

export interface DefectRecord {
  seq: number;
  featureId: string;
  severity: SecuritySeverity;
  title: string;
  description?: string;
  reporter: string;
  discoveredIn?: Stage;
  linkedFr?: string;
  linkedTc?: string;
  status: DefectStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── 追踪状态 ────────────────────────────────────────────
export type MatrixStatus =
  | 'Planned'
  | 'Implemented'
  | 'Verified'
  | 'Accepted'
  | 'Deferred'
  | 'Cancelled'
  | 'Exception';

/** 终态矩阵状态 */
export const TERMINAL_STATUSES: ReadonlySet<MatrixStatus> = new Set([
  'Accepted',
  'Cancelled',
  'Exception',
]);

export interface MatrixRow {
  id: string;
  type: IdType;
  title: string;
  status: MatrixStatus;
  upstream?: string[];
  downstream?: string[];
  nfrTag?: string;
  rfcRef?: string;
}

// ─── Known Exception ──────────────────────────────────────
export interface KnownException {
  id: string;
  rfcId: string;
  frId: string;
  reason: string;
  expiresAt: string;
  rollbackPoint: string;
  approvedBy: string;
  approvedAt: string;
}

// ─── ID 校验结果 ──────────────────────────────────────────
export interface IdValidationResult {
  valid: boolean;
  type?: IdType;
  error?: string;
}

// ─── Feature 摘要 ─────────────────────────────────────────
export interface FeatureSummary {
  featureId: string;
  title?: string;
  currentStage: Stage;
  terminal: boolean;
  updatedAt: string;
}
