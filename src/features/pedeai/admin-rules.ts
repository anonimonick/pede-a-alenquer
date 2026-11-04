/** Pure rules for the admin panel; the database enforces the same limits. */
export const ADMIN_GRANTABLE_ROLES = ['restaurant_owner', 'courier'] as const;
export type AppRole = 'customer' | 'restaurant_owner' | 'courier' | 'admin';
/** An admin may toggle only operational roles, never on itself or on another admin. */
export function canToggleRole(actorId: string, target: { id: string; roles: AppRole[] }, role: AppRole) {
  return (ADMIN_GRANTABLE_ROLES as readonly string[]).includes(role) && target.id !== actorId && !target.roles.includes('admin');
}
export type RestaurantState = 'pending' | 'active' | 'suspended';
export const restaurantState = (r: { is_active: boolean; approved_at: string | null }): RestaurantState => r.is_active ? 'active' : r.approved_at ? 'suspended' : 'pending';
export const RESTAURANT_ACTIONS: Record<RestaurantState, ('approve' | 'suspend' | 'reactivate')[]> = { pending: ['approve'], active: ['suspend'], suspended: ['reactivate'] };

export type OrderFilter = { restaurant: string; customer: string; code: string; from: string; to: string; status: string; payment: string };
export const emptyOrderFilter: OrderFilter = { restaurant: '', customer: '', code: '', from: '', to: '', status: '', payment: '' };
type FilterableOrder = { restaurant_id: string; customer_name: string; customer_phone: string; code: string; created_at: string; status: string; payment_status: string };
/** Dates are calendar days (YYYY-MM-DD) in Belém time, inclusive on both ends. */
export function matchesOrder(o: FilterableOrder, f: OrderFilter) {
  const day = new Date(new Date(o.created_at).getTime() - 3 * 3600_000).toISOString().slice(0, 10);
  const c = f.customer.trim().toLowerCase();
  return (!f.restaurant || o.restaurant_id === f.restaurant)
    && (!c || o.customer_name.toLowerCase().includes(c) || o.customer_phone.replace(/\D/g, '').includes(c.replace(/\D/g, '') || '\u0000'))
    && (!f.code.trim() || o.code.toLowerCase().includes(f.code.trim().toLowerCase().replace(/^#/, '')))
    && (!f.from || day >= f.from) && (!f.to || day <= f.to)
    && (!f.status || o.status === f.status) && (!f.payment || o.payment_status === f.payment);
}
