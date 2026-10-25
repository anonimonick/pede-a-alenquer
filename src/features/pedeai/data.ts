import burgerImage from "@/assets/menu-burger.jpg";
import friesImage from "@/assets/menu-fries.jpg";
import sodaImage from "@/assets/menu-soda.jpg";
import fishImage from "@/assets/menu-fish.jpg";
import vatapaImage from "@/assets/menu-vatapa.jpg";
import acaiImage from "@/assets/menu-acai.jpg";
import marmitaImage from "@/assets/menu-marmita.jpg";
import beerImage from "@/assets/menu-beer.jpg";
import juiceImage from "@/assets/menu-juice.jpg";
export const RESTAURANTS = [
  { id: 1, name: "Surubim Burger", category: "Lanches", filter: "Lanches", rating: 4.8, time: "30-40 min", fee: "R$ 4,50", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80" },
  { id: 2, name: "Pizzaria Bela Vista", category: "Pizzas", filter: "Pizzas", rating: 4.9, time: "40-55 min", fee: "Grátis", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80" },
  { id: 3, name: "Sabor da Amazônia", category: "Comida Brasileira", filter: "Refeições", rating: 4.7, time: "25-35 min", fee: "R$ 5,00", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80" },
  { id: 4, name: "Açaí do Ximango", category: "Açaí & Sobremesas", filter: "Açaí", rating: 4.9, time: "15-25 min", fee: "Grátis", img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80" },
  { id: 5, name: "Marmitas da Dona Rosa", category: "Marmitas & Caseira", filter: "Refeições", rating: 4.6, time: "20-30 min", fee: "R$ 3,50", img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80" },
  { id: 6, name: "Empório das Geladas", category: "Bebidas & Conveniência", filter: "Bebidas", rating: 4.8, time: "15-20 min", fee: "R$ 4,00", img: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80" },
 ] as const;

export const OFFERS = [
  { id: 101, restaurant: "Surubim Burger", title: "Smash Duplo Artesanal", desc: "Dois hambúrgueres de 90g, queijo cheddar derretido e maionese da casa.", original: 28, price: 21.9, img: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=500&q=80" },
  { id: 102, restaurant: "Pizzaria Bela Vista", title: "Pizza Calabresa Especial", desc: "Massa fina, molho artesanal de tomate, fatias de calabresa e cebola.", original: 52, price: 39.9, img: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=500&q=80" },
  { id: 103, restaurant: "Açaí do Ximango", title: "Copo Açaí 500ml Turbinado", desc: "Açaí puro acompanhado de banana, granola crocante e leite condensado.", original: 22, price: 16.5, img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=500&q=80" },
  { id: 104, restaurant: "Marmitas da Dona Rosa", title: "Marmitex Executiva de Frango", desc: "Filé de frango grelhado, arroz fresquinho, feijão caseiro e farofa crocante.", original: 24, price: 18, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80" },
 ] as const;

export type Option = { name: string; price: number };
export type OptionGroup = { name: string; type: 'single' | 'multiple'; options: Option[] };
export type Product = { id: number; restaurantId: number; title: string; desc: string; category: string; price: number; img: string; popular?: boolean; groups: OptionGroup[] };
export const SLUGS = ['surubim-burger','pizzaria-bela-vista','sabor-da-amazonia','acai-do-ximango','marmitas-da-dona-rosa','emporio-das-geladas'] as const;
export const DETAILS = [
  { reviews: 142, minimum: 20, hours: '18h às 23h30', isOpen: true },
  { reviews: 208, minimum: 30, hours: '18h às 23h', isOpen: true },
  { reviews: 96, minimum: 20, hours: '11h às 15h', isOpen: false },
  { reviews: 184, minimum: 12, hours: '14h às 22h', isOpen: true },
  { reviews: 117, minimum: 15, hours: '10h30 às 14h30', isOpen: false },
  { reviews: 83, minimum: 15, hours: '10h às 00h', isOpen: true },
] as const;
const extras = (options: [string, number][]): OptionGroup => ({ name: 'Adicionais', type: 'multiple', options: options.map(([name, price]) => ({ name, price })) });
const choice = (name: string, options: [string, number][]): OptionGroup => ({ name, type: 'single', options: options.map(([name, price]) => ({ name, price })) });
const burger = extras([['Bacon crocante',4],['Queijo cheddar extra',3],['Cebola caramelizada',2.5],['Maionese especial',2]]);
const pizza = [choice('Tamanho',[['Média',0],['Grande',15]]),extras([['Borda de catupiry',8],['Borda de cheddar',8],['Queijo extra',5],['Orégano',0]])];
const brazil = extras([['Porção de farofa',4],['Arroz branco',5],['Vinagrete',3]]);
const acai = extras([['Leite em pó',3],['Banana',2],['Morango',4],['Granola',2],['Leite condensado',2.5],['Paçoca',2]]);
const marmita = [choice('Opção de carne',[['Bife',0],['Frango',0],['Peixe',3]]),extras([['Ovo frito',3],['Feijão tropeiro',5]])];
const defaultImage = (id: number, category: string) => category === 'Bebidas' || category === 'Refrigerantes' ? sodaImage : id === 1 ? category === 'Batatas fritas' ? friesImage : burgerImage : id === 3 ? category === 'Pratos regionais' ? vatapaImage : fishImage : id === 4 ? acaiImage : id === 5 ? marmitaImage : id === 6 ? category === 'Sucos regionais' ? juiceImage : beerImage : RESTAURANTS[1].img;
const make = (restaurantId: number, id: number, title: string, desc: string, category: string, price: number, groups: OptionGroup[] = [], popular = false, img?: string): Product => ({ restaurantId,id,title,desc,category,price,groups,popular,img:img ?? defaultImage(restaurantId,category) });
export const PRODUCTS: Product[] = [
 make(1,101,'Smash Duplo Artesanal','Dois hambúrgueres de 90g, queijo cheddar derretido e maionese da casa no pão macio.','Smashs',21.9,[burger],true,OFFERS[0].img),
 make(1,111,'Smash Clássico','Hambúrguer de 90g, queijo e maionese especial no pão selado.','Smashs',16,[burger]),
 make(1,112,'Burger da Casa','Blend artesanal de 180g, alface, tomate, cheddar e molho da casa.','Burgers artesanais',29,[burger],true),
 make(1,113,'Batatas Fritas','Porção de 250g de batatas douradas e crocantes.','Batatas fritas',12,[burger]),
 make(1,114,'Refrigerante Lata','Refrigerante gelado de 350ml.','Bebidas',6,[choice('Sabor',[['Cola',0],['Guaraná',0]])]),
 make(2,102,'Pizza Calabresa Especial','Massa fina, molho artesanal de tomate, muçarela, calabresa e cebola.','Tradicionais',39.9,pizza,true,OFFERS[1].img),
 make(2,121,'Pizza Margherita','Muçarela, tomates frescos, manjericão e molho artesanal.','Tradicionais',38,pizza),
 make(2,122,'Pizza Quatro Queijos','Muçarela, provolone, parmesão e catupiry sobre massa artesanal.','Especiais',46,pizza,true),
 make(2,123,'Pizza da Bela Vista','Frango desfiado, bacon crocante, milho e catupiry.','Especiais',49,pizza),
 make(2,124,'Refrigerante 2L','Garrafa de refrigerante gelado para compartilhar.','Bebidas',12,[choice('Sabor',[['Cola',0],['Guaraná',0]])]),
 make(3,131,'Filhote Grelhado','Filhote da região grelhado com arroz, farofa e vinagrete.','Peixes da região',38,[brazil],true),
 make(3,132,'Pirarucu da Amazônia','Pirarucu preparado com temperos regionais, arroz e pirão.','Peixes da região',42,[brazil],true),
 make(3,133,'Vatapá Paraense','Creme de pão, camarão, leite de coco e temperos paraenses.','Pratos regionais',24,[brazil]),
 make(3,134,'Pirão de Peixe','Porção cremosa de pirão feito com caldo de peixe e farinha de mandioca.','Acompanhamentos',10),
 make(3,135,'Farofa da Casa','Porção de farofa de mandioca dourada com temperos da casa.','Acompanhamentos',4),
 make(4,141,'Açaí 300ml','Açaí puro e gelado. Escolha seus adicionais favoritos.','Açaí',12,[acai]),
 make(4,103,'Copo Açaí 500ml Turbinado','Açaí puro acompanhado de banana, granola crocante e leite condensado.','Açaí',16.5,[acai],true,OFFERS[2].img),
 make(4,143,'Açaí 700ml','Copo generoso de açaí puro de 700ml com adicionais à sua escolha.','Açaí',23,[acai],true),
 make(4,144,'Creme de Cupuaçu 300ml','Creme de cupuaçu regional, refrescante e cremoso.','Cremes regionais',14,[acai]),
 make(5,151,'Marmitex Econômica','Arroz, feijão, farofa e sua opção de carne. Refeição caseira completa.','Marmitas',15,marmita),
 make(5,104,'Marmitex Executiva de Frango','Frango grelhado, arroz fresquinho, feijão caseiro e farofa crocante. Você pode trocar a carne.','Marmitas',18,[choice('Opção de carne',[['Frango',0],['Bife',0],['Peixe',3]]),extras([['Ovo frito',3],['Feijão tropeiro',5]])],true,OFFERS[3].img),
 make(5,153,'Marmitex Fitness','Arroz integral, legumes no vapor, salada e sua opção de carne grelhada.','Fitness',22,marmita,true),
 make(5,154,'Feijão Tropeiro','Porção extra de feijão tropeiro com farinha e temperos caseiros.','Acompanhamentos',5),
 make(6,161,'Cerveja Artesanal 500ml','Cerveja artesanal gelada, garrafa de 500ml. Venda exclusiva para maiores de 18 anos.','Cervejas artesanais',18,[choice('Estilo',[['Pilsen',0],['IPA',4],['Weiss',2]])],true),
 make(6,162,'Refrigerante 2L','Garrafa gelada de refrigerante de 2 litros.','Refrigerantes',12,[choice('Sabor',[['Cola',0],['Guaraná',0]])]),
 make(6,163,'Suco Regional 500ml','Suco natural de frutas regionais, preparado e servido gelado.','Sucos regionais',9,[choice('Fruta',[['Cupuaçu',0],['Taperebá',0],['Acerola',0]])],true),
 make(6,164,'Saco de Gelo 3kg','Gelo em cubos, embalagem de 3kg.','Gelo',8),
 make(6,165,'Combo Encontro','Quatro cervejas artesanais Pilsen de 500ml e um saco de gelo de 3kg. Venda exclusiva para maiores de 18 anos.','Combos',68,[],true),
];
export const brl = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;
