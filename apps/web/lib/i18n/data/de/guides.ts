import type { Guide } from "@/app/(en)/guides/content";

export const deGuides: Guide[] = [
  {
    slug: "ai-calorie-tracker-india",
    title: "Wie KI-Kalorientracker für komplexe Mahlzeiten funktionieren",
    description:
      "Warum fotobasiertes Kalorienzählen mit KI für Hausmannskost und gemischte Teller deutlich besser funktioniert als Barcode-Scanner.",
    summary:
      "Klassische Barcode-Apps scheitern an Eintöpfen, Currys, Beilagenkombinationen und selbstgekochtem Essen. Erfahre, wie Bilderkennung per KI das Problem löst.",
    category: "KI-Kalorientracker",
    readTime: "5 Min. Lesezeit",
    accent: "#efbd44",
    keywords: [
      "KI Kalorientracker",
      "Kalorien zählen per Foto",
      "intelligentes Ernahrungstagebuch",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Warum selbstgekochte Mahlzeiten manuell schwer zu erfassen sind",
        paragraphs: [
          "Die allermeisten Kalorienzähl-Apps wurden für industriell verpackte Fertigprodukte, Fast-Food-Ketten und standardisierte Portionsgrößen entwickelt. Der Küchenalltag zu Hause sieht jedoch völlig anders aus: Ein gemischter Teller mit Reis, Hülsenfrüchten, Fleisch oder Gemüse variiert je nach Fettzugabe, Schnittgröße und Schöpfmenge enorm.",
          "Diese Diskrepanz führt dazu, dass viele Menschen das Protokollieren frustriert aufgeben: Das mühsame Eintippen jeder einzelnen Zutat kostet viel Zeit und bildet den tatsächlichen Teller am Ende kaum ab.",
        ],
      },
      {
        heading: "Was sich durch die visuelle KI-Analyse ändert",
        paragraphs: [
          "LogMyPlate setzt direkt am Foto deines fertigen Tellers an. Das KI-Modell erkennt die sichtbaren Komponenten, verbindet sie mit einer optionalen kurzen Notiz und berechnet daraus fundierte Schätzwerte für Kalorien, Protein, Kohlenhydrate und Fett.",
          "Das Ergebnis ist kein Laborexperiment, sondern ein praxistauglicher Richtwert. Der unschätzbare Vorteil liegt in der Beständigkeit: Du protokollierst dein Essen in unter 10 Sekunden, korrigierst bei Bedarf Details und bleibst monatelang ohne Diätstress am Ball.",
        ],
      },
      {
        heading: "Dinge, auf die du achten solltest",
        paragraphs: [
          "Nicht sichtbare Zutaten sind der größte Unsicherheitsfaktor: Bratöl, Butter, Zucker in Saucen oder cremige Dressings. Eine kurze Notiz wie 'mit wenig Öl gebraten' oder 'Sahnesauce' lenkt die KI in die richtige Richtung, die finale Bestätigung liegt jedoch stets bei dir.",
          "Bei medizinischen Indikationen, Diabetes, Essstörungen oder in der Schwangerschaft dienen KI-Schätzungen rein informativen Zwecken und ersetzen keinesfalls eine qualifizierte ärztliche oder ernährungstherapeutische Betreuung.",
        ],
      },
    ],
    faqs: [
      {
        question: "Kann ein KI-Kalorientracker 100 % exakt sein?",
        answer:
          "Nein. Bildbasiertes Tracking liefert fundierte visuelle Schätzungen. Es eignet sich hervorragend für Bewusstsein und tägliche Konsistenz, ersetzt aber keine Laboranalyse.",
      },
      {
        question: "Funktioniert LogMyPlate nur für bestimmte Gerichte?",
        answer:
          "Nein. Die KI erkennt sowohl traditionelle Hausmannskost und Eintöpfe als auch Pasta, Salate, asiatische Spezialitäten und Restaurantmahlzeiten.",
      },
    ],
  },
  {
    slug: "indian-food-calorie-tracker",
    title: "Kalorienzählen bei gemischten Tellern und traditionellen Gerichten",
    description:
      "Praktischer Ratgeber zum Erfassen von Hausmannskost, Currys und kombinierten Tellern per Foto und Portionsanpassung.",
    summary:
      "Lerne, wie du Hülsenfrüchte, Reis, Fladenbrote, Pfannengerichte und Salate erfasst, ohne jede Zutat einzeln auf die Waage legen zu müssen.",
    category: "Traditionelle Küche",
    readTime: "6 Min. Lesezeit",
    accent: "#70caa3",
    keywords: [
      "Kalorien zahlen Hausmannskost",
      "gemischte Teller tracken",
      "Ernahrungstagebuch Foto",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Vom fertigen Teller ausgehen statt von theoretischen Rezepten",
        paragraphs: [
          "Der nachhaltigste Weg für ein lückenloses Ernährungstagebuch ist die Erfassung des servierfertigen Tellers. Statt zu versuchen, die genaue Fettmenge im großen Familientopf mathematisch aufzuteilen, machst du ein deutliches Foto und lässt die KI die Portionen bestimmen.",
          "Das bewährt sich besonders bei gemischten Tellern und Meal-Prep-Boxen, auf denen mehrere Beilagen und Proteinquellen nebeneinander liegen.",
        ],
      },
      {
        heading: "Kurze Notizen für ähnlich aussehende Speisen nutzen",
        paragraphs: [
          "Manche Eintöpfe oder Saucengerichte sehen von oben betrachtet ähnlich aus. Eine knappe Notiz aus zwei Wörtern wie 'Hähnchencurry' oder 'Rindergulasch mager' gibt dem System den entscheidenden Kontext, ohne Aufwand zu verursachen.",
          "Die Notiz dient als Hilfestellung zur visuellen Prüfung, nicht als Ersatz. Die KI prüft die Übereinstimmung mit dem Bild vor der Nährwertberechnung.",
        ],
      },
      {
        heading: "Portionen vor dem Speichern kurz prüfen",
        paragraphs: [
          "Im Alltag schöpfen wir Essen mit Kellen, Löffeln oder Schalen, nicht nach Gramm. LogMyPlate übersetzt die Bildvolumina in bearbeitbare Portionsgrößen, die du bei Bedarf mit einem Fingertipp anpassen kannst.",
          "Gewohnheit schlägt Perfektionismus: Wer monatelang mit 90 % Genauigkeit dranbleibt, erzielt weit bessere Resultate als jemand, der nach drei Tagen exaktem Abwiegen genervt aufgibt.",
        ],
      },
    ],
    faqs: [
      {
        question: "Muss ich jede Mahlzeit auf der Küchenwaage wiegen?",
        answer:
          "Zu Beginn kann gelegentliches Wiegen helfen, das Augenmaß zu schulen. Für den Alltag reicht ein klares Foto mit LogMyPlate völlig aus.",
      },
      {
        question: "Erkennt die App Familienrezepte aus eigener Zubereitung?",
        answer:
          "Ja! Das Erkennen von selbstgekochten Rezepten und individuellen Portionen ist die Kernstärke von LogMyPlate.",
      },
    ],
  },
  {
    slug: "photo-food-journal",
    title: "Warum ein Foto-Ernährungstagebuch leichter durchzuhalten ist",
    description:
      "Wie Fotos die Hürde beim Mahlzeitentracking senken, Gewohnheiten stärken und dir deine echten Essmuster vor Augen führen.",
    summary:
      "Ein Ernährungstagebuch nützt nur dann etwas, wenn du es auch langfristig führst. Mahlzeiten per Foto festzuhalten macht das Protokollieren schnell und stressfrei.",
    category: "Ernährungstagebuch",
    readTime: "4 Min. Lesezeit",
    accent: "#ff7e78",
    keywords: [
      "Foto Ernahrungstagebuch",
      "visuelles Mahlzeitentagebuch",
      "gesunde Essgewohnheiten",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Die größte Hürde für Beständigkeit ist der Zeitaufwand",
        paragraphs: [
          "Die meisten Menschen scheitern beim Kalorientracken an der Reibung: Smartphone entsperren, Lebensmittel suchen, Marken vergleichen und Grammzahlen schätzen — vor jedem einzelnen Bissen. Nach einer stressigen Woche bricht die Routine meist zusammen.",
          "Ein Foto zu machen dauert nur zwei Sekunden und stört das gemeinsame Essen am Tisch nicht. Dadurch wird das Erfassen zu einem mühelosen Reflex vor dem ersten Bissen.",
        ],
      },
      {
        heading: "Bilder zeigen Verhaltensmuster besser als reine Zahlenreihen",
        paragraphs: [
          "Eine Fotogalerie deiner Mahlzeiten deckt emotionale und gewohnheitsmäßige Muster auf: Fehlendes Gemüse beim Mittagessen, einseitige Farbwelten oder zuckerhaltige Snacks am Nachmittag fallen optisch sofort ins Auge.",
          "Beim Durchscrollen deiner Woche erkennst du auf einen Blick, wo es zu viel war und wo deine Mahlzeiten vorbildlich ausgewogen waren.",
        ],
      },
      {
        heading: "So machst du das Foto-Tracking zur dauerhaften Routine",
        paragraphs: [
          "Fotografiere deinen Teller einfach immer vor dem Essen, selbst wenn du die Nährwertschätzung erst später am Abend überprüfst. Das Bild sichert die Mahlzeit verlässlich.",
          "Strebe nicht nach krampfhafter Perfektion. Das Ziel ist ehrliche Achtsamkeit und Klarheit über dein Essverhalten.",
        ],
      },
    ],
    faqs: [
      {
        question: "Was, wenn ich erst nach den ersten Bissen an das Foto denke?",
        answer:
          "Fotografiere den angebrochenen Teller und ergänze eine kurze Notiz, oder trage die Mahlzeit kurz in Textform nach.",
      },
      {
        question: "Sind meine Mahlzeiten-Fotos öffentlich sichtbar?",
        answer:
          "Nein. Deine Fotos sind privat und nur für dich in deinem persönlichen Account sichtbar. Es gibt keinen öffentlichen Feed.",
      },
    ],
  },
  {
    slug: "calorie-tracker-without-barcodes",
    title: "Kalorientracker ohne Barcode: Die Freiheit echter Lebensmittel",
    description:
      "Frische, unverarbeitete Mahlzeiten haben keinen Barcode. Lerne, wie du echte Lebensmittel per KI unkompliziert erfasst.",
    summary:
      "Gemüse, Obst, frischer Fisch, Fleisch und hausgemachte Gerichte kommen ohne Strichcode aus. Erfahre, wie Bilderkennung gesunde Ernährung unterstützt.",
    category: "Ohne Barcode",
    readTime: "5 Min. Lesezeit",
    accent: "#5a98f7",
    keywords: [
      "Kalorientracker ohne Barcode",
      "echte Lebensmittel tracken",
      "Essen ohne Barcode scannen",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Das Paradoxon klassischer Barcode-Apps",
        paragraphs: [
          "Herkömmliche Diät-Apps basieren fast ausschließlich auf Barcode-Scannern. Das funktioniert reibungslos bei Chips, Keksen und Fertiggerichten, versagt jedoch genau da, wo gesunde Ernährung beginnt.",
          "Ein frischer Apfel vom Markt, ein bunter Salatteller oder eine selbstgekochte Hühnersuppe tragen keinen Strichcode, was in Standard-Apps zu zeitraubender manueller Suche führt.",
        ],
      },
      {
        heading: "Optische Nährwertschätzung durch künstliche Intelligenz",
        paragraphs: [
          "LogMyPlate erkennt Mahlzeiten direkt an ihrem Aussehen. Das Modell analysiert Farben, Formen und Texturen auf dem Teller und gleicht sie mit validierten Nährwertdatenbanken ab.",
          "So kannst du sowohl einfache Naturlebensmittel als auch komplexe Restaurantgerichte mit mehreren Komponenten ohne Barcode sofort erfassen.",
        ],
      },
      {
        heading: "Mehr Frische auf dem Teller, weniger Aufwand beim Tracken",
        paragraphs: [
          "Unverarbeitete, nährstoffdichte Lebensmittel sind das Fundament langfristiger Gesundheit. Dein Ernährungstagebuch sollte diesen Lebensstil erleichtern und nicht durch Hürden behindern.",
        ],
      },
    ],
    faqs: [
      {
        question: "Kann LogMyPlate trotzdem Barcodes scannen, falls nötig?",
        answer:
          "Unser Fokus liegt ganz auf KI-Bilderkennung für echte Mahlzeiten. Für verpackte Produkte kannst du ein Foto der Nährwerttabelle machen oder den Namen eingeben.",
      },
      {
        question: "Wie erkennt die KI, welches Öl im Salat ist?",
        answer:
          "Der visuelle Glanz gibt Hinweise. Für exakte Werte genügt eine kurze Notiz wie '1 EL Olivenöl'.",
      },
    ],
  },
  {
    slug: "meal-photo-tips",
    title: "Tipps für Mahlzeiten-Fotos mit maximaler KI-Präzision",
    description:
      "Winkel, Beleuchtung, Anordnung und kurze Notizen für beste Nährwertschätzungen mit LogMyPlate.",
    summary:
      "Mit wenigen einfachen Handgriffen beim Fotografieren machst du es der KI leicht, jede Zutat auf deinem Teller treffsicher zu erkennen.",
    category: "Foto-Tipps",
    readTime: "4 Min. Lesezeit",
    accent: "#b57bee",
    keywords: [
      "Tipps Essensfotos",
      "Prazision Kalorientracker",
      "Mahlzeiten richtig fotografieren",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "1. Wähle einen 45-Grad-Winkel oder die Vogelperspektive",
        paragraphs: [
          "Ein Aufnahmewinkel von etwa 45 Grad ist meist ideal: Die KI sieht sowohl die Oberfläche als auch die Schichthöhe und Tiefe der Portionen auf dem Teller.",
          "Bei sehr flachen Gerichten wie Pizza oder Pfannkuchen eignet sich die Draufsicht von oben (90 Grad) hervorragend. Bei Schalen sollten die Zutaten gut sichtbar sein.",
        ],
      },
      {
        heading: "2. Achte auf ausreichendes Licht ohne harte Schatten",
        paragraphs: [
          "Gutes Umgebungslicht hilft der KI, farblich ähnliche Komponenten (wie verschiedene Getreidesorten oder Saucen) sauber voneinander zu trennen. Vermeide deinen eigenen Schatten direkt über dem Teller.",
          "Bei schummriger Restaurantbeleuchtung hilft das Zuschalten der Smartphone-Leuchte oder eine kurze Notiz.",
        ],
      },
      {
        heading: "3. Eine kurze Notiz aus zwei Wörtern wirkt Wunder",
        paragraphs: [
          "Notizen wie 'fettarme Milch', 'ohne Zucker', 'Rinderhack mager' oder 'Dinkelvollkorn' klären verdeckte Details auf Anhieb.",
          "Zwei bis drei Stichworte genügen völlig, um die KI millimetergenau zu leiten.",
        ],
      },
    ],
    faqs: [
      {
        question: "Muss Besteck oder eine Münze als Größenvergleich mit ins Bild?",
        answer:
          "Nein, Teller, Gabel oder Glas im Bildrand genügen den Algorithmen bereits vollkommen als räumlicher Maßstab.",
      },
      {
        question: "Was mache ich bei Essen in dunklen Takeaway-Boxen?",
        answer:
          "Öffne den Deckel für freie Sicht oder gib kurz die Bezeichnung des Gerichts ins Textfeld ein.",
      },
    ],
  },
  {
    slug: "ai-calorie-tracker-for-weight-loss",
    title: "Nachhaltig abnehmen mit einem KI-Kalorientracker",
    description:
      "Ein moderates Kaloriendefizit ohne Diätstress: Wie Fotos, realistische Ziele und Beständigkeit zum Erfolg führen.",
    summary:
      "Dauerhafter Gewichtsverlust gelingt durch ein moderates Energiedefizit und tägliche Beständigkeit. So unterstützt dich die KI dabei.",
    category: "Gewichtsverlust",
    readTime: "6 Min. Lesezeit",
    accent: "#efbd44",
    keywords: [
      "Kalorientracker zum Abnehmen",
      "nachhaltiges Kaloriendefizit",
      "gesund Gewicht verlieren",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Das Grundprinzip: Energiebilanz und Gewohnheiten",
        paragraphs: [
          "Um Körperfett abzubauen, muss der Körper über längere Zeit etwas mehr Energie verbrauchen, als ihm durch Nahrung zugeführt wird (moderates Kaloriendefizit). Es gibt keine Wundermittel oder magischen Fettverbrenner.",
          "Die größte Schwierigkeit liegt fast nie im theoretischen Wissen, sondern im Durchhalten des Monitorings über mehrere Monate hinweg.",
        ],
      },
      {
        heading: "Warum extreme Diäten fast immer scheitern",
        paragraphs: [
          "Radikale Kalorienkürzungen führen unweigerlich zu Heißhunger, Verlust wertvoller Muskelmasse, Antriebslosigkeit und vorzeitigem Abbruch.",
          "Ein moderates Defizit von 300 bis 500 kcal pro Tag ermöglicht kontinuierlichen Fettabbau, ohne den Stoffwechsel zu überlasten oder ständig hungern zu müssen.",
        ],
      },
      {
        heading: "Wie Fotos deine Erfolge beschleunigen",
        paragraphs: [
          "Das Fotografieren schafft einen bewussten Moment des Innehaltens: Du blickst auf deinen Teller und nimmst Portionsgrößen und Ausgewogenheit intuitiv wahr.",
          "Durch die Schnelligkeit von LogMyPlate bleibt das Tracking leicht und wird zu einer angenehmen Routine.",
        ],
      },
    ],
    faqs: [
      {
        question: "Wie hoch sollte mein tägliches Defizit sein?",
        answer:
          "Für die meisten gesunden Erwachsenen ist ein Defizit von 300 bis 500 kcal unter dem Gesamtumsatz optimal für stetige, gesunde Fettabnahme.",
      },
      {
        question: "Berechnet die App mein persönliches Kalorienziel?",
        answer:
          "Ja. Auf Basis von Alter, Gewicht, Größe, Aktivitätslevel und Ziel schlägt dir LogMyPlate ein maßgeschneidertes Kalorien- und Makroprofil vor.",
      },
    ],
  },
  {
    slug: "calorie-tracking-for-home-cooked-food",
    title: "Hausgemachtes Essen tracken, ohne jede Zutat einzeln abzuwiegen",
    description:
      "Schluss mit dem Wiegen von Zwiebeln, Knoblauch und Öl. Praktische Tipps für müheloses Tracking beim Kochen zu Hause.",
    summary:
      "Kochen zu Hause ist ideal für die Gesundheit, doch das Protokollieren ganzer Familienrezepte nervt oft. So machst du es in Sekunden per Foto.",
    category: "Hausmannskost",
    readTime: "5 Min. Lesezeit",
    accent: "#70caa3",
    keywords: [
      "Hausmannskost Kalorien zahlen",
      "Kochen tracken ohne Waage",
      "Ernahrungstagebuch zu Hause",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Die Frustration des grammgenauen Abwiegens",
        paragraphs: [
          "In herkömmlichen Apps für jedes Familienessen ein eigenes Rezept mit Dutzenden Einzelzutaten anzulegen, raubt jeden Spaß am Kochen. Niemand wiegt gerne Knoblauchzehen, Gewürze oder das Anbratöl während des Kochens ab.",
          "Die Folge: Am Wochenende oder bei gemeinsamen Mahlzeiten wird das Tagebuch oft vernachlässigt.",
        ],
      },
      {
        heading: "Der servierte Teller ist die clevere Abkürzung",
        paragraphs: [
          "Wenn du den fertigen Teller fotografierst, analysiert die KI die fertige Komposition, schätzt die Proportionen und gleicht sie mit Tausenden realen Rezepturen ab.",
          "Du sparst bei jeder Mahlzeit wertvolle Minuten und dein Tagebuch bleibt lückenlos aktuell.",
        ],
      },
      {
        heading: "Konzentriere dich auf die Zutaten mit großer Wirkung",
        paragraphs: [
          "Bratfette, cremige Saucen, Käse und Beilagen machen den Löwenanteil der Kalorien aus. Kräuter, Gewürze und Salatblätter fallen energetisch kaum ins Gewicht.",
          "Achte beim Kochen bewusst auf sparsamen Fetteinsatz und überlasse die Berechnung der Beilagen entspannt der KI.",
        ],
      },
    ],
    faqs: [
      {
        question: "Was, wenn ich deutlich weniger Fett verwende als im Restaurant?",
        answer:
          "Füge einfach den Hinweis 'fettarm zubereitet' hinzu, damit die KI den Wert passend kalibriert.",
      },
      {
        question: "Kann ich einzelne Nährwerte manuell nachjustieren?",
        answer:
          "Ja, alle von der KI vorgeschlagenen Werte können vor dem Speichern jederzeit frei bearbeitet werden.",
      },
    ],
  },
  {
    slug: "macro-tracking-with-food-photos",
    title: "Proteine, Kohlenhydrate und Fett aus Fotos ermitteln",
    description:
      "Makronährstoffe im Gleichgewicht: Wie die visuelle KI deinen Teller analysiert und dir hilft, dein Proteinziel zu erreichen.",
    summary:
      "Reines Kalorienzählen zeigt nur die halbe Wahrheit. Erfahre, wie die richtige Makroverteilung deine Sättigung und Muskelkraft stärkt.",
    category: "Makronährstoffe",
    readTime: "6 Min. Lesezeit",
    accent: "#ff7e78",
    keywords: [
      "Makros tracken per Foto",
      "Proteinziel erreichen",
      "Makronahrstoffe einfach erklart",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Warum Makros genauso wichtig sind wie Kalorien",
        paragraphs: [
          "Zwei Mahlzeiten mit jeweils 600 Kalorien wirken im Körper völlig unterschiedlich, wenn die eine protein- und ballaststoffreich ist und die andere nur aus Zucker und Fett besteht.",
          "Protein schützt die Muskeln und sorgt für lang anhaltende Sättigung, Fette steuern Hormone und Zellgesundheit, während Kohlenhydrate Energie für dein Gehirn und Training liefern.",
        ],
      },
      {
        heading: "Wie LogMyPlate Makronährstoffe aus Bildern ableitet",
        paragraphs: [
          "Beim Scannen berechnet die KI neben der Gesamtenergie in kcal auch die Grammzahlen von Protein, Kohlenhydraten, Fett und Ballaststoffen.",
          "Ein übersichtliches Diagramm visualisiert sofort, ob deine Mahlzeit zu deinen Tageszielen passt.",
        ],
      },
      {
        heading: "Praxistipps für dein tägliches Proteinziel",
        paragraphs: [
          "Integriere in jede Hauptmahlzeit eine feste Proteinquelle: Eier, Geflügel, Fisch, Magerquark, Tofu oder Hülsenfrüchte.",
          "Kombiniere Linsen oder Bohnen mit Vollkorngetreide, um auch auf pflanzlicher Basis ein erstklassiges Aminosäureprofil zu erzielen.",
        ],
      },
    ],
    faqs: [
      {
        question: "Wie viel Protein sollte ich täglich essen?",
        answer:
          "Für aktive Menschen und Kraftsportler gelten 1,6 bis 2,2 g Protein pro Kilogramm Körpergewicht als Richtwert.",
      },
      {
        question: "Erfasst LogMyPlate auch Ballaststoffe?",
        answer:
          "Ja, Ballaststoffe werden separat aufgeführt, damit du deine Darmgesundheit und Sättigung gezielt fördern kannst.",
      },
    ],
  },
  {
    slug: "calorie-estimate-vs-nutrition-label",
    title: "KI-Schätzung versus Nährwerttabelle: Was du wissen musst",
    description:
      "Warum selbst offizielle Nährwerttabellen Toleranzen haben und wie du KI-Schätzungen intelligent im Alltag nutzt.",
    summary:
      "Keine Nährwertangabe im echten Leben ist auf das Milligramm exakt. Erfahre, warum Beständigkeit wichtiger ist als Scheingenauigkeit.",
    category: "Ernährungswissenschaft",
    readTime: "5 Min. Lesezeit",
    accent: "#5a98f7",
    keywords: [
      "Prazision Kalorien KI",
      "Nahwerttabelle Toleranz",
      "Kalorienschatzung im Alltag",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Die Illusion milligrammgenauer Verpackungsangaben",
        paragraphs: [
          "Viele Menschen glauben, dass Nährwerttabellen auf Lebensmitteln exakt sind. Tatsächlich gestatten Lebensmittelbehörden (wie die EU-Verordnung) gesetzliche Abweichungen von bis zu 20 % aufgrund natürlicher Reifeschwankungen.",
          "Der Versuch, Mahlzeiten auf das Gramm genau zu berechnen, täuscht eine Genauigkeit vor, die es in der biologischen Realität schlicht nicht gibt.",
        ],
      },
      {
        heading: "Beständige Schätzungen führen zum Ziel",
        paragraphs: [
          "Auch die Nährstoffaufnahme im menschlichen Körper variiert je nach Darmflora, Kauen, Schlaf und Zubereitung.",
          "Der Wert eines KI-Tools wie LogMyPlate liegt darin, dich verlässlich im richtigen Zielbereich zu halten, statt dich mit unnötiger Rechenarbeit aufzuhalten.",
        ],
      },
      {
        heading: "Das Tagebuch als Kompass nutzen",
        paragraphs: [
          "Achte auf den mehrwöchigen Trend deines Gewichts und deines Wohlbefindens. Wenn die Richtung stimmt, funktioniert dein Ernährungsplan hervorragend.",
        ],
      },
    ],
    faqs: [
      {
        question: "Wie groß ist die typische Abweichung bei der KI-Schätzung?",
        answer:
          "Bei gut ausgeleuchteten Bildern liegt die Abweichung typischerweise bei 10 % bis 15 % im Vergleich zu Wiegungen — vergleichbar mit der Schwankung von Standardverpackungen.",
      },
      {
        question: "Eignet sich die App für Typ-1-Diabetiker zur Insulindosierung?",
        answer:
          "Nein. Zur Berechnung von Insulineinheiten bei Typ-1-Diabetes müssen Kohlenhydrate stets nach ärztlicher Anweisung präzise gewogen werden.",
      },
    ],
  },
  {
    slug: "best-calorie-tracker-for-indian-food",
    title: "Die beste App für traditionelle Gerichte und internationale Küchen",
    description:
      "Wichtige Kriterien für einen Kalorientracker, der regionale Rezepte, Gewürze und echte Mahlzeiten versteht.",
    summary:
      "Genug von Apps, die nur amerikanische Fertigprodukte kennen? Hier erfährst du, worauf es bei abwechslungsreicher internationaler Ernährung ankommt.",
    category: "App-Vergleich",
    readTime: "5 Min. Lesezeit",
    accent: "#b57bee",
    keywords: [
      "bester Kalorientracker",
      "App fur internationale Kuche",
      "intelligenter Mahlzeitentracker",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Warum generische Apps bei traditionellen Gerichten scheitern",
        paragraphs: [
          "Viele bekannte Kalorien-Apps wurden primär für den US-Markt gebaut. Sie kennen jeden Markensnack, scheitern aber kläglich an frischen Eintöpfen, Linsengerichten oder regionalen Spezialitäten.",
          "Nutzer müssen dann jedes Mal umständlich Behelfslösungen suchen oder das Protokollieren aufgeben.",
        ],
      },
      {
        heading: "Der Vorteil visueller Bilderkennung",
        paragraphs: [
          "LogMyPlate wurde trainiert, um zubereitete Mahlzeiten in ihrer Gesamtheit zu verstehen. Die KI erkennt das Zusammenspiel von Getreide, Saucen, Gemüse und Proteinen auf einem Bild.",
          "Das erspart endlose Recherchen und eröffnet eine reibungslose Nutzung für unterschiedlichste Esskulturen.",
        ],
      },
      {
        heading: "Worauf du bei deiner App-Wahl achten solltest",
        paragraphs: [
          "Wähle eine App mit schneller Erfassung, respektvollem Umgang mit deinen privaten Daten und ohne aufdringliche Bannerwerbung.",
        ],
      },
    ],
    faqs: [
      {
        question: "Gibt es LogMyPlate komplett auf Deutsch?",
        answer:
          "Ja! Sowohl die App als auch alle Ratgeber und Datenbanken sind vollständig auf Deutsch verfügbar.",
      },
      {
        question: "Muss ich zwingend für die Nutzung bezahlen?",
        answer:
          "Nein. Es gibt eine dauerhaft kostenlose Basisversion sowie eine 30-tägige kostenlose Premium-Testphase.",
      },
    ],
  },
  {
    slug: "how-to-track-misal-pav-calories",
    title: "Kalorien erfassen bei Gerichten mit Saucen und knusprigen Toppings",
    description:
      "So schätzt du Mahlzeiten mit Brühen, Beilagen, Brot und Toppings ohne langes Rechnen zielsicher ab.",
    summary:
      "Gerichte mit vielen verschiedenen Beilagen und Saucen wirken oft wie ein Albtraum beim Kalorienzählen. So meisterst du sie per Foto.",
    category: "Spezialgerichte",
    readTime: "4 Min. Lesezeit",
    accent: "#efbd44",
    keywords: [
      "Gerichte mit Saucen tracken",
      "Eintopfe mit Brot Kalorien",
      "komplexe Mahlzeiten schatzen",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Die Herausforderung mehrteiliger Gerichte",
        paragraphs: [
          "Traditionelle Speisen bestehen oft aus einer würzigen Sauce oder Brühe, Beilagenbrot und knusprigen Toppings oder Zwiebeln.",
          "Brühe, Fett und Beilagen einzeln abzuwiegen, ist im Alltag fast unmöglich und macht keinen Spaß.",
        ],
      },
      {
        heading: "Wie das Gesamtfoto die Mahlzeit erfasst",
        paragraphs: [
          "Ein einziges Foto des angerichteten Tellers ermöglicht es LogMyPlate, das Gericht und die dazugehörigen Beilagen als Ensemble zu identifizieren.",
          "Zusätzliches Brot oder weggelassene Toppings passt du einfach mit einem Fingertipp an.",
        ],
      },
      {
        heading: "Genuss und Zielerreichung verbinden",
        paragraphs: [
          "Du musst auf deine Lieblingsspeisen nicht verzichten. Durch die Portionskontrolle lassen sich auch deftige Gerichte problemlos in deinen Alltag einbauen.",
        ],
      },
    ],
    faqs: [
      {
        question: "Wie geht die KI mit scharfen Gewürzen um?",
        answer:
          "Chili und reine Gewürze haben kaum Kalorien. Die KI konzentriert sich auf Fette, Kohlenhydrate und Einlagen.",
      },
      {
        question: "Kann ich auch Snacks und Zwischenmahlzeiten fotografieren?",
        answer:
          "Ja, die KI erkennt Snacks, Gebäcke und Fingerfood genauso wie Hauptmahlzeiten.",
      },
    ],
  },
  {
    slug: "daily-calorie-target-bmi-guide",
    title: "Dein tägliches Kalorienziel realistisch berechnen",
    description:
      "Grundumsatz, Leistungsumsatz und wie du deine Kalorienzufuhr passend zu deinem Wunschgewicht planst.",
    summary:
      "Finde deine optimale Energiebalance ohne komplizierte Formeln oder radikale Diätvorgaben.",
    category: "Ernährungsziele",
    readTime: "7 Min. Lesezeit",
    accent: "#70caa3",
    keywords: [
      "tagliches Kalorienziel berechnen",
      "Grundumsatz berechnen",
      "Kalorienbedarf ermitteln",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Grundumsatz und Gesamtenergiebedarf verstehen",
        paragraphs: [
          "Dein Grundumsatz (BMR) ist die Energie, die dein Körper in völliger Ruhe für Atmung, Herzschlag und Zellregeneration benötigt.",
          "Addiert man Bewegung, Sport und die nahrungsinduzierte Thermogenese hinzu, ergibt sich dein täglicher Gesamtenergiebedarf (TDEE).",
        ],
      },
      {
        heading: "Die passende Kalorienmenge für dein Ziel",
        paragraphs: [
          "Zum Fettabbau: Ziehe ca. 300 bis 500 kcal von deinem Gesamtumsatz ab.",
          "Zum Halten: Nimm Kalorien in Höhe deines errechneten Gesamtbedarfs auf.",
          "Für Muskelaufbau: Wähle einen moderaten Überschuss von 200 bis 400 kcal bei ausreichender Proteinzufuhr.",
        ],
      },
      {
        heading: "Wöchentliche Durchschnittswerte statt Tagesschwankungen",
        paragraphs: [
          "Das Körpergewicht schwankt täglich durch Wasserhaushalt, Mageninhalt und Salz. Beurteile deinen Erfolg stets anhand des Wochenschnitts.",
        ],
      },
    ],
    faqs: [
      {
        question: "Darf ich dauerhaft unter meinem Grundumsatz essen?",
        answer:
          "Davon wird dringend abgeraten. Längeres Essen unter dem Grundumsatz führt zu Muskelabbau, Müdigkeit und Nährstoffmängeln.",
      },
      {
        question: "Wie oft sollte ich mich wiegen?",
        answer:
          "Zwei- bis dreimal pro Woche morgens nüchtern auf die Waage zu steigen und den Wochendurchschnitt zu bilden, ist am aussagekräftigsten.",
      },
    ],
  },
  {
    slug: "food-journal-for-busy-professionals",
    title: "Ernährungstagebuch für einen stressigen Berufsalltag",
    description:
      "Mahlzeiten im Griff behalten trotz Meetings, Geschäftsessen und wenig Zeit zum Kochen.",
    summary:
      "Viel Arbeit und Geschäftsreisen müssen nicht das Ende deiner gesunden Ernährung bedeuten. So protokollierst du dein Essen blitzschnell.",
    category: "Lifestyle",
    readTime: "5 Min. Lesezeit",
    accent: "#ff7e78",
    keywords: [
      "Ernahrungstagebuch Berufsalltag",
      "Kalorien zahlen wenig Zeit",
      "gesunde Routine im Beruf",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Warum herkömmliche Apps im Büroalltag scheitern",
        paragraphs: [
          "Wer von Meeting zu Meeting eilt, hat keine 5 Minuten Zeit, um in der Mittagspause jede Zutat mühsam in eine App einzutippen.",
          "Ist die Bedienung zu aufwendig, bricht die Gewohnheit nach wenigen Arbeitstagen ab.",
        ],
      },
      {
        heading: "Das Mahlzeiten-Foto als Zeitturbo",
        paragraphs: [
          "Das Foto des Mittagstellers dauert zwei Sekunden. Das Bild hält die Mahlzeit fest, und du kannst die Auswertung bei Bedarf später in einer kurzen Pause prüfen.",
          "Dein Arbeitstag läuft ungestört weiter und dein Tagebuch bleibt trotzdem lückenlos.",
        ],
      },
      {
        heading: "Kluge Strategien für die Mittagspause",
        paragraphs: [
          "Wähle in der Kantine oder beim Buffet bevorzugt gegrilltes Protein und viel Gemüse. Halte eiweißreiche Snacks für Zwischendurch bereit.",
        ],
      },
    ],
    faqs: [
      {
        question: "Funktioniert die Aufnahme auch ohne mobiles Internet?",
        answer:
          "Du kannst das Foto mit der normalen Kamera machen und später bei bestehender Internetverbindung in LogMyPlate hochladen.",
      },
      {
        question: "Kann der KI-Assistent mich bei der Wochenanalyse unterstützen?",
        answer:
          "Ja! Du kannst ihn direkt fragen: 'An welchen Tagen hatte ich zu wenig Eiweiß?' und erhältst eine prägnante Auswertung.",
      },
    ],
  },
  {
    slug: "privacy-first-calorie-tracking",
    title: "Privatsphäre an erster Stelle: Was mit deinen Essensfotos geschieht",
    description:
      "Unser Sicherheitsversprechen: Deine Fotos gehören dir und werden niemals an Werbepartner verkauft oder öffentlich gezeigt.",
    summary:
      "Deine Ernährung und dein Gewicht sind Privatsache. Erfahre, wie unsere Architektur deine Daten streng schützt.",
    category: "Datenschutz",
    readTime: "4 Min. Lesezeit",
    accent: "#5a98f7",
    keywords: [
      "Datenschutz Kalorientracker",
      "sichere Ernahrungsapp",
      "private Mahlzeitenfotos",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Gesundheits- und Ernährungsdaten sind vertraulich",
        paragraphs: [
          "Wir sind fest davon überzeugt, dass intime Daten über deine Ernährung nicht als Werbeware für Dritte missbraucht werden dürfen.",
          "LogMyPlate verarbeitet Fotos ausschließlich zur Nährwertschätzung und für dein persönliches Tagebuch.",
        ],
      },
      {
        heading: "Keine öffentlichen Social-Media-Feeds",
        paragraphs: [
          "Es gibt keine öffentlichen Profile, keine Follower und kein Social-Media-Sharing ohne deine explizite Zustimmung.",
          "Du kannst deine Daten jederzeit mit wenigen Klicks in den Einstellungen vollständig löschen.",
        ],
      },
      {
        heading: "Verschlüsselung nach neuestem Standard",
        paragraphs: [
          "Sämtliche Datenübertragungen erfolgen TLS-verschlüsselt und werden auf modernen Cloud-Servern mit strengen Sicherheitsvorkehrungen verwahrt.",
        ],
      },
    ],
    faqs: [
      {
        question: "Verkauft LogMyPlate Nutzerfotos an Werbefirmen?",
        answer:
          "Nein, niemals. Deine Fotos und Gesundheitsdaten werden unter keinen Umständen an Dritte verkauft.",
      },
      {
        question: "Wie lösche ich meinen Account vollständig?",
        answer:
          "Gehe in der App auf Profil > Einstellungen > Account löschen, um alle Daten sofort und unwiderruflich zu entfernen.",
      },
    ],
  },
  {
    slug: "rewarded-ads-free-scans-calorie-tracker",
    title: "Kostenlose Scans mit optionalen Werbebelohnungen: So funktioniert's",
    description:
      "Modernste KI gratis nutzen, indem du dir nur dann kurze Clips ansiehst, wenn du es möchtest — ganz ohne Zwang.",
    summary:
      "Keine Abo-Falle: Erfahre, wie unser Modell mit freiwilligen Werbebelohnungen modernste Bilderkennung für jeden zugänglich macht.",
    category: "Zugangsmodell",
    readTime: "4 Min. Lesezeit",
    accent: "#b57bee",
    keywords: [
      "kostenloser Kalorientracker",
      "KI Mahlzeitenscan gratis",
      "App ohne Abopflicht",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Spitzentechnologie für alle zugänglich machen",
        paragraphs: [
          "Hochmoderne KI-Modelle zur Bildverarbeitung erfordern leistungsfähige Serverinfrastruktur. Viele Apps sperren neue Nutzer deshalb hinter teuren Pflicht-Abos ein.",
          "LogMyPlate wählt einen fairen Weg: Du kannst die App dauerhaft kostenlos nutzen, indem du dir bei Bedarf kurze Werbeclips ansiehst, um Scans freizuschalten.",
        ],
      },
      {
        heading: "Volle Kontrolle über dein Nutzungserlebnis",
        paragraphs: [
          "Wir schalten keine störenden Pop-up-Banner mitten im Arbeitsfluss. Du entscheidest selbst, wann du eine Belohnung abrufen möchtest.",
          "Für unbegrenzte Scans ohne jede Werbung steht dir das günstige Premium-Abo zur Verfügung.",
        ],
      },
      {
        heading: "30 Tage Premium kostenlos testen",
        paragraphs: [
          "Zum Start schenken wir allen neuen Nutzern 30 Tage vollen Premium-Zugriff, um alle Features risikofrei kennenzulernen.",
        ],
      },
    ],
    faqs: [
      {
        question: "Muss ich Zahlungsdaten für den Testmonat hinterlegen?",
        answer:
          "Nein, keine Kreditkarte erforderlich. Nach Ablauf der 30 Tage entscheidest du selbst, wie du weitermachen möchtest.",
      },
      {
        question: "Wie viele kostenlose Scans kann ich täglich durchführen?",
        answer:
          "Du kannst täglich so viele Mahlzeiten scannen, wie du möchtest, indem du die verfügbaren kurzen Belohnungsclips nutzt.",
      },
    ],
  },
  {
    slug: "calorie-tracking-for-vegetarian-meals",
    title: "Kalorienzählen für Vegetarier und pflanzliche Ernährung",
    description:
      "Pflanzliche Proteine im Blick behalten, Hülsenfrüchte tracken und versteckte Fette bei Käsegerichten kontrollieren.",
    summary:
      "Vegetarische Gerichte sind nährstoffreich, erfordern aber ein gutes Auge für Proteine und Fette. So hilft dir die KI.",
    category: "Vegetarisch",
    readTime: "6 Min. Lesezeit",
    accent: "#efbd44",
    keywords: [
      "Kalorientracker vegetarisch",
      "pflanzliches Protein tracken",
      "vegetarische Makros",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Die Proteinherausforderung bei fleischloser Kost",
        paragraphs: [
          "Wer auf Fleisch verzichtet, greift unbewusst oft zu größeren Mengen Käse, Sahne oder Teigwaren, um satt zu werden.",
          "Das treibt die Kalorien rasch in die Höhe, ohne den Muskelbedarf an wertvollem Eiweiß optimal zu decken.",
        ],
      },
      {
        heading: "Hochwertige pflanzliche Proteinquellen",
        paragraphs: [
          "Linsen, Kichererbsen, Bohnen, Tofu, Tempeh, Eier und magere Milchprodukte wie Magerquark sind das ideale Fundament.",
          "LogMyPlate erkennt diese Zutaten auf dem Bild und zeigt dir deine tägliche Proteinsumme in Echtzeit an.",
        ],
      },
      {
        heading: "Nutze den Vorteil reicher Ballaststoffe",
        paragraphs: [
          "Ein riesiger Pluspunkt vegetarischer Ernährung ist der hohe Ballaststoffgehalt. Verfolge deine Ballaststoffwerte im Tagebuch für beste Darmgesundheit.",
        ],
      },
    ],
    faqs: [
      {
        question: "Erkennt die KI Tofu- und Sojaprodukte zuverlässig?",
        answer:
          "Ja! Gebratener Tofu, Sojaschnetzel, Bohnengerichte und Gemüsecurrys werden zielsicher erkannt.",
      },
      {
        question: "Wie vermeide ich zu viele Kalorien durch Käse?",
        answer:
          "Behalte das Fett-Diagramm in LogMyPlate im Auge und kombiniere Käsegerichte bevorzugt mit viel frischem Gemüse.",
      },
    ],
  },
  {
    slug: "restaurant-meal-calorie-tracking",
    title: "Kalorien im Restaurant und unterwegs entspannt erfassen",
    description:
      "Schlaue Strategien für Buffet, Geschäftsessen und versteckte Fette in der Gastronomie.",
    summary:
      "Essen gehen gehört zum Leben dazu. Lerne, wie du Restaurantbesuche ohne schlechtes Gewissen protokolliert bekommst.",
    category: "Restaurants",
    readTime: "5 Min. Lesezeit",
    accent: "#70caa3",
    keywords: [
      "Kalorien zahlen im Restaurant",
      "Essen gehen tracken",
      "Buffet Kalorien schatzen",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Die Tücke versteckter Fette in Profiküchen",
        paragraphs: [
          "Gastronomieköche setzen oft großzügig Butter, Öl und Sahne ein, um Speisen vollmundig und glänzend zu machen.",
          "Ein optisch leichtes Restaurantgericht kann daher 20 % bis 30 % mehr Kalorien haben als die Variante aus der eigenen Küche.",
        ],
      },
      {
        heading: "Das schnelle Tellerfoto am Tisch",
        paragraphs: [
          "Ein kurzes, unauffälliges Foto vor dem Essen genügt. Mit der Notiz 'Restaurant' berücksichtigt die KI den typischen Gastronomieansatz bei der Berechnung.",
          "So bleibst du sozial entspannt und musst nicht am Tisch nach Zutatenlisten fragen.",
        ],
      },
      {
        heading: "Praxistipps für gesunde Restaurantbesuche",
        paragraphs: [
          "Bestelle Saucen und Dressings separat und wähle bevorzugt gegrillte Proteinquellen und Gemüsebeilagen.",
        ],
      },
    ],
    faqs: [
      {
        question: "Muss ich Einladungen zum Essen absagen, um meine Diät zu halten?",
        answer:
          "Auf keinen Fall! Flexibilität ist der Schlüssel zum Erfolg: Erfasse das Essen und gleiche den restlichen Tag bei Bedarf etwas an.",
      },
      {
        question: "Kann ich Desserts oder alkoholische Getränke tracken?",
        answer:
          "Ja, auch Desserts oder Weinschorlen lassen sich per Foto erfassen und in dein Tagesbudget einrechnen.",
      },
    ],
  },
  {
    slug: "meal-tracking-for-gym-and-fitness",
    title: "Ernährungstracking für Fitnessstudio und Muskelaufbau",
    description:
      "Pre-Workout, Post-Workout und tägliche Proteinzufuhr perfekt auf dein Training abstimmen.",
    summary:
      "Hartes Krafttraining setzt den Wachstumsreiz, doch die Ernährung baut den Muskel auf. So optimierst du dein Fitness-Tracking.",
    category: "Fitness & Sport",
    readTime: "6 Min. Lesezeit",
    accent: "#ff7e78",
    keywords: [
      "Ernahrung fur Muskelaufbau",
      "Proteinziel Kraftsport",
      "Fitness Mahlzeitentracker",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Die entscheidende Rolle der Ernährung beim Muskelaufbau",
        paragraphs: [
          "Egal wie schwer du trainierst: Ohne ausreichende Kalorien und Aminosäuren bleibt der Muskelzuwachs weit hinter deinen Möglichkeiten zurück.",
          "Das Verfolgen deiner Makronährstoffe stellt sicher, dass deine Muskeln nach dem Workout optimal versorgt sind.",
        ],
      },
      {
        heading: "Pre- und Post-Workout sinnvoll timen",
        paragraphs: [
          "Leicht verdauliche Kohlenhydrate vor dem Training füllen die Glykogenspeicher für maximale Kraft.",
          "Eine protein- und kohlenhydratreiche Mahlzeit nach dem Training leitet die Regeneration ein und mildert Muskelkater.",
        ],
      },
      {
        heading: "Meal-Prep-Boxen blitzschnell tracken",
        paragraphs: [
          "Wer vorkocht (Reis, Hähnchen, Gemüse), erfasst seine Fitness-Boxen mit einem Klick in Sekunden.",
        ],
      },
    ],
    faqs: [
      {
        question: "Brauche ich zwingend Eiweißpulver für den Muskelaufbau?",
        answer:
          "Nein. Shakes sind praktisch, aber du kannst dein Proteinziel problemlos mit Eiern, Quark, Geflügel, Fisch und Hülsenfrüchten decken.",
      },
      {
        question: "Wie viel Protein kann der Körper pro Mahlzeit verwerten?",
        answer:
          "Moderne Studien zeigen, dass 30 bis 50 g hochwertiges Protein pro Mahlzeit effizient für die Muskelproteinsynthese genutzt werden.",
      },
    ],
  },
];

export function getDeGuide(slug: string): Guide | undefined {
  return deGuides.find((g) => g.slug === slug);
}
