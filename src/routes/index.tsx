import { createFileRoute } from '@tanstack/react-router';
import { PedeApp } from '@/features/pedeai/PedeApp';
export const Route = createFileRoute('/')({
 head: () => ({ meta: [
 {title:'Pede Aí | Pediu, chegou! - Alenquer, PA'},
 {name:'description',content:'Delivery em Alenquer, PA: lanches, pizzas, açaí, refeições, bebidas e mais.'},
 {property:'og:title',content:'Pede Aí | Pediu, chegou!'},
 {property:'og:description',content:'Peça nos seus lugares favoritos de Alenquer sem sair de casa.'},
 {property:'og:type',content:'website'}, {name:'twitter:card',content:'summary_large_image'}
 ]}), component: Home,
});
function Home(){return <PedeApp/>;}
