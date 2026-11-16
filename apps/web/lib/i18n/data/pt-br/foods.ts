import type { FoodPage } from "@/app/(en)/calories/food-data";

export const ptBrFoods: FoodPage[] = [
  {
    slug: "roti",
    name: "Roti",
    tier: "indian",
    aka: ["chapati", "phulka", "pão indiano"],
    title: "Calorias no Roti (Chapati) — Por unidade real, não por 100 g",
    description:
      "Um roti médio tem cerca de 160 calorias. Calorias, proteínas e fibras para rotis pequenos, médios e grandes com porções reais.",
    intro: [
      "Quase ninguém pesa o roti na balança antes de comer. Esse é o principal dilema ao buscar essa informação.",
      "A maioria das tabelas nutricionais indica as calorias do roti 'por 100 gramas'. Mas um roti não pesa 100 gramas, e a receita caseira é muito diferente da versão servida em restaurantes. As calorias reais variam de acordo com o tamanho, espessura e se você adiciona manteiga clarificada (ghee) ou óleo.",
      "Abaixo você encontra os valores nutricionais de acordo com as porções reais mais consumidas no dia a dia.",
    ],
    per100g: { calories: 267, protein: 8.7, carbs: 53.3, fat: 2.7, fiber: 9.7, sodium: 317 },
    portions: [
      { label: "1 roti pequeno", grams: 40, note: "tamanho de thali ou phulka fino" },
      { label: "1 roti médio", grams: 60, note: "o tamanho mais frequente em nossos registros" },
      { label: "1 roti grande de frigideira", grams: 90, note: "grosso ou de frigideira grande" },
      { label: "2 rotis médios", grams: 120 },
    ],
    observedRange:
      "Em refeições reais registradas no LogMyPlate, um único roti variou entre 40 g e 180 g.",
    portionHonesty: [
      "Poderíamos dar um único número e chamá-lo de 'um roti', como faz a maioria das páginas na internet. Mas uma variação de quatro vezes no peso significa uma variação de quatro vezes nas calorias: cerca de 107 calorias no extremo menor e mais de 480 no maior.",
      "Essa variação não ocorre por dados imprecisos, mas pela realidade: um phulka fino de jantar leve e um roti tandoori grosso de restaurante são chamados igualmente de 'um roti'.",
      "Escolha a linha que melhor corresponda ao que você vê no seu prato. Na dúvida, a opção média é a mais representativa.",
    ],
    whatChangesIt: [
      {
        heading: "Ghee ou óleo pincelado por cima",
        body: "Uma colher de chá de ghee equivale a cerca de 5 g de gordura pura, adicionando quase 45 calorias. Em casa costuma-se usar menos; em restaurantes a quantidade é frequentemente maior.",
      },
      {
        heading: "A espessura mais do que o diâmetro",
        body: "Um roti de 15 cm aberto grosso pode pesar mais que um de 20 cm aberto bem fino. O peso acompanha a espessura muito mais de perto que o diâmetro, portanto julgar apenas pela largura costuma ser enganoso.",
      },
      {
        heading: "O tipo de farinha",
        body: "Estes valores correspondem à farinha de trigo integral (atta), de onde vem a fibra. Pães elaborados com farinhas brancas refinadas contêm consideravelmente menos fibras alimentares.",
      },
    ],
    macroContext: [
      "Os carboidratos são o componente majoritário, mas a fibra é o benefício que muitos ignoram: um roti médio fornece cerca de 5,8 g de fibras, uma parcela significativa da ingestão diária recomendada.",
      "O teor proteico é moderado. O roti acompanha, mas a proteína principal costuma vir do dal, leguminosas, queijo ou carnes da refeição.",
    ],
    comparison: {
      heading: "Roti versus arroz",
      intro:
        "Uma das dúvidas mais comuns ao registrar refeições é se vale mais a pena comer roti ou arroz. Veja o comparativo entre porções típicas de cada um.",
      items: [
        { slug: "roti", grams: 60, label: "1 roti médio" },
        { slug: "roti", grams: 120, label: "2 rotis médios" },
        { slug: "rice", grams: 180, label: "1 xícara de arroz cozido" },
      ],
      footnote:
        "Dois rotis médios e uma xícara de arroz cozido têm valor calórico muito semelhante. No entanto, os rotis fornecem significativamente mais fibras e proteínas. Nenhuma das opções é errada: os acompanhamentos influenciam muito mais que a base escolhida.",
    },
    faqs: [
      {
        question: "Quantas calorias têm 2 rotis?",
        answer:
          "Dois rotis médios (cerca de 120 g no total) fornecem aproximadamente 320 calorias, com 10,4 g de proteína e 11,6 g de fibra. Se forem pequenos (cerca de 40 g cada), dois rotis somam em torno de 214 calorias.",
      },
      {
        question: "O roti tem mais proteína que o arroz?",
        answer:
          "Sim, e em maior proporção por peso. Um roti de 60 g contém cerca de 5,2 g de proteína contra 5,0 g de uma xícara de 180 g de arroz cozido. O roti atinge essa quantidade com um terço do peso e entrega 5,8 g de fibra, comparado a 0,7 g no arroz branco.",
      },
      {
        question: "Por que cada site informa um valor diferente de calorias?",
        answer:
          "Porque respondem a perguntas diferentes. Muitos publicam dados por 100 gramas de tabelas genéricas e deixam você adivinhar o peso. No LogMyPlate exibimos porções práticas e faixas observadas em pratos reais.",
      },
    ],
    related: ["rice", "dal", "paneer", "idli"],
  },
  {
    slug: "dal",
    name: "Dal",
    tier: "indian",
    aka: ["dal amarelo", "tadka dal", "sopa de lentilha indiana"],
    title: "Calorias no Dal — Por concha ou xícara, não por 100 g",
    description:
      "Uma xícara (katori) de dal amarelo tradicional contém cerca de 150 calorias e 8 g de proteína vegetal. Compare porções e tipos de dal.",
    intro: [
      "O dal é a base de conforto e nutrição cotidiana, mas estimar suas calorias em casa ou em restaurantes gera muitas dúvidas.",
      "A densidade calórica varia conforme a consistência da sopa e, principalmente, a quantidade de gordura usada no tempero inicial (tadka) com óleo, ghee e especiarias aromáticas.",
      "Abaixo você encontra valores para porções reais consumidas em pratos caseiros e de restaurantes.",
    ],
    per100g: { calories: 95, protein: 5.2, carbs: 12.8, fat: 2.3, fiber: 3.2, sodium: 210 },
    portions: [
      { label: "1 xícara pequena (katori ralo)", grams: 120, note: "consistência mais líquida" },
      { label: "1 xícara média (padrão caseiro)", grams: 160, note: "porção individual comum" },
      { label: "1 xícara grande de restaurante", grams: 220, note: "mais encorpado com tadka generoso" },
      { label: "Dal Makhani enriquecido", grams: 180, note: "com manteiga e creme de leite adicionados" },
    ],
    observedRange:
      "Em refeições reais registradas, uma porção de dal variou entre 100 g e 250 g, com calorias de 90 a 280 kcal.",
    portionHonesty: [
      "O principal fator de variação no dal é a gordura do refogado. Duas colheres de sopa de ghee a mais na panela dobram as calorias sem alterar o volume visível da sopa.",
      "Dals caseiros costumam ser mais leves e nutritivos, enquanto versões de restaurantes utilizam mais gordura para acentuar o sabor.",
    ],
    whatChangesIt: [
      {
        heading: "A quantidade de óleo ou ghee no tempero (tadka)",
        body: "O refogado inicial com sementes e alho absorve óleo rapidamente. Controlar essa etapa na cozinha é o modo mais eficaz de manter o dal leve.",
      },
      {
        heading: "A densidade da água",
        body: "Um dal mais ralo tem menos calorias por concha devido ao maior teor de água, enquanto um dal espesso e reduzido concentra mais nutrientes e calorias.",
      },
      {
        heading: "Adição de laticínios",
        body: "Receitas cremosas como Dal Makhani levam manteiga e creme de leite, elevando significativamente o teor de gordura saturada.",
      },
    ],
    macroContext: [
      "O dal fornece proteínas vegetais ricas em lisina e uma quantidade notável de fibras solúveis, que ajudam no controle do colesterol e na saciedade.",
      "Ao ser combinado com arroz ou trigo (roti), forma uma composição proteica completa de aminoácidos essenciais.",
    ],
    comparison: {
      heading: "Dal versus outras fontes de proteína",
      intro: "Veja como o dal se compara a outras fontes proteicas comuns da alimentação.",
      items: [
        { slug: "dal", grams: 160, label: "1 xícara de dal amarelo" },
        { slug: "paneer", grams: 80, label: "Queijo paneer em cubos (80g)" },
        { slug: "roti", grams: 60, label: "1 roti médio" },
      ],
      footnote:
        "O dal oferece proteína vegetal combinada com fibras naturais e baixo teor de gordura saturada, ao contrário de queijos que concentram mais lipídios.",
    },
    faqs: [
      {
        question: "Quantas calorias tem uma concha de dal caseiro?",
        answer:
          "Uma concha média caseira tem entre 120 e 150 calorias, variando conforme a consistência e a quantidade de óleo no refogado.",
      },
      {
        question: "O dal é uma proteína completa?",
        answer:
          "As lentilhas têm alto teor de lisina e moderado de metionina. Consumidas com cereais (arroz ou roti), fornecem todos os aminoácidos necessários.",
      },
    ],
    related: ["roti", "rice", "paneer"],
  },
  {
    slug: "rice",
    name: "Arroz",
    tier: "indian",
    aka: ["arroz branco", "arroz basmati", "arroz cozido"],
    title: "Calorias no Arroz Cozido — Por xícara e prato real",
    description:
      "Uma xícara média de arroz cozido contém aproximadamente 170 calorias e 37 g de carboidratos. Veja medições em porções práticas do dia a dia.",
    intro: [
      "Pesar o arroz cru antes do preparo não ajuda quando o prato já está servido à mesa.",
      "Durante o cozimento, o arroz absorve água e triplica de peso. Portanto, 100 g de grão cru é muito diferente de 100 g de arroz cozido no prato. Nossas tabelas utilizam arroz pronto para consumo.",
      "Abaixo estão os valores nutricionais de porções reais servidas em refeições caseiras e comerciais.",
    ],
    per100g: { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, sodium: 1 },
    portions: [
      { label: "1 xícara pequena / katori raso", grams: 100, note: "cerca de 3 a 4 colheres de sopa cheias" },
      { label: "1 xícara média (porção individual)", grams: 130, note: "porção padrão balanceada" },
      { label: "1 prato raso (refeição principal)", grams: 200, note: "porção generosa de refeição" },
      { label: "Prato farto / Biryani / Pulao", grams: 280, note: "com óleo e especiarias de restaurante" },
    ],
    observedRange:
      "Em registros reais de usuários, as porções de arroz variaram de 80 g a 320 g por refeição.",
    portionHonesty: [
      "É muito fácil subestimar a quantidade de arroz quando servido livremente com colher grande. Usar uma xícara ou katori como referência visual evita exageros sem complicação.",
      "O arroz cozido simples em água não contém gordura adicionada. Pratos como arroz frito, biryani ou risotos têm calorias superiores pelo uso de óleo ou manteiga.",
    ],
    whatChangesIt: [
      {
        heading: "Óleo ou manteiga no refogado",
        body: "Refogar o arroz com azeite ou manteiga antes de cozinhar acrescenta calorias de gordura ao grão final.",
      },
      {
        heading: "Arroz branco versus integral",
        body: "As calorias de ambos são praticamente idênticas por 100 g cozido. O arroz integral mantém a casca, garantindo mais fibras e minerais que prolongam a saciedade.",
      },
    ],
    macroContext: [
      "O arroz é uma excelente fonte de carboidratos de fácil digestão, ideal para fornecer energia rápida para atividades diárias e treinos.",
      "Contém teor muito baixo de gorduras e sódio natural quando cozido sem excesso de sal.",
    ],
    comparison: {
      heading: "Arroz versus roti e pães planos",
      intro: "Compare o arroz cozido com outras bases de carboidrato do cotidiano.",
      items: [
        { slug: "rice", grams: 130, label: "1 xícara de arroz (130g)" },
        { slug: "roti", grams: 60, label: "1 roti médio (60g)" },
        { slug: "paratha", grams: 80, label: "1 paratha simples (80g)" },
      ],
      footnote:
        "O arroz e o roti possuem densidade energética semelhante por porção servida, mas o roti entrega mais fibras por ser integral.",
    },
    faqs: [
      {
        question: "Quantas calorias têm 4 colheres de sopa de arroz?",
        answer:
          "Quatro colheres de sopa cheias de arroz cozido pesam cerca de 100 g e totalizam aproximadamente 130 calorias.",
      },
      {
        question: "O arroz branco engorda mais que a batata ou mandioca?",
        answer:
          "Não necessariamente. O ganho de peso depende do total calórico consumido no dia. O arroz é um alimento neutro e saudável quando consumido em porções controladas.",
      },
    ],
    related: ["roti", "dal", "paratha"],
  },
  {
    slug: "paneer",
    name: "Paneer",
    tier: "indian",
    aka: ["queijo paneer", "queijo cottage indiano", "queijo fresco"],
    title: "Calorias no Queijo Paneer — Por cubo e porção de prato",
    description:
      "100 g de queijo paneer tradicional fornecem cerca de 290 calorias, 18 g de proteína e 22 g de gordura. Descubra os valores por porção real.",
    intro: [
      "O paneer é a principal fonte proteica vegetariana na culinária indiana, apreciado por sua textura suave e capacidade de absorver temperos.",
      "Por ser preparado a partir do leite integral fresco coalhado e prensado, combina alto teor de proteínas com uma quantidade relevante de gordura láctea.",
      "Em pratos com molhos ricos, é importante separar as calorias dos cubos de queijo das calorias do molho.",
    ],
    per100g: { calories: 290, protein: 18.3, carbs: 3.6, fat: 22.5, fiber: 0, sodium: 18 },
    portions: [
      { label: "1 cubo individual pequeno", grams: 20, note: "corte comum em pratos mistos de legumes" },
      { label: "Porção de 4 cubos médios", grams: 80, note: "quantidade típica em ensopados individuais" },
      { label: "Porção padrão de 100g", grams: 100, note: "medida de referência para receitas" },
      { label: "Prato com curry encorpado", grams: 200, note: "inclui cubos e molho com creme ou castanhas" },
    ],
    observedRange:
      "Em registros de refeições, porções de paneer variaram de 40 g a 160 g de queijo por prato.",
    portionHonesty: [
      "O paneer é denso e nutritivo. Embora seja uma excelente fonte de proteína, comer 150 g de paneer frito em um molho cremoso pode ultrapassar facilmente 500 calorias.",
      "Grelhar os cubos em vez de fritá-los no óleo reduz significativamente as calorias da refeição.",
    ],
    whatChangesIt: [
      {
        heading: "Tipo de leite utilizado",
        body: "O paneer caseiro feito com leite desnatado ou semidesnatado corta pela metade o teor de gorduras sem reduzir a quantidade de proteínas.",
      },
      {
        heading: "Fritura dos cubos",
        body: "Fritar os cubos de queijo em ghee ou óleo antes de juntar ao molho aumenta a absorção calórica em até 30%.",
      },
    ],
    macroContext: [
      "Oferece proteínas completas de digestão lenta (caseína) e excelente aporte de cálcio e fósforo para ossos e músculos.",
      "Por ter baixo teor de carboidratos, encaixa-se muito bem em dietas de baixo carboidrato ou cetogênicas.",
    ],
    comparison: {
      heading: "Paneer versus outras opções de proteína",
      intro: "Veja o perfil do queijo paneer comparado ao dal e outros alimentos proteicos.",
      items: [
        { slug: "paneer", grams: 80, label: "Queijo paneer em cubos (80g)" },
        { slug: "dal", grams: 160, label: "1 xícara de dal amarelo (160g)" },
        { slug: "idli", grams: 80, label: "2 idlis no vapor (80g)" },
      ],
      footnote:
        "O paneer entrega mais proteínas por porção que as leguminosas, porém traz maior carga de gordura natural do leite integral.",
    },
    faqs: [
      {
        question: "O queijo paneer é bom para ganho de massa muscular?",
        answer:
          "Sim, sua proteína de alto valor biológico auxilia na síntese e recuperação muscular pós-treino.",
      },
      {
        question: "O paneer contém lactose?",
        answer:
          "A prensagem do paneer drena a maior parte do soro do leite, fazendo com que seu teor de lactose seja consideravelmente menor que o do leite comum.",
      },
    ],
    related: ["dal", "roti", "idli"],
  },
  {
    slug: "idli",
    name: "Idli",
    tier: "indian",
    aka: ["idly", "bolinho de arroz no vapor indiano"],
    title: "Calorias no Idli — Por unidade, leve e cozido no vapor",
    description:
      "Um idli médio tradicional tem cerca de 58 calorias e quase zero gordura. Valores nutricionais detalhados por unidade e com acompanhamentos.",
    intro: [
      "O idli é amplamente considerado uma das opções mais saudáveis e leves de café da manhã por ser preparado exclusivamente no vapor.",
      "A massa tradicional combina arroz e leguminosa urad dal fermentados naturalmente, o que favorece a digestibilidade e absorção de nutrientes.",
      "Veja a composição nutricional por unidade e o impacto dos acompanhamentos.",
    ],
    per100g: { calories: 145, protein: 4.8, carbs: 30.2, fat: 0.5, fiber: 1.5, sodium: 120 },
    portions: [
      { label: "1 idli pequeno (mini)", grams: 25, note: "tamanho pequeno de degustação" },
      { label: "1 idli médio (tamanho caseiro comum)", grams: 40, note: "o formato clássico de forminha" },
      { label: "2 idlis médios (café da manhã padrão)", grams: 80, note: "a porção matinal mais habitual" },
      { label: "2 idlis com sambar e chutney", grams: 200, note: "refeição completa servida com caldos" },
    ],
    observedRange:
      "Nos registros do app, um café da manhã típico varia de 2 a 4 idlis por pessoa.",
    portionHonesty: [
      "O idli isolado é extremamente magro e saudável. O ponto de atenção costuma ser o chutney de coco tradicional, que tem alto teor de gordura.",
      "Acompanhar com sambar (caldo de lentilhas e legumes) é a melhor escolha para somar fibras e proteínas sem elevar calorias.",
    ],
    whatChangesIt: [
      {
        heading: "Proporção de arroz e lentilha na massa",
        body: "Receitas caseiras que utilizam maior proporção de feijão urad aumentam a proteína e as fibras do idli.",
      },
      {
        heading: "Acompanhamentos servidos",
        body: "Chutneys cremosos de coco ou amendoim podem dobrar as calorias totais do prato em poucas colheres.",
      },
    ],
    macroContext: [
      "Praticamente livre de gordura saturada, o idli fornece carboidratos fermentados que são gentis com o sistema gastrointestinal.",
      "A fermentação natural estimula a produção de vitaminas do complexo B.",
    ],
    comparison: {
      heading: "Idli versus outros itens de café da manhã",
      intro: "Veja como o idli se compara em calorias com outras opções matinais.",
      items: [
        { slug: "idli", grams: 80, label: "2 idlis médios (80g)" },
        { slug: "roti", grams: 60, label: "1 roti médio (60g)" },
        { slug: "paratha", grams: 80, label: "1 paratha simples (80g)" },
      ],
      footnote:
        "Dois idlis têm menos calorias que um roti e menos da metade das calorias de uma paratha frita na frigideira.",
    },
    faqs: [
      {
        question: "Quantas calorias têm 2 idlis com sambar?",
        answer:
          "Dois idlis médios acompanhados por uma concha generosa de sambar somam aproximadamente 180 a 220 calorias.",
      },
      {
        question: "O idli é bom para quem quer emagrecer?",
        answer:
          "Sim! Por ser cozido no vapor e ter baixo teor de gordura, sacia com poucas calorias.",
      },
    ],
    related: ["roti", "dal", "rice"],
  },
  {
    slug: "paratha",
    name: "Paratha",
    tier: "indian",
    aka: ["parauhta", "pão achatado na frigideira", "aloo paratha"],
    title: "Calorias na Paratha — Simples e Recheada por unidade",
    description:
      "Uma paratha simples média tem cerca de 290 calorias; versões recheadas de batata (Aloo) variam de 300 a 380 calorias. Saiba como calcular porções.",
    intro: [
      "A paratha é um pão laminado crocante passado na frigideira com ghee ou óleo, muito apreciado em cafés da manhã reforçados.",
      "Diferente do roti assado a seco, a paratha incorpora gordura entre suas dobras e no acabamento dourado da frigideira.",
      "Veja a diferença calórica entre as versões simples e as famosas variações recheadas.",
    ],
    per100g: { calories: 360, protein: 7.8, carbs: 52.4, fat: 13.8, fiber: 5.6, sodium: 340 },
    portions: [
      { label: "1 paratha simples caseira média", grams: 80, note: "massa laminada com toque de ghee" },
      { label: "1 Aloo Paratha (recheio de batata)", grams: 120, note: "recheada com batata temperada" },
      { label: "1 Paneer Paratha (recheio de queijo)", grams: 130, note: "recheada com queijo paneer temperado" },
      { label: "Paratha de restaurante com manteiga", grams: 150, note: "camadas fartas de gordura e manteiga derretida" },
    ],
    observedRange:
      "Em pratos reais, uma paratha pode variar de 70 g (caseira simples) a mais de 180 g em restaurantes típicos.",
    portionHonesty: [
      "Uma única paratha recheada e pincelada com manteiga pode equivaler em calorias a dois ou três rotis simples.",
      "Preparar em frigideira antiaderente com spray de azeite economiza até 100 calorias por unidade sem prejudicar o sabor.",
    ],
    whatChangesIt: [
      {
        heading: "Tipo de recheio",
        body: "Recheios de batata (Aloo) somam carboidratos; recheios de queijo paneer somam proteínas e gorduras; recheios de couve-flor (Gobi) são os mais leves.",
      },
      {
        heading: "Gordura na frigideira e no topo",
        body: "Colocar um pedaço de manteiga derretendo em cima da paratha quente adiciona cerca de 70 a 100 calorias extras instantaneamente.",
      },
    ],
    macroContext: [
      "A paratha combina carboidratos densos com gordura, gerando uma digestão mais demorada e bastante energia para a manhã.",
      "Acompanhar com iogurte desnatado equilibra o índice glicêmico e adiciona proteínas de qualidade à refeição.",
    ],
    comparison: {
      heading: "Paratha versus roti simples",
      intro: "Compare a paratha com o roti integral assado a seco.",
      items: [
        { slug: "paratha", grams: 80, label: "1 paratha simples (80g)" },
        { slug: "roti", grams: 60, label: "1 roti médio (60g)" },
        { slug: "idli", grams: 80, label: "2 idlis médios (80g)" },
      ],
      footnote:
        "Uma paratha média simples tem quase o dobro das calorias de um roti do mesmo diâmetro devido ao óleo incorporado na massa.",
    },
    faqs: [
      {
        question: "Quantas calorias tem uma Aloo Paratha com manteiga?",
        answer:
          "Uma Aloo Paratha média caseira tem cerca de 340 calorias. Com uma colher de manteiga por cima, atinge aproximadamente 415 a 440 calorias.",
      },
      {
        question: "Posso comer paratha na dieta de emagrecimento?",
        answer:
          "Sim, desde que caiba no seu planejamento calórico diário. Prepará-la com pouco óleo e acompanhar com saladas e iogurte natural é uma ótima estratégia.",
      },
    ],
    related: ["roti", "rice", "paneer"],
  },
];

export function getPtBrFood(slug: string): FoodPage | undefined {
  return ptBrFoods.find((f) => f.slug === slug);
}
