import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Minus,
  Palette,
  Plus,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { buildJsonBackupString } from '../services/portability';
import type { AppTheme, BrainSparkData } from '../types/brainspark';
import { sanitizeDisplayName, validateDailyXpGoal } from '../utils/validation';

interface ProfileViewProps {
  data: BrainSparkData;
  onUpdateProfile: (updates: {
    displayName?: string;
    dailyXpGoal?: number;
    soundEnabled?: boolean;
    theme?: AppTheme;
  }) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onOpenImportModal: () => void;
  onResetAllData: () => void;
  onNotify: (text: string, tone?: 'success' | 'info' | 'warning' | 'error') => void;
}

const THEME_OPTIONS: {
  id: AppTheme;
  label: string;
  desc: string;
  swatches: [string, string, string];
}[] = [
  {
    id: 'dark',
    label: 'Escuro',
    desc: 'Noturno + âmbar',
    swatches: ['#090D14', '#121824', '#F59E0B'],
  },
  {
    id: 'light',
    label: 'Claro',
    desc: 'Cinza retrô suave',
    swatches: ['#C6D0DC', '#D8E0EA', '#B45309'],
  },
  {
    id: 'colorful',
    label: 'Arcade',
    desc: 'Índigo + ciano neon',
    swatches: ['#150C2E', '#22D3EE', '#EC4899'],
  },
  {
    id: 'forest',
    label: 'Selva',
    desc: 'Verde + laranja 16-bit',
    swatches: ['#183D22', '#22522F', '#FB923C'],
  },
];

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
        <h1 className="font-pixel text-xl font-extrabold text-slate-100 text-balance sm:text-2xl">
          Perfil & Backup de Dados
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Armazenamento local-first offline ativo. Exporte backups em JSON ou relatórios em CSV quando quiser.
        </p>
      </div>

      {/* Preferências */}
      <section className="pixel-panel space-y-6 p-5 sm:p-6">
        <div className="min-w-0">
          <label
            htmlFor="display-name-input"
            className="font-pixel block text-xs font-bold text-slate-100"
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
              className="pixel-inset flex-1 min-w-0 w-0 min-h-[44px] px-3.5 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveName}
              className="pixel-btn-primary flex min-h-[44px] shrink-0 items-center gap-1.5 px-4 font-pixel text-xs font-bold whitespace-nowrap"
            >
              <Check className="h-4 w-4" />
              <span>Salvar</span>
            </button>
          </div>
        </div>

        <div className="pixel-divider min-w-0 border-t-2 pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label
              htmlFor="daily-goal-input"
              className="font-pixel text-xs font-bold text-slate-100"
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
              className="pixel-btn-secondary flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center"
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
              className="pixel-inset flex-1 min-w-0 w-0 min-h-[44px] px-3 text-center text-base font-bold text-slate-100 font-mono-tabular focus:border-amber-500 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleStepGoal(10)}
              aria-label="Aumentar meta diária em 10 XP"
              className="pixel-btn-secondary flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center"
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
                className={`min-h-[44px] border-2 px-3.5 text-xs font-bold font-mono-tabular transition-colors whitespace-nowrap ${
                  profile.dailyXpGoal === preset
                    ? 'pixel-chip-active'
                    : 'pixel-chip-idle'
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

        {/* Seletor de Tema */}
        <div className="pixel-divider min-w-0 border-t-2 pt-5">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="font-pixel text-xs font-bold text-slate-100">Tema de Cores</p>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Personalize o estilo visual do BrainSpark
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {THEME_OPTIONS.map((option) => {
              const isSelected = (profile.theme || 'dark') === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onUpdateProfile({ theme: option.id });
                    onNotify(`Tema "${option.label}" ativado.`, 'info');
                  }}
                  className={`flex min-h-[76px] flex-col items-start justify-between gap-2 border-2 border-b-4 p-3 text-left transition-all ${
                    isSelected
                      ? 'pixel-chip-active'
                      : 'pixel-chip-idle'
                  }`}
                >
                  <span className="font-pixel text-xs font-bold">{option.label}</span>
                  <span className="flex items-center gap-1.5" aria-hidden="true">
                    {option.swatches.map((hex, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 border border-black/45"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </span>
                  <span className="text-[11px] leading-tight opacity-85">{option.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pixel-divider flex min-w-0 items-center justify-between gap-4 border-t-2 pt-5">
          <div className="min-w-0">
            <p className="font-pixel text-xs font-bold text-slate-100">Efeitos Sonoros 16-Bit</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Tons chiptune sintetizados durante os desafios (100% offline)
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={profile.soundEnabled}
            onClick={() => {
              onUpdateProfile({ soundEnabled: !profile.soundEnabled });
            }}
            className={`flex min-h-[44px] shrink-0 items-center gap-2 border-2 px-4 font-pixel text-xs font-bold transition-colors whitespace-nowrap ${
              profile.soundEnabled
                ? 'pixel-chip-active'
                : 'pixel-chip-idle'
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
      <section className="pixel-panel p-5 sm:p-6">
        <h2 className="font-pixel text-sm font-bold text-slate-100">
          Exportar & Importar Dados
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Salve seu progresso em `.json`, gere relatório em `.csv` ou copie o texto JSON.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onExportJson}
            className="pixel-btn-secondary flex min-h-[48px] items-center justify-center gap-2 px-4 text-sm font-semibold whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Exportar Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="pixel-btn-secondary flex min-h-[48px] items-center justify-center gap-2 px-4 text-sm font-semibold whitespace-nowrap"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Exportar Relatório CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenImportModal}
            className="pixel-btn-secondary flex min-h-[48px] items-center justify-center gap-2 px-4 text-sm font-semibold whitespace-nowrap"
          >
            <Upload className="h-4 w-4 text-sky-400 shrink-0" />
            <span>Importar Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJsonText}
            className="pixel-btn-secondary flex min-h-[48px] items-center justify-center gap-2 px-4 text-sm font-semibold whitespace-nowrap"
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
      <section className="pixel-danger-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-pixel text-sm font-bold text-rose-300">Zerar Todo o Progresso</h2>
            <p className="mt-1 text-xs text-slate-400">
              Remove sessões, XP, ofensiva e Idade Mental do IndexedDB e localStorage.
            </p>
          </div>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex min-h-[44px] shrink-0 items-center gap-2 border-2 border-rose-500/60 bg-rose-500/15 px-4 font-pixel text-xs font-bold text-rose-300 hover:bg-rose-500/25 whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4" />
              <span>Zerar Dados</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="pixel-btn-secondary flex min-h-[44px] items-center justify-center px-4 text-xs font-semibold whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  onResetAllData();
                }}
                className="flex min-h-[44px] items-center justify-center border-2 border-rose-400 border-b-4 border-b-rose-900 bg-rose-600 px-4 font-pixel text-xs font-bold text-white hover:bg-rose-500 whitespace-nowrap"
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-xs pt-safe-top sm:items-center sm:p-4"
          onClick={() => setShowCopyJsonModal(false)}
        >
          <div
            className="pixel-panel w-full max-w-lg min-w-0 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-pixel text-base font-bold text-slate-100">
                Texto JSON de Backup
              </h3>
              <button
                type="button"
                onClick={() => setShowCopyJsonModal(false)}
                aria-label="Fechar inspetor JSON"
                className="pixel-btn-secondary flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              readOnly
              rows={8}
              value={buildJsonBackupString(data)}
              onFocus={(e) => e.currentTarget.select()}
              className="pixel-inset mt-3 w-full min-w-0 p-3 text-xs text-slate-300 font-mono-tabular focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCopyJsonText}
                className="pixel-btn-primary flex min-h-[44px] items-center gap-2 px-4 font-pixel text-xs font-bold whitespace-nowrap"
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
