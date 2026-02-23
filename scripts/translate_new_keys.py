#!/usr/bin/env python3
"""
Translate missing i18n keys from en.json into all locale files.

Uses Gemini 2.0 Flash to translate. Translates only keys that are
MISSING from each locale file (idempotent — safe to re-run).

Usage:
  python3 scripts/translate_new_keys.py

Set GEMINI_API_KEY in env or it will be read from ration-smart-backend/.env
"""

import json
import os
import sys
import time
from pathlib import Path

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
I18N_DIR = SCRIPT_DIR.parent / "src" / "i18n"
EN_FILE = I18N_DIR / "en.json"
BACKEND_ENV = SCRIPT_DIR.parent.parent / "ration-smart-backend" / ".env"

LOCALE_NAMES = {
    "hi":  "Hindi",
    "te":  "Telugu",
    "kn":  "Kannada",
    "mr":  "Marathi",
    "ta":  "Tamil",
    "gu":  "Gujarati",
    "ml":  "Malayalam",
    "pa":  "Punjabi",
    "bn":  "Bengali",
    "ur":  "Urdu",
    "or":  "Odia",
    "as":  "Assamese",
    "ne":  "Nepali",
    "vi":  "Vietnamese",
    "am":  "Amharic",
    "om":  "Oromo",
    "id":  "Indonesian",
    "fil": "Filipino (Tagalog)",
    "th":  "Thai",
    "ar":  "Arabic",
    "fr":  "French",
}

# --------------------------------------------------------------------------
# Load API key
# --------------------------------------------------------------------------
def load_api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key
    if BACKEND_ENV.exists():
        for line in BACKEND_ENV.read_text().splitlines():
            if line.startswith("GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip()
    print("ERROR: GEMINI_API_KEY not found. Set it in env or backend/.env")
    sys.exit(1)


# --------------------------------------------------------------------------
# Flatten / unflatten JSON (dot-notation keys)
# --------------------------------------------------------------------------
def flatten(d: dict, prefix: str = "") -> dict:
    out = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = v
    return out


def unflatten(flat: dict) -> dict:
    out: dict = {}
    for dotkey, val in flat.items():
        parts = dotkey.split(".")
        d = out
        for part in parts[:-1]:
            d = d.setdefault(part, {})
        d[parts[-1]] = val
    return out


def deep_merge(base: dict, patch: dict) -> dict:
    """Merge patch into base (in-place), returning base."""
    for k, v in patch.items():
        if k in base and isinstance(base[k], dict) and isinstance(v, dict):
            deep_merge(base[k], v)
        else:
            base[k] = v
    return base


# --------------------------------------------------------------------------
# Translate a batch of strings via Gemini
# --------------------------------------------------------------------------
def translate_batch(client, model: str, lang_name: str, strings: dict[str, str]) -> dict[str, str]:
    """
    strings: {dotkey: english_text}
    Returns {dotkey: translated_text}
    """
    items = "\n".join(f'  "{k}": {json.dumps(v)}' for k, v in strings.items())
    prompt = f"""You are a professional translator for an agricultural mobile app (RationSmart) that helps dairy farmers manage cattle feed and milk production.

Translate the following JSON key-value pairs from English to {lang_name}.
- Keep the JSON format exactly: return ONLY a JSON object with the same keys
- Preserve any placeholders like {{name}}, {{count}}, {{total}} verbatim
- Keep colons at end of strings (e.g. "Get started:" → translated with colon)
- Use natural, simple language appropriate for rural farmers
- Do not add explanations or markdown

English strings to translate:
{{
{items}
}}

Return only valid JSON."""

    from google.genai import types
    config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0)
    )
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=config,
    )
    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def main():
    api_key = load_api_key()

    from google import genai
    client = genai.Client(api_key=api_key)
    model = "gemini-2.5-flash"

    # Load English source
    en = json.loads(EN_FILE.read_text())
    en_flat = flatten(en)

    processed = 0
    for locale, lang_name in LOCALE_NAMES.items():
        locale_file = I18N_DIR / f"{locale}.json"
        if not locale_file.exists():
            print(f"  SKIP {locale}: file not found")
            continue

        locale_data = json.loads(locale_file.read_text())
        locale_flat = flatten(locale_data)

        # Find keys missing from this locale OR present but still in English
        # (untranslated placeholders — identical value to English source)
        # Skip keys where English IS the correct value (app.name, URLs, etc.)
        SKIP_TRANSLATION = {'app.name'}  # keys that should stay as-is
        missing = {
            k: v for k, v in en_flat.items()
            if k not in SKIP_TRANSLATION and (
                k not in locale_flat or locale_flat[k] == v
            )
        }

        if not missing:
            print(f"  OK   {locale} ({lang_name}): nothing to translate")
            continue

        print(f"  >>>  {locale} ({lang_name}): translating {len(missing)} key(s)...")
        for k in list(missing.keys())[:5]:
            print(f"         {k}: {missing[k][:60]}")
        if len(missing) > 5:
            print(f"         ... and {len(missing) - 5} more")

        # Translate in batches of 30 to stay within prompt limits
        BATCH = 30
        translated_flat: dict[str, str] = {}
        keys = list(missing.keys())
        for i in range(0, len(keys), BATCH):
            batch = {k: missing[k] for k in keys[i : i + BATCH]}
            try:
                result = translate_batch(client, model, lang_name, batch)
                translated_flat.update(result)
                if i + BATCH < len(keys):
                    time.sleep(0.5)  # brief pause between batches
            except Exception as e:
                print(f"    ERROR translating batch for {locale}: {e}")
                # Fall back to English for this batch
                translated_flat.update(batch)

        # Merge translations back into locale
        translated_nested = unflatten(translated_flat)
        deep_merge(locale_data, translated_nested)

        # Write back
        locale_file.write_text(
            json.dumps(locale_data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"  OK   {locale}: wrote {len(translated_flat)} translations")
        processed += 1
        time.sleep(0.3)  # be polite to the API

    print(f"\nDone. Updated {processed} locale file(s).")


if __name__ == "__main__":
    main()
