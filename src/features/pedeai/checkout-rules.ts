import { z } from 'zod';
import { PRODUCTS, RESTAURANTS } from './data';
import type { CartItem } from './cart-rules';
export const cents = (value:number) => Math.round(value*100);
export const money = (value:number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value/100);
export const couponSchema=z.enum(['BEMVINDO10','PEDEAI5']);
export type Coupon=z.infer<typeof couponSchema>;
export const FEES=[450,0,500,0,350,400];
export function calculateOrder(cart:CartItem[],mode:'delivery'|'pickup',coupon:Coupon|null) {
 const subtotal=cart.reduce((sum,item)=>sum+cents(item.price)*item.quantity,0);
 const delivery=mode==='pickup'||!cart.length?0:FEES[(cart[0]?.restaurantId??1)-1]??0;
 const discount=coupon==='BEMVINDO10'?Math.min(1000,Math.round(subtotal*.1)):coupon==='PEDEAI5'&&subtotal>=2500?500:0;
 return {subtotal,delivery,discount,total:Math.max(0,subtotal+delivery-discount)};
}
export function validateCoupon(code:string,subtotal:number,active:Coupon|null):{code?:Coupon;message:string} {
 const parsed=couponSchema.safeParse(code.trim().toUpperCase());
 if(!parsed.success)return {message:'Cupom inválido'};
 if(parsed.data===active)return {message:'Cupom já aplicado'};
 if(parsed.data==='PEDEAI5'&&subtotal<2500)return {message:'Valor mínimo não atingido: subtotal de R$ 25,00'};
 return {code:parsed.data,message:'Cupom aplicado!'};
}
const text=(max:number)=>z.string().trim().max(max,'Texto muito longo');
export const addressSchema=z.object({type:z.enum(['Minha casa','Trabalho','Outro']),name:text(100),phone:text(25),cep:text(9),street:text(150),number:text(80),district:text(120),complement:text(150),reference:text(200),instructions:text(300)});
export type Address=z.infer<typeof addressSchema>;
export const emptyAddress:Address={type:'Minha casa',name:'',phone:'',cep:'',street:'',number:'',district:'',complement:'',reference:'',instructions:''};
export const draftSchema=z.object({mode:z.enum(['delivery','pickup']),address:addressSchema,saveAddress:z.boolean(),payment:z.enum(['Pix','Cartão de Crédito','Cartão de Débito','Dinheiro']),change:text(20),reviewed:z.boolean()});
export type Draft=z.infer<typeof draftSchema>;
export const emptyDraft:Draft={mode:'delivery',address:emptyAddress,saveAddress:false,payment:'Pix',change:'',reviewed:false};
export function parseChange(value:string):number|null {
 if(!value.trim())return null;
 if(!/^\d{1,7}([.,]\d{1,2})?$/.test(value.trim()))return NaN;
 return cents(Number(value.replace(',','.')));
}
export function validateCheckout(draft:Draft,total:number) {
 const errors:Record<string,string>={};
 const parsed=draftSchema.safeParse(draft);
 if(!parsed.success)for(const issue of parsed.error.issues)errors[issue.path.at(-1)?.toString()??'form']=issue.message;
 if(draft.address.name.trim().length<2)errors['name']='Informe o nome do destinatário';
 const digits=draft.address.phone.replace(/\D/g,'');
 if(!/^[\d\s()+-]+$/.test(draft.address.phone)||digits.length<10||digits.length>13)errors['phone']='Informe um telefone com DDD';
 if(draft.mode==='delivery'){
  for(const [field,label] of [['street','a rua, estrada ou ramal'],['number','o número ou identificação do imóvel'],['district','o bairro ou comunidade'],['reference','um ponto de referência']] as const)if(!draft.address[field].trim())errors[field]=`Informe ${label}`;
  if(draft.address.cep&&!/^\d{5}-?\d{3}$/.test(draft.address.cep))errors['cep']='CEP deve ter 8 dígitos';
 }
 const change=parseChange(draft.change);
 if(draft.payment==='Dinheiro'&&change!==null&&(!Number.isFinite(change)||change<total))errors['change']='O valor para troco deve ser maior ou igual ao total do pedido';
 if(!draft.reviewed)errors['reviewed']='Confirme que revisou os dados do pedido';
 return errors;
}
export const itemSchema=z.object({key:text(1500),id:z.number().int(),restaurantId:z.number().int().min(1).max(6),restaurant:text(100),title:text(150),price:z.number().finite().nonnegative(),base:z.number().finite().nonnegative(),extras:z.array(z.object({name:text(100),price:z.number().finite().nonnegative()})).max(30),notes:text(300),quantity:z.number().int().min(1).max(9999)});
export const cartSchema=z.array(itemSchema).max(100).superRefine((items,ctx)=>{
 for(const item of items){
  const product=PRODUCTS.find(p=>p.id===item.id);
  if(!product||product.restaurantId!==item.restaurantId||items[0]?.restaurantId!==item.restaurantId||product.price!==item.base||Math.abs(cents(item.price)-cents(item.base)-item.extras.reduce((sum,o)=>sum+cents(o.price),0))>0||item.extras.some(o=>!product.groups.some(g=>g.options.some(v=>v.name===o.name&&v.price===o.price))))ctx.addIssue({code:'custom',message:'Carrinho inválido'});
 }
 if(new Set(items.map(i=>i.key)).size!==items.length)ctx.addIssue({code:'custom',message:'Itens duplicados'});
});
export const orderSchema=z.object({code:z.string().regex(/^PA-[A-Z0-9]+$/),createdAt:z.string(),status:z.literal('Em preparação'),items:cartSchema,draft:draftSchema,coupon:couponSchema.nullable(),totals:z.object({subtotal:z.number().int().nonnegative(),delivery:z.number().int().nonnegative(),discount:z.number().int().nonnegative(),total:z.number().int().nonnegative()})});
export type DemoOrder=z.infer<typeof orderSchema>;
export const ordersSchema=z.array(orderSchema).max(30);
export function readLocal<T>(key:string,schema:z.ZodType<T>,fallback:T):T {try{const raw=localStorage.getItem(key);if(!raw)return fallback;const result=schema.safeParse(JSON.parse(raw));return result.success?result.data:fallback;}catch{return fallback;}}
export function writeLocal(key:string,value:unknown):boolean {try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
export const restaurantName=(id:number)=>RESTAURANTS[id-1]?.name??'Restaurante';
