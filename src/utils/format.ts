export function formatDurationMin(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatMinutesOnly(seconds: number): string {
  return `${Math.max(1, Math.round(seconds / 60))}`;
}

export function formatDeltaMin(deltaSec: number): string {
  const mins = Math.round(deltaSec / 60);
  if (mins === 0) return 'On schedule';
  return mins > 0 ? `+${mins} min vs GTFS` : `${mins} min faster`;
}

export function formatDistanceKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatSimClock(simTimeMs: number): string {
  const d = new Date(simTimeMs);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatSimClockWithSec(simTimeMs: number): string {
  const d = new Date(simTimeMs);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function formatEtaTime(baseMs: number, offsetSec: number): string {
  return formatSimClock(baseMs + offsetSec * 1000);
}
