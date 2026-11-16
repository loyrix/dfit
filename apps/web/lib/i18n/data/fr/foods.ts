import type { FoodPage } from "@/app/(en)/calories/food-data";

export const frFoods: FoodPage[] = [
  {
    slug: "roti",
    name: "Roti",
    tier: "indian",
    aka: ["Chapati", "Phulka", "pain plat indien"],
    title: "Calories dans le Roti (Chapati) — Par portion réelle, pas pour 100 g",
    description:
      "Un roti moyen apporte environ 160 calories. Découvrez les calories, protéines et fibres pour les petits, moyens et grands rotis selon les tailles réelles.",
    intro: [
      "Personne ne pèse son roti sur une balance de cuisine avant de le manger. C'est précisément là que réside la principale difficulté lors du suivi calorique.",
      "La plupart des tables nutritionnelles indiquent les calories du roti 'pour 100 grammes'. Pourtant, un roti ne pèse pas 100 grammes, et la recette maison diffère largement de celle des restaurants. L'apport énergétique réel dépend du diamètre, de l'épaisseur et de l'ajout éventuel de ghee (beurre clarifié) ou d'huile.",
      "Vous trouverez ci-dessous les repères nutritionnels correspondant aux portions réellement cuisinées et consommées au quotidien.",
    ],
    per100g: { calories: 267, protein: 8.7, carbs: 53.3, fat: 2.7, fiber: 9.7, sodium: 317 },
    portions: [
      { label: "1 petit roti", grams: 40, note: "taille thali ou phulka très fin sans matière grasse" },
      { label: "1 roti moyen", grams: 60, note: "la taille la plus courante dans nos journaux alimentaires" },
      { label: "1 grand roti de poêle", grams: 90, note: "plus épais ou taille restaurant" },
      { label: "2 rotis moyens", grams: 120 },
    ],
    observedRange:
      "Sur les repas réels enregistrés dans LogMyPlate, un seul roti a varié entre 40 g et 180 g.",
    portionHonesty: [
      "Nous pourrions vous donner un chiffre unique et l'appeler 'un roti', comme le font la majorité des sites internet. Mais une variation de poids par un facteur quatre équivaut à un apport calorique quadruplé : environ 107 calories pour le plus petit et plus de 480 pour le plus grand.",
      "Cet écart ne provient pas de données approximatives, mais de la réalité des cuisines : un phulka léger de repas familial et un roti épais de tandoori sont tous deux appelés honnêtement 'un roti'.",
      "Sélectionnez la ligne correspondant le mieux à ce que vous avez dans l'assiette. En cas d'hésitation, l'option moyenne reste la plus fidèle.",
    ],
    whatChangesIt: [
      {
        heading: "Le ghee ou l'huile badigeonnée",
        body: "Une cuillère à café de ghee apporte environ 5 g de lipides purs, soit près de 45 calories supplémentaires. À la maison, l'application est souvent légère ; au restaurant, elle est bien plus généreuse.",
      },
      {
        heading: "L'épaisseur bien plus que le diamètre",
        body: "Un roti de 15 cm étalé épais pèse souvent plus lourd qu'un roti de 20 cm étalé très finement. Le poids dépend beaucoup plus de l'épaisseur que du diamètre visible.",
      },
      {
        heading: "La variété de farine",
        body: "Ces valeurs correspondent à la farine de blé complet traditionnelle (atta), dont proviennent les fibres. Les galettes confectionnées avec des farines blanches raffinées offrent beaucoup moins de fibres.",
      },
    ],
    macroContext: [
      "Les glucides composent la majorité de l'aliment, mais les fibres représentent le véritable atout souvent ignoré : un roti moyen fournit environ 5,8 g de fibres, soit une fraction notable des apports quotidiens recommandés.",
      "L'apport en protéines est d'environ 5 g par pièce, complété idéalement par le dal, les lentilles ou le fromage paneer qui l'accompagnent.",
    ],
    comparison: {
      heading: "Roti versus riz",
      intro:
        "L'un des dilemmes les plus fréquents au moment d'enregistrer ses repas est de choisir entre roti et riz. Voici la comparaison pour des portions usuelles.",
      items: [
        { slug: "roti", grams: 60, label: "1 roti moyen (60g)" },
        { slug: "roti", grams: 120, label: "2 rotis moyens (120g)" },
        { slug: "rice", grams: 180, label: "1 bol de riz cuit (180g)" },
      ],
      footnote:
        "Deux rotis moyens et un bol de riz cuit présentent une valeur énergétique très proche. Les rotis apportent toutefois significativement plus de fibres et de protéines végétales. Aucun choix n'est mauvais : ce sont surtout les sauces et accompagnements qui font la différence.",
    },
    faqs: [
      {
        question: "Combien de calories contiennent 2 rotis ?",
        answer:
          "Deux rotis moyens (environ 120 g au total) apportent approximativement 320 calories, avec 10,4 g de protéines et 11,6 g de fibres. S'ils sont petits (environ 40 g pièce), comptez près de 214 calories.",
      },
      {
        question: "Le roti contient-il plus de protéines que le riz ?",
        answer:
          "Oui, et à un ratio nettement supérieur par rapport au poids. Un roti de 60 g apporte environ 5,2 g de protéines, contre 5,0 g pour un bol de 180 g de riz cuit. Le roti atteint ce résultat avec trois fois moins de poids et fournit 5,8 g de fibres (contre 0,7 g pour le riz blanc).",
      },
      {
        question: "Pourquoi chaque site indique-t-il une valeur différente ?",
        answer:
          "Parce qu'ils ne répondent pas à la même question. Beaucoup publient des valeurs théoriques pour 100 grammes issues de tables génériques. Chez LogMyPlate, nous vous indiquons les portions réelles observées dans les assiettes du quotidien.",
      },
    ],
    related: ["rice", "dal", "paneer", "idli"],
  },
  {
    slug: "dal",
    name: "Dal",
    tier: "indian",
    aka: ["Dal jaune", "Tadka Dal", "soupe de lentilles indienne"],
    title: "Calories dans le Dal — Par louche et par bol, pas pour 100 g",
    description:
      "Un bol (katori) de dal jaune traditionnel apporte environ 150 calories et 8 g de protéines végétales. Comparez les portions et textures de dal.",
    intro: [
      "Le dal constitue la base protéique et réconfortante de la cuisine traditionnelle, mais l'estimation de ses calories soulève souvent des interrogations.",
      "La densité calorique dépend de la consistance de la soupe et surtout de la quantité d'huile ou de ghee employée pour faire revenir les épices et l'ail (le tadka).",
      "Voici les valeurs détaillées pour les portions réelles dégustées au quotidien.",
    ],
    per100g: { calories: 95, protein: 5.2, carbs: 12.8, fat: 2.3, fiber: 3.2, sodium: 210 },
    portions: [
      { label: "1 petit bol (dal fluide)", grams: 120, note: "consistance légère du quotidien" },
      { label: "1 bol moyen (standard maison)", grams: 160, note: "portion individuelle habituelle" },
      { label: "1 grand bol de restaurant", grams: 220, note: "plus onctueux avec tadka généreux" },
      { label: "Dal Makhani (au beurre et à la crème)", grams: 180, note: "recette riche en lentilles noires et crème" },
    ],
    observedRange:
      "Sur les repas réels enregistrés, une portion de dal varie généralement de 100 g à 250 g, pour 90 à 280 kcal.",
    portionHonesty: [
      "La matière grasse de cuisson constitue la variable déterminante. Deux cuillères à soupe de ghee en plus dans la casserole doublent les calories sans changer le volume visible.",
      "Un dal préparé à la maison est généralement bien plus léger et digeste que les versions de restaurant.",
    ],
    whatChangesIt: [
      {
        heading: "L'huile ou le ghee du tadka",
        body: "Le fait de faire rissoler les épices dans de l'huile ou du beurre clarifié concentre les calories. Modérer cette étape permet de conserver un dal très léger.",
      },
      {
        heading: "La consistance de l'eau",
        body: "Un dal liquide contient plus d'eau et moins de calories par louche ; un dal réduit et onctueux concentre davantage les nutriments.",
      },
      {
        heading: "L'ajout de produits laitiers",
        body: "Le Dal Makhani ou certaines recettes régionales intègrent de la crème fraîche ou du beurre, ce qui augmente la part de lipides saturés.",
      },
    ],
    macroContext: [
      "Le dal apporte des protéines végétales riches en lysine ainsi que des fibres solubles bénéfiques pour la satiété et la flore intestinale.",
      "Associé à du riz ou à un roti au blé complet, il fournit un profil complet d'acides aminés.",
    ],
    comparison: {
      heading: "Le dal comparé à d'autres sources de protéines",
      intro: "Découvrez comment le dal jaune se positionne face au paneer et au roti.",
      items: [
        { slug: "dal", grams: 160, label: "1 bol de dal jaune (160g)" },
        { slug: "paneer", grams: 80, label: "Dés de paneer (80g)" },
        { slug: "roti", grams: 60, label: "1 roti moyen (60g)" },
      ],
      footnote:
        "Le dal apporte des protéines végétales accompagnées de fibres et très peu de lipides saturés, à la différence du fromage qui est plus gras.",
    },
    faqs: [
      {
        question: "Combien de calories contient une louche de dal maison ?",
        answer:
          "Une louche moyenne de dal maison apporte entre 120 et 150 calories selon l'onctuosité et la quantité d'huile de cuisson.",
      },
      {
        question: "Le dal est-il une protéine complète ?",
        answer:
          "Les lentilles sont riches en lysine mais modérées en méthionine. En les associant à des céréales (riz ou blé complet), vous obtenez une protéine complète.",
      },
    ],
    related: ["roti", "rice", "paneer"],
  },
  {
    slug: "rice",
    name: "Riz",
    tier: "indian",
    aka: ["riz blanc", "riz basmati", "riz cuit"],
    title: "Calories dans le Riz Cuit — Par bol et par assiette réelle",
    description:
      "Un bol moyen de riz cuit apporte environ 170 calories et 37 g de glucides. Consultez les repères de portions pour vos repas quotidiens.",
    intro: [
      "Peser le riz cru avant cuisson ne vous est d'aucune utilité lorsque votre assiette est déjà servie.",
      "Lors de la cuisson, le grain absorbe de l'eau et triple de poids. 100 g de riz cru n'ont rien à voir avec 100 g de riz cuit dans votre assiette. Nos données s'appliquent exclusivement au riz prêt à déguster.",
      "Retrouvez ci-dessous les repères pratiques en cuillères, bols et assiettes.",
    ],
    per100g: { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, sodium: 1 },
    portions: [
      { label: "1 petit bol / portion légère", grams: 100, note: "environ 3 à 4 cuillères à soupe bombées" },
      { label: "1 bol moyen (portion standard)", grams: 130, note: "accompagnement individuel équilibré" },
      { label: "1 assiette plate normale", grams: 200, note: "portion de plat principal" },
      { label: "Grande assiette de restaurant / Biryani", grams: 280, note: "souvent cuisiné avec de l'huile et des épices" },
    ],
    observedRange:
      "Sur les repas réels enregistrés, les portions de riz oscillent entre 80 g et 320 g par assiette.",
    portionHonesty: [
      "Il est facile de sous-estimer la quantité de riz servie à l'aide d'une grande cuillère. Utiliser un bol ou une coupelle comme repère visuel évite les excès involontaires.",
      "Cuit simplement à l'eau ou à la vapeur, le riz ne contient quasiment aucun lipide. Le riz sauté ou le biryani contient davantage de calories en raison des matières grasses ajoutées.",
    ],
    whatChangesIt: [
      {
        heading: "Beurre ou huile de cuisson",
        body: "Faire revenir le riz dans de la matière grasse avant cuisson augmente la densité calorique finale.",
      },
      {
        heading: "Riz blanc versus riz complet",
        body: "L'apport calorique pour 100 g cuit est quasiment identique (~130 kcal). Le riz complet préserve son enveloppe, offrant plus de fibres et de magnésium.",
      },
    ],
    macroContext: [
      "Le riz cuit constitue une source de glucides complexes facilement digestibles, fournissant une énergie rapide pour vos activités et entraînements.",
      "Il présente une teneur naturellement très faible en sodium et en lipides.",
    ],
    comparison: {
      heading: "Le riz comparé au roti et aux pains plats",
      intro: "Comparez le riz cuit avec le pain roti traditionnel.",
      items: [
        { slug: "rice", grams: 130, label: "1 bol de riz (130g)" },
        { slug: "roti", grams: 60, label: "1 roti moyen (60g)" },
        { slug: "paratha", grams: 80, label: "1 paratha simple (80g)" },
      ],
      footnote:
        "Le riz et le roti affichent une densité calorique similaire par portion servie, mais le roti complet apporte davantage de fibres alimentaires.",
    },
    faqs: [
      {
        question: "Combien de calories contiennent 4 cuillères à soupe de riz ?",
        answer:
          "Quatre cuillères à soupe bombées de riz cuit pèsent environ 100 g et totalisent approximativement 130 calories.",
      },
      {
        question: "Le riz blanc fait-il grossir ?",
        answer:
          "Non. La prise de poids découle d'un surplus calorique global sur la durée, et non de la consommation d'un aliment en particulier.",
      },
    ],
    related: ["roti", "dal", "paratha"],
  },
  {
    slug: "paneer",
    name: "Paneer",
    tier: "indian",
    aka: ["fromage paneer", "fromage frais indien"],
    title: "Calories dans le Fromage Paneer — Par dé et par portion",
    description:
      "100 g de fromage paneer traditionnel apportent environ 290 calories, 18 g de protéines et 22 g de lipides. Repères nutritionnels par portion.",
    intro: [
      "Le paneer est la source principale de protéines végétariennes de la cuisine indienne, apprécié pour sa texture douce et sa capacité à s'imprégner des sauces.",
      "Confectionné à partir de lait entier caillé puis pressé, il associe une teneur élevée en protéines à une part notable de matières grasses laitières.",
      "Dans les currys, il convient de distinguer les calories des dés de fromage de celles de la sauce onctueuse.",
    ],
    per100g: { calories: 290, protein: 18.3, carbs: 3.6, fat: 22.5, fiber: 0, sodium: 18 },
    portions: [
      { label: "1 petit dé individuel", grams: 20, note: "découpe usuelle dans les currys de légumes" },
      { label: "Portion de 4 dés moyens", grams: 80, note: "quantité habituelle dans une assiette individuelle" },
      { label: "Portion standard de 100g", grams: 100, note: "mesure de référence en cuisine" },
      { label: "Assiette de curry de paneer complète", grams: 200, note: "comprend les dés et la sauce mijotée" },
    ],
    observedRange:
      "Sur les repas réels enregistrés, les portions de paneer varient de 40 g à 160 g de fromage par plat.",
    portionHonesty: [
      "Le paneer est un aliment dense et nourrissant. Bien qu'il s'agisse d'une excellente source de protéines, consommer 150 g de paneer frit dans une sauce au beurre peut dépasser 500 calories.",
      "Privilégier le paneer grillé (Tikka) plutôt que frit à l'huile permet de réduire significativement l'apport calorique.",
    ],
    whatChangesIt: [
      {
        heading: "Le type de lait employé",
        body: "Un paneer préparé à partir de lait demi-écrémé permet de réduire de moitié les lipides sans altérer l'apport en protéines.",
      },
      {
        heading: "Le passage à la poêle",
        body: "Faire dorer les dés de paneer dans du ghee ou de l'huile avant de les incorporer à la sauce augmente l'absorption de matières grasses.",
      },
    ],
    macroContext: [
      "Il fournit des protéines complètes à digestion lente (caséine) ainsi qu'un excellent apport en calcium et phosphore.",
      "Très pauvre en glucides, il convient parfaitement aux régimes pauvres en sucres ou cétogènes.",
    ],
    comparison: {
      heading: "Le paneer comparé à d'autres sources de protéines",
      intro: "Observez le profil du paneer face au dal et au roti.",
      items: [
        { slug: "paneer", grams: 80, label: "Dés de paneer (80g)" },
        { slug: "dal", grams: 160, label: "1 bol de dal jaune (160g)" },
        { slug: "idli", grams: 80, label: "2 idlis vapeur (80g)" },
      ],
      footnote:
        "Le paneer apporte plus de protéines par gramme que les légumineuses, mais renferme naturellement plus de matières grasses.",
    },
    faqs: [
      {
        question: "Le fromage paneer convient-il à la prise de masse musculaire ?",
        answer:
          "Oui, ses protéines de haute valeur biologique soutiennent parfaitement la récupération musculaire.",
      },
      {
        question: "Le paneer contient-il beaucoup de lactose ?",
        answer:
          "L'égouttage et le pressage éliminent la majorité du lactosérum, ce qui rend le paneer nettement moins riche en lactose que le lait liquide.",
      },
    ],
    related: ["dal", "roti", "idli"],
  },
  {
    slug: "idli",
    name: "Idli",
    tier: "indian",
    aka: ["Idly", "gâteau de riz vapeur indien"],
    title: "Calories dans l'Idli — Cuit vapeur, léger et par pièce",
    description:
      "Un idli moyen traditionnel apporte environ 58 calories et quasiment zéro lipide. Valeurs nutritionnelles précises par pièce et avec accompagnements.",
    intro: [
      "L'idli est mondialement reconnu comme l'un des petits-déjeuners les plus digestes et sains grâce à sa cuisson exclusive à la vapeur.",
      "Sa pâte associant riz et lentilles urad dal fermente naturellement, favorisant l'assimilation des nutriments et le confort digestif.",
      "Découvrez ses valeurs détaillées par unité et l'influence des sauces d'accompagnement.",
    ],
    per100g: { calories: 145, protein: 4.8, carbs: 30.2, fat: 0.5, fiber: 1.5, sodium: 120 },
    portions: [
      { label: "1 petit idli (mini)", grams: 25, note: "format cocktail ou buffet" },
      { label: "1 idli moyen (taille standard)", grams: 40, note: "le format familial traditionnel" },
      { label: "2 idlis moyens (petit-déjeuner type)", grams: 80, note: "la portion matinale la plus courante" },
      { label: "2 idlis avec sambar et chutney", grams: 200, note: "repas complet avec bouillon de légumes" },
    ],
    observedRange:
      "Dans les journaux alimentaires de nos utilisateurs, un petit-déjeuner se compose généralement de 2 à 4 idlis.",
    portionHonesty: [
      "L'idli seul est très peu calorique. La vigilance porte sur le chutney de coco classique, dont la richesse en graisse de coco fait grimper les calories.",
      "L'accompagner de sambar (soupe de lentilles et légumes) est le meilleur moyen d'ajouter des fibres sans alourdir le bilan calorique.",
    ],
    whatChangesIt: [
      {
        heading: "La proportion de lentilles dans la pâte",
        body: "Augmenter la part d'urad dal dans la préparation enrichit l'idli en protéines et abaisse son index glycémique.",
      },
      {
        heading: "Le choix du chutney",
        body: "Le chutney de coco est riche en lipides, tandis qu'un chutney à la tomate ou à la menthe reste beaucoup plus léger.",
      },
    ],
    macroContext: [
      "Quasiment dépourvu de graisses, l'idli fournit des glucides fermentés doux pour l'estomac.",
      "La fermentation naturelle stimule la biodisponibilité des vitamines du groupe B.",
    ],
    comparison: {
      heading: "L'idli comparé à d'autres options de petit-déjeuner",
      intro: "Comparez l'idli avec le roti et la paratha.",
      items: [
        { slug: "idli", grams: 80, label: "2 idlis moyens (80g)" },
        { slug: "roti", grams: 60, label: "1 roti moyen (60g)" },
        { slug: "paratha", grams: 80, label: "1 paratha simple (80g)" },
      ],
      footnote:
        "Deux idlis apportent moins de calories qu'un seul roti et moitié moins qu'une paratha cuite à la poêle.",
    },
    faqs: [
      {
        question: "Combien de calories contiennent 2 idlis avec du sambar ?",
        answer:
          "Deux idlis moyens accompagnés d'une louche de sambar totalisent environ 180 à 220 calories.",
      },
      {
        question: "L'idli est-il adapté à une perte de poids ?",
        answer:
          "Oui ! Sa cuisson vapeur sans matière grasse et sa bonne digestibilité en font une excellente option rassasiante.",
      },
    ],
    related: ["roti", "dal", "rice"],
  },
  {
    slug: "paratha",
    name: "Paratha",
    tier: "indian",
    aka: ["Parauhta", "pain plat feuilleté à la poêle", "Aloo Paratha"],
    title: "Calories dans la Paratha — Nature et farcie par pièce",
    description:
      "Une paratha nature apporte environ 290 calories ; les versions farcies à la pomme de terre (Aloo) varient de 300 à 380 calories. Repères de portions.",
    intro: [
      "La paratha est un pain plat croustillant et feuilleté, doré à la poêle avec du ghee ou de l'huile.",
      "Contrairement au roti cuit à sec, la paratha intègre de la matière grasse dans son feuilletage et lors de la cuisson, ce qui double sa valeur énergétique.",
      "Découvrez les différences caloriques entre versions simples et déclinaisons farcies.",
    ],
    per100g: { calories: 360, protein: 7.8, carbs: 52.4, fat: 13.8, fiber: 5.6, sodium: 340 },
    portions: [
      { label: "1 paratha nature maison moyenne", grams: 80, note: "pâte feuilletée dorée au ghee" },
      { label: "1 Aloo Paratha (farcie aux pommes de terre)", grams: 120, note: "garnie d'une purée épicée aux herbes" },
      { label: "1 Paneer Paratha (farcie au fromage)", grams: 130, note: "plus protéinée, mais aussi plus riche en matières grasses" },
      { label: "Paratha de restaurant avec beurre", grams: 150, note: "généreusement beurrée au service" },
    ],
    observedRange:
      "Une paratha peut peser de 70 g (faite maison simple) à plus de 180 g dans les restaurants traditionnels.",
    portionHonesty: [
      "Une seule paratha farcie et beurrée peut renfermer autant de calories que trois rotis simples.",
      "Cuire la paratha dans une poêle antiadhésive avec un léger spray d'huile permet d'économiser jusqu'à 100 calories par pièce.",
    ],
    whatChangesIt: [
      {
        heading: "La garniture intérieure",
        body: "La pomme de terre (Aloo) ajoute des glucides, le fromage paneer ajoute des protéines et lipides, tandis que le chou-fleur (Gobi) reste l'option la plus légère.",
      },
      {
        heading: "La noix de beurre sur le dessus",
        body: "Déposer une noisette de beurre fondant sur la paratha brûlante ajoute instantanément 70 à 100 calories.",
      },
    ],
    macroContext: [
      "La paratha fournit une énergie soutenue combinant glucides denses et lipides, parfaite pour une matinée active.",
      "L'accompagner d'un yaourt nature permet d'adoucir l'index glycémique et d'apporter des protéines fraîches.",
    ],
    comparison: {
      heading: "La paratha comparée au roti",
      intro: "Comparez la paratha dorée à la poêle avec le roti cuit à sec.",
      items: [
        { slug: "paratha", grams: 80, label: "1 paratha nature (80g)" },
        { slug: "roti", grams: 60, label: "1 roti moyen (60g)" },
        { slug: "idli", grams: 80, label: "2 idlis moyens (80g)" },
      ],
      footnote:
        "Une paratha nature contient presque le double de calories d'un roti de même taille en raison de la matière grasse de cuisson.",
    },
    faqs: [
      {
        question: "Combien de calories contient une Aloo Paratha au beurre ?",
        answer:
          "Une Aloo Paratha maison apporte environ 340 calories. Avec une noix de beurre fondue dessus, le plat atteint 415 à 440 calories.",
      },
      {
        question: "Peut-on consommer de la paratha en période de perte de poids ?",
        answer:
          "Oui, à condition de l'intégrer dans votre budget calorique quotidien. La cuisiner avec peu d'huile et l'accompagner d'une salade est une excellente façon de l'apprécier.",
      },
    ],
    related: ["roti", "rice", "paneer"],
  },
];

export function getFrFood(slug: string): FoodPage | undefined {
  return frFoods.find((f) => f.slug === slug);
}
