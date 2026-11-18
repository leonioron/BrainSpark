import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Minus,
  Plus,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { buildJsonBackupString } from '../services/portability';
import type { BrainSparkData } from '../types/brainspark';
import { sanitizeDisplayName, validateDailyXpGoal } from '../utils/validation';

interface ProfileViewProps {
  data: BrainSparkData;
  onUpdateProfile: (updates: {
    displayName?: string;
    dailyXpGoal?: number;
    soundEnabled?: boolean;
  }) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onOpenImportModal: () => void;
  onResetAllData: () => void;
  onNotify: (text: string, tone?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function ProfileView({
  data,
  onUpdateProfile,
  onExportJson,
  onExportCsv,
  onOpenImportModal,
  onResetAllData,
  onNotify,
}: ProfileViewProps) {
  const { profile } = data;
  const [nameInput, setNameInput] = useState<string>(profile.displayName);
  const [goalInput, setGoalInput] = useState<string>(String(profile.dailyXpGoal));
  const [goalError, setGoalError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [showCopyJsonModal, setShowCopyJsonModal] = useState<boolean>(false);

  const handleSaveName = () => {
    const clean = sanitizeDisplayName(nameInput);
    setNameInput(clean);
    onUpdateProfile({ displayName: clean });
    onNotify('Nome do perfil atualizado.', 'success');
  };

  const applyGoalValue = (nextNumeric: number) => {
    const res = validateDailyXpGoal(nextNumeric);
    setGoalInput(String(res.clamped));
    if (!res.valid && res.error) {
      setGoalError(res.error);
    } else {
      setGoalError(null);
    }
    onUpdateProfile({ dailyXpGoal: res.clamped });
  };

  const handleStepGoal = (delta: number) => {
    const current = Number(goalInput) || profile.dailyXpGoal;
    applyGoalValue(current + delta);
  };

  const handleGoalBlur = () => {
    const parsed = Number(goalInput);
    applyGoalValue(parsed);
  };

  const handleCopyJsonText = async () => {
    const text = buildJsonBackupString(data);
    try {
      await navigator.clipboard.writeText(text);
      onNotify('JSON de backup copiado para a área de transferência.', 'success');
    } catch {
      setShowCopyJsonModal(true);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6 px-4 py-6 lg:px-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 text-balance sm:text-3xl">
          Perfil & Backup de Dados
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Armazenamento local-first offline ativo. Exporte backups em JSON ou relatórios em CSV quando quiser.
        </p>
      </div>

      {/* Preferências */}
      <section className="space-y-6 rounded-3xl border border-white/8 bg-[#121824] p-5 sm:p-6">
        <div className="min-w-0">
          <label
            htmlFor="display-name-input"
            className="block text-sm font-bold text-slate-100"
          >
            Nome de Exibição
          </label>
          <div className="mt-2 flex min-w-0 items-center gap-2.5">
            <input
              id="display-name-input"
              type="text"
              maxLength={28}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 min-w-0 w-0 min-h-[44px] rounded-xl border border-white/10 bg-[#090D14] px-3.5 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveName}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-sm font-bold text-[#090D14] hover:bg-amber-400 whitespace-nowrap"
            >
              <Check className="h-4 w-4" />
              <span>Salvar</span>
            </button>
          </div>
        </div>

        <div className="min-w-0 border-t border-white/8 pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label
              htmlFor="daily-goal-input"
              className="text-sm font-bold text-slate-100"
            >
              Meta Diária de XP
            </label>
            <span className="text-xs text-slate-400 font-mono-tabular">
              10 – 500 XP
            </span>
          </div>

          <div className="mt-2.5 flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => handleStepGoal(-10)}
              aria-label="Diminuir meta diária em 10 XP"
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#090D14] text-slate-200 hover:bg-white/8"
            >
              <Minus className="h-4 w-4" />
            </button>

            <input
              id="daily-goal-input"
              type="number"
              min={10}
              max={500}
              step={5}
              value={goalInput}
              onChange={(e) => {
                setGoalInput(e.target.value);
                setGoalError(null);
              }}
              onBlur={handleGoalBlur}
              className="flex-1 min-w-0 w-0 min-h-[44px] rounded-xl border border-white/10 bg-[#090D14] px-3 text-center text-base font-bold text-slate-100 font-mono-tabular focus:border-amber-500 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleStepGoal(10)}
              aria-label="Aumentar meta diária em 10 XP"
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#090D14] text-slate-200 hover:bg-white/8"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {[30, 60, 100, 150].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyGoalValue(preset)}
                className={`min-h-[44px] rounded-xl border px-3.5 text-xs font-bold font-mono-tabular transition-colors whitespace-nowrap ${
                  profile.dailyXpGoal === preset
                    ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                    : 'border-white/10 bg-[#090D14] text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset} XP
              </button>
            ))}
          </div>

          {goalError && (
            <p className="mt-2 text-xs font-medium text-rose-400">{goalError}</p>
          )}
        </div>

        <div className="flex min-w-0 items-center justify-between gap-4 border-t border-white/8 pt-5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-100">Efeitos Sonoros</p>
            <p className="text-xs text-slate-400">
              Tons sintetizados durante os desafios (100% offline)
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={profile.soundEnabled}
            onClick={() => {
              onUpdateProfile({ soundEnabled: !profile.soundEnabled });
            }}
            className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors whitespace-nowrap ${
              profile.soundEnabled
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                : 'border-white/10 bg-[#090D14] text-slate-400'
            }`}
          >
            {profile.soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4" />
                <span>Ligado</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" />
                <span>Mudo</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Portabilidade e Backup */}
      <section className="rounded-3xl border border-white/8 bg-[#121824] p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-100">
          Exportar & Importar Dados
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Salve seu progresso em `.json`, gere relatório em `.csv` ou copie o texto JSON.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onExportJson}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#090D14] px-4 text-sm font-semibold text-slate-100 hover:border-amber-500/40 hover:bg-[#192233] whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Exportar Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#090D14] px-4 text-sm font-semibold text-slate-100 hover:border-amber-500/40 hover:bg-[#192233] whitespace-nowrap"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Exportar Relatório CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenImportModal}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#090D14] px-4 text-sm font-semibold text-slate-100 hover:border-amber-500/40 hover:bg-[#192233] whitespace-nowrap"
          >
            <Upload className="h-4 w-4 text-sky-400 shrink-0" />
            <span>Importar Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJsonText}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#090D14] px-4 text-sm font-semibold text-slate-100 hover:border-amber-500/40 hover:bg-[#192233] whitespace-nowrap"
          >
            <Copy className="h-4 w-4 text-slate-300 shrink-0" />
            <span>Copiar JSON de Backup</span>
          </button>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowCopyJsonModal(true)}
            className="min-h-[44px] text-xs font-semibold text-amber-400 hover:text-amber-300"
          >
            Visualizar texto JSON bruto (alternativa para WebView)
          </button>
        </div>
      </section>

      {/* Zona de Perigo */}
      <section className="rounded-3xl border border-rose-500/20 bg-[#121824] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-rose-300">Zerar Todo o Progresso</h2>
            <p className="mt-1 text-xs text-slate-400">
              Remove sessões, XP, ofensiva e Idade Mental do IndexedDB e localStorage.
            </p>
          </div>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4" />
              <span>Zerar Dados</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 bg-[#090D14] px-4 text-sm font-semibold text-slate-300 whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  onResetAllData();
                }}
                className="flex min-h-[44px] items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-500 whitespace-nowrap"
              >
                Confirmar Limpeza
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modal de Inspeção de JSON Bruto */}
      {showCopyJsonModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Backup JSON bruto"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm pt-safe-top sm:items-center sm:p-4"
          onClick={() => setShowCopyJsonModal(false)}
        >
          <div
            className="w-full max-w-lg min-w-0 rounded-t-3xl border border-white/10 bg-[#121824] p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-100">
                Texto JSON de Backup
              </h3>
              <button
                type="button"
                onClick={() => setShowCopyJsonModal(false)}
                aria-label="Fechar inspetor JSON"
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-white/8 hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              readOnly
              rows={8}
              value={buildJsonBackupString(data)}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-3 w-full min-w-0 rounded-2xl border border-white/10 bg-[#090D14] p-3 text-xs text-slate-300 font-mono-tabular focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCopyJsonText}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-[#090D14] hover:bg-amber-400 whitespace-nowrap"
              >
                <Copy className="h-4 w-4" />
                <span>Copiar Texto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
