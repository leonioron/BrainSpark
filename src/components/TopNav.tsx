import { Play, Zap } from 'lucide-react';
import pkg from '../../package.json';
import type { AppTab } from '../types/brainspark';

interface TopNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onQuickTrain: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'path', label: 'Trilha' },
  { id: 'practice', label: 'Prática' },
  { id: 'stats', label: 'Status' },
  { id: 'achievements', label: 'Troféus' },
  { id: 'profile', label: 'Perfil' },
];

export function TopNav({
  activeTab,
  onSelectTab,
  onQuickTrain,
}: TopNavProps) {
  return (
    <>
      <div
        aria-hidden="true"
        className="pixel-safe-top fixed top-0 left-0 right-0 z-50 h-safe-top"
      />
      <div aria-hidden="true" className="h-safe-top w-full shrink-0" />

      <header className="pixel-header sticky top-safe-top z-40 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 lg:h-16 lg:gap-8 lg:px-6">
          <button
            type="button"
            onClick={() => onSelectTab('path')}
            className="flex min-h-[44px] min-w-0 shrink-0 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
          >
            <span className="pixel-brand-badge flex h-8 w-8 shrink-0 items-center justify-center">
              <Zap className="h-4 w-4 fill-current" />
            </span>
            <span className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="font-pixel text-base font-bold tracking-wide text-slate-100 sm:text-lg">
                BrainSpark
              </span>
              <span className="text-xs font-medium text-slate-400 font-mono-tabular">
                v{pkg.version}
              </span>
            </span>
          </button>

          <nav
            aria-label="Navegação principal"
            className="hidden lg:flex items-center gap-6"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex min-h-[44px] items-center px-1.5 font-pixel text-xs font-bold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                    isActive
                      ? 'text-amber-400'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-0 right-0 h-1 bg-amber-400" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center shrink-0">
            <button
              type="button"
              onClick={onQuickTrain}
              className="pixel-btn-primary flex min-h-[44px] items-center gap-2 px-4 py-2 font-pixel text-xs font-bold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Treino Rápido</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
