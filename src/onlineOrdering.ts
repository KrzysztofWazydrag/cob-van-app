// Local demo service day; replace with a persisted workplace cutoff before live ordering.
export function initialOrderCutoffAt(now = Date.now()): number {
  const cutoff = new Date(now);
  cutoff.setHours(9, 45, 0, 0);
  return cutoff.getTime();
}

export function canOrderOnline(orderCutoffAt: number, now: number): boolean {
  return Number.isFinite(orderCutoffAt) && Number.isFinite(now) && now < orderCutoffAt;
}
