# Store listing drafts (fastlane metadata)

Draft App Store and Google Play listings for LogMyPlate, positioned for a
global audience. **Nothing here is uploaded.** These files are for review;
they reach App Store Connect or Play Console only after Satyam approves and
someone runs fastlane `deliver` / `supply` (or pastes them in) by hand.

## Layout

| Path | Store | Fields |
|---|---|---|
| `metadata/en-US/`, `en-GB/`, `en-AU/`, `en-CA/` | App Store (fastlane `deliver`) | `name` (30), `subtitle` (30), `keywords` (100), `promotional_text` (170), `description` (4000), support/marketing/privacy URLs |
| `metadata/android/en-US/` | Google Play (fastlane `supply`) | `title` (30), `short_description` (80), `full_description` (4000) |

Release notes are left out on purpose: they belong to the next build, not the
listing.

## Positioning

- **Global first.** Every listing leads with burgers, salads, pasta and sushi,
  and each English locale uses local food (a full English and a meal deal in
  the UK, smashed avo and a laksa in Australia, poutine in Canada).
- **Indian food as one of many cuisines, plus a diaspora angle.** A short
  "Grew up on dal, roti and biryani?" paragraph speaks to Indian diaspora users
  in the US, UK, Canada and Australia, and each locale carries one diaspora
  keyword (`indian`, `desi`, `curry`, `biryani`).
- **Claims match the shipped app** (`apps/mobile/lib/src`): photo scan with an
  optional note, gallery upload, barcode scan, text-only logging, AI
  nutritionist chat, calorie and macro targets, editable estimates, streaks with
  bonus scans, weekly journal, free daily scans, and Premium with more scans,
  more chats and no ads. Not claimed: voice logging (marked "coming soon" in the
  app), fiber/sugar tracking (not shown in the app), health-app sync,
  reminders, specific accuracy figures, or fixed free-scan numbers (these are
  server-driven).

## Keywords

Apple indexes the name, subtitle and keywords together, so keywords never repeat
a word from that locale's name or subtitle. Each locale has its own set with no
keyword shared between locales, so the four English storefronts cover about 58
distinct terms instead of one repeated list.

| Locale | Name | Subtitle |
|---|---|---|
| en-US | LogMyPlate: AI Calorie Tracker | Food Photo Scanner & Macros |
| en-GB | LogMyPlate: AI Calorie Counter | Food Diary & Meal Photo Scan |
| en-AU | LogMyPlate: AI Calorie Counter | Macro Tracker & Food Scanner |
| en-CA | LogMyPlate: AI Calorie Tracker | Meal Scanner & Nutrition Coach |

Current live listing (read on 2026-11-02 via the App Store Connect and Play
Developer APIs, read-only): en-US only, name "LogMyPlate: AI Calorie Tracker",
subtitle "AI Nutrition Chat & Food Diary" (1.0.2 in review: "Calorie Counter &
Food Scanner"); Play short description "Calorie Counter & Food Scanner".

## Length check

Run `python3 apps/mobile/fastlane/check_metadata.py`. It fails if any field is
over its store limit, a keyword repeats a name/subtitle word, or a keyword is
used in two locales. Output for this draft:

```
Listing     Field                     Chars / Limit
iOS en-US   name.txt                     30 / 30    OK
iOS en-US   subtitle.txt                 27 / 30    OK
iOS en-US   keywords.txt                 93 / 100   OK
iOS en-US   promotional_text.txt        159 / 170   OK
iOS en-US   description.txt            2375 / 4000  OK
iOS en-GB   name.txt                     30 / 30    OK
iOS en-GB   subtitle.txt                 28 / 30    OK
iOS en-GB   keywords.txt                 96 / 100   OK
iOS en-GB   promotional_text.txt        168 / 170   OK
iOS en-GB   description.txt            2368 / 4000  OK
iOS en-AU   name.txt                     30 / 30    OK
iOS en-AU   subtitle.txt                 28 / 30    OK
iOS en-AU   keywords.txt                 94 / 100   OK
iOS en-AU   promotional_text.txt        158 / 170   OK
iOS en-AU   description.txt            2351 / 4000  OK
iOS en-CA   name.txt                     30 / 30    OK
iOS en-CA   subtitle.txt                 30 / 30    OK
iOS en-CA   keywords.txt                 90 / 100   OK
iOS en-CA   promotional_text.txt        160 / 170   OK
iOS en-CA   description.txt            2367 / 4000  OK
Play en-US  title.txt                    30 / 30    OK
Play en-US  short_description.txt        72 / 80    OK
Play en-US  full_description.txt       2375 / 4000  OK

Keyword sets: 58 keywords across 4 locales, no cross-locale repeats
All fields are within their limits.
```

## Screenshots

See [SCREENSHOT_BRIEF.md](SCREENSHOT_BRIEF.md) for the first three screenshots
and their captions.

## Uploading later (after approval only)

The en-GB, en-AU and en-CA App Store locales don't exist yet; adding them is
part of the upload. A fastlane upload would look like:

```sh
cd apps/mobile
fastlane deliver --skip_binary_upload --skip_screenshots --metadata_path fastlane/metadata
fastlane supply --skip_upload_apk --skip_upload_aab --skip_upload_images --skip_upload_screenshots --metadata_path fastlane/metadata/android
```

Both need write-scoped keys (App Manager in App Store Connect, "Manage store
presence" in Play). The current growth keys are read-only by design.
