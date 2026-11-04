import { createFileRoute } from '@tanstack/react-router';
import { PedeApp } from '@/features/pedeai/PedeApp';
import { AdminPanel, ADMIN_TABS, type AdminTab } from '@/features/pedeai/AdminPanel';

export const Route = createFileRoute('/admin')({
  validateSearch: (search: Record<string, unknown>) => ({ tab: ADMIN_TABS.includes(search['tab'] as AdminTab) ? (search['tab'] as AdminTab) : ('painel' as AdminTab) }),
  head: () => ({ meta: [
    { title: 'Administração | Pede Aí' },
    { name: 'description', content: 'Gestão da plataforma Pede Aí: restaurantes, usuários, pedidos e configurações.' },
    { property: 'og:title', content: 'Administração | Pede Aí' },
    { property: 'og:description', content: 'Gestão da plataforma Pede Aí: restaurantes, usuários, pedidos e configurações.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: Page,
});
function Page() { const { tab } = Route.useSearch(); return <PedeApp><AdminPanel tab={tab} /></PedeApp>; }
