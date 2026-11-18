import { Brain, Play, Zap } from 'lucide-react';
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
    return (
      <span className="relative inline-flex items-center justify-center pr-1.5 pt-1">
        <Brain className="h-6 w-6" />
        <Zap className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 fill-current text-amber-400" />
      </span>
    );
  }
  return (
    <span className="relative inline-flex items-center justify-center px-2 pt-2">
      <Brain className="h-6 w-6" />
      <Zap className="absolute left-0 top-0 h-3 w-3 -rotate-12 fill-current text-amber-400" />
      <Zap className="absolute left-1/2 -top-1 h-3.5 w-3.5 -translate-x-1/2 fill-current text-amber-300" />
      <Zap className="absolute right-0 top-0 h-3 w-3 rotate-12 fill-current text-amber-400" />
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
        <h1 className="font-pixel text-xl font-extrabold text-slate-100 text-balance sm:text-2xl">
          Laboratório de Prática Livre
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Escolha qualquer cartucho cognitivo e o nível de esforço mental para treinar velocidade e memória.
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
              className="pixel-panel flex min-w-0 flex-col justify-between p-6"
            >
              <div className="min-w-0">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 ${accent.iconBox}`}
                  >
                    <ModeIcon mode={mode} className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-400">
                      {def.cognitiveDomain}
                    </p>
                    <h2 className="font-pixel mt-0.5 text-base font-bold text-slate-100 sm:text-lg">
                      {def.title}
                    </h2>
                  </div>
                </div>

                <p className="mt-3.5 text-sm leading-relaxed text-slate-300">
                  {def.shortDesc}
                </p>

                {/* Seletor 16-bit de Dificuldade com ícones de cérebro */}
                <div className="pixel-inset mt-5 grid grid-cols-3 gap-2 p-2">
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
                        className={`flex min-h-[46px] items-center justify-center border-2 border-b-4 transition-all ${
                          isSelected
                            ? 'pixel-chip-active'
                            : 'pixel-chip-idle'
                        }`}
                      >
                        <DifficultyBrainIcon tier={tier} />
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">{tierConfig.label}</span> · {tierConfig.description} · Meta {tierConfig.targetMs}ms · +{tierConfig.baseXp} XP
                </p>
              </div>

              <div className="pixel-divider mt-5 flex items-center justify-between gap-3 border-t-2 pt-4">
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
                  className="pixel-btn-primary flex min-h-[44px] shrink-0 items-center gap-2 px-4 font-pixel text-xs font-bold whitespace-nowrap"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
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
