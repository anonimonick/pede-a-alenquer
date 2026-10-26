REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_restaurant_staff(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_restaurant_manager(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_restaurant_staff(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_restaurant_manager(uuid, uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.place_order(uuid, jsonb, public.payment_method, public.fulfillment_mode, uuid, numeric, text) FROM PUBLIC, anon;