import type { BrainSparkData, GameMode } from '../types/brainspark';
import { getActiveStreakDisplay } from './date';

export type AchievementIconId = 'sparkles' | 'flame' | 'target' | 'zap' | 'compass';

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: AchievementIconId;
  unlocked: boolean;
  current: number;
  target: number;
  unitLabel: string;
}

const ALL_MODES: GameMode[] = ['math', 'stroop', 'sequence', 'reflex', 'pairs', 'sudoku'];

export function evaluateAchievements(data: BrainSparkData): AchievementItem[] {
  const { profile, sessions } = data;
  const activeStreak = getActiveStreakDisplay(profile.currentStreak, profile.lastActiveDate);
  const bestStreak = Math.max(activeStreak, profile.longestStreak);
  const bestAccuracy = sessions.reduce((max, s) => Math.max(max, s.accuracy), 0);
  const playedModes = new Set(sessions.map((s) => s.mode));
  const uniqueModesCount = ALL_MODES.filter((m) => playedModes.has(m)).length;

  return [
    {
      id: 'first-step',
      title: 'Primeiro Passo',
      description: 'Conclua sua primeira sessão em qualquer modo.',
      icon: 'sparkles',
      unlocked: sessions.length >= 1,
      current: Math.min(1, sessions.length),
      target: 1,
      unitLabel: 'sessão',
    },
    {
      id: 'sharp-mind',
      title: 'Mente Precisa',
      description: 'Termine um desafio com 90% ou mais de precisão.',
      icon: 'target',
      unlocked: bestAccuracy >= 90,
      current: Math.min(90, bestAccuracy),
      target: 90,
      unitLabel: '%',
    },
    {
      id: 'xp-collector',
      title: 'Colecionador de XP',
      description: 'Acumule 250 XP ao longo dos seus treinos.',
      icon: 'zap',
      unlocked: profile.totalXp >= 250,
      current: Math.min(250, profile.totalXp),
      target: 250,
      unitLabel: 'XP',
    },
    {
      id: 'steady-flame',
      title: 'Chama Constante',
      description: 'Alcance 3 dias seguidos de ofensiva diária.',
      icon: 'flame',
      unlocked: bestStreak >= 3,
      current: Math.min(3, bestStreak),
      target: 3,
      unitLabel: 'dias',
    },
    {
      id: 'full-explorer',
      title: 'Explorador Completo',
      description: 'Pratique pelo menos uma vez em cada um dos 6 jogos.',
      icon: 'compass',
      unlocked: uniqueModesCount >= 6,
      current: uniqueModesCount,
      target: 6,
      unitLabel: 'jogos',
    },
  ];
}
