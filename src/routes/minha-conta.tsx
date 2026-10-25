import {createFileRoute} from '@tanstack/react-router';
import {PedeApp} from '@/features/pedeai/PedeApp';
import {AccountPage,ACCOUNT_TABS,type AccountTab} from '@/features/pedeai/AccountPage';
export const Route=createFileRoute('/minha-conta')({validateSearch:(search:Record<string,unknown>)=>({tab:ACCOUNT_TABS.includes(search['tab'] as AccountTab)?search['tab'] as AccountTab:'perfil' as AccountTab}),head:()=>({meta:[{title:'Minha Conta | Pede Aí'},{name:'description',content:'Perfil, endereços, pedidos e restaurantes favoritos da sua conta demonstrativa.'},{property:'og:title',content:'Minha Conta | Pede Aí'},{property:'og:description',content:'Perfil, endereços, pedidos e restaurantes favoritos da sua conta demonstrativa.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){const {tab}=Route.useSearch();return <PedeApp><AccountPage tab={tab}/></PedeApp>;}
