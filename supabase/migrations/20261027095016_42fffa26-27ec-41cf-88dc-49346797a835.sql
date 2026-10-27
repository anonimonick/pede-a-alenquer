ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS demo_id integer UNIQUE, ADD COLUMN IF NOT EXISTS cuisine text, ADD COLUMN IF NOT EXISTS home_filter text, ADD COLUMN IF NOT EXISTS rating numeric(2,1), ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS delivery_time text, ADD COLUMN IF NOT EXISTS hours_label text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS demo_id integer UNIQUE, ADD COLUMN IF NOT EXISTS option_groups jsonb NOT NULL DEFAULT '[]'::jsonb, ADD COLUMN IF NOT EXISTS is_popular boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS cep text, ADD COLUMN IF NOT EXISTS instructions text, ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS customer_addresses_one_default ON public.customer_addresses(user_id) WHERE is_default;
CREATE INDEX IF NOT EXISTS customer_addresses_user_idx ON public.customer_addresses(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_slug_uidx ON public.restaurants(slug);

GRANT SELECT ON public.restaurants, public.categories, public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants, public.categories, public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_staff TO authenticated;
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.restaurants, public.categories, public.products, public.profiles, public.customer_addresses, public.user_roles, public.restaurant_staff, public.orders, public.order_items TO service_role;

INSERT INTO public.restaurants(demo_id,name,slug,description,logo_url,cover_url,address,is_open,is_active,delivery_fee,minimum_order,cuisine,home_filter,rating,review_count,delivery_time,hours_label)
SELECT v.id,v.name,v.slug,v.cuisine||' em Alenquer (dados demonstrativos).','https://images.unsplash.com/'||v.img||'?auto=format&fit=crop&w=600&q=80','https://images.unsplash.com/'||v.img||'?auto=format&fit=crop&w=600&q=80','Alenquer, PA',v.open,true,v.fee,v.minimum,v.cuisine,v.filter,v.rating,v.reviews,v.time,v.hours FROM (VALUES
(1,'Surubim Burger','surubim-burger','photo-1568901346375-23c9450c58cd',true,4.5,20,'Lanches','Lanches',4.8,142,'30-40 min','18h às 23h30'),
(2,'Pizzaria Bela Vista','pizzaria-bela-vista','photo-1513104890138-7c749659a591',true,0,30,'Pizzas','Pizzas',4.9,208,'40-55 min','18h às 23h'),
(3,'Sabor da Amazônia','sabor-da-amazonia','photo-1546069901-ba9599a7e63c',false,5,20,'Comida Brasileira','Refeições',4.7,96,'25-35 min','11h às 15h'),
(4,'Açaí do Ximango','acai-do-ximango','photo-1590301157890-4810ed352733',true,0,12,'Açaí & Sobremesas','Açaí',4.9,184,'15-25 min','14h às 22h'),
(5,'Marmitas da Dona Rosa','marmitas-da-dona-rosa','photo-1555396273-367ea4eb4db5',false,3.5,15,'Marmitas & Caseira','Refeições',4.6,117,'20-30 min','10h30 às 14h30'),
(6,'Empório das Geladas','emporio-das-geladas','photo-1527061011665-3652c757a4d4',true,4,15,'Bebidas & Conveniência','Bebidas',4.8,83,'15-20 min','10h às 00h')
) v(id,name,slug,img,open,fee,minimum,cuisine,filter,rating,reviews,time,hours)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories(restaurant_id,name,sort_order) SELECT r.id,v.name,v.ord FROM (VALUES (1,'Smashs',0),(1,'Burgers artesanais',1),(1,'Batatas fritas',2),(1,'Bebidas',3),(2,'Tradicionais',0),(2,'Especiais',1),(2,'Bebidas',2),(3,'Peixes da região',0),(3,'Pratos regionais',1),(3,'Acompanhamentos',2),(4,'Açaí',0),(4,'Cremes regionais',1),(5,'Marmitas',0),(5,'Fitness',1),(5,'Acompanhamentos',2),(6,'Cervejas artesanais',0),(6,'Refrigerantes',1),(6,'Sucos regionais',2),(6,'Gelo',3),(6,'Combos',4)) v(rid,name,ord) JOIN public.restaurants r ON r.demo_id=v.rid WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.restaurant_id=r.id AND c.name=v.name);

INSERT INTO public.products(demo_id,restaurant_id,category_id,name,description,price,is_available,is_popular,sort_order,option_groups) SELECT v.pid,r.id,c.id,v.name,v.descr,v.price,true,v.pop,v.ord,g.j::jsonb FROM (VALUES
(101,1,'Smashs','Smash Duplo Artesanal','Dois hambúrgueres de 90g, queijo cheddar derretido e maionese da casa no pão macio.',21.9,true,0,0),
(111,1,'Smashs','Smash Clássico','Hambúrguer de 90g, queijo e maionese especial no pão selado.',16,false,1,0),
(112,1,'Burgers artesanais','Burger da Casa','Blend artesanal de 180g, alface, tomate, cheddar e molho da casa.',29,true,2,0),
(113,1,'Batatas fritas','Batatas Fritas','Porção de 250g de batatas douradas e crocantes.',12,false,3,0),
(114,1,'Bebidas','Refrigerante Lata','Refrigerante gelado de 350ml.',6,false,4,1),
(102,2,'Tradicionais','Pizza Calabresa Especial','Massa fina, molho artesanal de tomate, muçarela, calabresa e cebola.',39.9,true,5,2),
(121,2,'Tradicionais','Pizza Margherita','Muçarela, tomates frescos, manjericão e molho artesanal.',38,false,6,2),
(122,2,'Especiais','Pizza Quatro Queijos','Muçarela, provolone, parmesão e catupiry sobre massa artesanal.',46,true,7,2),
(123,2,'Especiais','Pizza da Bela Vista','Frango desfiado, bacon crocante, milho e catupiry.',49,false,8,2),
(124,2,'Bebidas','Refrigerante 2L','Garrafa de refrigerante gelado para compartilhar.',12,false,9,1),
(131,3,'Peixes da região','Filhote Grelhado','Filhote da região grelhado com arroz, farofa e vinagrete.',38,true,10,3),
(132,3,'Peixes da região','Pirarucu da Amazônia','Pirarucu preparado com temperos regionais, arroz e pirão.',42,true,11,3),
(133,3,'Pratos regionais','Vatapá Paraense','Creme de pão, camarão, leite de coco e temperos paraenses.',24,false,12,3),
(134,3,'Acompanhamentos','Pirão de Peixe','Porção cremosa de pirão feito com caldo de peixe e farinha de mandioca.',10,false,13,4),
(135,3,'Acompanhamentos','Farofa da Casa','Porção de farofa de mandioca dourada com temperos da casa.',4,false,14,4),
(141,4,'Açaí','Açaí 300ml','Açaí puro e gelado. Escolha seus adicionais favoritos.',12,false,15,5),
(103,4,'Açaí','Copo Açaí 500ml Turbinado','Açaí puro acompanhado de banana, granola crocante e leite condensado.',16.5,true,16,5),
(143,4,'Açaí','Açaí 700ml','Copo generoso de açaí puro de 700ml com adicionais à sua escolha.',23,true,17,5),
(144,4,'Cremes regionais','Creme de Cupuaçu 300ml','Creme de cupuaçu regional, refrescante e cremoso.',14,false,18,5),
(151,5,'Marmitas','Marmitex Econômica','Arroz, feijão, farofa e sua opção de carne. Refeição caseira completa.',15,false,19,6),
(104,5,'Marmitas','Marmitex Executiva de Frango','Frango grelhado, arroz fresquinho, feijão caseiro e farofa crocante. Você pode trocar a carne.',18,true,20,7),
(153,5,'Fitness','Marmitex Fitness','Arroz integral, legumes no vapor, salada e sua opção de carne grelhada.',22,true,21,6),
(154,5,'Acompanhamentos','Feijão Tropeiro','Porção extra de feijão tropeiro com farinha e temperos caseiros.',5,false,22,4),
(161,6,'Cervejas artesanais','Cerveja Artesanal 500ml','Cerveja artesanal gelada, garrafa de 500ml. Venda exclusiva para maiores de 18 anos.',18,true,23,8),
(162,6,'Refrigerantes','Refrigerante 2L','Garrafa gelada de refrigerante de 2 litros.',12,false,24,1),
(163,6,'Sucos regionais','Suco Regional 500ml','Suco natural de frutas regionais, preparado e servido gelado.',9,true,25,9),
(164,6,'Gelo','Saco de Gelo 3kg','Gelo em cubos, embalagem de 3kg.',8,false,26,4),
(165,6,'Combos','Combo Encontro','Quatro cervejas artesanais Pilsen de 500ml e um saco de gelo de 3kg. Venda exclusiva para maiores de 18 anos.',68,true,27,4)
) v(pid,rid,cat,name,descr,price,pop,ord,gk) JOIN (VALUES
(0,'[{"name":"Adicionais","type":"multiple","options":[{"name":"Bacon crocante","price":4},{"name":"Queijo cheddar extra","price":3},{"name":"Cebola caramelizada","price":2.5},{"name":"Maionese especial","price":2}]}]'),
(1,'[{"name":"Sabor","type":"single","options":[{"name":"Cola","price":0},{"name":"Guaraná","price":0}]}]'),
(2,'[{"name":"Tamanho","type":"single","options":[{"name":"Média","price":0},{"name":"Grande","price":15}]},{"name":"Adicionais","type":"multiple","options":[{"name":"Borda de catupiry","price":8},{"name":"Borda de cheddar","price":8},{"name":"Queijo extra","price":5},{"name":"Orégano","price":0}]}]'),
(3,'[{"name":"Adicionais","type":"multiple","options":[{"name":"Porção de farofa","price":4},{"name":"Arroz branco","price":5},{"name":"Vinagrete","price":3}]}]'),
(4,'[]'),
(5,'[{"name":"Adicionais","type":"multiple","options":[{"name":"Leite em pó","price":3},{"name":"Banana","price":2},{"name":"Morango","price":4},{"name":"Granola","price":2},{"name":"Leite condensado","price":2.5},{"name":"Paçoca","price":2}]}]'),
(6,'[{"name":"Opção de carne","type":"single","options":[{"name":"Bife","price":0},{"name":"Frango","price":0},{"name":"Peixe","price":3}]},{"name":"Adicionais","type":"multiple","options":[{"name":"Ovo frito","price":3},{"name":"Feijão tropeiro","price":5}]}]'),
(7,'[{"name":"Opção de carne","type":"single","options":[{"name":"Frango","price":0},{"name":"Bife","price":0},{"name":"Peixe","price":3}]},{"name":"Adicionais","type":"multiple","options":[{"name":"Ovo frito","price":3},{"name":"Feijão tropeiro","price":5}]}]'),
(8,'[{"name":"Estilo","type":"single","options":[{"name":"Pilsen","price":0},{"name":"IPA","price":4},{"name":"Weiss","price":2}]}]'),
(9,'[{"name":"Fruta","type":"single","options":[{"name":"Cupuaçu","price":0},{"name":"Taperebá","price":0},{"name":"Acerola","price":0}]}]')
) g(k,j) ON g.k=v.gk JOIN public.restaurants r ON r.demo_id=v.rid JOIN public.categories c ON c.restaurant_id=r.id AND c.name=v.cat ON CONFLICT (demo_id) DO NOTHING;