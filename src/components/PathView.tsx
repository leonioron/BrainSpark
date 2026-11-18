import { Brain, Check, Flame, Lock, Play, Star } from 'lucide-react';
import { GAME_CATALOG, SPARK_CHAPTERS, SPARK_NODES } from '../data/catalog';
import type { BrainSparkData, PathNode } from '../types/brainspark';
import { getActiveStreakDisplay } from '../utils/date';
import { getModeAccentClasses, ModeIcon } from './ModeIcon';

interface PathViewProps {
  data: BrainSparkData;
  todayXp: number;
  todaySessionsCount: number;
  onSelectNode: (node: PathNode, isLocked: boolean) => void;
  onLaunchNextNode: (node: PathNode) => void;
}

const STAGGER_OFFSETS = ['translate-x-0', '-translate-x-5 sm:-translate-x-7', 'translate-x-0', 'translate-x-5 sm:translate-x-7'];

export function PathView({
  data,
  todayXp,
  todaySessionsCount,
  onSelectNode,
  onLaunchNextNode,
}: PathViewProps) {
  const { profile, nodeProgress } = data;
  const activeStreak = getActiveStreakDisplay(profile.currentStreak, profile.lastActiveDate);
  const dailyPct = Math.min(100, Math.round((todayXp / Math.max(1, profile.dailyXpGoal)) * 100));

  const isNodeUnlocked = (orderIdx: number): boolean => {
    if (orderIdx === 0) return true;
    const prevNode = SPARK_NODES[orderIdx - 1];
    return (nodeProgress[prevNode.id]?.completedCount ?? 0) > 0;
  };

  const nextRecommendedNode =
    SPARK_NODES.find((node, idx) => {
      const unlocked = isNodeUnlocked(idx);
      const completed = (nodeProgress[node.id]?.completedCount ?? 0) > 0;
      return unlocked && !completed;
    }) ?? SPARK_NODES[SPARK_NODES.length - 1];

  const completedNodesTotal = SPARK_NODES.filter(
    (n) => (nodeProgress[n.id]?.completedCount ?? 0) > 0,
  ).length;

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-6 lg:px-6 lg:py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-start">
        {/* Coluna Esquerda: Trilha estilo RPG 16-bit */}
        <section className="min-w-0 space-y-6">
          {/* Card Diário Mobile com Barra de XP + Ofensiva + Idade Mental */}
          <div className="pixel-panel p-5 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  Meta Diária · {todaySessionsCount} {todaySessionsCount === 1 ? 'sessão hoje' : 'sessões hoje'}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-100 font-mono-tabular">
                  {todayXp} / {profile.dailyXpGoal} XP
                </p>
              </div>
              <button
                type="button"
                onClick={() => onLaunchNextNode(nextRecommendedNode)}
                className="pixel-btn-primary flex min-h-[44px] shrink-0 items-center gap-2 px-4 font-pixel text-xs font-bold whitespace-nowrap"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Treinar</span>
              </button>
            </div>

            <div className="pixel-inset mt-3.5 h-4 w-full overflow-hidden p-0.5">
              <div
                className="pixel-gauge-fill h-full bg-amber-500 transition-[width] duration-300"
                style={{ width: `${dailyPct}%` }}
              />
            </div>

            <div className="pixel-divider mt-4 grid grid-cols-3 gap-2 border-t-2 pt-3.5 text-left">
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400">Ofensiva</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-slate-100 font-mono-tabular">
                  <Flame className={`h-3.5 w-3.5 shrink-0 ${activeStreak > 0 ? 'text-amber-400 fill-amber-400/30' : 'text-slate-600'}`} />
                  <span>{activeStreak}d</span>
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400">Idade Mental</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-slate-100 font-mono-tabular">
                  <Brain className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                  <span className="truncate">
                    {profile.estimatedBrainAge !== null ? `${profile.estimatedBrainAge} anos` : 'Calibrar'}
                  </span>
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400">Total XP</p>
                <p className="mt-0.5 text-sm font-bold text-amber-400 font-mono-tabular">
                  {profile.totalXp} XP
                </p>
              </div>
            </div>
          </div>

          {/* Capítulos e Nós da Trilha */}
          <div className="space-y-8">
            {SPARK_CHAPTERS.map((chapter) => {
              const chapterNodes = SPARK_NODES.filter((n) => n.chapterId === chapter.id);
              const chapterDone = chapterNodes.filter(
                (n) => (nodeProgress[n.id]?.completedCount ?? 0) > 0,
              ).length;

              return (
                <div key={chapter.id} className="pixel-panel p-5 sm:p-6">
                  <div className="pixel-inset flex flex-wrap items-baseline justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <p className="font-pixel text-[11px] font-bold text-amber-400">
                        Capítulo 0{chapter.index} · {chapter.focusLabel}
                      </p>
                      <h2 className="font-pixel mt-1.5 text-lg font-bold text-slate-100 text-balance">
                        {chapter.title}
                      </h2>
                      <p className="mt-1 text-xs text-slate-400">
                        {chapter.subtitle}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-300 font-mono-tabular shrink-0">
                      {chapterDone}/{chapterNodes.length}
                    </span>
                  </div>

                  {/* Nós da Trilha 16-bit */}
                  <div className="mt-7 flex flex-col items-center gap-6 py-2">
                    {chapterNodes.map((node, localIdx) => {
                      const globalIdx = SPARK_NODES.findIndex((n) => n.id === node.id);
                      const unlocked = isNodeUnlocked(globalIdx);
                      const prog = nodeProgress[node.id];
                      const isCompleted = (prog?.completedCount ?? 0) > 0;
                      const isCurrent = node.id === nextRecommendedNode.id && !isCompleted;
                      const accent = getModeAccentClasses(node.mode);
                      const offsetClass = STAGGER_OFFSETS[localIdx % STAGGER_OFFSETS.length];

                      return (
                        <div
                          key={node.id}
                          className={`flex flex-col items-center gap-2 transition-transform ${offsetClass}`}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectNode(node, !unlocked)}
                            aria-label={`${node.title} (${GAME_CATALOG[node.mode].title})`}
                            className={`relative flex h-[72px] w-[72px] items-center justify-center border-2 border-b-4 shadow-[3px_3px_0_0_var(--bs-shadow)] transition-transform active:translate-y-[2px] active:border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                              !unlocked
                                ? 'pixel-node-locked'
                                : isCurrent
                                  ? 'pixel-node-current'
                                  : isCompleted
                                    ? 'pixel-node-done'
                                    : `pixel-node-idle ${accent.text}`
                            }`}
                          >
                            {!unlocked ? (
                              <Lock className="h-6 w-6" />
                            ) : (
                              <ModeIcon mode={node.mode} className="h-7 w-7" />
                            )}

                            {isCompleted && (
                              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center border-2 border-[var(--bs-canvas)] bg-emerald-400 text-[#090D14]">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </span>
                            )}
                          </button>

                          <div className="min-w-0 text-center">
                            <p className="font-pixel text-xs font-bold text-slate-100">
                              {node.order}. {node.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {node.subtitle}
                            </p>
                            {isCompleted && prog && (
                              <div className="mt-1 flex items-center justify-center gap-1">
                                {[1, 2, 3].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3.5 w-3.5 ${
                                      s <= prog.bestStars
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-700'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                            {isCurrent && (
                              <span className="font-pixel mt-1 inline-block text-[10px] font-bold text-amber-400">
                                Próxima fase
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Coluna Direita (Desktop Sticky) */}
        <aside className="hidden lg:flex lg:sticky lg:top-24 lg:flex-col lg:gap-5 min-w-0">
          <div className="pixel-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="font-pixel text-xs font-bold text-slate-400">
                Idade Mental
              </span>
              <Brain className="h-5 w-5 text-amber-400" />
            </div>

            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-5xl font-extrabold tracking-tight text-slate-100 font-mono-tabular">
                {profile.estimatedBrainAge !== null ? profile.estimatedBrainAge : '—'}
              </span>
              <span className="text-sm font-medium text-slate-400">
                {profile.estimatedBrainAge !== null ? 'anos (meta 20)' : 'Faça 1 treino para calibrar'}
              </span>
            </div>

            <div className="pixel-divider mt-5 grid grid-cols-2 gap-3 border-t-2 pt-4">
              <div>
                <p className="text-xs text-slate-400">Ofensiva Atual</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-slate-100 font-mono-tabular">
                  <Flame className={`h-4 w-4 ${activeStreak > 0 ? 'text-amber-400 fill-amber-400/30' : 'text-slate-600'}`} />
                  <span>{activeStreak} dias</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Progresso</p>
                <p className="mt-1 text-xl font-bold text-slate-100 font-mono-tabular">
                  {completedNodesTotal}/{SPARK_NODES.length}
                </p>
              </div>
            </div>
          </div>

          <div className="pixel-panel p-6">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-pixel text-sm font-bold text-slate-100">Meta Diária</h3>
              <span className="text-sm font-bold text-amber-400 font-mono-tabular">
                {todayXp} / {profile.dailyXpGoal} XP
              </span>
            </div>

            <div className="pixel-inset mt-3 h-4 w-full overflow-hidden p-0.5">
              <div
                className="pixel-gauge-fill h-full bg-amber-500 transition-[width] duration-300"
                style={{ width: `${dailyPct}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-slate-400">
              {dailyPct >= 100
                ? 'Meta diária batida. Continue mantendo o ritmo!'
                : `Faltam ${Math.max(0, profile.dailyXpGoal - todayXp)} XP hoje · ${profile.totalXp} XP acumulados`}
            </p>

            <button
              type="button"
              onClick={() => onLaunchNextNode(nextRecommendedNode)}
              className="pixel-btn-primary mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 px-4 font-pixel text-xs font-bold"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Iniciar {nextRecommendedNode.title}</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
