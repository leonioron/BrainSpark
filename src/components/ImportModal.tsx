import { FileUp, X } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import type { BrainSparkData, ImportStrategy } from '../types/brainspark';
import { parseAndValidateBackupJson } from '../utils/validation';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportConfirm: (incoming: BrainSparkData, strategy: ImportStrategy) => void;
}

export function ImportModal({
  isOpen,
  onClose,
  onImportConfirm,
}: ImportModalProps) {
  const [rawJson, setRawJson] = useState<string>('');
  const [strategy, setStrategy] = useState<ImportStrategy>('merge');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawJson(reader.result);
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Não foi possível ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    if (!rawJson.trim()) {
      setErrorMsg('Selecione um arquivo .json ou cole o texto do backup primeiro.');
      return;
    }
    const result = parseAndValidateBackupJson(rawJson);
    if (!result.ok) {
      setErrorMsg(result.error);
      return;
    }
    setErrorMsg(null);
    setRawJson('');
    onImportConfirm(result.data, strategy);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm pt-safe-top sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg min-w-0 rounded-t-3xl border border-white/10 bg-[#121824] p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="import-modal-title"
              className="text-lg font-bold text-slate-100"
            >
              Importar Backup BrainSpark
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Carregue um arquivo `.json` ou cole o texto JSON diretamente em WebViews restritos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de importação"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-white/8 hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <label className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-[#090D14] px-4 py-3 text-sm font-semibold text-slate-200 hover:border-amber-500/50">
            <FileUp className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Escolher Arquivo .json</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>

        <div className="mt-4">
          <label
            htmlFor="import-json-textarea"
            className="block text-xs font-semibold text-slate-300"
          >
            Ou cole o texto JSON do backup
          </label>
          <textarea
            id="import-json-textarea"
            value={rawJson}
            onChange={(e) => {
              setRawJson(e.target.value);
              setErrorMsg(null);
            }}
            rows={5}
            placeholder='{"version": 1, "profile": {...}, "sessions": [...]}'
            className="mt-1.5 w-full min-w-0 rounded-2xl border border-white/10 bg-[#090D14] p-3 text-xs text-slate-200 font-mono-tabular placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-300">Modo de Importação</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStrategy('merge')}
              className={`min-h-[48px] rounded-xl border px-3 py-2 text-left transition-colors ${
                strategy === 'merge'
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                  : 'border-white/10 bg-[#090D14] text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="block text-xs font-bold">Mesclar Dados</span>
              <span className="block text-[11px] text-slate-400">
                Mantém atuais e soma novos treinos
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStrategy('replace')}
              className={`min-h-[48px] rounded-xl border px-3 py-2 text-left transition-colors ${
                strategy === 'replace'
                  ? 'border-rose-500 bg-rose-500/15 text-rose-300'
                  : 'border-white/10 bg-[#090D14] text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="block text-xs font-bold">Substituir Tudo</span>
              <span className="block text-[11px] text-slate-400">
                Sobrescreve o progresso atual
              </span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <p className="mt-3 text-xs font-medium text-rose-400">{errorMsg}</p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 text-sm font-semibold text-slate-300 hover:bg-white/8 whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-bold text-[#090D14] hover:bg-amber-400 whitespace-nowrap"
          >
            {strategy === 'merge' ? 'Mesclar Backup' : 'Substituir Tudo'}
          </button>
        </div>
      </div>
    </div>
  );
}
