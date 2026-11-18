import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { GAME_CATALOG } from '../data/catalog';
import type { BrainSparkData } from '../types/brainspark';
import { getLocalDateKey } from '../utils/date';

function escapeCsvCell(value: string | number | null): string {
  const str = value === null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildJsonBackupString(data: BrainSparkData): string {
  return JSON.stringify(data, null, 2);
}

export function buildCsvReport(data: BrainSparkData): string {
  const headers = [
    'ID Sessão',
    'Data Local',
    'Data/Hora',
    'Atividade',
    'Dificuldade',
    'Nó da Trilha',
    'Acertos',
    'Total Rodadas',
    'Precisão (%)',
    'Reação Média (ms)',
    'Alcance Máximo',
    'Pontuação',
    'XP Ganho',
    'Idade Mental Após',
  ];

  const rows = data.sessions.map((s) => [
    s.id,
    s.dateKey,
    new Date(s.timestamp).toLocaleString('pt-BR'),
    GAME_CATALOG[s.mode].title,
    GAME_CATALOG[s.mode].tiers[s.difficulty].label,
    s.nodeId ?? 'Prática Livre',
    s.correctCount,
    s.totalRounds,
    s.accuracy,
    s.avgReactionMs,
    s.maxSpan,
    s.score,
    s.earnedXp,
    s.brainAgeAfter,
  ]);

  return [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');
}

async function deliverFile(
  filename: string,
  content: string,
  mimeType: string,
  shareTitle: string,
): Promise<{ method: 'native-share' | 'web-download' }> {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    const uriResult = await Filesystem.getUri({
      directory: Directory.Cache,
      path: filename,
    });
    await Share.share({
      title: shareTitle,
      text: `Exportação BrainSpark: ${filename}`,
      url: uriResult.uri,
      dialogTitle: shareTitle,
    });
    return { method: 'native-share' };
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return { method: 'web-download' };
}

export async function exportJsonBackup(data: BrainSparkData) {
  const dateKey = getLocalDateKey();
  const filename = `brainspark-backup-${dateKey}.json`;
  const content = buildJsonBackupString(data);
  return deliverFile(filename, content, 'application/json;charset=utf-8', 'Exportar Backup BrainSpark');
}

export async function exportCsvReport(data: BrainSparkData) {
  const dateKey = getLocalDateKey();
  const filename = `brainspark-relatorio-${dateKey}.csv`;
  const content = buildCsvReport(data);
  return deliverFile(filename, content, 'text/csv;charset=utf-8', 'Exportar Relatório CSV BrainSpark');
}
