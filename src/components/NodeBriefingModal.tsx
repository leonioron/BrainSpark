import { Play, Star, X } from 'lucide-react';
import { GAME_CATALOG } from '../data/catalog';
import type { NodeProgress, PathNode } from '../types/brainspark';
import { getModeAccentClasses, ModeIcon } from './ModeIcon';

interface NodeBriefingModalProps {
  node: PathNode | null;
  progress: NodeProgress | undefined;
  isLocked: boolean;
  onClose: () => void;
  onStart: (node: PathNode) => void;
}

export function NodeBriefingModal({
  node,
  progress,
  isLocked,
  onClose,
  onStart,
}: NodeBriefingModalProps) {
  if (!node) return null;

  const gameDef = GAME_CATALOG[node.mode];
  const tierConfig = gameDef.tiers[node.difficulty];
  const accent = getModeAccentClasses(node.mode);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="briefing-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-xs pt-safe-top sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="pixel-panel w-full max-w-md min-w-0 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 ${accent.iconBox}`}
            >
              <ModeIcon mode={node.mode} className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">
                {gameDef.title} · {tierConfig.label}
              </p>
              <h2
                id="briefing-title"
                className="font-pixel mt-0.5 text-lg font-bold text-slate-100 text-balance"
              >
                {node.order}. {node.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar resumo"
            className="pixel-btn-secondary flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          {gameDef.instructions}
        </p>

        <div className="pixel-inset mt-5 grid grid-cols-3 gap-3 p-3.5 text-center">
          <div className="min-w-0">
            <p className="text-xs text-slate-400">
              {node.mode === 'pairs' ? 'Pares' : node.mode === 'sudoku' ? 'Células' : 'Rodadas'}
            </p>
            <p className="mt-0.5 text-lg font-bold text-slate-100 font-mono-tabular">
              {tierConfig.roundCount}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Meta</p>
            <p className="mt-0.5 text-lg font-bold text-slate-100 font-mono-tabular">
              {tierConfig.targetMs}ms
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">XP Base</p>
            <p className="mt-0.5 text-lg font-bold text-amber-400 font-mono-tabular">
              +{tierConfig.baseXp}
            </p>
          </div>
        </div>

        {progress && progress.completedCount > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`h-4 w-4 ${
                    starIdx <= progress.bestStars
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono-tabular text-slate-400">
              Recorde {progress.bestAccuracy}% ·{' '}
              {progress.bestAvgMs !== null ? `${progress.bestAvgMs}ms` : '—'}
            </span>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn-secondary flex min-h-[48px] flex-1 items-center justify-center px-4 font-pixel text-xs font-bold whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isLocked}
            onClick={() => onStart(node)}
            className={`flex min-h-[48px] flex-[1.6] items-center justify-center gap-2 px-5 font-pixel text-xs font-bold whitespace-nowrap ${
              isLocked
                ? 'pixel-chip-idle cursor-not-allowed border-2 opacity-60'
                : 'pixel-btn-primary'
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{isLocked ? 'Bloqueado' : 'Iniciar Fase'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
