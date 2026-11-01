import { createFileRoute } from '@tanstack/react-router';
import { PedeApp } from '@/features/pedeai/PedeApp';
import { RestaurantPanel, PANEL_TABS, type PanelTab } from '@/features/pedeai/RestaurantPanel';

export const Route = createFileRoute('/painel')({
  validateSearch: (search: Record<string, unknown>) => ({ tab: PANEL_TABS.includes(search['tab'] as PanelTab) ? (search['tab'] as PanelTab) : ('painel' as PanelTab) }),
  head: () => ({ meta: [
    { title: 'Painel do restaurante | Pede Aí' },
    { name: 'description', content: 'Gerencie pedidos, cardápio e funcionamento do seu restaurante no Pede Aí.' },
    { property: 'og:title', content: 'Painel do restaurante | Pede Aí' },
    { property: 'og:description', content: 'Gerencie pedidos, cardápio e funcionamento do seu restaurante no Pede Aí.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: Page,
});
function Page() { const { tab } = Route.useSearch(); return <PedeApp><RestaurantPanel tab={tab} /></PedeApp>; }
