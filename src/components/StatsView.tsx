import { Activity, Brain, ChevronLeft, ChevronRight, Flame, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GAME_CATALOG } from '../data/catalog';
import type { BrainSparkData } from '../types/brainspark';
import { computeDomainBreakdown } from '../utils/brainAge';
import {
  formatDisplayTime,
  formatShortDate,
  formatWeekdayShort,
  getActiveStreakDisplay,
  getLastNDaysKeys,
} from '../utils/date';
import { getModeAccentClasses, ModeIcon } from './ModeIcon';

interface StatsViewProps {
  data: BrainSparkData;
}

const SESSIONS_PER_PAGE = 5;

export function StatsView({ data }: StatsViewProps) {
  const { profile, sessions } = data;
  const activeStreak = getActiveStreakDisplay(profile.currentStreak, profile.lastActiveDate);
  const domainStats = computeDomainBreakdown(sessions);
  const [page, setPage] = useState<number>(1);

  const totalPages = Math.max(1, Math.ceil(sessions.length / SESSIONS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const last7Days = getLastNDaysKeys(7);
  const dailyXpMap = new Map<string, number>();
  for (const s of sessions) {
    dailyXpMap.set(s.dateKey, (dailyXpMap.get(s.dateKey) ?? 0) + s.earnedXp);
  }
  const maxDailyXp = Math.max(
    profile.dailyXpGoal,
    ...last7Days.map((key) => dailyXpMap.get(key) ?? 0),
  );

  const trendSessions = sessions.slice(-12);
  const svgWidth = 420;
  const svgHeight = 140;
  const padX = 16;
  const padY = 18;

  const trendPoints = trendSessions.map((s, idx) => {
    const x =
      trendSessions.length === 1
        ? svgWidth / 2
        : padX + (idx / (trendSessions.length - 1)) * (svgWidth - padX * 2);
    const normalized = (s.brainAgeAfter - 20) / 60;
    const y = padY + normalized * (svgHeight - padY * 2);
    return { x, y, age: s.brainAgeAfter, mode: s.mode };
  });

  const polylinePoints = trendPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const avgAccuracy =
    sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / sessions.length)
      : null;

  const reversedSessions = [...sessions].reverse();
  const startIdx = (page - 1) * SESSIONS_PER_PAGE;
  const paginatedSessions = reversedSessions.slice(startIdx, startIdx + SESSIONS_PER_PAGE);

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 space-y-6 px-4 py-6 lg:px-6 lg:py-8">
      <div>
        <h1 className="font-pixel text-xl font-extrabold text-slate-100 text-balance sm:text-2xl">
          Status Cognitivo & Idade Mental
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Acompanhe sua Idade Mental estimada, tempo de resposta em milissegundos e consistência diária.
        </p>
      </div>

      {/* Grade de KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="pixel-panel min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Idade Mental</span>
            <Brain className="h-4 w-4 text-amber-400 shrink-0" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-100 font-mono-tabular">
            {profile.estimatedBrainAge !== null ? profile.estimatedBrainAge : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Meta ideal: 20 anos</p>
        </div>

        <div className="pixel-panel min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ofensiva</span>
            <Flame className="h-4 w-4 text-amber-400 shrink-0" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-100 font-mono-tabular">
            {activeStreak}d
          </p>
          <p className="mt-1 text-xs text-slate-400 font-mono-tabular">
            Recorde {profile.longestStreak}d
          </p>
        </div>

        <div className="pixel-panel min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>XP Total</span>
            <Zap className="h-4 w-4 text-sky-400 shrink-0" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-100 font-mono-tabular">
            {profile.totalXp}
          </p>
          <p className="mt-1 text-xs text-slate-400 font-mono-tabular">
            {sessions.length} {sessions.length === 1 ? 'sessão' : 'sessões'}
          </p>
        </div>

        <div className="pixel-panel min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Precisão</span>
            <Activity className="h-4 w-4 text-emerald-400 shrink-0" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-100 font-mono-tabular">
            {avgAccuracy !== null ? `${avgAccuracy}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Média geral</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="pixel-panel min-w-0 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h2 className="font-pixel text-sm font-bold text-slate-100">Tendência da Idade Mental</h2>
              <p className="mt-0.5 text-xs text-slate-400">Valores menores indicam respostas mais rápidas</p>
            </div>
            <span className="text-xs font-mono-tabular text-slate-400 shrink-0">
              Últimos {trendSessions.length}
            </span>
          </div>

          {trendSessions.length === 0 ? (
            <div className="pixel-inset mt-6 flex h-36 items-center justify-center px-4 text-center text-sm text-slate-400">
              Conclua seu primeiro treino para traçar a evolução da sua Idade Mental.
            </div>
          ) : (
            <div className="mt-4">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="h-36 w-full overflow-visible"
                role="img"
                aria-label="Gráfico de tendência da Idade Mental"
              >
                <line x1={padX} y1={padY} x2={svgWidth - padX} y2={padY} stroke="var(--bs-chart-grid)" strokeDasharray="4 4" />
                <line x1={padX} y1={svgHeight / 2} x2={svgWidth - padX} y2={svgHeight / 2} stroke="var(--bs-chart-grid)" strokeDasharray="4 4" />
                <line x1={padX} y1={svgHeight - padY} x2={svgWidth - padX} y2={svgHeight - padY} stroke="var(--bs-chart-grid)" strokeDasharray="4 4" />

                {trendPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="var(--bs-chart-accent)"
                    strokeWidth="3"
                    points={polylinePoints}
                  />
                )}

                {trendPoints.map((pt, i) => (
                  <g key={i}>
                    <rect
                      x={pt.x - 4}
                      y={pt.y - 4}
                      width="8"
                      height="8"
                      fill="var(--bs-canvas)"
                      stroke="var(--bs-chart-accent)"
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fill="var(--bs-chart-label)"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {pt.age}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="mt-1 flex justify-between text-[11px] text-slate-500 font-mono-tabular">
                <span>20 anos (Ápice)</span>
                <span>50 anos</span>
                <span>80 anos</span>
              </div>
            </div>
          )}
        </section>

        <section className="pixel-panel min-w-0 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h2 className="font-pixel text-sm font-bold text-slate-100">Atividade de XP (7 dias)</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Meta diária: {profile.dailyXpGoal} XP (horário local)
              </p>
            </div>
          </div>

          <div className="mt-6 grid h-36 grid-cols-7 items-end gap-2">
            {last7Days.map((dayKey) => {
              const xp = dailyXpMap.get(dayKey) ?? 0;
              const pct = Math.max(6, Math.round((xp / maxDailyXp) * 100));
              const metGoal = xp >= profile.dailyXpGoal;
              return (
                <div
                  key={dayKey}
                  className="flex h-full min-w-0 flex-col items-center justify-end gap-1.5"
                >
                  <span className="text-[11px] text-slate-400 font-mono-tabular">
                    {xp > 0 ? xp : ''}
                  </span>
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className={`w-full max-w-[30px] border-2 transition-all ${
                        xp === 0
                          ? 'pixel-bar-empty'
                          : metGoal
                            ? 'pixel-gauge-fill border-amber-300 bg-amber-500'
                            : 'pixel-gauge-fill border-amber-500/50 bg-amber-500/60'
                      }`}
                      style={{ height: `${xp === 0 ? 8 : pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium capitalize text-slate-400">
                    {formatWeekdayShort(dayKey)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Pilares Cognitivos */}
      <section className="pixel-panel p-5 sm:p-6">
        <h2 className="font-pixel text-sm font-bold text-slate-100">Pilares Cognitivos</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {domainStats.map((d) => {
            const accent = getModeAccentClasses(d.mode);
            return (
              <div key={d.mode} className="pixel-inset min-w-0 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 ${accent.iconBox}`}
                    >
                      <ModeIcon mode={d.mode} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-pixel text-xs font-bold text-slate-100 truncate">
                        {d.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{d.domain}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-200 font-mono-tabular shrink-0">
                    {d.sessionsCount > 0 ? `${d.readinessScore}/100` : '—'}
                  </span>
                </div>

                <div className="pixel-inset mt-3 h-3.5 w-full overflow-hidden p-[1px]">
                  <div
                    className={`pixel-gauge-fill h-full ${accent.bar}`}
                    style={{ width: `${d.readinessScore}%` }}
                  />
                </div>

                <p className="mt-2.5 text-xs text-slate-400 font-mono-tabular">
                  {d.sessionsCount > 0
                    ? `${d.sessionsCount} treinos · ${d.avgAccuracy}% prec. · média ${d.avgReactionMs}ms · melhor ${d.bestReactionMs}ms`
                    : 'Nenhuma sessão registrada'}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sessões Recentes: máximo 5 por página com paginação */}
      <section className="pixel-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-pixel text-sm font-bold text-slate-100">Sessões Recentes</h2>
          {sessions.length > 0 && (
            <span className="text-xs text-slate-400 font-mono-tabular">
              Mostrando {paginatedSessions.length} de {sessions.length}
            </span>
          )}
        </div>

        {paginatedSessions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            Os treinos concluídos na Trilha ou na Prática Livre aparecerão aqui.
          </p>
        ) : (
          <>
            <div className="pixel-divide mt-4">
              {paginatedSessions.map((s) => {
                const def = GAME_CATALOG[s.mode];
                const accent = getModeAccentClasses(s.mode);
                return (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 ${accent.iconBox}`}
                      >
                        <ModeIcon mode={s.mode} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">
                          {def.title} · {def.tiers[s.difficulty].label}
                        </p>
                        <p className="text-xs text-slate-400 font-mono-tabular">
                          {formatShortDate(s.dateKey)} · {formatDisplayTime(s.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono-tabular text-slate-300 shrink-0">
                      <span className="font-bold text-amber-400">+{s.earnedXp} XP</span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span>{s.accuracy}%</span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span>{s.avgReactionMs}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pixel-divider mt-4 flex items-center justify-between gap-3 border-t-2 pt-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Página anterior"
                  className="pixel-btn-secondary flex min-h-[44px] min-w-[44px] items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <span className="text-xs font-semibold text-slate-400 font-mono-tabular">
                  Página {page} de {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Próxima página"
                  className="pixel-btn-secondary flex min-h-[44px] min-w-[44px] items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
