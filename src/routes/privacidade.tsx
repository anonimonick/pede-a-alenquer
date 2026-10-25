import {createFileRoute} from '@tanstack/react-router';
import {PedeApp} from '@/features/pedeai/PedeApp';
import {LegalPage} from '@/features/pedeai/AccountPage';
export const Route=createFileRoute('/privacidade')({head:()=>({meta:[{title:'Política de privacidade | Pede Aí'},{name:'description',content:'Como os dados locais são utilizados no protótipo Pede Aí.'},{property:'og:title',content:'Política de privacidade | Pede Aí'},{property:'og:description',content:'Como os dados locais são utilizados no protótipo Pede Aí.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){return <PedeApp><LegalPage privacy={true}/></PedeApp>;}
