import type { FoodPage } from "@/app/(en)/calories/food-data";

export const esFoods: FoodPage[] = [
  {
    slug: "roti",
    name: "Roti",
    tier: "indian",
    aka: ["chapati", "phulka", "chapathi"],
    title: "Calorías en el Roti (Chapati) — Por unidad, no por 100 g",
    description:
      "Un roti mediano aporta unas 160 calorías. Calorías, proteína y fibra para rotis pequeños, medianos y grandes — en los tamaños reales de preparación.",
    intro: [
      "Nadie pesa un roti antes de comerlo. Ese es el principal dilema al buscar esta información.",
      "La mayoría de las tablas nutricionales indican las calorías del roti 'por cada 100 gramos'. Pero un roti no pesa 100 gramos, y el que se prepara en casa no es igual al de un restaurante. El aporte calórico real depende del tamaño y grosor en el comal o sartén.",
      "Aquí tienes los valores del roti en las dimensiones en que la gente realmente lo cocina y consume.",
    ],
    per100g: { calories: 267, protein: 8.7, carbs: 53.3, fat: 2.7, fiber: 9.7, sodium: 317 },
    portions: [
      { label: "1 roti pequeño", grams: 40, note: "tamaño de thali o phulka delgado" },
      { label: "1 roti mediano", grams: 60, note: "el tamaño más habitual en nuestros registros" },
      { label: "1 roti grande de comal", grams: 90, note: "grueso o de comal completo" },
      { label: "2 rotis medianos", grams: 120 },
    ],
    observedRange:
      "En comidas reales registradas en LogMyPlate, un solo roti ha oscilado entre los 40 g y los 180 g.",
    portionHonesty: [
      "Podríamos darte una sola cifra y llamarla 'un roti', como hacen la mayoría de las páginas. Pero una variación de cuatro veces en el peso significa una variación de cuatro veces en las calorías: aproximadamente 107 calorías en el extremo pequeño y más de 480 en el grande.",
      "Ese rango no se debe a datos imprecisos, sino a la realidad: un phulka fino en un menú tradicional y un roti tandoori grueso se denominan con total honestidad 'un roti'.",
      "Elige la fila que mejor coincida con lo que ves en tu plato. Si tienes dudas, la opción mediana es la más representativa.",
    ],
    whatChangesIt: [
      {
        heading: "Ghee o aceite untado encima",
        body: "Una cucharadita de ghee equivale a unos 5 g de grasa pura, lo que suma cerca de 45 calorías. En casa se suele untar menos; en restaurantes la cantidad suele ser mayor.",
      },
      {
        heading: "El grosor, más que el diámetro",
        body: "Un roti de 15 cm enrollado grueso puede pesar más que uno de 20 cm estirado fino. El peso sigue mucho más de cerca al grosor que al diámetro, por lo que juzgar solo por el ancho suele ser engañoso.",
      },
      {
        heading: "El tipo de harina",
        body: "Estas cifras corresponden a harina de trigo integral (atta), de donde proviene la fibra. Los panes elaborados con harinas refinadas aportan notablemente menos fibra.",
      },
    ],
    macroContext: [
      "Los carbohidratos son el componente mayoritario, pero la fibra es el beneficio que muchos pasan por alto: un roti mediano aporta unos 5.8 g de fibra, una proporción significativa de la ingesta diaria recomendada.",
      "El aporte de proteína es moderado. El roti acompaña, pero la proteína principal suele venir del dal, legumbres o queso que lo acompaña.",
    ],
    comparison: {
      heading: "Roti versus arroz",
      intro:
        "Una de las dudas más frecuentes al registrar comidas es si conviene consumir roti o arroz. Esto es lo que aporta una ración típica de cada uno.",
      items: [
        { slug: "roti", grams: 60, label: "1 roti mediano" },
        { slug: "roti", grams: 120, label: "2 rotis medianos" },
        { slug: "rice", grams: 180, label: "1 taza de arroz cocido" },
      ],
      footnote:
        "Dos rotis medianos y una taza de arroz cocido tienen un aporte calórico muy similar. Sin embargo, los rotis proporcionan significativamente más fibra y proteína. Ninguno es una opción equivocada: los acompañamientos influyen más que la base elegida.",
    },
    faqs: [
      {
        question: "¿Cuántas calorías tienen 2 rotis?",
        answer:
          "Dos rotis medianos (unos 120 g en conjunto) aportan aproximadamente 320 calorías, con 10.4 g de proteína y 11.6 g de fibra. Si son pequeños (unos 40 g cada uno), dos rotis rondan las 214 calorías.",
      },
      {
        question: "¿El roti tiene más proteína que el arroz?",
        answer:
          "Sí, y en mayor proporción por peso. Un roti de 60 g contiene unos 5.2 g de proteína frente a los 5.0 g de una taza de 180 g de arroz cocido. El roti alcanza esa cifra con un tercio del peso y aporta unos 5.8 g de fibra, comparado con 0.7 g en el arroz blanco.",
      },
      {
        question: "¿Por qué cada sitio web indica una cifra diferente de calorías?",
        answer:
          "Porque responden a preguntas distintas. Muchos publican datos por cada 100 gramos de tablas estándar y dejan que adivines el peso. En LogMyPlate mostramos las porciones habituales y los rangos observados en platos reales.",
      },
    ],
    related: ["rice", "dal", "paneer", "idli"],
  },
  {
    slug: "dal",
    name: "Dal",
    tier: "indian",
    aka: ["daal", "dal tadka", "toor dal", "moong dal", "lentejas"],
    title: "Calorías en el Dal — Por porción y tazón, no por 100 g",
    description:
      "Un tazón estándar de dal aporta cerca de 150 calorías y 9 g de proteína. Calorías, proteína y fibra para porción pequeña, estándar y plato hondo.",
    intro: [
      "El dal (guisado de lentejas) es uno de los platos más registrados en LogMyPlate y uno de los que más varían, ya que 'un tazón' significa algo distinto en cada hogar.",
      "Además, es la principal fuente de proteína en los menús vegetarianos, por lo que estimar la porción con precisión resulta muy valioso.",
    ],
    per100g: { calories: 100, protein: 6, carbs: 14, fat: 3, fiber: 4, sodium: 250 },
    portions: [
      { label: "1 tazón pequeño", grams: 120 },
      { label: "1 tazón estándar", grams: 150, note: "el tamaño más frecuente registrado" },
      { label: "1 tazón grande", grams: 180 },
      { label: "1 plato hondo lleno", grams: 200 },
    ],
    observedRange:
      "En comidas reales analizadas en LogMyPlate, una porción de dal ha variado entre 120 g y 375 g.",
    portionHonesty: [
      "El tamaño del recipiente varía de una cocina a otra. Un tazón en una mesa puede contener 120 g y en otra 225 g; ambos se perciben como 'un plato'.",
      "Dado que el dal aporta aproximadamente 100 calorías por cada 100 g, el cálculo mental es sencillo: los gramos y las calorías coinciden de forma muy cercana. Un tazón de 150 g contiene cerca de 150 calorías.",
    ],
    whatChangesIt: [
      {
        heading: "El sofrito o tadka con grasa",
        body: "Una cucharadita de aceite o ghee suma unos 5 g de grasa, es decir, cerca de 45 calorías adicionales. En restaurantes, el sofrito puede llevar el doble o triple.",
      },
      {
        heading: "La consistencia del caldo",
        body: "Un dal líquido y uno espeso son el mismo alimento con distinta concentración de agua. Un dal más caldoso aporta menos calorías por tazón porque contiene mayor porcentaje de agua.",
      },
      {
        heading: "Preparaciones cremosas (Dal Makhani)",
        body: "Estos valores corresponden a lentejas caseras con sofrito ligero. Platos como el Dal Makhani llevan mantequilla y crema, por lo que deben registrarse por separado.",
      },
    ],
    macroContext: [
      "Aporta cerca de 9 g de proteína y 6 g de fibra en un tazón estándar de 150 g. En platos vegetarianos suele ser el mayor contribuyente de proteína.",
      "También concentra una parte del sodio de la comida, dependiendo de la cantidad de sal agregada durante la cocción.",
    ],
    comparison: {
      heading: "Fuentes de proteína en comidas vegetarianas",
      intro:
        "En la cocina vegetariana la proteína proviene de varias fuentes complementarias. Aquí puedes ver cómo se distribuye.",
      items: [
        { slug: "dal", grams: 150, label: "1 tazón de dal" },
        { slug: "paneer", grams: 75, label: "1 trozo de paneer" },
        { slug: "roti", grams: 60, label: "1 roti mediano" },
      ],
      footnote:
        "Un tazón de dal y un trozo de paneer aportan proteína similar con distinta densidad calórica: el paneer concentra más grasa y energía. Una comida con dal, dos rotis y yogur suma una excelente cantidad de proteína.",
    },
    faqs: [
      {
        question: "¿Cuánta proteína contiene un tazón de dal?",
        answer:
          "Aproximadamente 9 g en una porción estándar de 150 g, junto con unos 6 g de fibra dietética. Un tazón grande de 180 g aporta cerca de 10.8 g de proteína.",
      },
      {
        question: "¿El Dal Makhani tiene las mismas calorías?",
        answer:
          "No. El Dal Makhani se prepara con mantequilla, crema y cocción prolongada, por lo que su aporte calórico y de grasa es bastante superior. Conviene registrarlo como plato específico.",
      },
      {
        question: "¿El sofrito cambia mucho las calorías?",
        answer:
          "Sí, influye notablemente. Una cucharadita extra de ghee o aceite agrega unas 45 calorías, lo que puede representar hasta un 30% más en un tazón pequeño.",
      },
    ],
    related: ["roti", "rice", "paneer", "idli"],
  },
  {
    slug: "rice",
    name: "Arroz cocido",
    tier: "global",
    aka: ["chawal", "arroz blanco", "arroz al vapor", "arroz hervido"],
    title: "Calorías en el Arroz Cocido — Por taza, tazón y plato servido",
    description:
      "Una taza de arroz blanco cocido aporta unas 250 calorías. Calorías y macros por porción, y la confusión común entre peso crudo y cocido.",
    intro: [
      "El arroz es uno de los alimentos que más se registran de forma errónea, casi siempre por el mismo motivo: usar el peso del grano crudo.",
      "El arroz aproximadamente triplica su peso al absorber agua durante la cocción: 100 g de arroz crudo se convierten en casi 300 g servidos. Todas las cifras de esta página corresponden al arroz cocido listo para comer.",
    ],
    per100g: { calories: 140, protein: 2.8, carbs: 30.1, fat: 0.5, fiber: 0.4 },
    portions: [
      { label: "1 tazón pequeño", grams: 150 },
      { label: "1 taza de arroz cocido", grams: 180, note: "la medida más común en registros" },
      { label: "1 tazón hondo", grams: 200 },
      { label: "1 porción de plato servido", grams: 250 },
    ],
    observedRange:
      "En comidas reales analizadas con LogMyPlate, una ración de arroz cocido suele oscilar entre 100 g y 320 g.",
    portionHonesty: [
      "El arroz se extiende plano sobre el plato, lo que hace muy fácil subestimar su volumen a simple vista. Una ración servida que parece moderada a menudo pesa 250 g.",
      "Si deseas pesar ocasionalmente un alimento para entrenar tu percepción visual, el arroz cocido es el mejor candidato para comenzar.",
    ],
    whatChangesIt: [
      {
        heading: "Peso crudo versus cocido",
        body: "Este es el factor clave. El grano absorbe agua y triplica su volumen. Si registras 100 g crudos creyendo que son cocidos, estarás subestimando casi tres veces su valor real.",
      },
      {
        heading: "Ingredientes agregados",
        body: "El arroz frito, pulao, biryani o arroces con aceite, mantequilla o caldo concentrado aportan calorías extra por la grasa. Es mejor registrarlos por su nombre específico.",
      },
      {
        heading: "Variedad de grano",
        body: "El arroz basmati cocido promedia unas 120 calorías por 100 g frente a 140 en arroces de grano corto. Hay diferencia, pero la porción influye mucho más que la variedad.",
      },
    ],
    macroContext: [
      "El arroz es principalmente carbohidrato con escasa fibra y proteína. Por eso funciona como base energética que se complementa con legumbres, verduras y proteínas.",
      "Dado su bajo contenido de micronutrientes en versiones blancas refinadas, la calidad nutricional del plato recae en los acompañamientos.",
    ],
    comparison: {
      heading: "Arroz versus roti en porciones realistas",
      intro:
        "Ambos son bases cotidianas de la alimentación. Su comportamiento nutricional difiere cuando miras más allá de las calorías.",
      items: [
        { slug: "rice", grams: 180, label: "1 taza de arroz cocido" },
        { slug: "roti", grams: 120, label: "2 rotis medianos" },
        { slug: "rice", grams: 250, label: "1 plato servido de arroz" },
      ],
      footnote:
        "Una taza de arroz y dos rotis medianos rondan calorías semejantes, pero los rotis aportan hasta ocho veces más fibra y el doble de proteína. La cantidad servida tiene más impacto que la elección del cereal.",
    },
    faqs: [
      {
        question: "¿Estos datos son para arroz crudo o cocido?",
        answer:
          "Son para arroz cocido, tal como se sirve en el plato. El grano triplica su peso al absorber agua: 100 g en crudo rinden unos 300 g cocidos.",
      },
      {
        question: "¿Cuántas calorías tiene 1 taza de arroz cocido?",
        answer:
          "Una taza estándar (unos 180 g) contiene cerca de 250 calorías, con 5 g de proteína y 54 g de carbohidratos.",
      },
      {
        question: "¿El arroz basmati tiene menos calorías?",
        answer:
          "Ligeramente menos: ronda las 120 calorías por 100 g cocido frente a 140 en otras variedades. Es una diferencia real, pero el tamaño de tu porción influye mucho más.",
      },
    ],
    related: ["roti", "dal", "idli", "paneer"],
  },
  {
    slug: "paneer",
    name: "Paneer",
    tier: "indian",
    aka: ["queso cottage firme", "queso indio", "queso fresco"],
    title: "Calorías y Proteína en el Paneer — Por trozo y por 100 g",
    description:
      "100 g de paneer aportan 265 calorías y 18.3 g de proteína. Valores por pieza y cómo se compara con las legumbres como fuente de proteína.",
    intro: [
      "El paneer es una de las opciones más populares para obtener proteína en dietas sin carne: sus 18.3 g por 100 g superan a la gran mayoría de alternativas vegetales.",
      "También es un alimento denso en energía, ya que la proteína viene acompañada de grasa natural. Esto explica por qué 100 g de paneer aportan más del doble de calorías que 100 g de lentejas.",
    ],
    per100g: { calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8, fiber: 0, sodium: 22 },
    portions: [
      { label: "1 trozo mediano", grams: 75, note: "el tamaño más frecuente en guisados" },
      { label: "100 g", grams: 100, note: "peso estándar de referencia" },
      { label: "2 trozos", grams: 150 },
      { label: "1 ración abundante", grams: 200 },
    ],
    observedRange:
      "Las porciones registradas suelen centrarse alrededor de trozos de 75 g, consumidos habitualmente dentro de guisados con salsa.",
    portionHonesty: [
      "Rara vez se consume paneer solo. Lo que llega al plato suele ser paneer bañado en salsa o curry, y la salsa aporta sus propias calorías.",
      "Si estás comiendo Paneer Butter Masala o Shahi Paneer, registra el plato preparado en su conjunto en lugar de solo los dados de queso.",
    ],
    whatChangesIt: [
      {
        heading: "La salsa en la que se cocina",
        body: "Las preparaciones con crema, mantequilla y castañas de cajú suman una gran densidad energética. La salsa puede contener más calorías que el propio queso.",
      },
      {
        heading: "Frito versus fresco",
        body: "Dorar o freír los dados de paneer en aceite antes de agregarlos al guisado incrementa su contenido calórico. Agregarlo fresco en cubos conserva su valor original.",
      },
      {
        heading: "Leche entera versus descremada",
        body: "Estas cifras corresponden al paneer clásico de leche entera. Las versiones elaboradas con leche descremada contienen menos grasa y calorías, preservando la proteína.",
      },
    ],
    macroContext: [
      "18.3 g de proteína por 100 g con prácticamente nada de carbohidratos. Pocos alimentos vegetarianos igualan esa concentración de proteína.",
      "No contiene fibra, por lo que combinarlo con verduras o legumbres crea un plato nutricionalmente equilibrado.",
    ],
    comparison: {
      heading: "Paneer versus dal para proteína con calorías similares",
      intro:
        "Comparar solo por 100 g puede favorecer al paneer. Una comparación con aporte calórico similar muestra un panorama más balanceado.",
      items: [
        { slug: "paneer", grams: 100, label: "100 g de paneer" },
        { slug: "dal", grams: 200, label: "1 tazón de dal" },
        { slug: "roti", grams: 90, label: "1 roti grande" },
      ],
      footnote:
        "A niveles calóricos comparables, el paneer ofrece la mayor cantidad de proteína, el dal aporta fibra (de la cual el paneer carece) y el roti complementa con carbohidratos complejos y fibra.",
    },
    faqs: [
      {
        question: "¿Cuánta proteína hay en 100 g de paneer?",
        answer:
          "Aproximadamente 18.3 g de proteína, junto con 265 calorías y 20.8 g de grasa. Un trozo de 75 g aporta cerca de 13.7 g de proteína.",
      },
      {
        question: "¿Es mejor el paneer o las lentejas para ganar proteína?",
        answer:
          "El paneer es más concentrado por bocado, mientras que las lentejas y el dal aportan fibra con menor densidad calórica. En una alimentación equilibrada, combinarlos resulta ideal.",
      },
      {
        question: "¿El paneer en salsa tiene las mismas calorías?",
        answer:
          "No. Las salsas con crema y mantequilla pueden duplicar el aporte calórico. Es recomendable registrar el guisado completo y no únicamente el queso.",
      },
    ],
    related: ["dal", "roti", "rice", "idli"],
  },
  {
    slug: "idli",
    name: "Idli",
    tier: "indian",
    aka: ["idly", "pastel de arroz al vapor"],
    title: "Calorías en el Idli — Para 1, 2, 3 y 4 unidades",
    description:
      "Un idli aporta unas 65 calorías. Calorías y macros de 1 a 4 piezas, y por qué el chutney y el sambar influyen en el total del desayuno.",
    intro: [
      "El idli es uno de los pocos alimentos tradicionales que presenta un tamaño notablemente consistente. Una pieza es una pieza, lo que simplifica su seguimiento calórico.",
      "El detalle está en los acompañamientos: en un desayuno habitual, los chutneys y salsas pueden sumar más calorías que los propios idlis.",
    ],
    per100g: { calories: 130, protein: 4, carbs: 26, fat: 1, fiber: 2, sodium: 300 },
    portions: [
      { label: "1 idli", grams: 50 },
      { label: "2 idlis", grams: 100, note: "la porción de desayuno habitual" },
      { label: "3 idlis", grams: 150 },
      { label: "4 idlis", grams: 200 },
    ],
    observedRange:
      "Los idlis registrados se agrupan de forma muy constante alrededor de los 50 g por unidad.",
    portionHonesty: [
      "Los idlis estándar se apegan tanto a los 50 g que contarlos por piezas funciona con gran exactitud, algo poco común en platos tradicionales.",
      "La excepción son variedades regionales de gran formato (como el Thatte Idli), que pueden equivaler a dos o tres piezas estándar en un solo disco.",
    ],
    whatChangesIt: [
      {
        heading: "El chutney de coco",
        body: "El chutney tradicional contiene coco rallado y aceite. Una porción generosa puede superar en calorías a los dos idlis que acompaña.",
      },
      {
        heading: "El sambar",
        body: "El sambar, a base de lentejas y verduras cocidas, aporta proteína y fibra vegetal con moderada cantidad de calorías.",
      },
      {
        heading: "Cocción al vapor",
        body: "Al prepararse al vapor sin fritura, cada idli contiene solo unos 0.5 g de grasa, haciéndolo una base liviana y de fácil digestión.",
      },
    ],
    macroContext: [
      "Alrededor de 65 calorías y 2 g de proteína por unidad, con mínima cantidad de grasa.",
      "La fermentación natural de la masa mejora la digestibilidad sin alterar de forma sensible el recuento calórico.",
    ],
    comparison: {
      heading: "Idli frente a otras opciones de desayuno",
      intro: "Cómo se comparan dos idlis frente a otras alternativas cotidianas de desayuno.",
      items: [
        { slug: "idli", grams: 100, label: "2 idlis" },
        { slug: "roti", grams: 60, label: "1 roti mediano" },
        { slug: "rice", grams: 150, label: "1 tazón de arroz" },
      ],
      footnote:
        "Dos idlis se sitúan por debajo de un tazón de arroz y cerca de un roti mediano, con prácticamente nada de grasa. Los acompañamientos marcarán la diferencia final.",
    },
    faqs: [
      {
        question: "¿Cuántas calorías tienen 2 idlis?",
        answer:
          "Unos 130 calorías para dos piezas estándar de 50 g cada una, con aproximadamente 4 g de proteína y solo 1 g de grasa.",
      },
      {
        question: "¿Debo registrar el sambar y el chutney por separado?",
        answer:
          "Sí, es muy recomendable. El chutney de coco puede aportar más calorías que los propios idlis, mientras que el sambar aporta proteína y fibra valiosa.",
      },
      {
        question: "¿Por qué mi idli pesa más de 50 g?",
        answer:
          "Es probable que sea una variedad grande (Thatte Idli) o de molde profundo. Pesar una pieza una sola vez te permitirá calibrar tus registros futuros.",
      },
    ],
    related: ["dal", "rice", "roti", "paneer"],
  },
  {
    slug: "paratha",
    name: "Paratha",
    tier: "indian",
    aka: ["parantha", "lachha paratha", "aloo paratha", "paratha sencilla"],
    title: "Calorías en la Paratha — Por unidad, no por 100 g",
    description:
      "Una paratha sencilla aporta unas 320 calorías; una grande, cerca de 450. Calorías y macros por tamaño real, y por qué una paratha equivale a dos rotis.",
    intro: [
      "Una paratha es esencialmente una masa similar al roti pero cocinada con grasa incorporada en el proceso: 320 calorías por 100 g frente a las 267 del roti, con más de cuatro veces su cantidad de grasa.",
      "Además, las parathas suelen prepararse más gruesas y pesadas de lo que uno imagina a simple vista.",
    ],
    per100g: { calories: 320, protein: 8, carbs: 45, fat: 12 },
    portions: [
      { label: "1 paratha sencilla", grams: 100, note: "el tamaño más ligero habitual" },
      { label: "1 paratha grande", grams: 140, note: "el tamaño más registrado en comidas" },
      { label: "2 parathas", grams: 200 },
      { label: "1 porción abundante", grams: 300, note: "dos o tres piezas grandes" },
    ],
    observedRange:
      "En comidas reales analizadas con LogMyPlate, una ración de paratha oscila entre 100 g y 300 g.",
    portionHonesty: [
      "Una paratha delgada de 100 g y una gruesa o rellena de 140 g se llaman ambas 'una paratha', pero representan la diferencia entre 320 y 450 calorías.",
      "Como ronda las 320 calorías por 100 g, la equivalencia es predecible: 130 g representan unas 420 calorías y 110 g unas 350.",
      "En nuestra base de datos no se registra fibra ni sodio estandarizados para parathas, por lo que esas columnas se dejan en blanco para evitar inventar cifras.",
    ],
    whatChangesIt: [
      {
        heading: "La cantidad de ghee o aceite en la cocción",
        body: "Esto es lo que define a la paratha. Una cucharadita de grasa suma 45 calorías, y una paratha suele requerir más de una cucharadita para lograr su textura dorada.",
      },
      {
        heading: "Los rellenos",
        body: "Rellenos de papa (aloo), coliflor (gobi) o paneer agregan sus propias calorías sobre la masa. Una paratha muy rellena es más calórica y conviene registrarla por su tipo específico.",
      },
      {
        heading: "Capas laminadas (Lachha)",
        body: "Las parathas hojaldradas incorporan grasa entre las capas para separarlas, lo que eleva el aporte de lípidos con el mismo diámetro exterior.",
      },
    ],
    macroContext: [
      "Doce gramos de grasa por cada 100 g diferencian a la paratha de otros panes planos. No es motivo para excluirla, sino la explicación de su mayor contenido de energía.",
      "Aporta unos 8 g de proteína por 100 g, comparable a otros panes de trigo.",
    ],
    comparison: {
      heading: "Una paratha equivale a dos rotis",
      intro:
        "Una paratha sencilla y dos rotis medianos aportan prácticamente las mismas calorías, pero con una distribución muy diferente.",
      items: [
        { slug: "paratha", grams: 100, label: "1 paratha sencilla" },
        { slug: "roti", grams: 120, label: "2 rotis medianos" },
        { slug: "roti", grams: 60, label: "1 roti mediano" },
      ],
      footnote:
        "Ambas opciones rondan las 320 calorías. Los dos rotis proporcionan el doble de volumen de pan, mayor cantidad de fibra y solo un tercio de la grasa.",
    },
    faqs: [
      {
        question: "¿Cuántas calorías tiene una paratha?",
        answer:
          "Aproximadamente 320 calorías para una paratha sencilla de 100 g y unas 450 para una grande de 140 g. Una pieza común de 130 g ronda las 420 calorías.",
      },
      {
        question: "¿Es la paratha peor que el roti?",
        answer:
          "No es peor, simplemente es más densa en energía por la grasa utilizada en su cocción. Conocer la diferencia te ayuda a decidir según tus objetivos del día.",
      },
      {
        question: "¿La paratha rellena de papa tiene más calorías?",
        answer:
          "Sí. El relleno de papa, queso o verduras añade calorías adicionales a la masa. Es recomendable registrarla como Aloo Paratha o Paneer Paratha según corresponda.",
      },
    ],
    related: ["roti", "dal", "rice", "paneer"],
  },
];

export const getEsFood = (slug: string): FoodPage | undefined => {
  return esFoods.find((food) => food.slug === slug);
};
