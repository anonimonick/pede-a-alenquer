import type { Option } from './data';
export type CartItem = { key: string; id: number; restaurantId: number; restaurant: string; title: string; price: number; base: number; extras: Option[]; notes: string; quantity: number };
export const productTotal = (base: number, extras: Option[], quantity: number) => (Math.round(base*100) + extras.reduce((sum, o) => sum + Math.round(o.price*100), 0)) * quantity / 100;
export const needsReplacement = (cart: CartItem[], item: CartItem) => cart.length > 0 && cart[0]?.restaurantId !== item.restaurantId;
export function insertItem(cart: CartItem[], item: CartItem): CartItem[] {
 const existing = cart.find(i => i.key === item.key);
 return existing ? cart.map(i => i.key === item.key ? {...i,quantity:i.quantity+item.quantity} : i) : [...cart,item];
}
export const setQuantity = (cart: CartItem[], key: string, quantity: number) => quantity < 1 ? cart.filter(i=>i.key!==key) : cart.map(i=>i.key===key?{...i,quantity}:i);
