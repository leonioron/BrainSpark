/**
 * Utilitários puros de data no fuso horário local.
 * Nunca deriva YYYY-MM-DD de strings UTC ISO para evitar desvios à meia-noite.
 */

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date {
  const [yStr, mStr, dStr] = dateKey.split('-');
  const year = Number(yStr);
  const month = Number(mStr) - 1;
  const day = Number(dStr);
  return new Date(year, month, day, 12, 0, 0, 0);
}

export function shiftLocalDateKey(dateKey: string, deltaDays: number): string {
  const dt = parseLocalDateKey(dateKey);
  dt.setDate(dt.getDate() + deltaDays);
  return getLocalDateKey(dt);
}

export function getLastNDaysKeys(days: number, endDate: Date = new Date()): string[] {
  const todayKey = getLocalDateKey(endDate);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(shiftLocalDateKey(todayKey, -i));
  }
  return keys;
}

export function formatShortDate(dateKey: string): string {
  const dt = parseLocalDateKey(dateKey);
  return dt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatWeekdayShort(dateKey: string): string {
  const dt = parseLocalDateKey(dateKey);
  const label = dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return label.slice(0, 3);
}

export function formatDisplayTime(timestamp: number): string {
  const dt = new Date(timestamp);
  return dt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function computeUpdatedStreak(
  currentStreak: number,
  longestStreak: number,
  lastActiveDate: string | null,
  todayKey: string = getLocalDateKey(),
): {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
} {
  if (!lastActiveDate) {
    const next = 1;
    return {
      currentStreak: next,
      longestStreak: Math.max(longestStreak, next),
      lastActiveDate: todayKey,
    };
  }

  if (lastActiveDate === todayKey) {
    const normalized = Math.max(1, currentStreak);
    return {
      currentStreak: normalized,
      longestStreak: Math.max(longestStreak, normalized),
      lastActiveDate: todayKey,
    };
  }

  const yesterdayKey = shiftLocalDateKey(todayKey, -1);
  if (lastActiveDate === yesterdayKey) {
    const next = currentStreak + 1;
    return {
      currentStreak: next,
      longestStreak: Math.max(longestStreak, next),
      lastActiveDate: todayKey,
    };
  }

  return {
    currentStreak: 1,
    longestStreak: Math.max(longestStreak, 1),
    lastActiveDate: todayKey,
  };
}

export function getActiveStreakDisplay(
  currentStreak: number,
  lastActiveDate: string | null,
  todayKey: string = getLocalDateKey(),
): number {
  if (!lastActiveDate || currentStreak <= 0) return 0;
  const yesterdayKey = shiftLocalDateKey(todayKey, -1);
  if (lastActiveDate === todayKey || lastActiveDate === yesterdayKey) {
    return currentStreak;
  }
  return 0;
}
