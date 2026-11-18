import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { GameArenaModal } from './components/GameArenaModal';
import { ImportModal } from './components/ImportModal';
import { NodeBriefingModal } from './components/NodeBriefingModal';
import { PathView } from './components/PathView';
import { PracticeView } from './components/PracticeView';
import { ProfileView } from './components/ProfileView';
import { StatsView } from './components/StatsView';
import { Toast } from './components/Toast';
import { TopNav } from './components/TopNav';
import { INITIAL_DATA, SPARK_NODES } from './data/catalog';
import { exportCsvReport, exportJsonBackup } from './services/portability';
import {
  loadBrainSparkData,
  resetBrainSparkData,
  saveBrainSparkData,
} from './services/storage';
import type {
  AppTab,
  BrainSparkData,
  DifficultyTier,
  GameMode,
  GameResultInput,
  ImportStrategy,
  PathNode,
  SessionRecord,
  ToastMessage,
} from './types/brainspark';
import {
  calculateSessionXp,
  calculateStarRating,
  computeEstimatedBrainAge,
} from './utils/brainAge';
import {
  computeUpdatedStreak,
  getLocalDateKey,
} from './utils/date';
import { mergeBrainSparkData } from './utils/validation';

interface ActiveGameConfig {
  mode: GameMode;
  difficulty: DifficultyTier;
  nodeId: string | null;
}

export default function App() {
  const [data, setData] = useState<BrainSparkData>(() => structuredClone(INITIAL_DATA));
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AppTab>('path');

  const [briefingState, setBriefingState] = useState<{
    node: PathNode;
    isLocked: boolean;
  } | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGameConfig | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (text: string, tone: ToastMessage['tone'] = 'info') => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        tone,
      });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 3600);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    loadBrainSparkData().then((loaded) => {
      if (!active) return;
      setData(loaded);
      setHydrated(true);
    });
    return () => {
      active = false;
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const persistUpdate = useCallback((updater: (prev: BrainSparkData) => BrainSparkData) => {
    setData((prev) => {
      const next = updater(prev);
      void saveBrainSparkData(next);
      return next;
    });
  }, []);

  const todayKey = getLocalDateKey();

  const { todayXp, todaySessionsCount } = useMemo(() => {
    let xp = 0;
    let count = 0;
    for (const s of data.sessions) {
      if (s.dateKey === todayKey) {
        xp += s.earnedXp;
        count += 1;
      }
    }
    return { todayXp: xp, todaySessionsCount: count };
  }, [data.sessions, todayKey]);

  const nextRecommendedNode = useMemo(() => {
    for (let i = 0; i < SPARK_NODES.length; i += 1) {
      const node = SPARK_NODES[i];
      const unlocked =
        i === 0 || (data.nodeProgress[SPARK_NODES[i - 1].id]?.completedCount ?? 0) > 0;
      const completed = (data.nodeProgress[node.id]?.completedCount ?? 0) > 0;
      if (unlocked && !completed) return node;
    }
    return SPARK_NODES[SPARK_NODES.length - 1];
  }, [data.nodeProgress]);

  const handleCompleteSession = useCallback(
    (result: GameResultInput): SessionRecord => {
      const now = Date.now();
      const dateKey = getLocalDateKey(new Date(now));
      const prevNodeProgress = result.nodeId ? data.nodeProgress[result.nodeId] : undefined;
      const isFirstNodeClear = Boolean(
        result.nodeId &&
          result.accuracy >= 50 &&
          (!prevNodeProgress || prevNodeProgress.completedCount === 0),
      );
      const earnedXp = calculateSessionXp(result, isFirstNodeClear);
      const stars = calculateStarRating(
        result.accuracy,
        result.avgReactionMs,
        result.mode,
        result.difficulty,
      );

      const tempSession: SessionRecord = {
        id: `bs-${now}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: now,
        dateKey,
        mode: result.mode,
        difficulty: result.difficulty,
        nodeId: result.nodeId,
        score: result.score,
        correctCount: result.correctCount,
        totalRounds: result.totalRounds,
        accuracy: result.accuracy,
        avgReactionMs: result.avgReactionMs,
        maxSpan: result.maxSpan,
        earnedXp,
        brainAgeAfter: data.profile.estimatedBrainAge ?? 35,
      };

      const nextSessions = [...data.sessions, tempSession];
      const nextBrainAge = computeEstimatedBrainAge(nextSessions) ?? 35;
      const finalizedSession: SessionRecord = {
        ...tempSession,
        brainAgeAfter: nextBrainAge,
      };

      persistUpdate((prev) => {
        const updatedSessions = [...prev.sessions, finalizedSession];
        const updatedBrainAge = computeEstimatedBrainAge(updatedSessions);
        const streakUpdate = computeUpdatedStreak(
          prev.profile.currentStreak,
          prev.profile.longestStreak,
          prev.profile.lastActiveDate,
          dateKey,
        );

        const nextProgress = { ...prev.nodeProgress };
        if (result.nodeId && result.accuracy >= 50) {
          const existing = nextProgress[result.nodeId];
          nextProgress[result.nodeId] = {
            nodeId: result.nodeId,
            completedCount: (existing?.completedCount ?? 0) + 1,
            bestStars: Math.max(existing?.bestStars ?? 0, stars) as 0 | 1 | 2 | 3,
            bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, result.accuracy),
            bestAvgMs:
              existing?.bestAvgMs !== null && existing?.bestAvgMs !== undefined
                ? Math.min(existing.bestAvgMs, result.avgReactionMs)
                : result.avgReactionMs,
            lastCompletedDate: dateKey,
          };
        }

        return {
          ...prev,
          profile: {
            ...prev.profile,
            currentStreak: streakUpdate.currentStreak,
            longestStreak: streakUpdate.longestStreak,
            lastActiveDate: streakUpdate.lastActiveDate,
            totalXp: prev.profile.totalXp + earnedXp,
            estimatedBrainAge: updatedBrainAge,
          },
          nodeProgress: nextProgress,
          sessions: updatedSessions,
        };
      });

      showToast(
        `+${earnedXp} XP ganhos · Idade Mental ${nextBrainAge} anos`,
        'success',
      );
      return finalizedSession;
    },
    [data.nodeProgress, data.profile.estimatedBrainAge, data.sessions, persistUpdate, showToast],
  );

  const handleUpdateProfile = useCallback(
    (updates: { displayName?: string; dailyXpGoal?: number; soundEnabled?: boolean }) => {
      persistUpdate((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...updates,
        },
      }));
    },
    [persistUpdate],
  );

  const handleExportJson = async () => {
    try {
      const res = await exportJsonBackup(data);
      showToast(
        res.method === 'native-share'
          ? 'Backup pronto para compartilhamento no Android.'
          : 'Backup JSON baixado com sucesso.',
        'success',
      );
    } catch {
      showToast('Falha ao exportar. Use a opção de visualizar o JSON bruto.', 'error');
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await exportCsvReport(data);
      showToast(
        res.method === 'native-share'
          ? 'Relatório CSV pronto para compartilhamento no Android.'
          : 'Relatório CSV baixado com sucesso.',
        'success',
      );
    } catch {
      showToast('Falha ao exportar relatório CSV.', 'error');
    }
  };

  const handleImportConfirm = (incoming: BrainSparkData, strategy: ImportStrategy) => {
    persistUpdate((prev) =>
      strategy === 'merge' ? mergeBrainSparkData(prev, incoming) : incoming,
    );
    setShowImportModal(false);
    showToast(
      strategy === 'merge'
        ? `${incoming.sessions.length} sessões mescladas com sucesso.`
        : 'Backup restaurado com sucesso.',
      'success',
    );
  };

  const handleResetAllData = async () => {
    const fresh = await resetBrainSparkData();
    setData(fresh);
    showToast('Todo o progresso do BrainSpark foi zerado.', 'info');
  };

  return (
    <div className="min-h-screen w-full min-w-0 bg-[#090D14] text-slate-100 overflow-x-clip pb-24 lg:pb-10">
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onQuickTrain={() =>
          setActiveGame({
            mode: nextRecommendedNode.mode,
            difficulty: nextRecommendedNode.difficulty,
            nodeId: nextRecommendedNode.id,
          })
        }
      />

      <main className="min-w-0">
        {!hydrated ? (
          <div className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-slate-400">
            Carregando perfil cognitivo offline...
          </div>
        ) : (
          <>
            {activeTab === 'path' && (
              <PathView
                data={data}
                todayXp={todayXp}
                todaySessionsCount={todaySessionsCount}
                onSelectNode={(node, isLocked) => setBriefingState({ node, isLocked })}
                onLaunchNextNode={(node) =>
                  setActiveGame({
                    mode: node.mode,
                    difficulty: node.difficulty,
                    nodeId: node.id,
                  })
                }
              />
            )}

            {activeTab === 'practice' && (
              <PracticeView
                sessions={data.sessions}
                onStartPractice={(mode, difficulty) =>
                  setActiveGame({ mode, difficulty, nodeId: null })
                }
              />
            )}

            {activeTab === 'stats' && <StatsView data={data} />}

            {activeTab === 'profile' && (
              <ProfileView
                data={data}
                onUpdateProfile={handleUpdateProfile}
                onExportJson={handleExportJson}
                onExportCsv={handleExportCsv}
                onOpenImportModal={() => setShowImportModal(true)}
                onResetAllData={handleResetAllData}
                onNotify={showToast}
              />
            )}
          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      <NodeBriefingModal
        node={briefingState?.node ?? null}
        progress={briefingState ? data.nodeProgress[briefingState.node.id] : undefined}
        isLocked={briefingState?.isLocked ?? false}
        onClose={() => setBriefingState(null)}
        onStart={(node) => {
          setBriefingState(null);
          setActiveGame({
            mode: node.mode,
            difficulty: node.difficulty,
            nodeId: node.id,
          });
        }}
      />

      {activeGame && (
        <GameArenaModal
          mode={activeGame.mode}
          difficulty={activeGame.difficulty}
          nodeId={activeGame.nodeId}
          soundEnabled={data.profile.soundEnabled}
          onToggleSound={() =>
            handleUpdateProfile({ soundEnabled: !data.profile.soundEnabled })
          }
          onClose={() => setActiveGame(null)}
          onCompleteSession={handleCompleteSession}
        />
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportConfirm={handleImportConfirm}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
