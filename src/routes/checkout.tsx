import { createFileRoute } from '@tanstack/react-router';
import { PedeApp } from '@/features/pedeai/PedeApp';
import { CheckoutPage } from '@/features/pedeai/Checkout';
export const Route=createFileRoute('/checkout')({
 head:()=>({meta:[{title:'Finalizar pedido | Pede Aí'},{name:'description',content:'Confira seu pedido demonstrativo no Pede Aí, delivery em Alenquer, Pará.'},{property:'og:title',content:'Finalizar pedido | Pede Aí'},{property:'og:description',content:'Confira seu pedido demonstrativo no Pede Aí, delivery em Alenquer, Pará.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component:Page,
});
function Page(){return <PedeApp><CheckoutPage/></PedeApp>;}
