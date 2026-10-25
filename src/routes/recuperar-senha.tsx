import {createFileRoute} from '@tanstack/react-router';
import {PedeApp} from '@/features/pedeai/PedeApp';
import {AuthPage,safeReturn} from '@/features/pedeai/AuthPages';
export const Route=createFileRoute('/recuperar-senha')({validateSearch:(search:Record<string,unknown>)=>({returnTo:safeReturn(search['returnTo'])}),head:()=>({meta:[{title:'Recuperar acesso | Pede Aí'},{name:'description',content:'Informações sobre recuperação de acesso no protótipo Pede Aí.'},{property:'og:title',content:'Recuperar acesso | Pede Aí'},{property:'og:description',content:'Informações sobre recuperação de acesso no protótipo Pede Aí.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){const {returnTo}=Route.useSearch();return <PedeApp><AuthPage kind="recovery" returnTo={returnTo}/></PedeApp>;}
