import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Clock, Truck, Star, Search, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RESTAURANTS, DETAILS, PRODUCTS, brl, type Product, type Option } from './data';
import { productTotal } from './cart-rules';
import { useCart } from './cart-context';
import { FavoriteButton } from './AccountControls';
import { useAccount } from './account-context';

export function RestaurantMenu({restaurantId,notify}:{restaurantId:number;notify:(text:string)=>void}) {
 const restaurant=RESTAURANTS[restaurantId-1];
 const details=DETAILS[restaurantId-1];
 const {openByDemo}=useAccount();
 const isOpen=openByDemo?.get(restaurantId)??details?.isOpen??false;
 const products=PRODUCTS.filter(p=>p.restaurantId===restaurantId);
 const [search,setSearch]=useState('');
 const [category,setCategory]=useState('Todos');
 const [product,setProduct]=useState<Product|null>(null);
 const categories=['Todos','Mais pedidos',...new Set(products.map(p=>p.category))];
 if (!restaurant || !details) return null;
 const term=search.trim().toLocaleLowerCase('pt-BR');
 const filtered=products.filter(p=>(category==='Todos'||(category==='Mais pedidos'?p.popular:p.category===category))&&`${p.title} ${p.desc} ${p.category}`.toLocaleLowerCase('pt-BR').includes(term));
 return <main className="restaurant-page">
  <div className="container"><Link className="back-link" to="/"><ArrowLeft size={18}/>Voltar para restaurantes</Link></div>
  <div className="restaurant-cover"><img src={restaurant.img} alt={`Capa demonstrativa de ${restaurant.name}`}/></div>
  <section className="container restaurant-heading">
   <img className="restaurant-avatar" src={restaurant.img} alt={`Foto demonstrativa de ${restaurant.name}`}/>
   <div className="restaurant-heading-body"><div className="restaurant-heading-top"><span className="menu-demo">Demonstrativo</span><span className={`restaurant-status ${isOpen?'is-open':'is-closed'}`}>{isOpen?'Aberto':'Fechado'}</span></div>
   <FavoriteButton restaurantId={restaurantId}/><h1>{restaurant.name}</h1><p className="menu-muted">{restaurant.category}</p>
   <p className="menu-rating"><Star size={16} fill="currentColor"/><strong>{restaurant.rating.toFixed(1)}</strong><span>· {details.reviews} avaliações demonstrativas</span></p>
   <div className="restaurant-facts"><span><Clock size={16}/>{restaurant.time}</span><span><Truck size={16}/>{restaurant.fee==='Grátis'?'Entrega grátis':`Entrega ${restaurant.fee}`}</span><span>Pedido mínimo {brl(details.minimum)}</span><span>Horário demonstrativo: {details.hours}</span></div></div>
  </section>
  <section className="container menu-section"><div className="menu-title-row"><h2>Cardápio</h2><span className="menu-muted">{products.length} produtos</span></div>
   <label className="menu-search"><Search size={20}/><input aria-label="Buscar no cardápio" placeholder="Buscar no cardápio" value={search} onChange={e=>setSearch(e.target.value)}/>{search && <Button variant="ghost" size="sm" onClick={()=>setSearch('')}>Limpar</Button>}</label>
   <div className="menu-tabs" role="tablist" aria-label="Categorias do cardápio">{categories.map(c=><Button variant="ghost" key={c} role="tab" aria-selected={category===c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</Button>)}</div>
   {filtered.length===0?<div className="empty-state"><Search/><p>Nenhum item encontrado. Que tal buscar outro sabor?</p><Button variant="ghost" onClick={()=>{setSearch('');setCategory('Todos');}}>Ver todo o cardápio</Button></div>: [...new Set(filtered.map(p=>p.category))].map(c=><section className="menu-group" key={c}><h3>{c}</h3><div className="product-grid">{filtered.filter(p=>p.category===c).map(p=><Button variant="ghost" className="menu-product" key={p.id} onClick={()=>setProduct(p)} aria-label={`Ver ${p.title}`}><div className="menu-product-copy">{p.popular&&<span className="popular-label">Mais pedido</span>}<h4>{p.title}</h4><p>{p.desc}</p><strong>{brl(p.price)}</strong></div><div className="menu-product-image"><img src={p.img} alt={p.title} loading="lazy"/><span className="product-plus"><Plus size={18}/></span></div></Button>)}</div></section>)}
  </section>
  <Dialog open={Boolean(product)} onOpenChange={open=>{if(!open)setProduct(null);}}>{product&&<ProductModal key={product.id} product={product} close={()=>setProduct(null)} notify={notify}/>}</Dialog>
 </main>;
}
function ProductModal({product,close,notify}:{product:Product;close:()=>void;notify:(text:string)=>void}) {
 const {add}=useCart();
 const [selected,setSelected]=useState<Record<string,string[]>>(()=>Object.fromEntries(product.groups.filter(g=>g.type==='single').map(g=>[g.name,[g.options[0]?.name ?? ""]])));
 const [quantity,setQuantity]=useState(1);
 const [notes,setNotes]=useState('');
 const extras:Option[]=product.groups.flatMap(g=>g.options.filter(o=>selected[g.name]?.includes(o.name)));
 const total=productTotal(product.price,extras,quantity);
 const submit=()=>{const restaurant=RESTAURANTS[product.restaurantId-1];if (!restaurant) return;const normalized=notes.trim();const key=JSON.stringify([product.id,extras.map(o=>o.name).sort(),normalized]);const success=add({key,id:product.id,restaurantId:product.restaurantId,restaurant:restaurant.name,title:product.title,base:product.price,price:productTotal(product.price,extras,1),extras,notes:normalized,quantity});close();if(success)notify(`${product.title} adicionado ao carrinho!`);};
 return <DialogContent className="pa-modal product-modal"><img className="product-modal-photo" src={product.img} alt={product.title}/><div className="product-modal-body"><span className="menu-demo">Produto demonstrativo</span><DialogTitle>{product.title}</DialogTitle><DialogDescription>{product.desc}</DialogDescription><strong className="base-price">{brl(product.price)}</strong>
  {product.groups.map(g=><fieldset className="option-group" key={g.name}><legend>{g.name}<span>{g.type==='single'?'Escolha uma opção':'Opcional'}</span></legend>{g.options.map(o=><label className="option-row" key={o.name}><input type={g.type==='single'?'radio':'checkbox'} name={g.name} checked={selected[g.name]?.includes(o.name)??false} onChange={()=>setSelected(prev=>({...prev,[g.name]:g.type==='single'?[o.name]:prev[g.name]?.includes(o.name)?(prev[g.name] ?? []).filter(n=>n!==o.name):[...(prev[g.name]??[]),o.name]}))}/><span>{o.name}</span><strong>{o.price===0?'Sem custo':`+ ${brl(o.price)}`}</strong></label>)}</fieldset>)}
  <label className="notes-label">Observações<textarea placeholder="Ex.: Sem cebola, ponto da carne" maxLength={300} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
  </div><div className="product-modal-footer"><div className="quantity-control"><Button variant="ghost" size="icon" disabled={quantity===1} aria-label="Diminuir quantidade" onClick={()=>setQuantity(q=>Math.max(1,q-1))}><Minus/></Button><strong>{quantity}</strong><Button variant="ghost" size="icon" aria-label="Aumentar quantidade" onClick={()=>setQuantity(q=>q+1)}><Plus/></Button></div><Button className="pa-primary product-submit" onClick={submit}>Adicionar ao Carrinho - {brl(total)}</Button></div></DialogContent>;
}
