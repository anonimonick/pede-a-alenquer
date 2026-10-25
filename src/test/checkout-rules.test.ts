import {describe,it,expect,beforeEach} from 'vitest';
import {calculateOrder,validateCoupon,validateCheckout,emptyDraft,cartSchema,readLocal,writeLocal,cents,parseChange} from '@/features/pedeai/checkout-rules';
import type {CartItem} from '@/features/pedeai/cart-rules';
const item:CartItem={key:'smash',id:101,restaurantId:1,restaurant:'Surubim Burger',title:'Smash Duplo Artesanal',base:21.9,price:21.9,extras:[],notes:'',quantity:2};
describe('Stage 3 pricing rules',()=>{
 it('delivery adds the restaurant fee in integer cents',()=>expect(calculateOrder([item],'delivery',null)).toEqual({subtotal:4380,delivery:450,discount:0,total:4830}));
 it('pickup zeros delivery',()=>expect(calculateOrder([item],'pickup',null).delivery).toBe(0));
 it('BEMVINDO10 gives 10 percent of products only',()=>expect(calculateOrder([item],'delivery','BEMVINDO10')).toEqual({subtotal:4380,delivery:450,discount:438,total:4392}));
 it('BEMVINDO10 is capped at R$10',()=>expect(calculateOrder([{...item,quantity:10}],'delivery','BEMVINDO10').discount).toBe(1000));
 it('PEDEAI5 gives R$5 at R$25',()=>expect(calculateOrder([{...item,price:25,quantity:1}],'pickup','PEDEAI5').discount).toBe(500));
 it('PEDEAI5 gives no discount below R$25',()=>expect(calculateOrder([{...item,quantity:1}],'pickup','PEDEAI5').discount).toBe(0));
 it('rejects PEDEAI5 application below minimum',()=>expect(validateCoupon('PEDEAI5',2499,null).code).toBeUndefined());
 it('rejects a duplicate coupon',()=>expect(validateCoupon('BEMVINDO10',3000,'BEMVINDO10').code).toBeUndefined());
 it('rejects fictional unknown codes',()=>expect(validateCoupon('FAKE',3000,null).code).toBeUndefined());
 it('cents prevent floating errors',()=>expect(calculateOrder([{...item,price:.1,quantity:3}],'pickup',null).total).toBe(30));
});
const pickup={...emptyDraft,mode:'pickup' as const,address:{...emptyDraft.address,name:'Maria',phone:'93999999999'},reviewed:true};
describe('Checkout validation',()=>{
 it('pickup requires name and phone but not address',()=>expect(validateCheckout(pickup,4380)).toEqual({}));
 it('requires a customer name',()=>expect(validateCheckout({...pickup,address:{...pickup.address,name:''}},4380).name).toBeDefined());
 it('requires phone with area code',()=>expect(validateCheckout({...pickup,address:{...pickup.address,phone:'123'}},4380).phone).toBeDefined());
 it('delivery requires street, identification, community and reference',()=>{const errors=validateCheckout({...pickup,mode:'delivery'},4380);for(const key of ['street','number','district','reference'])expect(errors[key]).toBeDefined();});
 it('review checkbox is mandatory',()=>expect(validateCheckout({...pickup,reviewed:false},4380).reviewed).toBeDefined());
 it('cash change cannot be smaller than total',()=>expect(validateCheckout({...pickup,payment:'Dinheiro',change:'43,79'},4380).change).toBeDefined());
 it('cash change can equal total',()=>expect(validateCheckout({...pickup,payment:'Dinheiro',change:'43,80'},4380).change).toBeUndefined());
 it('cash change remains optional',()=>expect(validateCheckout({...pickup,payment:'Dinheiro',change:''},4380).change).toBeUndefined());
 it('rejects malformed cash input',()=>expect(Number.isNaN(parseChange('1e9'))).toBe(true));
 it('limits address inputs',()=>expect(validateCheckout({...pickup,address:{...pickup.address,name:'a'.repeat(101)}},4380).name).toBeDefined());
});
describe('Safe local persistence',()=>{
 beforeEach(()=>localStorage.clear());
 it('restores valid cart',()=>{writeLocal('test',[item]);expect(readLocal('test',cartSchema,[])).toEqual([item]);});
 it('ignores corrupt JSON',()=>{localStorage.setItem('test','{no');expect(readLocal('test',cartSchema,[])).toEqual([]);});
 it('rejects mixed restaurant cart',()=>expect(cartSchema.safeParse([item,{...item,key:'other',restaurantId:2}]).success).toBe(false));
 it('rejects manipulated prices',()=>expect(cartSchema.safeParse([{...item,price:1}]).success).toBe(false));
 it('rejects negative quantities',()=>expect(cartSchema.safeParse([{...item,quantity:-1}]).success).toBe(false));
});
