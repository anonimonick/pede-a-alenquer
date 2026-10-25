import { act,renderHook } from '@testing-library/react';
import { describe,it,expect } from 'vitest';
import { CartProvider,useCart } from '@/features/pedeai/cart-context';
import type { CartItem } from '@/features/pedeai/cart-rules';
const first:CartItem={key:'first',id:101,restaurantId:1,restaurant:'Surubim Burger',title:'Smash',price:21.9,base:21.9,extras:[],notes:'Sem cebola',quantity:2};
const next:CartItem={...first,key:'pizza',id:102,restaurantId:2,restaurant:'Pizzaria Bela Vista'};
describe('Single restaurant confirmation',()=>{
 it('cancel keeps all previous items and customizations',()=>{const {result}=renderHook(()=>useCart(),{wrapper:CartProvider});act(()=>{result.current.add(first);});act(()=>{result.current.add(next);});expect(result.current.pending).toEqual(next);act(()=>{result.current.cancel();});expect(result.current.cart).toEqual([first]);expect(result.current.pending).toBeNull();});
 it('confirm clears previous items and adds only the new restaurant item',()=>{const {result}=renderHook(()=>useCart(),{wrapper:CartProvider});act(()=>{result.current.add(first);});act(()=>{result.current.add(next);});act(()=>{result.current.confirm();});expect(result.current.cart).toEqual([next]);expect(result.current.pending).toBeNull();});
});
