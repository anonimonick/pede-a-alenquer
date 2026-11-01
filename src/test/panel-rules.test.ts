import { describe, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { allowedActions, countStages, panelStage, parsePrice, validReason } from '@/features/pedeai/panel-rules';
import { orderStatusLabel } from '@/features/pedeai/account-context';
import { applyDbMenu } from '@/features/pedeai/menu-sync';
import type { Product } from '@/features/pedeai/data';

describe('restaurant panel rules', () => {
  it('treats a checkout order stored as "received" as a new order', () => {
    expect(panelStage('received', null)).toBe('new');
    expect(allowedActions('new')).toEqual(['accept', 'reject']);
  });
  it('only allows preparing after the order was accepted', () => {
    expect(allowedActions(panelStage('received', '2026-10-31T10:00:00Z'))).toEqual(['preparing']);
  });
  it('lets the restaurant mark ready but never delivered', () => {
    expect(allowedActions('preparing')).toEqual(['ready']);
    expect(allowedActions('ready')).toEqual([]);
  });
  it('requires a rejection reason of at least 3 characters', () => {
    expect(validReason('  ')).toBe(false);
    expect(validReason('Sem estoque')).toBe(true);
  });
  it('rejects zero, negative and over R$ 5.000 prices', () => {
    expect(parsePrice('0')).toBeNull();
    expect(parsePrice('-3')).toBeNull();
    expect(parsePrice('5000,01')).toBeNull();
    expect(parsePrice('12,90')).toBe(1290);
  });
  it('counts dashboard indicators from real statuses', () => {
    expect(countStages([{ status: 'received', accepted_at: null }, { status: 'received', accepted_at: 'x' }, { status: 'preparing', accepted_at: 'x' }, { status: 'ready', accepted_at: 'x' }, { status: 'delivered', accepted_at: 'x' }])).toEqual({ new: 1, preparing: 2, ready: 1, done: 1 });
  });
  it('shows customers an accepted order and a rejection', () => {
    expect(orderStatusLabel('received', null)).toBe('Aguardando restaurante');
    expect(orderStatusLabel('received', 'x')).toBe('Pedido aceito');
    expect(orderStatusLabel('cancelled', null)).toBe('Recusado / cancelado');
  });
});

describe('menu sync from the database', () => {
  const fixture: Product = { id: 101, restaurantId: 1, title: 'Old', desc: '', category: 'Smashs', price: 21.9, img: 'a.jpg', groups: [{ name: 'Adicionais', type: 'multiple', options: [{ name: 'Bacon', price: 4 }] }] };
  it('uses the database price and keeps fixture options', () => {
    const out = applyDbMenu([{ demo_id: 101, restaurant_demo: 1, name: 'Smash', description: null, price: '23.50', image_url: null, is_popular: true, category: 'Smashs' }], [fixture], [fixture]);
    expect(out[0]?.price).toBe(23.5);
    expect(out[0]?.groups[0]?.options[0]?.name).toBe('Bacon');
  });
  it('drops products missing from the available list', () => {
    const out = applyDbMenu([{ demo_id: 2001, restaurant_demo: 1, name: 'Novo', description: null, price: 10, image_url: null, is_popular: false, category: null }], [{ ...fixture }], [fixture]);
    expect(out.map(p => p.id)).toEqual([2001]);
  });
});
