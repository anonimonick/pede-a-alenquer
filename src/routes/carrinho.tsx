import { createFileRoute } from '@tanstack/react-router';
import { PedeApp } from '@/features/pedeai/PedeApp';
import { CartPage } from '@/features/pedeai/Checkout';
export const Route=createFileRoute('/carrinho')({
 head:()=>({meta:[{title:'Meu carrinho | Pede Aí'},{name:'description',content:'Confira seu pedido demonstrativo no Pede Aí, delivery em Alenquer, Pará.'},{property:'og:title',content:'Meu carrinho | Pede Aí'},{property:'og:description',content:'Confira seu pedido demonstrativo no Pede Aí, delivery em Alenquer, Pará.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component:Page,
});
function Page(){return <PedeApp><CartPage/></PedeApp>;}
