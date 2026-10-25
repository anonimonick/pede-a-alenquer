import {createFileRoute} from '@tanstack/react-router';
import {PedeApp} from '@/features/pedeai/PedeApp';
import {AuthPage,safeReturn} from '@/features/pedeai/AuthPages';
export const Route=createFileRoute('/entrar')({validateSearch:(search:Record<string,unknown>)=>({returnTo:safeReturn(search['returnTo'])}),head:()=>({meta:[{title:'Entrar | Pede Aí'},{name:'description',content:'Acesse sua conta demonstrativa do Pede Aí em Alenquer.'},{property:'og:title',content:'Entrar | Pede Aí'},{property:'og:description',content:'Acesse sua conta demonstrativa do Pede Aí em Alenquer.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){const {returnTo}=Route.useSearch();return <PedeApp><AuthPage kind="login" returnTo={returnTo}/></PedeApp>;}
