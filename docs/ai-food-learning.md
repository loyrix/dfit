# AI Food Learning

LogMyPlate uses a conservative learned-food layer so manual meal search can improve from confirmed
AI scans without exposing raw model guesses.

## Current Flow

- Seeded foods remain in `foods`, `food_aliases`, and `portion_conversions`.
- Raw AI output remains evidence in `ai_predictions` and `ai_predicted_items`.
- When an AI scan is confirmed, the API compares the original AI prediction with the confirmed
  item.
- When manual food search runs, the API also checks existing confirmed AI-scan meals for matching
  high-confidence predictions and materializes safe matches into the same catalog on demand.
- Only matched items with AI confidence `>= 0.90`, sane nutrition, sane portions, and non-generic
  names are promoted into the searchable `foods` catalog.
- Learned rows use the `LogMyPlate learned` food source and `logmyplate_learned` portion source.

## Guardrails

- Raw AI predictions are never searched directly.
- Historical mock-provider scans are ignored so demo data does not become a user-facing suggestion.
- Low-confidence predictions are ignored.
- Confirmed items whose names no longer match the AI prediction are ignored.
- Nutrition is converted into per-100g values from the confirmed grams and macro totals.
- If a matching food already exists, only aliases and missing portion conversions are added.

## Compatibility

This is backward compatible with existing mobile builds. The confirm-meal request and response do
not change. Existing `/v1/foods?q=` clients automatically see trusted learned foods because the
endpoint already searches the canonical food catalog.

## Future Improvements

- Add per-user learned foods before global promotion.
- Require multiple cross-user observations before promoting uncommon foods globally.
- Add admin review and suppression tools for learned catalog entries.
- Track observation counts and confidence distribution separately from the final food catalog.
