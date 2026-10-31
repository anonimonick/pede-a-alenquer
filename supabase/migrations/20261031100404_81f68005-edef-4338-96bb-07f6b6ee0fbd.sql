ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS accepted_at timestamptz, ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.orders ADD CONSTRAINT orders_rejection_reason_len CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 300);
CREATE UNIQUE INDEX IF NOT EXISTS products_demo_id_key ON public.products(demo_id) WHERE demo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_restaurant_created_idx ON public.orders(restaurant_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.guard_order_update()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE _uid uuid := auth.uid(); _staff boolean;
BEGIN
  IF _uid IS NULL OR public.has_role(_uid, 'admin') THEN RETURN NEW; END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.subtotal IS DISTINCT FROM OLD.subtotal OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
     OR NEW.discount IS DISTINCT FROM OLD.discount OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id OR NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id
     OR NEW.code IS DISTINCT FROM OLD.code OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
     OR NEW.delivery_address IS DISTINCT FROM OLD.delivery_address OR NEW.address_id IS DISTINCT FROM OLD.address_id
     OR NEW.customer_name IS DISTINCT FROM OLD.customer_name OR NEW.customer_phone IS DISTINCT FROM OLD.customer_phone
     OR NEW.notes IS DISTINCT FROM OLD.notes OR NEW.fulfillment IS DISTINCT FROM OLD.fulfillment
     OR NEW.change_for IS DISTINCT FROM OLD.change_for OR NEW.client_request_id IS DISTINCT FROM OLD.client_request_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Campos financeiros e de identificação do pedido não podem ser alterados';
  END IF;
  _staff := public.is_restaurant_staff(_uid, OLD.restaurant_id);
  IF NEW.courier_id IS DISTINCT FROM OLD.courier_id AND NOT _staff THEN
    RAISE EXCEPTION 'Somente o restaurante atribui o entregador';
  END IF;
  IF NEW.status IS NOT DISTINCT FROM OLD.status AND NEW.accepted_at IS NOT DISTINCT FROM OLD.accepted_at
     AND NEW.rejection_reason IS NOT DISTINCT FROM OLD.rejection_reason THEN RETURN NEW; END IF;

  IF _staff THEN
    IF OLD.status = 'received' AND OLD.accepted_at IS NULL AND NEW.status = 'received' AND NEW.accepted_at IS NOT NULL
       AND NEW.rejection_reason IS NOT DISTINCT FROM OLD.rejection_reason THEN
      NEW.accepted_at := now(); RETURN NEW;
    ELSIF OLD.status = 'received' AND NEW.status = 'cancelled' AND NEW.accepted_at IS NOT DISTINCT FROM OLD.accepted_at
       AND char_length(trim(coalesce(NEW.rejection_reason, ''))) BETWEEN 3 AND 300 THEN
      NEW.rejection_reason := trim(NEW.rejection_reason); RETURN NEW;
    ELSIF OLD.status = 'received' AND OLD.accepted_at IS NOT NULL AND NEW.status = 'preparing'
       AND NEW.accepted_at IS NOT DISTINCT FROM OLD.accepted_at AND NEW.rejection_reason IS NOT DISTINCT FROM OLD.rejection_reason THEN
      RETURN NEW;
    ELSIF OLD.status = 'preparing' AND NEW.status = 'ready'
       AND NEW.accepted_at IS NOT DISTINCT FROM OLD.accepted_at AND NEW.rejection_reason IS NOT DISTINCT FROM OLD.rejection_reason THEN
      RETURN NEW;
    END IF;
  END IF;
  IF OLD.courier_id = _uid AND public.has_role(_uid, 'courier')
     AND NEW.accepted_at IS NOT DISTINCT FROM OLD.accepted_at AND NEW.rejection_reason IS NOT DISTINCT FROM OLD.rejection_reason
     AND ((OLD.status = 'ready' AND NEW.status = 'out_for_delivery' AND OLD.fulfillment = 'delivery')
       OR (OLD.status = 'out_for_delivery' AND NEW.status = 'delivered')) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Mudança de status não permitida';
END; $$;

CREATE OR REPLACE FUNCTION public.restaurant_order_action(_order_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS public.orders LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE _o public.orders;
BEGIN
  IF _action = 'accept' THEN UPDATE public.orders SET accepted_at = now() WHERE id = _order_id RETURNING * INTO _o;
  ELSIF _action = 'reject' THEN UPDATE public.orders SET status = 'cancelled', rejection_reason = _reason WHERE id = _order_id RETURNING * INTO _o;
  ELSIF _action = 'preparing' THEN UPDATE public.orders SET status = 'preparing' WHERE id = _order_id RETURNING * INTO _o;
  ELSIF _action = 'ready' THEN UPDATE public.orders SET status = 'ready' WHERE id = _order_id RETURNING * INTO _o;
  ELSE RAISE EXCEPTION 'Ação inválida'; END IF;
  IF _o.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado ou sem permissão'; END IF;
  RETURN _o;
END; $$;
REVOKE ALL ON FUNCTION public.restaurant_order_action(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restaurant_order_action(uuid, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_restaurant_admin_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.name IS DISTINCT FROM OLD.name OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
     OR NEW.minimum_order IS DISTINCT FROM OLD.minimum_order OR NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.review_count IS DISTINCT FROM OLD.review_count OR NEW.demo_id IS DISTINCT FROM OLD.demo_id
     OR NEW.home_filter IS DISTINCT FROM OLD.home_filter OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Somente administradores alteram estes dados do restaurante';
  END IF;
  IF NEW.is_open AND NOT OLD.is_open AND NOT NEW.is_active THEN
    RAISE EXCEPTION 'Restaurante suspenso pela administração não pode ser reaberto pelo responsável';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.guard_product_write()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.price <= 0 OR NEW.price > 5000 OR NEW.price <> round(NEW.price, 2) THEN RAISE EXCEPTION 'Preço inválido'; END IF;
  IF NEW.image_url IS NOT NULL AND (NEW.image_url !~ '^https://[^\s]+$' OR char_length(NEW.image_url) > 500) THEN RAISE EXCEPTION 'Imagem inválida'; END IF;
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' AND NEW.demo_id IS NULL THEN
      PERFORM pg_advisory_xact_lock(hashtext('products_demo_id'));
      NEW.demo_id := coalesce((SELECT max(demo_id) FROM public.products), 1000) + 1;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    PERFORM pg_advisory_xact_lock(hashtext('products_demo_id'));
    NEW.demo_id := greatest(coalesce((SELECT max(demo_id) FROM public.products), 1000), 1000) + 1;
    NEW.option_groups := '[]'::jsonb;
  ELSIF NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id OR NEW.demo_id IS DISTINCT FROM OLD.demo_id
     OR NEW.option_groups IS DISTINCT FROM OLD.option_groups THEN
    RAISE EXCEPTION 'Este dado do produto não pode ser alterado';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS products_guard ON public.products;
CREATE TRIGGER products_guard BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_product_write();