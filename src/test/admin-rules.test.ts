import { describe, expect, it } from 'vitest';
import { canToggleRole, emptyOrderFilter, matchesOrder, restaurantState, RESTAURANT_ACTIONS } from '@/features/pedeai/admin-rules';

const order = { restaurant_id: 'r1', customer_name: 'Ana Souza', customer_phone: '(93) 99999-1234', code: 'PA-ABC123', created_at: '2026-11-03T02:00:00Z', status: 'received', payment_status: 'pending' };
describe('admin rules', () => {
  it('never lets an admin grant the admin role', () => expect(canToggleRole('me', { id: 'u', roles: ['customer'] }, 'admin')).toBe(false));
  it('blocks an admin from changing its own roles', () => expect(canToggleRole('me', { id: 'me', roles: ['admin'] }, 'courier')).toBe(false));
  it('blocks changing roles of another admin', () => expect(canToggleRole('me', { id: 'u', roles: ['admin'] }, 'courier')).toBe(false));
  it('allows granting courier to a customer', () => expect(canToggleRole('me', { id: 'u', roles: ['customer'] }, 'courier')).toBe(true));
  it('treats inactive approved restaurants as suspended and offers reactivation', () => {
    expect(restaurantState({ is_active: false, approved_at: '2026-01-01' })).toBe('suspended');
    expect(RESTAURANT_ACTIONS.suspended).toEqual(['reactivate']);
  });
  it('treats never-approved restaurants as pending approval', () => expect(restaurantState({ is_active: false, approved_at: null })).toBe('pending'));
  it('filters orders by Belém calendar day', () => {
    expect(matchesOrder(order, { ...emptyOrderFilter, from: '2026-11-02', to: '2026-11-02' })).toBe(true);
    expect(matchesOrder(order, { ...emptyOrderFilter, from: '2026-11-03' })).toBe(false);
  });
  it('filters orders by code with or without #', () => expect(matchesOrder(order, { ...emptyOrderFilter, code: '#abc1' })).toBe(true));
  it('filters orders by customer name or phone', () => {
    expect(matchesOrder(order, { ...emptyOrderFilter, customer: 'souza' })).toBe(true);
    expect(matchesOrder(order, { ...emptyOrderFilter, customer: '1234' })).toBe(true);
    expect(matchesOrder(order, { ...emptyOrderFilter, customer: 'carlos' })).toBe(false);
  });
});
