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
