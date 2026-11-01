/** Pure rules for the restaurant panel; the database trigger guard_order_update enforces the same transitions. */
export type PanelAction = 'accept' | 'reject' | 'preparing' | 'ready';
export type PanelStage = 'new' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'done' | 'cancelled';

export function panelStage(status: string, acceptedAt: string | null): PanelStage {
  if (status === 'received') return acceptedAt ? 'accepted' : 'new';
  if (status === 'delivered') return 'done';
  if (status === 'preparing' || status === 'ready' || status === 'out_for_delivery' || status === 'cancelled') return status;
  return 'new';
}
export const STAGE_LABEL: Record<PanelStage, string> = { new: 'Novo', accepted: 'Aceito', preparing: 'Em preparação', ready: 'Pronto', out_for_delivery: 'Saiu para entrega', done: 'Concluído', cancelled: 'Recusado / cancelado' };

/** Actions the restaurant staff may take from each stage. */
export function allowedActions(stage: PanelStage): PanelAction[] {
  if (stage === 'new') return ['accept', 'reject'];
  if (stage === 'accepted') return ['preparing'];
  if (stage === 'preparing') return ['ready'];
  return [];
}
export const validReason = (reason: string) => { const r = reason.trim(); return r.length >= 3 && r.length <= 300; };

/** Validates a menu price typed in Brazilian format ("12,90"); returns cents or null. */
export function parsePrice(input: string): number | null {
  const s = input.trim().replace(/^R\$\s*/, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents > 0 && cents <= 500000 ? cents : null;
}
export const validImageUrl = (url: string) => url === '' || (/^https:\/\/\S+$/.test(url) && url.length <= 500);

export function countStages(orders: { status: string; accepted_at: string | null }[]) {
  const c = { new: 0, preparing: 0, ready: 0, done: 0 };
  for (const o of orders) {
    const s = panelStage(o.status, o.accepted_at);
    if (s === 'new') c.new++; else if (s === 'accepted' || s === 'preparing') c.preparing++; else if (s === 'ready') c.ready++; else if (s === 'done') c.done++;
  }
  return c;
}
