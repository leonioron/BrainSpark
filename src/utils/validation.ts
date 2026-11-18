import { DATA_SCHEMA_VERSION, INITIAL_DATA, SPARK_NODES } from '../data/catalog';
import type { AppTheme, BrainSparkData, NodeProgress, SessionRecord } from '../types/brainspark';
import { computeEstimatedBrainAge } from './brainAge';

export function sanitizeDisplayName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'Desafiante';
  return trimmed.slice(0, 28);
}

export function validateDailyXpGoal(value: number): { valid: boolean; clamped: number; error?: string } {
  if (!Number.isFinite(value)) {
    return { valid: false, clamped: 60, error: 'Informe uma meta numérica de XP.' };
  }
  const rounded = Math.round(value);
  if (rounded < 10) {
    return { valid: false, clamped: 10, error: 'A meta diária mínima é de 10 XP.' };
  }
  if (rounded > 500) {
    return { valid: false, clamped: 500, error: 'A meta diária máxima é de 500 XP.' };
  }
  return { valid: true, clamped: rounded };
}

const VALID_MODES = new Set(['math', 'stroop', 'sequence', 'reflex', 'pairs', 'sudoku']);
const VALID_DIFFICULTIES = new Set(['warmup', 'standard', 'blitz']);
const VALID_THEMES = new Set<AppTheme>(['dark', 'light', 'colorful', 'forest']);
const VALID_NODE_IDS = new Set(SPARK_NODES.map((n) => n.id));

function isValidDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseAndValidateBackupJson(rawText: string): {
  ok: true;
  data: BrainSparkData;
} | {
  ok: false;
  error: string;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, error: 'Sintaxe JSON inválida. Verifique o texto ou o arquivo de backup.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'O backup precisa ser um objeto JSON válido.' };
  }

  const obj = parsed as Record<string, unknown>;
  if (!obj.profile || typeof obj.profile !== 'object' || !Array.isArray(obj.sessions)) {
    return {
      ok: false,
      error: 'Campos obrigatórios ausentes ("profile" e "sessions").',
    };
  }

  const rawProfile = obj.profile as Record<string, unknown>;
  const goalCheck = validateDailyXpGoal(Number(rawProfile.dailyXpGoal ?? 60));

  const sanitizedSessions: SessionRecord[] = [];
  for (const item of obj.sessions) {
    if (!item || typeof item !== 'object') continue;
    const s = item as Record<string, unknown>;
    if (
      typeof s.id !== 'string' ||
      !VALID_MODES.has(String(s.mode)) ||
      !VALID_DIFFICULTIES.has(String(s.difficulty)) ||
      !isValidDateKey(s.dateKey)
    ) {
      continue;
    }

    sanitizedSessions.push({
      id: s.id,
      timestamp: Number.isFinite(Number(s.timestamp)) ? Number(s.timestamp) : Date.now(),
      dateKey: s.dateKey,
      mode: s.mode as SessionRecord['mode'],
      difficulty: s.difficulty as SessionRecord['difficulty'],
      nodeId: typeof s.nodeId === 'string' && VALID_NODE_IDS.has(s.nodeId) ? s.nodeId : null,
      score: Math.max(0, Math.round(Number(s.score) || 0)),
      correctCount: Math.max(0, Math.round(Number(s.correctCount) || 0)),
      totalRounds: Math.max(1, Math.round(Number(s.totalRounds) || 1)),
      accuracy: Math.max(0, Math.min(100, Math.round(Number(s.accuracy) || 0))),
      avgReactionMs: Math.max(80, Math.round(Number(s.avgReactionMs) || 500)),
      maxSpan: typeof s.maxSpan === 'number' && Number.isFinite(s.maxSpan) ? Math.round(s.maxSpan) : null,
      earnedXp: Math.max(0, Math.round(Number(s.earnedXp) || 0)),
      brainAgeAfter: Math.max(20, Math.min(80, Math.round(Number(s.brainAgeAfter) || 35))),
    });
  }

  sanitizedSessions.sort((a, b) => a.timestamp - b.timestamp);

  const sanitizedProgress: Record<string, NodeProgress> = {};
  if (obj.nodeProgress && typeof obj.nodeProgress === 'object') {
    for (const [key, val] of Object.entries(obj.nodeProgress as Record<string, unknown>)) {
      if (!VALID_NODE_IDS.has(key) || !val || typeof val !== 'object') continue;
      const p = val as Record<string, unknown>;
      const starsNum = Number(p.bestStars);
      const clampedStars = (starsNum >= 3 ? 3 : starsNum === 2 ? 2 : starsNum === 1 ? 1 : 0) as 0 | 1 | 2 | 3;
      sanitizedProgress[key] = {
        nodeId: key,
        completedCount: Math.max(0, Math.round(Number(p.completedCount) || 0)),
        bestStars: clampedStars,
        bestAccuracy: Math.max(0, Math.min(100, Math.round(Number(p.bestAccuracy) || 0))),
        bestAvgMs: typeof p.bestAvgMs === 'number' && Number.isFinite(p.bestAvgMs) ? Math.round(p.bestAvgMs) : null,
        lastCompletedDate: isValidDateKey(p.lastCompletedDate) ? p.lastCompletedDate : null,
      };
    }
  }

  const totalXp = sanitizedSessions.length > 0
    ? sanitizedSessions.reduce((acc, s) => acc + s.earnedXp, 0)
    : Math.max(0, Math.round(Number(rawProfile.totalXp) || 0));

  const data: BrainSparkData = {
    version: DATA_SCHEMA_VERSION,
    profile: {
      displayName: sanitizeDisplayName(
        typeof rawProfile.displayName === 'string'
          ? rawProfile.displayName
          : INITIAL_DATA.profile.displayName,
      ),
      dailyXpGoal: goalCheck.clamped,
      soundEnabled: typeof rawProfile.soundEnabled === 'boolean' ? rawProfile.soundEnabled : true,
      theme: VALID_THEMES.has(rawProfile.theme as AppTheme)
        ? (rawProfile.theme as AppTheme)
        : 'dark',
      currentStreak: Math.max(0, Math.round(Number(rawProfile.currentStreak) || 0)),
      longestStreak: Math.max(0, Math.round(Number(rawProfile.longestStreak) || 0)),
      lastActiveDate: isValidDateKey(rawProfile.lastActiveDate) ? rawProfile.lastActiveDate : null,
      totalXp,
      estimatedBrainAge: computeEstimatedBrainAge(sanitizedSessions),
    },
    nodeProgress: sanitizedProgress,
    sessions: sanitizedSessions,
  };

  return { ok: true, data };
}

export function mergeBrainSparkData(
  current: BrainSparkData,
  incoming: BrainSparkData,
): BrainSparkData {
  const sessionMap = new Map<string, SessionRecord>();
  for (const s of current.sessions) sessionMap.set(s.id, s);
  for (const s of incoming.sessions) sessionMap.set(s.id, s);

  const mergedSessions = Array.from(sessionMap.values()).sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  const mergedProgress: Record<string, NodeProgress> = { ...current.nodeProgress };
  for (const [nodeId, inc] of Object.entries(incoming.nodeProgress)) {
    const ex = mergedProgress[nodeId];
    if (!ex) {
      mergedProgress[nodeId] = inc;
    } else {
      mergedProgress[nodeId] = {
        nodeId,
        completedCount: Math.max(ex.completedCount, inc.completedCount),
        bestStars: Math.max(ex.bestStars, inc.bestStars) as 0 | 1 | 2 | 3,
        bestAccuracy: Math.max(ex.bestAccuracy, inc.bestAccuracy),
        bestAvgMs:
          ex.bestAvgMs !== null && inc.bestAvgMs !== null
            ? Math.min(ex.bestAvgMs, inc.bestAvgMs)
            : ex.bestAvgMs ?? inc.bestAvgMs,
        lastCompletedDate:
          ex.lastCompletedDate && inc.lastCompletedDate
            ? ex.lastCompletedDate > inc.lastCompletedDate
              ? ex.lastCompletedDate
              : inc.lastCompletedDate
            : ex.lastCompletedDate ?? inc.lastCompletedDate,
      };
    }
  }

  const totalXp = mergedSessions.reduce((sum, s) => sum + s.earnedXp, 0);
  const latestSessionDate =
    mergedSessions.length > 0 ? mergedSessions[mergedSessions.length - 1].dateKey : null;

  const latestActive =
    current.profile.lastActiveDate && incoming.profile.lastActiveDate
      ? current.profile.lastActiveDate > incoming.profile.lastActiveDate
        ? current.profile.lastActiveDate
        : incoming.profile.lastActiveDate
      : current.profile.lastActiveDate ?? incoming.profile.lastActiveDate ?? latestSessionDate;

  return {
    version: DATA_SCHEMA_VERSION,
    profile: {
      displayName: current.profile.displayName || incoming.profile.displayName,
      dailyXpGoal: current.profile.dailyXpGoal,
      soundEnabled: current.profile.soundEnabled,
      theme: current.profile.theme || incoming.profile.theme || 'dark',
      currentStreak: Math.max(current.profile.currentStreak, incoming.profile.currentStreak),
      longestStreak: Math.max(current.profile.longestStreak, incoming.profile.longestStreak),
      lastActiveDate: latestActive,
      totalXp,
      estimatedBrainAge: computeEstimatedBrainAge(mergedSessions),
    },
    nodeProgress: mergedProgress,
    sessions: mergedSessions,
  };
}
