import { describe,expect,it } from 'vitest';
import { productTotal,needsReplacement,insertItem,setQuantity,type CartItem } from '@/features/pedeai/cart-rules';
const item:CartItem={key:'burger',id:101,restaurantId:1,restaurant:'Surubim Burger',title:'Smash',price:25.9,base:21.9,extras:[{name:'Bacon crocante',price:4}],notes:'Sem cebola',quantity:2};
describe('Etapa 2 ordering rules',()=>{
 it('calculates base plus selected extras multiplied by quantity',()=>{expect(productTotal(21.9,[{name:'Bacon crocante',price:4},{name:'Queijo cheddar extra',price:3}],2)).toBeCloseTo(57.8);});
 it('requires confirmation for another restaurant, including home offers',()=>{expect(needsReplacement([item],{...item,restaurantId:2})).toBe(true);expect(needsReplacement([item],item)).toBe(false);expect(needsReplacement([],item)).toBe(false);});
 it('does not mutate the old cart while a replacement is pending or cancelled',()=>{const cart=[item];needsReplacement(cart,{...item,restaurantId:2});expect(cart).toEqual([item]);expect(cart[0]?.notes).toBe('Sem cebola');});
 it('merges only identical configured items',()=>{expect(insertItem([item],item)[0]?.quantity).toBe(4);expect(insertItem([item],{...item,key:'other',notes:'Bem passado'})).toHaveLength(2);});
 it('updates quantities and removes at zero',()=>{expect(setQuantity([item],'burger',3)[0]?.quantity).toBe(3);expect(setQuantity([item],'burger',0)).toEqual([]);});
});
