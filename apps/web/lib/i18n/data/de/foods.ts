import type { FoodPage } from "@/app/(en)/calories/food-data";

export const deFoods: FoodPage[] = [
  {
    slug: "roti",
    name: "Roti",
    tier: "indian",
    aka: ["Chapati", "Phulka", "indisches Fladenbrot"],
    title: "Kalorien in Roti (Chapati) — Pro Stück, nicht pro 100 g",
    description:
      "Ein mittelgroßes Roti hat etwa 160 Kalorien. Kalorien, Protein und Ballaststoffe für kleine, mittlere und große Rotis in realistischen Portionsgrößen.",
    intro: [
      "Niemand wiegt ein Roti auf der Küchenwaage ab, bevor er hineinbeißt. Genau das ist das Hauptproblem beim Kalorientracken.",
      "Die meisten Nährwerttabellen geben Roti-Kalorien 'pro 100 Gramm' an. Aber ein Roti wiegt keine 100 Gramm, und die Zubereitung zu Hause unterscheidet sich grundlegend von Restaurants. Die echten Kalorien hängen von Durchmesser, Teigdicke und der Zugabe von Ghee (Butterschmalz) oder Öl ab.",
      "Hier findest du realistische Nährwertangaben für die Größen, in denen Roti tatsächlich zubereitet und gegessen wird.",
    ],
    per100g: { calories: 267, protein: 8.7, carbs: 53.3, fat: 2.7, fiber: 9.7, sodium: 317 },
    portions: [
      { label: "1 kleines Roti", grams: 40, note: "Thali-Größe oder dünnes Phulka ohne Fett" },
      { label: "1 mittleres Roti", grams: 60, note: "die häufigste Größe in unseren Ernährungstagebüchern" },
      { label: "1 großes Pfannen-Roti", grams: 90, note: "dickeres Fladenbrot oder Restaurantgröße" },
      { label: "2 mittlere Rotis", grams: 120 },
    ],
    observedRange:
      "In echten Mahlzeiten auf LogMyPlate schwankte ein einzelnes Roti zwischen 40 g und 180 g.",
    portionHonesty: [
      "Wir könnten dir eine einzige Zahl nennen und sie 'ein Roti' nennen, wie es die meisten Websites tun. Doch eine vierfache Gewichtsvariation bedeutet auch das Vierfache an Kalorien: etwa 107 Kalorien beim kleinsten und über 480 beim größten Roti.",
      "Diese Spanne entsteht nicht durch ungenaue Daten, sondern durch die Wirklichkeit: Ein hauchdünnes Phulka und ein dickes Restaurant-Roti heißen im Alltag gleichermaßen 'ein Roti'.",
      "Wähle die Zeile, die deinem Teller am nächsten kommt. Im Zweifelsfall ist die mittlere Größe die beste Annäherung.",
    ],
    whatChangesIt: [
      {
        heading: "Mit Ghee oder Butter bestrichen",
        body: "Ein Teelöffel Ghee entspricht rund 5 g reinem Fett und fügt etwa 45 Kalorien hinzu. Zu Hause wird meist sparsam bestrichen, in Restaurants oft sehr großzügig.",
      },
      {
        heading: "Die Dicke zählt mehr als der Durchmesser",
        body: "Ein dick ausgerolltes Roti mit 15 cm Durchmesser wiegt oft mehr als ein dünnes mit 20 cm. Das Gewicht folgt der Dicke viel stärker als der Fläche.",
      },
      {
        heading: "Die Mehlsorte",
        body: "Diese Werte basieren auf traditionellem Vollkornweizenmehl (Atta). Daraus resultiert der hohe Ballaststoffgehalt. Fladenbrote aus hellem Auszugsmehl enthalten deutlich weniger Ballaststoffe.",
      },
    ],
    macroContext: [
      "Kohlenhydrate machen den Großteil aus, doch die Ballaststoffe sind der oft übersehene Vorteil: Ein mittleres Roti liefert etwa 5,8 g Ballaststoffe — ein wertvoller Beitrag zum Tagesbedarf.",
      "Der Proteingehalt ist solide, dient aber eher als Beilage; der Hauptteil des Proteins stammt in der Regel aus Dal, Hülsenfrüchten oder Paneer.",
    ],
    comparison: {
      heading: "Roti im Vergleich zu Reis",
      intro:
        "Eine der häufigsten Fragen beim Mahlzeiten-Tracking lautet: Roti oder Reis? Hier ist der direkte Vergleich typischer Portionen.",
      items: [
        { slug: "roti", grams: 60, label: "1 mittleres Roti (60g)" },
        { slug: "roti", grams: 120, label: "2 mittlere Rotis (120g)" },
        { slug: "rice", grams: 180, label: "1 Tasse gekochter Reis (180g)" },
      ],
      footnote:
        "Zwei mittlere Rotis und eine Schale Reis haben einen sehr ähnlichen Brennwert. Die Rotis liefern jedoch spürbar mehr Ballaststoffe und Eiweiß. Keine Wahl ist falsch — die Saucen und Beilagen wiegen meist schwerer.",
    },
    faqs: [
      {
        question: "Wie viele Kalorien haben 2 Rotis?",
        answer:
          "Zwei mittlere Rotis (zusammen ca. 120 g) haben etwa 320 Kalorien, 10,4 g Protein und 11,6 g Ballaststoffe. Bei kleinen Rotis (ca. 40 g) liegt der Wert bei rund 214 Kalorien.",
      },
      {
        question: "Hat Roti mehr Eiweiß als Reis?",
        answer:
          "Ja, bezogen auf das Gewicht deutlich mehr. Ein 60 g Roti enthält ca. 5,2 g Protein, verglichen mit 5,0 g in einer 180 g Tasse Reis. Das Roti erreicht diesen Proteingehalt bei einem Drittel des Gewichts und liefert 5,8 g Ballaststoffe (Reis: 0,7 g).",
      },
      {
        question: "Warum nennt jede Website eine andere Kalorienzahl?",
        answer:
          "Weil sie unterschiedliche Fragen beantworten. Viele drucken generische Tabellenwerte pro 100 Gramm ab. Bei LogMyPlate zeigen wir praxisnahe Portionen und echte Spannweiten.",
      },
    ],
    related: ["rice", "dal", "paneer", "idli"],
  },
  {
    slug: "dal",
    name: "Dal",
    tier: "indian",
    aka: ["Gelbes Dal", "Tadka Dal", "indische Linsensuppe"],
    title: "Kalorien in Dal — Nach Kelle und Schale, nicht pro 100 g",
    description:
      "Eine Schale (Katori) traditionelles gelbes Dal enthält rund 150 Kalorien und 8 g pflanzliches Protein. Vergleiche Konsistenzen und Portionen.",
    intro: [
      "Dal ist das Herzstück einer ausgewogenen pflanzlichen Ernährung, doch das Kalorienzählen sorgt oft für Verwirrung.",
      "Der Kaloriengehalt schwankt stark je nach Dicke der Suppe und vor allem nach der Menge an Öl oder Ghee im Würz-Anbraten (Tadka) mit Kreuzkümmel, Knoblauch und Gewürzen.",
      "Nachfolgend findest du realistische Nährwerte für Schalen und Portionen aus dem Alltag.",
    ],
    per100g: { calories: 95, protein: 5.2, carbs: 12.8, fat: 2.3, fiber: 3.2, sodium: 210 },
    portions: [
      { label: "1 kleine Schale (dünnes Dal)", grams: 120, note: "flüssigere Konsistenz für den Alltag" },
      { label: "1 mittlere Schale (Standard zu Hause)", grams: 160, note: "die klassische Portion zum Mittagessen" },
      { label: "1 große Restaurant-Schale", grams: 220, note: "dickflüssiger mit großzügigem Tadka" },
      { label: "Dal Makhani (mit Sahne & Butter)", grams: 180, note: "schwarze Linsen reichhaltig verfeinert" },
    ],
    observedRange:
      "In echten Mahlzeiten schwankte eine Portion Dal zwischen 100 g und 250 g und 90 bis 280 kcal.",
    portionHonesty: [
      "Der größte Hebel beim Dal ist das Fett beim Anbraten. Zwei Esslöffel Ghee im Topf verdoppeln die Kalorien, ohne dass sich das optische Volumen nennenswert verändert.",
      "Selbstgekochtes Dal ist meist deutlich fettärmer und ballaststoffreicher als Restaurant-Varianten.",
    ],
    whatChangesIt: [
      {
        heading: "Öl oder Ghee im Tadka",
        body: "Die Gewürze werden zu Beginn in heißem Fett angeröstet. Die Fettmenge in diesem Schritt bestimmt die Kaloriendichte maßgeblich.",
      },
      {
        heading: "Wassergehalt und Konsistenz",
        body: "Dünnflüssiges Dal enthält mehr Wasser und weniger Kalorien pro Kelle; sämig eingekochtes Dal konzentriert Linsen und Nährstoffe.",
      },
      {
        heading: "Zugabe von Milchprodukten",
        body: "Dal Makhani oder Restaurant-Dal wird oft mit Butter und Sahne abgerundet, was den Kalorien- und Fettgehalt stark anhebt.",
      },
    ],
    macroContext: [
      "Dal liefert wertvolles pflanzliches Eiweiß mit viel Lysin sowie lösliche Ballaststoffe für eine gesunde Verdauung und langanhaltende Sättigung.",
      "Kombiniert mit Reis oder Vollkorn-Roti entsteht ein vollwertiges Aminosäureprofil.",
    ],
    comparison: {
      heading: "Dal im Vergleich zu anderen Proteinquellen",
      intro: "Sieh dir an, wie sich gelbes Dal gegenüber Paneer und Roti verhält.",
      items: [
        { slug: "dal", grams: 160, label: "1 Schale gelbes Dal (160g)" },
        { slug: "paneer", grams: 80, label: "Paneer-Würfel (80g)" },
        { slug: "roti", grams: 60, label: "1 mittleres Roti (60g)" },
      ],
      footnote:
        "Dal liefert pflanzliches Protein gepaart mit Ballaststoffen und sehr wenig gesättigtem Fett — im Gegensatz zu Käse, der deutlich mehr Fett mitbringt.",
    },
    faqs: [
      {
        question: "Wie viele Kalorien hat eine Kelle Dal?",
        answer:
          "Eine normale Kelle hausgemachtes gelbes Dal hat ca. 120 bis 150 Kalorien, abhängig von Konsistenz und Fettzugabe.",
      },
      {
        question: "Ist Dal ein vollwertiges Protein?",
        answer:
          "Linsen sind reich an Lysin, haben aber etwas weniger Methionin. In Kombination mit Getreide (Reis oder Weizen-Roti) entsteht ein komplettes Proteinprofil.",
      },
    ],
    related: ["roti", "rice", "paneer"],
  },
  {
    slug: "rice",
    name: "Reis",
    tier: "indian",
    aka: ["weißer Reis", "Basmatireis", "gekochter Reis"],
    title: "Kalorien in gekochtem Reis — Pro Tasse und Teller",
    description:
      "Eine mittlere Tasse gekochter Reis enthält etwa 170 Kalorien und 37 g Kohlenhydrate. Nährwerte nach praxisnahen Küchenmaßen.",
    intro: [
      "Das Rohgewicht nützt dir wenig, wenn der Reis bereits fertig auf dem Teller dampft.",
      "Beim Kochen saugt Reis Wasser auf und verdreifacht sein Gewicht. 100 g roher Reis haben nichts mit 100 g gekochtem Reis gemein. Unsere Angaben beziehen sich immer auf servierfertigen Reis.",
      "Hier findest du realistische Portionsangaben für Schalen, Esslöffel und Teller.",
    ],
    per100g: { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, sodium: 1 },
    portions: [
      { label: "1 kleine Schale / flache Tasse", grams: 100, note: "ca. 3 bis 4 gehäufte Esslöffel" },
      { label: "1 mittlere Schale (Standardportion)", grams: 130, note: "ausgewogene Beilagenmenge" },
      { label: "1 normaler flacher Teller", grams: 200, note: "Hauptmahlzeit-Portion" },
      { label: "Große Restaurant-Portion / Biryani", grams: 280, note: "oft mit Öl und Gewürzen zubereitet" },
    ],
    observedRange:
      "In echten Ernährungstagebüchern variierten Reisportionen zwischen 80 g und 320 g pro Mahlzeit.",
    portionHonesty: [
      "Mit einem großen Schöpflöffel unterschätzt man Reisportionen sehr schnell. Eine Tasse oder kleine Schale als Orientierung hilft enorm.",
      "Pur in Wasser gekochter Reis enthält fast kein Fett. Gebratener Reis, Biryani oder Risotto haben durch Öl oder Butter deutlich höhere Kalorienwerte.",
    ],
    whatChangesIt: [
      {
        heading: "Öl oder Butter im Kochwasser",
        body: "Wird der Reis vorab in Fett angeschwitzt oder mit Butter verfeinert, steigen die Kalorien pro 100 g an.",
      },
      {
        heading: "Weißer Reis im Vergleich zu Vollkornreis",
        body: "Die Kalorien pro 100 g gekocht sind nahezu identisch (~130 kcal). Vollkornreis liefert jedoch mehr Ballaststoffe und Mikronährstoffe.",
      },
    ],
    macroContext: [
      "Reis ist eine leicht verdauliche Kohlenhydratquelle, die dem Körper zügig Energie für Alltag und Sport bereitstellt.",
      "Er enthält von Natur aus so gut wie kein Fett und kaum Natrium.",
    ],
    comparison: {
      heading: "Reis im Vergleich zu Roti und Fladenbrot",
      intro: "Vergleiche gekochten Reis mit Fladenbrot als Hauptbeilage.",
      items: [
        { slug: "rice", grams: 130, label: "1 Schale Reis (130g)" },
        { slug: "roti", grams: 60, label: "1 mittleres Roti (60g)" },
        { slug: "paratha", grams: 80, label: "1 Paratha (80g)" },
      ],
      footnote:
        "Reis und Roti haben pro Portion eine sehr ähnliche Kaloriendichte, Roti punktet jedoch mit mehr Ballaststoffen aus Vollkorn.",
    },
    faqs: [
      {
        question: "Wie viele Kalorien haben 4 Esslöffel Reis?",
        answer:
          "Vier gehäufte Esslöffel gekochter Reis wiegen rund 100 g und haben etwa 130 Kalorien.",
      },
      {
        question: "Macht weißer Reis dick?",
        answer:
          "Nein. Eine Gewichtszunahme entsteht durch einen Kalorienüberschuss über den gesamten Tag, nicht durch Reis als Einzellebensmittel.",
      },
    ],
    related: ["roti", "dal", "paratha"],
  },
  {
    slug: "paneer",
    name: "Paneer",
    tier: "indian",
    aka: ["Paneer-Käse", "indischer Frischkäse"],
    title: "Kalorien in Paneer — Nach Würfeln und Portionen",
    description:
      "100 g traditioneller Paneer-Käse liefern rund 290 Kalorien, 18 g Protein und 22 g Fett. Nährwerte nach praktischen Portionsgrößen.",
    intro: [
      "Paneer ist der wichtigste vegetarische Proteinlieferant der indischen Küche, geschätzt für seine milde Textur und Saucenaufnahme.",
      "Hergestellt aus frischer Vollmilch, vereint er hochwertiges Eiweiß mit einem spürbaren Fettgehalt.",
      "Bei Currys ist es wichtig, die Paneer-Würfel getrennt von der Sauce zu betrachten.",
    ],
    per100g: { calories: 290, protein: 18.3, carbs: 3.6, fat: 22.5, fiber: 0, sodium: 18 },
    portions: [
      { label: "1 kleiner Würfel", grams: 20, note: "übliche Schnittgröße in Gemüsecurrys" },
      { label: "Portion aus 4 Würfeln", grams: 80, note: "typische Menge in einer Einzelportion Curry" },
      { label: "Standardportion 100g", grams: 100, note: "gängige Referenzmenge beim Kochen" },
      { label: "Teller Paneer-Curry komplett", grams: 200, note: "enthält Würfel und reichhaltige Sauce" },
    ],
    observedRange:
      "In erfassten Mahlzeiten reichten die Paneer-Mengen von 40 g bis 160 g pro Gericht.",
    portionHonesty: [
      "Paneer ist sehr nährstoffdicht. 150 g gebratener Paneer in Buttersauce können schnell über 500 Kalorien erreichen.",
      "Gegrillter Paneer (Tikka) spart gegenüber frittiertem Paneer viele Kalorien ein.",
    ],
    whatChangesIt: [
      {
        heading: "Milchfettgehalt",
        body: "Selbstgemachter Paneer aus fettarmer Milch halbiert den Fettgehalt, ohne den Proteingehalt zu senken.",
      },
      {
        heading: "Anbraten in Fett",
        body: "Werden die Käsewürfel vorab in Ghee angebraten, saugen sie zusätzliches Fett auf.",
      },
    ],
    macroContext: [
      "Paneer liefert vollständiges Protein (Kasein) mit langsamer Resorption sowie reichlich Calcium für Knochen und Muskeln.",
      "Da er kaum Kohlenhydrate enthält, eignet er sich gut für Low-Carb-Konzepte.",
    ],
    comparison: {
      heading: "Paneer im Vergleich zu anderen Eiweißquellen",
      intro: "Vergleiche Paneer mit Dal und Fladenbrot.",
      items: [
        { slug: "paneer", grams: 80, label: "Paneer-Würfel (80g)" },
        { slug: "dal", grams: 160, label: "1 Schale gelbes Dal (160g)" },
        { slug: "idli", grams: 80, label: "2 gedämpfte Idlis (80g)" },
      ],
      footnote:
        "Paneer liefert mehr Protein pro Gramm als Hülsenfrüchte, bringt aber naturgemäß auch mehr Fett mit.",
    },
    faqs: [
      {
        question: "Ist Paneer gut für den Muskelaufbau?",
        answer:
          "Ja, das hochwertige Milcheiweiß unterstützt die Muskelproteinsynthese hervorragend.",
      },
      {
        question: "Enthält Paneer viel Laktose?",
        answer:
          "Beim Abseihen und Pressen wird der Großteil der Molke entfernt, wodurch Paneer deutlich laktoseärmer als Trinkmilch ist.",
      },
    ],
    related: ["dal", "roti", "idli"],
  },
  {
    slug: "idli",
    name: "Idli",
    tier: "indian",
    aka: ["Idly", "gedämpfte Reisküchlein"],
    title: "Kalorien in Idli — Gedämpft, fettarm und pro Stück",
    description:
      "Ein mittleres Idli hat nur rund 58 Kalorien und nahezu kein Fett. Detaillierte Nährwerte pro Stück und mit traditionellen Beilagen.",
    intro: [
      "Idli gilt als eines der gesündesten Frühstücke der Welt, da es ausschließlich im Dampf gegart wird.",
      "Der Teig aus fermentiertem Reis und Urad-Bohnen ist besonders bekömmlich und schont den Magen.",
      "Erfahre hier die genauen Werte pro Stück und wie sich Beilagen auswirken.",
    ],
    per100g: { calories: 145, protein: 4.8, carbs: 30.2, fat: 0.5, fiber: 1.5, sodium: 120 },
    portions: [
      { label: "1 kleines Idli (Mini)", grams: 25, note: "Party- oder Snackgröße" },
      { label: "1 mittleres Idli (Standard)", grams: 40, note: "die klassische Haushaltsform" },
      { label: "2 mittlere Idlis (Frühstücksportion)", grams: 80, note: "die gängigste Frühstücksmenge" },
      { label: "2 Idlis mit Sambar & Chutney", grams: 200, note: "vollständiges Gericht mit Gemüsesuppe" },
    ],
    observedRange:
      "Bei unseren Nutzern besteht ein typisches Frühstück meist aus 2 bis 4 Idlis.",
    portionHonesty: [
      "Das Idli selbst ist fast fettfrei. Die Kalorienfalle liegt oft beim Kokos-Chutney, das durch geraspelte Kokosnuss viel Fett enthält.",
      "Sambar (würzige Linsensuppe) ist die kalorienärmere, ballaststoffreiche Beilage.",
    ],
    whatChangesIt: [
      {
        heading: "Linsenanteil im Teig",
        body: "Ein höherer Anteil an Urad-Dal steigert den Proteingehalt und senkt den glykämischen Index.",
      },
      {
        heading: "Chutney-Sorten",
        body: "Kokos-Chutney liefert schnell viele Kalorien, Tomaten- oder Minz-Chutney ist deutlich leichter.",
      },
    ],
    macroContext: [
      "Nahezu fettfrei liefert Idli gut verdauliche Kohlenhydrate und etwas Protein.",
      "Durch die natürliche Fermentation entstehen wertvolle B-Vitamine.",
    ],
    comparison: {
      heading: "Idli im Vergleich zu anderen Frühstücksoptionen",
      intro: "Vergleiche Idli mit Roti und Paratha.",
      items: [
        { slug: "idli", grams: 80, label: "2 mittlere Idlis (80g)" },
        { slug: "roti", grams: 60, label: "1 mittleres Roti (60g)" },
        { slug: "paratha", grams: 80, label: "1 Paratha (80g)" },
      ],
      footnote:
        "Zwei Idlis haben weniger Kalorien als ein Roti und weniger als die Hälfte einer gebratenen Paratha.",
    },
    faqs: [
      {
        question: "Wie viele Kalorien haben 2 Idlis mit Sambar?",
        answer:
          "Zwei mittlere Idlis mit einer Kelle Gemüsesambar kommen auf rund 180 bis 220 Kalorien.",
      },
      {
        question: "Eignet sich Idli zum Abnehmen?",
        answer:
          "Ja! Durch die schonende Dampfgarung und den geringen Fettgehalt sättigt Idli bei wenigen Kalorien.",
      },
    ],
    related: ["roti", "dal", "rice"],
  },
  {
    slug: "paratha",
    name: "Paratha",
    tier: "indian",
    aka: ["Parauhta", "gebratenes Fladenbrot", "Aloo Paratha"],
    title: "Kalorien in Paratha — Schlicht und gefüllt pro Stück",
    description:
      "Eine einfache Paratha hat etwa 290 Kalorien; mit Kartoffelfüllung (Aloo) sind es 300 bis 380 Kalorien. Nährwerte und Portionsunterschiede.",
    intro: [
      "Paratha ist ein knuspriges, geschichtetes Fladenbrot, das mit Ghee oder Öl in der Pfanne ausgebacken wird.",
      "Anders als das fettfrei gebackene Roti enthält Paratha Fett sowohl im Teig als auch von der Pfanne, was die Kalorien verdoppelt.",
      "Hier erfährst du den Unterschied zwischen einfachen und gefüllten Varianten.",
    ],
    per100g: { calories: 360, protein: 7.8, carbs: 52.4, fat: 13.8, fiber: 5.6, sodium: 340 },
    portions: [
      { label: "1 einfache Paratha (hausgemacht)", grams: 80, note: "blättriger Teig mit Ghee gebraten" },
      { label: "1 Aloo Paratha (mit Kartoffelfüllung)", grams: 120, note: "gefüllt mit gewürztem Kartoffelstampf" },
      { label: "1 Paneer Paratha (mit Käsefüllung)", grams: 130, note: "proteinreicher, aber auch fettiger" },
      { label: "Restaurant-Paratha mit Butter", grams: 150, note: "reichlich Fett im Teig und schmelzende Butter obenauf" },
    ],
    observedRange:
      "Eine Paratha schwankt je nach Füllung und Fettzugabe zwischen 70 g und über 180 g.",
    portionHonesty: [
      "Eine einzige gefüllte Restaurant-Paratha mit Butter kann so viele Kalorien wie drei einfache Rotis haben.",
      "Die Zubereitung in einer beschichteten Pfanne mit wenig Ölspray spart bis zu 100 Kalorien pro Stück.",
    ],
    whatChangesIt: [
      {
        heading: "Die Art der Füllung",
        body: "Kartoffeln (Aloo) liefern zusätzliche Kohlenhydrate, Paneer liefert Protein und Fett, Blumenkohl (Gobi) ist die leichteste Variante.",
      },
      {
        heading: "Das Butterstückchen obenauf",
        body: "Ein Stück schmelzende Butter auf der heißen Paratha fügt sofort 70 bis 100 Kalorien hinzu.",
      },
    ],
    macroContext: [
      "Paratha liefert dichte Energie aus Kohlenhydraten und Fett für ein ausgiebiges Frühstück.",
      "Naturjoghurt als Beilage bremst den Blutzuckeranstieg und steuert wertvolles Eiweiß bei.",
    ],
    comparison: {
      heading: "Paratha im Vergleich zu Roti",
      intro: "Vergleiche die gebratene Paratha mit dem fettfreien Roti.",
      items: [
        { slug: "paratha", grams: 80, label: "1 einfache Paratha (80g)" },
        { slug: "roti", grams: 60, label: "1 mittleres Roti (60g)" },
        { slug: "idli", grams: 80, label: "2 mittlere Idlis (80g)" },
      ],
      footnote:
        "Eine einfache Paratha hat fast die doppelten Kalorien eines gleich großen Rotis, bedingt durch das Bratfett.",
    },
    faqs: [
      {
        question: "Wie viele Kalorien hat eine Aloo Paratha mit Butter?",
        answer:
          "Eine hausgemachte Aloo Paratha hat ca. 340 Kalorien. Mit Butterflocke obenauf sind es etwa 415 bis 440 Kalorien.",
      },
      {
        question: "Kann ich Paratha während einer Diät essen?",
        answer:
          "Ja, solange sie in dein tägliches Kalorienbudget passt. Fettarm gebraten und mit Salat und Joghurt kombiniert ist sie gut integrierbar.",
      },
    ],
    related: ["roti", "rice", "paneer"],
  },
];

export function getDeFood(slug: string): FoodPage | undefined {
  return deFoods.find((f) => f.slug === slug);
}
