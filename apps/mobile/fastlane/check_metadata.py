#!/usr/bin/env python3
"""Check store listing drafts against App Store and Google Play field limits.

Run from anywhere: python3 apps/mobile/fastlane/check_metadata.py
Exits non-zero if any field is over its limit, a keyword repeats a word from
the locale's name or subtitle, or a keyword appears in more than one locale.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent / "metadata"
IOS_LOCALES = ["en-US", "en-GB", "en-AU", "en-CA"]
IOS_LIMITS = {
    "name.txt": 30,
    "subtitle.txt": 30,
    "keywords.txt": 100,
    "promotional_text.txt": 170,
    "description.txt": 4000,
}
PLAY_LIMITS = {
    "title.txt": 30,
    "short_description.txt": 80,
    "full_description.txt": 4000,
}


def read(path: pathlib.Path) -> str:
    # fastlane strips the trailing newline; count what the store will see.
    return path.read_text(encoding="utf-8").rstrip("\n")


def words(text: str) -> set[str]:
    return {w for w in re.split(r"[^a-z0-9]+", text.lower()) if w}


failures: list[str] = []
rows: list[tuple[str, str, int, int]] = []

for locale in IOS_LOCALES:
    for name, limit in IOS_LIMITS.items():
        path = ROOT / locale / name
        if not path.exists():
            failures.append(f"missing {locale}/{name}")
            continue
        length = len(read(path))
        rows.append((f"iOS {locale}", name, length, limit))
        if length > limit:
            failures.append(f"{locale}/{name} is {length} chars (limit {limit})")

for name, limit in PLAY_LIMITS.items():
    path = ROOT / "android" / "en-US" / name
    if not path.exists():
        failures.append(f"missing android/en-US/{name}")
        continue
    length = len(read(path))
    rows.append(("Play en-US", name, length, limit))
    if length > limit:
        failures.append(f"android/en-US/{name} is {length} chars (limit {limit})")

seen: dict[str, str] = {}
for locale in IOS_LOCALES:
    keywords = [k for k in read(ROOT / locale / "keywords.txt").split(",") if k]
    if any(k != k.strip() for k in keywords):
        failures.append(f"{locale}/keywords.txt has spaces around commas (wastes characters)")
    title_words = words(read(ROOT / locale / "name.txt")) | words(read(ROOT / locale / "subtitle.txt"))
    for keyword in keywords:
        k = keyword.strip().lower()
        if words(k) & title_words:
            failures.append(f"{locale}: keyword '{k}' repeats a word from the name or subtitle")
        if k in seen:
            failures.append(f"keyword '{k}' is in both {seen[k]} and {locale}")
        seen[k] = locale

width = max(len(r[0]) for r in rows)
print(f"{'Listing'.ljust(width)}  {'Field'.ljust(24)}  Chars / Limit")
for listing, field, length, limit in rows:
    flag = "OK" if length <= limit else "OVER"
    print(f"{listing.ljust(width)}  {field.ljust(24)}  {length:>5} / {limit:<5} {flag}")
print()
print(f"Keyword sets: {len(seen)} keywords across {len(IOS_LOCALES)} locales, no cross-locale repeats" if not any("both" in f for f in failures) else "Keyword sets: repeats found")

if failures:
    print("\nFAILED:")
    for failure in failures:
        print(f"- {failure}")
    sys.exit(1)
print("All fields are within their limits.")
