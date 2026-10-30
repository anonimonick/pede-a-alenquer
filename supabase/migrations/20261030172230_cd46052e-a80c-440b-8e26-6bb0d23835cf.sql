ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_request_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS orders_customer_request_uidx ON public.orders(customer_id, client_request_id) WHERE client_request_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.place_order_v3(_request_id uuid, _restaurant_id uuid, _items jsonb, _payment_method payment_method, _fulfillment fulfillment_mode, _address_id uuid, _address jsonb, _change_for numeric, _notes text, _coupon text, _customer_name text, _customer_phone text)
 RETURNS orders LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid(); _existing public.orders; _r public.restaurants; _addr public.customer_addresses; _snap jsonb;
  _item jsonb; _prod public.products; _qty int; _extra text; _opt jsonb; _grp jsonb; _unit int; _extras jsonb; _singles text[];
  _subtotal int := 0; _fee int; _discount int := 0; _total int; _order public.orders; _code text; _lines jsonb := '[]'::jsonb; _line jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  IF _request_id IS NULL THEN RAISE EXCEPTION 'Identificador do pedido ausente'; END IF;
  SELECT * INTO _existing FROM public.orders WHERE customer_id = _uid AND client_request_id = _request_id;
  IF FOUND THEN RETURN _existing; END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 50 THEN RAISE EXCEPTION 'Itens inválidos'; END IF;
  IF length(trim(coalesce(_customer_name,''))) < 2 OR length(regexp_replace(coalesce(_customer_phone,''),'\D','','g')) NOT BETWEEN 10 AND 13 THEN RAISE EXCEPTION 'Contato inválido'; END IF;
  SELECT * INTO _r FROM public.restaurants WHERE id = _restaurant_id AND is_active AND is_open;
  IF NOT FOUND THEN RAISE EXCEPTION 'Restaurante indisponível'; END IF;
  IF _fulfillment = 'delivery' THEN
    IF _address_id IS NOT NULL THEN
      SELECT * INTO _addr FROM public.customer_addresses WHERE id = _address_id AND user_id = _uid;
      IF NOT FOUND THEN RAISE EXCEPTION 'Endereço inválido'; END IF;
      _snap := jsonb_strip_nulls(jsonb_build_object('type',_addr.label,'name',_addr.recipient_name,'phone',_addr.phone,'cep',_addr.cep,'street',_addr.street,'number',_addr.number,'district',_addr.neighborhood,'complement',_addr.complement,'reference',_addr.reference,'instructions',_addr.instructions));
    ELSE
      IF jsonb_typeof(_address) <> 'object' THEN RAISE EXCEPTION 'Endereço inválido'; END IF;
      SELECT jsonb_object_agg(k, left(v, 300)) INTO _snap FROM jsonb_each_text(_address) AS e(k, v)
        WHERE k IN ('type','name','phone','cep','street','number','district','complement','reference','instructions');
    END IF;
    IF coalesce(trim(_snap->>'street'),'') = '' OR coalesce(trim(_snap->>'number'),'') = '' OR coalesce(trim(_snap->>'district'),'') = '' OR coalesce(trim(_snap->>'reference'),'') = '' THEN
      RAISE EXCEPTION 'Endereço inválido'; END IF;
    _fee := round(_r.delivery_fee * 100);
  ELSE _fee := 0; _address_id := NULL; END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::int;
    IF _qty IS NULL OR _qty < 1 OR _qty > 99 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
    SELECT * INTO _prod FROM public.products WHERE id = (_item->>'product_id')::uuid AND restaurant_id = _restaurant_id AND is_available;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produto indisponível ou de outro restaurante'; END IF;
    _unit := round(_prod.price * 100); _extras := '[]'::jsonb; _singles := '{}';
    IF jsonb_typeof(coalesce(_item->'extras','[]'::jsonb)) <> 'array' OR jsonb_array_length(coalesce(_item->'extras','[]'::jsonb)) > 30 THEN RAISE EXCEPTION 'Adicionais inválidos'; END IF;
    FOR _extra IN SELECT jsonb_array_elements_text(coalesce(_item->'extras','[]'::jsonb)) LOOP
      _opt := NULL;
      SELECT g, o INTO _grp, _opt FROM jsonb_array_elements(_prod.option_groups) g, jsonb_array_elements(g->'options') o WHERE o->>'name' = _extra LIMIT 1;
      IF _opt IS NULL THEN RAISE EXCEPTION 'Adicional inválido: %', _extra; END IF;
      IF _grp->>'type' = 'single' THEN
        IF (_grp->>'name') = ANY(_singles) THEN RAISE EXCEPTION 'Opção duplicada'; END IF;
        _singles := _singles || (_grp->>'name');
      END IF;
      _unit := _unit + round((_opt->>'price')::numeric * 100);
      _extras := _extras || jsonb_build_object('name', _opt->>'name', 'price', (_opt->>'price')::numeric);
    END LOOP;
    _subtotal := _subtotal + _unit * _qty;
    _lines := _lines || jsonb_build_object('product_id', _prod.id, 'name', _prod.name, 'unit', _unit, 'qty', _qty, 'extras', _extras, 'notes', left(_item->>'notes', 300));
  END LOOP;
  IF _subtotal < round(_r.minimum_order * 100) THEN RAISE EXCEPTION 'Pedido mínimo não atingido'; END IF;
  IF _coupon = 'BEMVINDO10' THEN _discount := least(1000, round(_subtotal * 0.1));
  ELSIF _coupon = 'PEDEAI5' THEN
    IF _subtotal < 2500 THEN RAISE EXCEPTION 'Valor mínimo do cupom não atingido'; END IF; _discount := 500;
  ELSIF _coupon IS NOT NULL AND _coupon <> '' THEN RAISE EXCEPTION 'Cupom inválido'; END IF;
  _total := greatest(0, _subtotal + _fee - _discount);
  IF _payment_method = 'cash' AND _change_for IS NOT NULL AND round(_change_for * 100) < _total THEN RAISE EXCEPTION 'Troco deve ser maior ou igual ao total'; END IF;

  LOOP
    _code := 'PA-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE code = _code);
  END LOOP;

  BEGIN
    INSERT INTO public.orders(code, client_request_id, customer_id, restaurant_id, fulfillment, address_id, delivery_address,
      customer_name, customer_phone, notes, payment_method, change_for, subtotal, delivery_fee, discount, total)
    VALUES (_code, _request_id, _uid, _restaurant_id, _fulfillment, _address_id, CASE WHEN _fulfillment = 'delivery' THEN _snap END,
      left(trim(_customer_name), 120), left(_customer_phone, 25), left(_notes, 300), _payment_method,
      CASE WHEN _payment_method = 'cash' THEN _change_for END, _subtotal / 100.0, _fee / 100.0, _discount / 100.0, _total / 100.0)
    RETURNING * INTO _order;
  EXCEPTION WHEN unique_violation THEN
    SELECT * INTO _existing FROM public.orders WHERE customer_id = _uid AND client_request_id = _request_id;
    IF FOUND THEN RETURN _existing; END IF; RAISE;
  END;

  FOR _line IN SELECT * FROM jsonb_array_elements(_lines) LOOP
    INSERT INTO public.order_items(order_id, product_id, product_name, unit_price, quantity, extras, notes, line_total)
    VALUES (_order.id, (_line->>'product_id')::uuid, _line->>'name', (_line->>'unit')::int / 100.0, (_line->>'qty')::int,
      _line->'extras', nullif(_line->>'notes',''), (_line->>'unit')::int * (_line->>'qty')::int / 100.0);
  END LOOP;
  RETURN _order;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.place_order_v3(uuid, uuid, jsonb, payment_method, fulfillment_mode, uuid, jsonb, numeric, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order_v3(uuid, uuid, jsonb, payment_method, fulfillment_mode, uuid, jsonb, numeric, text, text, text, text) TO authenticated, service_role;