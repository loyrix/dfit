/**
 * Food page data for /calories/[slug].
 *
 * Every macro figure here is copied from the production `foods` table, and every
 * portion weight from `portion_conversions` (learned values, confidence >= 0.90).
 * Nothing is estimated. If you add a food, take the numbers from the database —
 * do not reason them out.
 *
 * Portions are hand-curated (D-007): `portion_conversions` is an append-only log
 * of AI-learned observations, so 19% of food/unit groups hold conflicting gram
 * values. Roti alone has eight values for "1 roti" between 40g and 180g. Feeding
 * that table straight into a generator would publish "1 roti = 481 calories".
 * The curated set below picks defensible representative sizes and the page states
 * the full observed range openly — which is more useful than the fake precision
 * every competing page offers.
 */

export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
};

export type Portion = { label: string; grams: number; note?: string };
export type Faq = { question: string; answer: string };
export type ComparisonItem = { slug: string; grams: number; label: string };

export type FoodPage = {
  slug: string;
  name: string;
  /** "indian" ranks fast and uncontested; "global" signals breadth. */
  tier: "indian" | "global";
  aka: string[];
  title: string;
  description: string;
  intro: string[];
  per100g: Macros;
  portions: Portion[];
  observedRange: string;
  portionHonesty: string[];
  whatChangesIt: { heading: string; body: string }[];
  macroContext: string[];
  comparison: { heading: string; intro: string; items: ComparisonItem[]; footnote: string };
  faqs: Faq[];
  related: string[];
};

export const foodDataUpdated = "2026-08-18";

/** Scales per-100g macros to a portion. One rounding rule, applied everywhere. */
export const scale = (per100g: Macros, grams: number): Macros => {
  const f = grams / 100;
  const r1 = (n: number) => Math.round(n * f * 10) / 10;
  return {
    calories: Math.round(per100g.calories * f),
    protein: r1(per100g.protein),
    carbs: r1(per100g.carbs),
    fat: r1(per100g.fat),
    fiber: per100g.fiber === undefined ? undefined : r1(per100g.fiber),
    sodium: per100g.sodium === undefined ? undefined : Math.round(per100g.sodium * f),
  };
};

export const foods: FoodPage[] = [
  {
    slug: "roti",
    name: "Roti",
    tier: "indian",
    aka: ["chapati", "phulka", "chapathi"],
    title: "Calories in Roti (Chapati) — Per Roti, Not Per 100g",
    description:
      "A medium roti is about 160 calories. Calories, protein and fibre for small, medium and large rotis — in the sizes people actually make them.",
    intro: [
      "Nobody weighs a roti. That is the whole problem with looking this up.",
      "Most nutrition sites answer “calories in roti” with a per-100-gram figure. A roti is not 100 grams, and the roti made at home is not the roti served at a restaurant. The number you actually want depends on the tawa it came off.",
      "So here is roti at the sizes people really make it.",
    ],
    per100g: { calories: 267, protein: 8.7, carbs: 53.3, fat: 2.7, fiber: 9.7, sodium: 317 },
    portions: [
      { label: "1 small roti", grams: 40, note: "thali size, or a thin phulka" },
      { label: "1 medium roti", grams: 60, note: "the most common size we see" },
      { label: "1 large tawa roti", grams: 90, note: "thick, or a full-tawa roti" },
      { label: "2 medium rotis", grams: 120 },
    ],
    observedRange:
      "Across real meals logged in LogMyPlate, a single roti has ranged from about 40 g to 180 g.",
    portionHonesty: [
      "We could give you one number and call it “a roti”. Most sites do. But a fourfold weight range is a fourfold calorie range — roughly 107 calories at the small end and over 480 at the large.",
      "That spread is not sloppy data. It is real. A thin phulka in a Gujarati thali and a thick tandoori roti are both honestly called “one roti”.",
      "Pick the row that looks like what is on your plate. If you are unsure, the medium row is the size we see most often.",
    ],
    whatChangesIt: [
      {
        heading: "Ghee or oil brushed on top",
        body: "A teaspoon of ghee is about 5 g of pure fat, so roughly 45 calories. Most home kitchens use less than that per roti; restaurants generally use more.",
      },
      {
        heading: "Thickness, not width",
        body: "A 6-inch roti rolled thick can outweigh an 8-inch one rolled thin. Weight tracks thickness far more closely than diameter, which is why eyeballing the width misleads people.",
      },
      {
        heading: "The flour",
        body: "These figures are for standard whole wheat atta, which is where the fibre comes from. Maida rotis carry noticeably less.",
      },
    ],
    macroContext: [
      "The carbohydrate is the headline, but fibre is the part most people miss: a medium roti carries about 5.8 g, a meaningful share of a day's fibre from a single item.",
      "Protein is present but modest. Roti is not where the protein in a thali comes from — that is the dal, the curd or the paneer.",
    ],
    comparison: {
      heading: "Roti vs rice",
      intro:
        "The most common question we get from people tracking Indian food is whether to eat roti or rice. Here is what a typical serving of each actually carries.",
      items: [
        { slug: "roti", grams: 60, label: "1 medium roti" },
        { slug: "roti", grams: 120, label: "2 medium rotis" },
        { slug: "rice", grams: 180, label: "1 cup cooked rice" },
      ],
      footnote:
        "Two medium rotis and a cup of rice land in similar territory for calories. The rotis bring noticeably more fibre and protein; the rice brings very little of either. Neither is a wrong choice — and what goes on top of them matters more than which one you pick.",
    },
    faqs: [
      {
        question: "How many calories are in 2 rotis?",
        answer:
          "Two medium rotis (about 120 g together) come to roughly 320 calories, with about 10.4 g of protein and 11.6 g of fibre. If your rotis are on the smaller side, around 40 g each, two of them is closer to 214 calories.",
      },
      {
        question: "Does roti have more protein than rice?",
        answer:
          "Yes, and by more than the raw numbers suggest. A 60 g roti carries about 5.2 g of protein and a 180 g cup of cooked rice about 5.0 g — but the roti gets there in a third of the weight, and brings around 5.8 g of fibre where the rice brings 0.7 g.",
      },
      {
        question: "Why does every website give a different number for roti?",
        answer:
          "Because they are answering a different question. Most publish a per-100-gram figure from a food composition table and leave you to guess what your roti weighs. We show the sizes instead, and tell you the range we actually observe.",
      },
    ],
    related: ["rice", "dal", "paneer", "idli"],
  },
  {
    slug: "dal",
    name: "Dal",
    tier: "indian",
    aka: ["daal", "dal tadka", "toor dal", "moong dal", "lentil curry"],
    title: "Calories in Dal — Per Katori, Not Per 100g",
    description:
      "A standard katori of dal is about 150 calories with 9 g of protein. Calories, protein and fibre for a small katori, a standard katori and a full bowl.",
    intro: [
      "Dal is the most-logged food in LogMyPlate, and one of the hardest to pin down — because “one katori” means something different in every house.",
      "It is also where most of the protein in a vegetarian thali actually comes from, which makes getting the portion right worth a minute of your attention.",
    ],
    per100g: { calories: 100, protein: 6, carbs: 14, fat: 3, fiber: 4, sodium: 250 },
    portions: [
      { label: "1 small katori", grams: 120 },
      { label: "1 standard katori", grams: 150, note: "the most common size we see" },
      { label: "1 large katori", grams: 180 },
      { label: "1 full bowl", grams: 200 },
    ],
    observedRange:
      "Across real meals logged in LogMyPlate, a serving of dal has ranged from about 120 g to 375 g.",
    portionHonesty: [
      "A katori is not a standard measure. The steel katori in one kitchen holds 120 g of dal; in another it holds 225 g. Both are honestly “one katori”.",
      "Because dal is close to 100 calories per 100 g, the arithmetic is unusually easy: the grams and the calories are roughly the same number. A 150 g katori is about 150 calories.",
    ],
    whatChangesIt: [
      {
        heading: "The tadka",
        body: "A teaspoon of ghee or oil is about 5 g of fat, so roughly 45 calories on top of the figures below. A generous restaurant tadka can be two or three times that.",
      },
      {
        heading: "How thin you keep it",
        body: "A watery dal and a thick one are the same food at different concentrations. A thin dal carries fewer calories per katori simply because more of the katori is water.",
      },
      {
        heading: "Dal makhani is a different food",
        body: "These figures are for home-style toor or moong dal with a light tadka. Dal makhani is built on butter and cream and should be logged separately rather than treated as dal.",
      },
    ],
    macroContext: [
      "About 9 g of protein and 6 g of fibre in a standard katori. In a vegetarian thali this is usually the single biggest protein contributor on the plate.",
      "Dal is also where a lot of a meal's sodium sits, though that depends entirely on how it was salted.",
    ],
    comparison: {
      heading: "Where the protein in a veg thali actually comes from",
      intro:
        "Indian vegetarian food makes protein hard to see, so people assume it is not there. It usually is — here is where.",
      items: [
        { slug: "dal", grams: 150, label: "1 katori dal" },
        { slug: "paneer", grams: 75, label: "1 piece paneer" },
        { slug: "roti", grams: 60, label: "1 medium roti" },
      ],
      footnote:
        "A katori of dal and a piece of paneer carry similar protein for very different calories — the paneer is denser in both. A thali with dal, two rotis and some curd gets you a long way without any single item doing all the work.",
    },
    faqs: [
      {
        question: "How much protein is in one katori of dal?",
        answer:
          "About 9 g in a standard 150 g katori, alongside roughly 6 g of fibre. A large 180 g katori is closer to 10.8 g of protein.",
      },
      {
        question: "Does dal makhani have the same calories?",
        answer:
          "No. These figures are for home-style toor or moong dal with a light tadka. Dal makhani is made with butter and cream and carries considerably more, so it is worth logging as its own dish.",
      },
      {
        question: "Does the tadka change the number much?",
        answer:
          "Enough to matter. A teaspoon of ghee is about 5 g of pure fat, roughly 45 calories, which is nearly a third again on top of a small katori. It is the single biggest variable in home-cooked dal.",
      },
    ],
    related: ["roti", "rice", "paneer", "idli"],
  },
  {
    slug: "rice",
    name: "Cooked rice",
    tier: "global",
    aka: ["chawal", "steamed rice", "white rice", "boiled rice"],
    title: "Calories in Cooked Rice — Per Katori, Cup and Plate",
    description:
      "A katori of cooked rice is about 210 calories. Per-portion calories and macros, plus the raw-versus-cooked mistake that throws most people off.",
    intro: [
      "Rice is the food people most often log wrongly, and almost always for the same reason: they use the raw weight.",
      "Rice roughly triples in weight as it cooks. 100 g of raw rice becomes around 300 g on the plate. Every figure on this page is for cooked rice, which is what you actually eat.",
    ],
    per100g: { calories: 140, protein: 2.8, carbs: 30.1, fat: 0.5, fiber: 0.4 },
    portions: [
      { label: "1 katori / small cup", grams: 150 },
      { label: "1 cup", grams: 180, note: "the most common size we see" },
      { label: "1 bowl", grams: 200 },
      { label: "1 plate serving", grams: 250 },
    ],
    observedRange:
      "Across real meals logged in LogMyPlate, a serving of cooked rice has ranged from about 100 g to 320 g.",
    portionHonesty: [
      "Rice spreads out on a plate, which makes it unusually easy to underestimate. A plate serving that looks like “some rice” is often 250 g — closer to two katoris than one.",
      "If you are going to weigh one thing on your plate occasionally to calibrate your eye, rice is the one worth weighing.",
    ],
    whatChangesIt: [
      {
        heading: "Raw versus cooked weight",
        body: "This is the big one. Rice absorbs water as it cooks and roughly triples in weight. Logging 100 g of raw rice as 100 g of cooked rice understates it by about three times.",
      },
      {
        heading: "What is mixed into it",
        body: "Jeera rice, pulao, lemon rice and biryani are separate dishes carrying oil, ghee or meat. Log them as themselves, not as plain rice.",
      },
      {
        heading: "The variety",
        body: "Different rices differ, though less than people expect. In our own database basmati sits around 120 calories per 100 g cooked against 140 for plain cooked rice — a real difference, but a small one next to portion size.",
      },
    ],
    macroContext: [
      "Rice is almost entirely carbohydrate, with very little fibre or protein. That is not a criticism; it is what makes it a base rather than a centrepiece.",
      "Because rice carries so little protein or fibre, what you put on top of it is where nearly all the rest of the meal's nutrition comes from.",
    ],
    comparison: {
      heading: "Rice vs roti, at a realistic serving",
      intro:
        "Both are the base of the plate. They behave quite differently once you look past calories.",
      items: [
        { slug: "rice", grams: 180, label: "1 cup cooked rice" },
        { slug: "roti", grams: 120, label: "2 medium rotis" },
        { slug: "rice", grams: 250, label: "1 plate serving of rice" },
      ],
      footnote:
        "A cup of rice and two rotis are in similar calorie territory, but the rotis carry roughly eight times the fibre and twice the protein. Move to a full plate serving of rice and it overtakes both. Portion size decides this comparison far more than the choice of grain.",
    },
    faqs: [
      {
        question: "Is this raw or cooked rice?",
        answer:
          "Cooked. Every figure on this page is for rice as it appears on your plate. Rice roughly triples in weight during cooking, so 100 g raw becomes about 300 g cooked.",
      },
      {
        question: "How many calories in 1 katori of rice?",
        answer:
          "A 150 g katori of cooked rice is about 210 calories, with roughly 4.2 g of protein and 45 g of carbohydrate.",
      },
      {
        question: "Does basmati rice have fewer calories?",
        answer:
          "Slightly. In our database cooked basmati sits around 120 calories per 100 g against 140 for plain cooked rice. Real, but small enough that the size of your serving matters considerably more than the variety.",
      },
    ],
    related: ["roti", "dal", "idli", "paneer"],
  },
  {
    slug: "paneer",
    name: "Paneer",
    tier: "indian",
    aka: ["cottage cheese", "indian cheese"],
    title: "Calories and Protein in Paneer — Per Piece and Per 100g",
    description:
      "100 g of paneer carries 265 calories and 18.3 g of protein. Per-piece figures, and how paneer compares with dal as a protein source.",
    intro: [
      "Paneer is the food people reach for when they want protein without meat, and it genuinely delivers: 18.3 g per 100 g puts it ahead of most vegetarian options.",
      "It is also calorie-dense, because the protein and the fat arrive together. That is not a warning — it is simply what paneer is, and it explains why 100 g of paneer carries more than twice the calories of 100 g of dal despite both being “the protein”.",
    ],
    per100g: { calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8, fiber: 0, sodium: 22 },
    portions: [
      { label: "1 piece", grams: 75, note: "the size we see most often" },
      { label: "100 g", grams: 100, note: "the standard reference weight" },
      { label: "2 pieces", grams: 150 },
      { label: "A generous serving", grams: 200 },
    ],
    observedRange:
      "Logged portions cluster around a 75 g piece, though paneer is usually eaten as part of a dish rather than on its own.",
    portionHonesty: [
      "Paneer is rarely eaten plain, which makes it harder to portion than dal or rice. What lands on your plate is usually paneer in a gravy, and the gravy carries its own calories.",
      "If you are logging paneer butter masala or shahi paneer, log the dish. These figures are for the paneer itself.",
    ],
    whatChangesIt: [
      {
        heading: "The gravy it arrives in",
        body: "Paneer butter masala and shahi paneer are built on cream, butter and cashew. The paneer may be a minority of the calories in the bowl. Log the dish, not the cubes.",
      },
      {
        heading: "Fried versus fresh",
        body: "Pan-frying or deep-frying paneer before it goes into a dish adds oil that the cubes hold onto. Fresh paneer straight into a sabzi carries noticeably less.",
      },
      {
        heading: "Full-fat versus low-fat",
        body: "These figures are for standard full-fat paneer. Low-fat and toned-milk paneer carry less fat and therefore fewer calories, while keeping most of the protein.",
      },
    ],
    macroContext: [
      "18.3 g of protein per 100 g, with almost no carbohydrate. Among widely available vegetarian foods, very little matches that density.",
      "It carries no fibre at all, so paneer pairs naturally with dal or a vegetable sabzi rather than standing alone.",
    ],
    comparison: {
      heading: "Paneer vs dal for protein, at similar calories",
      intro:
        "Comparing per 100 g flatters paneer. Comparing at similar calories is the fairer question.",
      items: [
        { slug: "paneer", grams: 100, label: "100 g paneer" },
        { slug: "dal", grams: 200, label: "1 bowl dal" },
        { slug: "roti", grams: 90, label: "1 large roti" },
      ],
      footnote:
        "For roughly comparable calories, paneer delivers the most protein, dal brings fibre that paneer has none of, and roti sits behind both on protein while carrying the most fibre. Most thalis use all three, which is the actual answer.",
    },
    faqs: [
      {
        question: "How much protein is in 100 g of paneer?",
        answer:
          "About 18.3 g, along with 265 calories and 20.8 g of fat. A single 75 g piece carries roughly 13.7 g of protein.",
      },
      {
        question: "Is paneer or dal better for protein?",
        answer:
          "Paneer is denser — more protein per gram and per bite. Dal brings fibre that paneer has none of, and costs fewer calories for the same protein. Most Indian meals use both, and that combination works better than either alone.",
      },
      {
        question: "Does paneer in gravy have the same calories?",
        answer:
          "No. Paneer butter masala and similar dishes are built on cream and butter, so the gravy can carry more calories than the paneer does. Log the dish rather than the cubes.",
      },
    ],
    related: ["dal", "roti", "rice", "idli"],
  },
  {
    slug: "idli",
    name: "Idli",
    tier: "indian",
    aka: ["idly", "steamed rice cake"],
    title: "Calories in Idli — For 1, 2, 3 and 4 Idlis",
    description:
      "One idli is about 65 calories. Calories and macros for 1 to 4 idlis, plus why the sambar and chutney matter more than the idlis do.",
    intro: [
      "Idli is one of the few Indian foods that comes in a genuinely consistent unit. One idli is one idli, give or take, which makes it unusually easy to track.",
      "The catch is that almost nobody eats idlis alone — and on a typical plate, the accompaniments carry more calories than the idlis.",
    ],
    per100g: { calories: 130, protein: 4, carbs: 26, fat: 1, fiber: 2, sodium: 300 },
    portions: [
      { label: "1 idli", grams: 50 },
      { label: "2 idlis", grams: 100, note: "the usual serving" },
      { label: "3 idlis", grams: 150 },
      { label: "4 idlis", grams: 200 },
    ],
    observedRange:
      "Logged idlis cluster tightly around 50 g each — one of the most consistent portions in our database.",
    portionHonesty: [
      "Standard idlis are close enough to 50 g that counting them works. That is rare, and it is why this page counts pieces instead of grams.",
      "The exception is the thatte idli, the large plate-sized Karnataka style, which can be two to three times a standard idli on its own.",
    ],
    whatChangesIt: [
      {
        heading: "The chutney, more than anything",
        body: "Coconut chutney is largely coconut and oil. A generous serving alongside two idlis can carry more calories than both idlis together. It is worth logging separately.",
      },
      {
        heading: "Sambar",
        body: "Sambar is mostly dal and vegetables and is a genuine contributor of protein and fibre. Also worth logging as its own item rather than folding into the idlis.",
      },
      {
        heading: "Steamed, not fried",
        body: "Idli is steamed, so it carries about 0.5 g of fat per piece. Almost everything else on the plate carries more.",
      },
    ],
    macroContext: [
      "About 65 calories and 2 g of protein per idli, with very little fat. As a breakfast base it is one of the lighter options in Indian cooking.",
      "Fermentation changes the texture and digestibility but does not move the calorie figure meaningfully.",
    ],
    comparison: {
      heading: "Idli vs other breakfast bases",
      intro: "What two idlis actually compare with, once you put them next to the alternatives.",
      items: [
        { slug: "idli", grams: 100, label: "2 idlis" },
        { slug: "roti", grams: 60, label: "1 medium roti" },
        { slug: "rice", grams: 150, label: "1 katori rice" },
      ],
      footnote:
        "Two idlis sit below a katori of rice and just under a medium roti, with very little fat. What you eat them with will move the total far more than the choice between them.",
    },
    faqs: [
      {
        question: "How many calories are in 2 idlis?",
        answer:
          "About 130 calories for two standard 50 g idlis, with roughly 4 g of protein and only 1 g of fat.",
      },
      {
        question: "Should I log sambar and chutney separately?",
        answer:
          "Yes, and it matters more than you would expect. A generous serving of coconut chutney can carry more calories than the idlis it comes with, and sambar adds real protein and fibre. Logging only the idlis misses most of the plate.",
      },
      {
        question: "Why is my idli bigger than 50 g?",
        answer:
          "You probably have a thatte idli, the large Karnataka plate-sized style, which can be two to three times a standard idli. Weighing one once will tell you what your local size is.",
      },
    ],
    related: ["dal", "rice", "roti", "paneer"],
  },
  {
    slug: "paratha",
    name: "Paratha",
    // Stored as GLOBAL in the foods table, which is a data artefact — paratha is
    // unambiguously Tier 1 for our purposes.
    tier: "indian",
    // Deliberately excludes "roti" and "chapati", which the database carries as
    // aliases. They are different foods (roti is 267 cal/100g at 2.7g fat) and
    // listing them here would be wrong on a public page and would cannibalise
    // /calories/roti. Flagged to the product session.
    aka: ["parantha", "lachha paratha", "aloo paratha", "plain paratha"],
    title: "Calories in Paratha — Per Paratha, Not Per 100g",
    description:
      "A plain paratha is about 320 calories, a large one closer to 450. Calories and macros by real paratha sizes, and why one paratha equals two rotis.",
    intro: [
      "A paratha is a roti with fat cooked into it, and that single difference is the whole story: 320 calories per 100 g against roti's 267, and more than four times the fat.",
      "The part that surprises people is not the per-gram figure though. It is the size. Parathas are heavier than rotis, and the ones on your plate probably weigh more than you would guess.",
    ],
    per100g: { calories: 320, protein: 8, carbs: 45, fat: 12 },
    portions: [
      { label: "1 plain paratha", grams: 100, note: "the lighter end of what we see" },
      { label: "1 large paratha", grams: 140, note: "the size most often logged" },
      { label: "2 parathas", grams: 200 },
      { label: "A heavy serving", grams: 300, note: "a stack of two or three large ones" },
    ],
    observedRange:
      "Across real meals logged in LogMyPlate, a paratha serving has ranged from about 100 g to 300 g.",
    portionHonesty: [
      "A paratha is not one size. A thin plain paratha at 100 g and a thick stuffed one at 140 g are both honestly \u201cone paratha\u201d, and that is the difference between 320 and 450 calories.",
      "The arithmetic in between is easy because paratha sits close to 320 per 100 g: a 130 g paratha is about 420 calories, a 110 g one about 350. Read your size off the table rather than taking a single figure from anywhere.",
      "Fibre and sodium are not recorded for paratha in our database, so those columns are blank rather than zero. A wholewheat paratha certainly carries fibre \u2014 we simply do not have a measured figure, and a made-up one would be worse than a blank.",
    ],
    whatChangesIt: [
      {
        heading: "How much ghee or oil it is cooked in",
        body: "This is what separates a paratha from a roti in the first place. A teaspoon of ghee is about 5 g of pure fat, roughly 45 calories, and most parathas take more than one. A dry-roasted paratha lands much closer to a roti.",
      },
      {
        heading: "The stuffing",
        body: "Aloo, gobi, paneer and mooli parathas each carry their own filling on top of the dough. These figures are for the paratha itself; a heavily stuffed paneer paratha is meaningfully more, and worth logging as its own dish.",
      },
      {
        heading: "Layers",
        body: "Lachha and Malabar-style parathas are laminated with fat between the layers, which is what makes them flaky. More layers means more fat, at the same diameter.",
      },
    ],
    macroContext: [
      "Twelve grams of fat per 100 g is the number that distinguishes paratha from every other Indian flatbread. It is not a reason to avoid it \u2014 it is simply why the same-sized piece of bread carries more energy.",
      "Protein is reasonable for a flatbread at 8 g per 100 g, slightly under roti's 8.7 g. The carbohydrate is comparable. Fat is where the difference sits.",
    ],
    comparison: {
      heading: "One paratha is two rotis",
      intro:
        "This is the most useful thing on this page. A plain paratha and two medium rotis carry almost exactly the same calories \u2014 for very different amounts of food.",
      items: [
        { slug: "paratha", grams: 100, label: "1 plain paratha" },
        { slug: "roti", grams: 120, label: "2 medium rotis" },
        { slug: "roti", grams: 60, label: "1 medium roti" },
      ],
      footnote:
        "Both come to about 320 calories. The two rotis give you twice the bread, considerably more fibre, and a third of the fat. If you want more food for the same number, that is the swap \u2014 and if you want the paratha, now you know what it costs, which was the point.",
    },
    faqs: [
      {
        question: "How many calories in one paratha?",
        answer:
          "About 320 for a plain 100 g paratha and around 450 for a large 140 g one. A 130 g paratha, which is a common size, works out to roughly 420 calories.",
      },
      {
        question: "Is paratha worse than roti?",
        answer:
          "It is not worse, it is denser. One plain paratha carries about the same calories as two medium rotis, mostly because of the ghee it is cooked in. Same food, different amount of energy for the same volume \u2014 useful to know, not something to avoid.",
      },
      {
        question: "Does an aloo paratha have more calories?",
        answer:
          "Yes. These figures are for the paratha itself. A potato, paneer or gobi filling adds its own calories on top, so a stuffed paratha is best logged as its own dish rather than scaled from a plain one.",
      },
    ],
    related: ["roti", "dal", "rice", "paneer"],
  },
];

export const foodSlugs = foods.map((food) => food.slug);
export const getFood = (slug: string): FoodPage | undefined =>
  foods.find((food) => food.slug === slug);
