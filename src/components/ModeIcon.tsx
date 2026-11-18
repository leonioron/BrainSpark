import { Calculator, Grid3X3, Layers, Palette, Table2, Zap } from 'lucide-react';
import type { GameMode } from '../types/brainspark';

interface ModeIconProps {
  mode: GameMode;
  className?: string;
}

export function ModeIcon({ mode, className = 'h-5 w-5' }: ModeIconProps) {
  switch (mode) {
    case 'math':
      return <Calculator className={className} />;
    case 'stroop':
      return <Palette className={className} />;
    case 'sequence':
      return <Grid3X3 className={className} />;
    case 'reflex':
      return <Zap className={className} />;
    case 'pairs':
      return <Layers className={className} />;
    case 'sudoku':
      return <Table2 className={className} />;
  }
}

export function getModeAccentClasses(mode: GameMode): {
  iconBox: string;
  text: string;
  bar: string;
} {
  switch (mode) {
    case 'math':
      return {
        iconBox: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
        text: 'text-amber-400',
        bar: 'bg-amber-500',
      };
    case 'stroop':
      return {
        iconBox: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
        text: 'text-sky-400',
        bar: 'bg-sky-500',
      };
    case 'sequence':
      return {
        iconBox: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
        text: 'text-emerald-400',
        bar: 'bg-emerald-500',
      };
    case 'reflex':
      return {
        iconBox: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
        text: 'text-rose-400',
        bar: 'bg-rose-500',
      };
    case 'pairs':
      return {
        iconBox: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
        text: 'text-violet-400',
        bar: 'bg-violet-500',
      };
    case 'sudoku':
      return {
        iconBox: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
        text: 'text-cyan-400',
        bar: 'bg-cyan-500',
      };
  }
}
