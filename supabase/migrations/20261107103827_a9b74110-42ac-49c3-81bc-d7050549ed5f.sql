CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  event_key text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_key)
);
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users mark own notifications read" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX notifications_user_created_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION public.guard_notification_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.order_id IS DISTINCT FROM OLD.order_id OR NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id
     OR NEW.type IS DISTINCT FROM OLD.type OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.message IS DISTINCT FROM OLD.message OR NEW.link IS DISTINCT FROM OLD.link
     OR NEW.event_key IS DISTINCT FROM OLD.event_key OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Somente a leitura da notificação pode ser alterada';
  END IF;
  IF OLD.read_at IS NOT NULL AND NEW.read_at IS DISTINCT FROM OLD.read_at THEN
    RAISE EXCEPTION 'Uma notificação lida não pode ser alterada';
  END IF;
  IF OLD.read_at IS NULL AND NEW.read_at IS NULL THEN
    RAISE EXCEPTION 'Informe o horário da leitura';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER guard_notification_update BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.guard_notification_update();
CREATE TRIGGER set_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER set_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.emit_notification(
  _user_id uuid, _type text, _title text, _message text, _event_key text,
  _order_id uuid DEFAULT NULL, _restaurant_id uuid DEFAULT NULL, _link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications(user_id, order_id, restaurant_id, type, title, message, link, event_key)
  VALUES (_user_id, _order_id, _restaurant_id, left(_type, 60), left(_title, 160), left(_message, 600), left(_link, 300), left(_event_key, 240))
  ON CONFLICT (user_id, event_key) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.emit_notification(uuid,text,text,text,text,uuid,uuid,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_order_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _actor uuid := auth.uid();
  _staff record;
  _admin record;
  _title text;
  _message text;
  _type text;
  _event text;
  _customer_link text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _customer_link := '/pedido/' || NEW.code;
    PERFORM public.emit_notification(NEW.customer_id, 'order_received', 'Pedido #' || NEW.code || ' recebido',
      'Pedido recebido! Estamos aguardando a confirmação do restaurante.', NEW.id::text || ':received', NEW.id, NEW.restaurant_id, _customer_link);
    FOR _staff IN SELECT user_id FROM public.restaurant_staff WHERE restaurant_id = NEW.restaurant_id LOOP
      PERFORM public.emit_notification(_staff.user_id, 'new_order', 'Novo pedido #' || NEW.code,
        NEW.customer_name || ' fez um novo pedido. Abra os detalhes para aceitar ou recusar.', NEW.id::text || ':new_order', NEW.id, NEW.restaurant_id, '/painel?tab=pedidos');
    END LOOP;
    RETURN NEW;
  END IF;

  _customer_link := '/pedido/' || NEW.code;

  IF OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL THEN
    PERFORM public.emit_notification(NEW.customer_id, 'order_accepted', 'Pedido #' || NEW.code || ' aceito',
      'Seu pedido foi aceito pelo restaurante.', NEW.id::text || ':accepted', NEW.id, NEW.restaurant_id, _customer_link);
    FOR _staff IN SELECT user_id FROM public.restaurant_staff WHERE restaurant_id = NEW.restaurant_id AND user_id IS DISTINCT FROM _actor LOOP
      PERFORM public.emit_notification(_staff.user_id, 'order_accepted', 'Pedido #' || NEW.code || ' aceito',
        'O pedido foi aceito e aguarda o início do preparo.', NEW.id::text || ':accepted', NEW.id, NEW.restaurant_id, '/painel?tab=pedidos');
    END LOOP;
  END IF;

  IF OLD.courier_id IS DISTINCT FROM NEW.courier_id THEN
    IF OLD.courier_id IS NOT NULL THEN
      PERFORM public.emit_notification(OLD.courier_id, 'delivery_changed', 'Entrega do pedido #' || NEW.code || ' alterada',
        'Esta entrega não está mais atribuída a você.', NEW.id::text || ':courier_removed:' || coalesce(NEW.courier_id::text, 'none'), NEW.id, NEW.restaurant_id, NULL);
    END IF;
    IF NEW.courier_id IS NOT NULL THEN
      PERFORM public.emit_notification(NEW.courier_id, 'delivery_assigned', 'Entrega atribuída: pedido #' || NEW.code,
        'Uma entrega foi atribuída a você. Aguarde o pedido ficar pronto para retirada.', NEW.id::text || ':courier_assigned:' || NEW.courier_id::text, NEW.id, NEW.restaurant_id, NULL);
      PERFORM public.emit_notification(NEW.customer_id, 'courier_assigned', 'Entregador atribuído ao pedido #' || NEW.code,
        'Um entregador recebeu a atribuição da sua entrega.', NEW.id::text || ':customer_courier:' || NEW.courier_id::text, NEW.id, NEW.restaurant_id, _customer_link);
    END IF;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    _type := 'order_' || NEW.status::text;
    _event := NEW.id::text || ':status:' || NEW.status::text;
    _title := 'Pedido #' || NEW.code;
    CASE NEW.status
      WHEN 'preparing' THEN
        _title := 'Pedido #' || NEW.code || ' em preparação';
        _message := 'Seu pedido está sendo preparado!';
      WHEN 'ready' THEN
        _title := 'Pedido #' || NEW.code || ' pronto';
        _message := CASE WHEN NEW.fulfillment = 'pickup' THEN 'Seu pedido está pronto e aguardando retirada.' ELSE 'Seu pedido está pronto e aguardando o entregador.' END;
      WHEN 'out_for_delivery' THEN
        _title := 'Pedido #' || NEW.code || ' saiu para entrega';
        _message := 'Seu pedido saiu para entrega!';
      WHEN 'delivered' THEN
        _title := 'Pedido #' || NEW.code || ' concluído';
        _message := CASE WHEN NEW.fulfillment = 'pickup' THEN 'Retirada concluída! Obrigado pelo pedido.' ELSE 'Pedido entregue! Bom apetite.' END;
      WHEN 'cancelled' THEN
        _title := 'Pedido #' || NEW.code || ' cancelado';
        _message := 'Seu pedido foi cancelado.' || CASE WHEN NEW.rejection_reason IS NOT NULL THEN ' Motivo: ' || NEW.rejection_reason ELSE '' END;
      ELSE
        _message := 'Houve uma atualização importante no seu pedido.';
    END CASE;
    PERFORM public.emit_notification(NEW.customer_id, _type, _title, _message, _event, NEW.id, NEW.restaurant_id, _customer_link);

    FOR _staff IN SELECT user_id FROM public.restaurant_staff WHERE restaurant_id = NEW.restaurant_id AND user_id IS DISTINCT FROM _actor LOOP
      PERFORM public.emit_notification(_staff.user_id, _type, _title,
        'O pedido #' || NEW.code || ' foi atualizado: ' || NEW.status::text || '.', _event, NEW.id, NEW.restaurant_id, '/painel?tab=pedidos');
    END LOOP;

    IF NEW.courier_id IS NOT NULL AND NEW.status IN ('ready','out_for_delivery','delivered','cancelled') THEN
      PERFORM public.emit_notification(NEW.courier_id, 'delivery_' || NEW.status::text,
        'Entrega do pedido #' || NEW.code || ' atualizada',
        CASE NEW.status WHEN 'ready' THEN 'O pedido está pronto para retirada.' WHEN 'out_for_delivery' THEN 'A entrega está em andamento.' WHEN 'delivered' THEN 'A entrega foi concluída.' ELSE 'A entrega foi cancelada.' END,
        _event, NEW.id, NEW.restaurant_id, NULL);
    END IF;

    IF NEW.status = 'cancelled' THEN
      FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' AND user_id IS DISTINCT FROM _actor LOOP
        PERFORM public.emit_notification(_admin.user_id, 'admin_order_cancelled', 'Pedido #' || NEW.code || ' cancelado',
          coalesce(NEW.rejection_reason, 'Um pedido foi cancelado e precisa de acompanhamento.'), _event, NEW.id, NEW.restaurant_id, '/admin?tab=pedidos');
      END LOOP;
    END IF;
  END IF;

  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    PERFORM public.emit_notification(NEW.customer_id, 'payment_updated', 'Pagamento do pedido #' || NEW.code || ' atualizado',
      'A situação do pagamento foi atualizada para ' || NEW.payment_status::text || '.', NEW.id::text || ':payment:' || NEW.payment_status::text, NEW.id, NEW.restaurant_id, _customer_link);
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_order_event() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER notify_order_insert AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_order_event();
CREATE TRIGGER notify_order_update AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_order_event();

CREATE OR REPLACE FUNCTION public.notify_restaurant_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _actor uuid := auth.uid();
  _staff record;
  _admin record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' AND user_id IS DISTINCT FROM _actor LOOP
      PERFORM public.emit_notification(_admin.user_id, 'admin_restaurant_pending', 'Novo restaurante aguardando aprovação',
        NEW.name || ' foi cadastrado e aguarda análise da administração.', NEW.id::text || ':restaurant_created', NULL, NEW.id, '/admin?tab=restaurantes');
    END LOOP;
    RETURN NEW;
  END IF;

  IF OLD.approved_at IS NULL AND NEW.approved_at IS NOT NULL THEN
    FOR _staff IN SELECT user_id FROM public.restaurant_staff WHERE restaurant_id = NEW.id LOOP
      PERFORM public.emit_notification(_staff.user_id, 'restaurant_approved', NEW.name || ' foi aprovado',
        'O cadastro do restaurante foi aprovado pela administração.', NEW.id::text || ':approved', NULL, NEW.id, '/painel?tab=funcionamento');
    END LOOP;
  END IF;

  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    FOR _staff IN SELECT user_id FROM public.restaurant_staff WHERE restaurant_id = NEW.id LOOP
      PERFORM public.emit_notification(_staff.user_id, CASE WHEN NEW.is_active THEN 'restaurant_reactivated' ELSE 'restaurant_suspended' END,
        NEW.name || CASE WHEN NEW.is_active THEN ' foi reativado' ELSE ' foi suspenso' END,
        CASE WHEN NEW.is_active THEN 'O restaurante voltou a ficar ativo na plataforma.' ELSE 'O restaurante foi suspenso pela administração.' || coalesce(' Motivo: ' || NEW.suspension_reason, '') END,
        NEW.id::text || ':active:' || NEW.is_active::text, NULL, NEW.id, '/painel?tab=funcionamento');
    END LOOP;
    IF NOT NEW.is_active THEN
      FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' AND user_id IS DISTINCT FROM _actor LOOP
        PERFORM public.emit_notification(_admin.user_id, 'admin_restaurant_suspended', NEW.name || ' foi suspenso',
          coalesce(NEW.suspension_reason, 'Restaurante suspenso na plataforma.'), NEW.id::text || ':suspended', NULL, NEW.id, '/admin?tab=restaurantes');
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_restaurant_event() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER notify_restaurant_insert AFTER INSERT ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.notify_restaurant_event();
CREATE TRIGGER notify_restaurant_update AFTER UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.notify_restaurant_event();

CREATE OR REPLACE FUNCTION public.notify_staff_link_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _restaurant_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO _restaurant_name FROM public.restaurants WHERE id = NEW.restaurant_id;
    PERFORM public.emit_notification(NEW.user_id, 'staff_linked', 'Vínculo com ' || coalesce(_restaurant_name, 'restaurante'),
      'Sua conta recebeu acesso ao painel do restaurante como ' || NEW.role::text || '.', NEW.id::text || ':staff_linked', NULL, NEW.restaurant_id, '/painel?tab=painel');
    RETURN NEW;
  END IF;
  SELECT name INTO _restaurant_name FROM public.restaurants WHERE id = OLD.restaurant_id;
  PERFORM public.emit_notification(OLD.user_id, 'staff_unlinked', 'Vínculo com ' || coalesce(_restaurant_name, 'restaurante') || ' removido',
    'Seu acesso ao painel deste restaurante foi removido pela administração.', OLD.id::text || ':staff_unlinked', NULL, OLD.restaurant_id, NULL);
  RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_staff_link_event() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER notify_staff_link_insert AFTER INSERT ON public.restaurant_staff FOR EACH ROW EXECUTE FUNCTION public.notify_staff_link_event();
CREATE TRIGGER notify_staff_link_delete AFTER DELETE ON public.restaurant_staff FOR EACH ROW EXECUTE FUNCTION public.notify_staff_link_event();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;