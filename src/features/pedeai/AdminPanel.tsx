import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { LayoutDashboard, Store, Users, ClipboardList, Settings, History, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
import { useAccount, orderStatusLabel } from './account-context';
import { money } from './checkout-rules';
import { canToggleRole, emptyOrderFilter, matchesOrder, restaurantState, RESTAURANT_ACTIONS, type AppRole, type OrderFilter } from './admin-rules';
import './panel.css';

export const ADMIN_TABS = ['painel', 'restaurantes', 'usuarios', 'pedidos', 'configuracoes', 'historico'] as const;
export type AdminTab = typeof ADMIN_TABS[number];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type UserRow = { id: string; email: string; full_name: string; phone: string | null; created_at: string; roles: AppRole[]; staff: { id: string; role: string; restaurant_id: string; restaurant: string }[] };
const cents = (v: number | string) => Math.round(Number(v) * 100);
const ROLE: Record<string, string> = { customer: 'Cliente', restaurant_owner: 'Proprietário', courier: 'Entregador', admin: 'Administrador' };
const STAFF: Record<string, string> = { owner: 'Proprietário', manager: 'Gerente', attendant: 'Atendente' };
const PAY: Record<string, string> = { pending: 'Pendente', paid: 'Pago', refunded: 'Reembolsado', failed: 'Falhou' };
const STATE: Record<string, string> = { pending: 'Aguardando aprovação', active: 'Ativo', suspended: 'Suspenso' };
const ACT: Record<string, string> = { approve: 'Aprovar', suspend: 'Suspender', reactivate: 'Reativar' };
const adminError = (m?: string) => { const s = m ?? ''; const known = s.match(/(Acesso restrito[^"]*|Usuário não encontrado|Você não pode[^"]*|Papéis de administradores[^"]*|Este papel[^"]*|Informe o motivo[^"]*|Restaurante já[^"]*|Aprove o restaurante[^"]*|Pedido já finalizado|Vínculo não encontrado)/); return known ? known[1]! : /duplicate|unique/i.test(s) ? 'Já existe um restaurante com este endereço (slug).' : /row-level|permission|42501/i.test(s) ? 'Você não tem permissão para esta ação.' : 'Não foi possível concluir agora. Tente novamente.'; };
const fmtDate = (s: string) => new Date(s).toLocaleString('pt-BR', { timeZone: 'America/Belem', dateStyle: 'short', timeStyle: 'short' });

export function AdminPanel({ tab }: { tab: AdminTab }) {
  const { userId, ready, isAdmin } = useAccount();
  if (!ready) return <main className="container panel-page"><p>Carregando…</p></main>;
  if (!userId) return <main className="container panel-page panel-empty"><h1>Administração</h1><p>Entre com uma conta de administrador.</p><Button asChild className="pa-primary"><Link to="/entrar" search={{ returnTo: '/admin' }}>Entrar</Link></Button></main>;
  if (!isAdmin) return <main className="container panel-page panel-empty"><h1>Acesso restrito</h1><p>Esta área é exclusiva para administradores do Pede Aí.</p><Button asChild variant="outline"><Link to="/">Voltar ao início</Link></Button></main>;
  const tabs: [AdminTab, string, typeof Store][] = [['painel', 'Visão geral', LayoutDashboard], ['restaurantes', 'Restaurantes', Store], ['usuarios', 'Usuários', Users], ['pedidos', 'Pedidos', ClipboardList], ['configuracoes', 'Configurações', Settings], ['historico', 'Histórico', History]];
  return <main className="container panel-page">
    <div className="panel-heading"><div><span className="panel-kicker">Administração da plataforma</span><h1>Painel administrativo</h1></div></div>
    <nav className="panel-tabs" aria-label="Administração">{tabs.map(([k, label, Icon]) => <Button asChild variant="ghost" key={k} className={k === tab ? 'selected' : ''}><Link to="/admin" search={{ tab: k }} aria-current={k === tab ? 'page' : undefined}><Icon size={18} />{label}</Link></Button>)}</nav>
    {tab === 'painel' && <Dashboard />}
    {tab === 'restaurantes' && <Restaurants />}
    {tab === 'usuarios' && <UsersArea actorId={userId} />}
    {tab === 'pedidos' && <OrdersArea />}
    {tab === 'configuracoes' && <SettingsArea />}
    {tab === 'historico' && <AuditArea />}
  </main>;
}

function Dashboard() {
  const [d, setD] = useState<Record<string, number> | null>(null); const [err, setErr] = useState('');
  useEffect(() => { void supabase.rpc('admin_dashboard').then(({ data, error }) => error ? setErr(adminError(error.message)) : setD(data as Record<string, number>)); }, []);
  if (err) return <p role="alert" className="field-error">{err}</p>;
  if (!d) return <p>Carregando números…</p>;
  const n = (k: string) => Number(d[k] ?? 0);
  const stats: [string, string | number][] = [['Restaurantes cadastrados', n('restaurants')], ['Restaurantes ativos', n('active')], ['Restaurantes suspensos', n('suspended')], ['Aguardando aprovação', n('pending')], ['Clientes cadastrados', n('customers')], ['Total de pedidos', n('orders')], ['Pedidos em andamento', n('in_progress')], ['Pedidos concluídos', n('delivered')], ['Pedidos cancelados', n('cancelled')]];
  return <>
    <div className="panel-stats">{stats.map(([l, v]) => <div className="panel-stat" key={l}><span>{l}</span><strong>{v}</strong></div>)}</div>
    <h2 className="panel-list-head">Valores financeiros</h2>
    <div className="panel-stats">
      <div className="panel-stat"><span>Volume bruto dos pedidos (GMV)</span><strong>{money(cents(n('gross_total')))}</strong><small className="panel-muted">Soma dos pedidos não cancelados. Pertence aos restaurantes, não ao Pede Aí.</small></div>
      <div className="panel-stat"><span>Pedidos concluídos</span><strong>{money(cents(n('delivered_total')))}</strong><small className="panel-muted">Somente pedidos entregues.</small></div>
      <div className="panel-stat"><span>Taxas de entrega / descontos</span><strong>{money(cents(n('delivery_fees')))} / {money(cents(n('discounts')))}</strong><small className="panel-muted">Incluídas no volume bruto.</small></div>
      <div className="panel-stat"><span>Pagamentos confirmados</span><strong>{money(cents(n('paid_total')))}</strong><small className="panel-muted">Pagamentos reais ainda não estão ativos.</small></div>
      <div className="panel-stat"><span>Receita e comissão do Pede Aí</span><strong>A definir</strong><small className="panel-muted">Nenhuma comissão é calculada até o modelo comercial ser definido.</small></div>
    </div>
  </>;
}

function Restaurants() {
  const [list, setList] = useState<Restaurant[]>([]); const [users, setUsers] = useState<UserRow[]>([]); const [msg, setMsg] = useState(''); const [edit, setEdit] = useState<Restaurant | 'new' | null>(null); const [suspend, setSuspend] = useState<Restaurant | null>(null); const [reason, setReason] = useState('');
  const [linkEmail, setLinkEmail] = useState<Record<string, string>>({}); const [linkRole, setLinkRole] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    const [r, u] = await Promise.all([supabase.from('restaurants').select('*').order('name'), supabase.rpc('admin_list_users')]);
    if (r.error || u.error) setMsg(adminError((r.error ?? u.error)?.message));
    setList(r.data ?? []); setUsers((u.data ?? []) as unknown as UserRow[]);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const staffOf = (rid: string) => users.flatMap(u => u.staff.filter(s => s.restaurant_id === rid).map(s => ({ ...s, user: u })));
  const status = async (r: Restaurant, action: string, why?: string) => { const { error } = await supabase.rpc('admin_restaurant_status', { _restaurant_id: r.id, _action: action, ...(why ? { _reason: why } : {}) }); setMsg(error ? adminError(error.message) : `${r.name}: ${ACT[action]?.toLowerCase()} concluído.`); if (!error) { setSuspend(null); setReason(''); } await load(); };
  const link = async (rid: string) => { const { error } = await supabase.rpc('admin_link_staff', { _restaurant_id: rid, _email: linkEmail[rid] ?? '', _role: (linkRole[rid] ?? 'owner') as Database['public']['Enums']['staff_role'] }); setMsg(error ? adminError(error.message) : 'Responsável vinculado.'); if (!error) setLinkEmail(e => ({ ...e, [rid]: '' })); await load(); };
  const unlink = async (id: string) => { const { error } = await supabase.rpc('admin_unlink_staff', { _link_id: id }); setMsg(error ? adminError(error.message) : 'Vínculo removido.'); await load(); };
  return <>
    <div className="panel-list-head"><h2>Restaurantes ({list.length})</h2><div className="panel-actions"><Button variant="outline" onClick={() => void load()}><RefreshCw size={16} />Atualizar</Button><Button className="pa-primary" onClick={() => setEdit('new')}>Novo restaurante</Button></div></div>
    {msg && <p className="panel-notice" role="status">{msg}</p>}
    <div className="panel-orders">{list.map(r => { const st = restaurantState(r); return <article className="panel-order" key={r.id} data-testid={`admin-restaurant-${r.slug}`}>
      <header><strong>{r.name}</strong> <span className={`panel-badge ${st === 'active' ? 'is-open' : ''}`}>{STATE[st]}</span>{st === 'active' && <span className="panel-muted"> · {r.is_open ? 'Aberto agora' : 'Fechado agora'}</span>}</header>
      <p className="panel-muted">/{r.slug} · Taxa {money(cents(r.delivery_fee))} · Mínimo {money(cents(r.minimum_order))}{r.suspension_reason ? ` · Motivo da suspensão: ${r.suspension_reason}` : ''}</p>
      <div className="panel-actions">{RESTAURANT_ACTIONS[st].map(a => <Button key={a} variant={a === 'suspend' ? 'outline' : 'default'} className={a === 'suspend' ? '' : 'pa-primary'} onClick={() => a === 'suspend' ? setSuspend(r) : void status(r, a)}>{ACT[a]}</Button>)}<Button variant="outline" onClick={() => setEdit(r)}>Editar dados</Button></div>
      <h3 className="panel-muted">Responsáveis</h3>
      <ul className="panel-items">{staffOf(r.id).map(s => <li key={s.id}>{s.user.full_name || s.user.email} ({s.user.email}) — {STAFF[s.role]} <Button size="sm" variant="ghost" onClick={() => void unlink(s.id)} aria-label={`Remover vínculo de ${s.user.email}`}>Remover</Button></li>)}{!staffOf(r.id).length && <li className="panel-muted">Nenhum responsável vinculado.</li>}</ul>
      <div className="panel-addcat"><input aria-label={`E-mail do responsável para ${r.name}`} placeholder="E-mail do usuário" value={linkEmail[r.id] ?? ''} onChange={e => setLinkEmail(x => ({ ...x, [r.id]: e.target.value }))} /><select aria-label="Função" value={linkRole[r.id] ?? 'owner'} onChange={e => setLinkRole(x => ({ ...x, [r.id]: e.target.value }))}><option value="owner">Proprietário</option><option value="manager">Gerente</option><option value="attendant">Atendente</option></select><Button variant="outline" disabled={!(linkEmail[r.id] ?? '').includes('@')} onClick={() => void link(r.id)}>Vincular</Button></div>
    </article>; })}</div>
    <Dialog open={!!suspend} onOpenChange={o => !o && setSuspend(null)}><DialogContent className="pa-modal panel-dialog"><DialogTitle>Suspender {suspend?.name}?</DialogTitle><DialogDescription>O restaurante sai do ar e fecha. O responsável não consegue reabrir até a administração reativar.</DialogDescription>
      <label className="panel-field">Motivo (obrigatório)<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={300} /></label>
      <div className="panel-actions"><Button variant="outline" onClick={() => setSuspend(null)}>Cancelar</Button><Button className="pa-primary" disabled={reason.trim().length < 3} onClick={() => suspend && void status(suspend, 'suspend', reason)}>Confirmar suspensão</Button></div></DialogContent></Dialog>
    {edit && <RestaurantForm restaurant={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={m => { setMsg(m); setEdit(null); void load(); }} />}
  </>;
}

function RestaurantForm({ restaurant, onClose, onSaved }: { restaurant: Restaurant | null; onClose: () => void; onSaved: (m: string) => void }) {
  const [f, setF] = useState({ name: restaurant?.name ?? '', slug: restaurant?.slug ?? '', cuisine: restaurant?.cuisine ?? '', phone: restaurant?.phone ?? '', address: restaurant?.address ?? '', delivery_fee: String(restaurant?.delivery_fee ?? '0').replace('.', ','), minimum_order: String(restaurant?.minimum_order ?? '0').replace('.', ','), delivery_time: restaurant?.delivery_time ?? '', hours_label: restaurant?.hours_label ?? '' });
  const [err, setErr] = useState('');
  const num = (s: string) => Number(s.replace(',', '.'));
  const save = async () => {
    const slug = f.slug.trim().toLowerCase();
    if (f.name.trim().length < 2 || !/^[a-z0-9-]{2,60}$/.test(slug)) return setErr('Informe nome e um endereço (slug) com letras minúsculas, números e hífen.');
    const fee = num(f.delivery_fee), min = num(f.minimum_order);
    if (!(fee >= 0 && fee <= 100) || !(min >= 0 && min <= 1000)) return setErr('Taxa ou pedido mínimo inválidos.');
    const row = { name: f.name.trim(), slug, cuisine: f.cuisine || null, phone: f.phone || null, address: f.address || null, delivery_fee: Math.round(fee * 100) / 100, minimum_order: Math.round(min * 100) / 100, delivery_time: f.delivery_time || null, hours_label: f.hours_label || null };
    const { error } = restaurant ? await supabase.from('restaurants').update(row).eq('id', restaurant.id) : await supabase.from('restaurants').insert({ ...row, is_active: false, is_open: false });
    if (error) return setErr(adminError(error.message));
    onSaved(restaurant ? 'Dados do restaurante atualizados.' : 'Restaurante criado. Ele aguarda aprovação.');
  };
  const field = (k: keyof typeof f, label: string) => <label className="panel-field" key={k}>{label}<input value={f[k]} onChange={e => setF(x => ({ ...x, [k]: e.target.value }))} /></label>;
  return <Dialog open onOpenChange={o => !o && onClose()}><DialogContent className="pa-modal panel-dialog"><DialogTitle>{restaurant ? `Editar ${restaurant.name}` : 'Novo restaurante'}</DialogTitle><DialogDescription>Dados administrativos que os responsáveis não podem alterar.</DialogDescription>
    {field('name', 'Nome')}{field('slug', 'Endereço na página (slug)')}{field('cuisine', 'Categoria')}{field('phone', 'Telefone')}{field('address', 'Endereço')}{field('delivery_fee', 'Taxa de entrega (R$)')}{field('minimum_order', 'Pedido mínimo (R$)')}{field('delivery_time', 'Tempo de entrega')}{field('hours_label', 'Horário')}
    {err && <p role="alert" className="field-error">{err}</p>}
    <div className="panel-actions"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button className="pa-primary" onClick={() => void save()}>Salvar</Button></div></DialogContent></Dialog>;
}

function UsersArea({ actorId }: { actorId: string }) {
  const [users, setUsers] = useState<UserRow[]>([]); const [group, setGroup] = useState('customer'); const [q, setQ] = useState(''); const [msg, setMsg] = useState('');
  const load = useCallback(async () => { const { data, error } = await supabase.rpc('admin_list_users'); if (error) setMsg(adminError(error.message)); setUsers((data ?? []) as unknown as UserRow[]); }, []);
  useEffect(() => { void load(); }, [load]);
  const groups: [string, string, (u: UserRow) => boolean][] = [['customer', 'Clientes', u => u.roles.includes('customer')], ['owner', 'Proprietários', u => u.roles.includes('restaurant_owner') || u.staff.some(s => s.role === 'owner')], ['manager', 'Gerentes e atendentes', u => u.staff.some(s => s.role !== 'owner')], ['courier', 'Entregadores', u => u.roles.includes('courier')], ['admin', 'Administradores', u => u.roles.includes('admin')]];
  const pred = groups.find(g => g[0] === group)![2];
  const shown = users.filter(pred).filter(u => !q.trim() || `${u.full_name} ${u.email} ${u.phone ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = async (u: UserRow, role: AppRole) => { const grant = !u.roles.includes(role); const { error } = await supabase.rpc('admin_set_user_role', { _user_id: u.id, _role: role, _grant: grant }); setMsg(error ? adminError(error.message) : `${ROLE[role]} ${grant ? 'concedido a' : 'removido de'} ${u.email}.`); await load(); };
  return <>
    <nav className="panel-filter" aria-label="Tipos de usuário">{groups.map(([k, l, p]) => <Button key={k} variant="ghost" className={k === group ? 'selected' : ''} onClick={() => setGroup(k)}>{l} ({users.filter(p).length})</Button>)}</nav>
    <label className="panel-field">Buscar<input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, e-mail ou telefone" /></label>
    {msg && <p className="panel-notice" role="status">{msg}</p>}
    <p className="panel-muted">O papel de administrador só é concedido pelo procedimento do servidor. Vínculos com restaurantes são feitos na aba Restaurantes.</p>
    <div className="panel-orders">{shown.map(u => <article className="panel-order" key={u.id}><header><strong>{u.full_name || '(sem nome)'}</strong> <span className="panel-muted">{u.email}{u.phone ? ` · ${u.phone}` : ''}</span></header>
      <p>{u.roles.map(r => <span className="panel-badge" key={r}>{ROLE[r]}</span>)} {u.staff.map(s => <span className="panel-badge" key={s.id}>{STAFF[s.role]} · {s.restaurant}</span>)}</p>
      <p className="panel-muted">Cadastro em {fmtDate(u.created_at)}</p>
      <div className="panel-actions">{(['courier', 'restaurant_owner'] as AppRole[]).filter(r => canToggleRole(actorId, u, r)).map(r => <Button key={r} size="sm" variant="outline" onClick={() => void toggle(u, r)}>{u.roles.includes(r) ? `Remover ${ROLE[r]}` : `Tornar ${ROLE[r]}`}</Button>)}</div>
    </article>)}{!shown.length && <p className="panel-muted">Nenhum usuário neste grupo.</p>}</div>
  </>;
}

function OrdersArea() {
  const [orders, setOrders] = useState<Order[]>([]); const [rests, setRests] = useState<{ id: string; name: string }[]>([]); const [f, setF] = useState<OrderFilter>(emptyOrderFilter); const [msg, setMsg] = useState(''); const [cancel, setCancel] = useState<Order | null>(null); const [reason, setReason] = useState('');
  const load = useCallback(async () => {
    const [o, r] = await Promise.all([supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500), supabase.from('restaurants').select('id,name').order('name')]);
    if (o.error) setMsg(adminError(o.error.message)); setOrders(o.data ?? []); setRests(r.data ?? []);
  }, []);
  useEffect(() => { void load(); const t = setInterval(() => document.visibilityState === 'visible' && void load(), 15000); return () => clearInterval(t); }, [load]);
  const shown = useMemo(() => orders.filter(o => matchesOrder(o, f)), [orders, f]);
  const act = async (o: Order, action: 'advance' | 'cancel', why?: string) => { const { error } = await supabase.rpc('admin_order_action', { _order_id: o.id, _action: action, ...(why ? { _reason: why } : {}) }); setMsg(error ? adminError(error.message) : `Pedido ${o.code} atualizado.`); if (!error) { setCancel(null); setReason(''); } await load(); };
  const set = (k: keyof OrderFilter) => (e: { target: { value: string } }) => setF(x => ({ ...x, [k]: e.target.value }));
  return <>
    <div className="panel-stats">
      <label className="panel-field">Restaurante<select value={f.restaurant} onChange={set('restaurant')}><option value="">Todos</option>{rests.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
      <label className="panel-field">Cliente<input value={f.customer} onChange={set('customer')} placeholder="Nome ou telefone" /></label>
      <label className="panel-field">Código<input value={f.code} onChange={set('code')} placeholder="PA-..." /></label>
      <label className="panel-field">De<input type="date" value={f.from} onChange={set('from')} /></label>
      <label className="panel-field">Até<input type="date" value={f.to} onChange={set('to')} /></label>
      <label className="panel-field">Status<select value={f.status} onChange={set('status')}><option value="">Todos</option>{['received', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{orderStatusLabel(s, null)}</option>)}</select></label>
      <label className="panel-field">Pagamento<select value={f.payment} onChange={set('payment')}><option value="">Todos</option>{Object.entries(PAY).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
    </div>
    <div className="panel-list-head"><h2>{shown.length} pedido(s)</h2><Button variant="outline" onClick={() => { setF(emptyOrderFilter); void load(); }}>Limpar filtros</Button></div>
    {msg && <p className="panel-notice" role="status">{msg}</p>}
    <div className="panel-orders">{shown.map(o => <article className="panel-order" key={o.id}><header><strong>#{o.code}</strong> <span className="panel-badge">{orderStatusLabel(o.status, o.accepted_at)}</span> <span className="panel-badge">Pagamento: {PAY[o.payment_status]}</span></header>
      <p>{rests.find(r => r.id === o.restaurant_id)?.name} · {o.customer_name} · {o.customer_phone} · {fmtDate(o.created_at)}</p>
      <p className="panel-muted">Total {money(cents(o.total))} ({o.fulfillment === 'delivery' ? 'entrega' : 'retirada'}){o.rejection_reason ? ` · ${o.rejection_reason}` : ''}</p>
      {o.status !== 'delivered' && o.status !== 'cancelled' && <div className="panel-actions"><Button size="sm" className="pa-primary" onClick={() => void act(o, 'advance')}>{o.status === 'received' && !o.accepted_at ? 'Aceitar' : 'Avançar status'}</Button><Button size="sm" variant="outline" onClick={() => setCancel(o)}>Cancelar pedido</Button></div>}
    </article>)}</div>
    <Dialog open={!!cancel} onOpenChange={o => !o && setCancel(null)}><DialogContent className="pa-modal panel-dialog"><DialogTitle>Cancelar pedido #{cancel?.code}?</DialogTitle><DialogDescription>Valores não são alterados. A mudança fica registrada no histórico.</DialogDescription>
      <label className="panel-field">Motivo (obrigatório)<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={300} /></label>
      <div className="panel-actions"><Button variant="outline" onClick={() => setCancel(null)}>Voltar</Button><Button className="pa-primary" disabled={reason.trim().length < 3} onClick={() => cancel && void act(cancel, 'cancel', reason)}>Confirmar cancelamento</Button></div></DialogContent></Dialog>
  </>;
}

function SettingsArea() {
  const [rows, setRows] = useState<{ key: string; label: string; value: Json; updated_at: string }[]>([]); const [drafts, setDrafts] = useState<Record<string, string>>({}); const [msg, setMsg] = useState('');
  const load = useCallback(async () => { const { data, error } = await supabase.from('platform_settings').select('key,label,value,updated_at').order('key'); if (error) setMsg(adminError(error.message)); setRows(data ?? []); setDrafts(Object.fromEntries((data ?? []).map(r => [r.key, JSON.stringify(r.value, null, 2)]))); }, []);
  useEffect(() => { void load(); }, [load]);
  const save = async (key: string) => { let value: Json; try { value = JSON.parse(drafts[key] ?? ''); } catch { return setMsg('Formato inválido: confira vírgulas e aspas.'); } const { error } = await supabase.from('platform_settings').update({ value }).eq('key', key); setMsg(error ? adminError(error.message) : 'Configuração salva.'); await load(); };
  return <>
    <p className="panel-note">Área preparada para os parâmetros da plataforma. Nenhum cálculo financeiro usa estes valores ainda: comissões e taxas serão aplicadas quando o modelo comercial do Pede Aí for definido.</p>
    {msg && <p className="panel-notice" role="status">{msg}</p>}
    <div className="panel-orders">{rows.map(r => <article className="panel-order" key={r.key}><header><strong>{r.label}</strong> <span className="panel-muted">atualizado em {fmtDate(r.updated_at)}</span></header>
      <label className="panel-field">Parâmetros<textarea rows={5} value={drafts[r.key] ?? ''} onChange={e => setDrafts(d => ({ ...d, [r.key]: e.target.value }))} style={{ fontFamily: 'monospace' }} /></label>
      <div className="panel-actions"><Button variant="outline" onClick={() => void save(r.key)}>Salvar</Button></div></article>)}</div>
  </>;
}

function AuditArea() {
  const [rows, setRows] = useState<{ id: string; entity: string; entity_id: string | null; action: string; details: Json; created_at: string; actor_id: string | null }[]>([]);
  useEffect(() => { void supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(200).then(({ data }) => setRows(data ?? [])); }, []);
  const ENT: Record<string, string> = { order: 'Pedido', restaurant: 'Restaurante', restaurant_staff: 'Vínculo', user_role: 'Papel' };
  return <div className="panel-orders">{rows.map(r => <article className="panel-order" key={r.id}><header><strong>{ENT[r.entity] ?? r.entity}</strong> <span className="panel-badge">{r.action}</span> <span className="panel-muted">{fmtDate(r.created_at)}</span></header><p className="panel-muted" style={{ wordBreak: 'break-word' }}>{JSON.stringify(r.details)}</p></article>)}{!rows.length && <p className="panel-muted">Nenhuma alteração registrada ainda.</p>}</div>;
}
