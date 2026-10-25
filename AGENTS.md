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
- Keep the Stage 2 cart in a root-level React provider for intact in-session navigation; no checkout backend or durable storage is part of this demo.
- Keep restaurant/menu fixtures and pure cart pricing rules in browser-safe modules so all ordering entry points share the same constraints and tests.
