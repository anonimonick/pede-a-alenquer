import { createFileRoute } from '@tanstack/react-router';
import { PedeApp } from '@/features/pedeai/PedeApp';
import { ConfirmationPage } from '@/features/pedeai/Checkout';
export const Route=createFileRoute('/pedido/$code')({
 head:()=>({meta:[{title:'Detalhes do pedido | Pede Aí'},{name:'description',content:'Confira seu pedido demonstrativo no Pede Aí, delivery em Alenquer, Pará.'},{property:'og:title',content:'Detalhes do pedido | Pede Aí'},{property:'og:description',content:'Confira seu pedido demonstrativo no Pede Aí, delivery em Alenquer, Pará.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component:Page,
});
function Page(){const {code}=Route.useParams();return <PedeApp><ConfirmationPage code={code}/></PedeApp>;}
