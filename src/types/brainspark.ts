export type GameMode = 'math' | 'stroop' | 'sequence' | 'reflex' | 'pairs' | 'sudoku';

export type DifficultyTier = 'warmup' | 'standard' | 'blitz';

export type AppTab = 'path' | 'practice' | 'stats' | 'achievements' | 'profile';

export type AppTheme = 'dark' | 'light' | 'colorful' | 'forest';

export type GamePhase = 'COUNTDOWN' | 'PLAYING' | 'ROUND_SUMMARY';

export type ImportStrategy = 'merge' | 'replace';

export interface GameDifficultyConfig {
  tier: DifficultyTier;
  label: string;
  description: string;
  roundCount: number;
  baseXp: number;
  targetMs: number;
}

export interface GameDefinition {
  mode: GameMode;
  title: string;
  cognitiveDomain: string;
  shortDesc: string;
  instructions: string;
  metricUnit: string;
  tiers: Record<DifficultyTier, GameDifficultyConfig>;
}

export interface PathNode {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  subtitle: string;
  mode: GameMode;
  difficulty: DifficultyTier;
  xpReward: number;
}

export interface PathChapter {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  focusLabel: string;
}

export interface NodeProgress {
  nodeId: string;
  completedCount: number;
  bestStars: 0 | 1 | 2 | 3;
  bestAccuracy: number;
  bestAvgMs: number | null;
  lastCompletedDate: string | null;
}

export interface SessionRecord {
  id: string;
  timestamp: number;
  dateKey: string; // Local YYYY-MM-DD
  mode: GameMode;
  difficulty: DifficultyTier;
  nodeId: string | null;
  score: number;
  correctCount: number;
  totalRounds: number;
  accuracy: number; // 0..100
  avgReactionMs: number;
  maxSpan: number | null;
  earnedXp: number;
  brainAgeAfter: number;
}

export interface UserProfile {
  displayName: string;
  dailyXpGoal: number;
  soundEnabled: boolean;
  theme: AppTheme;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // Local YYYY-MM-DD
  totalXp: number;
  estimatedBrainAge: number | null;
}

export interface BrainSparkData {
  version: number;
  profile: UserProfile;
  nodeProgress: Record<string, NodeProgress>;
  sessions: SessionRecord[];
}

export interface GameResultInput {
  mode: GameMode;
  difficulty: DifficultyTier;
  nodeId: string | null;
  score: number;
  correctCount: number;
  totalRounds: number;
  accuracy: number;
  avgReactionMs: number;
  maxSpan: number | null;
}

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'info' | 'warning' | 'error';
}

export interface DomainPerformance {
  mode: GameMode;
  title: string;
  domain: string;
  sessionsCount: number;
  avgAccuracy: number;
  avgReactionMs: number | null;
  bestReactionMs: number | null;
  readinessScore: number; // 0..100
}
