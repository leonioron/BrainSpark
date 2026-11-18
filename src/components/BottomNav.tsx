import { BarChart3, Compass, Dumbbell, User } from 'lucide-react';
import type { AppTab } from '../types/brainspark';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const TABS: {
  id: AppTab;
  label: string;
  icon: typeof Compass;
}[] = [
  { id: 'path', label: 'Trilha', icon: Compass },
  { id: 'practice', label: 'Prática', icon: Dumbbell },
  { id: 'stats', label: 'Status', icon: BarChart3 },
  { id: 'profile', label: 'Perfil', icon: User },
];

export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação mobile"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-white/10 bg-[#090D14]/95 backdrop-blur-md pb-safe-bottom"
    >
      <div className="grid grid-cols-4 items-center px-2 pt-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[48px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                isActive
                  ? 'text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
              <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
