import { Check, Compass, Flame, Lock, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import type { BrainSparkData } from '../types/brainspark';
import { evaluateAchievements, type AchievementIconId } from '../utils/achievements';

interface AchievementsViewProps {
  data: BrainSparkData;
}

function AchievementIcon({ icon, className }: { icon: AchievementIconId; className?: string }) {
  switch (icon) {
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'target':
      return <Target className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'compass':
      return <Compass className={className} />;
  }
}

export function AchievementsView({ data }: AchievementsViewProps) {
  const achievements = evaluateAchievements(data);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalPct = Math.round((unlockedCount / Math.max(1, achievements.length)) * 100);

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6 px-4 py-6 lg:px-6 lg:py-8">
      <div>
        <h1 className="font-pixel text-xl font-extrabold text-slate-100 text-balance sm:text-2xl">
          Conquistas & Troféus
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Complete metas de consistência, precisão e exploração para desbloquear medalhas 16-bit.
        </p>
      </div>

      {/* Resumo Geral de Conquistas */}
      <section className="pixel-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="pixel-brand-badge flex h-12 w-12 shrink-0 items-center justify-center">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-pixel text-xs font-bold text-amber-400">Progresso Geral</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-100 font-mono-tabular">
                {unlockedCount} / {achievements.length} desbloqueadas
              </p>
            </div>
          </div>
          <span className="font-pixel text-sm font-bold text-amber-400 font-mono-tabular shrink-0">
            {totalPct}%
          </span>
        </div>

        <div className="pixel-inset mt-4 h-4 w-full overflow-hidden p-0.5">
          <div
            className="pixel-gauge-fill h-full bg-amber-500 transition-[width] duration-300"
            style={{ width: `${totalPct}%` }}
          />
        </div>
      </section>

      {/* Lista das 5 Conquistas */}
      <div className="grid grid-cols-1 gap-4">
        {achievements.map((item) => {
          const pct = Math.min(100, Math.round((item.current / Math.max(1, item.target)) * 100));
          return (
            <article
              key={item.id}
              className={`pixel-panel flex min-w-0 flex-col gap-3 p-5 transition-opacity ${
                item.unlocked ? '' : 'opacity-90'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 ${
                    item.unlocked
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400'
                      : 'pixel-chip-idle'
                  }`}
                >
                  <AchievementIcon icon={item.icon} className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-pixel text-sm font-bold text-slate-100">
                      {item.title}
                    </h2>
                    <span
                      title={item.unlocked ? 'Conquista liberada' : 'Conquista bloqueada'}
                      aria-label={item.unlocked ? 'Conquista liberada' : 'Conquista bloqueada'}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 ${
                        item.unlocked
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400'
                          : 'pixel-chip-idle'
                      }`}
                    >
                      {item.unlocked ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="pixel-inset h-3 flex-1 overflow-hidden p-[1px]">
                  <div
                    className={`pixel-gauge-fill h-full transition-[width] duration-300 ${
                      item.unlocked ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs font-bold text-slate-300 font-mono-tabular">
                  {item.current} / {item.target} {item.unitLabel}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
