import {createFileRoute} from '@tanstack/react-router';
import {PedeApp} from '@/features/pedeai/PedeApp';
import {AuthPage,safeReturn} from '@/features/pedeai/AuthPages';
export const Route=createFileRoute('/cadastro')({validateSearch:(search:Record<string,unknown>)=>({returnTo:safeReturn(search['returnTo'])}),head:()=>({meta:[{title:'Criar conta | Pede Aí'},{name:'description',content:'Cadastre seu perfil local demonstrativo no Pede Aí.'},{property:'og:title',content:'Criar conta | Pede Aí'},{property:'og:description',content:'Cadastre seu perfil local demonstrativo no Pede Aí.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){const {returnTo}=Route.useSearch();return <PedeApp><AuthPage kind="signup" returnTo={returnTo}/></PedeApp>;}
