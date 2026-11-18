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
  { id: 'profile', label: 'Perfil' },
];

export function TopNav({
  activeTab,
  onSelectTab,
  onQuickTrain,
}: TopNavProps) {
  return (
    <>
      {/* Faixa fixa no topo para proteção da barra de status do Android */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-50 h-safe-top bg-[#090D14]"
      />

      {/* Espaçador em fluxo para impedir que o cabeçalho sticky cubra o conteúdo abaixo */}
      <div aria-hidden="true" className="h-safe-top w-full shrink-0" />

      <header className="sticky top-safe-top z-40 border-b border-white/8 bg-[#090D14]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 lg:h-16 lg:gap-8 lg:px-6">
          {/* Zona 1: Marca e versão v1.0.0.0 */}
          <button
            type="button"
            onClick={() => onSelectTab('path')}
            className="flex min-h-[44px] min-w-0 shrink-0 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 rounded-lg"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-[#090D14]">
              <Zap className="h-4 w-4 fill-current" />
            </span>
            <span className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="text-lg font-bold tracking-tight text-slate-100">
                BrainSpark
              </span>
              <span className="text-xs font-medium text-slate-400 font-mono-tabular">
                v{pkg.version}
              </span>
            </span>
          </button>

          {/* Zona 2 (Desktop): 4 links de navegação em linha única */}
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
                  className={`relative flex min-h-[44px] items-center px-1 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 rounded ${
                    isActive
                      ? 'text-amber-400'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zona 3 (Desktop): Ação principal */}
          <div className="hidden lg:flex items-center shrink-0">
            <button
              type="button"
              onClick={onQuickTrain}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-[#090D14] transition-transform hover:bg-amber-400 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Treino Rápido</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
