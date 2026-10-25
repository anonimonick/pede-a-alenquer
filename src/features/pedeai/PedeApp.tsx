import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RESTAURANTS, OFFERS, SLUGS, brl, PRODUCTS } from "./data";
import { useCart } from "./cart-context";
import { RestaurantMenu } from "./RestaurantMenu";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "../../pedeai.css";
import "./stage2.css";
import { calculateOrder, money } from "./checkout-rules";
import { AccountHeader, FavoriteButton } from './AccountControls';
import { useAccount } from './account-context';

const S = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const CATEGORIES: { name: string; icon: React.ReactNode }[] = [
  { name: "Lanches", icon: <svg {...S}><path d="M4 11a8 8 0 0 1 16 0H4z" /><rect x="2" y="15" width="20" height="4" rx="2" /><line x1="6" y1="11" x2="6" y2="15" /><line x1="18" y1="11" x2="18" y2="15" /></svg> },
  { name: "Pizzas", icon: <svg {...S}><path d="M12 2l10 18H2L12 2z" /><circle cx="12" cy="12" r="1" /><circle cx="9" cy="15" r="1" /><circle cx="15" cy="16" r="1" /></svg> },
  { name: "Açaí", icon: <svg {...S}><path d="M4 11c0 4.4 3.6 8 8 8s8-3.6 8-8H4z" /><path d="M12 3v5" /><line x1="8" y1="4" x2="9" y2="8" /><line x1="16" y1="4" x2="15" y2="8" /></svg> },
  { name: "Refeições", icon: <svg {...S}><circle cx="12" cy="12" r="8" /><line x1="3" y1="12" x2="21" y2="12" /><path d="M12 3v18" /></svg> },
  { name: "Bebidas", icon: <svg {...S}><path d="M7 2h10l-1 10a4 4 0 0 1-8 0L7 2z" /><path d="M12 12v9" /><line x1="8" y1="21" x2="16" y2="21" /></svg> },
  { name: "Sobremesas", icon: <svg {...S}><path d="M20 21H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7z" /><path d="M16 12V8a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4" /><line x1="12" y1="6" x2="12" y2="3" /></svg> },
  { name: "Mercados", icon: <svg {...S}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg> },
  { name: "Farmácias", icon: <svg {...S}><rect x="3" y="3" width="18" height="18" rx="4" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg> },
];

const SearchIcon = () => <svg {...S} width={18} height={18}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const BagIcon = ({ size = 20 }: { size?: number }) => <svg {...S} width={size} height={size}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
const UserIcon = ({ size = 18 }: { size?: number }) => <svg {...S} width={size} height={size}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const PinIcon = ({ size = 18 }: { size?: number }) => <svg {...S} width={size} height={size}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;



export function PedeApp({ restaurantId, children }: { restaurantId?: number; children?: ReactNode }) {
  const { cart, add, pending, confirm, cancel, update } = useCart();
  const { currentUser } = useAccount();
  const [cat, setCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, text: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mobileRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement;
    const drawer=document.getElementById('pa-cart-drawer');
    drawer?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setOpen(false);return;}
      if(event.key!=='Tab'||!drawer)return;
      const controls=Array.from(drawer.querySelectorAll<HTMLElement>('button, a[href]')).filter(e=>!e.hasAttribute('disabled'));
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    };
    document.addEventListener('keydown',keydown);
    return ()=>{document.removeEventListener('keydown',keydown);if(previous instanceof HTMLElement)previous.focus();};
  },[open]);
  const showToast = (text: string) => {
    setToast({ show: true, text });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const term = search.trim().toLowerCase();
  const filtered = useMemo(() => RESTAURANTS.filter((r) => {
    const c = cat ? r.filter.toLowerCase() === cat.toLowerCase() || r.category.toLowerCase().includes(cat.toLowerCase()) : true;
    const s = term ? r.name.toLowerCase().includes(term) || r.category.toLowerCase().includes(term) : true;
    return c && s;
  }), [cat, term]);

  const addToCart = (id: number) => {
    const p = PRODUCTS.find((o) => o.id === id);
    if (!p) return;
    const restaurant = RESTAURANTS[p.restaurantId - 1];
    if (!restaurant) return;
    const success = add({key: `${id}-offer`, id, restaurantId:p.restaurantId, title:p.title, price:p.price, base:p.price, extras:[], notes:'', restaurant:restaurant.name, quantity:1});
    if(success) showToast(`${p.title} adicionado ao carrinho!`);
  };

  const count = cart.reduce((a, i) => a + i.quantity, 0);
  const total = calculateOrder(cart, 'pickup', null).subtotal;

  const footerLink = (label: string, msg: string) => (
    <li><a onClick={(e) => { e.preventDefault(); showToast(msg); }} href="#">{label}</a></li>
  );

  return (
    <div className="pa">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="Página inicial do Pede Aí">
            <span className="brand-logo">Pede Aí</span>
            <span className="brand-slogan">Pediu, chegou!</span>
          </Link>
          <div className="location-badge" title="Local de entrega"><PinIcon /><span>Alenquer, PA</span></div>
          <div className="search-wrapper">
            <input className="search-input" placeholder="O que você quer pedir hoje?" aria-label="Buscar estabelecimentos ou comidas" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button className="search-button" aria-label="Pesquisar"><SearchIcon /></Button>
          </div>
          <div className="header-actions">
            <AccountHeader/>
            <Button className="btn-cart" aria-label="Abrir carrinho de compras" onClick={() => setOpen(true)}>
              <BagIcon /><span className="cart-count">{count}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mobile-search-bar">
        <div className="search-wrapper" style={{ maxWidth: "100%" }}>
          <input ref={mobileRef} className="search-input" placeholder="O que você quer pedir hoje?" aria-label="Buscar estabelecimentos ou comidas no mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button className="search-button" aria-label="Pesquisar"><SearchIcon /></Button>
        </div>
      </div>

      {children ?? (restaurantId ? <RestaurantMenu key={restaurantId} restaurantId={restaurantId} notify={showToast} /> : <main>
        <section className="hero-section">
          <div className="container">
            <div className="hero-card">
              <div className="hero-content">
                <span className="hero-tag">Delivery em Alenquer</span>
                <h1 className="hero-title">Alenquer, sua próxima comida favorita está aqui!</h1>
                <p className="hero-subtitle">Peça nos seus lugares favoritos sem sair de casa.</p>
                <a href="#restaurantes" className="btn-hero">
                  <span>Explorar restaurantes</span>
                  <svg {...S} width={18} height={18}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </a>
              </div>
              <svg className="hero-decorative" width="300" height="300" viewBox="0 0 200 200" fill="currentColor">
                <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,88.5,-0.9C87,14.6,81.4,29.1,73.1,42.1C64.8,55.1,53.8,66.5,40.4,73.8C27.1,81.1,13.5,84.3,-0.6,85.4C-14.7,86.4,-29.4,85.4,-42.6,79C-55.8,72.6,-67.4,60.8,-75.6,47.1C-83.8,33.4,-88.6,16.7,-88.2,0.2C-87.9,-16.2,-82.3,-32.5,-73.4,-45.6C-64.5,-58.7,-52.3,-68.7,-38.7,-76.1C-25.2,-83.4,-12.6,-88.2,1,-89.9C14.6,-91.6,29.3,-90.3,44.7,-76.4Z" transform="translate(100 100)" />
              </svg>
            </div>
          </div>
        </section>

        <section className="categories-section">
          <div className="container">
            <h2 className="section-title">Categorias populares</h2>
            <div className="categories-grid">
              {CATEGORIES.map((c) => (
                <div key={c.name} className={`category-card ${cat === c.name ? "active" : ""}`} role="button" tabIndex={0}
                  onClick={() => setCat(cat === c.name ? null : c.name)}>
                  <div className="category-icon">{c.icon}</div>
                  <span className="category-name">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="restaurants-section" id="restaurantes">
          <div className="container">
            <h2 className="section-title">
              <span>Restaurantes em destaque</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-gray)" }}>{filtered.length} {filtered.length === 1 ? "local" : "locais"}</span>
            </h2>
            <div className="restaurants-grid">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <svg {...S} width={40} height={40} strokeWidth={1.5}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <p>Nenhum estabelecimento encontrado para "{search.trim() || cat}".</p>
                </div>
              ) : filtered.map((r) => (
                <div key={r.id} className="restaurant-card-shell"><FavoriteButton restaurantId={r.id}/><Link className="restaurant-card" to="/restaurante/$slug" params={{slug:SLUGS[r.id-1] ?? SLUGS[0]}}>
                  <div className="restaurant-image-wrapper">
                    <img src={r.img} alt={`${r.name} - Imagem demonstrativa`} className="restaurant-image" loading="lazy" />
                    <span className="demo-tag">Demonstrativo</span>
                    <div className="restaurant-rating">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      <span>{r.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="restaurant-info">
                    <h3 className="restaurant-name">{r.name}</h3>
                    <p className="restaurant-category">{r.category}</p>
                    <div className="restaurant-meta">
                      <div className="meta-item">
                        <svg {...S} width={14} height={14}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span>{r.time}</span>
                      </div>
                      <div className={`meta-item ${r.fee === "Grátis" ? "free-delivery" : ""}`}>
                        <svg {...S} width={14} height={14}><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                        <span>{r.fee}</span>
                      </div>
                    </div>
                  </div>
                </Link></div>
              ))}
            </div>
          </div>
        </section>

        <section className="offers-section">
          <div className="container">
            <h2 className="section-title">
              <span>Ofertas do dia</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)" }}>Até 30% OFF</span>
            </h2>
            <div className="offers-grid">
              {OFFERS.map((o) => (
                <article key={o.id} className="offer-card">
                  <div className="offer-image-wrapper">
                    <img src={o.img} alt={o.title} className="offer-image" loading="lazy" />
                    <span className="discount-badge">OFERTA</span>
                  </div>
                  <div className="offer-content">
                    <span className="offer-restaurant">{o.restaurant}</span>
                    <h3 className="offer-title">{o.title}</h3>
                    <p className="offer-desc">{o.desc}</p>
                    <div className="offer-footer">
                      <div className="price-box">
                        <span className="price-original">{brl(o.original)}</span>
                        <span className="price-current">{brl(o.price)}</span>
                      </div>
                      <Button className="btn-add-cart" onClick={() => addToCart(o.id)} aria-label={`Adicionar ${o.title} ao carrinho`}>
                        <svg {...S} width={16} height={16}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        <span>Pedir</span>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>)}

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="brand-logo" style={{ fontSize: "1.8rem" }}>Pede Aí</div>
              <p className="footer-text">O aplicativo de delivery pensado com carinho para conectar você aos melhores sabores e conveniências da nossa terra.</p>
              <div className="footer-city-badge"><PinIcon size={14} /><span>Alenquer, Pará, Brasil</span></div>
            </div>
            <div>
              <h3 className="footer-heading">Pede Aí</h3>
              <ul className="footer-links">
                {footerLink("Sobre o Pede Aí", "Seção institucional demonstrativa.")}
                {footerLink("Carreiras", "Seção de carreiras demonstrativa.")}
                {footerLink("Cidades atendidas", "Alenquer - PA é o ponto de partida do Pede Aí!")}
              </ul>
            </div>
            <div>
              <h3 className="footer-heading">Parcerias</h3>
              <ul className="footer-links">
                {footerLink("Seja um parceiro", "Portal do Restaurante demonstrativo.")}
                {footerLink("Seja um entregador", "Cadastro de entregadores demonstrativo.")}
                {footerLink("Atendimento", "Canal de atendimento ao cliente.")}
              </ul>
            </div>
            <div>
              <h3 className="footer-heading">Legal</h3>
              <ul className="footer-links">
                {footerLink("Termos de uso", "Termos de Uso em desenvolvimento.")}
                {footerLink("Política de privacidade", "Política de Privacidade em desenvolvimento.")}
                {footerLink("Segurança", "Protocolos de segurança e privacidade.")}
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Pede Aí Delivery. Todos os direitos reservados. Protótipo UI/UX da Etapa 1.</p>
            <p>Desenvolvido com foco no comércio de Alenquer - PA.</p>
          </div>
        </div>
      </footer>

      <nav className="mobile-bottom-nav">
        <Link to="/" className={`nav-item ${restaurantId ? "" : "active"}`}>
          <svg {...S}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          <span>Início</span>
        </Link>
        <Button className="nav-item" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); mobileRef.current?.focus(); }}>
          <SearchIcon /><span>Buscar</span>
        </Button>
        <Button asChild className="nav-item"><Link to={currentUser?'/minha-conta':'/carrinho'} search={currentUser?{tab:'pedidos'}:{}}><BagIcon /><span>Pedidos</span></Link></Button>
        <Button asChild className="nav-item"><Link to={currentUser?'/minha-conta':'/entrar'} search={currentUser?{tab:'perfil'}:{returnTo:'/minha-conta'}}><UserIcon /><span>Perfil</span></Link></Button>
      </nav>

      <div className={`cart-drawer-overlay ${open ? "active" : ""}`} onClick={() => setOpen(false)} />
      <aside id="pa-cart-drawer" inert={!open} role="dialog" aria-modal={open} className={`cart-drawer ${open ? "active" : ""}`} aria-label="Carrinho de compras">
        <div className="cart-drawer-header">
          <h3 className="cart-drawer-title">Meu Carrinho</h3>
          <Button variant="ghost" className="cart-drawer-close" onClick={() => setOpen(false)} aria-label="Fechar carrinho">×</Button>
        </div>
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty-text">
              <svg {...S} width={48} height={48} strokeWidth={1.5}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>
              <p style={{ marginTop: 10 }}>Seu carrinho está vazio.</p>
            </div>
          ) : cart.map((i) => (
            <div key={i.key} className="cart-item-row">
              <div className="cart-item-info">
                <h4>{i.title}</h4>
                <span>{i.restaurant}</span>
                {i.extras.length > 0 && <p className="cart-detail">{i.extras.map(o=>o.name).join(', ')}</p>}
                {i.notes && <p className="cart-detail">Obs.: {i.notes}</p>}
                <div className="quantity-control">
                  <Button variant="ghost" size="icon" aria-label={`Diminuir ${i.title}`} onClick={()=>{update(i.key,i.quantity-1);if(i.quantity===1)showToast("Item removido do carrinho.");}}><Minus /></Button>
                  <span>{i.quantity}</span>
                  <Button variant="ghost" size="icon" aria-label={`Aumentar ${i.title}`} onClick={()=>update(i.key,i.quantity+1)}><Plus /></Button>
                  <Button variant="ghost" size="icon" aria-label={`Remover ${i.title}`} onClick={()=>{update(i.key,0);showToast("Item removido do carrinho.");}}><Trash2 /></Button>
                </div>
              </div>
              <div className="cart-item-price">{brl(i.price * i.quantity)}</div>
            </div>
          ))}
        </div>
        <div className="cart-drawer-footer">
          <div className="cart-total-row"><span>Total:</span><span>{money(total)}</span></div>
          <Button asChild className="btn-checkout"><Link to="/carrinho" onClick={()=>setOpen(false)}>Ver carrinho e finalizar</Link></Button>
          <Button asChild variant="ghost" className="checkout-cta"><Link to="/checkout" onClick={()=>setOpen(false)}>Ir para checkout</Link></Button>
        </div>
      </aside>

      {count > 0 && !children && <Button asChild className="mobile-cart-summary"><Link to="/carrinho"><ShoppingBag /><span>{count} {count === 1 ? 'item' : 'itens'} · Ver carrinho</span><strong>{money(total)}</strong></Link></Button>}
      <Dialog open={Boolean(pending)} onOpenChange={(value)=>{if(!value)cancel();}}>
        <DialogContent className="pa-modal confirmation-modal">
          <ShoppingBag className="confirmation-icon" />
          <DialogTitle>Iniciar um novo pedido?</DialogTitle>
          <DialogDescription>Você já tem itens de outro restaurante no carrinho. Deseja limpar o carrinho e iniciar um novo pedido em {pending?.restaurant}?</DialogDescription>
          <div className="confirmation-actions"><Button variant="outline" onClick={cancel}>Cancelar</Button><Button className="pa-primary" onClick={()=>{confirm();showToast('Novo pedido iniciado!');}}>Limpar carrinho e continuar</Button></div>
        </DialogContent>
      </Dialog>
      <div role="status" className={`toast ${toast.show ? "show" : ""}`}>
        <svg {...S} width={20} height={20} strokeWidth={2.5} className="toast-icon"><polyline points="20 6 9 17 4 12" /></svg>
        <span>{toast.text}</span>
      </div>
    </div>
  );
}
