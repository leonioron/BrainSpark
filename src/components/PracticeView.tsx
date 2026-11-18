import { Brain, BrainCircuit, Play, Zap } from 'lucide-react';
import { useState } from 'react';
import { GAME_CATALOG } from '../data/catalog';
import type { DifficultyTier, GameMode, SessionRecord } from '../types/brainspark';
import { getModeAccentClasses, ModeIcon } from './ModeIcon';

interface PracticeViewProps {
  sessions: SessionRecord[];
  onStartPractice: (mode: GameMode, difficulty: DifficultyTier) => void;
}

const MODES: GameMode[] = ['math', 'stroop', 'sequence', 'reflex', 'pairs', 'sudoku'];
const DIFFICULTIES: DifficultyTier[] = ['warmup', 'standard', 'blitz'];

function DifficultyBrainIcon({ tier }: { tier: DifficultyTier }) {
  if (tier === 'warmup') {
    return <Brain className="h-6 w-6" />;
  }
  if (tier === 'standard') {
    return <BrainCircuit className="h-6 w-6" />;
  }
  return (
    <span className="relative inline-flex items-center justify-center">
      <Brain className="h-6 w-6" />
      <Zap className="h-3.5 w-3.5 -ml-1.5 -mt-3 fill-current text-amber-300" />
    </span>
  );
}

export function PracticeView({ sessions, onStartPractice }: PracticeViewProps) {
  const [selectedTiers, setSelectedTiers] = useState<Record<GameMode, DifficultyTier>>({
    math: 'standard',
    stroop: 'standard',
    sequence: 'standard',
    reflex: 'standard',
    pairs: 'standard',
    sudoku: 'standard',
  });

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-6 lg:px-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-100 text-balance sm:text-3xl">
          Laboratório de Prática Livre
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Escolha qualquer atividade cognitiva e intensidade para treinar velocidade, precisão e memória.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {MODES.map((mode) => {
          const def = GAME_CATALOG[mode];
          const activeTier = selectedTiers[mode];
          const tierConfig = def.tiers[activeTier];
          const accent = getModeAccentClasses(mode);

          const modeSessions = sessions.filter((s) => s.mode === mode);
          const bestMs =
            modeSessions.length > 0
              ? Math.min(...modeSessions.map((s) => s.avgReactionMs))
              : null;
          const bestAccuracy =
            modeSessions.length > 0
              ? Math.max(...modeSessions.map((s) => s.accuracy))
              : null;

          return (
            <article
              key={mode}
              className="flex min-w-0 flex-col justify-between rounded-3xl border border-white/8 bg-[#121824] p-6"
            >
              <div className="min-w-0">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${accent.iconBox}`}
                  >
                    <ModeIcon mode={mode} className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-400">
                      {def.cognitiveDomain}
                    </p>
                    <h2 className="mt-0.5 text-xl font-bold text-slate-100">
                      {def.title}
                    </h2>
                  </div>
                </div>

                <p className="mt-3.5 text-sm leading-relaxed text-slate-300">
                  {def.shortDesc}
                </p>

                {/* Seletor de Dificuldade com ícones de cérebro */}
                <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-2xl bg-[#090D14] p-1.5">
                  {DIFFICULTIES.map((tier) => {
                    const isSelected = activeTier === tier;
                    const tierLabel = def.tiers[tier].label;
                    return (
                      <button
                        key={tier}
                        type="button"
                        title={tierLabel}
                        aria-label={`${def.title}: ${tierLabel}`}
                        aria-pressed={isSelected}
                        onClick={() =>
                          setSelectedTiers((prev) => ({ ...prev, [mode]: tier }))
                        }
                        className={`flex min-h-[46px] items-center justify-center rounded-xl px-2 transition-colors ${
                          isSelected
                            ? 'bg-[#1A2233] text-amber-400'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <DifficultyBrainIcon tier={tier} />
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">{tierConfig.label}</span> · {tierConfig.description} · Meta {tierConfig.targetMs}ms · +{tierConfig.baseXp} XP base
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                <div className="min-w-0 text-xs text-slate-400 font-mono-tabular">
                  {modeSessions.length > 0 ? (
                    <span>
                      Recorde {bestMs}ms · {bestAccuracy}% · {modeSessions.length} {modeSessions.length === 1 ? 'treino' : 'treinos'}
                    </span>
                  ) : (
                    <span>Nenhum treino registrado</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onStartPractice(mode, activeTier)}
                  className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-[#090D14] transition-transform hover:bg-amber-400 active:scale-[0.98] whitespace-nowrap"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Jogar</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
