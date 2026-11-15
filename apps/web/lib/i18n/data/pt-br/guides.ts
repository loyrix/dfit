import type { Guide } from "@/app/(en)/guides/content";

export const ptBrGuides: Guide[] = [
  {
    slug: "ai-calorie-tracker-india",
    title: "Como funcionam os contadores de calorias com IA para refeições complexas",
    description:
      "Por que o registro nutricional por fotos com inteligência artificial é muito mais prático para pratos combinados e comida caseira do que leitores de código de barras.",
    summary:
      "Aplicativos focados em códigos de barras têm imensa dificuldade com pratos feitos, ensopados, arroz com feijão e comida caseira. Veja como o reconhecimento visual por IA resolve isso.",
    category: "Contador com IA",
    readTime: "5 min de leitura",
    accent: "#efbd44",
    keywords: [
      "contador de calorias com IA",
      "contar calorias por foto",
      "diario alimentar inteligente",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Por que refeições caseiras são difíceis de registrar manualmente",
        paragraphs: [
          "A grande maioria dos aplicativos de calorias foi concebida para alimentos ultraprocessados, lanches industriais ou itens com códigos de barras pré-cadastrados. No entanto, a culinária do dia a dia é bem diferente: um prato feito caseiro com arroz, feijão, proteína e legumes varia muito conforme a quantidade de óleo, o corte da carne e a generosidade da porção.",
          "Essa discrepância faz com que muitas pessoas abandonem o registro: digitar ingrediente por ingrediente em uma lista interminável consome tempo precioso e quase nunca reflete a realidade do que está servido no prato.",
        ],
      },
      {
        heading: "O que muda com a análise visual por inteligência artificial",
        paragraphs: [
          "O LogMyPlate parte da foto real do seu prato. A inteligência artificial detecta os alimentos visíveis, combina a informação com uma breve nota de contexto opcional e calcula a estimativa de calorias, proteínas, carboidratos e gorduras para sua conferência imediata.",
          "Não se trata de uma análise laboratorial de biópsia alimentar, mas de uma estimativa razoável e prática. O grande benefício está na consistência: você consegue registrar em menos de 10 segundos, corrigir eventuais detalhes e manter o acompanhamento por meses sem desistir.",
        ],
      },
      {
        heading: "Pontos que você sempre deve revisar",
        paragraphs: [
          "Ingredientes não visíveis a olho nu são a principal causa de variação: azeites de finalização, manteiga derretida, açúcar no molho ou temperos cremosos. Uma nota simples como 'pouco azeite' ou 'molho agridoce' orienta o modelo de visão, mas a palavra final é sempre sua.",
          "Para condições médicas especiais, gestação, diabetes ou distúrbios alimentares, as estimativas por IA têm caráter estritamente educativo e não substituem o acompanhamento de um médico ou nutricionista registrado.",
        ],
      },
    ],
    faqs: [
      {
        question: "Um contador de calorias com IA pode ser 100% exato?",
        answer:
          "Não. O monitoramento por foto trabalha com estimativas inteligentes baseadas em visão volumétrica e bancos de dados nutricionais. Ele é excelente para criar consciência e consistência, mas não substitui dosagens de laboratório.",
      },
      {
        question: "O LogMyPlate só funciona para pratos ocidentais?",
        answer:
          "Não. A IA foi treinada com enorme variedade de pratos globais, desde culinária brasileira tradicional (arroz, feijão, farofa, mandioca) até receitas orientais, mediterrâneas e opções de delivery.",
      },
    ],
  },
  {
    slug: "indian-food-calorie-tracker",
    title: "Como contar calorias em pratos combinados e receitas tradicionais",
    description:
      "Guia prático para registrar calorias em comida caseira, marmitas e pratos combinados através de fotos e ajuste rápido de porções.",
    summary:
      "Aprenda a registrar leguminosas, arrozes, massas, carnes de panela e saladas mistas sem a necessidade de pesar cada alimento separadamente.",
    category: "Culinária Tradicional",
    readTime: "6 min de leitura",
    accent: "#70caa3",
    keywords: [
      "contador de calorias comida caseira",
      "contar calorias prato feito",
      "diario nutricional por foto",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Comece a partir do prato pronto, não de tabelas frias",
        paragraphs: [
          "O método mais sustentável para manter a rotina nutricional é registrar o prato exatamente como foi servido. Em vez de tentar calcular a proporção exata de óleo na panela da família, tire uma foto nítida e deixe a IA identificar os elementos visíveis.",
          "Essa abordagem se destaca em pratos combinados — como o clássico prato feito (PF) ou marmitas fitness —, onde vários itens compartilham o mesmo espaço e registrar um a um seria tedioso.",
        ],
      },
      {
        heading: "Use notas breves para pratos de aparência similar",
        paragraphs: [
          "Preparações com molho avermelhado ou ensopados podem ter composições muito diferentes por baixo da superfície. Uma anotação rápida de duas palavras como 'peito de frango' ou 'carne moída com legumes' orienta perfeitamente o sistema sem exigir esforço.",
          "A anotação serve para orientar o contexto da foto, e não para substituir a imagem. O sistema verifica a consistência entre o texto e a cena real antes de gerar o cálculo.",
        ],
      },
      {
        heading: "Ajuste porções visualmente antes de confirmar",
        paragraphs: [
          "Na rotina diária servimos refeições com conchas, colheres de servir, xícaras ou pedaços, e quase nunca com gramas na balança. O LogMyPlate traduz os volumes visuais em valores de porção que você pode alterar facilmente se serviu uma quantidade maior ou menor.",
          "O hábito frequente e aproximado supera o perfeccionismo que paralisa: ter um registro diário com 90% de precisão durante meses traz resultados infinitamente melhores do que uma pesagem exata feita uma única vez na semana.",
        ],
      },
    ],
    faqs: [
      {
        question: "Preciso pesar a comida na balança toda vez que for comer?",
        answer:
          "Pesar alimentos pode ser útil nos primeiros dias para calibrar sua noção de tamanho de porção, mas não é obrigatório no dia a dia. Uma boa foto com a IA do LogMyPlate é suficiente para manter o controle calórico.",
      },
      {
        question: "O app reconhece receitas caseiras de família?",
        answer:
          "Sim. O reconhecimento de pratos caseiros e refeições familiares é um dos pilares de desenvolvimento do LogMyPlate, desenhado para libertar você da dependência de códigos de barra.",
      },
    ],
  },
  {
    slug: "photo-food-journal",
    title: "Por que um diário alimentar por fotos é mais fácil de manter",
    description:
      "Descubra como registrar refeições por fotos reduz o estresse da contagem, fortalece a constância e ajuda a enxergar seus hábitos reais.",
    summary:
      "Um diário nutricional só gera resultados se você conseguir mantê-lo ativo. Registrar pratos por fotos transforma a contagem de calorias em uma ação leve de poucos segundos.",
    category: "Diário Alimentar",
    readTime: "4 min de leitura",
    accent: "#ff7e78",
    keywords: [
      "diario alimentar por foto",
      "diario de refeicoes visual",
      "habitos alimentares saudaveis",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "A maior barreira para a consistência é o tempo gasto",
        paragraphs: [
          "A maioria das tentativas de monitorar a alimentação fracassa por causa do atrito: desbloquear o telefone, buscar o ingrediente exato, adivinhar a marca certa e preencher gramas cansa qualquer pessoa após alguns dias de rotina corrida.",
          "O ato de tirar uma foto leva apenas dois segundos e não interrompe seu momento à mesa. Esse baixo esforço permite transformar o registro em um reflexo natural antes da primeira garfada.",
        ],
      },
      {
        heading: "Ver suas refeições ensina mais do que apenas ler números",
        paragraphs: [
          "Uma galeria visual das suas refeições revela padrões emocionais e comportamentais que planilhas de números não mostram: a falta de vegetais no almoço, a ausência de cores variadas ou os lanches açucarados repetidos no meio da tarde.",
          "Ao revisar sua semana em formato de imagens, você entende visualmente onde ocorreram os excessos e onde acertou no equilíbrio de nutrientes.",
        ],
      },
      {
        heading: "Como manter o hábito no longo prazo",
        paragraphs: [
          "Crie o hábito de fotografar antes de comer, mesmo que só vá conferir a estimativa e salvar o registro mais tarde. Fotografar primeiro garante o histórico visual da refeição.",
          "Não busque a perfeição absoluta. O objetivo do diário é fornecer clareza e autorregulação, permitindo que você tome decisões conscientes e informadas.",
        ],
      },
    ],
    faqs: [
      {
        question: "E se eu esquecer de tirar a foto antes de começar a comer?",
        answer:
          "Você pode tirar a foto do prato parcialmente consumido e adicionar uma nota breve, ou simplesmente descrever a refeição em texto no aplicativo para manter seu diário em dia.",
      },
      {
        question: "Minhas fotos de refeições ficam públicas?",
        answer:
          "Não. Todas as suas imagens são totalmente privadas e acessíveis apenas na sua própria conta. Não há feed público nem compartilhamento sem o seu consentimento expresso.",
      },
    ],
  },
  {
    slug: "calorie-tracker-without-barcodes",
    title: "Contador de calorias sem código de barras: a liberdade da comida real",
    description:
      "A maioria das refeições nutritivas não vem em embalagens com código de barras. Aprenda a monitorar pratos frescos e artesanais.",
    summary:
      "Frutas, legumes, saladas, carnes e pratos preparados em casa não têm código de barras. Descubra como a IA visual devolve a flexibilidade ao seu planejamento alimentar.",
    category: "Sem Código de Barras",
    readTime: "5 min de leitura",
    accent: "#5a98f7",
    keywords: [
      "contador de calorias sem codigo de barras",
      "rastrear comida de verdade",
      "comida sem rotulo nutricional",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "O paradoxo dos aplicativos de código de barras",
        paragraphs: [
          "Muitos aplicativos tradicionais foram construídos em torno da leitura de códigos de barras (UPC/EAN). Isso funciona muito bem para biscoitos recheados, refrigerantes e refeições congeladas, mas falha justamente quando você consome alimentos naturais e frescos.",
          "Uma maçã da feira, uma tigela de salada com folhas frescas ou um peito de frango grelhado feito na hora não possuem embalagens com código de barras, gerando atrito no aplicativo.",
        ],
      },
      {
        heading: "Estimativa baseada em inteligência artificial visual",
        paragraphs: [
          "Com o LogMyPlate, qualquer refeição pode ser registrada instantaneamente. O modelo de inteligência artificial reconhece os alimentos pelo aspecto visual, analisa texturas e proporções relativas e cruza os dados com tabelas nutricionais consolidadas.",
          "Dessa forma, você passa a ter suporte completo tanto para itens simples do dia a dia quanto para pratos elaborados de restaurantes e refeições caseiras com múltiplos ingredientes.",
        ],
      },
      {
        heading: "Praticidade para a alimentação equilibrada",
        paragraphs: [
          "Comer alimentos frescos, menos processados e com densidade de nutrientes é o melhor caminho para a saúde sustentável. Um aplicativo de calorias deve incentivar esse estilo de vida, e não dificultá-lo.",
          "Ao remover a dependência de embalagens industrializadas, o LogMyPlate devolve a você a liberdade de comer comida de verdade com total clareza nutricional.",
        ],
      },
    ],
    faqs: [
      {
        question: "O LogMyPlate ainda lê códigos de barras se eu precisar?",
        answer:
          "Nosso foco principal e especialidade é a visão computacional por foto para alimentos sem embalagem. Para produtos ultraprocessados, a foto do rótulo ou descrição textual funciona perfeitamente.",
      },
      {
        question: "Como a IA sabe se o prato tem azeite ou óleo?",
        answer:
          "O brilho e a consistência visual fornecem pistas importantes, mas você pode complementar com uma nota rápida (ex.: 'com 1 colher de azeite extra') para máxima precisão.",
      },
    ],
  },
  {
    slug: "meal-photo-tips",
    title: "Dicas para tirar fotos de refeições com máxima precisão na IA",
    description:
      "Ângulos, iluminação, organização do prato e notas breves que melhoram a precisão da estimativa de calorias do LogMyPlate.",
    summary:
      "Pequenos cuidados ao fotografar o prato ajudam os algoritmos de visão computacional a identificar cada alimento e acertar as porções.",
    category: "Dicas de Foto",
    readTime: "4 min de leitura",
    accent: "#b57bee",
    keywords: [
      "dicas de foto de comida",
      "melhorar precisao do contador de calorias",
      "como fotografar pratos",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "1. Prefira o ângulo em 45 graus ou tomada superior",
        paragraphs: [
          "Um ângulo em aproximadamente 45 graus permite que a IA enxergue tanto a superfície quanto a altura e profundidade dos alimentos no prato, facilitando o cálculo volumétrico das porções.",
          "Caso o prato seja muito plano (como uma pizza ou panquecas), a visão de cima (zenital) funciona muito bem. Para pratos fundos ou tigelas de sopa, certifique-se de que os ingredientes principais estejam visíveis na foto.",
        ],
      },
      {
        heading: "2. Boa iluminação evita alimentos escuros e sombras",
        paragraphs: [
          "Iluminação ambiente suficiente ajuda a distinguir alimentos com cores parecidas, como diferentes tipos de grãos, carnes e molhos escuros. Evite sombras fortes do próprio telefone sobre o centro do prato.",
          "Em ambientes com luz muito fraca, como restaurantes à noite, o flash do smartphone ou uma rápida nota explicativa ajudam bastante.",
        ],
      },
      {
        heading: "3. Uma nota rápida de duas palavras faz toda a diferença",
        paragraphs: [
          "Adicionar uma nota simples como 'leite desnatado', 'sem açúcar', 'carne de patinho' ou 'arroz integral' resolve qualquer dúvida sobre ingredientes internos que a câmera não consegue identificar.",
          "Você não precisa digitar uma redação: duas ou três palavras-chave são suficientes para guiar a inteligência artificial com precisão cirúrgica.",
        ],
      },
    ],
    faqs: [
      {
        question: "Preciso incluir talheres ou um objeto de referência de tamanho?",
        answer:
          "O próprio prato, garfo ou copo na cena já serve como referência visual de proporção para os algoritmos de visão espacial.",
      },
      {
        question: "E se a comida estiver dentro de uma embalagem escura de viagem?",
        answer:
          "Abra a tampa para mostrar o conteúdo ou adicione uma nota rápida no campo de texto descrevendo o pedido.",
      },
    ],
  },
  {
    slug: "ai-calorie-tracker-for-weight-loss",
    title: "Como usar um contador de calorias por IA para emagrecimento sustentável",
    description:
      "Déficit calórico sem obsessão: como aliar fotos, metas realistas e constância para perder peso com saúde.",
    summary:
      "Perder peso de forma duradoura depende de consistência diária e déficit calórico moderado. Descubra como a IA simplifica esse processo.",
    category: "Emagrecimento",
    readTime: "6 min de leitura",
    accent: "#efbd44",
    keywords: [
      "contador de calorias para emagrecer",
      "deficit calorico sustentavel",
      "perder peso com saude",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "O princípio fundamental: balanço calórico e consistência",
        paragraphs: [
          "Para perder gordura corporal, o corpo precisa gastar ligeiramente mais calorias do que consome (déficit calórico moderado). Não existem atalhos mágicos ou alimentos que queimam gordura sozinhos.",
          "O grande desafio das pessoas não é a falta de conhecimento sobre o déficit calórico, mas sim a dificuldade de manter a rotina de controle por semanas seguidas sem desistir por cansaço mental.",
        ],
      },
      {
        heading: "Por que metas extremas de calorias não funcionam",
        paragraphs: [
          "Reduzir as calorias de forma drástica quase sempre leva a compulsões alimentares, perda de massa magra, lentidão metabólica e abandono precoce do plano.",
          "Um déficit diário confortável de 300 a 500 kcal permite emagrecer em ritmo saudável e seguro, sem passar fome e mantendo a disposição para treinar e trabalhar.",
        ],
      },
      {
        heading: "Como a fotografia acelera seus resultados",
        paragraphs: [
          "Tirar fotos cria um momento de pausa e reflexão antes de comer: você olha para o prato e percebe naturalmente se faltam vegetais ou se as porções estão excessivas.",
          "Além disso, a rapidez do LogMyPlate elimina o sentimento de obrigação pesada, transformando o registro em um hábito leve e automático no seu dia a dia.",
        ],
      },
    ],
    faqs: [
      {
        question: "Qual deve ser meu déficit calórico diário?",
        answer:
          "Para a maioria dos adultos saudáveis, um déficit entre 300 e 500 calorias abaixo da taxa de manutenção diária promove perda de peso gradual e sustentável.",
      },
      {
        question: "O aplicativo calcula minhas metas diárias automaticamente?",
        answer:
          "Sim. Você informa seus dados de idade, peso, altura, nível de atividade física e objetivo, e o LogMyPlate sugere uma meta calórica e de macronutrientes balanceada.",
      },
    ],
  },
  {
    slug: "calorie-tracking-for-home-cooked-food",
    title: "Como registrar comida caseira sem pesar cada ingrediente",
    description:
      "Pare de perder tempo pesando alho, cebola e azeite separadamente. Dicas práticas para monitorar a cozinha de casa com fotos.",
    summary:
      "Cozinhar em casa é o melhor hábito para a saúde, mas registrar receitas familiares costuma ser exaustivo. Veja como a IA resolve isso em segundos.",
    category: "Comida Caseira",
    readTime: "5 min de leitura",
    accent: "#70caa3",
    keywords: [
      "contar calorias comida caseira",
      "rastrear alimentacao em casa",
      "diario alimentar pratico",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "O cansaço da pesagem ingrediente por ingrediente",
        paragraphs: [
          "Tentar criar receitas complexas dentro de aplicativos convencionais para cada almoço de família é uma das maiores causas de frustração. Ninguém quer pesar colheres de sal, alho picado ou o azeite do refogado enquanto cozinha para todos.",
          "O resultado frequente é o abandono do registro nos fins de semana e nas refeições caseiras, justamente onde se concentra a maior parte da alimentação semanal.",
        ],
      },
      {
        heading: "A foto do prato servido é o atalho inteligente",
        paragraphs: [
          "Ao registrar o prato pronto, a inteligência artificial analisa a combinação de alimentos finais, calcula as proporções relativas e oferece uma estimativa baseada em milhares de preparos reais semelhantes.",
          "Você economiza minutos preciosos a cada refeição e mantém seu diário impecavelmente atualizado sem estresse na cozinha.",
        ],
      },
      {
        heading: "Foque nos alimentos que realmente movem o ponteiro",
        paragraphs: [
          "Azeite, queijos, carnes gordas, massas e sobremesas são os alimentos que mais impactam as calorias totais. Já temperos naturais, folhas e legumes crus têm impacto calórico irrelevante.",
          "Direcione sua atenção para moderar a quantidade de gorduras de preparo e deixe a IA cuidar do cálculo do restante com precisão prática.",
        ],
      },
    ],
    faqs: [
      {
        question: "E se a receita de casa usar menos óleo que a média dos restaurantes?",
        answer:
          "Adicione uma observação como 'pouco azeite' ou 'preparado sem gordura' para que a IA calibre a estimativa para o padrão caseiro.",
      },
      {
        question: "Posso ajustar os macronutrientes sugeridos pela IA?",
        answer:
          "Sim! Todas as estimativas de calorias, proteínas, carboidratos e gorduras podem ser editadas diretamente antes de salvar a refeição.",
      },
    ],
  },
  {
    slug: "macro-tracking-with-food-photos",
    title: "Como monitorar proteínas, carboidratos e gorduras a partir de fotos",
    description:
      "Equilíbrio de macronutrientes: como a IA visual decompõe seu prato e ajuda a bater suas metas de proteínas e fibras diárias.",
    summary:
      "Apenas contar calorias não conta a história toda. Entenda como o equilíbrio entre proteínas, carboidratos e gorduras transforma sua saciedade e composição corporal.",
    category: "Macronutrientes",
    readTime: "6 min de leitura",
    accent: "#ff7e78",
    keywords: [
      "contador de macros por foto",
      "bater meta de proteinas",
      "macronutrientes simplificados",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Por que os macronutrientes importam tanto quanto as calorias",
        paragraphs: [
          "Duas refeições de 600 calorias produzem efeitos completamente diferentes no corpo se uma for rica em proteínas e fibras e a outra composta puramente por carboidratos simples e gordura.",
          "A proteína preserva a massa muscular e estimula a saciedade duradoura, as gorduras regulam a produção hormonal e os carboidratos fornecem energia para suas atividades diárias e treinos.",
        ],
      },
      {
        heading: "Como o LogMyPlate decompõe os macros na imagem",
        paragraphs: [
          "Ao escanear a foto, a IA calcula não apenas o valor energético total em kcal, mas também os gramas correspondentes de proteínas, carboidratos, gorduras totais e fibras alimentares.",
          "Um gráfico simples de equilíbrio mostra instantaneamente se o prato está alinhado com suas metas diárias configuradas no seu perfil.",
        ],
      },
      {
        heading: "Dicas práticas para bater a meta diária de proteínas",
        paragraphs: [
          "Garanta uma fonte sólida de proteínas em cada refeição principal: ovos, frango, carne magra, peixe, tofu ou queijos magros.",
          "Adicione leguminosas como feijão, grão-de-bico ou lentilha para reforçar o teor de proteínas vegetais e fibras digestivas ao mesmo tempo.",
        ],
      },
    ],
    faqs: [
      {
        question: "Quanta proteína devo consumir por dia?",
        answer:
          "Para pessoas ativas e praticantes de exercícios, recomenda-se geralmente entre 1,6g e 2,2g de proteína por quilo de peso corporal por dia.",
      },
      {
        question: "O aplicativo monitora fibras alimentares?",
        answer:
          "Sim, o LogMyPlate detalha o teor de fibras alimentares para que você mantenha sua saúde intestinal e saciedade em dia.",
      },
    ],
  },
  {
    slug: "calorie-estimate-vs-nutrition-label",
    title: "Estimativa por IA versus tabela nutricional: o que você precisa saber",
    description:
      "Entenda por que mesmo as tabelas nutricionais oficiais têm margem de tolerância e como usar as estimativas por IA com inteligência.",
    summary:
      "Nenhuma medição nutricional no mundo real é 100% matemática. Saiba como a consistência de estimativas inteligentes gera grandes resultados.",
    category: "Ciência Nutricional",
    readTime: "5 min de leitura",
    accent: "#5a98f7",
    keywords: [
      "precisao de calorias por IA",
      "rotulo nutricional vs realidade",
      "como usar estimativa de calorias",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "O mito da precisão milimétrica nos rótulos de alimentos",
        paragraphs: [
          "Muitas pessoas acreditam que as tabelas nutricionais das embalagens são exatas ao miligrama. Na realidade, órgãos reguladores de saúde (como a Anvisa e a FDA) permitem variações de até 20% nos rótulos devido a variações naturais de colheita e processamento.",
          "Isso significa que a busca por uma exatidão matemática absoluta na cozinha é uma ilusão que gera ansiedade desnecessária.",
        ],
      },
      {
        heading: "Estimativas consistentes geram resultados reais",
        paragraphs: [
          "O corpo humano não é uma máquina de laboratório isolada: a absorção de nutrientes varia diariamente conforme o sono, hidratação, digestão e microbiota intestinal.",
          "O valor de um contador por IA como o LogMyPlate não está em acertar a décima casa decimal, mas em manter você dentro de uma faixa calórica realista e consistente todos os dias.",
        ],
      },
      {
        heading: "Use o aplicativo como uma bússola, não como uma prisão",
        paragraphs: [
          "Monitore suas tendências médias ao longo de semanas. Se seu peso estiver evoluindo na direção desejada com boa energia e saciedade, seu plano está funcionando perfeitamente.",
        ],
      },
    ],
    faqs: [
      {
        question: "Qual a margem de erro típica da estimativa visual por IA?",
        answer:
          "Em fotos bem iluminadas com pratos visíveis, a estimativa fica tipicamente entre 10% e 15% de margem em relação a medições pesadas, similar à variação de rótulos comerciais.",
      },
      {
        question: "O app é adequado para quem tem diabetes tipo 1 e calcula insulina?",
        answer:
          "Para pessoas com diabetes tipo 1 que dependem de contagem rígida de carboidratos para dosagem de insulina, consulte sempre sua equipe médica e utilize pesagem manual específica.",
      },
    ],
  },
  {
    slug: "best-calorie-tracker-for-indian-food",
    title: "O melhor aplicativo para registrar pratos tradicionais e culinárias globais",
    description:
      "Critérios essenciais para escolher um app de calorias que compreenda receitas regionais, temperos variados e comida de verdade.",
    summary:
      "Cansado de tentar registrar marmitas e pratos caseiros em aplicativos que só conhecem comidas prontas estrangeiras? Descubra o que procurar.",
    category: "Comparativo",
    readTime: "5 min de leitura",
    accent: "#b57bee",
    keywords: [
      "melhor aplicativo contador de calorias",
      "app de calorias para comida brasileira",
      "contador de calorias inteligente",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Por que aplicativos genéricos decepcionam na culinária regional",
        paragraphs: [
          "Muitos aplicativos famosos de dieta foram criados exclusivamente para o mercado norte-americano. Eles funcionam muito bem para marcas de supermercados estrangeiros, mas entram em colapso diante de uma feijoada leve, um prato feito caseiro ou moqueca.",
          "O usuário se vê obrigado a escolher entre não registrar ou cadastrar manualmente ingredientes individuais toda vez que senta para comer.",
        ],
      },
      {
        heading: "A vantagem do reconhecimento visual por imagem",
        paragraphs: [
          "O LogMyPlate foi desenhado especificamente para entender pratos preparados e combinações tradicionais de ingredientes. Ele reconhece a interação entre grãos, molhos, vegetais e proteínas em uma única foto.",
          "Isso elimina as pesquisas cansativas e oferece uma experiência fluida para qualquer cultura alimentar ao redor do mundo.",
        ],
      },
      {
        heading: "Critérios indispensáveis para sua escolha",
        paragraphs: [
          "Procure rapidez no registro, ausência de anúncios intrusivos, respeito à sua privacidade de dados e interface agradável que você tenha vontade de abrir todos os dias.",
        ],
      },
    ],
    faqs: [
      {
        question: "O LogMyPlate tem versão em português?",
        answer:
          "Sim! O aplicativo e todo o conteúdo do site estão totalmente traduzidos e adaptados para o público brasileiro.",
      },
      {
        question: "Preciso pagar para usar os recursos básicos?",
        answer:
          "Não. O aplicativo conta com registros gratuitos com a opção de anúncios premiados e oferece teste gratuito da versão Premium.",
      },
    ],
  },
  {
    slug: "how-to-track-misal-pav-calories",
    title: "Como registrar calorias em pratos típicos com molhos e acompanhamentos",
    description:
      "Aprenda a estimar refeições com caldos, queijos, pães e acompanhamentos crocantes sem complicar sua rotina.",
    summary:
      "Pratos com várias guarnições e molhos podem parecer um pesadelo para contar calorias. Veja como a IA agrupa esses elementos com facilidade.",
    category: "Pratos Tradicionais",
    readTime: "4 min de leitura",
    accent: "#efbd44",
    keywords: [
      "calorias pratos com molho",
      "como contar calorias de lanches",
      "estimativa de refeicoes completas",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "O desafio dos pratos compostos por múltiplos elementos",
        paragraphs: [
          "Pratos tradicionais frequentemente reúnem um caldo ou molho principal, uma porção de carboidrato (como pães ou arroz) e complementos crocantes ou queijos salpicados.",
          "Tentar calcular o caldo, o azeite e os acompanhamentos de forma separada gera confusão e toma tempo demais.",
        ],
      },
      {
        heading: "Como a fotografia captura o conjunto da refeição",
        paragraphs: [
          "Com o LogMyPlate, uma única foto do conjunto servido permite identificar o prato e suas guarnições associadas.",
          "Se você pediu pães extras ou dispensou acompanhamentos gordurosos, basta um toque para editar as quantidades sugeridas antes de confirmar.",
        ],
      },
      {
        heading: "Estratégias para saborear pratos típicos na dieta",
        paragraphs: [
          "Você não precisa abrir mão dos seus pratos favoritos para manter a saúde. Controlar o tamanho da porção e dos acompanhamentos ricos em gordura permite incluir refeições prazerosas na sua rotina sem culpa.",
        ],
      },
    ],
    faqs: [
      {
        question: "Como o app lida com molhos muito picantes ou temperados?",
        answer:
          "As especiarias e pimentas naturais quase não contêm calorias. A IA foca na base de gordura, caldo e sólidos presentes no prato.",
      },
      {
        question: "Posso adicionar uma foto de lanches ou petiscos?",
        answer:
          "Com certeza! O reconhecimento visual funciona para lanches, porções, petiscos e refeições completas.",
      },
    ],
  },
  {
    slug: "daily-calorie-target-bmi-guide",
    title: "Como calcular sua meta diária de calorias de forma realista",
    description:
      "Taxa metabólica basal, nível de atividade física e como ajustar suas calorias diárias de acordo com seu objetivo de peso.",
    summary:
      "Descubra como encontrar seu ponto de equilíbrio energético sem depender de fórmulas misteriosas ou dietas da moda.",
    category: "Metas Nutricionais",
    readTime: "7 min de leitura",
    accent: "#70caa3",
    keywords: [
      "meta diaria de calorias",
      "calcular taxa metabolica basal",
      "como calcular calorias para secar",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "O que é Taxa Metabólica Basal (TMB) e Gasto Calórico Total",
        paragraphs: [
          "Sua Taxa Metabólica Basal é a quantidade mínima de energia que seu corpo gasta apenas para manter funções vitais em repouso (coração, respiração, cérebro).",
          "Ao somar o efeito térmico dos alimentos e o gasto com suas atividades físicas e movimentos diários, chegamos ao seu Gasto Energético Diário Total (TDEE).",
        ],
      },
      {
        heading: "Definindo a meta de calorias para seu objetivo",
        paragraphs: [
          "Para perda de gordura: subtraia entre 300 e 500 kcal do seu gasto total.",
          "Para manutenção: consuma calorias próximas ao seu gasto diário estimado.",
          "Para ganho de massa magra: consuma um superávit controlado de 200 a 400 kcal com ingestão adequada de proteínas.",
        ],
      },
      {
        heading: "Monitore a média semanal, não variações diárias",
        paragraphs: [
          "O peso na balança oscila diariamente devido à retenção de líquidos, sódio e trânsito intestinal. Avalie a tendência média semanal para verificar se suas metas estão no caminho certo.",
        ],
      },
    ],
    faqs: [
      {
        question: "Posso comer abaixo da minha taxa metabólica basal?",
        answer:
          "Não é recomendado. Consumir calorias abaixo da TMB por períodos prolongados pode comprometer a imunidade, energia e massa muscular.",
      },
      {
        question: "Quantas vezes por semana devo me pesar?",
        answer:
          "Pesar-se 2 a 3 vezes por semana em jejum pela manhã e calcular a média semanal oferece uma leitura muito mais confiável da sua evolução.",
      },
    ],
  },
  {
    slug: "food-journal-for-busy-professionals",
    title: "Diário alimentar para quem tem uma rotina corrida",
    description:
      "Como manter o registro de refeições mesmo com reuniões, trabalho fora de casa e pouco tempo para cozinhar.",
    summary:
      "Trabalho intenso e viagens não precisam significar o fim da sua saúde. Aprenda a monitorar sua alimentação com praticidade.",
    category: "Estilo de Vida",
    readTime: "5 min de leitura",
    accent: "#ff7e78",
    keywords: [
      "diario alimentar rotina corrida",
      "contar calorias no trabalho",
      "habito alimentar pratico",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Por que as pessoas ocupadas abandonam os diários comuns",
        paragraphs: [
          "Profissionais com agendas cheias não têm tempo de parar 5 minutos em cada refeição para pesquisar ingredientes em listas complicadas.",
          "Se o aplicativo exigir muito trabalho manual, ele inevitavelmente será abandonado na primeira semana movimentada de trabalho.",
        ],
      },
      {
        heading: "A foto como ferramenta de velocidade",
        paragraphs: [
          "Tirar uma foto do almoço de negócios ou do lanche rápido leva apenas 2 segundos. Você captura o registro imediatamente e pode revisar a estimativa no fim do dia ou durante uma pausa.",
          "Dessa forma, sua rotina de trabalho não é interrompida e seu diário alimentar permanece 100% completo.",
        ],
      },
      {
        heading: "Estratégias inteligentes para refeições rápidas",
        paragraphs: [
          "Priorize opções grelhadas e vegetais em restaurantes por quilo, mantenha lanches ricos em proteínas na mochila e hidrate-se com frequência ao longo do dia.",
        ],
      },
    ],
    faqs: [
      {
        question: "O app funciona sem conexão à internet na hora da foto?",
        answer:
          "Você pode tirar a foto com a câmera do seu celular e fazer o upload no LogMyPlate assim que se reconectar à internet.",
      },
      {
        question: "Como o assistente de IA ajuda no planejamento da semana?",
        answer:
          "Você pode perguntar ao Nutricionista por IA: 'Quais foram os dias com menor consumo de proteínas nesta semana?' e receber um diagnóstico rápido.",
      },
    ],
  },
  {
    slug: "privacy-first-calorie-tracking",
    title: "Privacidade em primeiro lugar: como tratamos suas fotos de refeições",
    description:
      "Nosso compromisso de segurança: por que suas fotos pertencem a você e nunca são comercializadas ou expostas.",
    summary:
      "Suas fotos de refeições e seus dados de peso são pessoais. Entenda como nossa arquitetura protege rigorosamente sua privacidade.",
    category: "Privacidade",
    readTime: "4 min de leitura",
    accent: "#5a98f7",
    keywords: [
      "privacidade no contador de calorias",
      "seguranca de dados de saude",
      "fotos privadas de comida",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Seus dados de saúde e alimentação são confidenciais",
        paragraphs: [
          "Acreditamos que informações sobre o que você come e quanto você pesa não devem ser transformadas em mercadoria publicitária para terceiros.",
          "O LogMyPlate processa suas fotos com o único propósito de gerar as estimativas nutricionais e manter seu diário particular em funcionamento.",
        ],
      },
      {
        heading: "Sem perfis públicos obrigatórios ou feeds sociais",
        paragraphs: [
          "O aplicativo não possui feed público, seguidores ou curtidas. Trata-se de um espaço pessoal e seguro entre você e seus objetivos de bem-estar.",
          "Você pode excluir seus dados a qualquer momento com apenas alguns toques dentro do próprio aplicativo.",
        ],
      },
      {
        heading: "Criptografia e infraestrutura segura",
        paragraphs: [
          "Todas as comunicações com nossos servidores utilizam criptografia de ponta a ponta (TLS) e são armazenadas em infraestrutura em nuvem de alta segurança.",
        ],
      },
    ],
    faqs: [
      {
        question: "O LogMyPlate vende fotos de usuários para terceiros?",
        answer:
          "Não. Suas fotos e informações pessoais nunca são vendidas a terceiros sob nenhuma hipótese.",
      },
      {
        question: "Como posso apagar definitivamente todas as minhas informações?",
        answer:
          "Basta acessar Perfil > Configurações > Excluir Conta dentro do aplicativo, e todos os seus registros serão imediatamente apagados.",
      },
    ],
  },
  {
    slug: "rewarded-ads-free-scans-calorie-tracker",
    title: "Registros gratuitos com anúncios premiados opcionais: como funciona",
    description:
      "Entenda o modelo do LogMyPlate: use a inteligência artificial gratuitamente assistindo a vídeos curtos apenas quando quiser.",
    summary:
      "Sem assinaturas forçadas: saiba como nosso sistema de anúncios premiados permite que qualquer pessoa acerte suas metas sem custo.",
    category: "Modelo de Acesso",
    readTime: "4 min de leitura",
    accent: "#b57bee",
    keywords: [
      "contador de calorias gratuito",
      "analise de refeicoes gratis por IA",
      "sem assinatura obrigatoria",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Tecnologia de IA de ponta acessível para todos",
        paragraphs: [
          "Modelos avançados de inteligência artificial visual exigem poder de processamento em servidores em nuvem com custos reais. Muitos aplicativos simplesmente bloqueiam novos usuários atrás de assinaturas mensais caras.",
          "No LogMyPlate, adotamos um caminho diferente: você pode usar a versão gratuita assistindo a um vídeo curto de anúncio premiado opcional para desbloquear análises.",
        ],
      },
      {
        heading: "Você sempre tem o controle da sua experiência",
        paragraphs: [
          "Não exibimos banners invasivos que cobrem o conteúdo do aplicativo ou pop-ups no meio da tela. O anúncio premiado só é reproduzido quando você decide assistir.",
          "E se desejar uma experiência 100% livre de qualquer anúncio com recursos ilimitados, o plano Premium está disponível com preços acessíveis.",
        ],
      },
      {
        heading: "Oferta especial de lançamento",
        paragraphs: [
          "Todos os novos usuários durante o período de lançamento ganham 30 dias de Premium totalmente grátis para experimentar o melhor da nossa tecnologia sem nenhum compromisso.",
        ],
      },
    ],
    faqs: [
      {
        question: "Preciso cadastrar meu cartão de crédito para a oferta de 30 dias grátis?",
        answer:
          "Não! A oferta de lançamento não exige cartão de crédito. Ao término dos 30 dias, você escolhe se deseja assinar ou continuar na versão gratuita.",
      },
      {
        question: "Quantos registros posso fazer gratuitamente por dia?",
        answer:
          "Você pode realizar registros diários utilizando os anúncios premiados disponíveis sempre que precisar.",
      },
    ],
  },
  {
    slug: "calorie-tracking-for-vegetarian-meals",
    title: "Contagem de calorias para vegetarianos e dietas à base de plantas",
    description:
      "Como atingir metas de proteína vegetal, monitorar leguminosas e evitar excesso de gorduras em pratos com queijos e azeites.",
    summary:
      "Dietas vegetarianas são ricas em nutrientes, mas demandam atenção ao equilíbrio de proteínas e gorduras. Saiba como a IA facilita seu controle.",
    category: "Vegetarianismo",
    readTime: "6 min de leitura",
    accent: "#efbd44",
    keywords: [
      "contador de calorias vegetariano",
      "proteina vegetal na dieta",
      "macros dieta vegetariana",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "O desafio comum da proteína na dieta vegetariana",
        paragraphs: [
          "Muitas pessoas que adotam o vegetarianismo acabam compensando a ausência de carnes aumentando excessivamente a porção de queijos amarelos, azeites ou carboidratos refinados.",
          "Isso pode levar a um aumento calórico indesejado sem atingir a meta proteica ideal para a manutenção dos músculos e saciedade.",
        ],
      },
      {
        heading: "Fontes vegetais de alto valor nutricional",
        paragraphs: [
          "Feijões de todas as cores, lentilhas, grão-de-bico, ervilhas, tofu, tempeh, ovos e queijos magros (como ricota ou cottage) são os pilares de uma alimentação equilibrada.",
          "O LogMyPlate identifica essas fontes no prato e exibe em tempo real sua contagem acumulada de proteínas do dia.",
        ],
      },
      {
        heading: "Aproveite a abundância de fibras naturais",
        paragraphs: [
          "Um dos grandes pontos fortes dos vegetarianos é o consumo elevado de fibras alimentares. Acompanhe seu total diário no aplicativo para garantir saúde digestiva máxima.",
        ],
      },
    ],
    faqs: [
      {
        question: "O app reconhece preparações à base de soja e tofu?",
        answer:
          "Sim! O modelo identifica com facilidade tofu grelhado, preparações de soja, hambúrgueres vegetais e leguminosas.",
      },
      {
        question: "Como evitar o excesso de calorias com queijos na dieta vegetariana?",
        answer:
          "Acompanhe o balanço de gorduras no gráfico de macros do LogMyPlate e prefira alternar queijos curados com opções de leguminosas temperadas.",
      },
    ],
  },
  {
    slug: "restaurant-meal-calorie-tracking",
    title: "Como registrar calorias em restaurantes e refeições fora de casa",
    description:
      "Estratégias inteligentes para estimar porções, lidar com óleos ocultos e registrar buffets por quilo sem culpa.",
    summary:
      "Comer fora faz parte da vida social e profissional. Aprenda a manter o controle calórico em restaurantes sem estresse.",
    category: "Restaurantes",
    readTime: "5 min de leitura",
    accent: "#70caa3",
    keywords: [
      "contar calorias em restaurante",
      "registrar refeicao fora de casa",
      "estimativa restaurante por quilo",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "O dilema dos óleos e temperos ocultos",
        paragraphs: [
          "Cozinhas profissionais de restaurantes costumam utilizar quantidades maiores de manteiga, óleo e sal para realçar o sabor dos pratos do que você utilizaria em casa.",
          "Uma refeição de restaurante com aparência leve pode conter de 20% a 30% mais calorias do que sua versão caseira equivalente.",
        ],
      },
      {
        heading: "Como a foto do prato resolve o registro fora de casa",
        paragraphs: [
          "Em um restaurante por quilo ou à la carte, basta tirar uma foto rápida e discreta do seu prato pronto antes de começar a comer.",
          "Adicionar uma nota simples como 'restaurante executivo' orienta a inteligência artificial a considerar o preparo profissional na estimativa calórica.",
        ],
      },
      {
        heading: "Dicas práticas para manter o equilíbrio social",
        paragraphs: [
          "Comece servindo uma boa porção de saladas e folhas verdes, escolha cortes magros grelhados e peça molhos especiais à parte sempre que possível.",
        ],
      },
    ],
    faqs: [
      {
        question: "Devo deixar de ir a jantares sociais para não estragar a dieta?",
        answer:
          "De forma alguma. O segredo da sustentabilidade no longo prazo é a flexibilidade: registre sua refeição no restaurante e ajuste o restante do dia de forma equilibrada.",
      },
      {
        question: "Como estimar bebidas alcoólicas ou sobremesas em eventos?",
        answer:
          "Você pode tirar uma foto da sobremesa ou taça e a IA calculará a estimativa correspondente para compor seu total diário.",
      },
    ],
  },
  {
    slug: "meal-tracking-for-gym-and-fitness",
    title: "Monitoramento nutricional para treino e hipertrofia",
    description:
      "Como sincronizar sua alimentação com sua rotina de academia, otimizando pré-treino, pós-treino e ingestão proteica diária.",
    summary:
      "O treino de força estimula o crescimento muscular, mas é a nutrição que constrói os resultados. Veja como o LogMyPlate turbina seus treinos.",
    category: "Fitness e Treino",
    readTime: "6 min de leitura",
    accent: "#ff7e78",
    keywords: [
      "dieta para hipertrofia",
      "bater proteina academia",
      "nutricao para treino",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "O papel decisivo da nutrição nos resultados da academia",
        paragraphs: [
          "Não importa o quão pesado você treine: sem calorias adequadas e sem proteínas suficientes, os ganhos de força e hipertrofia serão lentos ou inexistentes.",
          "Monitorar seus macros diários garante que seus músculos tenham os blocos de construção necessários para a síntese proteica após os treinos.",
        ],
      },
      {
        heading: "Pré-treino e pós-treino com inteligência",
        paragraphs: [
          "Consumir carboidratos de boa digestão antes do treino garante estoques cheios de glicogênio para exercícios intensos de musculação ou corrida.",
          "No pós-treino, uma refeição sólida combinando proteínas completas e carboidratos acelera a recuperação e diminui as dores musculares tardias.",
        ],
      },
      {
        heading: "A facilidade de registrar marmitas fitness",
        paragraphs: [
          "Para quem prepara marmitas da semana com arroz, frango, patinho e legumes, o LogMyPlate permite registrar cada marmita com uma única foto em segundos.",
        ],
      },
    ],
    faqs: [
      {
        question: "Preciso tomar suplementos como whey protein para atingir a meta?",
        answer:
          "Suplementos são convenientes, mas você pode perfeitamente bater sua meta com alimentos sólidos como ovos, frango, carne, peixe e leguminosas.",
      },
      {
        question: "Quantos gramas de proteína por refeição o corpo consegue absorver?",
        answer:
          "A pesquisa científica moderna demonstra que doses de 30g a 45g de proteína de qualidade por refeição são eficientemente aproveitadas para a síntese muscular.",
      },
    ],
  },
];

export function getPtBrGuide(slug: string): Guide | undefined {
  return ptBrGuides.find((g) => g.slug === slug);
}
