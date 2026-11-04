ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS approved_at timestamptz, ADD COLUMN IF NOT EXISTS suspended_at timestamptz, ADD COLUMN IF NOT EXISTS suspension_reason text;
UPDATE public.restaurants SET approved_at = created_at WHERE is_active AND approved_at IS NULL;

CREATE OR REPLACE FUNCTION public.guard_restaurant_admin_fields() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.name IS DISTINCT FROM OLD.name OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
     OR NEW.minimum_order IS DISTINCT FROM OLD.minimum_order OR NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.review_count IS DISTINCT FROM OLD.review_count OR NEW.demo_id IS DISTINCT FROM OLD.demo_id
     OR NEW.home_filter IS DISTINCT FROM OLD.home_filter OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
     OR NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason THEN
    RAISE EXCEPTION 'Somente administradores alteram estes dados do restaurante';
  END IF;
  IF NEW.is_open AND NOT OLD.is_open AND NOT NEW.is_active THEN
    RAISE EXCEPTION 'Restaurante suspenso pela administração não pode ser reaberto pelo responsável';
  END IF;
  RETURN NEW;
END; $$;

-- Platform settings (admin only)
CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  label text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read settings" ON public.platform_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update settings" ON public.platform_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.stamp_setting() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at := now(); NEW.updated_by := auth.uid(); NEW.key := OLD.key; RETURN NEW; END; $$;
CREATE TRIGGER platform_settings_stamp BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.stamp_setting();
INSERT INTO public.platform_settings(key,label,value) VALUES
 ('fees','Taxas e comissões','{"commission_percent": null, "service_fee": null, "status": "Modelo comercial a definir"}'),
 ('regions','Regiões de atendimento','{"cities": ["Alenquer - PA"], "notes": ""}'),
 ('general','Configurações gerais','{"support_phone": "", "support_email": "", "platform_name": "Pede Aí"}'),
 ('policies','Políticas de funcionamento','{"cancellation_policy": "", "opening_policy": ""}'),
 ('operations','Parâmetros operacionais','{"order_accept_timeout_minutes": null, "max_delivery_radius_km": null}')
ON CONFLICT (key) DO NOTHING;

-- Audit history (written only by triggers)
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX admin_audit_log_entity_idx ON public.admin_audit_log(entity, entity_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.audit_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _d jsonb; _id text;
BEGIN
  IF TG_TABLE_NAME = 'orders' THEN
    IF NEW.status IS NOT DISTINCT FROM OLD.status AND NEW.payment_status IS NOT DISTINCT FROM OLD.payment_status
       AND NEW.accepted_at IS NOT DISTINCT FROM OLD.accepted_at AND NEW.courier_id IS NOT DISTINCT FROM OLD.courier_id THEN RETURN NEW; END IF;
    _id := NEW.id::text;
    _d := jsonb_build_object('code',NEW.code,'from',OLD.status,'to',NEW.status,'accepted',NEW.accepted_at IS NOT NULL,'payment_from',OLD.payment_status,'payment_to',NEW.payment_status,'reason',NEW.rejection_reason);
    INSERT INTO public.admin_audit_log(actor_id,entity,entity_id,action,details) VALUES (auth.uid(),'order',_id,'status',_d);
  ELSIF TG_TABLE_NAME = 'restaurants' THEN
    IF to_jsonb(NEW) - 'updated_at' - 'is_open' = to_jsonb(OLD) - 'updated_at' - 'is_open' AND NEW.is_open = OLD.is_open THEN RETURN NEW; END IF;
    SELECT jsonb_object_agg(n.key, jsonb_build_object('from', to_jsonb(OLD)->n.key, 'to', n.value)) INTO _d
      FROM jsonb_each(to_jsonb(NEW)) n WHERE n.key <> 'updated_at' AND n.value IS DISTINCT FROM to_jsonb(OLD)->n.key;
    INSERT INTO public.admin_audit_log(actor_id,entity,entity_id,action,details) VALUES (auth.uid(),'restaurant',NEW.id::text,'update',coalesce(_d,'{}'));
  ELSIF TG_TABLE_NAME = 'restaurant_staff' THEN
    INSERT INTO public.admin_audit_log(actor_id,entity,entity_id,action,details)
    VALUES (auth.uid(),'restaurant_staff',coalesce(NEW.restaurant_id,OLD.restaurant_id)::text,lower(TG_OP),
      jsonb_build_object('user_id',coalesce(NEW.user_id,OLD.user_id),'role',coalesce(NEW.role,OLD.role),'old_role',CASE WHEN TG_OP='UPDATE' THEN OLD.role END));
  ELSIF TG_TABLE_NAME = 'user_roles' THEN
    INSERT INTO public.admin_audit_log(actor_id,entity,entity_id,action,details)
    VALUES (auth.uid(),'user_role',coalesce(NEW.user_id,OLD.user_id)::text,lower(TG_OP),jsonb_build_object('role',coalesce(NEW.role,OLD.role)));
  END IF;
  RETURN coalesce(NEW, OLD);
END; $$;
REVOKE EXECUTE ON FUNCTION public.audit_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER orders_audit AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.audit_change();
CREATE TRIGGER restaurants_audit AFTER UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.audit_change();
CREATE TRIGGER restaurant_staff_audit AFTER INSERT OR UPDATE OR DELETE ON public.restaurant_staff FOR EACH ROW EXECUTE FUNCTION public.audit_change();
CREATE TRIGGER user_roles_audit AFTER INSERT OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_change();

CREATE OR REPLACE FUNCTION public.require_admin() RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso restrito a administradores'; END IF; END; $$;

CREATE OR REPLACE FUNCTION public.admin_dashboard() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.require_admin();
  RETURN jsonb_build_object(
    'restaurants', (SELECT count(*) FROM restaurants),
    'active', (SELECT count(*) FROM restaurants WHERE is_active),
    'suspended', (SELECT count(*) FROM restaurants WHERE NOT is_active AND approved_at IS NOT NULL),
    'pending', (SELECT count(*) FROM restaurants WHERE NOT is_active AND approved_at IS NULL),
    'customers', (SELECT count(DISTINCT user_id) FROM user_roles WHERE role = 'customer'),
    'orders', (SELECT count(*) FROM orders),
    'in_progress', (SELECT count(*) FROM orders WHERE status IN ('received','preparing','ready','out_for_delivery')),
    'delivered', (SELECT count(*) FROM orders WHERE status = 'delivered'),
    'cancelled', (SELECT count(*) FROM orders WHERE status = 'cancelled'),
    'gross_total', (SELECT coalesce(sum(total),0) FROM orders WHERE status <> 'cancelled'),
    'delivered_total', (SELECT coalesce(sum(total),0) FROM orders WHERE status = 'delivered'),
    'delivery_fees', (SELECT coalesce(sum(delivery_fee),0) FROM orders WHERE status <> 'cancelled'),
    'discounts', (SELECT coalesce(sum(discount),0) FROM orders WHERE status <> 'cancelled'),
    'paid_total', (SELECT coalesce(sum(total),0) FROM orders WHERE payment_status = 'paid'));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_users() RETURNS TABLE(id uuid, email text, full_name text, phone text, created_at timestamptz, roles app_role[], staff jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.require_admin();
  RETURN QUERY SELECT u.id, u.email::text, coalesce(p.full_name,''), p.phone, u.created_at,
    coalesce((SELECT array_agg(r.role ORDER BY r.role) FROM user_roles r WHERE r.user_id = u.id), '{}'),
    coalesce((SELECT jsonb_agg(jsonb_build_object('id',s.id,'role',s.role,'restaurant_id',s.restaurant_id,'restaurant',rs.name)) FROM restaurant_staff s JOIN restaurants rs ON rs.id = s.restaurant_id WHERE s.user_id = u.id), '[]')
  FROM auth.users u LEFT JOIN profiles p ON p.id = u.id ORDER BY u.created_at DESC LIMIT 1000;
END; $$;

-- Admins can grant/revoke only operational roles; the admin role is granted only via assign_role (service role / SQL editor).
CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role app_role, _grant boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.require_admin();
  IF _role NOT IN ('courier','restaurant_owner') THEN RAISE EXCEPTION 'Este papel não pode ser concedido pelo painel'; END IF;
  IF _user_id = auth.uid() THEN RAISE EXCEPTION 'Você não pode alterar os próprios papéis'; END IF;
  IF public.has_role(_user_id,'admin') THEN RAISE EXCEPTION 'Papéis de administradores só mudam pelo procedimento do servidor'; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = _user_id) THEN RAISE EXCEPTION 'Usuário não encontrado'; END IF;
  IF _grant THEN INSERT INTO user_roles(user_id, role) VALUES (_user_id,_role) ON CONFLICT DO NOTHING;
  ELSE DELETE FROM user_roles WHERE user_id = _user_id AND role = _role; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_link_staff(_restaurant_id uuid, _email text, _role staff_role) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _uid uuid; _id uuid;
BEGIN
  PERFORM public.require_admin();
  SELECT u.id INTO _uid FROM auth.users u WHERE lower(u.email) = lower(trim(_email));
  IF _uid IS NULL THEN RAISE EXCEPTION 'Usuário não encontrado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM restaurants WHERE id = _restaurant_id) THEN RAISE EXCEPTION 'Restaurante não encontrado'; END IF;
  SELECT s.id INTO _id FROM restaurant_staff s WHERE s.user_id = _uid AND s.restaurant_id = _restaurant_id;
  IF _id IS NULL THEN INSERT INTO restaurant_staff(restaurant_id,user_id,role) VALUES (_restaurant_id,_uid,_role) RETURNING id INTO _id;
  ELSE UPDATE restaurant_staff SET role = _role WHERE id = _id; END IF;
  IF _role = 'owner' THEN INSERT INTO user_roles(user_id, role) VALUES (_uid,'restaurant_owner') ON CONFLICT DO NOTHING; END IF;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_unlink_staff(_link_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.require_admin();
  DELETE FROM restaurant_staff WHERE id = _link_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vínculo não encontrado'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_restaurant_status(_restaurant_id uuid, _action text, _reason text DEFAULT NULL) RETURNS restaurants
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _r restaurants;
BEGIN
  PERFORM public.require_admin();
  SELECT * INTO _r FROM restaurants WHERE id = _restaurant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Restaurante não encontrado'; END IF;
  IF _action = 'approve' THEN
    IF _r.approved_at IS NOT NULL THEN RAISE EXCEPTION 'Restaurante já aprovado'; END IF;
    UPDATE restaurants SET approved_at = now(), is_active = true, suspended_at = NULL, suspension_reason = NULL WHERE id = _restaurant_id RETURNING * INTO _r;
  ELSIF _action = 'suspend' THEN
    IF NOT _r.is_active THEN RAISE EXCEPTION 'Restaurante já está inativo'; END IF;
    IF char_length(trim(coalesce(_reason,''))) NOT BETWEEN 3 AND 300 THEN RAISE EXCEPTION 'Informe o motivo da suspensão'; END IF;
    UPDATE restaurants SET is_active = false, is_open = false, suspended_at = now(), suspension_reason = trim(_reason) WHERE id = _restaurant_id RETURNING * INTO _r;
  ELSIF _action = 'reactivate' THEN
    IF _r.approved_at IS NULL THEN RAISE EXCEPTION 'Aprove o restaurante antes de ativá-lo'; END IF;
    IF _r.is_active THEN RAISE EXCEPTION 'Restaurante já está ativo'; END IF;
    UPDATE restaurants SET is_active = true, suspended_at = NULL, suspension_reason = NULL WHERE id = _restaurant_id RETURNING * INTO _r;
  ELSE RAISE EXCEPTION 'Ação inválida'; END IF;
  RETURN _r;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_order_action(_order_id uuid, _action text, _reason text DEFAULT NULL) RETURNS orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _o orders;
BEGIN
  PERFORM public.require_admin();
  SELECT * INTO _o FROM orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF _o.status IN ('delivered','cancelled') THEN RAISE EXCEPTION 'Pedido já finalizado'; END IF;
  IF _action = 'cancel' THEN
    IF char_length(trim(coalesce(_reason,''))) NOT BETWEEN 3 AND 300 THEN RAISE EXCEPTION 'Informe o motivo do cancelamento'; END IF;
    UPDATE orders SET status = 'cancelled', rejection_reason = 'Administração: ' || trim(_reason) WHERE id = _order_id RETURNING * INTO _o;
  ELSIF _action = 'advance' THEN
    UPDATE orders SET
      accepted_at = CASE WHEN status = 'received' AND accepted_at IS NULL THEN now() ELSE accepted_at END,
      status = CASE WHEN status = 'received' AND accepted_at IS NULL THEN 'received'::order_status
        WHEN status = 'received' THEN 'preparing' WHEN status = 'preparing' THEN 'ready'
        WHEN status = 'ready' AND fulfillment = 'delivery' THEN 'out_for_delivery' ELSE 'delivered' END
    WHERE id = _order_id RETURNING * INTO _o;
  ELSE RAISE EXCEPTION 'Ação inválida'; END IF;
  RETURN _o;
END; $$;

REVOKE EXECUTE ON FUNCTION public.require_admin(), public.admin_dashboard(), public.admin_list_users(), public.admin_set_user_role(uuid,app_role,boolean),
  public.admin_link_staff(uuid,text,staff_role), public.admin_unlink_staff(uuid), public.admin_restaurant_status(uuid,text,text), public.admin_order_action(uuid,text,text), public.stamp_setting() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard(), public.admin_list_users(), public.admin_set_user_role(uuid,app_role,boolean),
  public.admin_link_staff(uuid,text,staff_role), public.admin_unlink_staff(uuid), public.admin_restaurant_status(uuid,text,text), public.admin_order_action(uuid,text,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_role(uuid, app_role) FROM PUBLIC, anon, authenticated;