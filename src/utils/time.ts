/**
 * Parses a time string (e.g. "09:02 AM", "18:30" or "06:00 PM") into minutes since midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  try {
    const clean = timeStr.trim();
    const parts = clean.split(' ');
    const timePart = parts[0];
    const modifier = parts[1]?.toUpperCase();

    let [hoursStr, minutesStr] = timePart.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) return 0;

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  } catch {
    return 0;
  }
}

/**
 * Parses a date string into a Date object representing the start of that day (00:00:00).
 * Handles formats like:
 * - "2026-10-17" (ISO)
 * - "17 Oct 2026", "17 October 2026", "17-10-2026", "17/10/2026"
 * - "03MAR 2015", "MAY 06 2018", "15 july 1995"
 * Fallback to 2000-01-01 if invalid.
 */
export function parseJoinedDate(joinedStr?: string | null): Date {
  if (!joinedStr || typeof joinedStr !== 'string') return new Date(2000, 0, 1);
  const s = joinedStr.trim();
  if (!s) return new Date(2000, 0, 1);

  // 1. Check ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // 2. Check DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    return new Date(y, m - 1, d);
  }

  // 3. Normalized token split (handles "03MAR 2015", "15APRIL 2018", "MAY 06 2018", "15 August 2026")
  const normalized = s
    .replace(/(\d+)([a-zA-Z]+)/g, '$1 $2')
    .replace(/([a-zA-Z]+)(\d+)/g, '$1 $2');
  const tokens = normalized.trim().split(/[\s,]+/);

  const monthsShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthsLong = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  let day: number | null = null;
  let monthIdx: number | null = null;
  let year: number | null = null;

  for (const token of tokens) {
    const lower = token.toLowerCase();
    const num = parseInt(token, 10);

    if (!isNaN(num) && token === String(num)) {
      if (num > 1900 && num <= 2100) {
        year = num;
      } else if (day === null && num >= 1 && num <= 31) {
        day = num;
      }
    } else {
      let m = monthsShort.indexOf(lower);
      if (m === -1) m = monthsLong.indexOf(lower);
      if (m === -1 && lower.length >= 3) {
        m = monthsShort.indexOf(lower.slice(0, 3));
      }
      if (m !== -1) {
        monthIdx = m;
      }
    }
  }

  if (year !== null && monthIdx !== null && day !== null) {
    return new Date(year, monthIdx, day);
  }

  // Fallback to standard Date.parse
  const parsed = Date.parse(s);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return new Date(2000, 0, 1);
}

/**
 * Checks if an employee had already joined on or before the given target date (YYYY-MM-DD or Date).
 */
export function isEmployeeActiveOnDate(
  emp: { joined?: string; created_at?: string },
  targetDate: string | Date
): boolean {
  let target: Date;
  if (typeof targetDate === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(targetDate)) {
      const [y, m, d] = targetDate.slice(0, 10).split('-').map(Number);
      target = new Date(y, m - 1, d);
    } else {
      target = parseJoinedDate(targetDate);
    }
  } else {
    target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  }
  target.setHours(0, 0, 0, 0);

  const joinedDate = parseJoinedDate(emp.joined);
  joinedDate.setHours(0, 0, 0, 0);

  return joinedDate.getTime() <= target.getTime();
}
