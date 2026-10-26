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
- Local demo accounts use a root account provider and Web Crypto PBKDF2 salted verifiers only in browser event handlers; remembered sessions use localStorage and transient sessions use sessionStorage, never production authentication.
- Scope addresses and favorites to the local account, and associate completed order codes with its account without rewriting Stage 3 order snapshots; never attach another account's order history.
- Supabase schema (profiles, user_roles, restaurants, restaurant_staff, categories, products, customer_addresses, orders, order_items) is prepared but not yet wired to the UI; the app still runs on local demo state until a dedicated migration step swaps it in.
- Roles live only in user_roles, written exclusively via service_role (assign_role); orders are created only through the place_order DB function, which recomputes prices/fees/totals server-side.
