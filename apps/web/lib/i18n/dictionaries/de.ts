import type { Dictionary } from "../types";
import { APP_CONFIG } from "@/config/app";

export const deDictionary: Dictionary = {
  locale: "de",

  common: {
    languageSwitcherLabel: "Sprache",
    selectLanguageAria: "Sprache auswählen",
    macros: {
      calories: "Kalorien",
      protein: "Protein",
      carbs: "Kohlenhydrate",
      fat: "Fett",
      fiber: "Ballaststoffe",
      sodium: "Natrium",
      sugar: "Zucker",
    },
    units: {
      grams: "g",
      kcal: "kcal",
    },
    notMedicalAdviceNotice:
      "KI-Schätzungen sind Näherungswerte und stellen keine medizinische Beratung dar. Konsultiere bei gesundheitlichen oder ernährungsspezifischen Fragen stets qualifiziertes medizinisches Fachpersonal.",
  },

  nav: {
    howItWorks: "So funktioniert's",
    aiCoach: "KI-Ernährungsberater",
    guides: "Ratgeber",
    support: "Hilfe",
    downloadCta: "App laden",
    homeAria: "LogMyPlate Startseite",
    mainNavAria: "Hauptnavigation",
    openMenuAria: "Menü öffnen",
    closeMenuAria: "Menü schließen",
  },

  footer: {
    brandDescription:
      "Erfasse Mahlzeiten mit einem einzigen Foto. Präzise KI-Schätzung von Kalorien und Makronährstoffen für jedes Gericht.",
    groupProduct: "Produkt",
    groupSupport: "Hilfe",
    groupLegal: "Rechtliches",
    linkDownload: "App laden",
    linkHowItWorks: "So funktioniert's",
    linkGuides: "Ratgeber",
    linkHelpFaq: "Hilfe & FAQ",
    linkEmailUs: "Kontakt per E-Mail",
    linkPrivacy: "Datenschutz",
    linkTerms: "AGB",
    linkDataDeletion: "Datenlöschung",
    linkAppAds: "app-ads.txt",
    copyright: "LogMyPlate. Alle Rechte vorbehalten.",
    medicalDisclaimer:
      "KI-Schätzungen sind Näherungswerte und ersetzen keine professionelle medizinische Beratung. Halte vor grundlegenden Ernährungsumstellungen Rücksprache mit qualifizierten Fachkräften.",
  },

  offerRibbon: {
    badge: "🎉 30 Tage Premium kostenlos zum Start",
    highlight: "Jetzt laden",
    suffix: "und deine kostenlose Testphase starten.",
    ariaLabel: "Einführungsangebot: 30 Tage Premium kostenlos",
  },

  launchOfferModal: {
    badge: "Exklusives Einführungsangebot",
    title: "Teste LogMyPlate Premium kostenlos",
    subtitle:
      "Neue Nutzer erhalten 30 Tage lang unbegrenzten Zugriff auf alle Premium-Funktionen.",
    feature1: "Unbegrenzte KI-Mahlzeiten-Scans per Foto",
    feature2: "Vollständige Aufschlüsselung von Makro- und Mikronährstoffen",
    feature3: "Unbegrenzte Chat-Beratung mit dem KI-Ernährungsberater",
    note: "Keine Kreditkarte erforderlich. Verfügbar für iOS und Android.",
    closeAria: "Angebotsfenster schließen",
  },

  downloadBadges: {
    appStoreAria: "LogMyPlate im Apple App Store herunterladen",
    playStoreAria: "LogMyPlate im Google Play Store herunterladen",
  },

  home: {
    metaTitle: "LogMyPlate — Mahlzeiten per Foto erfassen | KI-Kalorientracker",
    metaDescription:
      "Fotografiere deinen Teller und erfasse Kalorien und Makros in Sekundenschnelle. Kein Barcode-Scannen nötig. Unterstützt Hausmannskost und internationale Gerichte.",
    hero: {
      badge: "Verfügbar für iOS und Android",
      headline: "Tracke Mahlzeiten mit einem Foto.",
      headlineBreak: "Kalorien und Makros in Sekunden.",
      subheadline:
        "Fotografiere einfach deinen Teller. Unsere künstliche Intelligenz erkennt die Mahlzeit, schätzt die Portionsgröße und berechnet Kalorien, Eiweiß, Kohlenhydrate und Fett sofort.",
      pillNoBarcode: "Kein Barcode erforderlich",
      pillCuisines: "Hausmannskost & internationale Gerichte",
      pillThemes: "Individuelle Farbthemen",
      altFrenchToast: "Mahlzeit mit Portions- und Makroerkennung",
      altThaliReview: "Traditioneller Teller mit Nährwertaufschlüsselung",
      altDashboard: "LogMyPlate Dashboard mit Tageszielen",
    },
    howItWorks: {
      badge: "So funktioniert's",
      title: "Drei einfache Schritte zu deiner Ernährungskontrolle",
      flow: [
        {
          eyebrow: "Schritt 1",
          title: "Foto aufnehmen",
          body: "Richte die Kamera auf deinen Teller oder wähle ein Bild aus deiner Galerie. Funktioniert für selbstgekochtes Essen, Restaurantgerichte und schnelle Snacks.",
          alt: "Foto einer Mahlzeit aufnehmen",
        },
        {
          eyebrow: "Schritt 2",
          title: "Schätzung prüfen",
          body: "Die KI erkennt die einzelnen Komponenten, schätzt die Portionsmengen und schlüsselt Kalorien, Protein, Kohlenhydrate und Fett übersichtlich auf.",
          alt: "Überprüfung der erkannten Zutaten und Nährwerte",
        },
        {
          eyebrow: "Schritt 3",
          title: "Fortschritt verfolgen",
          body: "Deine Mahlzeiten werden in einem visuellen Ernährungstagebuch gespeichert, damit du deine Energiebilanz und Ziele jederzeit im Blick behältst.",
          alt: "Mahlzeitentagebuch mit Wochenübersicht",
        },
      ],
    },
    reviewEstimate: {
      badge: "Präzision & Kontrolle",
      title: "Du behältst immer die volle Kontrolle",
      paragraph1:
        "Auch wenn die KI die allermeisten Gerichte automatisch zielsicher erfasst, kannst du Portionen, Gewichte oder Zutaten jederzeit mit wenigen Fingertipps anpassen.",
      paragraph2:
        "Füge eine kurze Notiz hinzu, falls du mehr oder weniger Öl verwendet oder Zutaten ausgetauscht hast. So bleibt dein Tagebuch exakt.",
      macroMixBadge: "Makronährstoff-Verhältnis",
      altMealDetail: "Mahlzeitendetailansicht mit Portionsanpassung",
    },
    aiNutritionist: {
      badge: "KI-Ernährungsberater",
      title: "Konkrete Antworten auf deine Ernährungsfragen",
      paragraph1:
        "Sprich direkt mit deinem KI-Assistenten über deine Mahlzeiten des Tages oder der vergangenen Woche:",
      bullet1: "Finde heraus, ob du dein tägliches Proteinziel ausgewogen erreicht hast.",
      bullet2: "Erkenne Muster, die abends zu Heißhungerattacken oder übermäßigem Snacken führen.",
      bullet3: "Erhalte praktische Vorschläge für gesündere Alternativen basierend auf dem, was du gerne isst.",
      altChat: "Chatverlauf mit dem KI-Ernährungsberater",
      altWeeklySummary: "Wöchentliche Zusammenfassung des Ernährungsverhaltens",
    },
    themes: {
      badge: "Design",
      title: "Wähle das Design, das zu dir passt",
      subtitle:
        "Über 10 sorgfältig gestaltete Themes — vom minimalistischen Dunkelmodus bis hin zu frischen Farben aus der Natur.",
      cards: [
        { label: "Matcha", alt: "LogMyPlate Matcha Theme" },
        { label: "Beere", alt: "LogMyPlate Beeren Theme" },
        { label: "Onyx Dunkel", alt: "LogMyPlate Onyx Dark Theme" },
        { label: "Dämmerung", alt: "LogMyPlate Dämmerung Theme" },
      ],
    },
    premium: {
      srTitle: "Abonnements & Preise",
      bannerAltLandscape: "Vergleich von kostenlosen und Premium-Funktionen",
      bannerAltPortrait: "Vorteile von LogMyPlate Premium",
      intro:
        "LogMyPlate bietet dir ein vollwertiges kostenloses Erlebnis für deine täglichen Mahlzeiten. Für alle, die uneingeschränkte Scans und tiefgehende Analysen möchten, schaltet Premium zusätzliche Werkzeuge frei.",
      tiers: [
        {
          label: "Kostenlos",
          accent: "Dauerhaft gratis",
          perks: [
            "KI-Scans über optionale, kurze Werbebelohnungen",
            "Vollständige Schätzung von Kalorien und Hauptmakros",
            "Visuelles Mahlzeitentagebuch",
            "Lückenlose Mahlzeitenhistorie",
          ],
        },
        {
          label: "Premium",
          accent: "Beliebteste Wahl",
          perks: [
            "Unbegrenzte Foto-Scans ohne jede Werbung",
            "Unbegrenzte Gespräche mit dem KI-Ernährungsberater",
            "Detaillierte Mikronährstoff- und Ballaststoffanalysen",
            "Vorzeitiger Zugang zu neuen Funktionen",
          ],
        },
      ],
      note: "Regionale Preise werden transparent im jeweiligen App Store angezeigt.",
    },
    ctaSection: {
      title: "Starte noch heute mit mühelosem Mahlzeiten-Tracking",
      subtitle:
        "Kostenlos verfügbar für iPhone und Android. Lade die App herunter und erlebe, wie einfach Kalorientracken per Foto sein kann.",
      privacyLink: "Wir legen höchsten Wert auf deine Privatsphäre und Datensicherheit.",
    },
  },

  download: {
    metaTitle: "LogMyPlate herunterladen — KI-Kalorientracker für iOS & Android",
    metaDescription:
      "Lade die LogMyPlate App für iPhone oder Android herunter. Fotografiere dein Essen und erfahre Kalorien und Makros sofort — ohne Barcodes.",
    badge: "Offizieller Download",
    headlinePrefix: "Hole dir",
    headlineBrand: "LogMyPlate",
    headlineSubtitle: "auf dein Smartphone",
    description:
      "Verfügbar für iPhone (iOS 16+) und Android-Smartphones (Android 10+). Installiere die App kostenlos und tracke deine Ernährung schneller als je zuvor.",
    featuresHeading: "Das erwartet dich in der App:",
    features: [
      "Sofortige Foto-Erkennung von selbstgekochtem Essen und Gastronomiegerichten",
      "Automatische Berechnung von Kalorien, Eiweiß, Kohlenhydraten, Fett und Ballaststoffen",
      "Interaktiver Chat mit dem intelligenten KI-Ernährungsberater",
      "Visuelles Mahlzeitentagebuch für einfache Fortschrittskontrolle",
      "Anpassbare Hell- und Dunkel-Themes für deine persönliche Wohlfühloberfläche",
      "Keine nervige Zwangswerbung — du behältst jederzeit die volle Kontrolle",
    ],
  },

  support: {
    metaTitle: "Hilfe & Support — LogMyPlate",
    metaDescription:
      "Häufig gestellte Fragen zu LogMyPlate, Foto-KI-Scans, Abo-Wiederherstellung und direktem Kontakt zu unserem Support-Team.",
    badge: "Hilfe-Center",
    headline: "Wie können wir dir helfen?",
    subtitle:
      "Hier findest du Antworten auf die häufigsten Fragen oder kannst dich direkt an unser Support-Team wenden.",
    contactBoxHeading: "Benötigst du persönliche Unterstützung?",
    contactBoxText:
      "Wenn du Fragen zu deinem Account, Abonnements oder Anregungen für neue Funktionen hast, schreibe unserem Team gerne eine E-Mail.",
    contactButton: `E-Mail an ${APP_CONFIG.supportEmail} senden`,
    faqs: [
      {
        q: "Wie schätzt LogMyPlate Kalorien anhand von Fotos?",
        a: "Wir nutzen fortschrittliche Bilderkennungsmodelle, die auf Zutaten, Zubereitungsarten und räumliche Volumina trainiert sind. Das System schätzt die Portionsgröße visuell ab und gleicht sie mit validierten Nährwertdatenbanken ab.",
      },
      {
        q: "Sind die KI-Nährwertschätzungen zu 100 % exakt?",
        a: "Die Schätzungen sind Näherungswerte basierend auf dem sichtbaren Teller. Für die meisten Mahlzeiten erreicht das System eine sehr hohe Treffsicherheit. Versteckte Fette oder spezielle Gewürze können variieren; du kannst Mengenangaben aber jederzeit manuell anpassen.",
      },
      {
        q: "Muss ich Barcodes einscannen, um Essen zu protokollieren?",
        a: "Nein! LogMyPlate wurde speziell dafür entwickelt, lästiges Barcode-Scannen und Tippen überflüssig zu machen. Ein Foto des fertigen Tellers genügt vollkommen.",
      },
      {
        q: "Wie funktioniert das 30-Tage-Einführungsangebot?",
        a: "Wenn du die App während des Startzeitraums installierst, erhältst du automatisch 30 Tage kostenlosen Zugriff auf alle Premium-Features — ganz ohne Eingabe von Zahlungsdaten.",
      },
      {
        q: "Wie stelle ich einen früheren In-App-Kauf wieder her?",
        a: "Öffne die App, navigiere zu Profil > Einstellungen > Abonnement und tippe auf 'Käufe wiederherstellen'. Das System synchronisiert deine Berechtigung mit dem Apple App Store bzw. Google Play Store.",
      },
      {
        q: "Bleiben meine Mahlzeiten-Fotos privat?",
        a: "Ja, absolut. Deine Fotos werden ausschließlich für die Nährwertanalyse verarbeitet. Wir verkaufen deine Daten nicht an Dritte und du kannst deine Daten jederzeit vollständig löschen.",
      },
    ],
  },

  privacy: {
    metaTitle: "Datenschutzrichtlinie — LogMyPlate",
    metaDescription:
      "Erfahre, wie LogMyPlate deine personenbezogenen Daten und Mahlzeiten-Fotos schützt, verarbeitet und speichert. Vollständige Transparenz und Sicherheit.",
    badge: "Datenschutz",
    headline: "Datenschutzrichtlinie",
    lastUpdated: "Zuletzt aktualisiert: 15. November 2026",
    legallyBindingNotice:
      "Rechtlicher Hinweis: Die englische Originalfassung dieser Datenschutzrichtlinie ist rechtlich verbindlich. Diese Übersetzung dient ausschließlich Informationszwecken und deiner Bequemlichkeit.",
    sections: [
      {
        title: "1. Einleitung und unser Versprechen",
        content: [
          "LogMyPlate legt höchsten Wert auf den Schutz deiner Privatsphäre. Diese Richtlinie erläutert, wie wir Daten erheben, verarbeiten und schützen, wenn du unsere mobile Anwendung und Website nutzt.",
          "Wir verkaufen keine personenbezogenen Daten an Werbetreibende und nutzen deine privaten Mahlzeiten-Fotos nicht für marketingfremde Zwecke.",
        ],
      },
      {
        title: "2. Welche Daten wir erheben",
        content: [
          "Mahlzeiten-Fotos: Hochgeladene oder aufgenommene Bilder werden durch KI-Systeme verarbeitet, um Nahrungsmittelkomponenten und Nährwerte zu berechnen.",
          "Ernährungs- und Zieldaten: Wir speichern deine geloggten Mahlzeiten, Makronährstoffziele, dein Gewicht und persönliche Einstellungen, um deinen Verlauf darzustellen.",
          "Technische Telemetriedaten: Anonyme Geräte-IDs, Betriebssystemversionen und Absturzberichte werden erhoben, um die Stabilität und Sicherheit der App zu gewährleisten.",
        ],
      },
      {
        title: "3. Zweck der Datenverarbeitung",
        content: [
          "Wir verarbeiten deine Daten ausschließlich, um: (a) die optische Mahlzeitenerkennung bereitzustellen; (b) dein Ernährungstagebuch synchron zu halten; (c) Support-Anfragen zu bearbeiten; und (d) die technische Zuverlässigkeit der App sicherzustellen.",
        ],
      },
      {
        title: "4. Datenspeicherung und Sicherheitsstandards",
        content: [
          "Alle Datenübertragungen erfolgen verschlüsselt über TLS-Verbindungen nach aktuellem Industriestandard. Die Speicherung erfolgt in geschützten Cloud-Rechenzentren mit strengen Zugangskontrollen.",
        ],
      },
      {
        title: "5. Deine Rechte und Löschung von Daten",
        content: [
          "Du hast jederzeit das Recht auf Auskunft, Berichtigung und vollständige Löschung deiner personenbezogenen Daten.",
          "Du kannst deinen Account direkt in der App unter Einstellungen > Account löschen entfernen oder eine Anfrage über unsere Datenlöschungsseite stellen.",
        ],
      },
      {
        title: "6. Dienstleister und Dritte",
        content: [
          "Wir setzen vertrauenswürdige Dienstleister für Cloud-Infrastruktur, KI-Inferenz, Zahlungsabwicklung (Apple und Google) sowie Werbeplattformen für die Gratisversion ein. Diese Anbieter verarbeiten Daten streng nach geltenden Datenschutzgesetzen.",
        ],
      },
      {
        title: "7. Kontakt bei Datenschutzfragen",
        content: [
          `Bei Fragen zu dieser Datenschutzerklärung oder zur Ausübung deiner Rechte wende dich bitte an: ${APP_CONFIG.supportEmail}.`,
        ],
      },
    ],
  },

  terms: {
    metaTitle: "Nutzungsbedingungen (AGB) — LogMyPlate",
    metaDescription:
      "Allgemeine Geschäfts- und Nutzungsbedingungen für die LogMyPlate App und Website. Rechtliche Hinweise, Haftungsausschluss und Richtlinien.",
    badge: "AGB",
    headline: "Nutzungsbedingungen",
    lastUpdated: "Zuletzt aktualisiert: 15. November 2026",
    legallyBindingNotice:
      "Rechtlicher Hinweis: Die englische Originalfassung dieser Nutzungsbedingungen ist rechtlich verbindlich. Diese Übersetzung dient ausschließlich deiner Information.",
    medicalDisclaimerHeading: "Wichtiger Hinweis: Keine medizinische Beratung",
    medicalDisclaimerText:
      "LogMyPlate ist ein technologisches Hilfsmittel zur Ernährungsdokumentation im Alltag. Die Nährwertschätzungen, Analysen und KI-Chat-Empfehlungen stellen KEINE medizinische Diagnose, ärztliche Beratung oder klinische Ernährungstherapie dar. Konsultiere bei gesundheitlichen Beschwerden oder vor Diätumstellungen stets qualifizierte Mediziner oder Ernährungsfachkräfte.",
    sections: [
      {
        title: "1. Geltungsbereich und Zustimmung",
        content: [
          "Durch das Herunterladen, Installieren oder Nutzen der LogMyPlate App oder Website erklärst du dich mit diesen Nutzungsbedingungen einverstanden.",
        ],
      },
      {
        title: "2. Zulässige Nutzung",
        content: [
          "Die Nutzung ist ausschließlich für persönliche, nicht-kommerzielle Zwecke gestattet. Es ist untersagt, die Anwendung zu manipulieren, Quellcode zurückzuentwickeln oder unsere KI-Infrastruktur durch missbräuchliche Abfragen zu überlasten.",
        ],
      },
      {
        title: "3. Abonnements und In-App-Käufe",
        content: [
          "LogMyPlate bietet kostenlose Grundfunktionen sowie optionale kostenpflichtige Premium-Abonnements. Die Abrechnung erfolgt direkt über den jeweiligen App Store (Apple App Store oder Google Play) gemäß dessen Richtlinien.",
          "Kündigungen müssen direkt in den Kontoeinstellungen deines jeweiligen App Stores vorgenommen werden.",
        ],
      },
      {
        title: "4. Geistiges Eigentum",
        content: [
          "Sämtliche Urheberrechte, Marken, UI-Designs, Logos und Softwarekomponenten von LogMyPlate sind geschütztes geistiges Eigentum der Betreiber.",
        ],
      },
      {
        title: "5. Haftungsbeschränkung",
        content: [
          "Die Dienste werden im aktuellen Zustand ('wie besehen') bereitgestellt. Wir übernehmen keine Gewähr für eine lückenlose Exaktheit der visuellen KI-Schätzungen. Die Verantwortung für die Ernährungsauswahl liegt beim Nutzer.",
        ],
      },
      {
        title: "6. Änderungen der Bedingungen",
        content: [
          "Wir behalten uns das Recht vor, diese Bedingungen bei Bedarf anzupassen. Maßgeblich ist jeweils das Datum der letzten Aktualisierung am Seitenanfang.",
        ],
      },
      {
        title: "7. Kontakt",
        content: [
          `Fragen zu diesen Nutzungsbedingungen richtest du bitte an: ${APP_CONFIG.supportEmail}.`,
        ],
      },
    ],
  },

  dataDeletion: {
    metaTitle: "Datenlöschung & Account löschen — LogMyPlate",
    metaDescription:
      "Schritt-für-Schritt-Anleitung zur vollständigen und dauerhaften Löschung deines LogMyPlate Kontos und aller Ernährungsprotokolle.",
    badge: "Datenlöschung",
    headline: "So beantragst du die Löschung deiner Daten",
    intro:
      "Du hast jederzeit die volle Kontrolle über deine Daten. Wenn du LogMyPlate nicht mehr nutzen möchtest, kannst du deine Daten dauerhaft und restlos löschen.",
    inAppHeading: "Option 1: Direkt in der App löschen (Empfohlen)",
    inAppSteps: [
      "Öffne die LogMyPlate App auf deinem Smartphone.",
      "Tippe in der unteren Leiste auf den Reiter 'Profil'.",
      "Wähle oben das Zahnrad-Symbol für 'Einstellungen'.",
      "Scrolle nach unten und tippe auf 'Account löschen'.",
      "Bestätige den Vorgang im Dialogfenster.",
    ],
    inAppNote:
      "Die Löschung über die App erfolgt sofort und unwiderruflich. Alle Mahlzeiten-Fotos, Notizen und Nährwertdaten werden gelöscht.",
    openAppButton: "LogMyPlate App öffnen",
    webHeading: "Option 2: Anfrage per E-Mail",
    webText:
      "Falls du die App bereits deinstalliert hast, kannst du die Löschung auch formlos per E-Mail bei unserem Datenschutz-Team anfordern.",
    webEmailSubject: "Antrag auf Account- und Datenlöschung - LogMyPlate",
    webEmailButton: `E-Mail an ${APP_CONFIG.supportEmail} senden`,
    retentionHeading: "Was geschieht nach dem Löschantrag?",
    retentionText:
      "Alle deine Mahlzeiten-Fotos, Nährwertprotokolle, Zielwerte und persönlichen Einstellungen werden unwiderruflich von unseren Servern entfernt. Notwendige Abrechnungsbelege werden nur so lange aufbewahrt, wie es handels- und steuerrechtliche Pflichten zwingend vorschreiben.",
  },

  caloriesIndex: {
    metaTitle: "Kalorientabelle — Nährwerte nach echten Portionen",
    metaDescription:
      "Kalorientabelle für beliebte Speisen nach realistischen Portionen aus dem Alltag statt reiner 100g-Angaben. Aus der LogMyPlate Datenbank.",
    badge: "Kalorienverzeichnis",
    headline: "Kalorien und Makros nach realistischen Portionen",
    subtitle:
      "Die meisten Apps zeigen Nährwerte nur pro 100g. Bei LogMyPlate findest du praxisnahe Angaben nach Stück, Teller und Schale, wie du sie wirklich isst.",
    tierIndian: "Traditionelle Gerichte & Beilagen",
    tierGlobal: "Alltägliche Mahlzeiten",
    viewFoodButton: "Nährwerte ansehen",
    per100gBadge: "Pro 100g",
    portionsBadge: "Reale Portionen",
  },

  guidesIndex: {
    metaTitle: "Ratgeber & Blog — Ernährung, Kalorientracking & KI-Tipps",
    metaDescription:
      "Praktische Ratgeber zu Kalorienzählen, Makronährstoffen, Foto-Ernährungstagebüchern und gesunden Gewohnheiten mit LogMyPlate.",
    badge: "Ratgeber & Artikel",
    headline: "Besser essen mit intelligenter KI-Unterstützung",
    subtitle:
      "Praxisnahe Tipps, wissenschaftlich fundierte Erklärungen und Anleitungen für nachhaltiges Ernährungsbewusstsein ohne Diätstress.",
    readArticleButton: "Artikel lesen",
    minReadSuffix: "Min. Lesezeit",
  },
};
