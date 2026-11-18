import { GAME_CATALOG } from '../data/catalog';
import type {
  DifficultyTier,
  DomainPerformance,
  GameMode,
  GameResultInput,
  SessionRecord,
} from '../types/brainspark';

export function calculateStarRating(accuracy: number, avgReactionMs: number, mode: GameMode, difficulty: DifficultyTier): 0 | 1 | 2 | 3 {
  if (accuracy < 50) return 0;
  const targetMs = GAME_CATALOG[mode].tiers[difficulty].targetMs;
  if (accuracy >= 90 && avgReactionMs <= targetMs * 1.1) return 3;
  if (accuracy >= 75 && avgReactionMs <= targetMs * 1.45) return 2;
  return 1;
}

export function calculateSessionXp(input: GameResultInput, isFirstNodeClear: boolean): number {
  const tierConfig = GAME_CATALOG[input.mode].tiers[input.difficulty];
  const accuracyFactor = Math.max(0.35, input.accuracy / 100);
  const speedRatio = Math.min(1.4, Math.max(0.6, tierConfig.targetMs / Math.max(200, input.avgReactionMs)));
  const raw = Math.round(tierConfig.baseXp * accuracyFactor * (0.7 + 0.3 * speedRatio));
  const bonus = isFirstNodeClear ? 15 : 0;
  return Math.max(8, raw + bonus);
}

/**
 * Computes a single session's implied Brain Age between 20 (peak) and 80.
 */
export function computeSessionBrainAge(
  mode: GameMode,
  difficulty: DifficultyTier,
  accuracy: number,
  avgReactionMs: number,
  maxSpan: number | null,
): number {
  const targetMs = GAME_CATALOG[mode].tiers[difficulty].targetMs;
  const speedRatio = Math.max(0.45, Math.min(2.4, avgReactionMs / targetMs));
  const accuracyPenalty = Math.max(0, 100 - accuracy) * 0.45;
  const speedPenalty = Math.max(-8, (speedRatio - 0.72) * 28);

  let spanBonus = 0;
  if (mode === 'sequence' && typeof maxSpan === 'number') {
    spanBonus = Math.max(-6, Math.min(8, (maxSpan - 5) * 2.5));
  }

  const difficultyBonus = difficulty === 'blitz' ? -3 : difficulty === 'standard' ? -1 : 0;
  const rawAge = Math.round(24 + accuracyPenalty + speedPenalty - spanBonus + difficultyBonus);
  return Math.max(20, Math.min(80, rawAge));
}

/**
 * Aggregates up to the latest 16 sessions across modes to estimate current Brain Age.
 */
export function computeEstimatedBrainAge(sessions: SessionRecord[]): number | null {
  if (sessions.length === 0) return null;
  const recent = sessions.slice(-16);

  // Give slightly higher weight to most recent sessions
  let weightedSum = 0;
  let totalWeight = 0;
  recent.forEach((session, idx) => {
    const weight = idx + 1;
    const sessionAge = computeSessionBrainAge(
      session.mode,
      session.difficulty,
      session.accuracy,
      session.avgReactionMs,
      session.maxSpan,
    );
    weightedSum += sessionAge * weight;
    totalWeight += weight;
  });

  const avg = Math.round(weightedSum / totalWeight);
  return Math.max(20, Math.min(80, avg));
}

export function computeDomainBreakdown(sessions: SessionRecord[]): DomainPerformance[] {
  const modes: GameMode[] = ['math', 'stroop', 'sequence', 'reflex', 'pairs', 'sudoku'];

  return modes.map((mode) => {
    const def = GAME_CATALOG[mode];
    const modeSessions = sessions.filter((s) => s.mode === mode);
    if (modeSessions.length === 0) {
      return {
        mode,
        title: def.title,
        domain: def.cognitiveDomain,
        sessionsCount: 0,
        avgAccuracy: 0,
        avgReactionMs: null,
        bestReactionMs: null,
        readinessScore: 0,
      };
    }

    const avgAccuracy = Math.round(
      modeSessions.reduce((acc, s) => acc + s.accuracy, 0) / modeSessions.length,
    );
    const avgReactionMs = Math.round(
      modeSessions.reduce((acc, s) => acc + s.avgReactionMs, 0) / modeSessions.length,
    );
    const bestReactionMs = Math.min(...modeSessions.map((s) => s.avgReactionMs));

    const recentAges = modeSessions
      .slice(-5)
      .map((s) =>
        computeSessionBrainAge(s.mode, s.difficulty, s.accuracy, s.avgReactionMs, s.maxSpan),
      );
    const avgModeAge = recentAges.reduce((a, b) => a + b, 0) / recentAges.length;
    const readinessScore = Math.max(15, Math.min(100, Math.round(((80 - avgModeAge) / 60) * 100)));

    return {
      mode,
      title: def.title,
      domain: def.cognitiveDomain,
      sessionsCount: modeSessions.length,
      avgAccuracy,
      avgReactionMs,
      bestReactionMs,
      readinessScore,
    };
  });
}
