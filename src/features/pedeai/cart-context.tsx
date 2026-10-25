import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { insertItem, needsReplacement, setQuantity, type CartItem } from './cart-rules';
import { cartSchema,couponSchema,ordersSchema,addressSchema,emptyDraft,readLocal,writeLocal,type Draft,type Coupon,type DemoOrder } from './checkout-rules';
const CartContext = createContext<ReturnType<typeof useCartState> | null>(null);
function useCartState() {
 const [cart,setCart]=useState<CartItem[]>([]);
 const [pending,setPending]=useState<CartItem|null>(null);
 const [coupon,setCoupon]=useState<Coupon|null>(null);
 const [draft,setDraft]=useState<Draft>(emptyDraft);
 const [orders,setOrders]=useState<DemoOrder[]>([]);
 const [ready,setReady]=useState(false);
 const [storageWarning,setStorageWarning]=useState(false);
 useEffect(()=>{setCart(readLocal('pa-cart-v3',cartSchema,[]));setCoupon(readLocal('pa-coupon-v3',couponSchema.nullable(),null));setOrders(readLocal('pa-orders-v3',ordersSchema,[]));const address=readLocal('pa-address-v3',addressSchema.nullable(),null);if(address)setDraft({...emptyDraft,address,saveAddress:true});setReady(true);},[]);
 useEffect(()=>{if(!ready)return;const results=[writeLocal('pa-cart-v3',cart),writeLocal('pa-coupon-v3',coupon),writeLocal('pa-orders-v3',orders)];if(results.includes(false))setStorageWarning(true);},[cart,coupon,orders,ready]);
 useEffect(()=>{if(!ready)return;if(draft.saveAddress){if(!writeLocal('pa-address-v3',draft.address))setStorageWarning(true);}else{try{localStorage.removeItem('pa-address-v3');}catch{setStorageWarning(true);}}},[draft.address,draft.saveAddress,ready]);
 const add=(item:CartItem)=>{if(needsReplacement(cart,item)){setPending(item);return false;}setCart(c=>insertItem(c,item));return true;};
 const confirm=()=>{if(pending){setCart([pending]);setCoupon(null);setDraft(d=>({...d,reviewed:false}));setPending(null);}};
 const recordOrder=(order:DemoOrder)=>{setOrders(o=>[order,...o].slice(0,30));if(draft.saveAddress&&!writeLocal('pa-address-v3',draft.address))setStorageWarning(true);};
 const reset=()=>{setCart([]);setCoupon(null);setDraft(d=>({...emptyDraft,address:d.saveAddress?d.address:emptyDraft.address,saveAddress:d.saveAddress}));};
 return {cart,setCart,pending,add,confirm,cancel:()=>setPending(null),update:(key:string,q:number)=>{setCart(c=>setQuantity(c,key,q));setDraft(d=>({...d,reviewed:false}));},coupon,setCoupon,draft,setDraft,orders,recordOrder,reset,ready,storageWarning};
}
export function CartProvider({children}:{children:ReactNode}) {return <CartContext.Provider value={useCartState()}>{children}</CartContext.Provider>;}
export function useCart(){const context=useContext(CartContext);if(!context)throw new Error('CartProvider required');return context;}
