import { BarChart3, Compass, Dumbbell, Trophy, User } from 'lucide-react';
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
  { id: 'achievements', label: 'Troféus', icon: Trophy },
  { id: 'profile', label: 'Perfil', icon: User },
];

export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação mobile"
      className="pixel-bottom-nav fixed bottom-0 left-0 right-0 z-40 lg:hidden backdrop-blur-sm pb-safe-bottom"
    >
      <div className="grid w-full grid-cols-[repeat(5,minmax(0,1fr))] items-stretch pt-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-[50px] w-full min-w-0 flex-col items-center justify-center gap-1 px-1 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                isActive
                  ? 'text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 h-0.5 w-7 bg-amber-400" />
              )}
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.9]'}`} />
              <span className="font-pixel w-full truncate text-center text-[9.5px] font-bold tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
