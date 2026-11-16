import type { Dictionary } from "../types";
import { APP_CONFIG } from "@/config/app";

export const ptBrDictionary: Dictionary = {
  locale: "pt-br",

  common: {
    languageSwitcherLabel: "Idioma",
    selectLanguageAria: "Selecionar idioma",
    macros: {
      calories: "Calorias",
      protein: "Proteínas",
      carbs: "Carboidratos",
      fat: "Gorduras",
      fiber: "Fibras",
      sodium: "Sódio",
      sugar: "Açúcar",
    },
    units: {
      grams: "g",
      kcal: "kcal",
    },
    notMedicalAdviceNotice:
      "As estimativas por inteligência artificial são aproximações e não substituem aconselhamento médico ou nutricional profissional. Consulte sempre um profissional de saúde qualificado.",
  },

  nav: {
    howItWorks: "Como funciona",
    aiCoach: "Nutricionista com IA",
    guides: "Guias",
    support: "Suporte",
    downloadCta: "Baixar",
    homeAria: "Página inicial do LogMyPlate",
    mainNavAria: "Navegação principal",
    openMenuAria: "Abrir menu",
    closeMenuAria: "Fechar menu",
  },

  footer: {
    brandDescription:
      "Registre suas refeições com uma simples foto. Estimativas imediatas de calorias e macros com inteligência artificial para qualquer prato.",
    groupProduct: "Produto",
    groupSupport: "Suporte",
    groupLegal: "Legal",
    linkDownload: "Baixar",
    linkHowItWorks: "Como funciona",
    linkGuides: "Guias",
    linkHelpFaq: "Ajuda e perguntas frequentes",
    linkEmailUs: "Fale conosco",
    linkPrivacy: "Política de Privacidade",
    linkTerms: "Termos de Serviço",
    linkDataDeletion: "Exclusão de Dados",
    linkAppAds: "app-ads.txt",
    copyright: "LogMyPlate. Todos os direitos reservados.",
    medicalDisclaimer:
      "As estimativas por IA são aproximadas e não constituem aconselhamento médico. Consulte sempre um profissional de saúde qualificado antes de iniciar dietas ou mudanças nutricionais.",
  },

  offerRibbon: {
    badge: "🎉 30 dias de Premium grátis no lançamento",
    highlight: "Baixe agora",
    suffix: "e comece seu teste gratuito.",
    ariaLabel: "Oferta de lançamento: 30 dias de Premium grátis",
  },

  launchOfferModal: {
    badge: "Oferta Especial de Lançamento",
    title: "Experimente o LogMyPlate Premium Grátis",
    subtitle:
      "Novos usuários recebem 30 dias de acesso ilimitado a todos os recursos avançados.",
    feature1: "Registros fotográficos ilimitados de refeições com IA",
    feature2: "Detecção e detalhamento completo de macronutrientes e micronutrientes",
    feature3: "Consultas ilimitadas com o Nutricionista por IA",
    note: "Sem necessidade de cartão de crédito. Disponível para iOS e Android.",
    closeAria: "Fechar janela da oferta",
  },

  downloadBadges: {
    appStoreAria: "Baixar LogMyPlate na Apple App Store",
    playStoreAria: "Baixar LogMyPlate no Google Play Store",
  },

  home: {
    metaTitle: "LogMyPlate — Registre Refeições por Foto | Contador de Calorias com IA",
    metaDescription:
      "Tire uma foto do seu prato e registre calorias e macronutrientes em segundos. Sem necessidade de ler códigos de barras. Suporte a culinárias do mundo todo.",
    hero: {
      badge: "Disponível para iOS e Android",
      headline: "Registre refeições com uma foto.",
      headlineBreak: "Calorias e macros em segundos.",
      subheadline:
        "Tire uma foto do seu prato. Nossa inteligência artificial identifica os alimentos, calcula as porções e estima calorias, proteínas, carboidratos e gorduras instantaneamente.",
      pillNoBarcode: "Sem ler código de barras",
      pillCuisines: "Culinária caseira e pratos globais",
      pillThemes: "Temas personalizáveis",
      altFrenchToast: "Foto de refeição com identificação de porção e nutrientes",
      altThaliReview: "Prato com detalhamento de calorias e macronutrientes",
      altDashboard: "Painel do aplicativo LogMyPlate exibindo metas diárias",
    },
    howItWorks: {
      badge: "Como funciona",
      title: "Três etapas simples para monitorar sua alimentação",
      flow: [
        {
          eyebrow: "Passo 1",
          title: "Tire uma foto",
          body: "Aponte a câmera para o seu prato ou faça o upload de uma imagem da sua galeria. Funciona para refeições caseiras, pratos de restaurantes e lanches rápidos.",
          alt: "Capturando a foto de uma refeição",
        },
        {
          eyebrow: "Passo 2",
          title: "Revise a estimativa",
          body: "A IA reconhece cada alimento presente no prato, calcula o peso aproximado e decompõe calorias, proteínas, carboidratos e gorduras.",
          alt: "Revisão dos ingredientes e macronutrientes calculados",
        },
        {
          eyebrow: "Passo 3",
          title: "Acompanhe seu progresso",
          body: "Seus registros são organizados em um diário alimentar visual, facilitando a visualização do seu balanço energético e metas nutricionais.",
          alt: "Acompanhamento de metas no diário nutricional",
        },
      ],
    },
    reviewEstimate: {
      badge: "Precisão e controle",
      title: "Você sempre tem o controle final",
      paragraph1:
        "Embora a IA reconheça a maioria das refeições automaticamente, você pode ajustar as porções, adicionar observações sobre ingredientes ou alterar medidas a qualquer momento com apenas alguns toques.",
      paragraph2:
        "Personalize seu registro informando se o prato usou mais ou menos azeite, trocou ingredientes ou incluiu itens extras.",
      macroMixBadge: "Balanço de Macronutrientes",
      altMealDetail: "Tela de detalhes da refeição com edição de porções",
    },
    aiNutritionist: {
      badge: "Nutricionista com IA",
      title: "Respostas e orientações sobre seus hábitos alimentares",
      paragraph1:
        "Converse diretamente com o assistente nutricional sobre o que você comeu ao longo do dia ou da semana:",
      bullet1: "Descubra se sua meta diária de proteínas foi alcançada de forma equilibrada.",
      bullet2: "Identifique padrões que causam picos de fome ou excessos no período noturno.",
      bullet3: "Receba ideias práticas de substituições saudáveis baseadas nos alimentos que você já consome.",
      altChat: "Conversa em tempo real com o assistente nutricional de IA",
      altWeeklySummary: "Resumo e análise semanal do padrão alimentar",
    },
    themes: {
      badge: "Personalização",
      title: "Escolha o estilo visual que combina com você",
      subtitle:
        "Mais de 10 temas cuidadosamente projetados — desde o minimalismo escuro até paletas energéticas inspiradas em alimentos naturais.",
      cards: [
        { label: "Matcha", alt: "Tema Matcha no LogMyPlate" },
        { label: "Berry", alt: "Tema Frutas Silvestres no LogMyPlate" },
        { label: "Onyx Escuro", alt: "Tema Onyx Escuro no LogMyPlate" },
        { label: "Crepúsculo", alt: "Tema Crepúsculo no LogMyPlate" },
      ],
    },
    premium: {
      srTitle: "Planos e Preços",
      bannerAltLandscape: "Comparativo de recursos gratuitos e Premium do LogMyPlate",
      bannerAltPortrait: "Vantagens do plano Premium do LogMyPlate",
      intro:
        "O LogMyPlate oferece uma experiência gratuita completa com registros diários. Para quem deseja máxima conveniência e análises profundas, o plano Premium desbloqueia ferramentas ilimitadas.",
      tiers: [
        {
          label: "Gratuito",
          accent: "Sem custo",
          perks: [
            "Registros com IA usando anúncios premiados opcionais",
            "Cálculo de calorias e macros principais",
            "Diário alimentar visual",
            "Histórico completo de refeições",
          ],
        },
        {
          label: "Premium",
          accent: "Mais popular",
          perks: [
            "Registros fotográficos ilimitados sem anúncios",
            "Consultas ilimitadas com o Nutricionista por IA",
            "Detalhamento de micronutrientes e fibras",
            "Acesso antecipado a todos os novos recursos",
          ],
        },
      ],
      note: "Preços locais exibidos diretamente na loja de aplicativos da sua região.",
    },
    ctaSection: {
      title: "Comece a registrar suas refeições de forma simples hoje mesmo",
      subtitle:
        "Disponível gratuitamente para iPhone e Android. Baixe o aplicativo e experimente a facilidade de monitorar sua alimentação com fotos.",
      privacyLink: "Valorizamos sua privacidade e segurança de dados.",
    },
  },

  download: {
    metaTitle: "Baixar LogMyPlate — Contador de Calorias com IA para iOS e Android",
    metaDescription:
      "Baixe o aplicativo LogMyPlate para iPhone ou Android. Aponte a câmera para o prato e descubra calorias e macronutrientes instantaneamente sem ler códigos de barras.",
    badge: "Download Oficial",
    headlinePrefix: "Baixe o",
    headlineBrand: "LogMyPlate",
    headlineSubtitle: "no seu celular",
    description:
      "Disponível para iPhone (iOS 16+) e smartphones Android (Android 10+). Instale gratuitamente e experimente um jeito muito mais rápido de registrar sua rotina alimentar.",
    featuresHeading: "O que você encontrará no aplicativo:",
    features: [
      "Reconhecimento fotográfico instantâneo de refeições caseiras e pratos diversos",
      "Detalhamento automático de calorias, proteínas, carboidratos, gorduras e fibras",
      "Chat interativo com assistente nutricional de inteligência artificial",
      "Diário de refeições visual para acompanhar o progresso com facilidade",
      "Temas visuais personalizáveis para o modo claro e escuro",
      "Sem anúncios invasivos obrigatórios — você tem total controle da experiência",
    ],
  },

  support: {
    metaTitle: "Suporte e Central de Ajuda — LogMyPlate",
    metaDescription:
      "Tire dúvidas frequentes sobre o LogMyPlate, registros fotográficos com IA, restauração de assinaturas ou fale diretamente com a equipe de suporte.",
    badge: "Central de Ajuda",
    headline: "Como podemos ajudar você?",
    subtitle:
      "Confira abaixo as respostas para as dúvidas mais comuns ou envie uma mensagem diretamente para a nossa equipe técnica.",
    contactBoxHeading: "Precisa de ajuda com sua conta?",
    contactBoxText:
      "Se tiver dúvidas sobre assinaturas, problemas na análise de fotos ou sugestões de melhorias, envie um e-mail para nossa equipe de atendimento.",
    contactButton: `Enviar e-mail para ${APP_CONFIG.supportEmail}`,
    faqs: [
      {
        q: "Como o LogMyPlate estima as calorias através de fotos?",
        a: "Utilizamos modelos avançados de visão computacional treinados para reconhecer ingredientes, pratos e densidades volumétricas. O sistema estima as porções com base no tamanho visual e consulta uma base de dados nutricionais rigorosa para calcular calorias e macronutrientes.",
      },
      {
        q: "As estimativas nutricionais de IA são 100% exatas?",
        a: "As estimativas são aproximações baseadas no aspecto visual do prato. Embora o sistema ofereça alta precisão para a maioria das refeições, fatores como óleos ocultos e temperos específicos podem variar. Por isso, você sempre pode ajustar as porções manualmente a qualquer momento.",
      },
      {
        q: "Preciso ler códigos de barras para registrar alimentos?",
        a: "Não! O LogMyPlate foi criado exatamente para eliminar a necessidade de buscar códigos de barras ou digitar listas de ingredientes. Basta tirar uma foto do prato pronto.",
      },
      {
        q: "Como funciona a oferta de lançamento de 30 dias grátis?",
        a: "Ao instalar o aplicativo durante o período de lançamento, você recebe 30 dias de acesso gratuito a todos os recursos Premium, sem precisar cadastrar cartão de crédito.",
      },
      {
        q: "Como posso restaurar uma assinatura já adquirida?",
        a: "Abra o aplicativo, vá até a aba de Perfil > Configurações > Assinatura e toque em 'Restaurar Compras'. O sistema sincronizará seus recibos da Apple App Store ou Google Play.",
      },
      {
        q: "Minhas fotos de refeições são mantidas privadas?",
        a: "Sim. As fotos enviadas são processadas exclusivamente para análise nutricional. Não vendemos suas informações e você pode solicitar a exclusão de todos os seus dados a qualquer momento.",
      },
    ],
  },

  privacy: {
    metaTitle: "Política de Privacidade — LogMyPlate",
    metaDescription:
      "Saiba como o LogMyPlate coleta, utiliza, protege e processa seus dados e fotos de refeições. Total respeito à privacidade dos usuários.",
    badge: "Privacidade",
    headline: "Política de Privacidade",
    lastUpdated: "Última atualização: 15 de novembro de 2026",
    legallyBindingNotice:
      "Aviso legal: A versão original em inglês desta Política de Privacidade é a versão juridicamente vinculativa. Esta tradução é fornecida exclusivamente para sua conveniência e facilidade de leitura.",
    sections: [
      {
        title: "1. Introdução e Compromisso com a Privacidade",
        content: [
          "O LogMyPlate respeita profundamente a privacidade de seus usuários. Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos e protegemos as informações quando você utiliza nosso aplicativo móvel e nosso site.",
          "Não vendemos dados pessoais para terceiros e não utilizamos suas fotos pessoais de refeições para fins não relacionados à prestação de serviços no aplicativo.",
        ],
      },
      {
        title: "2. Informações Coletadas",
        content: [
          "Fotos de Refeições: As imagens capturadas ou enviadas são processadas por algoritmos de inteligência artificial para identificar alimentos e calcular dados nutricionais aproximados.",
          "Dados Nutricionais e Metas: Armazenamos seus registros de alimentos, macronutrientes, histórico de peso e preferências de metas para exibir seu progresso no aplicativo.",
          "Identificadores Técnicos: Coletamos identificadores anônimos de dispositivo, versão do sistema operacional e dados técnicos de diagnóstico para garantir a estabilidade do sistema e prevenir falhas.",
        ],
      },
      {
        title: "3. Finalidade do Tratamento de Dados",
        content: [
          "Utilizamos as informações coletadas para: (a) fornecer o reconhecimento e estimativa nutricional por IA; (b) manter o histórico do seu diário alimentar sincronizado; (c) responder a solicitações de suporte técnico; e (d) aprimorar o desempenho técnico do serviço.",
        ],
      },
      {
        title: "4. Armazenamento e Segurança dos Dados",
        content: [
          "Seus dados são transmitidos utilizando criptografia TLS de padrão da indústria e mantidos em servidores de nuvem seguros. Implementamos medidas técnicas e administrativas para proteger suas informações contra acesso não autorizado, alteração ou perda.",
        ],
      },
      {
        title: "5. Seus Direitos de Privacidade e Exclusão",
        content: [
          "Você tem o direito de solicitar o acesso, retificação ou exclusão permanente de todas as suas informações pessoais e registros a qualquer momento.",
          "A exclusão de conta pode ser realizada diretamente dentro do aplicativo em Configurações > Excluir Conta, ou mediante solicitação pela nossa página de Exclusão de Dados.",
        ],
      },
      {
        title: "6. Serviços de Terceiros",
        content: [
          "Podemos utilizar provedores confiáveis de infraestrutura de nuvem, processamento de inteligência artificial, processamento de pagamentos (Apple App Store e Google Play Store) e plataformas de anúncios para a versão gratuita. Esses provedores tratam os dados estritamente em conformidade com as exigências de privacidade aplicáveis.",
        ],
      },
      {
        title: "7. Contato para Dúvidas de Privacidade",
        content: [
          `Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados, entre em contato com nossa equipe pelo e-mail: ${APP_CONFIG.supportEmail}.`,
        ],
      },
    ],
  },

  terms: {
    metaTitle: "Termos de Serviço — LogMyPlate",
    metaDescription:
      "Termos e condições de uso do aplicativo e website LogMyPlate. Leia as regras de utilização, avisos legais e diretrizes do serviço.",
    badge: "Termos",
    headline: "Termos de Serviço",
    lastUpdated: "Última atualização: 15 de novembro de 2026",
    legallyBindingNotice:
      "Aviso legal: A versão original em inglês destes Termos de Serviço é a versão legalmente vinculativa. Esta tradução é fornecida unicamente para sua conveniência.",
    medicalDisclaimerHeading: "Aviso Importante: Este Serviço Não Oferece Aconselhamento Médico",
    medicalDisclaimerText:
      "O LogMyPlate é uma ferramenta tecnológica de apoio ao bem-estar e registro nutricional diário. As análises e estimativas de calorias, macronutrientes e orientações do chat por IA NÃO constituem orientação médica, diagnóstico de saúde, prescrição clínica ou terapia alimentar. Consulte sempre um médico ou nutricionista qualificado antes de adotar mudanças drásticas na dieta ou hábitos de saúde.",
    sections: [
      {
        title: "1. Aceitação dos Termos",
        content: [
          "Ao baixar, instalar ou utilizar o aplicativo ou site do LogMyPlate, você declara ter lido, compreendido e concordado expressamente com todos os termos e condições aqui estabelecidos.",
        ],
      },
      {
        title: "2. Elegibilidade e Uso Adequado",
        content: [
          "Você concorda em utilizar o serviço exclusivamente para fins pessoais e legais. É expressamente proibido tentar violar a segurança do aplicativo, descompilar código, realizar engenharia reversa ou sobrecarregar nossos servidores de IA com requisições abusivas.",
        ],
      },
      {
        title: "3. Assinaturas e Compras no Aplicativo",
        content: [
          "O LogMyPlate oferece recursos gratuitos e planos de assinatura Premium opcionais. Todas as assinaturas são processadas e cobradas diretamente pela Apple App Store ou Google Play Store de acordo com as políticas comerciais de cada plataforma.",
          "O cancelamento de assinaturas deve ser efetuado diretamente nas configurações de conta da respectiva loja de aplicativos.",
        ],
      },
      {
        title: "4. Propriedade Intelectual",
        content: [
          "Todos os direitos autorais, marcas, designs de interface, logotipos, códigos de programação e conteúdos do LogMyPlate são de propriedade exclusiva de seus desenvolvedores e protegidos pela legislação de propriedade intelectual.",
        ],
      },
      {
        title: "5. Limitação de Responsabilidade",
        content: [
          "O serviço é fornecido 'no estado em que se encontra' ('as is'). Não garantimos que a análise de imagens seja infalível ou 100% precisa em todas as circunstâncias. O usuário assume total responsabilidade pelo uso das estimativas nutricionais.",
        ],
      },
      {
        title: "6. Modificações nos Termos",
        content: [
          "Reservamo-nos o direito de atualizar estes termos periodicamente. Caso alterações materiais sejam realizadas, a data de atualização no topo deste documento será revisada.",
        ],
      },
      {
        title: "7. Informações de Contato",
        content: [
          `Dúvidas ou esclarecimentos sobre estes Termos de Serviço podem ser direcionados para: ${APP_CONFIG.supportEmail}.`,
        ],
      },
    ],
  },

  dataDeletion: {
    metaTitle: "Exclusão de Conta e Dados — LogMyPlate",
    metaDescription:
      "Instruções claras sobre como solicitar a exclusão permanente de sua conta, fotos de refeições e dados nutricionais do LogMyPlate.",
    badge: "Exclusão de Dados",
    headline: "Como solicitar a exclusão dos seus dados",
    intro:
      "Você tem controle absoluto sobre suas informações pessoais. Caso decida parar de usar o LogMyPlate, oferecemos métodos simples para excluir permanentemente todos os seus dados.",
    inAppHeading: "Opção 1: Exclusão direta pelo aplicativo (Recomendado)",
    inAppSteps: [
      "Abra o aplicativo LogMyPlate no seu smartphone.",
      "Acesse a aba 'Perfil' no canto inferior da tela.",
      "Toque no ícone de 'Configurações' (ícone de engrenagem).",
      "Role a tela até o final e selecione 'Excluir Conta'.",
      "Confirme a exclusão na janela de aviso.",
    ],
    inAppNote:
      "A exclusão pelo aplicativo é instantânea e irrevogável, apagando suas fotos, diário de refeições e configurações.",
    openAppButton: "Abrir o aplicativo LogMyPlate",
    webHeading: "Opção 2: Solicitação por e-mail",
    webText:
      "Caso não tenha mais o aplicativo instalado no seu aparelho, você pode enviar uma solicitação de exclusão para nossa equipe de privacidade.",
    webEmailSubject: "Solicitação de Exclusão de Conta e Dados - LogMyPlate",
    webEmailButton: `Enviar e-mail para ${APP_CONFIG.supportEmail}`,
    retentionHeading: "O que acontece após a solicitação de exclusão?",
    retentionText:
      "Todos os seus registros de refeições, fotos associadas, metas diárias e histórico nutricional são permanentemente apagados dos nossos servidores principais. Informações mínimas de faturamento podem ser retidas apenas pelo prazo estritamente exigido por normas fiscais e contábeis legais.",
  },

  caloriesIndex: {
    metaTitle: "Diretório de Calorias — Valores Nutricionais por Porção Real",
    metaDescription:
      "Consulte tabelas nutricionais e calorias de alimentos populares calculadas por porções reais do cotidiano, e não apenas por 100 gramas.",
    badge: "Diretório de Calorias",
    headline: "Calorias e macronutrientes por porção",
    subtitle:
      "A maioria dos aplicativos exibe calorias apenas por 100g. No LogMyPlate, apresentamos medições práticas por unidade, prato e colher para facilitar seu dia a dia.",
    tierIndian: "Pratos e Acompanhamentos Tradicionais",
    tierGlobal: "Alimentos Cotidianos",
    viewFoodButton: "Ver tabela nutricional",
    per100gBadge: "Por 100g",
    portionsBadge: "Porções Reais",
  },

  guidesIndex: {
    metaTitle: "Guias e Blog — Nutrição, Calorias e Dicas com IA",
    metaDescription:
      "Artigos práticos e aprofundados sobre contagem de calorias, equilíbrio de macronutrientes, diário alimentar com fotos e hábitos saudáveis com o LogMyPlate.",
    badge: "Guias e Artigos",
    headline: "Aprenda a comer melhor com a ajuda da IA",
    subtitle:
      "Dicas práticas e orientações detalhadas sobre contagem de calorias, registro visual de refeições e como alcançar suas metas de bem-estar.",
    readArticleButton: "Ler artigo completo",
    minReadSuffix: "min de leitura",
  },
};
