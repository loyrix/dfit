export type GuideSection = {
  heading: string;
  paragraphs: string[];
};

export type GuideFaq = {
  question: string;
  answer: string;
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  summary: string;
  category: string;
  readTime: string;
  accent: string;
  keywords: string[];
  sections: GuideSection[];
  faqs: GuideFaq[];
};

export const guideLastUpdated = "2026-05-24";

export const guides: Guide[] = [
  {
    slug: "ai-calorie-tracker-india",
    title: "How AI calorie trackers work for Indian meals",
    description:
      "Why photo-based AI calorie tracking is a better fit for Indian meals than barcode scanners and generic food databases.",
    summary:
      "Barcode trackers struggle with dal, roti, sabzi, biryani, and mixed home-cooked meals. Here is where photo analysis helps.",
    category: "AI calorie tracking",
    readTime: "5 min read",
    accent: "#efbd44",
    keywords: [
      "AI calorie tracker India",
      "Indian food calorie tracker",
      "photo calorie tracker",
      "LogMyPlate",
    ],
    sections: [
      {
        heading: "Why Indian meals are hard to log manually",
        paragraphs: [
          "Most calorie databases are strongest for packaged foods, restaurant chains, and meals with standardized serving sizes. Indian home cooking is different. The same dal, sabzi, poha, biryani, or pav bhaji can change a lot based on oil, portion size, and ingredients.",
          "That is why many people stop tracking. Searching for a generic food entry is slow, and the result often feels wrong for the actual plate in front of them.",
        ],
      },
      {
        heading: "What photo-based AI changes",
        paragraphs: [
          "LogMyPlate starts from the plate image. The AI identifies visible food items, uses the food note for context, estimates portions, and returns calories, protein, carbs, and fat for review.",
          "The result is still an estimate, not a lab measurement. The value is speed and consistency: you can capture the meal quickly, correct what looks wrong, and build a journal over days and weeks.",
        ],
      },
      {
        heading: "Where users should still review carefully",
        paragraphs: [
          "Hidden ingredients are the biggest uncertainty. Ghee, oil, sugar, cheese, and sauces are not always visible in a photo. A short note like 'paneer butter masala' or 'less oil' can help the model, but the final log should always be reviewed.",
          "For medical nutrition needs, diabetes management, eating disorder care, kidney disease, pregnancy, or clinical targets, users should treat AI estimates as general information and speak with a qualified healthcare professional.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can an AI calorie tracker be exact?",
        answer:
          "No. Photo-based calorie tracking provides estimates. It is useful for awareness and consistency, but it should not be treated as a medical measurement.",
      },
      {
        question: "Does LogMyPlate work only for Indian food?",
        answer:
          "No. The app is Indian-first in how it handles common Indian meals, but it is designed for global meals too.",
      },
    ],
  },
  {
    slug: "indian-food-calorie-tracker",
    title: "Tracking calories in Indian food: a practical guide",
    description:
      "A practical guide to tracking calories in Indian food with photos, portion review, and macro estimates.",
    summary:
      "Learn how to track dal, rice, roti, sabzi, snacks, and mixed plates without weighing every ingredient.",
    category: "Indian food",
    readTime: "6 min read",
    accent: "#70caa3",
    keywords: [
      "Indian food calorie tracker",
      "track Indian food calories",
      "dal roti calorie tracker",
      "AI food journal",
    ],
    sections: [
      {
        heading: "Start with the plate, not the database",
        paragraphs: [
          "For Indian food, the fastest tracking method is often a clear photo plus a short note. Instead of searching for a perfect database match, capture the meal as eaten and let the app estimate the visible items.",
          "This works especially well for mixed plates: rice plus dal, sabzi plus roti, idli with sambar, misal pav, poha, khichdi, chole, rajma, and similar meals where manual entry becomes slow.",
        ],
      },
      {
        heading: "Use notes for dishes that look similar",
        paragraphs: [
          "Some foods look similar from the top. A note such as 'moong dal', 'chana masala', 'veg pulao', or 'homemade paneer' gives the AI useful context without turning tracking into a long form.",
          "The note should describe the food, not replace the photo. The app is designed to verify the visible plate and avoid inventing items that are not shown.",
        ],
      },
      {
        heading: "Review portions before saving",
        paragraphs: [
          "Indian meals often use bowls, katoris, ladles, and pieces rather than grams. LogMyPlate converts portions into editable estimates so you can adjust when the serving is clearly bigger or smaller.",
          "Over time, the habit matters more than a single perfect number. A reviewed estimate for every meal is more useful than an exact entry once a week.",
        ],
      },
    ],
    faqs: [
      {
        question: "Should I weigh Indian food for calorie tracking?",
        answer:
          "Weighing can be useful for precision, but most people do not need it for every meal. A photo and reviewed estimate can be enough for daily awareness.",
      },
      {
        question: "Can LogMyPlate track homemade food?",
        answer:
          "Yes. Homemade food is one of the main reasons the app uses photo-based analysis instead of relying only on packaged-food databases.",
      },
    ],
  },
  {
    slug: "photo-food-journal",
    title: "Why a photo food journal is easier to stick with",
    description:
      "How a photo food journal reduces friction, improves consistency, and helps users notice eating patterns.",
    summary:
      "A food journal works only if you keep using it. Photos make the habit faster and less tiring.",
    category: "Food journal",
    readTime: "4 min read",
    accent: "#ff7e78",
    keywords: ["photo food journal", "food journal app", "meal tracking habit", "calorie journal"],
    sections: [
      {
        heading: "Consistency beats perfect logging",
        paragraphs: [
          "The biggest problem with food journals is friction. If every meal requires searching, weighing, measuring, and editing many database rows, the habit fades quickly.",
          "A photo journal lowers the starting cost. You capture the plate, add a short note if needed, review the estimate, and save the entry.",
        ],
      },
      {
        heading: "Photos preserve context",
        paragraphs: [
          "A meal photo records details that a text entry often loses: portion balance, plate composition, sauces, sides, and whether the meal was snack-sized or full-sized.",
          "That context is useful even when calorie estimates are approximate. Looking back at the journal can reveal patterns in meal timing, protein intake, and repeat foods.",
        ],
      },
      {
        heading: "A journal should feel calm",
        paragraphs: [
          "LogMyPlate is designed around a calm review flow. The app shows calories, macros, items, and weekly rhythm without making every meal feel like a spreadsheet.",
          "For most users, that is the difference between trying a tracker and actually keeping a tracker.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is a photo food journal private?",
        answer:
          "Meal photos are personal data. LogMyPlate's privacy policy explains when photos are sent for AI analysis, when they may be stored with meal logs, and how deletion works.",
      },
      {
        question: "Do I need to write long notes?",
        answer:
          "No. Short notes are enough when the photo needs context, such as the dish name or a visible ingredient that may be ambiguous.",
      },
    ],
  },
  {
    slug: "calorie-tracker-without-barcodes",
    title: "How to track calories without barcodes",
    description:
      "A guide to tracking calories for meals without labels, barcodes, or packaged nutrition facts.",
    summary:
      "Most real meals do not have barcodes. Photo-based tracking helps with home-cooked and restaurant plates.",
    category: "Calorie tracking",
    readTime: "4 min read",
    accent: "#efbd44",
    keywords: [
      "calorie tracker without barcode",
      "no barcode calorie tracker",
      "photo meal tracker",
      "AI calorie app",
    ],
    sections: [
      {
        heading: "Barcodes solve only one part of food tracking",
        paragraphs: [
          "Barcode scanning is useful for packaged food. It is less useful for a plate of rice, dal, roti, salad, eggs, dosa, pasta, or a restaurant meal.",
          "If the food was cooked at home or served without a label, the tracker needs a different input. A photo gives the app a visual record of the actual meal.",
        ],
      },
      {
        heading: "Use the estimate as a starting point",
        paragraphs: [
          "A photo-based tracker estimates the visible food items and portions. You then review the output and correct the items or serving sizes before saving.",
          "This keeps tracking fast while still leaving control with the user. The best workflow is not blind automation; it is scan, review, and save.",
        ],
      },
      {
        heading: "When barcodes are still useful",
        paragraphs: [
          "Packaged food labels are often more precise than AI estimates. If a food has a label and you need precision, use the label as the source of truth.",
          "LogMyPlate focuses on the harder case: real plates, mixed meals, and foods that do not arrive with nutrition facts.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I track restaurant food without a barcode?",
        answer:
          "Yes. A clear photo plus a short note about the dish can help the app estimate the meal, though restaurant recipes vary widely.",
      },
      {
        question: "Are barcode trackers more accurate?",
        answer:
          "For packaged food with a correct label, yes. For home-cooked or mixed meals, a reviewed photo estimate may be more practical.",
      },
    ],
  },
  {
    slug: "meal-photo-tips",
    title: "How to take better meal photos for calorie tracking",
    description:
      "Simple meal photo tips that improve AI food recognition, portion estimation, and macro review.",
    summary:
      "Better lighting, full-plate framing, and short notes can make AI calorie estimates easier to review.",
    category: "Photo tips",
    readTime: "3 min read",
    accent: "#70caa3",
    keywords: [
      "meal photo tips",
      "food photo calorie tracker",
      "AI food recognition tips",
      "photo calorie estimate",
    ],
    sections: [
      {
        heading: "Show the full plate",
        paragraphs: [
          "Keep the whole plate or bowl in frame. Cropped images make it harder to estimate portion size and can hide sides or toppings.",
          "If you are eating multiple bowls or plates, include them in one clear photo when possible, or scan them separately if they are separate meals.",
        ],
      },
      {
        heading: "Use normal lighting",
        paragraphs: [
          "Bright, natural light helps the AI identify food texture and color. Very dark photos, flash glare, or heavy filters can reduce recognition quality.",
          "You do not need a staged food photo. A simple overhead or slight-angle photo is usually enough.",
        ],
      },
      {
        heading: "Add a short note when useful",
        paragraphs: [
          "Use notes for foods that look similar: 'misal pav', 'paneer bhurji', 'egg fried rice', 'sprouts chaat', or 'curd rice'.",
          "Notes should be factual and short. The goal is to disambiguate the visible food, not write a recipe.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need to photograph every ingredient?",
        answer:
          "No. Photograph the meal as eaten. If hidden ingredients affect calories a lot, mention them in the note or adjust the estimate during review.",
      },
      {
        question: "Can I upload a gallery photo?",
        answer:
          "Yes. LogMyPlate supports taking a photo or selecting a meal photo from the gallery.",
      },
    ],
  },
  {
    slug: "ai-calorie-tracker-for-weight-loss",
    title: "Using an AI calorie tracker for weight loss",
    description:
      "How to use AI calorie estimates safely for weight loss awareness without treating them as medical advice.",
    summary:
      "Weight loss tracking works best when the app is fast enough to use daily and honest about estimate limits.",
    category: "Weight goals",
    readTime: "5 min read",
    accent: "#efbd44",
    keywords: [
      "AI calorie tracker weight loss",
      "calorie deficit tracker",
      "photo food journal weight loss",
    ],
    sections: [
      {
        heading: "Use tracking to understand patterns",
        paragraphs: [
          "A calorie tracker can help you notice meal patterns: high-calorie snacks, low-protein days, repeated restaurant meals, or weekend changes.",
          "LogMyPlate turns each photo into a reviewed journal entry so the trend becomes visible without manual database work after every meal.",
        ],
      },
      {
        heading: "Set a realistic target",
        paragraphs: [
          "The app's target screen uses basic body details and activity level to estimate a daily calorie target. Treat that number as a starting point, not a prescription.",
          "If weight, activity, routine, or health status changes, update the target and consider professional advice for medical or aggressive goals.",
        ],
      },
      {
        heading: "Review, do not obsess",
        paragraphs: [
          "Photo estimates can be wrong. Review portions, correct obvious errors, and focus on weekly patterns rather than single-meal perfection.",
          "The healthiest use of a tracker is awareness and consistency. It should support decisions, not replace professional care.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can LogMyPlate guarantee weight loss?",
        answer:
          "No. The app provides tracking and estimates. Results depend on many factors including diet, activity, health, sleep, and consistency.",
      },
      {
        question: "Is this medical advice?",
        answer:
          "No. Calorie targets and AI estimates are informational and should not replace a doctor, dietitian, or other qualified professional.",
      },
    ],
  },
  {
    slug: "calorie-tracking-for-home-cooked-food",
    title: "Calorie tracking for home-cooked food",
    description:
      "How to log home-cooked meals when ingredients, oil, and portions change from kitchen to kitchen.",
    summary:
      "Home cooking is variable. A photo-first workflow makes logging possible without weighing every ingredient.",
    category: "Home cooking",
    readTime: "5 min read",
    accent: "#70caa3",
    keywords: [
      "home cooked food calorie tracker",
      "homemade food calories",
      "AI home food tracker",
    ],
    sections: [
      {
        heading: "Home food is not one fixed database entry",
        paragraphs: [
          "One family's poha, dal, sabzi, chicken curry, or khichdi may be very different from another family's version. Oil, nuts, sugar, coconut, and portion size change the numbers.",
          "A single generic database entry can hide those differences. A photo gives a better starting point because it reflects the actual serving.",
        ],
      },
      {
        heading: "Use notes for invisible calories",
        paragraphs: [
          "The AI can analyze visible food, but it cannot reliably see hidden oil or sugar. If the preparation matters, add a short note such as 'less oil', 'with ghee', or 'sweetened'.",
          "Then review the estimate and adjust items or portions before saving.",
        ],
      },
      {
        heading: "Repeat meals become easier",
        paragraphs: [
          "Most people eat repeat meals. Once you understand the rough calorie range of common home plates, future reviews become quicker.",
          "The goal is not perfect recipe accounting. It is a useful, repeatable journal of what you actually ate.",
        ],
      },
    ],
    faqs: [
      {
        question: "Should I enter recipes manually?",
        answer:
          "Manual recipes can be more precise, but they take time. Photo tracking is useful when you want a faster daily habit.",
      },
      {
        question: "Can hidden oil affect calories?",
        answer:
          "Yes. Hidden fats and sugars can change the estimate. Add a note or edit the result when you know the preparation.",
      },
    ],
  },
  {
    slug: "macro-tracking-with-food-photos",
    title: "Macro tracking with food photos",
    description:
      "How photo-based meal logging estimates protein, carbs, and fat alongside calories.",
    summary:
      "Calories show energy. Macros explain where that energy comes from: protein, carbs, and fat.",
    category: "Macros",
    readTime: "4 min read",
    accent: "#ff7e78",
    keywords: [
      "macro tracker",
      "protein carbs fat tracker",
      "AI macro tracker",
      "photo macro tracker",
    ],
    sections: [
      {
        heading: "Macros make the meal more understandable",
        paragraphs: [
          "Two meals can have the same calories and feel very different. Protein, carbs, and fat help explain fullness, energy, and meal balance.",
          "LogMyPlate estimates macros for the whole meal and for individual items, then shows the split in a reviewable format.",
        ],
      },
      {
        heading: "Protein is often the missing signal",
        paragraphs: [
          "Many users want to know whether a meal is protein-light or carb-heavy. The macro view helps spot that quickly.",
          "If the app estimates a meal as low protein, you can use that as a planning signal for later meals, while remembering the values are approximate.",
        ],
      },
      {
        heading: "Review unusual meals carefully",
        paragraphs: [
          "Sauces, fried foods, sweets, and mixed dishes can be harder to estimate from a photo. Review macro-heavy items more carefully before saving.",
          "For sports nutrition or clinical targets, use professional guidance and verified nutrition data where precision matters.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does LogMyPlate track protein?",
        answer:
          "Yes. The app estimates protein along with calories, carbs, and fat for the meal and its items.",
      },
      {
        question: "Are macros exact?",
        answer:
          "No. They are AI estimates based on the photo and note. Review and edit the result before saving.",
      },
    ],
  },
  {
    slug: "calorie-estimate-vs-nutrition-label",
    title: "AI calorie estimate vs nutrition label: when to trust each",
    description:
      "When to use an AI calorie estimate, when to trust a nutrition label, and how to combine both responsibly.",
    summary:
      "Nutrition labels are best for packaged food. AI estimates are practical for unlabeled meals.",
    category: "Accuracy",
    readTime: "4 min read",
    accent: "#efbd44",
    keywords: ["AI calorie estimate", "nutrition label calories", "calorie tracking accuracy"],
    sections: [
      {
        heading: "Labels are strongest for packaged food",
        paragraphs: [
          "When a packaged food has a correct nutrition label, that label is usually the best source for calories and macros.",
          "The challenge is that many meals people eat every day are not packaged. A home plate or restaurant serving does not come with a reliable label.",
        ],
      },
      {
        heading: "AI estimates fill the unlabeled gap",
        paragraphs: [
          "AI estimates are useful when the alternative is not tracking at all. They provide a structured starting point from a photo.",
          "The right workflow is to review the estimate, correct obvious mistakes, and save it as an approximate journal entry.",
        ],
      },
      {
        heading: "Use precision where it matters",
        paragraphs: [
          "If a medical condition requires exact nutrition values, do not rely only on photo estimates. Use verified labels, weighed portions, and professional guidance.",
          "For general awareness, consistency and honest review are usually more useful than chasing perfect numbers.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is AI more accurate than a label?",
        answer:
          "Usually no for packaged food. AI is most useful for meals without labels or barcodes.",
      },
      {
        question: "Can I edit AI estimates?",
        answer:
          "Yes. LogMyPlate is built around reviewing and correcting the estimate before saving.",
      },
    ],
  },
  {
    slug: "best-calorie-tracker-for-indian-food",
    title: "What to look for in a calorie tracker for Indian food",
    description:
      "Key features to look for when choosing a calorie tracker for Indian meals, home cooking, and mixed plates.",
    summary:
      "A good Indian food calorie tracker should handle photos, portions, notes, macros, and review before saving.",
    category: "Buying guide",
    readTime: "5 min read",
    accent: "#70caa3",
    keywords: ["best calorie tracker Indian food", "Indian calorie app", "food tracker for India"],
    sections: [
      {
        heading: "Photo input matters",
        paragraphs: [
          "Indian meals are often mixed, homemade, and unlabeled. A tracker that depends only on search and barcodes can feel slow.",
          "Photo input lets users log a plate as served, including sides and portions that may be hard to describe manually.",
        ],
      },
      {
        heading: "Review controls matter even more",
        paragraphs: [
          "A tracker should not hide the AI result. Users need to see the item list, grams, portions, calories, and macros before saving.",
          "LogMyPlate is built around that review step because food recognition and portion estimation can be wrong.",
        ],
      },
      {
        heading: "Privacy and deletion should be clear",
        paragraphs: [
          "Meal photos and health targets are sensitive. A production-ready app should explain what is collected, why it is collected, and how users can delete account data.",
          "Before installing any tracker, read the privacy policy and check whether the app uses ads, analytics, AI providers, or cloud storage.",
        ],
      },
    ],
    faqs: [
      {
        question: "What makes LogMyPlate different?",
        answer:
          "LogMyPlate focuses on photo-based meal logging, Indian-first recognition, editable estimates, macro summaries, and a simple journal.",
      },
      {
        question: "Can it rank first in app stores?",
        answer:
          "No page can guarantee rankings. Good metadata, helpful content, real screenshots, and a strong product improve discoverability over time.",
      },
    ],
  },
  {
    slug: "how-to-track-misal-pav-calories",
    title: "How to track misal pav calories with a photo",
    description:
      "A realistic example of tracking misal pav calories using a meal photo, food note, item review, and macro breakdown.",
    summary:
      "Misal pav is a perfect example of why photo review matters: farsan, pav, onions, gravy, and portions all change the estimate.",
    category: "Food examples",
    readTime: "4 min read",
    accent: "#ff7e78",
    keywords: ["misal pav calories", "track misal pav calories", "Indian snack calorie tracker"],
    sections: [
      {
        heading: "Why misal pav varies so much",
        paragraphs: [
          "Misal pav can be a light snack or a calorie-dense meal depending on farsan, oil, pav size, sprouts, gravy, and toppings.",
          "A generic database entry rarely captures the exact plate. A photo helps identify the visible components and their relative portions.",
        ],
      },
      {
        heading: "What the app reviews",
        paragraphs: [
          "A LogMyPlate scan may split the meal into items such as misal, pav, chopped onion, lime, and visible toppings. The review screen shows calories and macros before saving.",
          "If the plate has extra farsan, buttered pav, or more gravy than visible, the user should update the estimate.",
        ],
      },
      {
        heading: "Use the result as a journal entry",
        paragraphs: [
          "The final number is still an estimate. Its value is that it captures the meal in context and adds it to the day's energy and macro mix.",
          "For repeat foods like misal pav, reviewed entries help users understand their usual range over time.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can the app identify misal pav?",
        answer:
          "A clear photo with a short note such as 'misal pav' gives the AI useful context for item detection and portion review.",
      },
      {
        question: "Why can two misal pav plates have different calories?",
        answer: "Portion size, farsan, oil, pav quantity, and toppings can vary widely.",
      },
    ],
  },
  {
    slug: "daily-calorie-target-bmi-guide",
    title: "Daily calorie targets and BMI: what the app estimates",
    description:
      "How LogMyPlate uses height, weight, age, body profile, activity, and goal to estimate a daily calorie target.",
    summary:
      "BMI and calorie targets are screening estimates, not medical advice. Here is how to use them responsibly.",
    category: "Targets",
    readTime: "5 min read",
    accent: "#efbd44",
    keywords: ["daily calorie target", "BMI calorie target", "calorie target app"],
    sections: [
      {
        heading: "What a daily target is for",
        paragraphs: [
          "A daily calorie target gives the journal a reference point. It helps users understand whether the day is trending below, near, or above the estimate.",
          "The target should be treated as a guide, not a command. Energy needs vary with body composition, activity, sleep, stress, and medical status.",
        ],
      },
      {
        heading: "What the app asks for",
        paragraphs: [
          "LogMyPlate can ask for height, weight, age, body profile, typical movement, and goal. It then estimates BMI category and a daily calorie target.",
          "Users can set it later, edit it later, or avoid using targets if they only want a food journal.",
        ],
      },
      {
        heading: "When to get professional help",
        paragraphs: [
          "BMI is a screening estimate and does not diagnose health. It can be misleading for athletes, pregnant users, older adults, and people with medical conditions.",
          "If nutrition targets affect health treatment, medication, pregnancy, recovery, or mental health, consult a qualified professional.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does LogMyPlate provide medical nutrition advice?",
        answer:
          "No. Targets are informational estimates and are not a substitute for medical or dietetic advice.",
      },
      {
        question: "Can I skip daily targets?",
        answer: "Yes. You can use the app as a meal journal without relying on a target.",
      },
    ],
  },
  {
    slug: "food-journal-for-busy-professionals",
    title: "A food journal for busy professionals",
    description:
      "How busy professionals can track meals faster with photo logging, quick review, and weekly summaries.",
    summary:
      "A tracker has to fit real life. Photo logging is designed for meals between work, travel, and routine changes.",
    category: "Habits",
    readTime: "4 min read",
    accent: "#70caa3",
    keywords: ["food journal for professionals", "quick calorie tracker", "busy meal tracking app"],
    sections: [
      {
        heading: "The tracker must be faster than the excuse",
        paragraphs: [
          "Busy users usually do not fail because they lack motivation. They fail because logging becomes another task competing with work, travel, and family.",
          "A photo-first journal cuts the workflow down to capture, note, review, and save.",
        ],
      },
      {
        heading: "Use weekly rhythm instead of daily guilt",
        paragraphs: [
          "Some days will be messy. The useful question is whether the weekly rhythm is improving.",
          "LogMyPlate shows daily energy, macro mix, and weekly activity so users can look at patterns instead of treating one meal as success or failure.",
        ],
      },
      {
        heading: "Make repeat meals work for you",
        paragraphs: [
          "Professionals often eat repeat breakfasts, office lunches, evening snacks, and takeout meals. Tracking those a few times builds awareness quickly.",
          "Once common meals are familiar, review becomes faster and less mentally expensive.",
        ],
      },
    ],
    faqs: [
      {
        question: "How long should a meal log take?",
        answer:
          "With a clear photo and short review, the goal is to keep logging quick enough to use every day.",
      },
      {
        question: "Can I add meals manually?",
        answer:
          "The app flow supports a journal-first approach. Manual options may be available depending on the app version.",
      },
    ],
  },
  {
    slug: "privacy-first-calorie-tracking",
    title: "Privacy-first questions to ask before using a calorie tracker",
    description:
      "What users should check before trusting a calorie tracker with meal photos, health targets, and account data.",
    summary:
      "Food data can be sensitive. Look for clear privacy, deletion, AI provider, ad, and storage disclosures.",
    category: "Privacy",
    readTime: "5 min read",
    accent: "#ff7e78",
    keywords: ["private calorie tracker", "food journal privacy", "meal photo privacy"],
    sections: [
      {
        heading: "Food photos can reveal personal information",
        paragraphs: [
          "A meal photo may show location context, routine, culture, health goals, or household details. That makes privacy important even when the app feels simple.",
          "Users should know whether photos are sent to a server, analyzed by AI providers, stored with meal logs, and deleted when the account is deleted.",
        ],
      },
      {
        heading: "Ads and third-party SDKs matter",
        paragraphs: [
          "If an app uses advertising, the ad network may collect device or advertising identifiers. That should be disclosed clearly in the privacy policy and app store privacy sections.",
          "LogMyPlate uses rewarded ads for additional scans, so the privacy page explains AdMob and links to app-ads.txt.",
        ],
      },
      {
        heading: "Deletion should be understandable",
        paragraphs: [
          "A production-ready tracker should explain account deletion, stored photos, journal data, session tokens, and support requests.",
          "Users should not have to guess how to remove stored app data.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does privacy matter for calorie tracking?",
        answer:
          "Yes. Meal photos, health targets, account details, and ad identifiers can all be sensitive depending on how they are collected and used.",
      },
      {
        question: "Where can I read LogMyPlate's disclosures?",
        answer: "The website includes Privacy Policy, Terms of Service, and Data Deletion pages.",
      },
    ],
  },
  {
    slug: "rewarded-ads-free-scans-calorie-tracker",
    title: "How rewarded ads work in a free calorie tracker",
    description:
      "Why LogMyPlate uses rewarded ads for extra scans and what users should know about AdMob.",
    summary:
      "Rewarded ads let users unlock extra scans without a subscription, while still requiring clear ad disclosures.",
    category: "Free scans",
    readTime: "4 min read",
    accent: "#efbd44",
    keywords: ["rewarded ads calorie tracker", "free calorie tracker ads", "AdMob app-ads.txt"],
    sections: [
      {
        heading: "Why rewarded ads exist",
        paragraphs: [
          "AI meal analysis has real server and model costs. Rewarded ads can give users extra scans without requiring a subscription at launch.",
          "The user chooses whether to watch an ad. If the ad completion is verified, the backend credits extra scan access.",
        ],
      },
      {
        heading: "What AdMob may collect",
        paragraphs: [
          "Rewarded ads are served by Google AdMob. Depending on device settings and ad personalization choices, Google may collect advertising identifiers and technical data for ad delivery.",
          "That is why the privacy policy includes an advertising section and why the site publishes app-ads.txt at the domain root.",
        ],
      },
      {
        heading: "What the app should not do",
        paragraphs: [
          "A rewarded ad should not hide essential safety information, force users to accept medical advice, or make calorie estimates look guaranteed.",
          "The experience should remain clear: AI estimates are approximate, ads unlock scans, and users can choose whether to watch.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is app-ads.txt already configured?",
        answer:
          "Yes. The website publishes the AdMob seller line at /app-ads.txt for the configured publisher ID.",
      },
      {
        question: "Do rewarded ads make the app less private?",
        answer:
          "Ads introduce third-party ad data practices. Users should review the privacy policy and device ad personalization settings.",
      },
    ],
  },
  {
    slug: "calorie-tracking-for-vegetarian-meals",
    title: "Calorie tracking for vegetarian meals",
    description:
      "How to use photo-based tracking for vegetarian plates, protein awareness, and mixed Indian meals.",
    summary:
      "Vegetarian meals can be balanced, carb-heavy, protein-light, or fat-rich. Macro review makes the pattern visible.",
    category: "Vegetarian",
    readTime: "4 min read",
    accent: "#70caa3",
    keywords: [
      "vegetarian calorie tracker",
      "vegetarian macro tracker",
      "Indian vegetarian food calories",
    ],
    sections: [
      {
        heading: "Vegetarian does not automatically mean low-calorie",
        paragraphs: [
          "Paneer, nuts, ghee, fried snacks, sweets, and creamy gravies can be calorie dense. Rice, roti, poha, upma, and pav can make some meals carb-led.",
          "Photo-based tracking helps users see the whole plate instead of guessing from the meal name alone.",
        ],
      },
      {
        heading: "Watch the protein signal",
        paragraphs: [
          "Many vegetarian users care about protein. LogMyPlate's macro view helps show whether the meal includes enough protein relative to carbs and fat.",
          "If a plate looks protein-light, users can plan the next meal with dal, curd, paneer, tofu, sprouts, eggs if they eat them, or other protein sources.",
        ],
      },
      {
        heading: "Review oils and toppings",
        paragraphs: [
          "Hidden oil, tadka, fried toppings, chutneys, and sweets can change calories. Add notes and edit estimates when you know the preparation.",
          "The tracker is most useful when users combine fast capture with honest review.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can LogMyPlate track vegetarian Indian meals?",
        answer:
          "Yes. The app is designed for Indian and global meals, including vegetarian plates and snacks.",
      },
      {
        question: "Does it show protein?",
        answer:
          "Yes. Protein is part of the macro estimate shown during review and in the journal.",
      },
    ],
  },
  {
    slug: "restaurant-meal-calorie-tracking",
    title: "How to track restaurant meals with a photo",
    description:
      "A practical approach to tracking restaurant meals when recipes, portions, and oil levels are unknown.",
    summary:
      "Restaurant meals vary. A photo estimate is a fast starting point, but review is especially important.",
    category: "Restaurant meals",
    readTime: "4 min read",
    accent: "#ff7e78",
    keywords: ["restaurant meal calorie tracker", "track restaurant calories", "photo calorie app"],
    sections: [
      {
        heading: "Restaurant food has hidden variables",
        paragraphs: [
          "Restaurant dishes may use more oil, butter, cream, sugar, or larger portions than homemade versions. Those details are not always visible.",
          "A photo can capture the portion and visible items, but users should adjust when they know the dish is richer than it looks.",
        ],
      },
      {
        heading: "Add a useful dish note",
        paragraphs: [
          "A short note such as 'butter chicken', 'veg thali', 'club sandwich', or 'large fries' helps the AI identify the plate more accurately.",
          "If the menu lists ingredients, use that context during review rather than trying to enter every ingredient manually.",
        ],
      },
      {
        heading: "Think in ranges",
        paragraphs: [
          "For restaurant meals, a realistic range is often more honest than a precise-looking number.",
          "Use LogMyPlate to maintain awareness and journal consistency, not to pretend restaurant nutrition can always be exact.",
        ],
      },
    ],
    faqs: [
      {
        question: "Are restaurant estimates less accurate?",
        answer:
          "They can be, because preparation details are often hidden. Review and edit the result before saving.",
      },
      {
        question: "Should I photograph the menu?",
        answer:
          "Use a meal photo for scanning. You can use menu details as a note if they help identify the food.",
      },
    ],
  },
  {
    slug: "meal-tracking-for-gym-and-fitness",
    title: "Meal tracking for gym and fitness goals",
    description:
      "How gym users can use LogMyPlate for calorie awareness, protein review, and weekly consistency.",
    summary:
      "Fitness tracking needs quick meal capture and protein visibility, not only total calories.",
    category: "Fitness",
    readTime: "5 min read",
    accent: "#efbd44",
    keywords: [
      "gym meal tracker",
      "fitness calorie tracker",
      "protein tracker app",
      "macro tracker",
    ],
    sections: [
      {
        heading: "Protein visibility is useful",
        paragraphs: [
          "Gym users often care about protein intake. A meal photo plus macro review can quickly show whether a plate is protein-led, carb-led, or fat-heavy.",
          "The app's macro mix is not a replacement for sports nutrition planning, but it gives a useful daily signal.",
        ],
      },
      {
        heading: "Track the ordinary meals too",
        paragraphs: [
          "Many people log protein shakes but skip lunch, snacks, and dinner. That creates a distorted view of the day.",
          "Photo logging makes it easier to capture normal meals, including office food, home food, and restaurant food.",
        ],
      },
      {
        heading: "Be precise when performance requires it",
        paragraphs: [
          "If you are preparing for a competition, managing a medical condition, or following a strict performance plan, use weighed portions and professional guidance.",
          "For everyday fitness, reviewed estimates can help build awareness and consistency.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can LogMyPlate replace a coach?",
        answer:
          "No. It is a tracking tool. Coaches, dietitians, and clinicians provide individualized guidance.",
      },
      {
        question: "Does the app show weekly trends?",
        answer: "Yes. The journal includes daily and weekly rhythm views to support consistency.",
      },
    ],
  },
];

export const getGuide = (slug: string): Guide | undefined =>
  guides.find((guide) => guide.slug === slug);

export const guideSlugs = guides.map((guide) => guide.slug);
