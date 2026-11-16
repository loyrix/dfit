import type { Guide } from "@/app/(en)/guides/content";

export const esGuides: Guide[] = [
  {
    slug: "ai-calorie-tracker-india",
    title: "Cómo funcionan los contadores de calorías con IA para comidas complejas",
    description:
      "Por qué el registro nutricional mediante fotos con IA se adapta mejor a comidas caseras y combinadas que los lectores de códigos de barras tradicionales.",
    summary:
      "Las apps basadas en códigos de barras tienen dificultades con guisados caseros, arroces, legumbres y platos combinados. Descubre cómo el análisis por foto resuelve este problema.",
    category: "Contador con IA",
    readTime: "5 min de lectura",
    accent: "#efbd44",
    keywords: [
      "contador de calorias con IA",
      "contar calorias por foto",
      "diario de comidas inteligente",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Por qué las comidas tradicionales son difíciles de registrar manualmente",
        paragraphs: [
          "La gran mayoría de las bases de datos de calorías fueron diseñadas para alimentos empaquetados, cadenas de restaurantes y porciones industriales estandarizadas. Sin embargo, la comida casera es muy diferente: un mismo guisado, tazón de lentejas, arroz o sopa varía enormemente según la cantidad de aceite, el tamaño de la porción y los ingredientes específicos de cada cocina.",
          "Esta dificultad es la causa principal por la que muchas personas abandonan el hábito: buscar manualmente cada ingrediente en una lista infinita resulta agotador y los valores rara vez reflejan lo que realmente tienen servido en el plato.",
        ],
      },
      {
        heading: "Qué cambia con el análisis visual mediante IA",
        paragraphs: [
          "LogMyPlate parte de la imagen real de tu plato. El modelo de inteligencia artificial identifica los alimentos visibles, interpreta tu nota breve de contexto, estima el tamaño de las porciones y calcula calorías, proteína, carbohidratos y grasa para tu revisión.",
          "El resultado es una estimación práctica y cercana, no un análisis de laboratorio. Su verdadero valor radica en la rapidez y la constancia: puedes registrar tu comida en segundos, ajustar lo que sea necesario y construir un diario confiable a lo largo de los días y las semanas.",
        ],
      },
      {
        heading: "Puntos que siempre conviene revisar",
        paragraphs: [
          "Los ingredientes no visibles son la mayor fuente de variación: aceites de cocción, mantequilla, salsas espesas o azúcar no siempre se aprecian a simple vista. Añadir una pequeña nota como 'guisado con poco aceite' o 'aderezo cremoso' orienta al modelo, pero la revisión final siempre está en tus manos.",
          "Para requerimientos clínicos, diabetes, trastornos de la conducta alimentaria, afecciones renales o embarazo, las estimaciones de IA deben considerarse únicamente informativas y complementarse siempre con el seguimiento de un profesional de la salud calificado.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Puede un contador de calorías con IA ser 100% exacto?",
        answer:
          "No. El registro basado en fotos proporciona estimaciones razonadas. Resulta sumamente útil para crear conciencia nutricional y mantener la constancia, pero no debe considerarse una medición médica de laboratorio.",
      },
      {
        question: "¿LogMyPlate solo funciona para ciertos tipos de comida?",
        answer:
          "No. La app fue diseñada con gran capacidad para reconocer tanto platos tradicionales y caseros como comidas internacionales, ensaladas, pastas y opciones de restaurante.",
      },
    ],
  },
  {
    slug: "indian-food-calorie-tracker",
    title: "Cómo contar calorías en platos combinados y guisados tradicionales",
    description:
      "Guía práctica para registrar calorías en comidas caseras y platos tradicionales mediante fotos, revisión de porciones y desglose de macronutrientes.",
    summary:
      "Aprende a registrar legumbres, arroces, panes planos, guisados y platos mixtos sin necesidad de pesar cada ingrediente por separado.",
    category: "Cocina tradicional",
    readTime: "6 min de lectura",
    accent: "#70caa3",
    keywords: [
      "contador de calorias comida casera",
      "contar calorias platos combinados",
      "diario nutricional con fotos",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Comienza desde el plato servido, no desde la base de datos",
        paragraphs: [
          "El método más ágil y sostenible para registrar comidas caseras es capturar una foto clara acompañada de una breve nota. En lugar de buscar una coincidencia perfecta en un catálogo de miles de alimentos, registra el plato tal como lo vas a comer y permite que la app identifique los elementos visibles.",
          "Este enfoque funciona especialmente bien en comidas mixtas donde conviven cereales, legumbres, ensaladas y salsas en un mismo servicio, donde la carga manual suele ser lenta y tediosa.",
        ],
      },
      {
        heading: "Usa notas breves para preparaciones similares",
        paragraphs: [
          "Ciertas recetas pueden verse parecidas desde una toma cenital. Una nota corta como 'lentejas amarillas', 'arroz con verduras' o 'guisado de carne magra' le proporciona al sistema el contexto necesario sin convertir el registro en un cuestionario largo.",
          "La nota debe describir el plato, no sustituir la foto. El sistema valida lo que está en la imagen para evitar inventar alimentos que no están presentes.",
        ],
      },
      {
        heading: "Ajusta las porciones antes de guardar",
        paragraphs: [
          "En la mesa cotidiana solemos servir en cucharones, tazones, rebanadas o piezas, no en gramos exactos. LogMyPlate traduce visualmente las porciones a cifras editables para que puedas corregir si una ración es claramente mayor o menor.",
          "A largo plazo, el hábito constante supera la precisión obsesiva: una estimación revisada en cada comida es infinitamente más valiosa que un cálculo de laboratorio hecho una sola vez por semana.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Es indispensable pesar la comida casera en una báscula?",
        answer:
          "Pesar los alimentos puede ser útil ocasionalmente para entrenar la vista, pero la mayoría de las personas no lo necesitan en cada comida. Una foto nítida y una estimación revisada son suficientes para mantener un control diario efectivo.",
      },
      {
        question: "¿LogMyPlate reconoce recetas caseras de familia?",
        answer:
          "Sí. El reconocimiento de comidas caseras y preparaciones mixtas es una de las principales razones por las que la app utiliza análisis visual con IA en lugar de depender exclusivamente de códigos de barras.",
      },
    ],
  },
  {
    slug: "photo-food-journal",
    title: "Por qué un diario de comidas con fotos es más fácil de mantener",
    description:
      "Cómo un diario fotográfico de alimentación reduce la fricción, mejora la constancia y te ayuda a identificar tus patrones alimentarios reales.",
    summary:
      "Un diario de nutrición solo funciona si lo mantienes en el tiempo. Registrar mediante fotos hace que el hábito sea mucho más rápido y llevadero.",
    category: "Diario de comidas",
    readTime: "4 min de lectura",
    accent: "#ff7e78",
    keywords: [
      "diario de comidas con fotos",
      "app diario alimentario",
      "habito de registro nutricional",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "La constancia supera a la perfección",
        paragraphs: [
          "El mayor obstáculo de los diarios de comidas tradicionales es la fricción. Si cada almuerzo o cena exige buscar, pesar, medir y desglosar diez ingredientes individuales en una base de datos, el hábito suele abandonarse a los pocos días.",
          "Un diario fotográfico reduce drásticamente esa barrera de inicio: tomas la foto, agregas una pequeña nota si lo consideras útil, revisas los valores sugeridos y guardas la comida.",
        ],
      },
      {
        heading: "Las fotos preservan el contexto completo",
        paragraphs: [
          "Una foto registra detalles que las palabras suelen pasar por alto: la proporción real de vegetales en el plato, las guarniciones, la presencia de salsas y si la porción fue moderada o abundante.",
          "Ese contexto visual resulta valioso incluso cuando los números calóricos son aproximados. Al repasar tu semana en la galería, puedes notar con facilidad horarios de comida, patrones de saciedad y momentos en que faltó proteína.",
        ],
      },
      {
        heading: "Un diario debe transmitir calma",
        paragraphs: [
          "LogMyPlate fue concebido con una interfaz limpia y serena. La app te muestra calorías, distribución de macronutrientes y tu ritmo semanal sin que tu alimentación se sienta como una hoja de cálculo corporativa.",
          "Para la mayoría de los usuarios, esa simplicidad marca la diferencia entre probar una app durante tres días o adoptarla como un hábito sostenible por meses.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Son privadas las fotos que subo a mi diario?",
        answer:
          "Sí. Las fotos de tus comidas son datos personales. Nuestra Política de Privacidad estipula con claridad que las imágenes se utilizan exclusivamente para el análisis nutricional y solo se almacenan si decides guardarlas en tu historial.",
      },
      {
        question: "¿Tengo que escribir explicaciones largas en cada foto?",
        answer:
          "No. Una nota de dos o tres palabras basta cuando el plato necesita alguna aclaración (por ejemplo, el tipo específico de guisado o un ingrediente poco visible).",
      },
    ],
  },
  {
    slug: "calorie-tracker-without-barcodes",
    title: "Cómo contar calorías en comidas sin código de barras",
    description:
      "Guía para llevar el control calórico de alimentos sin etiquetas nutricionales, platos caseros y comidas en restaurantes.",
    summary:
      "La mayoría de las comidas reales no tienen código de barras. El análisis por foto permite registrar platos cotidianos sin depender de envases.",
    category: "Conteo de calorías",
    readTime: "4 min de lectura",
    accent: "#efbd44",
    keywords: [
      "contador de calorias sin codigo de barras",
      "contar calorias comida casera",
      "app calorias por foto",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Los códigos de barras solo resuelven una parte del problema",
        paragraphs: [
          "Escanear un código de barras es conveniente para alimentos ultraprocesados o empaquetados. Pero resulta inútil frente a un plato de arroz con verduras, pollo asado, sopa casera, ensalada fresca o una comida en un restaurante.",
          "Cuando la comida se prepara en casa o se sirve fresca, la app necesita otra vía de entrada: una foto que capture visualmente la composición de ese momento.",
        ],
      },
      {
        heading: "Usa la estimación de la IA como punto de partida",
        paragraphs: [
          "El sistema analiza visualmente los ingredientes y su volumen aparente. Luego tú validas el resultado: puedes modificar alimentos, cambiar porciones o corregir detalles antes de archivar en tu diario.",
          "De este modo el registro sigue siendo rápido sin quitarte el control. La fórmula ideal no es la automatización ciega, sino escanear, validar y guardar.",
        ],
      },
      {
        heading: "Cuándo conviene seguir utilizando la etiqueta",
        paragraphs: [
          "Las etiquetas de productos empaquetados suelen ser precisas para ese lote específico. Si dispones de un paquete con tabla nutricional y buscas exactitud milimétrica, esa etiqueta es la fuente más fiable.",
          "LogMyPlate se enfoca en el escenario más común y retador: comidas reales, platos variados y alimentos que no vienen con tabla impresa.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Puedo registrar comidas de restaurante sin código de barras?",
        answer:
          "Sí. Una foto nítida y el nombre del plato le dan a la IA el punto de partida necesario para estimar los nutrientes, aunque las recetas de restaurantes puedan variar.",
      },
      {
        question: "¿Son más exactos los lectores de códigos de barras?",
        answer:
          "Para un producto envasado cuya etiqueta esté actualizada, sí. Para comida hecha en casa o platos de restaurante, una estimación visual revisada es mucho más representativa de lo que realmente comes.",
      },
    ],
  },
  {
    slug: "meal-photo-tips",
    title: "Consejos para tomar mejores fotos de tus comidas",
    description:
      "Recomendaciones sencillas de encuadre, iluminación y notas breves para mejorar el reconocimiento de alimentos con IA.",
    summary:
      "Buena iluminación, encuadre completo del plato y notas precisas mejoran la exactitud de las estimaciones en tu diario.",
    category: "Consejos de uso",
    readTime: "3 min de lectura",
    accent: "#70caa3",
    keywords: [
      "consejos fotos de comida",
      "como tomar foto a la comida",
      "reconocimiento de platos con IA",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Encuadra el plato completo",
        paragraphs: [
          "Asegúrate de que todo el plato o tazón quede dentro del encuadre. Las fotos recortadas dificultan estimar el volumen relativo y pueden dejar fuera guarniciones o aderezos importantes.",
          "Si tienes varios recipientes pequeños en la misma comida, inclúyelos en una sola imagen amplia o realiza escaneos separados si corresponden a momentos distintos.",
        ],
      },
      {
        heading: "Aprovecha la luz natural o cenital",
        paragraphs: [
          "Una iluminación uniforme permite a la IA apreciar la textura, color y volumen de cada alimento. Las tomas muy oscuras o con reflejos intensos de flash directo pueden reducir la nitidez.",
          "No necesitas fotos de catálogo gastronómico: un ángulo cenital (desde arriba) o ligeramente inclinado a 45 grados suele ser perfecto.",
        ],
      },
      {
        heading: "Agrega notas cortas cuando haya ambigüedad",
        paragraphs: [
          "Usa la nota para aclarar recetas con apariencia similar: 'arroz con pollo', 'tofu salteado', 'aderezo bajo en grasa' o 'guisado picante'.",
          "Mantén la nota breve y descriptiva; no es necesario escribir una receta completa, sino ayudar al sistema a identificar el alimento principal.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Tengo que fotografiar cada ingrediente por separado?",
        answer:
          "No. Fotografía el plato ya servido tal como lo vas a comer. Si hay ingredientes ocultos muy calóricos, puedes mencionarlos brevemente en la nota.",
      },
      {
        question: "¿Puedo seleccionar fotos de mi galería?",
        answer:
          "Sí. LogMyPlate te permite tomar la foto directamente con la cámara en el momento o seleccionar una imagen guardada previamente en tu galería.",
      },
    ],
  },
  {
    slug: "ai-calorie-tracker-for-weight-loss",
    title: "Cómo utilizar un contador de calorías con IA para perder peso",
    description:
      "Consejos para emplear las estimaciones calóricas de forma saludable y consistente en tus metas de pérdida de peso, sin obsesiones.",
    summary:
      "El control calórico para perder peso funciona mejor cuando la app es lo suficientemente ágil para usarla a diario y honesta en sus estimaciones.",
    category: "Objetivos de peso",
    readTime: "5 min de lectura",
    accent: "#efbd44",
    keywords: [
      "contador de calorias perder peso",
      "deficit calorico por foto",
      "diario nutricional adelgazar",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Usa el registro para comprender tus hábitos",
        paragraphs: [
          "Un contador de calorías es ante todo un espejo de hábitos: te ayuda a identificar refrigerios no planificados, días con poca proteína, excesos en salidas sociales o variaciones entre semana y fines de semana.",
          "LogMyPlate convierte cada foto en un registro ordenado para que la tendencia global sea visible sin necesidad de pasar horas capturando datos manualmente.",
        ],
      },
      {
        heading: "Establece un objetivo realista y flexible",
        paragraphs: [
          "La pantalla de metas de la app utiliza datos básicos de estatura, peso y nivel de actividad física para sugerir una meta diaria aproximada. Trata esa cifra como un punto de partida, no como un límite rígido inamovible.",
          "A medida que cambie tu rutina, tu peso o tu actividad, ajusta el objetivo y consulta siempre a profesionales de la nutrición en caso de metas exigentes o condiciones especiales.",
        ],
      },
      {
        heading: "Revisa con criterio, sin obsesionarte",
        paragraphs: [
          "Las estimaciones visuales pueden tener margen de variación. Revisa las porciones, corrige anomalías evidentes y céntrate en el balance semanal más que en la perfección de una comida aislada.",
          "El uso más saludable de un diario es fomentar el autoconocimiento y la regularidad; debe respaldar tus decisiones diarias, no generarte estrés.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿LogMyPlate garantiza la pérdida de peso?",
        answer:
          "No. La app es una herramienta de registro y estimación. Los resultados dependen de múltiples factores biológicos, nivel de actividad física, descanso, calidad de los alimentos y constancia a lo largo del tiempo.",
      },
      {
        question: "¿Las metas de la app sustituyen a un nutricionista?",
        answer:
          "No. Los objetivos calculados son orientativos y no sustituyen el asesoramiento médico, nutricional o dietético personalizado.",
      },
    ],
  },
  {
    slug: "calorie-tracking-for-home-cooked-food",
    title: "Registro de calorías en comidas hechas en casa",
    description:
      "Cómo registrar platos caseros cuando las recetas, el aceite y los ingredientes varían en cada preparación familiar.",
    summary:
      "La comida casera nunca es idéntica dos veces. Un flujo basado en fotos permite registrarla sin tener que pesar cada ingrediente en la cocina.",
    category: "Comida casera",
    readTime: "5 min de lectura",
    accent: "#70caa3",
    keywords: [
      "contar calorias comida casera",
      "calorias platos hechos en casa",
      "diario de comida casera",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "La comida casera no encaja en una sola fila de base de datos",
        paragraphs: [
          "La sopa de verduras o el guisado de una familia rara vez se preparan igual a los de otra. La cantidad de aceite, el sofrito, los caldos y el tamaño del servicio modifican los números.",
          "Buscar un nombre genérico en un catálogo suele ocultar esas variaciones. Tomar una foto ofrece una aproximación más fiel porque refleja el plato real que tienes enfrente.",
        ],
      },
      {
        heading: "Aclara ingredientes poco visibles con notas",
        paragraphs: [
          "La IA puede evaluar los alimentos visibles, pero no puede adivinar con precisión cuánto aceite o azúcar se añadió a una salsa. Si conoces ese detalle, una nota breve como 'con poco aceite' o 'aderezo ligero' ayuda mucho.",
          "Posteriormente puedes afinar la porción y los macros en la pantalla de revisión antes de guardar el registro.",
        ],
      },
      {
        heading: "Los platos recurrentes se vuelven intuitivos",
        paragraphs: [
          "En casa solemos rotar un repertorio conocido de platos. Una vez que observas el rango calórico de tus comidas habituales durante unas semanas, las revisiones futuras se vuelven casi automáticas.",
          "El propósito no es una auditoría química de la receta, sino un diario representativo y sostenible en el tiempo.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Conviene cargar recetas enteras ingrediente por ingrediente?",
        answer:
          "Hacerlo puede dar mayor detalle pero demanda mucho tiempo. El registro por foto está pensado para quienes buscan agilidad en su día a día sin pasar horas capturando recetas.",
      },
      {
        question: "¿El aceite de cocción influye mucho en el resultado?",
        answer:
          "Sí, las grasas son densas en energía (unas 45 calorías por cucharadita). Si sabes que un plato lleva bastante aceite, agrégalo en la nota o ajusta el resultado al revisar.",
      },
    ],
  },
  {
    slug: "macro-tracking-with-food-photos",
    title: "Control de macronutrientes a través de fotos",
    description:
      "Cómo el escaneo visual de comidas estima proteína, carbohidratos y grasa junto con las calorías totales.",
    summary:
      "Las calorías indican la energía; los macronutrientes explican de dónde viene: proteína para reparar, carbohidratos para rendir y grasa para saciar.",
    category: "Macronutrientes",
    readTime: "4 min de lectura",
    accent: "#ff7e78",
    keywords: [
      "contador de macros por foto",
      "proteina carbohidratos grasa",
      "app macronutrientes",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Los macros dan sentido a las calorías",
        paragraphs: [
          "Dos comidas pueden aportar exactamente 500 calorías y provocar sensaciones corporales opuestas. La proporción entre proteína, carbohidratos y grasa explica la saciedad, los niveles de energía y la recuperación física.",
          "LogMyPlate desglosa los macronutrientes tanto para el plato global como para cada uno de sus componentes de forma clara y editable.",
        ],
      },
      {
        heading: "La proteína suele ser el dato más revelador",
        paragraphs: [
          "Muchos usuarios buscan comprobar si sus comidas alcanzan un umbral adecuado de proteína o si están muy cargadas de carbohidratos simples. La vista de macros permite identificarlo al instante.",
          "Si notas que una comida quedó baja en proteína, puedes planificar la siguiente con fuentes más densas (legumbres, huevos, carnes magras, pescado o queso fresco).",
        ],
      },
      {
        heading: "Presta atención a platos con salsas densas",
        paragraphs: [
          "Las salsas espesas, frituras y postres concentran grasas que a veces no son evidentes a primera vista. Tómate unos segundos adicionales para revisar las porciones de esos platos.",
          "Para atletas de alto rendimiento o pautas de nutrición clínica, complementa siempre estas estimaciones con asesoramiento especializado.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿LogMyPlate desglosa la proteína de cada comida?",
        answer:
          "Sí. Muestra la proteína estimada tanto en gramos por ingrediente como en el total del plato en la pantalla de revisión y en tu diario.",
      },
      {
        question: "¿Son exactos los gramos de macros estimados?",
        answer:
          "Son estimaciones calculadas por la IA con base en la imagen y la nota. Siempre puedes editar las cifras antes de guardar.",
      },
    ],
  },
  {
    slug: "calorie-estimate-vs-nutrition-label",
    title: "Estimación de IA versus etiqueta nutricional: cuándo usar cada una",
    description:
      "Cuándo confiar en una estimación visual de IA, cuándo apoyarse en la tabla nutricional del envase y cómo combinar ambas de forma inteligente.",
    summary:
      "Las tablas nutricionales son ideales para empaques comerciales; las estimaciones de IA son la solución práctica para comidas caseras y restaurantes.",
    category: "Precisión",
    readTime: "4 min de lectura",
    accent: "#efbd44",
    keywords: [
      "estimacion de calorias vs etiqueta",
      "precision calorias IA",
      "tabla nutricional",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Las etiquetas destacan en alimentos empaquetados",
        paragraphs: [
          "Cuando un producto envasado cuenta con información nutrimental verificada, esa etiqueta suele ser la fuente más precisa de calorías y macronutrientes.",
          "El desafío cotidiano es que gran parte de lo que comemos no viene en una caja: los platos caseros, ensaladas de restaurante y comidas frescas carecen de etiqueta informativa.",
        ],
      },
      {
        heading: "La IA cubre los alimentos sin etiquetar",
        paragraphs: [
          "Las estimaciones de IA ofrecen una alternativa eficaz al dilema de 'no registrar nada por falta de datos'. Proporcionan un punto de partida estructurado a partir de una simple foto.",
          "La dinámica adecuada consiste en validar la estimación, corregir discrepancias lógicas y conservarla como una referencia confiable en tu historial.",
        ],
      },
      {
        heading: "Aplica precisión donde realmente importa",
        paragraphs: [
          "Si una indicación médica específica requiere un control estricto de gramos o calorías, apóyate en porciones pesadas y supervisión profesional.",
          "Para el bienestar general y el control de peso cotidiano, la consistencia a largo plazo y la honestidad en el registro son mucho más determinantes que perseguir el gramo exacto.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿La IA es más precisa que una etiqueta de envase?",
        answer:
          "Para productos industriales empaquetados, la etiqueta suele ser más exacta. La IA resulta infinitamente más útil en comidas frescas, caseras y sin código de barras.",
      },
      {
        question: "¿Puedo ajustar las cifras sugeridas por la IA?",
        answer:
          "Por supuesto. LogMyPlate está construido alrededor de la revisión y edición previa antes de archivar cualquier alimento.",
      },
    ],
  },
  {
    slug: "best-calorie-tracker-for-indian-food",
    title: "Qué buscar en un contador de calorías para comida tradicional y casera",
    description:
      "Características esenciales al elegir una app para registrar comidas mixtas, recetas familiares y platos sin código de barras.",
    summary:
      "Un buen contador debe admitir fotos, notas de contexto, ajuste flexible de porciones y revisión clara de macronutrientes antes de guardar.",
    category: "Guía de elección",
    readTime: "5 min de lectura",
    accent: "#70caa3",
    keywords: [
      "mejor contador de calorias comida casera",
      "app contar calorias por foto",
      "diario de nutricion completo",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "El registro fotográfico es imprescindible",
        paragraphs: [
          "Los platos cotidianos suelen ser variados, preparados en casa y sin códigos de barras. Una aplicación que te obligue a buscar cada elemento por texto termina resultando lenta y frustrante.",
          "La captura por foto permite registrar el plato completo tal como fue servido, incluyendo acompañamientos que serían difíciles de describir por separado.",
        ],
      },
      {
        heading: "La posibilidad de revisar antes de guardar es crucial",
        paragraphs: [
          "Ninguna inteligencia artificial debe imponer datos a ciegas. La app debe desglosar con transparencia los ingredientes detectados, porciones, calorías y macros antes de aceptar el registro.",
          "En LogMyPlate ese paso de validación es el núcleo del flujo, reconociendo que el criterio del usuario es indispensable.",
        ],
      },
      {
        heading: "Transparencia en privacidad y eliminación de datos",
        paragraphs: [
          "Las fotos de tus comidas y tus objetivos corporales son información íntima. Una app profesional debe detallar qué datos recopila, con qué fin y cómo puedes eliminarlos en cualquier momento.",
          "Antes de utilizar un servicio, asegúrate de que ofrezca políticas claras de privacidad y eliminación directa de cuenta.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Qué distingue a LogMyPlate de otras apps?",
        answer:
          "Su enfoque centrado en fotos, su capacidad para interpretar platos combinados sin código de barras, la revisión transparente de porciones y un diario libre de complejidades innecesarias.",
      },
      {
        question: "¿Puedo borrar mis fotos y mi cuenta cuando quiera?",
        answer:
          "Sí. Puedes eliminar de forma definitiva tu cuenta y todo tu historial de fotos y datos en cualquier momento desde los ajustes de la aplicación.",
      },
    ],
  },
  {
    slug: "how-to-track-misal-pav-calories",
    title: "Ejemplo práctico: cómo registrar un plato combinado y especiado",
    description:
      "Un ejemplo paso a paso de cómo registrar platos con múltiples ingredientes, salsas y panes utilizando foto, notas y revisión de porciones.",
    summary:
      "Los platos tradicionales con sofritos, caldos y guarniciones son el mejor ejemplo de por qué la revisión visual es superior a una búsqueda genérica.",
    category: "Ejemplos prácticos",
    readTime: "4 min de lectura",
    accent: "#ff7e78",
    keywords: [
      "registrar platos combinados",
      "calorias comidas especiadas",
      "ejemplo contador de calorias",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Por qué los platos combinados presentan tanta variedad",
        paragraphs: [
          "Un mismo plato tradicional puede ser una comida ligera o una bomba calórica dependiendo de la cantidad de aceite en el sofrito, las frituras agregadas y el acompañamiento de pan.",
          "Una entrada genérica en una base de datos rara vez capta la realidad de tu mesa. La foto permite distinguir los distintos componentes y sus volúmenes relativos.",
        ],
      },
      {
        heading: "Lo que desglosa la aplicación",
        paragraphs: [
          "LogMyPlate descompone el plato en sus partes reconocibles (el guisado principal, los panes o carbohidratos, las verduras picadas y las coberturas crujientes), mostrando las calorías individuales.",
          "Si el plato contiene adiciones especiales o porciones más generosas de lo habitual, puedes modificarlas al instante en la pantalla de revisión.",
        ],
      },
      {
        heading: "Conserva el registro como referencia en tu historial",
        paragraphs: [
          "El valor primordial es capturar la comida dentro de su contexto real y sumarla al balance calórico y de macronutrientes del día.",
          "Para comidas que repites con frecuencia, contar con registros previos te ayuda a conocer tus rangos habituales y tomar mejores decisiones.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿La app puede reconocer platos típicos regionales?",
        answer:
          "Sí. Con una foto clara y una nota breve indicando el nombre local del plato, el modelo comprende los elementos típicos de la preparación.",
      },
      {
        question: "¿Por qué dos preparaciones del mismo plato pueden variar tanto?",
        answer:
          "El volumen de pan, el uso de frituras como adorno y la grasa añadida a la salsa modifican considerablemente el total de calorías.",
      },
    ],
  },
  {
    slug: "daily-calorie-target-bmi-guide",
    title: "Metas de calorías diarias e IMC: cómo interpreta los datos la app",
    description:
      "Cómo utiliza LogMyPlate tu estatura, peso, edad, nivel de actividad y metas personales para sugerir un objetivo calórico orientativo.",
    summary:
      "El índice de masa corporal y los objetivos calóricos son referencias de orientación general, no diagnósticos clínicos. Aprende a usarlos adecuadamente.",
    category: "Metas de salud",
    readTime: "5 min de lectura",
    accent: "#efbd44",
    keywords: [
      "meta calorias diarias",
      "IMC y calorias",
      "calcular objetivo calorico",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Para qué sirve una meta calórica diaria",
        paragraphs: [
          "Una meta calórica proporciona una brújula a tu diario: te permite situar si tu jornada quedó por debajo, cerca o por encima de tus requerimientos estimados.",
          "Debe considerarse una pauta orientativa, no una orden estricta. El gasto energético fluctúa según tu masa muscular, nivel de estrés, descanso y actividad diaria.",
        ],
      },
      {
        heading: "Qué parámetros solicita la aplicación",
        paragraphs: [
          "LogMyPlate puede consultar tu estatura, peso actual, edad, perfil corporal, nivel de movimiento habitual y objetivo. A partir de ello estima tu rango de IMC y una meta calórica sugerida.",
          "Puedes configurar este cálculo al inicio, ajustarlo más adelante o prescindir de él si solo deseas usar la app como un registro visual de comidas.",
        ],
      },
      {
        heading: "Cuándo consultar con un profesional",
        paragraphs: [
          "El IMC es una métrica estadística general que no mide directamente la composición corporal; puede resultar impreciso en deportistas, personas mayores o durante el embarazo.",
          "Si tus metas nutricionales se relacionan con condiciones médicas, tratamientos o lactancia, acude siempre a un profesional sanitario cualificado.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿LogMyPlate brinda diagnósticos de salud?",
        answer:
          "No. Los cálculos y sugerencias son informativos y no sustituyen una evaluación médica o nutricional individualizada.",
      },
      {
        question: "¿Es obligatorio usar metas calóricas?",
        answer:
          "No. Puedes usar la app exclusivamente como un diario visual de comidas sin fijar ninguna meta numérica si así lo prefieres.",
      },
    ],
  },
  {
    slug: "food-journal-for-busy-professionals",
    title: "Un diario de comidas para personas con agendas ocupadas",
    description:
      "Cómo registrar tu alimentación en segundos con fotos, revisiones rápidas y resúmenes semanales cuando tienes poco tiempo libre.",
    summary:
      "Un hábito nutricional debe encajar en la vida real. El registro con fotos está diseñado para comidas entre reuniones, viajes y días intensos.",
    category: "Hábitos y estilo de vida",
    readTime: "4 min de lectura",
    accent: "#70caa3",
    keywords: [
      "diario de comida rapido",
      "contar calorias personas ocupadas",
      "registro alimentario facil",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "El registro debe ser más rápido que las excusas",
        paragraphs: [
          "Las personas ocupadas no abandonan el control nutricional por falta de voluntad, sino porque las apps convencionales exigen demasiado tiempo en momentos de alta carga laboral y familiar.",
          "Un diario centrado en fotos reduce el proceso al mínimo indispensable: capturar el plato, anotar dos palabras si es necesario, validar y guardar.",
        ],
      },
      {
        heading: "Enfócate en la constancia semanal, no en la culpa diaria",
        paragraphs: [
          "Habrá días caóticos o con comidas improvisadas en la oficina. La pregunta relevante no es si un almuerzo fue perfecto, sino cómo evoluciona la tendencia general de tu semana.",
          "LogMyPlate te ofrece una panorámica de tu balance semanal para que evalúes patrones de fondo en vez de desanimarte por un día fuera de rutina.",
        ],
      },
      {
        heading: "Aprovecha la repetición de tus comidas cotidianas",
        paragraphs: [
          "En días laborales solemos repetir desayunos similares, almuerzos de menú y refrigerios de media tarde. Registrar esas opciones unas cuantas veces crea familiaridad rápidamente.",
          "Una vez que conoces el aporte de tus comidas habituales, revisarlas toma apenas unos segundos.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Cuánto tiempo toma registrar una comida?",
        answer:
          "Con una foto clara y una confirmación rápida, el proceso toma generalmente menos de 30 segundos.",
      },
      {
        question: "¿Puedo registrar comidas a posteriori si olvidé tomar la foto?",
        answer:
          "Sí, puedes seleccionar fotos tomadas previamente desde tu galería para analizarlas cuando tengas un momento libre.",
      },
    ],
  },
  {
    slug: "privacy-first-calorie-tracking",
    title: "Preguntas clave de privacidad antes de usar un contador de calorías",
    description:
      "Aspectos fundamentales que debes verificar antes de confiar tus fotos de comidas, metas de salud y datos personales a una app.",
    summary:
      "La información de lo que comes y tus metas físicas es sensible. Aprende a evaluar la política de datos, la IA y los derechos de eliminación.",
    category: "Privacidad",
    readTime: "5 min de lectura",
    accent: "#ff7e78",
    keywords: [
      "privacidad contador de calorias",
      "seguridad fotos de comida",
      "eliminacion de datos personales",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Las fotos de comida pueden revelar más de lo que crees",
        paragraphs: [
          "Una imagen de un plato puede incluir detalles de tu hogar, hábitos personales, rutinas o preferencias familiares. Por ello, la privacidad es fundamental incluso en aplicaciones de apariencia sencilla.",
          "Es importante conocer si las fotos se envían a servidores seguros, cómo las procesan los modelos de IA y si se eliminan efectivamente cuando borras tu cuenta.",
        ],
      },
      {
        heading: "La publicidad y los servicios de terceros deben ser transparentes",
        paragraphs: [
          "Si una app ofrece funciones gratuitas mediante anuncios, la red publicitaria puede requerir identificadores técnicos. Esa información debe estar claramente descrita en la política de privacidad.",
          "LogMyPlate utiliza anuncios recompensados opcionales para permitir escaneos adicionales y publica sus condiciones y archivos de transparencia (app-ads.txt) abiertamente.",
        ],
      },
      {
        heading: "El proceso de eliminación debe ser accesible y definitivo",
        paragraphs: [
          "Cualquier aplicación formal debe permitir la eliminación total de la cuenta, fotos almacenadas, historiales y tokens de sesión de manera directa y sin obstáculos.",
          "No deberías tener que atravesar trámites engorrosos para ejercer tu derecho a borrar tus datos personales.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Por qué importa la privacidad en una app de comidas?",
        answer:
          "Porque tus hábitos de alimentación, fotos, peso y metas físicas forman parte de tu vida privada y no deben compartirse ni venderse a terceros.",
      },
      {
        question: "¿Dónde puedo consultar las condiciones de LogMyPlate?",
        answer:
          "En nuestra web pública dispones de la Política de Privacidad, los Términos de Servicio y la página específica de Eliminación de Datos.",
      },
    ],
  },
  {
    slug: "rewarded-ads-free-scans-calorie-tracker",
    title: "Cómo funcionan los anuncios recompensados en un contador gratuito",
    description:
      "Por qué LogMyPlate utiliza anuncios recompensados para ofrecer escaneos adicionales y qué debes saber sobre el sistema.",
    summary:
      "Los anuncios recompensados permiten desbloquear análisis con IA adicionales sin requerir una suscripción obligatoria.",
    category: "Escaneos gratuitos",
    readTime: "4 min de lectura",
    accent: "#efbd44",
    keywords: [
      "anuncios recompensados app calorias",
      "escaneos gratis contador calorias",
      "AdMob app-ads.txt",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Por qué existen los anuncios recompensados",
        paragraphs: [
          "El procesamiento de imágenes con inteligencia artificial avanzada implica costos reales de computación en la nube. Los anuncios recompensados permiten financiar esos análisis para que los usuarios puedan continuar escaneando sin suscripción de pago obligatoria.",
          "Tú decides libremente cuándo ver un anuncio: al completarlo, el sistema te acredita escaneos adicionales al instante.",
        ],
      },
      {
        heading: "Qué información gestiona la red publicitaria",
        paragraphs: [
          "Los anuncios son gestionados por Google AdMob. Según las preferencias de tu dispositivo, pueden utilizarse identificadores técnicos para mostrar anuncios relevantes.",
          "Por esta razón, nuestra política de privacidad detalla el uso de AdMob y nuestro sitio web mantiene publicado el archivo oficial app-ads.txt.",
        ],
      },
      {
        heading: "Lo que la app nunca debe hacer",
        paragraphs: [
          "La presencia de anuncios nunca debe comprometer la claridad de los deslindes médicos ni engañar a los usuarios con promesas irreales.",
          "La experiencia se mantiene transparente: las estimaciones de IA son orientativas, los anuncios son una opción voluntaria para sumar escaneos y tú conservas la libertad de elección.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Es seguro ver anuncios recompensados en la app?",
        answer:
          "Sí. Son anuncios estándar de Google AdMob que no acceden a tus fotos privadas ni a tus registros personales.",
      },
      {
        question: "¿Puedo usar la app sin ver anuncios?",
        answer:
          "Sí. Tienes escaneos iniciales gratuitos y puedes optar por el plan Premium si prefieres una experiencia ilimitada y sin publicidad.",
      },
    ],
  },
  {
    slug: "calorie-tracking-for-vegetarian-meals",
    title: "Conteo de calorías y macros en platos vegetarianos",
    description:
      "Cómo registrar comidas vegetarianas, asegurar un aporte óptimo de proteína y balancear platos a base de plantas con fotos.",
    summary:
      "Una comida vegetariana puede ser ligera o muy calórica según los aceites, quesos y frutos secos. La vista de macros clarifica el balance real.",
    category: "Nutrición vegetariana",
    readTime: "4 min de lectura",
    accent: "#70caa3",
    keywords: [
      "contador calorias vegetariano",
      "macros comida vegetariana",
      "proteina vegetal registro",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Vegetariano no significa automáticamente bajo en calorías",
        paragraphs: [
          "Quesos frescos, frutos secos, aceites, aguacate, frituras y pastas pueden concentrar una densidad calórica considerable. Asimismo, las comidas basadas en harinas o cereales suelen aportar muchos carbohidratos.",
          "El registro fotográfico permite observar el plato en su totalidad para evaluar la composición real sin dejarse llevar solo por la etiqueta de 'vegetariano'.",
        ],
      },
      {
        heading: "Presta atención al aporte de proteína",
        paragraphs: [
          "Para muchas personas que no consumen carne, asegurar suficiente proteína es una prioridad constante. El desglose de macros de LogMyPlate muestra con claridad si la comida alcanza una proporción adecuada frente a los carbohidratos.",
          "Si notas que un plato quedó corto de proteína, puedes planificar el siguiente incorporando legumbres, tofu, huevos, yogur o quesos magros.",
        ],
      },
      {
        heading: "Revisa aderezos, salsas y sofritos",
        paragraphs: [
          "Los aceites de cocción, aderezos cremosos, semillas y salsas dulces añaden energía con facilidad. Agrega una nota breve cuando conozcas la preparación para afinar la estimación.",
          "El valor de la herramienta se maximiza cuando combinas la agilidad de la foto con un ojo crítico al revisar las porciones.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿LogMyPlate reconoce platos vegetarianos complejos?",
        answer:
          "Sí. El modelo distingue guisados de legumbres, ensaladas mixtas, verduras salteadas, tofu, quesos y platos a base de cereales.",
      },
      {
        question: "¿Muestra el contenido exacto de proteína?",
        answer:
          "Ofrece una estimación visual en gramos por ingrediente y en el total del plato, editable antes de guardar.",
      },
    ],
  },
  {
    slug: "restaurant-meal-calorie-tracking",
    title: "Cómo registrar comidas en restaurantes mediante fotos",
    description:
      "Un enfoque práctico para estimar calorías en comidas fuera de casa cuando se desconocen las recetas exactas y los niveles de grasa.",
    summary:
      "Las recetas de restaurante varían bastante de un local a otro. Una foto es el mejor punto de partida, pero la revisión es clave.",
    category: "Comer fuera",
    readTime: "4 min de lectura",
    accent: "#ff7e78",
    keywords: [
      "contar calorias en restaurante",
      "registrar comida fuera de casa",
      "app calorias restaurante",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Los restaurantes tienen ingredientes invisibles",
        paragraphs: [
          "Los platos de restaurante suelen prepararse con más mantequilla, aceite, crema o porciones mayores que las versiones caseras. Esos factores no siempre son apreciables a simple vista.",
          "Una foto capta la porción y los alimentos principales, pero es recomendable ajustar los valores si percibes que la preparación es más rica o grasosa de lo usual.",
        ],
      },
      {
        heading: "Agrega una nota con el nombre del plato",
        paragraphs: [
          "Una nota breve como 'sándwich club con papas', 'pasta con salsa cremosa' o 'pescado a la plancha' ayuda a la IA a interpretar el plato con mucha mayor fidelidad.",
          "Si la carta del restaurante menciona ingredientes específicos, puedes tomarlos en cuenta durante la revisión sin tener que desglosarlos manualmente.",
        ],
      },
      {
        heading: "Razona en rangos realistas",
        paragraphs: [
          "Al comer fuera, pensar en un rango calórico aproximado es más honesto y útil que pretender una precisión quirúrgica.",
          "Utiliza LogMyPlate para mantener la constancia en tu diario y evitar perder el hábito cuando sales a comer.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Las comidas de restaurante son menos precisas de estimar?",
        answer:
          "Suelen tener mayor variabilidad por aceites ocultos o salsas concentradas. Revisa las porciones y ajusta si notas una preparación muy untuosa.",
      },
      {
        question: "¿Debo fotografiar el menú o el plato servido?",
        answer:
          "Fotografía siempre el plato servido para que la IA evalúe la porción real. Puedes usar el nombre del menú como nota de apoyo.",
      },
    ],
  },
  {
    slug: "meal-tracking-for-gym-and-fitness",
    title: "Registro de comidas para metas de gimnasio y fitness",
    description:
      "Cómo utilizar LogMyPlate para supervisar calorías, asegurar suficiente proteína y mantener la constancia semanal en tus entrenamientos.",
    summary:
      "En el fitness, registrar las comidas debe ser ágil y enfocado en la proteína, no solo en contar calorías totales.",
    category: "Entrenamiento y fitness",
    readTime: "5 min de lectura",
    accent: "#efbd44",
    keywords: [
      "contador calorias fitness",
      "control de proteina gimnasio",
      "diario nutricional entrenamiento",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "La visibilidad de la proteína es primordial",
        paragraphs: [
          "Quienes entrenan con regularidad suelen vigilar de cerca su consumo proteico para favorecer la recuperación y el desarrollo muscular. El desglose de macros te permite comprobar de un vistazo si tu comida tiene suficiente base proteica.",
          "Aunque no sustituye una planificación deportiva profesional, ofrece una referencia diaria clara para ajustar tus siguientes ingestas.",
        ],
      },
      {
        heading: "Registra también las comidas cotidianas",
        paragraphs: [
          "Es común registrar los batidos de proteína pero saltarse el almuerzo en el trabajo o la cena ligera. Eso genera una visión distorsionada del balance energético del día.",
          "El registro con fotos facilita capturar las comidas ordinarias del día a día sin que se vuelva una tarea pesada.",
        ],
      },
      {
        heading: "Prioriza la precisión cuando la etapa lo exija",
        paragraphs: [
          "Si estás en una fase previa a una competición o con una dieta estricta de corte, complementa con báscula y supervisión experta.",
          "Para el entrenamiento regular y el estilo de vida activo, las estimaciones fotográficas revisadas ofrecen el equilibrio perfecto entre agilidad y constancia.",
        ],
      },
    ],
    faqs: [
      {
        question: "¿LogMyPlate reemplaza a un entrenador o nutricionista?",
        answer:
          "No. Es una herramienta práctica de registro y autoconocimiento. Las pautas personalizadas de rendimiento deben ser guiadas por profesionales del deporte y la salud.",
      },
      {
        question: "¿La app muestra la evolución semanal?",
        answer:
          "Sí. Tu diario incluye resúmenes de ritmo y constancia semanal para evaluar tu progreso a lo largo del tiempo.",
      },
    ],
  },
];

export const getEsGuide = (slug: string): Guide | undefined => {
  return esGuides.find((guide) => guide.slug === slug);
};
