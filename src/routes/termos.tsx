import {createFileRoute} from '@tanstack/react-router';
import {PedeApp} from '@/features/pedeai/PedeApp';
import {LegalPage} from '@/features/pedeai/AccountPage';
export const Route=createFileRoute('/termos')({head:()=>({meta:[{title:'Termos de uso | Pede Aí'},{name:'description',content:'Condições de uso do protótipo demonstrativo Pede Aí.'},{property:'og:title',content:'Termos de uso | Pede Aí'},{property:'og:description',content:'Condições de uso do protótipo demonstrativo Pede Aí.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){return <PedeApp><LegalPage privacy={false}/></PedeApp>;}
