import { PRODUCTS, RESTAURANTS, type Product } from './data';

export type DbProductRow = { demo_id: number | null; restaurant_demo: number | null; name: string; description: string | null; price: number | string; image_url: string | null; is_popular: boolean; category: string | null };

/**
 * Replaces the in-memory menu with the products currently available in the database
 * (name, description, price, image, availability, category) while keeping the
 * fixture option groups and photos for the original demo products.
 * The array is updated in place so every existing lookup (menu, cart, checkout) sees the live data.
 */
export function applyDbMenu(rows: DbProductRow[], target: Product[] = PRODUCTS, fixtures: readonly Product[] = FIXTURES): Product[] {
  const next: Product[] = [];
  for (const r of rows) {
    if (r.demo_id == null || r.restaurant_demo == null) continue;
    const base = fixtures.find(p => p.id === r.demo_id);
    const price = Number(r.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    next.push({
      id: r.demo_id, restaurantId: r.restaurant_demo, title: r.name, desc: r.description ?? '',
      category: r.category ?? base?.category ?? 'Outros', price, popular: r.is_popular,
      img: r.image_url || base?.img || RESTAURANTS[r.restaurant_demo - 1]?.img || '', groups: base?.groups ?? [],
    });
  }
  if (!next.length) return target;
  target.splice(0, target.length, ...next);
  return target;
}
const FIXTURES: readonly Product[] = PRODUCTS.map(p => ({ ...p }));
