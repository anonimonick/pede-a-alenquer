import { createFileRoute, notFound } from '@tanstack/react-router';
import { PedeApp } from '@/features/pedeai/PedeApp';
import { RESTAURANTS, SLUGS } from '@/features/pedeai/data';
export const Route = createFileRoute('/restaurante/$slug')({
 loader:({params})=>{const index=SLUGS.indexOf(params.slug);if(index<0)throw notFound();return {restaurantId:index+1,name:RESTAURANTS[index].name};},
 head:({loaderData})=>{const title=loaderData?`${loaderData.name} | Cardápio - Pede Aí`:'Restaurante não encontrado | Pede Aí';const description=loaderData?`Confira o cardápio demonstrativo de ${loaderData.name} em Alenquer, Pará. Escolha produtos e personalize seu pedido.`:'Restaurante não encontrado no Pede Aí.';return {meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]};},
 component: RestaurantPage,
});
function RestaurantPage(){const {restaurantId}=Route.useLoaderData();return <PedeApp restaurantId={restaurantId}/>;}
