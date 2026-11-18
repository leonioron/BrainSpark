import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types/brainspark';

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null;

  const toneStyles =
    toast.tone === 'success'
      ? 'border-emerald-500/35 bg-[#121824] text-emerald-300'
      : toast.tone === 'error'
        ? 'border-rose-500/40 bg-[#121824] text-rose-300'
        : toast.tone === 'warning'
          ? 'border-amber-500/40 bg-[#121824] text-amber-300'
          : 'border-sky-500/35 bg-[#121824] text-sky-300';

  const Icon =
    toast.tone === 'success'
      ? CheckCircle2
      : toast.tone === 'error' || toast.tone === 'warning'
        ? AlertCircle
        : Info;

  return (
    <div className="pointer-events-none fixed bottom-20 left-4 right-4 z-50 flex justify-center lg:bottom-6 lg:left-auto lg:right-6">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex w-full max-w-md min-w-0 items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-black/60 ${toneStyles}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium leading-snug text-slate-100">{toast.text}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar notificação"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
