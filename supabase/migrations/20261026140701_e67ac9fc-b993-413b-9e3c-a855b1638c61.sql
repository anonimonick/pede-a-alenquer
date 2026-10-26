REVOKE ALL ON public.profiles, public.user_roles, public.restaurant_staff, public.customer_addresses, public.orders, public.order_items FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.restaurants, public.categories, public.products FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.user_roles FROM authenticated;
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.orders FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.order_items FROM authenticated;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.profiles FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.restaurants, public.categories, public.products, public.restaurant_staff, public.customer_addresses FROM authenticated;