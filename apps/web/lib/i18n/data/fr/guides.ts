import type { Guide } from "@/app/(en)/guides/content";

export const frGuides: Guide[] = [
  {
    slug: "ai-calorie-tracker-india",
    title: "Comment fonctionnent les compteurs de calories par IA pour les repas complexes",
    description:
      "Pourquoi le suivi nutritionnel par photo avec IA est bien plus adapté aux plats faits maison et aux assiettes composées qu'un lecteur de code-barres.",
    summary:
      "Les applications basées sur les codes-barres peinent face aux plats mijotés, au riz, aux légumineuses et aux assiettes composées. Découvrez comment la vision par IA résout ce défi.",
    category: "Compteur IA",
    readTime: "5 min de lecture",
    accent: "#efbd44",
    keywords: [
      "compteur de calories IA",
      "compter les calories par photo",
      "journal alimentaire intelligent",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Pourquoi les repas faits maison sont difficiles à enregistrer manuellement",
        paragraphs: [
          "La grande majorité des applications de suivi calorique ont été conçues pour des produits industriels emballés, des chaînes de restauration rapide et des portions précalibrées. Or, la cuisine du quotidien est bien différente : un plat fait maison associant céréales, légumes et protéines varie considérablement selon la quantité d'huile de cuisson et la générosité du service.",
          "Cette contrainte pousse de nombreux utilisateurs à abandonner : chercher manuellement chaque ingrédient dans un catalogue infini est fastidieux et reflète rarement ce qui se trouve véritablement dans votre assiette.",
        ],
      },
      {
        heading: "Ce que change l'analyse visuelle par intelligence artificielle",
        paragraphs: [
          "LogMyPlate part de la photo réelle de votre repas. L'intelligence artificielle repère les aliments visibles, intègre une éventuelle note descriptive brève et calcule une estimation des calories, protéines, glucides et lipides pour votre vérification.",
          "Il ne s'agit pas d'une analyse clinique en laboratoire, mais d'une estimation réaliste et pratique. Le véritable atout réside dans la constance : vous enregistrez votre assiette en moins de 10 secondes, rectifiez si nécessaire et tenez votre journal sans stress sur la durée.",
        ],
      },
      {
        heading: "Les détails qu'il convient toujours de surveiller",
        paragraphs: [
          "Les ingrédients invisibles constituent la principale source de variation : les huiles de cuisson, le beurre fondu, les sauces épaisses ou le sucre ajouté. Une note rapide telle que 'peu d'huile' ou 'sauce crémeuse' oriente efficacement l'IA, mais le contrôle final vous appartient toujours.",
          "Pour les situations médicales particulières, le diabète, les troubles du comportement alimentaire ou la grossesse, ces estimations sont purement informatives et ne se substituent jamais au suivi d'un médecin ou diététicien qualifié.",
        ],
      },
    ],
    faqs: [
      {
        question: "Un compteur de calories par IA peut-il être exact à 100 % ?",
        answer:
          "Non. Le suivi par photo fournit des estimations raisonnées. Il est idéal pour développer une conscience diététique et garder le rythme, mais ne remplace pas une analyse chimique en laboratoire.",
      },
      {
        question: "LogMyPlate fonctionne-t-il uniquement pour certains types de cuisine ?",
        answer:
          "Non. L'IA a été entraînée pour reconnaître aussi bien les plats traditionnels faits maison que la cuisine méditerranéenne, les salades composées, les pâtes et les plats de restaurant.",
      },
    ],
  },
  {
    slug: "indian-food-calorie-tracker",
    title: "Comment compter les calories des assiettes composées et plats traditionnels",
    description:
      "Guide pratique pour enregistrer les calories de la cuisine maison, des plats combinés et des sauces grâce à la photo et à l'ajustement des portions.",
    summary:
      "Apprenez à consigner légumineuses, féculents, viandes en sauce et salades sans peser chaque élément séparément sur une balance.",
    category: "Cuisine Traditionnelle",
    readTime: "6 min de lecture",
    accent: "#70caa3",
    keywords: [
      "compter calories cuisine maison",
      "suivi assiette composee",
      "journal nutritionnel photo",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Partez de l'assiette servie plutôt que d'équations complexes",
        paragraphs: [
          "La méthode la plus durable pour maintenir un journal alimentaire consiste à photographier votre assiette telle qu'elle vous est servie. Plutôt que de tenter de diviser l'huile d'une cocotte familiale, cadrez le plat et laissez l'IA identifier les aliments visibles.",
          "Cette approche est particulièrement efficace pour les plats du jour, les bols composés et les repas familiaux où plusieurs préparations partagent la même assiette.",
        ],
      },
      {
        heading: "Utilisez des notes concises pour les plats d'apparence proche",
        paragraphs: [
          "Certains ragoûts ou sauces peuvent présenter un aspect semblable en vue du dessus. Une note brève de deux mots comme 'curry de poulet' ou 'lentilles corail' apporte à l'IA le contexte déterminant sans vous faire perdre de temps.",
          "La note sert à éclairer la photo, pas à la remplacer. L'algorithme vérifie la cohérence visuelle avant d'établir l'estimation.",
        ],
      },
      {
        heading: "Vérifiez les portions avant de valider",
        paragraphs: [
          "À table, nous servons nos repas en louches, cuillères, bols ou tranches, et rarement en grammes précis. LogMyPlate traduit les volumes visuels en portions modifiables que vous pouvez ajuster si votre portion est manifestement plus généreuse ou plus légère.",
          "La régularité prime sur la rigueur excessive : un suivi tenu fidèlement à 90 % pendant des mois apporte infiniment plus de bénéfices qu'un pesage parfait abandonné au bout de trois jours.",
        ],
      },
    ],
    faqs: [
      {
        question: "Faut-il peser chaque repas sur une balance ?",
        answer:
          "Peser ses aliments au début peut aider à calibrer son regard, mais ce n'est pas nécessaire au quotidien. Une photo nette avec LogMyPlate suffit pour garder le cap.",
      },
      {
        question: "L'application reconnaît-elle les recettes de famille ?",
        answer:
          "Oui. La reconnaissance des préparations culinaires familiales et des mélanges d'ingrédients est au cœur de la conception de LogMyPlate.",
      },
    ],
  },
  {
    slug: "photo-food-journal",
    title: "Pourquoi un journal alimentaire en photos est bien plus facile à tenir",
    description:
      "Comment la capture photo simplifie le suivi nutritionnel, renforce votre constance et met en lumière vos véritables habitudes alimentaires.",
    summary:
      "Un journal de repas n'a de valeur que si vous le tenez dans la durée. Enregistrer vos assiettes en photo transforme cette démarche en un geste fluide de deux secondes.",
    category: "Journal Alimentaire",
    readTime: "4 min de lecture",
    accent: "#ff7e78",
    keywords: [
      "journal alimentaire photo",
      "carnet de repas visuel",
      "habitudes alimentaires saines",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Le temps passé est le premier facteur d'abandon",
        paragraphs: [
          "La majorité des tentatives de suivi diététique échouent à cause de la lourdeur du processus : déverrouiller le téléphone, chercher les aliments, comparer les marques et saisir les grammes à chaque repas finit par lasser même les plus motivés.",
          "Prendre une photo ne prend que deux secondes et n'interrompt pas votre repas en famille ou entre amis. Cette simplicité permet d'ancrer un réflexe naturel avant chaque bouchée.",
        ],
      },
      {
        heading: "Les images révèlent des réalités que les chiffres masquent",
        paragraphs: [
          "Faire défiler la galerie de vos repas met en évidence des comportements qu'un tableau de chiffres ne montre pas : le manque de légumes verts au déjeuner, des portions de féculents excessives ou des grignotages sucrés récurrents l'après-midi.",
          "Visualiser l'ensemble de votre semaine en images vous permet de constater d'un coup d'œil où se situent vos réussites et vos points de progrès.",
        ],
      },
      {
        heading: "Comment pérenniser cette habitude sur le long terme",
        paragraphs: [
          "Prenez le réflexe de photographier avant de manger, même si vous ne vérifiez et n'enregistrez l'analyse que plus tard dans la journée. La photo garde la mémoire du plat.",
          "Ne cherchez pas une perfection anxiogène. L'objectif est d'accroître votre lucidité et de vous aider à faire des choix éclairés en toute sérénité.",
        ],
      },
    ],
    faqs: [
      {
        question: "Que faire si j'oublie de prendre la photo avant de manger ?",
        answer:
          "Vous pouvez photographier le plat entamé en ajoutant une note, ou enregistrer rapidement la description du repas en texte dans l'application.",
      },
      {
        question: "Mes photos de repas sont-elles visibles par d'autres personnes ?",
        answer:
          "Non. Vos clichés demeurent strictement privés et ne sont accessibles que depuis votre compte personnel. Il n'existe aucun fil public.",
      },
    ],
  },
  {
    slug: "calorie-tracker-without-barcodes",
    title: "Compteur de calories sans code-barres : la liberté des vrais aliments",
    description:
      "Les repas les plus sains et nutritifs ne comportent pas de code-barres. Découvrez comment suivre les aliments frais grâce à l'IA.",
    summary:
      "Légumes frais, fruits, poisson, viande et plats cuisinés maison sont dépourvus de code-barres. Voyez comment l'IA visuelle vous libère des emballages.",
    category: "Sans Code-Barres",
    readTime: "5 min de lecture",
    accent: "#5a98f7",
    keywords: [
      "compteur de calories sans code-barres",
      "suivi aliments bruts",
      "manger sainement sans emballage",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Le paradoxe des applications centrées sur les codes-barres",
        paragraphs: [
          "Les applications de régime traditionnelles ont été articulées autour du scan de codes-barres. Cette logique fonctionne parfaitement pour les biscuits, sodas et plats surgelés industriels, mais s'avère inopérante pour les aliments bruts.",
          "Une pomme du marché, un filet de poisson frais ou une assiette de légumes rôtis faits maison n'ont pas de code-barres, créant une friction inutile pour les personnes qui cuisinent sainement.",
        ],
      },
      {
        heading: "L'analyse nutritionnelle par vision artificielle",
        paragraphs: [
          "LogMyPlate s'appuie sur la reconnaissance des formes, des couleurs et des volumes dans l'assiette. Le modèle identifie les produits frais et calcule leurs équivalences à partir de tables nutritionnelles fiables.",
          "Vous bénéficiez ainsi d'une prise en charge immédiate aussi bien pour un en-cas simple que pour un menu de restaurant complet sans étiquette.",
        ],
      },
      {
        heading: "Privilégiez les aliments bruts sans contrainte de suivi",
        paragraphs: [
          "Consommer des aliments frais et non transformés est le meilleur choix pour votre vitalité. Votre outil de suivi diététique doit encourager cette démarche plutôt que de vous inciter à acheter des produits industriels pour leur code-barres.",
        ],
      },
    ],
    faqs: [
      {
        question: "LogMyPlate peut-il quand même lire un code-barres si nécessaire ?",
        answer:
          "Notre cœur de technologie repose sur la photo des aliments réels. Pour un produit conditionné, photographier le tableau nutritionnel ou saisir son nom fonctionne très bien.",
      },
      {
        question: "Comment l'IA sait-elle quelle huile a été utilisée ?",
        answer:
          "L'aspect visuel et le brillant apportent des indices. Pour une précision optimale, vous pouvez simplement ajouter '1 c. à s. d'huile d'olive'.",
      },
    ],
  },
  {
    slug: "meal-photo-tips",
    title: "Conseils pour photographier vos repas avec une précision optimale",
    description:
      "Angle de prise de vue, lumière, disposition dans l'assiette et notes brèves pour affiner les estimations de LogMyPlate.",
    summary:
      "Quelques gestes simples lors de la prise de vue permettent à l'IA d'analyser vos aliments avec une excellente acuité.",
    category: "Astuces Photo",
    readTime: "4 min de lecture",
    accent: "#b57bee",
    keywords: [
      "conseils photo repas",
      "precision compteur calories IA",
      "comment photographier son assiette",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "1. Privilégiez un angle à 45 degrés ou la vue du dessus",
        paragraphs: [
          "Un angle d'environ 45 degrés permet à la caméra de capturer à la fois la surface des aliments et le relief des portions, ce qui facilite le calcul des volumes.",
          "Pour les préparations très plates (pizza, galette), une vue verticale directe (90 degrés) convient très bien. Pour les bols, veillez à ce que les ingrédients du fond soient perceptibles.",
        ],
      },
      {
        heading: "2. Une luminosité naturelle évite les zones d'ombre",
        paragraphs: [
          "Une lumière suffisante permet de distinguer les nuances entre différentes céréales, légumineuses ou sauces foncées. Évitez de projeter l'ombre de votre téléphone sur le centre du plat.",
          "Dans un restaurant tamisé, l'utilisation modérée de l'éclairage de votre téléphone ou une précision textuelle apporte une aide appréciable.",
        ],
      },
      {
        heading: "3. Deux ou trois mots-clés suffisent amplement",
        paragraphs: [
          "Ajouter une mention comme 'lait écrémé', 'sans sucre', 'steak haché 5 %' ou 'pain complet' lève instantanément toute ambiguïté sur des ingrédients non visibles.",
          "Inutile de rédiger de longues phrases : quelques termes bien ciblés guident l'IA avec une parfaite justesse.",
        ],
      },
    ],
    faqs: [
      {
        question: "Faut-il inclure des couverts comme étalon de taille ?",
        answer:
          "L'assiette, la fourchette ou le verre présents dans le cadre servent déjà de repères d'échelle pour les algorithmes spatiaux.",
      },
      {
        question: "Comment faire si le repas est dans une boîte opaque à emporter ?",
        answer:
          "Ouvrez le couvercle pour dégager la vue sur le contenu ou tapez brièvement le nom du plat commandé.",
      },
    ],
  },
  {
    slug: "ai-calorie-tracker-for-weight-loss",
    title: "Comment réussir sa perte de poids durablement avec un compteur IA",
    description:
      "Déficit calorique sans frustration : comment associer photos, objectifs réalistes et régularité pour mincir en bonne santé.",
    summary:
      "Perdre du poids de façon pérenne repose sur la constance et un léger déficit énergétique. Découvrez comment l'IA vous accompagne au quotidien.",
    category: "Perte de Poids",
    readTime: "6 min de lecture",
    accent: "#efbd44",
    keywords: [
      "compteur calories pour maigrir",
      "deficit calorique durable",
      "perdre du poids sans regime strict",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Le principe fondamental : équilibre énergétique et régularité",
        paragraphs: [
          "Pour réduire la masse grasse, l'organisme doit dépenser légèrement plus d'énergie qu'il n'en absorbe (déficit calorique modéré). Il n'existe aucun raccourci miraculeux ni aliment capable de brûler les graisses à lui seul.",
          "La difficulté majeure ne réside pas dans la théorie, mais dans la capacité à conserver cette régularité durant plusieurs semaines sans céder à la lassitude mentale.",
        ],
      },
      {
        heading: "Pourquoi les restrictions excessives sont vouées à l'échec",
        paragraphs: [
          "Réduire drastiquement ses apports caloriques entraîne presque inévitablement des fringales incontrôlables, une perte de masse musculaire et un arrêt prématuré.",
          "Un déficit modéré de 300 à 500 kcal par jour permet une perte de poids progressive et saine, sans sensation de privation et tout en conservant son énergie pour ses activités.",
        ],
      },
      {
        heading: "Comment la photo renforce vos résultats",
        paragraphs: [
          "Prendre une photo crée un moment de conscience bénéfique avant de manger : vous observez votre assiette et évaluez naturellement la place accordée aux légumes et aux protéines.",
          "En éliminant la lourdeur du décompte manuel, LogMyPlate rend le suivi fluide et naturel dans votre quotidien.",
        ],
      },
    ],
    faqs: [
      {
        question: "Quel déficit calorique quotidien convient le mieux ?",
        answer:
          "Pour la plupart des adultes, un déficit de 300 à 500 calories par rapport aux dépenses de maintien garantit une perte progressive et durable.",
      },
      {
        question: "L'application calcule-t-elle automatiquement mes cibles ?",
        answer:
          "Oui. À partir de votre profil (âge, poids, taille, niveau d'activité physique), LogMyPlate vous propose des objectifs caloriques et de macronutriments sur mesure.",
      },
    ],
  },
  {
    slug: "calorie-tracking-for-home-cooked-food",
    title: "Comment suivre ses repas faits maison sans tout peser au gramme près",
    description:
      "Cessez de perdre du temps à peser l'ail, l'oignon et l'huile. Nos conseils pour enregistrer la cuisine du quotidien simplement par photo.",
    summary:
      "Cuisiner maison est la meilleure décision pour la santé, mais consigner chaque recette est souvent un calvaire. L'IA règle cela en quelques secondes.",
    category: "Cuisine Maison",
    readTime: "5 min de lecture",
    accent: "#70caa3",
    keywords: [
      "suivre calories cuisine maison",
      "compter calories sans balance",
      "journal de repas en famille",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "La lassitude de la pesée ingrédient par ingrédient",
        paragraphs: [
          "Créer des recettes détaillées dans une application classique pour chaque déjeuner familial décourage la plupart des utilisateurs. Personne n'a envie de peser une gousse d'ail, un filet d'huile ou une pincée de sel en pleine préparation.",
          "Conséquence fréquente : le suivi est délaissé le week-end et lors des repas partagés, qui représentent pourtant le cœur de l'alimentation hebdomadaire.",
        ],
      },
      {
        heading: "Photographier l'assiette servie : le raccourci intelligent",
        paragraphs: [
          "En photographiant le plat servi, l'intelligence artificielle examine l'assemblage final, en déduit les proportions et les compare à des milliers de préparations réelles.",
          "Vous gagnez plusieurs minutes à chaque repas et votre journal reste rigoureusement à jour.",
        ],
      },
      {
        heading: "Concentrez votre vigilance sur les éléments à fort impact",
        paragraphs: [
          "Les matières grasses ajoutées, les fromages, les sauces riches et les féculents représentent l'essentiel de l'énergie. Les herbes, les épices et les crudités ont un impact énergétique négligeable.",
          "Gardez un œil sur les graisses de cuisson et laissez l'IA se charger du calcul du reste avec un bon sens pratique.",
        ],
      },
    ],
    faqs: [
      {
        question: "Que faire si ma recette maison contient moins d'huile que la moyenne ?",
        answer:
          "Ajoutez simplement la mention 'cuisine légère' ou 'sans matière grasse' pour que l'IA ajuste l'estimation au standard familial.",
      },
      {
        question: "Puis-je modifier les macronutriments proposés ?",
        answer:
          "Oui, toutes les estimations de calories, protéines, glucides et lipides restent entièrement éditables avant d'enregistrer le repas.",
      },
    ],
  },
  {
    slug: "macro-tracking-with-food-photos",
    title: "Comment analyser protéines, glucides et lipides à partir de photos",
    description:
      "L'équilibre des macronutriments : comment l'IA visuelle décortique votre assiette et vous aide à atteindre vos objectifs quotidiens.",
    summary:
      "Compter uniquement les calories ne dit pas tout. Comprenez comment l'équilibre entre protéines, glucides et lipides conditionne votre satiété et votre énergie.",
    category: "Macronutriments",
    readTime: "6 min de lecture",
    accent: "#ff7e78",
    keywords: [
      "suivi macronutriments par photo",
      "atteindre objectif proteines",
      "equilibre des macros facile",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Pourquoi les macronutriments comptent autant que les calories",
        paragraphs: [
          "Deux repas de 600 calories provoquent des réactions métaboliques radicalement opposées selon que l'un est riche en protéines et fibres et l'autre constitué exclusivement de sucres raffinés et de graisses.",
          "Les protéines préservent la masse musculaire et procurent une satiété durable, les lipides régulent le système hormonal et les glucides alimentent vos efforts quotidiens et vos séances de sport.",
        ],
      },
      {
        heading: "Comment LogMyPlate décompose les macronutriments sur l'image",
        paragraphs: [
          "À partir du cliché, l'IA détermine l'énergie globale en kcal mais aussi les grammes de protéines, de glucides, de lipides et de fibres alimentaires.",
          "Un graphique intuitif vous indique immédiatement si votre assiette correspond à la répartition définie dans votre profil.",
        ],
      },
    ],
    faqs: [
      {
        question: "Quelle quantité de protéines consommer chaque jour ?",
        answer:
          "Pour les personnes actives, un apport de 1,6 à 2,2 g de protéines par kilo de poids corporel constitue une référence largement recommandée.",
      },
      {
        question: "L'application affiche-t-elle les fibres alimentaires ?",
        answer:
          "Oui, la teneur en fibres est mise en avant pour vous aider à préserver votre santé digestive et votre sentiment de satiété.",
      },
    ],
  },
  {
    slug: "calorie-estimate-vs-nutrition-label",
    title: "Estimation par IA versus étiquette nutritionnelle : ce qu'il faut savoir",
    description:
      "Pourquoi même les étiquetages officiels comportent des marges de tolérance et comment utiliser les estimations de l'IA avec discernement.",
    summary:
      "Aucune mesure diététique dans la vie réelle n'est exacte au milligramme près. Comprenez pourquoi la régularité d'un repère fiable est votre meilleur atout.",
    category: "Science Nutritionnelle",
    readTime: "5 min de lecture",
    accent: "#5a98f7",
    keywords: [
      "precision calories par IA",
      "etiquette nutritionnelle marge erreur",
      "fiabilite compteur de calories",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "L'illusion de la précision absolue sur les emballages",
        paragraphs: [
          "Beaucoup s'imaginent que les tableaux nutritionnels imprimés sur les paquets sont d'une rigueur absolue. En réalité, les règlements sanitaires autorisent jusqu'à 20 % d'écart en raison des variations naturelles des récoltes et des procédés de fabrication.",
          "Vouloir peser ses aliments au milligramme près donne une impression de contrôle mathématique en décalage complet avec la réalité biologique.",
        ],
      },
      {
        heading: "Des estimations régulières conduisent aux vrais résultats",
        paragraphs: [
          "L'assimilation intestinale des nutriments varie elle-même d'un jour à l'autre selon la mastication, le sommeil et le microbiote.",
          "L'intérêt d'un outil comme LogMyPlate est de vous maintenir avec constance dans la bonne zone énergétique sans générer de charge mentale inutile.",
        ],
      },
    ],
    faqs: [
      {
        question: "Quelle est la marge d'écart courante de l'IA par photo ?",
        answer:
          "Sur des photos claires, l'écart typique oscille entre 10 % et 15 % par rapport à une pesée en laboratoire, soit un ordre de grandeur comparable à celui des étiquetages industriels.",
      },
      {
        question: "L'application est-elle adaptée pour calculer les doses d'insuline ?",
        answer:
          "Non. Pour les personnes atteintes de diabète de type 1 devant calculer des ratios stricts d'insuline, un pesage au gramme sous contrôle médical demeure indispensable.",
      },
    ],
  },
  {
    slug: "best-calorie-tracker-for-indian-food",
    title: "La meilleure application pour les cuisines traditionnelles et du monde",
    description:
      "Les critères essentiels pour sélectionner une application de suivi calorique capable d'appréhender les plats mijotés et les recettes authentiques.",
    summary:
      "Lassé des outils qui ne reconnaissent que les produits industriels préemballés ? Découvrez ce qu'il faut rechercher pour suivre de vrais repas.",
    category: "Comparatif",
    readTime: "5 min de lecture",
    accent: "#b57bee",
    keywords: [
      "meilleure application compteur calories",
      "application calories cuisine du monde",
      "suivi nutritionnel intelligent",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Pourquoi les applications classiques déçoivent sur la cuisine maison",
        paragraphs: [
          "De nombreuses applications célèbres ont été calibrées pour le marché américain et ses marques industrielles. Elles sont performantes pour scanner une barre chocolatée, mais impuissantes face à un couscous familial, un bœuf bourguignon ou un curry authentique.",
          "L'utilisateur se retrouve contraint de faire des recherches pénibles ou d'abandonner son suivi.",
        ],
      },
      {
        heading: "L'avantage décisif de la reconnaissance par photo",
        paragraphs: [
          "LogMyPlate a été développée pour comprendre les plats cuisinés dans leur ensemble. L'IA perçoit la relation entre féculents, sauces, légumes et viandes sur un seul cliché.",
          "Vous profitez d'une expérience intuitive adaptée à toutes les cultures gastronomiques à travers le monde.",
        ],
      },
    ],
    faqs: [
      {
        question: "L'application LogMyPlate est-elle disponible en français ?",
        answer:
          "Oui ! L'application, le site internet et tous les guides sont intégralement traduits et adaptés en français.",
      },
      {
        question: "L'accès aux fonctions de base est-il payant ?",
        answer:
          "Non. Une formule gratuite complète existe avec des annonces récompensées, complétée par un essai gratuit de 30 jours pour la version Premium.",
      },
    ],
  },
  {
    slug: "how-to-track-misal-pav-calories",
    title: "Comment consigner les plats en sauce avec garnitures et accompagnements",
    description:
      "Apprenez à estimer les repas associant bouillons, sauces, pains et garnitures croustillantes sans calculs fastidieux.",
    summary:
      "Les plats composés de sauces et d'accompagnements multiples semblent souvent impossibles à quantifier. Voici comment la photo simplifie tout.",
    category: "Plats Complexes",
    readTime: "4 min de lecture",
    accent: "#efbd44",
    keywords: [
      "calories plats en sauce",
      "calculer repas avec garnitures",
      "estimer assiettes complexes",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Le défi des préparations multi-éléments",
        paragraphs: [
          "De nombreux plats traditionnels réunissent une sauce parfumée, du pain ou des féculents et des garnitures croustillantes ou des herbes fraîches.",
          "Tenter d'évaluer chaque composant séparément est quasi impossible à table et retire tout plaisir au repas.",
        ],
      },
      {
        heading: "Comment le cliché capture l'ensemble de la composition",
        paragraphs: [
          "Avec LogMyPlate, une vue globale de l'assiette permet de repérer le plat et ses compléments d'accompagnement.",
          "Si vous avez pris du pain supplémentaire ou écarté un ingrédient trop riche, une simple modification manuelle rectifie le décompte.",
        ],
      },
    ],
    faqs: [
      {
        question: "Comment l'IA traite-t-elle les épices et piments forts ?",
        answer:
          "Les épices et piments n'apportent pratiquement aucune calorie. L'IA concentre son évaluation sur les graisses, féculents et protéines présents.",
      },
      {
        question: "Peut-on photographier des goûters ou encas salés ?",
        answer:
          "Oui, la reconnaissance visuelle fonctionne aussi bien pour les encas, viennoiseries et collations que pour les déjeuners complets.",
      },
    ],
  },
  {
    slug: "daily-calorie-target-bmi-guide",
    title: "Comment calculer son objectif calorique quotidien de manière réaliste",
    description:
      "Métabolisme de base, dépenses énergétiques réelles et ajustement de vos apports selon vos objectifs de poids.",
    summary:
      "Trouvez votre juste équilibre énergétique sans régimes fantaisistes ni formules mathématiques rébarbatives.",
    category: "Objectifs Diététiques",
    readTime: "7 min de lecture",
    accent: "#70caa3",
    keywords: [
      "calculer objectif calorique quotidien",
      "calculer metabolisme de base",
      "besoins caloriques journaliers",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Comprendre le métabolisme de base et la dépense totale",
        paragraphs: [
          "Votre métabolisme de base (MB) correspond à l'énergie indispensable à vos fonctions vitales au repos absolu (respiration, cerveau, cœur).",
          "En y ajoutant l'activité physique, vos déplacements et la digestion des aliments, vous obtenez votre dépense énergétique journalière totale (DEJT).",
        ],
      },
      {
        heading: "Fixer une cible calorique adaptée à vos ambitions",
        paragraphs: [
          "Pour mincir : soustrayez environ 300 à 500 kcal à votre dépense globale.",
          "Pour maintenir votre poids : consommez un total équivalent à vos dépenses estimées.",
          "Pour développer votre masse musculaire : visez un léger excédent de 200 à 400 kcal avec un apport soutenu en protéines.",
        ],
      },
      {
        heading: "Fiez-vous à la moyenne hebdomadaire plutôt qu'aux pesées isolées",
        paragraphs: [
          "Le poids corporel oscille tous les jours sous l'effet de l'eau, du sel et du transit. Suivez la moyenne d'une semaine sur l'autre pour juger sereinement de votre progression.",
        ],
      },
    ],
    faqs: [
      {
        question: "Est-il dangereux de manger en dessous de son métabolisme de base ?",
        answer:
          "Oui, cela est fortement déconseillé sur la durée, car cela expose à la fonte musculaire, à une fatigue chronique et à des carences nutritionnelles.",
      },
      {
        question: "À quelle fréquence convient-il de se peser ?",
        answer:
          "Se peser 2 à 3 fois par semaine le matin à jeun et faire la moyenne hebdomadaire offre un indicateur bien plus fiable que la pesée quotidienne.",
      },
    ],
  },
  {
    slug: "food-journal-for-busy-professionals",
    title: "Le journal alimentaire idéal pour les personnes actives et occupées",
    description:
      "Comment garder la maîtrise de son alimentation malgré les réunions, les repas d'affaires et le manque de temps pour cuisiner.",
    summary:
      "Un emploi du temps chargé n'est pas une fatalité pour votre bien-être. Découvrez comment suivre votre alimentation sans y consacrer vos journées.",
    category: "Mode de Vie",
    readTime: "5 min de lecture",
    accent: "#ff7e78",
    keywords: [
      "journal alimentaire vie active",
      "suivi calories travail bureau",
      "manger sainement journee chargee",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Pourquoi les journaux textuels sont inadaptés aux journées intenses",
        paragraphs: [
          "Les professionnels très occupés ne disposent pas de cinq minutes à chaque déjeuner pour pianoter sur leur téléphone à la recherche de chaque ingrédient.",
          "Dès que l'outil exige un investissement trop lourd, il est inévitablement délaissé dès le premier coup de feu au travail.",
        ],
      },
      {
        heading: "La photo comme accélérateur de suivi",
        paragraphs: [
          "Prendre en photo son plateau ou son plat du jour prend 2 secondes. L'image enregistre le repas et vous permet d'examiner le décompte lors d'une pause ultérieure.",
          "Votre journée professionnelle se déroule sans accroc et votre journal demeure parfaitement à jour.",
        ],
      },
    ],
    faqs: [
      {
        question: "L'application fonctionne-t-elle sans connexion Internet au moment de la photo ?",
        answer:
          "Vous pouvez capturer l'image avec votre appareil et la téléverser dans LogMyPlate dès que vous retrouvez une connexion.",
      },
      {
        question: "Le nutritionniste IA peut-il faire le bilan de ma semaine ?",
        answer:
          "Tout à fait. Vous pouvez lui demander : 'Quels ont été mes repas les plus faibles en protéines cette semaine ?' pour obtenir une synthèse instantanée.",
      },
    ],
  },
  {
    slug: "privacy-first-calorie-tracking",
    title: "Priorité à la confidentialité : ce que deviennent vos photos de repas",
    description:
      "Notre engagement de sécurité : vos clichés vous appartiennent et ne sont jamais revendus ni exposés publiquement.",
    summary:
      "Votre alimentation et votre poids sont des données intimes. Découvrez comment notre infrastructure protège rigoureusement votre vie privée.",
    category: "Confidentialité",
    readTime: "4 min de lecture",
    accent: "#5a98f7",
    keywords: [
      "confidentialite compteur calories",
      "securite donnees sante",
      "photos de repas privees",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Vos données de santé méritent une discrétion absolue",
        paragraphs: [
          "Nous sommes convaincus que ce que vous mangez et votre évolution corporelle ne doivent jamais devenir des produits publicitaires pour des courtiers de données.",
          "LogMyPlate traite vos images dans l'unique but de calculer vos estimations et d'alimenter votre carnet personnel.",
        ],
      },
      {
        heading: "Aucun profil public ni obligation sociale",
        paragraphs: [
          "L'application ne propose pas d'abonnés, de mentions 'j'aime' ou de fils publics. C'est un espace personnel dédié à votre santé.",
          "Vous pouvez effacer vos données et supprimer votre compte en quelques clics dans les réglages à tout moment.",
        ],
      },
    ],
    faqs: [
      {
        question: "LogMyPlate vend-il les photos de repas à des annonceurs ?",
        answer:
          "Non, absolument pas. Vos données et clichés ne sont jamais vendus à des tiers sous aucun prétexte.",
      },
      {
        question: "Comment effacer définitivement mon compte ?",
        answer:
          "Accédez à Profil > Réglages > Supprimer mon compte pour purger immédiatement et irrévocablement toutes vos données de nos serveurs.",
      },
    ],
  },
  {
    slug: "rewarded-ads-free-scans-calorie-tracker",
    title: "Scans gratuits avec annonces récompensées : comment ça marche",
    description:
      "Profitez gratuitement d'une IA de pointe en visionnant de courtes vidéos uniquement quand vous le désirez — sans aucun abonnement forcé.",
    summary:
      "Pas de piège d'abonnement : comprenez comment notre système d'annonces récompensées rend le suivi accessible à tous sans frais.",
    category: "Modèle d'Accès",
    readTime: "4 min de lecture",
    accent: "#b57bee",
    keywords: [
      "compteur de calories gratuit",
      "analyse repas IA gratuite",
      "application sans abonnement obligatoire",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Rendre l'intelligence artificielle accessible à chacun",
        paragraphs: [
          "Les modèles de vision par ordinateur nécessitent des infrastructures cloud coûteuses. De nombreuses applications enferment leurs utilisateurs derrière des abonnements obligatoires onéreux.",
          "LogMyPlate choisit un modèle équitable : vous pouvez utiliser l'application gratuitement en regardant une courte vidéo publicitaire récompensée quand vous avez besoin d'un scan.",
        ],
      },
      {
        heading: "Vous gardez le contrôle de votre expérience",
        paragraphs: [
          "Nous ne diffusons pas de bannières intempestives au milieu de vos écrans. C'est vous qui choisissez de déclencher la récompense.",
          "Et si vous souhaitez un confort total sans publicité avec des scans illimités, la formule Premium est proposée à un tarif très accessible.",
        ],
      },
      {
        heading: "30 jours offerts pour le lancement",
        paragraphs: [
          "Pendant la période de lancement, tous les nouveaux inscrits profitent de 30 jours de Premium complets sans engagement.",
        ],
      },
    ],
    faqs: [
      {
        question: "Faut-il saisir une carte bancaire pour les 30 jours gratuits ?",
        answer:
          "Non, aucun moyen de paiement n'est exigé. Au terme des 30 jours, vous décidez librement de souscrire ou de poursuivre sur la formule gratuite.",
      },
      {
        question: "Combien d'analyses gratuites puis-je faire par jour ?",
        answer:
          "Vous pouvez réaliser vos scans quotidiens en débloquant les annonces récompensées disponibles au gré de vos besoins.",
      },
    ],
  },
  {
    slug: "calorie-tracking-for-vegetarian-meals",
    title: "Le suivi calorique pour les régimes végétariens et végétaux",
    description:
      "Comment atteindre son quota de protéines végétales, suivre les légumineuses et maîtriser les graisses cachées des fromages et huiles.",
    summary:
      "L'alimentation végétarienne est riche en nutriments, mais demande de la vigilance sur les protéines et les lipides. Voyez comment l'IA vous épaule.",
    category: "Végétarisme",
    readTime: "6 min de lecture",
    accent: "#efbd44",
    keywords: [
      "compteur calories vegetarien",
      "proteines vegetales dans l'assiette",
      "suivi macronutriments sans viande",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Le défi récurrent des protéines dans l'assiette végétarienne",
        paragraphs: [
          "Sans s'en rendre compte, beaucoup de personnes qui délaissent la viande augmentent de manière disproportionnée leur part de fromages, de féculents ou d'huiles pour se sentir rassasiées.",
          "Cela peut élever l'apport calorique sans pour autant fournir la dose adéquate de protéines pour la tonicité musculaire.",
        ],
      },
      {
        heading: "Les meilleures sources végétales à intégrer",
        paragraphs: [
          "Lentilles, pois chiches, haricots secs, tofu, tempeh, œufs et produits laitiers maigres sont d'excellents piliers nutritionnels.",
          "LogMyPlate identifie ces éléments sur votre photo et met à jour votre total protéique de la journée en temps réel.",
        ],
      },
    ],
    faqs: [
      {
        question: "L'application reconnaît-elle le tofu et les substituts végétaux ?",
        answer:
          "Oui ! Le tofu poêlé, les préparations à base de soja, les steaks végétaux et les légumineuses sont reconnus sans difficulté.",
      },
      {
        question: "Comment limiter l'excès de lipides en mangeant végétarien ?",
        answer:
          "Consultez la répartition des graisses dans votre graphique LogMyPlate et variez vos apports en associant fromages et légumineuses assaisonnées.",
      },
    ],
  },
  {
    slug: "restaurant-meal-calorie-tracking",
    title: "Comment estimer ses calories au restaurant et à l'extérieur sans stress",
    description:
      "Des stratégies simples pour le buffet, les déjeuners professionnels et les matières grasses masquées en cuisine.",
    summary:
      "Déjeuner à l'extérieur fait partie de la vie sociale et professionnelle. Apprenez à consigner vos sorties sans gâcher votre plaisir.",
    category: "Restaurants",
    readTime: "5 min de lecture",
    accent: "#70caa3",
    keywords: [
      "compter calories restaurant",
      "estimer plat du jour dejeuner",
      "suivre repas exterieur sans balance",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Le piège des matières grasses masquées en restauration",
        paragraphs: [
          "Les chefs cuisiniers utilisent traditionnellement plus de beurre, de crème et d'huile pour sublimer les saveurs et apporter du brillant aux assiettes.",
          "Un plat d'apparence légère servi au restaurant peut ainsi renfermer 20 % à 30 % de calories en plus que son équivalent préparé chez vous.",
        ],
      },
      {
        heading: "Le réflexe du cliché discret à table",
        paragraphs: [
          "Prenez une photo discrète de votre assiette avant de déguster. La mention 'restaurant' oriente l'IA pour calibrer les graisses au standard professionnel.",
          "Vous profitez pleinement de vos convives sans avoir à interroger le personnel sur les fiches techniques des plats.",
        ],
      },
    ],
    faqs: [
      {
        question: "Faut-il refuser les invitations pour tenir sa diète ?",
        answer:
          "Surtout pas ! La clé d'un équilibre durable réside dans la flexibilité : enregistrez votre plat et ajustez les repas adjacents en douceur.",
      },
      {
        question: "Peut-on enregistrer des desserts ou des verres de vin ?",
        answer:
          "Oui, une photo d'un dessert ou d'une boisson permet d'en intégrer la valeur dans votre bilan de la journée.",
      },
    ],
  },
  {
    slug: "meal-tracking-for-gym-and-fitness",
    title: "Le suivi nutritionnel au service de la musculation et du sport",
    description:
      "Nutrition pré-entraînement, post-entraînement et apport protéique journalier pour maximiser vos séances en salle.",
    summary:
      "La séance de musculation envoie le signal de croissance, mais c'est l'assiette qui construit le muscle. Optimisez votre suivi avec LogMyPlate.",
    category: "Fitness & Sport",
    readTime: "6 min de lecture",
    accent: "#ff7e78",
    keywords: [
      "nutrition musculation prise de masse",
      "objectif proteines salle de sport",
      "suivi nutritionnel fitness",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "L'impact déterminant de la nutrition sur vos progrès physiques",
        paragraphs: [
          "Quel que soit votre engagement à l'entraînement : sans apports caloriques appropriés et sans acides aminés suffisants, les gains en force et en volume musculaire seront ralentis.",
          "Contrôler vos macronutriments garantit que vos fibres musculaires reçoivent les matériaux indispensables à leur reconstruction après l'effort.",
        ],
      },
      {
        heading: "Organiser ses repas avant et après l'entraînement",
        paragraphs: [
          "Un apport de glucides digestes avant l'effort remplit vos réserves de glycogène pour soutenir des séries intenses.",
          "Après la séance, un repas équilibré associant protéines complètes et glucides amorce immédiatement la récupération tissulaire.",
        ],
      },
    ],
    faqs: [
      {
        question: "Les poudres de protéines sont-elles indispensables pour progresser ?",
        answer:
          "Non. Les shakers sont pratiques, mais vous pouvez tout à fait couvrir vos besoins avec des aliments entiers (œufs, volaille, poisson, légumineuses, fromage blanc).",
      },
      {
        question: "Quelle quantité de protéines le corps assimile-t-il par repas ?",
        answer:
          "Les études récentes indiquent qu'une dose de 30 à 45 g de protéines de qualité par repas est parfaitement mise à profit pour la synthèse musculaire.",
      },
    ],
  },
];

export function getFrGuide(slug: string): Guide | undefined {
  return frGuides.find((g) => g.slug === slug);
}
