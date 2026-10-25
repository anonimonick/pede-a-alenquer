import { createContext, useContext, useState, type ReactNode } from 'react';
import { insertItem, needsReplacement, setQuantity, type CartItem } from './cart-rules';
const CartContext = createContext<ReturnType<typeof useCartState> | null>(null);
function useCartState() {
 const [cart,setCart]=useState<CartItem[]>([]);
 const [pending,setPending]=useState<CartItem|null>(null);
 const add=(item:CartItem)=>{if(needsReplacement(cart,item)){setPending(item);return false;}setCart(c=>insertItem(c,item));return true;};
 const confirm=()=>{if(pending){setCart([pending]);setPending(null);}};
 return {cart,setCart,pending,add,confirm,cancel:()=>setPending(null),update:(key:string,q:number)=>setCart(c=>setQuantity(c,key,q))};
}
export function CartProvider({children}:{children:ReactNode}) {return <CartContext.Provider value={useCartState()}>{children}</CartContext.Provider>;}
export function useCart(){const context=useContext(CartContext);if(!context)throw new Error('CartProvider required');return context;}
