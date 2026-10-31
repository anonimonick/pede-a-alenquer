import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeEmail, validateRegistration, type Customer, type Registration, type SavedAddress } from './account-rules';
import { emptyAddress, parseChange, type Address, type Coupon, type DemoOrder, type Draft } from './checkout-rules';
import type { CartItem } from './cart-rules';
import { PRODUCTS, RESTAURANTS } from './data';
import { applyDbMenu } from './menu-sync';

type Catalog = { restaurants: Map<number, string>; restaurantDemo: Map<string, number>; products: Map<number, string>; productDemo: Map<string, number>; open: Map<number, boolean> };
const PAYMENT = { Pix: 'pix', 'Cartão de Crédito': 'credit_card', 'Cartão de Débito': 'debit_card', Dinheiro: 'cash' } as const;
const PAYMENT_LABEL = { pix: 'Pix', credit_card: 'Cartão de Crédito', debit_card: 'Cartão de Débito', cash: 'Dinheiro' } as const;
export const STATUS_LABEL: Record<string, string> = { received: 'Aguardando restaurante', accepted: 'Pedido aceito', preparing: 'Em preparação', ready: 'Pronto', out_for_delivery: 'Saiu para entrega', delivered: 'Entregue', cancelled: 'Recusado / cancelado' };
/** Customer-facing label: an accepted order still stored as `received` shows as accepted. */
export const orderStatusLabel = (status: string, acceptedAt: string | null) => STATUS_LABEL[status === 'received' && acceptedAt ? 'accepted' : status] ?? status;
const cents = (v: unknown) => Math.round(Number(v) * 100);

type AddressRow = { id: string; label: string; recipient_name: string; phone: string; cep: string | null; street: string; number: string; neighborhood: string; complement: string | null; reference: string | null; instructions: string | null; is_default: boolean };
export const rowToAddress = (r: AddressRow): SavedAddress => ({ id: r.id, isDefault: r.is_default, address: { type: (['Minha casa', 'Trabalho', 'Outro'].includes(r.label) ? r.label : 'Outro') as Address['type'], name: r.recipient_name, phone: r.phone, cep: r.cep ?? '', street: r.street, number: r.number, district: r.neighborhood, complement: r.complement ?? '', reference: r.reference ?? '', instructions: r.instructions ?? '' } });
const addressToRow = (userId: string, s: SavedAddress) => ({ id: s.id, user_id: userId, label: s.address.type, recipient_name: s.address.name.trim(), phone: s.address.phone, cep: s.address.cep || null, street: s.address.street.trim(), number: s.address.number.trim(), neighborhood: s.address.district.trim(), complement: s.address.complement || null, reference: s.address.reference || null, instructions: s.address.instructions || null, is_default: s.isDefault });

/** Translate database error messages into short Portuguese messages for the screens. */
export function friendlyError(message: string | undefined): string {
  const m = message ?? '';
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link enviado antes de entrar.';
  if (/already registered|already exists/i.test(m)) return 'Este e-mail já está cadastrado. Entre com sua senha.';
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (/Password should be/i.test(m)) return 'A senha não atende aos requisitos de segurança do servidor.';
  if (/Restaurante indisponível/.test(m)) return 'Este restaurante não está aceitando pedidos agora.';
  if (/Pedido mínimo/.test(m)) return 'O pedido mínimo deste restaurante não foi atingido.';
  if (/Produto indisponível/.test(m)) return 'Um dos produtos não está mais disponível.';
  if (/Cupom|cupom/.test(m)) return 'O cupom não pôde ser aplicado a este pedido.';
  if (/Troco/.test(m)) return 'O valor para troco deve ser maior ou igual ao total.';
  if (/Endereço|Contato/.test(m)) return 'Confira o endereço e o contato do pedido.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com o servidor. Verifique sua internet.';
  return 'Não foi possível concluir agora. Tente novamente.';
}

const AccountContext = createContext<ReturnType<typeof useAccountState> | null>(null);
function useAccountState() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState(false);

  const loadCatalog = useCallback(async () => {
    const [r, p] = await Promise.all([
      supabase.from('restaurants').select('id,demo_id,is_open,is_active'),
      supabase.from('products').select('id,demo_id,restaurant_id,name,description,price,image_url,is_popular,is_available,categories(name)'),
    ]);
    if (r.error || p.error) { setWarning(true); return null; }
    const c: Catalog = { restaurants: new Map(), restaurantDemo: new Map(), products: new Map(), productDemo: new Map(), open: new Map() };
    for (const x of r.data) if (x.demo_id != null) { c.restaurants.set(x.demo_id, x.id); c.restaurantDemo.set(x.id, x.demo_id); c.open.set(x.demo_id, x.is_open && x.is_active); }
    for (const x of p.data) if (x.demo_id != null) { c.products.set(x.demo_id, x.id); c.productDemo.set(x.id, x.demo_id); }
    applyDbMenu(p.data.filter(x => x.is_available).map(x => ({ demo_id: x.demo_id, restaurant_demo: c.restaurantDemo.get(x.restaurant_id) ?? null, name: x.name, description: x.description, price: x.price, image_url: x.image_url, is_popular: x.is_popular, category: (x.categories as { name: string } | null)?.name ?? null })));
    setCatalog(c); return c;
  }, []);

  const loadOrders = useCallback(async (uid: string, c: Catalog | null) => {
    const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('customer_id', uid).order('created_at', { ascending: false }).limit(50);
    if (error || !c) { if (error) setWarning(true); return; }
    setOrders(data.map(o => {
      const restaurantId = c.restaurantDemo.get(o.restaurant_id) ?? 1;
      const items: CartItem[] = o.order_items.map(i => {
        const extras = (Array.isArray(i.extras) ? i.extras : []) as { name: string; price: number }[];
        const id = (i.product_id && c.productDemo.get(i.product_id)) || 0;
        return { key: i.id, id, restaurantId, restaurant: RESTAURANTS[restaurantId - 1]?.name ?? 'Restaurante', title: i.product_name, price: Number(i.unit_price), base: PRODUCTS.find(p => p.id === id)?.price ?? Number(i.unit_price), extras, notes: i.notes ?? '', quantity: i.quantity };
      });
      const addr = (o.delivery_address ?? {}) as Partial<Address>;
      const draft: Draft = { mode: o.fulfillment, saveAddress: false, reviewed: true, payment: PAYMENT_LABEL[o.payment_method], change: o.change_for != null ? String(o.change_for).replace('.', ',') : '', address: { ...emptyAddress, ...addr, name: addr.name || o.customer_name, phone: addr.phone || o.customer_phone } };
      return { code: o.code, createdAt: o.created_at, status: (STATUS_LABEL[o.status] ?? o.status) as DemoOrder['status'], items, draft, coupon: null, totals: { subtotal: cents(o.subtotal), delivery: cents(o.delivery_fee), discount: cents(o.discount), total: cents(o.total) } };
    }));
  }, []);

  const loadUser = useCallback(async (uid: string, c: Catalog | null) => {
    const [p, a, f] = await Promise.all([
      supabase.from('profiles').select('full_name,phone').eq('id', uid).maybeSingle(),
      supabase.from('customer_addresses').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('customer_favorites').select('restaurant_id').eq('user_id', uid),
    ]);
    if (p.error || a.error || f.error) setWarning(true);
    setProfile({ name: p.data?.full_name ?? '', phone: p.data?.phone ?? '' });
    setAddresses((a.data ?? []).map(rowToAddress));
    setFavorites((f.data ?? []).map(x => c?.restaurantDemo.get(x.restaurant_id)).filter((x): x is number => typeof x === 'number'));
    await loadOrders(uid, c);
  }, [loadOrders]);

  useEffect(() => {
    let active = true; let catalogRef: Catalog | null = null;
    const apply = async (session: { user: { id: string; email?: string | undefined; created_at: string } } | null) => {
      if (!active) return;
      if (!session) { setUserId(null); setAddresses([]); setFavorites([]); setOrders([]); setReady(true); return; }
      setUserId(session.user.id); setEmail(session.user.email ?? ''); setCreatedAt(session.user.created_at);
      catalogRef = catalogRef ?? await loadCatalog();
      await loadUser(session.user.id, catalogRef);
      if (active) setReady(true);
    };
    // Listener first, then the initial session; DB calls are deferred out of the auth callback.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') setTimeout(() => void apply(session), 0);
    });
    void loadCatalog().then(c => { catalogRef = c; return supabase.auth.getSession(); }).then(({ data }) => apply(data.session));
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [loadCatalog, loadUser]);

  const currentUser: Customer | null = userId ? { id: userId, name: profile.name || email.split('@')[0] || 'Cliente', email, phone: profile.phone, createdAt: createdAt || new Date().toISOString(), addresses, favorites, orderCodes: orders.map(o => o.code) } : null;

  const register = async (input: Registration, _remember = true): Promise<Record<string, string>> => {
    const errors = validateRegistration(input, []);
    if (Object.keys(errors).length) return errors;
    const { data, error } = await supabase.auth.signUp({ email: normalizeEmail(input.email), password: input.password, options: { emailRedirectTo: window.location.origin, data: { full_name: input.name.trim(), phone: input.phone } } });
    if (error) return { form: friendlyError(error.message) };
    if (data.user && data.user.identities?.length === 0) return { form: friendlyError('already registered') };
    if (!data.session) return { form: 'Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre.' };
    return {};
  };
  const login = async (mail: string, password: string, _remember: boolean) => {
    const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(mail), password });
    return error ? friendlyError(error.message) : '';
  };
  const recover = async (mail: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(mail), { redirectTo: `${window.location.origin}/redefinir-senha` });
    return error ? friendlyError(error.message) : '';
  };
  const logout = () => { void supabase.auth.signOut(); };

  const updateProfile = async (name: string, phone: string) => {
    if (!userId) return false;
    const { error } = await supabase.from('profiles').update({ full_name: name.trim(), phone }).eq('id', userId);
    if (error) { setWarning(true); return false; }
    setProfile({ name: name.trim(), phone }); return true;
  };
  const reloadAddresses = async () => {
    if (!userId) return;
    const { data } = await supabase.from('customer_addresses').select('*').eq('user_id', userId).order('created_at');
    if (data) setAddresses(data.map(rowToAddress));
  };
  const saveAddress = async (item: SavedAddress) => {
    if (!userId) return false;
    if (item.isDefault) await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', userId).neq('id', item.id);
    const { error } = await supabase.from('customer_addresses').upsert(addressToRow(userId, { ...item, isDefault: item.isDefault || !addresses.some(a => a.id !== item.id) }));
    if (error) setWarning(true);
    await reloadAddresses(); return !error;
  };
  const deleteAddress = async (id: string) => {
    if (!userId) return;
    const removed = addresses.find(a => a.id === id);
    const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
    if (error) { setWarning(true); return; }
    const next = addresses.find(a => a.id !== id);
    if (removed?.isDefault && next) await supabase.from('customer_addresses').update({ is_default: true }).eq('id', next.id);
    await reloadAddresses();
  };
  const defaultAddress = async (id: string) => {
    if (!userId) return;
    await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', userId).neq('id', id);
    await supabase.from('customer_addresses').update({ is_default: true }).eq('id', id);
    await reloadAddresses();
  };
  const toggleFavorite = async (demoId: number) => {
    const rid = catalog?.restaurants.get(demoId);
    if (!userId || !rid) return;
    const on = favorites.includes(demoId);
    setFavorites(f => on ? f.filter(v => v !== demoId) : [...f, demoId]);
    const { error } = on
      ? await supabase.from('customer_favorites').delete().eq('user_id', userId).eq('restaurant_id', rid)
      : await supabase.from('customer_favorites').insert({ user_id: userId, restaurant_id: rid });
    if (error) { setWarning(true); setFavorites(f => on ? [...f, demoId] : f.filter(v => v !== demoId)); }
  };

  /** Sends the order to the database, which recomputes every price; returns the stored snapshot. */
  const placeOrder = async (cart: CartItem[], draft: Draft, coupon: Coupon | null, requestId: string = crypto.randomUUID()): Promise<{ order?: DemoOrder; error?: string }> => {
    if (!userId) return { error: 'Entre na sua conta para confirmar o pedido.' };
    const c = catalog ?? await loadCatalog();
    const rid = c?.restaurants.get(cart[0]?.restaurantId ?? 0);
    const items = cart.map(i => ({ product_id: c?.products.get(i.id), quantity: i.quantity, notes: i.notes, extras: i.extras.map(e => e.name) }));
    if (!c || !rid || items.some(i => !i.product_id)) return { error: 'Cardápio indisponível no servidor. Tente novamente.' };
    const change = parseChange(draft.change);
    const addressId = draft.mode === 'delivery' ? addresses.find(a => JSON.stringify(a.address) === JSON.stringify(draft.address))?.id ?? null : null;
    const { data, error } = await supabase.rpc('place_order_v3' as never, {
      _request_id: requestId, _address_id: addressId, _restaurant_id: rid, _items: items, _payment_method: PAYMENT[draft.payment], _fulfillment: draft.mode,
      _address: draft.mode === 'delivery' ? draft.address : {}, _change_for: draft.payment === 'Dinheiro' && change != null && Number.isFinite(change) ? change / 100 : null,
      _notes: draft.address.instructions || null, _coupon: coupon ?? '', _customer_name: draft.address.name, _customer_phone: draft.address.phone,
    } as never);
    if (error || !data) return { error: friendlyError(error?.message) };
    const row = data as unknown as { code: string; created_at: string; subtotal: number; delivery_fee: number; discount: number; total: number };
    const order: DemoOrder = { code: row.code, createdAt: row.created_at, status: 'Em preparação', items: cart.map(i => ({ ...i, extras: i.extras.map(o => ({ ...o })) })), draft: structuredClone(draft), coupon, totals: { subtotal: cents(row.subtotal), delivery: cents(row.delivery_fee), discount: cents(row.discount), total: cents(row.total) } };
    setOrders(o => [order, ...o.filter(x => x.code !== order.code)]);
    return { order };
  };

  return { currentUser, ready, warning, orders, register, login, recover, logout, updateProfile, saveAddress, deleteAddress, defaultAddress, toggleFavorite, placeOrder, attachOrders: (_codes: string[]) => {} };
}
export function AccountProvider({ children }: { children: ReactNode }) { return <AccountContext.Provider value={useAccountState()}>{children}</AccountContext.Provider>; }
export function useAccount() { const account = useContext(AccountContext); if (!account) throw new Error('AccountProvider required'); return account; }
