# DFit Product And Architecture Plan

Status: Draft for review  
Working name: DFit, expected to change  
Date: 2026-05-08  
Audience: Founder, engineering team, product/design reviewer, second-opinion LLM

## 1. Executive Summary

DFit should start as a camera-first nutrition journal for iOS and Android. The app should be global, but Indian-first in food understanding. The first product wedge is not a full calorie-tracking ecosystem. It is a premium, low-friction flow:

```txt
Open app
-> Take food photo
-> AI identifies visible foods and estimates portions
-> User reviews and corrects
-> Backend calculates nutrition from structured food data
-> Meal is saved
-> Today screen shows daily totals and premium meal cards
```

The first build should be real production code, not a fake prototype. The MVP should still be intentionally narrow so that accuracy, cost, architecture, and UI polish can be handled properly.

No user login should be required at launch. However, the backend should still create an anonymous profile so meals, corrections, scan cost, quota, and future analytics are stored from day one. Food images should not be stored.

## 2. Product Positioning

### Core Positioning

DFit is a premium AI food journal that understands Indian and global meals, with special care for Indian/home-cooked food.

### Target User

Initial users:

- People who want easy macro visibility without manual logging.
- Indian users and global Indian-diet users who eat home-cooked meals.
- Fitness users who care about calories, protein, and macro consistency.
- Busy users who want a clean daily journal, not a heavy health app.

### Product Promise

Take a photo. Correct quickly. Know what you ate.

### What DFit Should Not Feel Like

- Not a medical app.
- Not a shame-based calorie app.
- Not a text-heavy wellness essay.
- Not a generic calorie database UI.
- Not a cheap ad-first utility.

### Visual Feel

Luxury fitness, calm and premium. Minimal text, high visual quality, fast motion, tactile controls, strong light and dark themes.

## 3. MVP Scope

### Included In MVP

1. Welcome screen.
2. Anonymous guest identity.
3. Camera-based food capture.
4. AI analysis screen.
5. Review and correction screen.
6. Nutrition calculation.
7. Meal save.
8. Today screen with daily totals.
9. Premium meal cards grouped by day.
10. Meal detail screen.
11. Settings screen.
12. Light/dark theme switch.
13. Free scan quota and rewarded ad scan credits.
14. Backend storage in Supabase Postgres through our own API service.

### Optional But Recommended In MVP

Minimal target setup after the first successful meal, not before.

```txt
Set daily targets?
Calories
Protein
Carbs
Fat
Skip
```

This avoids onboarding friction while enabling macro progress bars when the user wants them. Body stats, goal calculation, activity level, and adaptive targets should wait for v2.

### Excluded From MVP

- Mandatory login.
- Full onboarding with age/height/weight/activity.
- Voice logging.
- Barcode scanning.
- Wearable sync.
- Full coach chat.
- Micronutrient insights.
- Social sharing.
- Meal planning.
- Restaurant database.
- Cloud image storage.
- Complex premium analytics.

## 4. User Flow

### First Launch

```txt
Welcome
-> Start scan
-> Camera permission
-> Camera
-> Confirm photo
-> Analyze
-> Review detected meal
-> Confirm meal
-> Today screen
```

### Returning User

```txt
App opens to Today
-> Tap floating camera action
-> Scan
-> Review
-> Confirm
-> Today updates
```

### Quota And Ads Flow

Recommended initial model:

```txt
Scan 1 per day: free, no ad
Scan 2 and 3 per day: rewarded ad before AI analysis
Launch cap: 3 scans/day total
Premium: configurable higher limit and no ads
```

The scan limit must be remote-configured, not hardcoded. If real ad revenue is healthy, increase ad-supported scans to 5 or 10 later.

### Why Ads Before AI Analysis

AI analysis has a real marginal cost. Rewarded ads should be shown before extra AI calls so revenue is earned before cost is incurred. Do not interrupt journal browsing with blocking ads. The journal should remain premium.

## 5. UX And Screen Plan

### 5.1 Welcome

Purpose: establish premium identity and get the user into the first scan.

Content should be short:

```txt
DFit
Food tracking, without the typing.
[Start scan]
```

No long feature explanation.

### 5.2 Camera

Purpose: capture a meal photo.

Requirements:

- Native camera quality.
- Flash toggle.
- Retake.
- Confirm.
- Clear privacy note in small text: "Photo is analyzed, not stored."
- No gallery import in the first cut unless easy.

### 5.3 Analyzing

Purpose: make waiting feel premium.

Requirements:

- Simple animation.
- No fake progress percentages.
- Copy examples: "Reading your plate", "Estimating portions", "Preparing your log".
- Timeout and retry handling.

### 5.4 Review Meal

This is the most important screen.

Example:

```txt
Detected meal

Dal
1 katori

Rice
1 bowl

Roti
2 pieces

Sabzi
1 katori

[Add item]
[Confirm meal]
```

Controls:

- Portion stepper.
- Unit picker.
- Delete item.
- Add item.
- Edit food name.
- Meal type selector: breakfast, lunch, snack, dinner.
- Subtle low-confidence cue when needed.

Avoid showing technical AI confidence numbers unless useful.

### 5.5 Today And Journal

After first meal, app should open here.

Top section:

```txt
Today
1,420 kcal
Protein 82g
Carbs 160g
Fat 42g
```

If targets are set:

```txt
480 kcal left
Protein 82 / 120g
Carbs 160 / 220g
Fat 42 / 65g
```

Journal cards grouped by day:

```txt
Lunch
Dal rice, 2 roti, sabzi
612 kcal
P 24g  C 88g  F 16g
Edited
```

Use premium meal cards, not a raw spreadsheet table.

### 5.6 Meal Detail

Shows item-level breakdown:

```txt
Lunch
612 kcal

Dal, 1 katori
180 kcal
P 9g  C 24g  F 5g

Rice, 1 bowl
210 kcal
P 4g  C 45g  F 1g
```

Allow edit/delete.

### 5.7 Settings

MVP settings:

- Theme: system/light/dark.
- Language/food names: auto, English, English + Hinglish.
- Daily targets.
- Privacy: food photos are not stored.
- Delete local/account data.
- App version.

## 6. Language And Locale Strategy

Do not ask for GPS location in MVP.

Use these signals:

1. Device locale and region.
2. App language setting.
3. Timezone.
4. Optional user preference.

If the device region is India, default food-name handling to English + Hinglish. Otherwise default to English. Hinglish should still work globally if the user types or corrects with those names.

Examples of alias handling:

```txt
roti / chapati / phulka
dal chawal / dal rice
sabzi / vegetable curry
dahi / curd / yogurt
paneer / cottage cheese
katori / bowl
```

## 7. AI And Nutrition Strategy

### Principle

AI should identify and estimate. The backend should calculate.

Do not use AI as the final authority for calories or macros.

### Flow

```txt
Mobile captures image
-> Mobile compresses image and strips metadata
-> API receives temporary image payload
-> API sends image to selected AI provider
-> AI returns structured detected foods and portions
-> API maps detected items to DFit food database
-> Nutrition engine calculates calories and macros
-> User reviews/corrects
-> API saves final meal and correction data
-> Image is discarded
```

### AI Output Schema

The AI should return compact structured JSON:

```json
{
  "meal_name": "Dal rice with roti and sabzi",
  "detected_language": "en-IN",
  "items": [
    {
      "name": "dal",
      "aliases": ["lentil curry"],
      "portion": {
        "quantity": 1,
        "unit": "katori",
        "estimated_grams": 180
      },
      "preparation": "home",
      "confidence": 0.82
    }
  ],
  "needs_user_review": true
}
```

The JSON should avoid verbose descriptions because output tokens dominate cost.

### Indian-First Portion Units

Support these from the start:

- gram
- ml
- piece
- serving
- bowl
- katori
- cup
- tablespoon
- teaspoon
- ladle
- roti
- idli
- dosa
- slice
- scoop
- small/medium/large

### Food Matching Strategy

Food matching should be layered:

1. Exact canonical food match.
2. Alias match.
3. Regional alias match.
4. Dish template match.
5. External food source lookup.
6. User correction/manual item.

Store every match with confidence and source.

## 8. Food Data Strategy

### Sources

Use a layered food data approach:

- DFit canonical food database.
- DFit Indian dish templates.
- Indian Food Composition Tables 2017 for Indian base foods.
- USDA FoodData Central for global/base foods.
- Open Food Facts for packaged foods later.
- User corrections and favorites.

### Indian Dish Templates

Initial seed list:

- roti
- chapati
- phulka
- paratha
- dal
- dal tadka
- dal makhani
- rice
- jeera rice
- curd rice
- khichdi
- poha
- upma
- idli
- dosa
- uttapam
- sambar
- chutney
- chole
- rajma
- paneer sabzi
- paneer bhurji
- chicken curry
- egg curry
- fish curry
- vegetable sabzi
- biryani
- pulao
- thali
- samosa
- pakora
- vada pav
- dosa/idli plate
- mithai/sweets as broad categories

### Source Reliability

USDA FoodData Central is public-domain and API-accessible. IFCT is the key Indian reference, but we should verify licensing and ingestion rights carefully before embedding a full derived dataset in production. Open Food Facts is useful for packaged foods, but its own docs warn that volunteered data may be inaccurate or incomplete; treat it as a source with confidence and provenance, not as truth.

## 9. AI Cost Model

All numbers below are estimates as of 2026-05-08 and must be rechecked before implementation. USD/INR reference used here: 1 USD = about 94.36 INR.

### Token Assumptions Per Scan

For a normal food photo:

- Compressed image suitable for plate understanding.
- Short system/developer prompt.
- Compact structured JSON output.
- No chain-of-thought.
- No long food explanations.

Example token ranges:

```txt
Input text tokens: 500 to 900
Image tokens: provider-specific
Output tokens: 350 to 700
```

### Candidate Models

| Provider | Model                 |                 Pricing Basis | Estimated Cost/Scan |  Images/USD | Images/INR | Notes                                                                   |
| -------- | --------------------- | ----------------------------: | ------------------: | ----------: | ---------: | ----------------------------------------------------------------------- |
| OpenAI   | gpt-5-nano            | $0.05/M input, $0.40/M output |   $0.00025-$0.00045 | 2,200-4,000 |      23-42 | Likely cost leader; quality must be tested.                             |
| OpenAI   | gpt-5.4-nano          | $0.20/M input, $1.25/M output |   $0.00085-$0.00130 |   770-1,175 |       8-12 | Strong current low-cost OpenAI candidate.                               |
| Google   | gemini-3.1-flash-lite | $0.25/M input, $1.50/M output |   $0.00095-$0.00160 |   625-1,050 |     6.6-11 | Strong multimodal candidate; likely good for Indian/global recognition. |
| OpenAI   | gpt-5.4-mini          | $0.75/M input, $4.50/M output |     $0.0030-$0.0050 |     200-330 |    2.1-3.5 | Use only for premium re-analysis or hard cases.                         |

### Cost Interpretation

At 3 scans/day, approximate AI cost per fully active free user:

```txt
gpt-5-nano:          INR 0.07 to 0.13 per day
gpt-5.4-nano:        INR 0.24 to 0.37 per day
gemini-3.1-flash-lite: INR 0.27 to 0.45 per day
```

This excludes API hosting, database, observability, payment fees, ad SDK overhead, retries, and failed scans.

### Recommended Cost Strategy

1. Architecture must be provider-agnostic.
2. Start with a feature-flagged provider selection.
3. Run a later AI benchmark with 50-100 Indian/global meal photos.
4. Compare cost, item detection accuracy, portion accuracy, correction rate, latency, JSON validity, and user trust.
5. Use cheaper model by default only if correction burden is acceptable.
6. Use stronger model only for premium, low-confidence, or retry flows.

### Ad Break-Even Logic

Rewarded ad revenue per impression:

```txt
revenue_per_ad_usd = eCPM_usd / 1000
```

Safe scan unlock condition:

```txt
revenue_per_ad_usd >= ai_cost_per_scan_usd + infra_buffer_usd
```

Example:

```txt
If AI + infra cost is $0.0012 per scan,
break-even rewarded eCPM is about $1.20.
```

This is why the scan cap should be remote-configured.

## 10. Monetization Strategy

### Free Tier

Recommended launch:

- 1 free scan/day without ads.
- Up to 2 additional scans/day through rewarded ads.
- Journal browsing remains free.
- Daily totals remain free.

### Premium Tier

Premium should feel like intelligence, not just "remove ads".

Potential premium features:

- Ad-free experience.
- Higher scan limit.
- Cloud sync and account backup.
- Weekly summaries.
- Protein intake insights.
- Macro profile.
- Micronutrient estimate profile.
- Food pattern flags.
- Favorites and repeat meals.
- Better re-analysis for uncertain meals.
- Export journal.
- Smart reminders.

### App Store And Play Store Billing

Digital premium features must use Apple/Google billing unless a specific regional exception applies. Avoid external checkout links inside the app until legal/store policy is reviewed.

## 11. Privacy And Safety

### Food Image Policy

Do not store food images.

Implementation:

```txt
Mobile strips metadata
-> sends image to API
-> API streams/sends to AI provider
-> API stores only structured result
-> API discards image bytes
```

Store:

- Image dimensions.
- Mime type.
- Scan timestamp.
- AI provider/model.
- Prompt/schema versions.
- Raw AI JSON.
- User corrections.
- Final calculated nutrition.

Do not store:

- Original image.
- EXIF metadata.
- Location data.

### Nutrition Disclaimer

DFit should include a clear disclaimer:

```txt
Nutrition estimates are approximate and not medical advice.
```

Avoid medical claims, diagnosis, or disease treatment language.

### Data Deletion

Even for anonymous users, provide a way to delete journal data from settings.

### Provider Terms

Use paid production tiers where submitted content is not used for provider training or product improvement. Verify each provider's current terms before launch.

## 12. Technical Architecture

### High-Level Architecture

```txt
Flutter mobile app
-> DFit API service
-> Supabase Auth for anonymous identity
-> Supabase Postgres
-> AI provider adapter
-> Food data provider/cache
-> Ad verification provider
-> Subscription provider
```

Mobile should not directly access Supabase tables for core product behavior. It should call the DFit API. This keeps business logic portable when moving from Supabase to AWS.

### Why Not Supabase Edge Functions

Avoiding Supabase Edge Functions reduces platform lock-in. Supabase is used as managed Postgres/Auth at the beginning, while application logic stays in our own API service.

### Recommended Backend Stack

- Fastify + TypeScript.
- Zod for runtime validation.
- OpenAPI generation.
- Drizzle ORM.
- Supabase Postgres.
- Supabase anonymous auth.
- Docker-ready API service.

Fastify is preferred over NestJS for MVP because it is leaner and gives enough structure without framework weight.

### Future Migration Path

```txt
Supabase Postgres
-> AWS RDS Postgres

Supabase Auth anonymous users
-> Cognito/custom auth or retained Supabase Auth

DFit API unchanged from mobile perspective
```

## 13. Monorepo Plan

Use Turborepo with pnpm at the root.

```txt
dfit/
  apps/
    mobile/
      Flutter iOS + Android app
    api/
      Fastify TypeScript API
    admin/
      Next.js + Tailwind admin, later

  packages/
    contracts/
      OpenAPI schemas, generated clients
    design-tokens/
      shared theme tokens for Flutter and web
    nutrition-core/
      nutrition math, portion conversion, food matching
    ai-core/
      AI provider interfaces, schemas, prompt versions
    test-fixtures/
      sample AI outputs, sample meals, expected nutrition totals
    config/
      shared lint/format/test config

  infra/
    db/
      migrations, seeds, RLS policies
    observability/
      dashboards, alert definitions, logging docs
```

### Flutter In Turborepo

Flutter does not consume TypeScript packages directly. Shared contracts should be generated:

```txt
Zod/OpenAPI schema
-> OpenAPI JSON
-> generated Dart API client
```

Design tokens should be exported as JSON:

```txt
design-tokens JSON
-> Flutter theme constants
-> Tailwind config for admin/web later
```

### Turbo Tasks

Examples:

```txt
turbo test
turbo lint
turbo typecheck
turbo gen:contracts
turbo db:migrate
turbo mobile:analyze
turbo mobile:test
```

## 14. Database Design

### Design Principle

The v1 frontend is simple, but the DB should support v2/v3 analytics without a rewrite.

Store structured events, predictions, corrections, final meals, summaries, and model metadata. Do not store images.

### Core Tables

#### identity

```txt
profiles
devices
sessions
consents
```

#### quotas and monetization

```txt
scan_credits
quota_events
ad_events
subscriptions
entitlements
```

#### scanning and AI

```txt
scan_sessions
ai_predictions
ai_predicted_items
ai_provider_runs
prompt_versions
schema_versions
```

#### food data

```txt
foods
food_aliases
food_sources
dish_templates
dish_template_items
portion_units
portion_conversions
nutrition_source_versions
```

#### meals and journal

```txt
meals
meal_items
nutrition_results
daily_summaries
weekly_summaries
```

#### analytics and improvement

```txt
user_corrections
food_match_events
pattern_flags
model_eval_cases
model_eval_results
feature_flags
```

### Important Fields

Every scan should record:

```txt
provider
model
prompt_version
schema_version
nutrition_source_version
input_token_estimate
output_token_estimate
estimated_cost_usd
latency_ms
success/failure
error_code
confidence
raw_ai_json
final_user_corrected_json
```

Every meal item should record:

```txt
food_id
display_name
source_name
source_food_id
quantity
unit
grams_estimated
calories
protein_g
carbs_g
fat_g
fiber_g
sugar_g
sodium_mg
user_edited
```

## 15. API Surface

### Mobile API Endpoints

Initial endpoints:

```txt
POST /v1/auth/anonymous
GET  /v1/me
GET  /v1/config

GET  /v1/journal/today
GET  /v1/journal?from=&to=
GET  /v1/meals/:id
POST /v1/meals
PATCH /v1/meals/:id
DELETE /v1/meals/:id

POST /v1/scans/prepare
POST /v1/scans/:id/analyze
POST /v1/scans/:id/confirm
POST /v1/scans/:id/cancel

POST /v1/ads/rewarded/verify
GET  /v1/quota

GET  /v1/foods/search?q=
POST /v1/targets
GET  /v1/targets
```

### Scan Flow API

```txt
POST /scans/prepare
-> creates scan session
-> checks quota
-> returns upload/analyze instructions

POST /scans/:id/analyze
-> accepts temporary image payload
-> calls AI provider
-> maps food candidates
-> returns review payload

POST /scans/:id/confirm
-> accepts corrected items
-> calculates final nutrition
-> saves meal
-> updates daily summary
```

### API Rules

- All request/response bodies validated with Zod.
- OpenAPI generated from source schemas.
- Dart client generated from OpenAPI.
- No raw provider JSON exposed directly to mobile.
- Provider-specific fields stored for debugging, but API returns stable DFit contract.

## 16. Testing And TDD Plan

### TDD Principle

Write tests first for domain and API behavior where mistakes cost money, corrupt data, or break user trust.

### Unit Tests

Must cover:

- Quota calculation.
- Rewarded ad credit granting.
- Daily scan reset by timezone.
- Portion unit conversion.
- Nutrition math.
- Food matching.
- Target progress calculation.
- Daily summary aggregation.
- AI schema parsing.
- Error handling for invalid AI JSON.

### API Tests

Must cover:

- Anonymous auth flow.
- Scan prepare with available quota.
- Scan prepare without quota.
- Rewarded ad credit flow.
- Analyze flow with mocked AI provider.
- Confirm meal flow.
- Meal edit/delete.
- Journal retrieval.
- RLS/access boundaries.

### Flutter Tests

Must cover:

- Welcome screen.
- Empty Today state.
- Review meal item editing.
- Confirm meal success state.
- Journal card rendering.
- Theme switch.
- Basic light/dark golden tests.

### AI Evaluation

This is not part of normal unit tests. It is a separate benchmark suite for later.

Initial eval categories:

- Indian thali.
- Dal rice.
- Roti sabzi.
- Paneer dish.
- Biryani.
- Idli/dosa/sambar.
- Poha/upma.
- Chole/rajma.
- Snacks.
- Mixed global plates.
- Bowls/salads.
- Restaurant meals.

Metrics:

- Item detection accuracy.
- Portion accuracy.
- Macro error after food mapping.
- JSON validity.
- Latency.
- Cost.
- User correction burden.

## 17. Implementation Phases

### Phase 0: Repo And Foundations

Deliverables:

- Turborepo scaffold.
- Flutter app scaffold.
- Fastify API scaffold.
- Supabase local/project setup.
- Drizzle migrations.
- Zod/OpenAPI contract generation.
- Dart API client generation.
- Design token package.
- CI basics.

### Phase 1: Domain Core

Deliverables:

- Nutrition core package.
- Portion units and conversions.
- Food aliases.
- Small seed food database.
- Daily summary calculation.
- Unit tests.

### Phase 2: Mobile Shell

Deliverables:

- App navigation.
- Light/dark theme.
- Welcome.
- Today empty state.
- Settings.
- Journal cards with API-backed data.

### Phase 3: Anonymous Identity And Journal

Deliverables:

- Anonymous profile creation.
- Device/session handling.
- Meal create/edit/delete.
- Today totals.
- Local resilience for poor network.

### Phase 4: Scan Flow

Deliverables:

- Camera capture.
- Image metadata stripping/compression.
- Scan prepare/analyze/confirm endpoints.
- Mock AI provider first.
- Real provider adapter behind feature flag.
- Review meal UI.

### Phase 5: Ads And Quota

Deliverables:

- Quota service.
- Rewarded ad verification.
- Scan credit ledger.
- Remote config for limits.
- Tests for abuse and edge cases.

### Phase 6: Store Readiness

Deliverables:

- Privacy policy.
- Nutrition disclaimer.
- App Store/Play Store metadata.
- Crash reporting.
- Production logging.
- Rate limits.
- Cost dashboard.
- Internal testing build.

## 18. Engineering Principles

### Boundaries

Keep clear boundaries:

```txt
UI
-> API client
-> API controllers
-> application services
-> domain logic
-> repositories
-> external providers
```

### Provider Interfaces

Define interfaces early:

```txt
AIProvider
FoodDataProvider
AdVerificationProvider
SubscriptionProvider
AuthProvider
Clock
CostEstimator
```

### No Lock-In Rule

The mobile app should depend on DFit contracts, not Supabase, Gemini, OpenAI, or AdMob directly except for necessary client SDKs like ads and camera.

### Cost Observability

Every AI call should write a cost estimate event. Build a simple internal dashboard before scale.

## 19. Open Decisions For Review

1. Should the default MVP AI model be gpt-5-nano, gpt-5.4-nano, or gemini-3.1-flash-lite?
2. Should image analysis use lower-resolution inputs first, then retry high-resolution only on low confidence?
3. Should target setup be manual-only in MVP, or skipped entirely until v2?
4. How strict should free scan caps be if rewarded ad fill fails?
5. Should anonymous user data expire after inactivity, or persist indefinitely until deleted?
6. How much IFCT data can be embedded directly after license review?
7. Should Open Food Facts be included in MVP or deferred to packaged-food/barcode v2?
8. Should local offline journal cache be built in v1 or after first backend flow works?

## 20. Recommended Decisions For Now

My recommended defaults:

1. Build the product around a provider-agnostic AI adapter.
2. Start implementation with a mocked AI provider and fixed food fixtures.
3. Use real AI only after the scan/review/confirm loop is working.
4. Benchmark gpt-5-nano, gpt-5.4-nano, and gemini-3.1-flash-lite later with real food photos.
5. Use Supabase Postgres/Auth, but keep all business logic in DFit API.
6. Do not use Supabase Edge Functions.
7. Do not store food images.
8. Use one focused Today screen with floating camera action, no bottom nav for MVP.
9. Use premium meal cards grouped by day.
10. Make targets optional after first meal.
11. Launch with 1 free scan/day plus rewarded-ad scan credits up to 3/day.
12. Make scan caps remote-configurable.

## 21. Source References

Current references used while drafting this plan:

- OpenAI pricing: https://openai.com/api/pricing/
- OpenAI gpt-5.4-nano model page: https://developers.openai.com/api/docs/models/gpt-5.4-nano/
- OpenAI gpt-5-nano model page: https://developers.openai.com/api/docs/models/gpt-5-nano/
- OpenAI image and vision token rules: https://developers.openai.com/api/docs/guides/images-vision
- Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini image token rules: https://ai.google.dev/gemini-api/docs/image-understanding
- Supabase anonymous sign-ins: https://supabase.com/docs/guides/auth/auth-anonymous
- AdMob rewarded ads: https://support.google.com/admob/answer/7372450
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play payments policy: https://support.google.com/googleplay/android-developer/answer/9858738
- USDA FoodData Central API: https://fdc.nal.usda.gov/api-guide
- Open Food Facts API docs: https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/
- IFCT 2017 reference listing: https://www.fao.org/food-composition/tables-and-databases/detail/%28country--date%29-title-9/en
- USD/INR reference used for rough calculations: https://twelvedata.com/markets/605080/forex/usd-inr/historical-data

## 22. Reviewer Prompt

Use this prompt when sharing with another LLM:

```txt
Review this DFit product and architecture plan as a senior product engineer and startup technical advisor.

Focus on:
1. MVP scope risk.
2. AI cost assumptions.
3. Indian/home-cooked food accuracy strategy.
4. Supabase-to-AWS migration readiness.
5. Database design gaps.
6. TDD and testing gaps.
7. App Store/Play Store policy risks.
8. Privacy and data retention risks.
9. UX flow friction.
10. Monetization weaknesses.

Do not rewrite the whole plan. Give prioritized issues, tradeoffs, and recommended changes.
```
