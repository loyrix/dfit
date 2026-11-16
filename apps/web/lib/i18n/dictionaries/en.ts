import type { Dictionary } from "../types";
import { APP_CONFIG } from "@/config/app";

export const enDictionary: Dictionary = {
  locale: "en",

  common: {
    languageSwitcherLabel: "Language",
    selectLanguageAria: "Select language",
    macros: {
      calories: "Calories",
      protein: "Protein",
      carbs: "Carbs",
      fat: "Fat",
      fiber: "Fiber",
      sodium: "Sodium",
      sugar: "Sugar",
    },
    units: {
      grams: "g",
      kcal: "kcal",
    },
    notMedicalAdviceNotice:
      "AI estimates are not medical advice. Always consult a qualified professional.",
  },

  nav: {
    howItWorks: "How it works",
    aiCoach: "AI Coach",
    guides: "Guides",
    support: "Support",
    downloadCta: "Download",
    homeAria: "LogMyPlate home",
    mainNavAria: "Main navigation",
    openMenuAria: "Open menu",
    closeMenuAria: "Close menu",
  },

  footer: {
    brandDescription:
      "Track meals from a photo. AI-powered calorie and macro estimation for every plate.",
    groupProduct: "Product",
    groupSupport: "Support",
    groupLegal: "Legal",
    linkDownload: "Download",
    linkHowItWorks: "How it works",
    linkGuides: "Guides",
    linkHelpFaq: "Help & FAQ",
    linkEmailUs: "Email us",
    linkPrivacy: "Privacy Policy",
    linkTerms: "Terms of Service",
    linkDataDeletion: "Data Deletion",
    linkAppAds: "app-ads.txt",
    copyright: "LogMyPlate. All rights reserved.",
    medicalDisclaimer:
      "AI estimates are not medical advice. Always consult a qualified professional.",
  },

  offerRibbon: {
    badge: "🎉 30 days of Premium, free at launch",
    highlight: "🎉 30 days of Premium, free at launch",
    suffix: " — AI nutritionist & daily meal scans included",
    ariaLabel: "Launch offer: 30 days of Premium free",
  },

  launchOfferModal: {
    badge: "30-DAY LAUNCH OFFER",
    title: "Start with 30 days of Premium, on us.",
    subtitle:
      "Every new account gets free daily AI meal scans and unlimited AI Nutritionist chat at launch. No credit card required.",
    feature1: "5 AI meal scans every day",
    feature2: "AI Nutritionist chat included",
    feature3: "Full photo, review, and journal flow",
    note: "No credit card needed · Free for 30 days",
    closeAria: "Dismiss offer",
  },

  downloadBadges: {
    appStoreAria: "Download on the App Store",
    playStoreAria: "Get it on Google Play",
  },

  home: {
    metaTitle: `${APP_CONFIG.appName} — Track Meals from a Photo`,
    metaDescription:
      "Snap a photo of your meal. LogMyPlate: AI Calorie Tracker identifies food items, estimates calories and macros, and saves everything to your journal — no barcodes needed.",
    hero: {
      badge: "PHOTO · REVIEW · JOURNAL",
      headline: "Track meals",
      headlineBreak: "from a photo.",
      subheadline: `${APP_CONFIG.appName} turns a plate photo and short note into an editable calorie, macro, and journal entry.`,
      pillNoBarcode: "No barcode required",
      pillCuisines: "Indian and global meals",
      pillThemes: "Light and dark app themes",
      altFrenchToast:
        "LogMyPlate meal detail screen showing French toast calories and macros",
      altThaliReview:
        "LogMyPlate review estimate screen showing an Indian thali with calories and macros",
      altDashboard:
        "LogMyPlate light theme dashboard with macro mix and weekly rhythm",
    },
    howItWorks: {
      badge: "How it works",
      title: "The same flow users see in the app.",
      flow: [
        {
          eyebrow: "Photo",
          title: "Photo plus food note",
          body: "Start with one clear plate image. Add a short note like 'French toast, maple syrup, berries' when it helps the AI.",
          alt: "LogMyPlate light theme scan screen with a French toast photo ready to analyze",
        },
        {
          eyebrow: "Analyze",
          title: "AI reads the plate",
          body: "The app calculates calories and macro nutrients while keeping the photo flow simple.",
          alt: "LogMyPlate analyzing screen reading a meal photo",
        },
        {
          eyebrow: "Review",
          title: "Confirm the estimate",
          body: "Review every item, portion, and macro before the meal is saved to your journal.",
          alt: "LogMyPlate review estimate screen with food items to confirm",
        },
        {
          eyebrow: "Journal",
          title: "Build your rhythm",
          body: "See daily energy, macro mix, weekly rhythm, and meal details in one calm journal.",
          alt: "LogMyPlate dashboard showing daily energy and weekly rhythm",
        },
      ],
    },
    reviewEstimate: {
      badge: "Review estimate",
      title: "Calories are useful only when you can edit them.",
      paragraph1:
        "The app shows the estimate before saving: total energy, macro split, item list, grams, portions, and each item's calorie contribution.",
      paragraph2:
        "You stay in control of the final log. Scan, review, correct what needs correcting, then save the meal when it looks right.",
      macroMixBadge: "MACRO MIX",
      altMealDetail:
        "LogMyPlate meal detail screen showing macro profile and item contribution",
    },
    aiNutritionist: {
      badge: "✦ Premium",
      title: "An AI nutritionist that has read your last 7 days.",
      paragraph1:
        "Ask what to eat for dinner or how your week is balancing. The AI Nutritionist answers from your own journal — calorie target, remaining energy, macros, and the meals you actually logged.",
      bullet1: "Dinner ideas built around your remaining calories",
      bullet2: "Weekly balance and macro check-ins on demand",
      bullet3: "Grounded in your real logs, not generic advice",
      altChat: "LogMyPlate AI Nutritionist chat answering what to eat for dinner",
      altWeeklySummary:
        "LogMyPlate weekly summary with macro mix and Ask AI Nutritionist",
    },
    themes: {
      badge: "App theme",
      title: "Light or dark, your journal stays calm.",
      subtitle:
        "LogMyPlate follows your preferred theme while keeping the same meal scan, target, and journal flow easy to read.",
      cards: [
        {
          label: "Dark theme",
          alt: "LogMyPlate dark theme scan screen with an Indian thali ready to analyze",
        },
        {
          label: "Light dashboard",
          alt: "LogMyPlate light theme today dashboard",
        },
        {
          label: "Edit any item",
          alt: "LogMyPlate edit item sheet in light theme",
        },
      ],
    },
    premium: {
      srTitle:
        "30 days of Premium free at launch — premium AI nutrition tracking access",
      bannerAltLandscape:
        "LogMyPlate 30 days free launch offer: 5 AI meal scans a day, extra scans via ads, and premium features",
      bannerAltPortrait:
        "LogMyPlate 30 days free launch offer: 5 AI meal scans a day, extra scans via ads, and premium features",
      intro:
        "For the first 30 days from launch, every new account gets daily AI meal scans and an AI Nutritionist chat — free, no card needed. When the offer ends, keep scanning by watching a quick ad, or unlock Premium.",
      tiers: [
        {
          label: "Free at launch · 30 days",
          accent: "var(--app-teal)",
          perks: [
            "5 AI meal scans every day",
            "1 AI Nutritionist chat every day",
            "Full photo, review, and journal flow",
          ],
        },
        {
          label: "Premium",
          accent: "var(--app-amber)",
          perks: [
            "300 AI meal scans / month (up to 10 a day)",
            "5 AI Nutritionist chats every day",
            "After launch: earn extra scans by watching ads",
          ],
        },
      ],
      note: "No card needed to start. Subscription prices and renewal terms are shown at store checkout.",
    },
    ctaSection: {
      title: "Start with one clear meal photo.",
      subtitle:
        "Add a note, review the estimate, and keep your journal moving with a calorie tracker designed around real meals.",
      privacyLink: "Privacy Policy",
    },
  },

  download: {
    metaTitle: `Download ${APP_CONFIG.appName}`,
    metaDescription:
      "Download LogMyPlate: AI Calorie Tracker on iPhone or Android. Snap a photo of any meal and get instant calorie and macro estimates — no barcodes, no database searching.",
    badge: "Available now",
    headlinePrefix: "Download",
    headlineBrand: "LogMyPlate",
    headlineSubtitle: "AI Calorie Tracker",
    description:
      "Free on iPhone and Android. Start tracking meals from a photo in under a minute.",
    featuresHeading: "What is included",
    features: [
      "Photo-based meal analysis — no barcodes",
      "Works for Indian, Asian, Mediterranean, and global cuisines",
      "AI-estimated calories, protein, carbs, and fat",
      "Review and correct items before saving",
      "Daily journal with weekly summaries",
      "Health targets: calorie and macro goals",
      "Free scans daily; watch an ad to unlock more",
    ],
  },

  support: {
    metaTitle: "Support",
    metaDescription:
      "Get help with LogMyPlate: AI Calorie Tracker — FAQ, tips, and contact information.",
    badge: "Help & Support",
    headline: "How can we help?",
    subtitle:
      "Answers to common questions about LogMyPlate, photo scanning, and account management.",
    contactBoxHeading: "Still have questions?",
    contactBoxText:
      "Reach out to our support team directly. We typically respond within 24 hours.",
    contactButton: `Email us at ${APP_CONFIG.supportEmail}`,
    faqs: [
      {
        q: "How accurate are the calorie estimates?",
        a: "LogMyPlate: AI Calorie Tracker uses AI to estimate calories and macros from a photo. Accuracy depends on photo quality, how clearly each item is visible, and portion estimation from visual size. Expect estimates within a reasonable range — treat them as a useful reference, not a clinical measurement.",
      },
      {
        q: "Can I correct the AI's food item list?",
        a: "Yes. After the AI returns its analysis, you can edit any item's name, portion, or quantity before saving to your journal. Changes are saved with your meal.",
      },
      {
        q: "How many free scans do I get?",
        a: "LogMyPlate includes 3 one-time free scans so you can try the flow before creating an account. Signed-in users may be able to unlock additional scans with rewarded ads when available.",
      },
      {
        q: "Why does a rewarded ad say it is not ready?",
        a: "Rewarded ads may not load when a VPN, Private DNS service, ad blocker, restricted office or school network, or unstable connection blocks Google AdMob. Turn off the VPN or ad-blocking DNS, switch to mobile data or a different Wi-Fi network, then reopen the app and try again. Ads are optional and depend on ad availability in your region.",
      },
      {
        q: "Does it work for Indian food?",
        a: "Yes — the AI model handles Indian meals including curries, rice dishes, dals, sabzis, breads, and street food. It also works for global cuisines. The model estimates portions visually rather than relying on a food database.",
      },
      {
        q: "Is my data private?",
        a: "Your meal photos are used only to generate your analysis and optionally stored privately in your journal. We do not sell your data. See our Privacy Policy for full details.",
      },
      {
        q: "How do I delete my account?",
        a: "Open the app and go to Profile > Privacy & legal > Delete account and data. This permanently deletes your account, journal, saved photos, targets, and sign-in access from active systems. The action is irreversible.",
      },
      {
        q: "Do I need an account to use the app?",
        a: "No. You can use LogMyPlate without an account. Creating an account with an email address lets you preserve your journal if you reinstall the app.",
      },
      {
        q: "What permissions does the app need?",
        a: "Camera access (to take meal photos) and photo library access (to choose existing photos). Both are used only for meal analysis.",
      },
    ],
  },

  privacy: {
    metaTitle: "Privacy Policy",
    metaDescription:
      "LogMyPlate Privacy Policy covering meal photos, AI analysis, account data, health targets, subscriptions, RevenueCat, push tokens, AdMob rewarded ads, app store data disclosures, and deletion rights.",
    badge: "Legal",
    headline: "Privacy Policy",
    lastUpdated: "June 7, 2026",
    sections: [
      {
        title: "1. Overview",
        content: [
          "LogMyPlate (\"we\", \"our\", or \"us\") respects your privacy. This Privacy Policy describes how we collect, use, and protect your information when you use our mobile application and related services.",
          "Our core design principle is privacy-first: we collect only what is necessary to analyze meals, provide nutritional estimates, and support your journal.",
        ],
      },
      {
        title: "2. Information We Collect",
        content: [
          "Meal photos: Captured or selected by you solely for nutritional analysis. Images are processed temporarily and are only retained if you choose to store them with your meal logs.",
          "Nutrition & health targets: Optional profile information such as height, weight, activity level, and health goals to calculate calorie and macro targets.",
          "Account data: When you sign up, we store your email address and authentication credentials. Anonymous use without an account is also supported.",
          "Device & diagnostic data: Anonymous device identifiers, operating system version, and crash diagnostics to maintain service reliability.",
        ],
      },
      {
        title: "3. How We Use Information",
        content: [
          "To provide AI-powered food identification and portion estimation.",
          "To maintain your meal journal, streaks, and nutritional progress.",
          "To enable optional rewarded ads via Google AdMob and manage subscriptions via RevenueCat.",
          "To send operational notifications and reminders if push permissions are granted.",
        ],
      },
      {
        title: "4. Data Sharing & Third Parties",
        content: [
          "We do not sell, rent, or trade your personal or health data to advertisers or third parties.",
          "Data is shared strictly with infrastructure providers necessary to operate the service (cloud hosting, AI model processing, and payment verification) under strict confidentiality agreements.",
        ],
      },
      {
        title: "5. Data Retention & Deletion",
        content: [
          "You can permanently delete your account and all associated logs, photos, and targets at any time via Profile > Privacy & legal > Delete account and data in the app, or via our web deletion form.",
          "Upon confirmation, your data is permanently removed from active databases and storage buckets.",
        ],
      },
    ],
  },

  terms: {
    metaTitle: "Terms of Service",
    metaDescription:
      "LogMyPlate Terms of Service covering app use, AI calorie estimates, health disclaimers, accounts, user content, rewarded ads, subscriptions, and limitations.",
    badge: "Legal",
    headline: "Terms of Service",
    lastUpdated: "June 7, 2026",
    medicalDisclaimerHeading: "Important Medical Disclaimer",
    medicalDisclaimerText:
      "LogMyPlate is for informational and educational purposes only. Calorie and macro estimates are approximations based on visual AI analysis. They are not clinical measurements and do not constitute medical, dietary, or healthcare advice.",
    sections: [
      {
        title: "1. Acceptance of Terms",
        content: [
          "By downloading, installing, or using LogMyPlate, you agree to be bound by these Terms of Service. If you do not agree, do not use the app.",
        ],
      },
      {
        title: "2. Service Description",
        content: [
          "LogMyPlate provides photo-based food journaling and nutritional estimation. You acknowledge that AI estimates may vary depending on photo quality, hidden ingredients, and portion visibility.",
        ],
      },
      {
        title: "3. User Responsibilities",
        content: [
          "You are responsible for reviewing and verifying estimated values before relying on them.",
          "You agree not to upload harmful, offensive, or infringing imagery.",
        ],
      },
      {
        title: "4. Subscriptions & In-App Purchases",
        content: [
          "Premium subscriptions are billed through Apple App Store or Google Play Store. Renewal terms, cancellations, and refunds are managed directly by your respective platform account.",
        ],
      },
      {
        title: "5. Limitation of Liability",
        content: [
          "LogMyPlate and its creators shall not be liable for any indirect, incidental, or consequential damages resulting from the use of the app or reliance on nutritional estimates.",
        ],
      },
    ],
  },

  dataDeletion: {
    metaTitle: "Data Deletion",
    metaDescription:
      "How to permanently delete your LogMyPlate account, meal journal, health targets, stored meal photos, and app data.",
    badge: "Account controls",
    headline: "Data Deletion",
    intro:
      "You can permanently delete your LogMyPlate account and associated app data directly inside the app. No separate web account, phone call, or support-only process is required when you can access the app.",
    inAppHeading: "What deletion removes",
    inAppSteps: [
      "Account profile and email login data, where an account exists",
      "Meal journal entries, food items, calorie estimates, macros, and timestamps",
      "Health targets, BMI estimate inputs, activity level, and goal settings",
      "Active sign-in records associated with your account",
      "Stored meal photos attached to saved meal logs",
    ],
    inAppNote: "Deletion is immediate, irreversible, and purges all data from active systems.",
    openAppButton: "Open deletion screen in LogMyPlate",
    webHeading: "App not installed?",
    webText:
      "If you uninstalled the app or cannot open it, you can request manual data deletion by emailing our support team with the email address registered to your account.",
    webEmailSubject: "Data Deletion Request",
    webEmailButton: `Email ${APP_CONFIG.supportEmail}`,
    retentionHeading: "Retention Policy",
    retentionText:
      "When deletion is requested, records are scrubbed from active operational databases within 48 hours. Routine server backups expire within 30 days.",
  },

  caloriesIndex: {
    metaTitle: "Calorie Directory — Verified Calories & Macros",
    metaDescription:
      "Browse calories, protein, carbs, and fat for popular foods. Verified portion sizes and real observed ranges.",
    badge: "Calorie Directory",
    headline: "Calories in everyday foods.",
    subtitle:
      "Real portion sizes, honest ranges, and accurate macros based on how people actually prepare and eat meals.",
    tierIndian: "Indian Foods",
    tierGlobal: "Global Foods",
    viewFoodButton: "View calories & macros",
    per100gBadge: "per 100g",
    portionsBadge: "portions",
  },

  guidesIndex: {
    metaTitle: "Guides — AI Calorie Tracking & Nutrition Tips",
    metaDescription:
      "Practical guides on tracking Indian food, home cooking, macros, portion estimates, and photo food journals.",
    badge: "Nutrition Guides",
    headline: "Practical guides for real meals.",
    subtitle:
      "Learn how photo tracking works for mixed plates, home cooking, restaurant dishes, and fitness goals.",
    readArticleButton: "Read guide",
    minReadSuffix: "read",
  },
};
