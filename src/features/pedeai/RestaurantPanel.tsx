import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, Power, RefreshCw, Plus, ArrowUp, ArrowDown, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAccount, friendlyError } from './account-context';
import { money } from './checkout-rules';
import { allowedActions, countStages, panelStage, parsePrice, STAGE_LABEL, validImageUrl, validReason, type PanelAction } from './panel-rules';
import { imageFileError, removeProductImage, resolveImages, storagePath, uploadProductImage } from './product-images';
import './panel.css';

export const PANEL_TABS = ['painel', 'pedidos', 'cardapio', 'funcionamento'] as const;
export type PanelTab = typeof PANEL_TABS[number];
type Order = Database['public']['Tables']['orders']['Row'] & { order_items: Database['public']['Tables']['order_items']['Row'][] };
type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Link_ = { role: Database['public']['Enums']['staff_role']; restaurant: { id: string; name: string; is_open: boolean; is_active: boolean } };
const PAYMENT: Record<string, string> = { pix: 'Pix', credit_card: 'Cartão de Crédito', debit_card: 'Cartão de Débito', cash: 'Dinheiro' };
const PAY_STATUS: Record<string, string> = { pending: 'Pendente', paid: 'Pago', refunded: 'Reembolsado', failed: 'Falhou' };
const ACTION_LABEL: Record<PanelAction, string> = { accept: 'Aceitar pedido', reject: 'Recusar', preparing: 'Marcar em preparação', ready: 'Marcar como pronto' };
const cents = (v: number | string) => Math.round(Number(v) * 100);
const panelError = (m?: string) => /status não permitida/.test(m ?? '') ? 'Esta mudança de status não é permitida.' : /suspenso/.test(m ?? '') ? 'Este restaurante foi suspenso pela administração e não pode ser reaberto por aqui.' : /Preço/.test(m ?? '') ? 'Preço inválido.' : /Imagem/.test(m ?? '') ? 'Endereço da imagem inválido (use https://).' : /row-level|permission|42501/i.test(m ?? '') ? 'Você não tem permissão para esta ação.' : friendlyError(m);

export function RestaurantPanel({ tab }: { tab: PanelTab }) {
  const { userId, ready } = useAccount();
  const [links, setLinks] = useState<Link_[] | null>(null);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const loadLinks = useCallback(async () => {
    if (!userId) return;
    const { data, error: e } = await supabase.from('restaurant_staff').select('role, restaurant:restaurants(id,name,is_open,is_active)').eq('user_id', userId);
    if (e) { setError(panelError(e.message)); setLinks([]); return; }
    const list = (data ?? []).filter(l => l.restaurant) as unknown as Link_[];
    setLinks(list); setSelected(s => s || list[0]?.restaurant.id || '');
  }, [userId]);
  useEffect(() => { void loadLinks(); }, [loadLinks]);

  if (!ready || (userId && links === null)) return <main className="container panel-page"><p>Carregando painel…</p></main>;
  if (!userId) return <main className="container panel-page panel-empty"><h1>Painel do restaurante</h1><p>Entre com a conta do responsável pelo restaurante.</p><Button asChild className="pa-primary"><Link to="/entrar" search={{ returnTo: '/painel' }}>Entrar</Link></Button></main>;
  if (!links?.length) return <main className="container panel-page panel-empty"><h1>Acesso restrito</h1><p>Esta área é exclusiva para responsáveis por restaurantes cadastrados no Pede Aí. Sua conta não está vinculada a nenhum restaurante.</p>{error && <p role="alert" className="field-error">{error}</p>}<Button asChild variant="outline"><Link to="/">Voltar ao início</Link></Button></main>;
  const link = links.find(l => l.restaurant.id === selected) ?? links[0]!;
  const manager = link.role === 'owner' || link.role === 'manager';
  const tabs: [PanelTab, string, typeof LayoutDashboard][] = [['painel', 'Visão geral', LayoutDashboard], ['pedidos', 'Pedidos', ClipboardList], ['cardapio', 'Cardápio', UtensilsCrossed], ['funcionamento', 'Funcionamento', Power]];
  return <main className="container panel-page">
    <div className="panel-heading"><div><span className="panel-kicker">Painel do restaurante</span><h1>{link.restaurant.name}</h1><p><span className={`restaurant-status ${link.restaurant.is_open && link.restaurant.is_active ? 'is-open' : 'is-closed'}`}>{!link.restaurant.is_active ? 'Suspenso pela administração' : link.restaurant.is_open ? 'Aberto' : 'Fechado'}</span> · Seu acesso: {link.role === 'owner' ? 'Proprietário' : link.role === 'manager' ? 'Gerente' : 'Atendente'}</p></div>
      {links.length > 1 && <label className="panel-select">Restaurante<select value={link.restaurant.id} onChange={e => setSelected(e.target.value)}>{links.map(l => <option key={l.restaurant.id} value={l.restaurant.id}>{l.restaurant.name}</option>)}</select></label>}</div>
    <nav className="panel-tabs" aria-label="Painel">{tabs.map(([k, label, Icon]) => <Button asChild variant="ghost" key={k} className={k === tab ? 'selected' : ''}><Link to="/painel" search={{ tab: k }} aria-current={k === tab ? 'page' : undefined}><Icon size={18} />{label}</Link></Button>)}</nav>
    {(tab === 'painel' || tab === 'pedidos') && <OrdersArea key={link.restaurant.id} restaurantId={link.restaurant.id} mode={tab} />}
    {tab === 'cardapio' && (manager ? <MenuArea key={link.restaurant.id} restaurantId={link.restaurant.id} /> : <p className="panel-note">Somente proprietários e gerentes podem editar o cardápio.</p>)}
    {tab === 'funcionamento' && <OpeningArea link={link} manager={manager} onChange={loadLinks} />}
  </main>;
}

function OrdersArea({ restaurantId, mode }: { restaurantId: string; mode: 'painel' | 'pedidos' }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState<Date | null>(null);
  const [filter, setFilter] = useState<'ativos' | 'historico'>('ativos');
  const [rejecting, setRejecting] = useState<Order | null>(null);
  const [busy, setBusy] = useState('');
  const load = useCallback(async () => {
    const { data, error: e } = await supabase.from('orders').select('*, order_items(*)').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(100);
    if (e) { setError(panelError(e.message)); return; }
    setError(''); setOrders(data as Order[]); setUpdated(new Date());
  }, [restaurantId]);
  useEffect(() => {
    void load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 10000);
    const onVis = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [load]);
  const act = async (o: Order, action: PanelAction, reason?: string) => {
    setBusy(o.id);
    const { error: e } = await supabase.rpc('restaurant_order_action', { _order_id: o.id, _action: action, ...(reason ? { _reason: reason } : {}) });
    setBusy('');
    if (e) { setError(panelError(e.message)); return false; }
    await load(); return true;
  };
  if (!orders) return <p>{error || 'Carregando pedidos…'}</p>;
  const counts = countStages(orders);
  const active = orders.filter(o => ['new', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(panelStage(o.status, o.accepted_at)));
  const list = mode === 'painel' ? orders.slice(0, 5) : filter === 'ativos' ? active : orders.filter(o => !active.includes(o));
  return <section>
    <p className="panel-refresh" role="status"><RefreshCw size={14} />Atualiza sozinho a cada 10 segundos{updated ? ` · última atualização ${updated.toLocaleTimeString('pt-BR')}` : ''}<Button variant="ghost" size="sm" onClick={() => void load()}>Atualizar agora</Button></p>
    {error && <p role="alert" className="field-error">{error}</p>}
    {mode === 'painel' && <div className="panel-stats">{([['Novos pedidos', counts.new, 'new'], ['Em preparação', counts.preparing, 'preparing'], ['Prontos', counts.ready, 'ready'], ['Concluídos', counts.done, 'done']] as const).map(([l, n, k]) => <div key={k} className={`panel-stat stat-${k}`}><strong>{n}</strong><span>{l}</span></div>)}</div>}
    <div className="panel-list-head"><h2>{mode === 'painel' ? 'Pedidos recentes' : 'Pedidos'}</h2>{mode === 'pedidos' && <div className="panel-filter"><Button variant="ghost" className={filter === 'ativos' ? 'selected' : ''} onClick={() => setFilter('ativos')}>Em andamento ({active.length})</Button><Button variant="ghost" className={filter === 'historico' ? 'selected' : ''} onClick={() => setFilter('historico')}>Histórico ({orders.length - active.length})</Button></div>}</div>
    {!list.length ? <p className="panel-note">Nenhum pedido aqui ainda.</p> : <div className="panel-orders">{list.map(o => <OrderCard key={o.id} o={o} compact={mode === 'painel'} busy={busy === o.id} onAct={a => a === 'reject' ? setRejecting(o) : void act(o, a)} />)}</div>}
    <RejectDialog order={rejecting} onClose={() => setRejecting(null)} onConfirm={async r => { if (rejecting && await act(rejecting, 'reject', r)) setRejecting(null); }} />
  </section>;
}

function OrderCard({ o, compact, busy, onAct }: { o: Order; compact: boolean; busy: boolean; onAct: (a: PanelAction) => void }) {
  const stage = panelStage(o.status, o.accepted_at);
  const addr = (o.delivery_address ?? {}) as Record<string, string>;
  return <article className={`panel-order stage-${stage}`}>
    <header><div><strong>#{o.code}</strong><span>{new Date(o.created_at).toLocaleString('pt-BR')}</span></div><span className="panel-badge">{STAGE_LABEL[stage]}</span></header>
    <p className="panel-order-who">{o.customer_name} · <a href={`tel:${o.customer_phone.replace(/\D/g, '')}`}>{o.customer_phone}</a> · {o.fulfillment === 'delivery' ? 'Entrega' : 'Retirada no local'}</p>
    <ul className="panel-items">{o.order_items.map(i => { const ex = (Array.isArray(i.extras) ? i.extras : []) as { name: string }[]; return <li key={i.id}><strong>{i.quantity}×</strong> {i.product_name}{ex.length ? ` · ${ex.map(e => e.name).join(', ')}` : ''}{i.notes ? <em> · Obs.: {i.notes}</em> : null}</li>; })}</ul>
    {!compact && <>
      {o.fulfillment === 'delivery' && <p><b>Endereço:</b> {addr['street']}, {addr['number']} — {addr['district']}{addr['complement'] ? `, ${addr['complement']}` : ''}{addr['reference'] ? ` · Ref.: ${addr['reference']}` : ''}{addr['instructions'] ? ` · ${addr['instructions']}` : ''}</p>}
      {o.notes && <p><b>Observações:</b> {o.notes}</p>}
      <div className="panel-values"><span>Subtotal {money(cents(o.subtotal))}</span><span>Entrega {money(cents(o.delivery_fee))}</span>{Number(o.discount) > 0 && <span>Desconto −{money(cents(o.discount))}</span>}<strong>Total {money(cents(o.total))}</strong></div>
      <p><b>Pagamento:</b> {PAYMENT[o.payment_method]} · {PAY_STATUS[o.payment_status]}{o.payment_method === 'cash' && o.change_for ? ` · troco para ${money(cents(o.change_for))}` : ''} <span className="panel-muted">(demonstrativo)</span></p>
      {o.rejection_reason && <p><b>Motivo da recusa:</b> {o.rejection_reason}</p>}
    </>}
    {compact ? <strong>{money(cents(o.total))}</strong> : <div className="panel-actions">{allowedActions(stage).map(a => <Button key={a} disabled={busy} className={a === 'reject' ? '' : 'pa-primary'} variant={a === 'reject' ? 'outline' : 'default'} onClick={() => onAct(a)}>{ACTION_LABEL[a]}</Button>)}{stage === 'ready' && <span className="panel-muted">{o.fulfillment === 'pickup' ? 'Aguardando retirada pelo cliente.' : 'Aguardando entregador.'} A conclusão é registrada pelo entregador ou pela administração.</span>}</div>}
  </article>;
}

function RejectDialog({ order, onClose, onConfirm }: { order: Order | null; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { setReason(''); setErr(''); }, [order]);
  return <Dialog open={Boolean(order)} onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="pa-modal account-modal"><DialogTitle>Recusar pedido #{order?.code}</DialogTitle><DialogDescription>O motivo aparece para o cliente no histórico de pedidos.</DialogDescription>
    <label className="panel-field">Motivo da recusa<textarea value={reason} maxLength={300} onChange={e => setReason(e.target.value)} aria-invalid={Boolean(err)} /></label>{err && <p className="field-error" role="alert">{err}</p>}
    <div className="confirmation-actions"><Button variant="outline" onClick={onClose}>Voltar</Button><Button className="pa-primary" onClick={() => validReason(reason) ? onConfirm(reason.trim()) : setErr('Informe um motivo de 3 a 300 caracteres.')}>Recusar pedido</Button></div></DialogContent></Dialog>;
}

type Draft = { id?: string; name: string; description: string; price: string; image_url: string; preview?: string; category_id: string; is_available: boolean };
function MenuArea({ restaurantId }: { restaurantId: string }) {
  const { reloadCatalog } = useAccount();
  const [products, setProducts] = useState<Product[]>([]);
  const [shown, setShown] = useState<Map<string, string | null>>(new Map());
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newCat, setNewCat] = useState('');
  const load = useCallback(async () => {
    const [p, c] = await Promise.all([supabase.from('products').select('*').eq('restaurant_id', restaurantId).order('sort_order').order('name'), supabase.from('categories').select('*').eq('restaurant_id', restaurantId).order('sort_order')]);
    if (p.error || c.error) { setError(panelError((p.error ?? c.error)?.message)); return; }
    setProducts(p.data); setCats(c.data);
    const r = await resolveImages(p.data); setShown(new Map(r.map(x => [x.id, x.image_url])));
  }, [restaurantId]);
  useEffect(() => { void load(); }, [load]);
  const done = async (msg: string) => { setNotice(msg); setError(''); await load(); void reloadCatalog(); };
  const toggle = async (p: Product) => { const { error: e } = await supabase.from('products').update({ is_available: !p.is_available }).eq('id', p.id); if (e) setError(panelError(e.message)); else await done(p.is_available ? `${p.name} indisponível.` : `${p.name} disponível.`); };
  const moveCat = async (i: number, d: -1 | 1) => { const a = cats[i], b = cats[i + d]; if (!a || !b) return; const r = await Promise.all([supabase.from('categories').update({ sort_order: b.sort_order === a.sort_order ? a.sort_order + d : b.sort_order }).eq('id', a.id), supabase.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id)]); const e = r.find(x => x.error)?.error; if (e) setError(panelError(e.message)); else await done('Ordem das categorias atualizada.'); };
  const renameCat = async (c: Category) => { const name = window.prompt('Novo nome da categoria', c.name)?.trim(); if (!name || name === c.name) return; if (name.length > 80) return setError('Nome muito longo.'); const { error: e } = await supabase.from('categories').update({ name }).eq('id', c.id); if (e) setError(panelError(e.message)); else await done('Categoria renomeada.'); };
  const addCat = async () => { const name = newCat.trim(); if (name.length < 1 || name.length > 80) return setError('Informe o nome da categoria (até 80 caracteres).'); const { error: e } = await supabase.from('categories').insert({ restaurant_id: restaurantId, name, sort_order: (cats.at(-1)?.sort_order ?? 0) + 1 }); if (e) setError(panelError(e.message)); else { setNewCat(''); await done('Categoria criada.'); } };
  const catName = useMemo(() => new Map(cats.map(c => [c.id, c.name])), [cats]);
  return <section>
    <div role="status" className="panel-notice">{notice}</div>{error && <p role="alert" className="field-error">{error}</p>}
    <div className="panel-list-head"><h2>Produtos ({products.length})</h2><Button className="pa-primary" onClick={() => setEditing({ name: '', description: '', price: '', image_url: '', category_id: cats[0]?.id ?? '', is_available: true })}><Plus size={18} />Novo produto</Button></div>
    <div className="panel-products">{products.map(p => <article key={p.id} className={`panel-product ${p.is_available ? '' : 'is-off'}`}>{shown.get(p.id) ? <img src={shown.get(p.id)!} alt="" /> : <div className="panel-noimg" aria-hidden>🍽️</div>}<div><h3>{p.name}</h3><p>{p.category_id ? catName.get(p.category_id) : 'Sem categoria'} · <strong>{money(cents(p.price))}</strong></p><p className="panel-muted">{p.is_available ? 'Disponível' : 'Indisponível'}</p></div><div className="panel-product-actions"><Button variant="outline" size="sm" onClick={() => setEditing({ id: p.id, name: p.name, description: p.description ?? '', price: Number(p.price).toFixed(2).replace('.', ','), image_url: p.image_url ?? '', preview: shown.get(p.id) ?? undefined, category_id: p.category_id ?? '', is_available: p.is_available })}><Pencil size={15} />Editar</Button><Button variant="ghost" size="sm" onClick={() => void toggle(p)}>{p.is_available ? 'Desativar' : 'Ativar'}</Button></div></article>)}</div>
    <h2>Categorias</h2>
    <ul className="panel-cats">{cats.map((c, i) => <li key={c.id}><span>{c.name}</span><Button variant="ghost" size="icon" aria-label={`Subir ${c.name}`} disabled={i === 0} onClick={() => void moveCat(i, -1)}><ArrowUp size={16} /></Button><Button variant="ghost" size="icon" aria-label={`Descer ${c.name}`} disabled={i === cats.length - 1} onClick={() => void moveCat(i, 1)}><ArrowDown size={16} /></Button><Button variant="ghost" size="sm" onClick={() => void renameCat(c)}>Renomear</Button></li>)}</ul>
    <div className="panel-addcat"><input aria-label="Nova categoria" placeholder="Nova categoria" value={newCat} maxLength={80} onChange={e => setNewCat(e.target.value)} /><Button variant="outline" onClick={() => void addCat()}>Adicionar categoria</Button></div>
    <ProductDialog draft={editing} cats={cats} restaurantId={restaurantId} onClose={() => setEditing(null)} onSaved={async m => { setEditing(null); await done(m); }} />
  </section>;
}

function ProductDialog({ draft, cats, restaurantId, onClose, onSaved }: { draft: Draft | null; cats: Category[]; restaurantId: string; onClose: () => void; onSaved: (msg: string) => void }) {
  const [d, setD] = useState<Draft | null>(draft);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [local, setLocal] = useState('');
  useEffect(() => { setD(draft); setErrs({}); setFile(null); setLocal(''); }, [draft]);
  useEffect(() => () => { if (local) URL.revokeObjectURL(local); }, [local]);
  if (!d) return <Dialog open={false} />;
  const save = async () => {
    const e: Record<string, string> = {}; const price = parsePrice(d.price);
    if (d.name.trim().length < 2 || d.name.length > 150) e['name'] = 'Informe um nome de 2 a 150 caracteres.';
    if (d.description.length > 1000) e['description'] = 'Descrição muito longa.';
    if (price === null) e['price'] = 'Preço entre R$ 0,01 e R$ 5.000,00, ex.: 12,90.';
    if (!file && !validImageUrl(d.image_url.trim())) e['image_url'] = 'Imagem inválida.';
    setErrs(e); if (Object.keys(e).length || price === null) return;
    setSaving(true);
    let image = d.image_url.trim() || null;
    if (file) { try { image = await uploadProductImage(restaurantId, file); } catch (er) { setSaving(false); setErrs({ image_url: 'Não foi possível enviar a foto. ' + panelError((er as Error).message) }); return; } }
    const old = draft?.image_url;
    const row = { name: d.name.trim(), description: d.description.trim() || null, price: price / 100, image_url: image, category_id: d.category_id || null, is_available: d.is_available };
    const { error } = d.id ? await supabase.from('products').update(row).eq('id', d.id) : await supabase.from('products').insert({ ...row, restaurant_id: restaurantId });
    setSaving(false);
    if (error) { if (file) void removeProductImage(image); setErrs({ form: panelError(error.message) }); return; }
    if (old && old !== image && storagePath(old)) void removeProductImage(old);
    onSaved(d.id ? 'Produto atualizado.' : 'Produto criado.');
  };
  const f = (k: keyof Draft) => (ev: { target: { value: string } }) => setD({ ...d, [k]: ev.target.value });
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="pa-modal account-modal panel-dialog"><DialogTitle>{d.id ? 'Editar produto' : 'Novo produto'}</DialogTitle><DialogDescription>O preço salvo aqui é o usado pelo servidor ao calcular o pedido.</DialogDescription>
    <label className="panel-field">Nome<input value={d.name} onChange={f('name')} maxLength={150} />{errs['name'] && <span className="field-error">{errs['name']}</span>}</label>
    <label className="panel-field">Descrição<textarea value={d.description} onChange={f('description')} maxLength={1000} />{errs['description'] && <span className="field-error">{errs['description']}</span>}</label>
    <label className="panel-field">Preço (R$)<input inputMode="decimal" value={d.price} onChange={f('price')} placeholder="12,90" />{errs['price'] && <span className="field-error">{errs['price']}</span>}</label>
    <div className="panel-field">Foto do produto
      {(local || (d.image_url && d.preview) || (d.image_url && !storagePath(d.image_url) && d.image_url)) ? <img className="panel-photo-preview" src={local || d.preview || d.image_url} alt="Prévia da foto" /> : <div className="panel-noimg" aria-hidden>🍽️</div>}
      <div className="panel-photo-actions"><Button asChild variant="outline"><label>{d.image_url || file ? 'Trocar foto' : 'Enviar foto'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={ev => { const x = ev.target.files?.[0]; ev.target.value = ''; if (!x) return; const er = imageFileError(x); if (er) { setErrs({ ...errs, image_url: er }); return; } setErrs({ ...errs, image_url: '' }); setFile(x); setLocal(URL.createObjectURL(x)); }} /></label></Button>
        {(d.image_url || file) && <Button variant="ghost" onClick={() => { setFile(null); setLocal(''); setD({ ...d, image_url: '', preview: undefined }); }}>Remover foto</Button>}</div>
      <span className="panel-muted">JPG, PNG ou WEBP, até 5 MB.</span>{errs['image_url'] && <span className="field-error">{errs['image_url']}</span>}</div>
    <label className="panel-field">Categoria<select value={d.category_id} onChange={f('category_id')}><option value="">Sem categoria</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label className="panel-check"><input type="checkbox" checked={d.is_available} onChange={e => setD({ ...d, is_available: e.target.checked })} />Disponível para pedidos</label>
    {errs['form'] && <p role="alert" className="field-error">{errs['form']}</p>}
    <div className="confirmation-actions"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button className="pa-primary" disabled={saving} onClick={() => void save()}>{saving ? 'Salvando…' : 'Salvar produto'}</Button></div></DialogContent></Dialog>;
}

function OpeningArea({ link, manager, onChange }: { link: Link_; manager: boolean; onChange: () => Promise<void> }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const r = link.restaurant;
  const toggle = async () => { setBusy(true); const { error: e } = await supabase.from('restaurants').update({ is_open: !r.is_open }).eq('id', r.id); setBusy(false); if (e) setError(panelError(e.message)); else { setError(''); await onChange(); } };
  return <section className="panel-opening">
    <div className="panel-stat"><span>Situação administrativa</span><strong>{r.is_active ? 'Ativo' : 'Suspenso'}</strong><p className="panel-muted">Definida pela administração do Pede Aí.</p></div>
    <div className="panel-stat"><span>Funcionamento agora</span><strong>{r.is_open ? 'Aberto' : 'Fechado'}</strong><p className="panel-muted">{r.is_open ? 'Recebendo pedidos.' : 'Clientes não conseguem finalizar pedidos.'}</p></div>
    {!r.is_active ? <p className="panel-note">Este restaurante está suspenso pela administração. Somente a administração pode reativá-lo.</p>
      : manager ? <Button className="pa-primary" disabled={busy} onClick={() => void toggle()}>{r.is_open ? 'Fechar restaurante agora' : 'Abrir restaurante agora'}</Button>
        : <p className="panel-note">Somente proprietários e gerentes podem abrir ou fechar o restaurante.</p>}
    {error && <p role="alert" className="field-error">{error}</p>}
  </section>;
}
