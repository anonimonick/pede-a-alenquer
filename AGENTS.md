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
