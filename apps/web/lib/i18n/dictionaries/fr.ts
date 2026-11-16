import type { Dictionary } from "../types";
import { APP_CONFIG } from "@/config/app";

export const frDictionary: Dictionary = {
  locale: "fr",

  common: {
    languageSwitcherLabel: "Langue",
    selectLanguageAria: "Sélectionner la langue",
    macros: {
      calories: "Calories",
      protein: "Protéines",
      carbs: "Glucides",
      fat: "Lipides",
      fiber: "Fibres",
      sodium: "Sodium",
      sugar: "Sucres",
    },
    units: {
      grams: "g",
      kcal: "kcal",
    },
    notMedicalAdviceNotice:
      "Les estimations fournies par l'IA sont approximatives et ne constituent pas un avis médical. Veuillez toujours consulter un professionnel de santé qualifié pour vos besoins diététiques.",
  },

  nav: {
    howItWorks: "Comment ça marche",
    aiCoach: "Nutritionniste IA",
    guides: "Guides",
    support: "Aide",
    downloadCta: "Télécharger",
    homeAria: "Page d'accueil LogMyPlate",
    mainNavAria: "Navigation principale",
    openMenuAria: "Ouvrir le menu",
    closeMenuAria: "Fermer le menu",
  },

  footer: {
    brandDescription:
      "Enregistrez vos repas avec une simple photo. Estimation immédiate des calories et des macronutriments par intelligence artificielle pour chaque assiette.",
    groupProduct: "Produit",
    groupSupport: "Aide",
    groupLegal: "Légal",
    linkDownload: "Télécharger",
    linkHowItWorks: "Comment ça marche",
    linkGuides: "Guides",
    linkHelpFaq: "Aide & FAQ",
    linkEmailUs: "Contactez-nous",
    linkPrivacy: "Confidentialité",
    linkTerms: "Conditions d'utilisation",
    linkDataDeletion: "Suppression des données",
    linkAppAds: "app-ads.txt",
    copyright: "LogMyPlate. Tous droits réservés.",
    medicalDisclaimer:
      "Les estimations par IA sont données à titre indicatif et ne remplacent pas un suivi médical ou nutritionnel professionnel. Consultez un spécialiste de santé avant tout changement de régime alimentaire.",
  },

  offerRibbon: {
    badge: "🎉 30 jours de Premium offerts pour le lancement",
    highlight: "Téléchargez maintenant",
    suffix: "et commencez votre essai gratuit.",
    ariaLabel: "Offre de lancement : 30 jours de Premium gratuits",
  },

  launchOfferModal: {
    badge: "Offre Spéciale de Lancement",
    title: "Essayez LogMyPlate Premium Gratuitement",
    subtitle:
      "Les nouveaux utilisateurs bénéficient de 30 jours d'accès illimité à l'ensemble des fonctionnalités avancées.",
    feature1: "Analyses de repas par photo illimitées avec l'IA",
    feature2: "Détail complet des macronutriments et micronutriments",
    feature3: "Consultations illimitées avec le nutritionniste par IA",
    note: "Aucune carte bancaire requise. Disponible sur iOS et Android.",
    closeAria: "Fermer la fenêtre d'offre",
  },

  downloadBadges: {
    appStoreAria: "Télécharger LogMyPlate sur l'Apple App Store",
    playStoreAria: "Télécharger LogMyPlate sur le Google Play Store",
  },

  home: {
    metaTitle: "LogMyPlate — Suivez vos repas par photo | Compteur de calories par IA",
    metaDescription:
      "Prenez votre assiette en photo et obtenez vos calories et macronutriments en quelques secondes. Sans code-barres. Adapté aux plats faits maison et du monde entier.",
    hero: {
      badge: "Disponible sur iOS et Android",
      headline: "Photographiez votre repas.",
      headlineBreak: "Calories et macros en un instant.",
      subheadline:
        "Prenez simplement votre assiette en photo. Notre intelligence artificielle identifie les aliments, évalue la portion et calcule instantanément les calories, protéines, glucides et lipides.",
      pillNoBarcode: "Sans aucun code-barres",
      pillCuisines: "Plats maison et cuisine du monde",
      pillThemes: "Thèmes personnalisables",
      altFrenchToast: "Photo de repas avec analyse des portions et nutriments",
      altThaliReview: "Assiette complète avec décomposition des calories et macros",
      altDashboard: "Tableau de bord de l'application LogMyPlate avec objectifs",
    },
    howItWorks: {
      badge: "Comment ça marche",
      title: "Trois étapes simples pour maîtriser votre alimentation",
      flow: [
        {
          eyebrow: "Étape 1",
          title: "Prenez une photo",
          body: "Cadrez votre assiette ou sélectionnez une photo depuis votre galerie. Idéal pour les repas préparés à la maison, les déjeuners au restaurant et les encas.",
          alt: "Prise de vue d'un repas avec un smartphone",
        },
        {
          eyebrow: "Étape 2",
          title: "Vérifiez l'estimation",
          body: "L'IA identifie chaque aliment présent, estime les portions et affiche une répartition claire des calories, protéines, glucides et lipides.",
          alt: "Examen des ingrédients et des macronutriments détectés",
        },
        {
          eyebrow: "Étape 3",
          title: "Suivez votre évolution",
          body: "Vos repas sont organisés dans un journal alimentaire visuel, vous permettant de suivre votre équilibre énergétique et vos objectifs au quotidien.",
          alt: "Suivi des objectifs dans le journal nutritionnel visuel",
        },
      ],
    },
    reviewEstimate: {
      badge: "Précision & Contrôle",
      title: "Vous gardez toujours le contrôle final",
      paragraph1:
        "Même si l'IA reconnaît la grande majorité des aliments avec une remarquable exactitude, vous pouvez ajuster les portions ou modifier les ingrédients en quelques touches.",
      paragraph2:
        "Ajoutez une brève précision si vous avez utilisé plus ou moins d'huile ou remplacé un ingrédient. Votre carnet reste ainsi parfaitement fidèle à votre réalité.",
      macroMixBadge: "Équilibre des Macronutriments",
      altMealDetail: "Écran de détail du repas avec ajustement des portions",
    },
    aiNutritionist: {
      badge: "Nutritionniste IA",
      title: "Des réponses concrètes sur vos habitudes alimentaires",
      paragraph1:
        "Échangez directement avec votre conseiller en nutrition IA au sujet de vos repas de la journée ou de la semaine passée :",
      bullet1: "Vérifiez si votre apport en protéines a été atteint de façon équilibrée.",
      bullet2: "Identifiez les moments de la journée propices aux fringales ou aux excès.",
      bullet3: "Recevez des suggestions personnalisées d'alternatives saines basées sur vos aliments favoris.",
      altChat: "Discussion interactive avec le conseiller en nutrition IA",
      altWeeklySummary: "Bilan hebdomadaire des habitudes nutritionnelles",
    },
    themes: {
      badge: "Personnalisation",
      title: "Choisissez l'univers visuel qui vous correspond",
      subtitle:
        "Plus de 10 thèmes conçus avec soin — de l'obscurité sobre et minimaliste aux nuances naturelles et vitaminées.",
      cards: [
        { label: "Matcha", alt: "Thème Matcha dans LogMyPlate" },
        { label: "Baie", alt: "Thème Baie dans LogMyPlate" },
        { label: "Onyx Sombre", alt: "Thème Onyx Sombre dans LogMyPlate" },
        { label: "Crépuscule", alt: "Thème Crépuscule dans LogMyPlate" },
      ],
    },
    premium: {
      srTitle: "Abonnements et Tarifs",
      bannerAltLandscape: "Comparaison des fonctionnalités gratuites et Premium",
      bannerAltPortrait: "Avantages de la formule LogMyPlate Premium",
      intro:
        "LogMyPlate vous offre une expérience gratuite complète pour le suivi de vos repas. Pour des analyses approfondies et des scans illimités, la formule Premium débloque des outils exclusifs.",
      tiers: [
        {
          label: "Gratuit",
          accent: "Toujours gratuit",
          perks: [
            "Scans par IA avec courtes annonces récompensées",
            "Calcul précis des calories et macronutriments",
            "Journal alimentaire visuel",
            "Historique complet de vos repas",
          ],
        },
        {
          label: "Premium",
          accent: "Le plus populaire",
          perks: [
            "Scans photo illimités sans aucune publicité",
            "Consultations illimitées avec le nutritionniste IA",
            "Détail avancé des micronutriments et fibres",
            "Accès prioritaire aux nouvelles fonctionnalités",
          ],
        },
      ],
      note: "Tarifs locaux affichés en toute transparence sur l'App Store de votre région.",
    },
    ctaSection: {
      title: "Prenez en main votre nutrition en toute simplicité dès aujourd'hui",
      subtitle:
        "Disponible gratuitement sur iPhone et Android. Téléchargez l'application et découvrez la commodité du suivi de vos repas par photo.",
      privacyLink: "Nous accordons une priorité absolue à la confidentialité de vos données.",
    },
  },

  download: {
    metaTitle: "Télécharger LogMyPlate — Compteur de calories par IA pour iOS et Android",
    metaDescription:
      "Téléchargez l'application LogMyPlate pour iPhone et Android. Photographiez vos assiettes et découvrez vos calories et macronutriments sans scanner de code-barres.",
    badge: "Téléchargement Officiel",
    headlinePrefix: "Installez",
    headlineBrand: "LogMyPlate",
    headlineSubtitle: "sur votre smartphone",
    description:
      "Disponible pour iPhone (iOS 16+) et smartphones Android (Android 10+). Installez l'application gratuitement et profitez d'une méthode beaucoup plus rapide pour tenir votre journal alimentaire.",
    featuresHeading: "Ce qui vous attend dans l'application :",
    features: [
      "Reconnaissance visuelle instantanée des plats faits maison et des repas pris à l'extérieur",
      "Calcul automatique des calories, protéines, glucides, lipides et fibres",
      "Échanges interactifs avec votre nutritionniste personnel alimenté par l'IA",
      "Journal alimentaire illustré pour visualiser votre progression en un coup d'œil",
      "Thèmes personnalisables en mode clair et sombre pour un confort visuel optimal",
      "Aucune publicité intempestive obligatoire — vous conservez la maîtrise de votre temps",
    ],
  },

  support: {
    metaTitle: "Support & Centre d'aide — LogMyPlate",
    metaDescription:
      "Questions fréquentes sur LogMyPlate, l'analyse des repas par photo, la restauration d'abonnements et l'assistance directe par notre équipe.",
    badge: "Centre d'Aide",
    headline: "Comment pouvons-nous vous aider ?",
    subtitle:
      "Retrouvez ici les réponses aux interrogations les plus fréquentes ou contactez directement notre équipe d'assistance.",
    contactBoxHeading: "Besoin d'une aide personnalisée ?",
    contactBoxText:
      "Pour toute question relative à votre compte, à vos abonnements ou pour nous suggérer une amélioration, n'hésitez pas à nous envoyer un message.",
    contactButton: `Envoyer un e-mail à ${APP_CONFIG.supportEmail}`,
    faqs: [
      {
        q: "Comment LogMyPlate estime-t-il les calories à partir d'une photo ?",
        a: "Nous employons des modèles de vision par ordinateur entraînés à reconnaître les aliments, les modes de cuisson et les volumes dans l'assiette. Le système évalue visuellement les portions et croise ces données avec des bases de données nutritionnelles de référence.",
      },
      {
        q: "Les estimations de l'IA sont-elles fiables à 100 % ?",
        a: "Ces estimations constituent des approximations raisonnées basées sur les aliments visibles. Pour la majorité des repas, la précision est remarquable. Les matières grasses de cuisson ou condiments cachés peuvent varier, mais vous pouvez ajuster manuellement les quantités à tout moment.",
      },
      {
        q: "Faut-il scanner des codes-barres pour enregistrer ses repas ?",
        a: "Non ! LogMyPlate a été conçu spécifiquement pour vous affranchir de la saisie manuelle et des codes-barres. Une simple photo du plat terminé suffit.",
      },
      {
        q: "Comment fonctionne l'offre de lancement de 30 jours gratuits ?",
        a: "En installant l'application pendant la période de lancement, vous bénéficiez automatiquement de 30 jours d'accès complet à la formule Premium, sans renseigner de coordonnées bancaires.",
      },
      {
        q: "Comment restaurer un abonnement souscrit précédemment ?",
        a: "Dans l'application, ouvrez l'onglet Profil > Réglages > Abonnement et touchez 'Restaurer les achats'. Vos droits seront synchronisés avec l'App Store ou Google Play.",
      },
      {
        q: "Mes photos de repas demeurent-elles confidentielles ?",
        a: "Oui, sans exception. Vos photos sont traitées exclusivement pour l'analyse nutritionnelle. Nous ne vendons pas vos données et vous pouvez supprimer votre compte à tout moment.",
      },
    ],
  },

  privacy: {
    metaTitle: "Politique de Confidentialité — LogMyPlate",
    metaDescription:
      "Découvrez comment LogMyPlate collecte, protège et traite vos données personnelles et vos photos de repas. Transparence et sécurité totales.",
    badge: "Confidentialité",
    headline: "Politique de Confidentialité",
    lastUpdated: "Dernière mise à jour : 15 novembre 2026",
    legallyBindingNotice:
      "Mention légale : La version originale en langue anglaise de la présente Politique de Confidentialité est la seule version juridiquement contraignante. Cette traduction en français est mise à votre disposition uniquement pour votre commodité.",
    sections: [
      {
        title: "1. Introduction et engagement en matière de vie privée",
        content: [
          "LogMyPlate accorde une importance fondamentale au respect de la vie privée de ses utilisateurs. La présente politique explique comment nous recueillons, utilisons et protégeons vos données lors de l'utilisation de notre application mobile et de notre site internet.",
          "Nous ne vendons aucune donnée personnelle à des tiers et nous n'exploitons pas vos photos de repas à des fins commerciales sans rapport avec le service.",
        ],
      },
      {
        title: "2. Données collectées",
        content: [
          "Photos de repas : Les clichés capturés ou importés sont analysés par nos algorithmes d'IA pour identifier les denrées alimentaires et estimer leurs valeurs nutritionnelles.",
          "Données nutritionnelles et objectifs : Nous enregistrons vos historiques de repas, vos cibles de macronutriments, vos mesures de poids et vos préférences.",
          "Données techniques anonymisées : Des identifiants techniques d'appareil, la version du système d'exploitation et des rapports d'erreurs sont collectés pour assurer le bon fonctionnement technique de l'application.",
        ],
      },
      {
        title: "3. Finalités du traitement des données",
        content: [
          "Vos données sont traitées exclusivement pour : (a) fournir la reconnaissance visuelle et le calcul nutritionnel ; (b) maintenir synchronisé votre journal alimentaire ; (c) répondre à vos demandes de support technique ; et (d) optimiser les performances de notre plateforme.",
        ],
      },
      {
        title: "4. Sécurité et conservation des données",
        content: [
          "Toutes les communications bénéficient d'un chiffrement TLS conforme aux normes actuelles les plus strictes. Les données sont stockées au sein de centres de données cloud hautement sécurisés.",
        ],
      },
      {
        title: "5. Vos droits d'accès et de suppression",
        content: [
          "Conformément aux réglementations sur la protection des données, vous disposez d'un droit d'accès, de rectification et d'effacement complet de l'ensemble de vos données personnelles.",
          "Vous pouvez supprimer votre compte directement dans l'application via Réglages > Supprimer mon compte, ou formuler une demande depuis notre page de suppression de données.",
        ],
      },
      {
        title: "6. Sous-traitants et partenaires tiers",
        content: [
          "Nous faisons appel à des prestataires de confiance pour l'hébergement cloud, les calculs d'intelligence artificielle, le traitement des paiements (Apple et Google) et la régie publicitaire de la version gratuite. Ces prestataires traitent vos données dans le respect strict des réglementations applicables.",
        ],
      },
      {
        title: "7. Contact pour la protection des données",
        content: [
          `Pour toute question relative à vos données personnelles, veuillez contacter notre délégué à la protection des données à : ${APP_CONFIG.supportEmail}.`,
        ],
      },
    ],
  },

  terms: {
    metaTitle: "Conditions d'Utilisation — LogMyPlate",
    metaDescription:
      "Conditions générales d'utilisation de l'application et du site internet LogMyPlate. Modalités d'accès, responsabilités et clauses légales.",
    badge: "Conditions",
    headline: "Conditions d'Utilisation",
    lastUpdated: "Dernière mise à jour : 15 novembre 2026",
    legallyBindingNotice:
      "Mention légale : La version originale anglaise des présentes Conditions d'Utilisation constitue le seul texte juridiquement opposable. Cette traduction vous est proposée uniquement à des fins d'information.",
    medicalDisclaimerHeading: "Avertissement important : Absence d'avis médical",
    medicalDisclaimerText:
      "LogMyPlate est un outil technologique d'aide au suivi nutritionnel au quotidien. Les estimations de calories, les décomptes de macronutriments et les réponses du nutritionniste IA NE CONSTITUENT EN AUCUN CAS un diagnostic médical, une consultation médicale ou une prescription diététique clinique. Consultez impérativement un professionnel de santé ou un diététicien qualifié avant d'entreprendre des modifications substantielles de vos habitudes alimentaires.",
    sections: [
      {
        title: "1. Acceptation des conditions",
        content: [
          "En téléchargeant, installant ou utilisant l'application ou le site internet LogMyPlate, vous acceptez d'être pleinement lié par l'ensemble des présentes conditions d'utilisation.",
        ],
      },
      {
        title: "2. Utilisation licite et personnelle",
        content: [
          "Le service vous est accordé à titre strictement personnel et non commercial. Il est prohibé de porter atteinte à la sécurité de l'application, de décompiler le code source ou de saturer abusivement nos infrastructures d'intelligence artificielle.",
        ],
      },
      {
        title: "3. Abonnements et achats intégrés",
        content: [
          "LogMyPlate propose des fonctionnalités gratuites ainsi que des formules d'abonnement Premium facultatives. La facturation s'effectue directement par l'Apple App Store ou le Google Play Store selon leurs modalités propres.",
          "La résiliation de tout abonnement doit être effectuée directement dans les paramètres de compte de votre boutique d'applications.",
        ],
      },
      {
        title: "4. Propriété intellectuelle",
        content: [
          "L'ensemble des droits d'auteur, marques déposées, chartes graphiques, logos et codes informatiques de LogMyPlate demeurent la propriété exclusive de leurs créateurs respectifs.",
        ],
      },
      {
        title: "5. Limitation de responsabilité",
        content: [
          "Le service est fourni 'en l'état'. Nous ne garantissons pas l'infaillibilité absolue des estimations nutritionnelles visuelles. L'utilisateur demeure seul responsable de ses choix diététiques.",
        ],
      },
      {
        title: "6. Modification des conditions",
        content: [
          "Nous nous réservons le droit de mettre à jour ces conditions. La date mentionnée en en-tête fait foi pour la version en vigueur.",
        ],
      },
      {
        title: "7. Contact",
        content: [
          `Pour toute question concernant les présentes conditions, veuillez nous écrire à : ${APP_CONFIG.supportEmail}.`,
        ],
      },
    ],
  },

  dataDeletion: {
    metaTitle: "Suppression du Compte et des Données — LogMyPlate",
    metaDescription:
      "Guide clair pour demander l'effacement définitif et complet de votre compte et de vos données sur LogMyPlate.",
    badge: "Suppression de Données",
    headline: "Comment demander la suppression de vos données",
    intro:
      "Vous exercez un contrôle absolu sur vos informations personnelles. Si vous choisissez de ne plus utiliser LogMyPlate, vous pouvez effacer définitivement l'ensemble de vos données.",
    inAppHeading: "Option 1 : Suppression directe dans l'application (Recommandé)",
    inAppSteps: [
      "Ouvrez l'application LogMyPlate sur votre appareil.",
      "Accédez à l'onglet 'Profil' en bas de l'écran.",
      "Touchez l'icône de roue crantée des 'Réglages'.",
      "Faites défiler vers le bas et touchez 'Supprimer le compte'.",
      "Confirmez votre choix dans la boîte de dialogue.",
    ],
    inAppNote:
      "La suppression au sein de l'application est immédiate et irréversible : l'intégralité de vos photos, historiques et préférences sera effacée.",
    openAppButton: "Ouvrir l'application LogMyPlate",
    webHeading: "Option 2 : Demande par e-mail",
    webText:
      "Si vous avez déjà désinstallé l'application de votre appareil, vous pouvez formuler votre demande par simple e-mail à notre équipe.",
    webEmailSubject: "Demande de suppression de compte et de données - LogMyPlate",
    webEmailButton: `Écrire à ${APP_CONFIG.supportEmail}`,
    retentionHeading: "Que se passe-t-il après votre demande d'effacement ?",
    retentionText:
      "Tous vos clichés de repas, historiques de macronutriments et profils personnels sont définitivement détruits sur nos serveurs. Seules les pièces justificatives comptables strictement requises par la loi sont archivées pour la durée légale obligatoire.",
  },

  caloriesIndex: {
    metaTitle: "Répertoire des Calories — Valeurs Réelles par Portion",
    metaDescription:
      "Consultez les calories et macronutriments des aliments courants par portions réelles du quotidien plutôt que pour 100 grammes abstraits.",
    badge: "Répertoire des Calories",
    headline: "Calories et macronutriments par portion réelle",
    subtitle:
      "La plupart des applications indiquent les valeurs nutritionnelles uniquement pour 100g. Chez LogMyPlate, nous vous donnons les vrais repères : par assiette, bol et pièce.",
    tierIndian: "Plats Traditionnels & Accompagnements",
    tierGlobal: "Aliments du Quotidien",
    viewFoodButton: "Consulter les valeurs",
    per100gBadge: "Pour 100g",
    portionsBadge: "Portions Réelles",
  },

  guidesIndex: {
    metaTitle: "Guides & Blog — Nutrition, Calories & Conseils IA",
    metaDescription:
      "Articles complets et conseils pratiques sur le décompte des calories, l'équilibre des macronutriments et le journal alimentaire par photo avec LogMyPlate.",
    badge: "Guides & Articles",
    headline: "Mieux manger grâce à l'accompagnement de l'IA",
    subtitle:
      "Des explications claires et des méthodes concrètes pour développer une relation sereine et éclairée avec votre alimentation au quotidien.",
    readArticleButton: "Lire l'article",
    minReadSuffix: "min de lecture",
  },
};
