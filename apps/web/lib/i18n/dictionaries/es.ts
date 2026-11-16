import type { Dictionary } from "../types";
import { APP_CONFIG } from "@/config/app";

export const esDictionary: Dictionary = {
  locale: "es",

  common: {
    languageSwitcherLabel: "Idioma",
    selectLanguageAria: "Seleccionar idioma",
    macros: {
      calories: "Calorías",
      protein: "Proteína",
      carbs: "Carbohidratos",
      fat: "Grasa",
      fiber: "Fibra",
      sodium: "Sodio",
      sugar: "Azúcar",
    },
    units: {
      grams: "g",
      kcal: "kcal",
    },
    notMedicalAdviceNotice:
      "Las estimaciones de IA no constituyen asesoramiento médico. Consulta siempre a un profesional de la salud calificado.",
  },

  nav: {
    howItWorks: "Cómo funciona",
    aiCoach: "Coach de IA",
    guides: "Guías",
    support: "Soporte",
    downloadCta: "Descargar",
    homeAria: "Inicio de LogMyPlate",
    mainNavAria: "Navegación principal",
    openMenuAria: "Abrir menú",
    closeMenuAria: "Cerrar menú",
  },

  footer: {
    brandDescription:
      "Registra tus comidas con una foto. Estimación de calorías y macros con IA para cada plato.",
    groupProduct: "Producto",
    groupSupport: "Soporte",
    groupLegal: "Legal",
    linkDownload: "Descargar",
    linkHowItWorks: "Cómo funciona",
    linkGuides: "Guías",
    linkHelpFaq: "Ayuda y preguntas frecuentes",
    linkEmailUs: "Escríbenos",
    linkPrivacy: "Política de Privacidad",
    linkTerms: "Términos de Servicio",
    linkDataDeletion: "Eliminación de Datos",
    linkAppAds: "app-ads.txt",
    copyright: "LogMyPlate. Todos los derechos reservados.",
    medicalDisclaimer:
      "Las estimaciones de IA son aproximaciones y no constituyen asesoramiento médico. Consulta siempre a un profesional calificado.",
  },

  offerRibbon: {
    badge: "🎉 30 días de Premium gratis en el lanzamiento",
    highlight: "🎉 30 días de Premium gratis en el lanzamiento",
    suffix: " — Nutricionista con IA y escaneos diarios incluidos",
    ariaLabel: "Oferta de lanzamiento: 30 días de Premium gratis",
  },

  launchOfferModal: {
    badge: "OFERTA DE LANZAMIENTO DE 30 DÍAS",
    title: "Comienza con 30 días de Premium, por cuenta nuestra.",
    subtitle:
      "Cada cuenta nueva obtiene escaneos diarios con IA y chat con el Nutricionista de IA gratis en el lanzamiento. Sin tarjeta de crédito.",
    feature1: "5 escaneos de comidas con IA todos los días",
    feature2: "Chat con Nutricionista de IA incluido",
    feature3: "Flujo completo de foto, revisión y diario",
    note: "Sin tarjeta de crédito · Gratis por 30 días",
    closeAria: "Cerrar oferta",
  },

  downloadBadges: {
    appStoreAria: "Descárgalo en el App Store",
    playStoreAria: "Disponible en Google Play",
  },

  home: {
    metaTitle: `${APP_CONFIG.appName} — Registra comidas a partir de una foto`,
    metaDescription:
      "Toma una foto de tu comida. LogMyPlate: Contador de calorías con IA identifica alimentos, estima calorías y macros, y guarda todo en tu diario — sin códigos de barras.",
    hero: {
      badge: "FOTO · REVISIÓN · DIARIO",
      headline: "Registra comidas",
      headlineBreak: "a partir de una foto.",
      subheadline: `${APP_CONFIG.appName} transforma la foto de tu plato y una breve nota en un registro editable con calorías, macros y detalles en tu diario.`,
      pillNoBarcode: "Sin código de barras",
      pillCuisines: "Comida local e internacional",
      pillThemes: "Tema claro y oscuro",
      altFrenchToast:
        "Pantalla de detalle de comida en LogMyPlate con calorías y macros de tostadas francesas",
      altThaliReview:
        "Pantalla de revisión de estimación en LogMyPlate mostrando un thali indio con calorías y macros",
      altDashboard:
        "Panel de LogMyPlate en tema claro con distribución de macros y ritmo semanal",
    },
    howItWorks: {
      badge: "Cómo funciona",
      title: "El mismo flujo simple que ves en la app.",
      flow: [
        {
          eyebrow: "Foto",
          title: "Foto más una nota",
          body: "Empieza con una foto clara de tu plato. Agrega una nota breve como 'tostadas francesas, miel, frutos rojos' para ayudar a la IA.",
          alt: "Pantalla de escaneo de LogMyPlate con foto de tostada francesa lista para analizar",
        },
        {
          eyebrow: "Analiza",
          title: "La IA interpreta el plato",
          body: "La app calcula calorías y macronutrientes manteniendo el proceso rápido y sin complicaciones.",
          alt: "Pantalla de análisis de LogMyPlate evaluando la foto de una comida",
        },
        {
          eyebrow: "Revisa",
          title: "Confirma la estimación",
          body: "Revisa cada ingrediente, porción y macronutriente antes de guardar la comida en tu diario.",
          alt: "Pantalla de confirmación de LogMyPlate con lista de alimentos para validar",
        },
        {
          eyebrow: "Diario",
          title: "Crea tu propio ritmo",
          body: "Observa tu energía diaria, balance de macros, ritmo semanal y detalles de cada comida en un diario ordenado.",
          alt: "Panel de diario de LogMyPlate con resumen de calorías y constancia semanal",
        },
      ],
    },
    reviewEstimate: {
      badge: "Revisa la estimación",
      title: "Las calorías son útiles solo cuando las puedes editar.",
      paragraph1:
        "La app te muestra la estimación antes de guardar: energía total, desglose de macronutrientes, lista de alimentos, gramos, porciones y el aporte calórico de cada elemento.",
      paragraph2:
        "Tú tienes el control total del registro final. Escanea, revisa, corrige lo que haga falta y guarda la comida cuando esté correcta.",
      macroMixBadge: "BALANCE DE MACROS",
      altMealDetail:
        "Pantalla de detalle en LogMyPlate con perfil de macros y desglose por ingrediente",
    },
    aiNutritionist: {
      badge: "✦ Premium",
      title: "Un nutricionista de IA que conoce tus últimos 7 días.",
      paragraph1:
        "Pregúntale qué cenar o cómo equilibrar tu semana. El Nutricionista de IA responde con base en tu propio diario: tu meta de calorías, energía restante, macros y lo que comiste en realidad.",
      bullet1: "Ideas de comidas adaptadas a tus calorías disponibles",
      bullet2: "Evaluación de balance semanal y macros al instante",
      bullet3: "Basado en tus registros reales, sin consejos genéricos",
      altChat: "Chat con el Nutricionista de IA en LogMyPlate respondiendo sugerencias para la cena",
      altWeeklySummary:
        "Resumen semanal de LogMyPlate con mezcla de macros y acceso al Nutricionista de IA",
    },
    themes: {
      badge: "Tema de la app",
      title: "Claro u oscuro, tu diario mantiene la calma.",
      subtitle:
        "LogMyPlate se adapta a tu preferencia visual mientras mantiene tus registros, metas y escaneos cómodos de leer.",
      cards: [
        {
          label: "Tema oscuro",
          alt: "Pantalla de escaneo de LogMyPlate en tema oscuro lista para analizar",
        },
        {
          label: "Panel claro",
          alt: "Panel principal de LogMyPlate en tema claro",
        },
        {
          label: "Edita cualquier plato",
          alt: "Hoja de edición de alimento en LogMyPlate en tema claro",
        },
      ],
    },
    premium: {
      srTitle:
        "30 días de Premium gratis en el lanzamiento — acceso a nutrición avanzada con IA",
      bannerAltLandscape:
        "Oferta de lanzamiento de 30 días gratis en LogMyPlate: 5 escaneos diarios con IA, escaneos extra con anuncios y funciones premium",
      bannerAltPortrait:
        "Oferta de lanzamiento de 30 días gratis en LogMyPlate: 5 escaneos diarios con IA, escaneos extra con anuncios y funciones premium",
      intro:
        "Durante los primeros 30 días desde el lanzamiento, cada cuenta nueva obtiene escaneos diarios de comida con IA y chat con el Nutricionista de IA — gratis, sin tarjeta. Cuando termine la oferta, continúa escaneando viendo un anuncio breve o suscríbete a Premium.",
      tiers: [
        {
          label: "Gratis en lanzamiento · 30 días",
          accent: "var(--app-teal)",
          perks: [
            "5 escaneos de comidas con IA cada día",
            "1 consulta diaria con el Nutricionista de IA",
            "Flujo completo de foto, revisión y diario",
          ],
        },
        {
          label: "Premium",
          accent: "var(--app-amber)",
          perks: [
            "300 escaneos de comidas con IA al mes (hasta 10 por día)",
            "5 consultas diarias con el Nutricionista de IA",
            "Después del lanzamiento: desbloquea escaneos extra viendo anuncios",
          ],
        },
      ],
      note: "Sin tarjeta de crédito para empezar. Los precios de suscripción y términos de renovación se muestran en la tienda de apps.",
    },
    ctaSection: {
      title: "Comienza con una foto clara de tu plato.",
      subtitle:
        "Agrega una nota, revisa la estimación y lleva tu diario al día con un contador de calorías diseñado para comidas reales.",
      privacyLink: "Política de Privacidad",
    },
  },

  download: {
    metaTitle: `Descargar ${APP_CONFIG.appName}`,
    metaDescription:
      "Descarga LogMyPlate: Contador de calorías con IA para iPhone o Android. Toma una foto de cualquier comida y obtén estimaciones inmediatas de calorías y macros — sin códigos de barras.",
    badge: "Ya disponible",
    headlinePrefix: "Descarga",
    headlineBrand: "LogMyPlate",
    headlineSubtitle: "Contador de calorías con IA",
    description:
      "Gratis en iPhone y Android. Empieza a registrar tus comidas a partir de fotos en menos de un minuto.",
    featuresHeading: "Qué incluye",
    features: [
      "Análisis de comidas por foto — sin códigos de barras",
      "Compatible con cocina casera, latinoamericana, asiática e internacional",
      "Calorías, proteína, carbohidratos y grasa estimados con IA",
      "Revisa y ajusta los alimentos antes de guardar",
      "Diario diario con resúmenes semanales",
      "Metas de salud: objetivos personalizados de calorías y macros",
      "Escaneos gratis todos los días; desbloquea más viendo anuncios",
    ],
  },

  support: {
    metaTitle: "Soporte y Ayuda",
    metaDescription:
      "Obtén ayuda con LogMyPlate: Contador de calorías con IA — preguntas frecuentes, consejos de uso y contacto directo.",
    badge: "Ayuda y Soporte",
    headline: "¿Cómo podemos ayudarte?",
    subtitle:
      "Respuestas a las dudas más comunes sobre LogMyPlate, escaneo con fotos y administración de tu cuenta.",
    contactBoxHeading: "¿Aún tienes dudas?",
    contactBoxText:
      "Comunícate con nuestro equipo de asistencia. Habitualmente respondemos en menos de 24 horas.",
    contactButton: `Escríbenos a ${APP_CONFIG.supportEmail}`,
    faqs: [
      {
        q: "¿Qué tan precisas son las estimaciones de calorías?",
        a: "LogMyPlate utiliza inteligencia artificial para estimar calorías y macronutrientes a partir de una foto. La precisión depende de la nitidez de la imagen, la visibilidad de los ingredientes y el tamaño estimado de la porción. Considera los resultados como una guía de referencia útil y práctica, no como una medición clínica de laboratorio.",
      },
      {
        q: "¿Puedo corregir los ingredientes o cantidades que detecta la IA?",
        a: "Sí. Después de que la IA genera su estimación, puedes modificar el nombre de cualquier alimento, ajustar la porción o cambiar la cantidad antes de guardar la comida en tu diario.",
      },
      {
        q: "¿Cuántos escaneos gratuitos recibo?",
        a: "LogMyPlate incluye 3 escaneos iniciales gratuitos para que pruebes la experiencia antes de crear una cuenta. Los usuarios registrados pueden desbloquear escaneos adicionales viendo anuncios recompensados cuando estén disponibles.",
      },
      {
        q: "¿Por qué un anuncio recompensado indica que no está listo?",
        a: "Los anuncios recompensados pueden no cargar si utilizas VPN, DNS privado, bloqueadores de publicidad o redes empresariales/escolares que restrinjan Google AdMob. Desactiva la VPN o el bloqueo de DNS, cambia a datos móviles o a otra red Wi-Fi y vuelve a abrir la app. Los anuncios son opcionales y dependen de la disponibilidad en tu región.",
      },
      {
        q: "¿Funciona con comida casera y platos combinados?",
        a: "Sí. El modelo de IA está entrenado para reconocer platos mixtos, guisados, arroces, ensaladas, pastas y comida tradicional de múltiples regiones sin depender de bases de datos basadas en códigos de barras.",
      },
      {
        q: "¿Mis fotos y datos son privados?",
        a: "Tus fotos de comida se usan exclusivamente para generar el desglose nutricional y, si lo decides, guardarlas en tu diario personal. No vendemos tus datos a anunciantes ni a terceros. Consulta nuestra Política de Privacidad para más información.",
      },
      {
        q: "¿Cómo elimino mi cuenta?",
        a: "Abre la aplicación y ve a Perfil > Privacidad y legal > Eliminar cuenta y datos. Esto borra de forma permanente e irreversible tu cuenta, diario, fotos guardadas, metas y credenciales de acceso de nuestros sistemas activos.",
      },
      {
        q: "¿Necesito crear una cuenta para usar la app?",
        a: "No. Puedes usar LogMyPlate sin registrarte. Crear una cuenta con correo electrónico te permite conservar y respaldar tu diario si cambias o reinstalas tu dispositivo.",
      },
      {
        q: "¿Qué permisos solicita la aplicación?",
        a: "Acceso a la cámara (para capturar fotos de tus comidas) y a la biblioteca de fotos (para seleccionar imágenes tomadas previamente). Ambos permisos se emplean únicamente para el análisis nutricional.",
      },
    ],
  },

  privacy: {
    metaTitle: "Política de Privacidad",
    metaDescription:
      "Política de Privacidad de LogMyPlate: tratamiento de fotos de comida, análisis con IA, datos de cuenta, objetivos de salud, suscripciones con RevenueCat, anuncios recompensados y derechos de eliminación.",
    badge: "Legal",
    headline: "Política de Privacidad",
    lastUpdated: "7 de junio de 2026",
    legallyBindingNotice:
      "AVISO: La versión en inglés de esta Política de Privacidad es la única legalmente vinculante. Esta traducción se proporciona exclusivamente para facilitar su comprensión.",
    sections: [
      {
        title: "1. Información general",
        content: [
          "LogMyPlate ('nosotros', 'nuestro') respeta tu privacidad. Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos tu información cuando utilizas nuestra aplicación móvil y los servicios asociados.",
          "Nuestro principio fundamental es la privacidad desde el diseño: recopilamos únicamente la información necesaria para analizar tus comidas, ofrecer estimaciones nutricionales y respaldar tu diario de alimentación.",
        ],
      },
      {
        title: "2. Información que recopilamos",
        content: [
          "Fotos de comidas: Capturadas o seleccionadas por ti con el único fin de realizar el análisis nutricional. Las imágenes se procesan temporalmente y solo se conservan si decides guardarlas en tus registros.",
          "Metas de salud y nutrición: Datos opcionales de perfil como peso, estatura, nivel de actividad física y objetivos personales para calcular tus metas de calorías y macronutrientes.",
          "Datos de cuenta: Si decides registrarte, almacenamos tu dirección de correo electrónico y credenciales de autenticación. También admitimos el uso anónimo sin registro de cuenta.",
          "Datos técnicos y de diagnóstico: Identificadores anónimos de instalación, versión del sistema operativo y reportes de fallas para mantener la estabilidad y seguridad del servicio.",
        ],
      },
      {
        title: "3. Cómo utilizamos tu información",
        content: [
          "Para brindar identificación de alimentos y estimación de porciones basada en inteligencia artificial.",
          "Para mantener actualizado tu diario de comidas, estadísticas y seguimiento de objetivos.",
          "Para permitir escaneos adicionales opcionales mediante anuncios recompensados de Google AdMob y gestionar suscripciones a través de RevenueCat.",
          "Para enviarte notificaciones y recordatorios del servicio cuando hayas otorgado los permisos correspondientes.",
        ],
      },
      {
        title: "4. Divulgación de datos y terceros",
        content: [
          "No vendemos, alquilamos ni comercializamos tu información personal ni tus registros de salud con anunciantes ni terceros.",
          "La información se comparte estrictamente con proveedores de infraestructura esenciales para la operación (alojamiento en la nube, procesamiento de modelos de IA y validación de compras en tiendas de apps) bajo estrictos acuerdos de confidencialidad.",
        ],
      },
      {
        title: "5. Conservación y eliminación de datos",
        content: [
          "Puedes solicitar la eliminación completa de tu cuenta, historial, fotos y metas en cualquier momento desde la app en Perfil > Privacidad y legal > Eliminar cuenta y datos, o mediante nuestro formulario web de eliminación de datos.",
          "Una vez confirmada la solicitud, tus datos se eliminan de manera permanente e irreversible de nuestras bases de datos operativas y sistemas de almacenamiento.",
        ],
      },
    ],
  },

  terms: {
    metaTitle: "Términos de Servicio",
    metaDescription:
      "Términos de Servicio de LogMyPlate: uso de la app, estimaciones de calorías con IA, deslindes médicos, cuentas de usuario, anuncios recompensados, suscripciones y limitaciones de responsabilidad.",
    badge: "Legal",
    headline: "Términos de Servicio",
    lastUpdated: "7 de junio de 2026",
    legallyBindingNotice:
      "AVISO: La versión en inglés de estos Términos de Servicio es la única legalmente vinculante. Esta traducción se proporciona exclusivamente para facilitar su comprensión.",
    medicalDisclaimerHeading: "Deslinde de Responsabilidad Médica Importante",
    medicalDisclaimerText:
      "LogMyPlate tiene propósitos exclusivamente informativos y educativos. Las estimaciones de calorías y macronutrientes son aproximaciones derivadas del análisis visual de inteligencia artificial. No representan mediciones clínicas ni constituyen asesoramiento médico, dietético o nutricional profesional.",
    sections: [
      {
        title: "1. Aceptación de los términos",
        content: [
          "Al descargar, instalar o utilizar LogMyPlate, aceptas quedar vinculado por estos Términos de Servicio y por nuestra Política de Privacidad. Si no estás de acuerdo con alguna disposición, no debes utilizar la aplicación.",
        ],
      },
      {
        title: "2. Descripción del servicio",
        content: [
          "LogMyPlate proporciona un diario de alimentación basado en fotos y estimaciones nutricionales con IA. Reconoces y aceptas que las estimaciones pueden variar de acuerdo con la calidad de la foto, la visibilidad de los ingredientes y las dimensiones de la porción.",
        ],
      },
      {
        title: "3. Responsabilidades del usuario",
        content: [
          "Eres responsable de verificar y revisar las estimaciones antes de tomarlas como referencia definitiva para tu alimentación.",
          "Aceptas no subir imágenes ilegales, ofensivas, difamatorias ni que vulneren derechos de propiedad intelectual de terceros.",
        ],
      },
      {
        title: "4. Suscripciones y compras integradas",
        content: [
          "Las suscripciones Premium se procesan y cobran a través de Apple App Store o Google Play Store. Las condiciones de renovación, cancelaciones y reembolsos se gestionan de forma directa mediante la cuenta de tu respectiva plataforma.",
        ],
      },
      {
        title: "5. Limitación de responsabilidad",
        content: [
          "En la máxima medida permitida por la legislación aplicable, LogMyPlate y sus desarrolladores no serán responsables de daños indirectos, incidentales, especiales o derivados del uso de la aplicación o de la confianza depositada en las estimaciones nutricionales generadas.",
        ],
      },
    ],
  },

  dataDeletion: {
    metaTitle: "Eliminación de Datos",
    metaDescription:
      "Instrucciones para eliminar permanentemente tu cuenta de LogMyPlate, diario de comidas, objetivos de salud, fotos guardadas y datos asociados.",
    badge: "Control de cuenta",
    headline: "Eliminación de Datos",
    intro:
      "Puedes eliminar de manera definitiva tu cuenta de LogMyPlate y todos los datos asociados directamente desde la aplicación. No se requiere trámite telefónico ni procesos complejos cuando tienes acceso a la app.",
    inAppHeading: "Qué información se elimina",
    inAppSteps: [
      "Perfil de usuario y credenciales de correo electrónico, si creaste una cuenta",
      "Registros del diario de comidas, alimentos, estimaciones de calorías y marcas de tiempo",
      "Objetivos de salud, parámetros de IMC, nivel de actividad y metas de macronutrientes",
      "Sesiones activas e historial de autenticación asociados a tu cuenta",
      "Fotos de comidas almacenadas en tu historial",
    ],
    inAppNote: "La eliminación es inmediata, irreversible y purga toda tu información de nuestros sistemas activos.",
    openAppButton: "Abrir pantalla de eliminación en LogMyPlate",
    webHeading: "¿No tienes la app instalada?",
    webText:
      "Si desinstalaste la aplicación o no puedes abrirla, puedes solicitar la eliminación manual enviando un correo electrónico a nuestro equipo de soporte desde la dirección registrada en tu cuenta.",
    webEmailSubject: "Solicitud de eliminación de cuenta y datos",
    webEmailButton: `Escribir a ${APP_CONFIG.supportEmail}`,
    retentionHeading: "Política de retención",
    retentionText:
      "Al confirmar tu solicitud, los registros se eliminan de las bases de datos activas en un plazo máximo de 48 horas. Las copias de seguridad rutinarias del servidor caducan de forma definitiva en un período de hasta 30 días.",
  },

  caloriesIndex: {
    metaTitle: "Directorio de Calorías — Calorías y Macros Verificados",
    metaDescription:
      "Consulta calorías, proteína, carbohidratos y grasa de alimentos cotidianos. Porciones reales y rangos observados para planificar tus comidas.",
    badge: "Directorio de Calorías",
    headline: "Calorías en alimentos cotidianos.",
    subtitle:
      "Porciones reales, rangos transparentes y macronutrientes basados en cómo la gente prepara y come sus alimentos habitualmente.",
    tierIndian: "Comida India y Tradicional",
    tierGlobal: "Platos Internacionales",
    viewFoodButton: "Ver calorías y macros",
    per100gBadge: "por 100 g",
    portionsBadge: "porciones",
  },

  guidesIndex: {
    metaTitle: "Guías y Blog — Consejos de Nutrición y Conteo de Calorías",
    metaDescription:
      "Guías prácticas sobre cómo registrar comidas con fotos, contar calorías en comida casera, seguimiento de macros y control de porciones con IA.",
    badge: "Guías de Nutrición",
    headline: "Guías prácticas para comidas reales.",
    subtitle:
      "Aprende cómo funciona el registro con fotos para platos combinados, comida casera, salidas a restaurantes y metas de bienestar.",
    readArticleButton: "Leer guía",
    minReadSuffix: "de lectura",
  },
};
