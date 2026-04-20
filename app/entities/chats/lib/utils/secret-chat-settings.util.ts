/** ISO-время автоудаления чата через `hours` часов от текущего момента. */
export function isoScheduledDeletionAfterHours(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

/** Значение для `disappearingMessageSeconds` в PATCH чата (`null` = выкл.). */
export function disappearingMessageSecondsUpdate(seconds: number): number | null {
  return seconds === 0 ? null : seconds;
}
