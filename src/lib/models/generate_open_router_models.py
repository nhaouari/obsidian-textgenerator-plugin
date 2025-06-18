#!/usr/bin/env python3
import json
import re
import subprocess
import sys
from pathlib import Path

# Providers to include
PROVIDERS = [
    "openai",
    "x-ai",
    "google",
    "anthropic",
    "mistralai",
    "deepseek",
    "meta-llama",
    "qwen",
    "amazon",
]

BASE_PATH = Path("src/lib/models/index_base.txt")
INDEX_PATH = Path("src/lib/models/index.ts")


def fetch_models():
    cmd = ["curl", "-s", "https://openrouter.ai/api/v1/models"]
    try:
        output = subprocess.check_output(cmd, text=True)
    except subprocess.CalledProcessError as e:
        print(f"Error fetching models: {e}", file=sys.stderr)
        sys.exit(1)
    # Normal float parsing
    return json.loads(output)


def transform_models(data):
    transformed = {}
    for model in data.get("data", []):
        arch = model.get("architecture", {})
        if "text" not in arch.get("input_modalities", []) or "text" not in arch.get(
            "output_modalities", []
        ):
            continue

        model_id = model.get("id")
        if not any(model_id.startswith(p) for p in PROVIDERS):
            continue

        pricing = model.get("pricing", {})
        prompt_price = float(pricing.get("prompt", 0.0))
        completion_price = float(pricing.get("completion", 0.0))

        top_p = model.get("top_provider") or {}
        max_comp = top_p.get("max_completion_tokens")
        max_tokens = (
            max_comp if max_comp is not None else model.get("context_length", 0)
        )

        transformed[model_id] = {
            "encoding": "cl100k_base",
            "prices": {
                "prompt": prompt_price,
                "completion": completion_price,
            },
            "maxTokens": max_tokens,
            "llm": ["OpenRouter Chat (Langchain)"],
            "order": -1,
        }

    # sort keys
    return {k: transformed[k] for k in sorted(transformed)}


def ts_literal(obj, indent=2):
    """
    Emit a TS literal:
     - dict  → { key: val, … }
     - list  → [ … ]
     - str   → "…"
     - bool  → true/false
     - int   → 123
     - float → no-scientific-number (see below)
    Only keys matching ^[_A-Za-z]\w*$ are unquoted.
    """
    # dict
    if isinstance(obj, dict):
        lines = []
        for k, v in obj.items():
            if re.match(r"^[_A-Za-z]\w*$", k):
                key = k
            else:
                key = f'"{k}"'
            lines.append(" " * indent + f"{key}: {ts_literal(v, indent + 2)},")
        return "{\n" + "\n".join(lines) + "\n" + " " * (indent - 2) + "}"

    # list
    if isinstance(obj, list):
        inner = ", ".join(ts_literal(x, indent) for x in obj)
        return f"[{inner}]"

    # string
    if isinstance(obj, str):
        return f'"{obj}"'

    # bool
    if isinstance(obj, bool):
        return "true" if obj else "false"

    # int
    if isinstance(obj, int):
        return str(obj)

    # float: use repr unless it has an 'e', then switch to fixed
    if isinstance(obj, float):
        s = repr(obj)
        if "e" in s or "E" in s:
            # fixed-point, no scientific
            s = format(obj, "f")
        return s

    raise TypeError(f"Cannot serialize {obj!r} ({type(obj)})")


def merge_existing(new_models_literal: str):
    # Remove first and last line of new_models_literal
    new_models_literal_parts = new_models_literal.split("\n")[1:-1]

    # Replace last line '},' with '}'
    new_models_literal_parts[-1] = new_models_literal_parts[-1].replace(",", "")
    new_models_literal = "\n".join(new_models_literal_parts)

    with open(BASE_PATH, "r") as f:
        existing = f.read()

    all_models = existing.format(OPEN_ROUTER_MODELS=new_models_literal)

    with open(INDEX_PATH, "w") as f:
        f.write(all_models)

    print(f"Merged {len(new_models_literal)} models into {INDEX_PATH}")


def main():
    data = fetch_models()
    out = transform_models(data)
    merge_existing(ts_literal(out))


if __name__ == "__main__":
    main()
