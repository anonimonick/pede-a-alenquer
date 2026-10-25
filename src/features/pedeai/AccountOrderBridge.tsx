import { useEffect,useRef } from 'react';
import { useAccount } from './account-context';
import { useCart } from './cart-context';
// Adopt legacy guest history only when entering a session; completed orders are associated at checkout.
export function AccountOrderBridge(){const account=useAccount();const cart=useCart();const last=useRef<string|null>(null);useEffect(()=>{if(!account.ready||!cart.ready)return;const id=account.currentUser?.id??null;if(id&&last.current!==id)account.attachOrders(cart.orders.map(o=>o.code));last.current=id;},[account.ready,cart.ready,account.currentUser?.id]);return null;}
