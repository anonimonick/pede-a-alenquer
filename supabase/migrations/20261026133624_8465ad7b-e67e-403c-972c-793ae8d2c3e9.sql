
-- Enums
CREATE TYPE public.app_role AS ENUM ('customer','restaurant_owner','courier','admin');
CREATE TYPE public.staff_role AS ENUM ('owner','manager','attendant');
CREATE TYPE public.order_status AS ENUM ('received','preparing','ready','out_for_delivery','delivered','cancelled');
CREATE TYPE public.payment_method AS ENUM ('pix','credit_card','debit_card','cash');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','refunded','failed');
CREATE TYPE public.fulfillment_mode AS ENUM ('delivery','pickup');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '' CHECK (char_length(full_name) <= 120),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 25),
  avatar_url text CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Server-only role assignment (service_role only)
CREATE OR REPLACE FUNCTION public.assign_role(_user_id uuid, _role public.app_role)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role) ON CONFLICT DO NOTHING
$$;
REVOKE ALL ON FUNCTION public.assign_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_role(uuid, public.app_role) TO service_role;

-- Signup trigger: profile + customer role
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, phone)
  VALUES (NEW.id,
          left(coalesce(NEW.raw_user_meta_data->>'full_name', ''), 120),
          nullif(left(coalesce(NEW.raw_user_meta_data->>'phone', ''), 25), ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Restaurants
CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  logo_url text,
  cover_url text,
  phone text,
  address text,
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_open boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT false,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  minimum_order numeric(10,2) NOT NULL DEFAULT 0 CHECK (minimum_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER restaurants_updated BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.restaurant_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.staff_role NOT NULL DEFAULT 'attendant',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, user_id)
);
CREATE INDEX restaurant_staff_user_idx ON public.restaurant_staff(user_id);

CREATE OR REPLACE FUNCTION public.is_restaurant_staff(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurant_staff WHERE user_id = _user_id AND restaurant_id = _restaurant_id)
$$;
CREATE OR REPLACE FUNCTION public.is_restaurant_manager(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurant_staff WHERE user_id = _user_id AND restaurant_id = _restaurant_id AND role IN ('owner','manager'))
$$;

GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active restaurants" ON public.restaurants FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Staff reads own restaurants" ON public.restaurants FOR SELECT TO authenticated USING (public.is_restaurant_staff(auth.uid(), id));
CREATE POLICY "Admins read all restaurants" ON public.restaurants FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Managers update own restaurant" ON public.restaurants FOR UPDATE TO authenticated USING (public.is_restaurant_manager(auth.uid(), id)) WITH CHECK (public.is_restaurant_manager(auth.uid(), id));
CREATE POLICY "Admins create restaurants" ON public.restaurants FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update restaurants" ON public.restaurants FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete restaurants" ON public.restaurants FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Managers may not self-activate/deactivate platform listing
CREATE OR REPLACE FUNCTION public.guard_restaurant_admin_fields() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin')
     AND (NEW.is_active IS DISTINCT FROM OLD.is_active OR NEW.slug IS DISTINCT FROM OLD.slug) THEN
    RAISE EXCEPTION 'Somente administradores alteram ativação ou slug';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER restaurants_guard BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.guard_restaurant_admin_fields();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_staff TO authenticated;
GRANT ALL ON public.restaurant_staff TO service_role;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own staff links" ON public.restaurant_staff FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Managers see team" ON public.restaurant_staff FOR SELECT TO authenticated USING (public.is_restaurant_manager(auth.uid(), restaurant_id));
CREATE POLICY "Admins manage staff" ON public.restaurant_staff FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, name),
  UNIQUE (id, restaurant_id)
);
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads categories of active restaurants" ON public.categories FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.is_active));
CREATE POLICY "Staff reads own categories" ON public.categories FOR SELECT TO authenticated USING (public.is_restaurant_staff(auth.uid(), restaurant_id));
CREATE POLICY "Managers manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.is_restaurant_manager(auth.uid(), restaurant_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_restaurant_manager(auth.uid(), restaurant_id) OR public.has_role(auth.uid(), 'admin'));

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id uuid,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 150),
  description text CHECK (description IS NULL OR char_length(description) <= 1000),
  image_url text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (category_id, restaurant_id) REFERENCES public.categories(id, restaurant_id) ON DELETE SET NULL (category_id)
);
CREATE INDEX products_restaurant_idx ON public.products(restaurant_id);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads available products" ON public.products FOR SELECT TO anon, authenticated
  USING (is_available AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.is_active));
CREATE POLICY "Staff reads own products" ON public.products FOR SELECT TO authenticated USING (public.is_restaurant_staff(auth.uid(), restaurant_id));
CREATE POLICY "Managers manage products" ON public.products FOR ALL TO authenticated
  USING (public.is_restaurant_manager(auth.uid(), restaurant_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_restaurant_manager(auth.uid(), restaurant_id) OR public.has_role(auth.uid(), 'admin'));

-- Addresses
CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Casa' CHECK (char_length(label) <= 40),
  recipient_name text NOT NULL CHECK (char_length(recipient_name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (char_length(phone) <= 25),
  street text NOT NULL CHECK (char_length(street) <= 150),
  number text NOT NULL CHECK (char_length(number) <= 80),
  complement text CHECK (complement IS NULL OR char_length(complement) <= 150),
  neighborhood text NOT NULL CHECK (char_length(neighborhood) <= 120),
  reference text CHECK (reference IS NULL OR char_length(reference) <= 200),
  city text NOT NULL DEFAULT 'Alenquer',
  state text NOT NULL DEFAULT 'PA' CHECK (char_length(state) = 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_addresses_user_idx ON public.customer_addresses(user_id);
CREATE TRIGGER customer_addresses_updated BEFORE UPDATE ON public.customer_addresses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own addresses" ON public.customer_addresses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Profiles policies
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Roles policies (read only; writes only via service_role)
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^PA-[A-Z0-9]{5,10}$'),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE RESTRICT,
  courier_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  fulfillment public.fulfillment_mode NOT NULL DEFAULT 'delivery',
  address_id uuid REFERENCES public.customer_addresses(id) ON DELETE SET NULL,
  delivery_address jsonb,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 300),
  status public.order_status NOT NULL DEFAULT 'received',
  payment_method public.payment_method NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  change_for numeric(10,2) CHECK (change_for IS NULL OR change_for >= 0),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  discount numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (total = subtotal + delivery_fee - discount),
  CHECK (fulfillment = 'pickup' OR delivery_address IS NOT NULL)
);
CREATE INDEX orders_customer_idx ON public.orders(customer_id, created_at DESC);
CREATE INDEX orders_restaurant_idx ON public.orders(restaurant_id, created_at DESC);
CREATE INDEX orders_courier_idx ON public.orders(courier_id);
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity int NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  extras jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 300),
  line_total numeric(10,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (line_total = unit_price * quantity)
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);

-- Orders: read via RLS; no direct inserts from clients (place_order only)
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own orders" ON public.orders FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Staff read restaurant orders" ON public.orders FOR SELECT TO authenticated USING (public.is_restaurant_staff(auth.uid(), restaurant_id));
CREATE POLICY "Couriers read assigned orders" ON public.orders FOR SELECT TO authenticated USING (courier_id = auth.uid() AND public.has_role(auth.uid(), 'courier'));
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff update restaurant orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_restaurant_staff(auth.uid(), restaurant_id)) WITH CHECK (public.is_restaurant_staff(auth.uid(), restaurant_id));
CREATE POLICY "Couriers update assigned orders" ON public.orders FOR UPDATE TO authenticated
  USING (courier_id = auth.uid() AND public.has_role(auth.uid(), 'courier')) WITH CHECK (courier_id = auth.uid());
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only status (and courier for staff) may change; money/payment fields are locked for non-admins
CREATE OR REPLACE FUNCTION public.guard_order_update() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.subtotal IS DISTINCT FROM OLD.subtotal OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
     OR NEW.discount IS DISTINCT FROM OLD.discount OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id OR NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id
     OR NEW.code IS DISTINCT FROM OLD.code OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
     OR NEW.delivery_address IS DISTINCT FROM OLD.delivery_address THEN
    RAISE EXCEPTION 'Campos financeiros e de identificação do pedido não podem ser alterados';
  END IF;
  IF NEW.courier_id IS DISTINCT FROM OLD.courier_id AND NOT public.is_restaurant_staff(auth.uid(), OLD.restaurant_id) THEN
    RAISE EXCEPTION 'Somente o restaurante atribui o entregador';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER orders_guard BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_order_update();

CREATE POLICY "Read items of visible orders" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id));

-- Server-side order placement: prices, fees and totals come from the database
CREATE OR REPLACE FUNCTION public.place_order(
  _restaurant_id uuid, _items jsonb, _payment_method public.payment_method,
  _fulfillment public.fulfillment_mode DEFAULT 'delivery', _address_id uuid DEFAULT NULL,
  _change_for numeric DEFAULT NULL, _notes text DEFAULT NULL)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _r public.restaurants;
  _p public.profiles;
  _addr public.customer_addresses;
  _item jsonb; _prod public.products; _qty int;
  _subtotal numeric(10,2) := 0; _fee numeric(10,2); _total numeric(10,2);
  _order public.orders; _code text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Itens inválidos'; END IF;
  SELECT * INTO _r FROM public.restaurants WHERE id = _restaurant_id AND is_active AND is_open;
  IF NOT FOUND THEN RAISE EXCEPTION 'Restaurante indisponível'; END IF;
  SELECT * INTO _p FROM public.profiles WHERE id = _uid;
  IF _fulfillment = 'delivery' THEN
    SELECT * INTO _addr FROM public.customer_addresses WHERE id = _address_id AND user_id = _uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Endereço inválido'; END IF;
    _fee := _r.delivery_fee;
  ELSE _fee := 0; END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::int;
    IF _qty IS NULL OR _qty < 1 OR _qty > 99 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
    SELECT * INTO _prod FROM public.products WHERE id = (_item->>'product_id')::uuid AND restaurant_id = _restaurant_id AND is_available;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produto indisponível ou de outro restaurante'; END IF;
    _subtotal := _subtotal + _prod.price * _qty;
  END LOOP;
  IF _subtotal < _r.minimum_order THEN RAISE EXCEPTION 'Pedido mínimo não atingido'; END IF;
  _total := _subtotal + _fee;
  IF _payment_method = 'cash' AND _change_for IS NOT NULL AND _change_for < _total THEN
    RAISE EXCEPTION 'Troco deve ser maior ou igual ao total'; END IF;

  LOOP
    _code := 'PA-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE code = _code);
  END LOOP;

  INSERT INTO public.orders(code, customer_id, restaurant_id, fulfillment, address_id, delivery_address,
    customer_name, customer_phone, notes, payment_method, change_for, subtotal, delivery_fee, discount, total)
  VALUES (_code, _uid, _restaurant_id, _fulfillment, _addr.id,
    CASE WHEN _fulfillment = 'delivery' THEN to_jsonb(_addr) - 'user_id' - 'created_at' - 'updated_at' END,
    coalesce(nullif(_addr.recipient_name, ''), _p.full_name, ''), coalesce(_addr.phone, _p.phone, ''),
    left(_notes, 300), _payment_method, CASE WHEN _payment_method = 'cash' THEN _change_for END,
    _subtotal, _fee, 0, _total)
  RETURNING * INTO _order;

  INSERT INTO public.order_items(order_id, product_id, product_name, unit_price, quantity, notes, line_total)
  SELECT _order.id, p.id, p.name, p.price, (i->>'quantity')::int, left(i->>'notes', 300), p.price * (i->>'quantity')::int
  FROM jsonb_array_elements(_items) i JOIN public.products p ON p.id = (i->>'product_id')::uuid;

  RETURN _order;
END; $$;
REVOKE ALL ON FUNCTION public.place_order(uuid, jsonb, public.payment_method, public.fulfillment_mode, uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(uuid, jsonb, public.payment_method, public.fulfillment_mode, uuid, numeric, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
