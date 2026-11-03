<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use TanStack restaurant detail routes and a shared PedeApp presentation shell; real URLs provide browser back/forward and direct menu access.
- Keep cart, checkout draft and order snapshots in the root React provider; hydrate validated browser-local persistence only after mounting, without a checkout backend.
- Keep restaurant/menu fixtures and pure cart pricing rules in browser-safe modules so all ordering entry points share the same constraints and tests.
- Use dedicated TanStack cart, checkout and confirmation routes, not a standalone HTML page switcher, to preserve the existing framework and direct navigation.
- Compute order totals through one integer-cent calculator and persist immutable validated confirmation snapshots so completed orders never depend on a later edited cart.
- Accounts use Supabase Auth through the root AccountProvider; profile, addresses (customer_addresses) and favorites (customer_favorites) are read/written with RLS as the signed-in user.
- Orders are placed only via the place_order_v3 RPC (idempotent per client_request_id; checks restaurant open and address ownership; older order functions are revoked), which recomputes prices, extras, coupon, fee and total server-side; the customer menu overlays available DB products onto fixtures (menu-sync.ts, keyed by demo_id; new products get demo_id from a trigger) so displayed prices match the server.
- Order history in Minha Conta comes from the orders table; the cart and checkout draft stay in browser storage.
- Roles live only in user_roles, written exclusively via service_role (assign_role); orders are created only through the place_order DB function, which recomputes prices/fees/totals server-side.
- The restaurant panel (/painel) runs on the browser client under RLS; authorization lives in the DB: restaurant_staff links, guard_order_update (status transitions received→accepted_at→preparing→ready, reject with reason; courier/admin finish delivery; financial fields locked), guard_restaurant_admin_fields (is_active is admin suspension, is_open is operational) and guard_product_write.
- Panel and customer order lists refresh by polling (10s/20s) because Realtime publication is not enabled; enable supabase_realtime on orders only after user approval.
- Product photos live in the private 'product-images' bucket under <restaurant_id>/ (managers-only upload/delete by RLS); products.image_url stores the unsigned storage URL and readers swap it for signed URLs via product-images.ts, because workspace policy blocks public buckets.
