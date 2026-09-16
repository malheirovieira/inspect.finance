const TIME_ZONE = 'America/Sao_Paulo';

/** Data de hoje (yyyy-mm-dd) no fuso de Brasília — segura para <input type="date"> e colunas DATE. */
export function todayISODate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function currentYearMonthBrasilia(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: 'numeric' }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  return { year, month };
}

export function currentDayOfMonthBrasilia(): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, day: 'numeric' }).format(new Date()));
}

export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
): string {
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: TIME_ZONE, ...options });
}

export function formatDateTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleString('pt-BR', { timeZone: TIME_ZONE, ...options });
}

/** Extrai o dia do mês de uma string yyyy-mm-dd sem passar por conversão de fuso horário. */
export function dayOfMonthFromISODate(date: string): number {
  return Number(date.slice(8, 10));
}

/** yyyy-mm-dd de uma data ISO/Date, no fuso de Brasília — usado para agrupar transações por dia local. */
export function isoDateInBrasilia(date: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
}

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/** Quantidade de dias de um mês (1-12) — matemática de calendário, não depende de fuso. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Dia da semana (0=domingo) do dia 1 de um mês (1-12) — matemática de calendário, não depende de fuso. */
export function weekdayOfFirstDay(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}
