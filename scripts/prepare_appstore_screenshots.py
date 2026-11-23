#!/usr/bin/env python3
"""
Prepare App Store Connect screenshots for fastlane deliver.

- Reads marketing captures from store-assets/screenshots/
- Flattens alpha onto #fffaf0 (App Store rejects PNG alpha)
- Resizes to exact slots when close; copies 1290×2796 as iPhone 6.7" Display
- Writes fastlane/screenshots/en-US/iPhone 6.7" Display-NN.png
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "store-assets" / "screenshots"
OUT_DIR = ROOT / "fastlane" / "screenshots" / "en-US"
FLATTEN_RGB = (255, 250, 240)  # app cream background

# App Store Connect slots → (width, height).
SCREENSHOT_SLOTS = {
    'iPhone 6.7" Display': (1290, 2796),
    'iPhone 6.1" Display': (1179, 2556),
    'iPad Pro (13-inch) Display': (2064, 2752),
}
OPTIONAL_SLOTS = {
    'iPhone 6.5" Display': (1284, 2778),
    'iPad Pro (12.9-inch) (3rd generation) Display': (2048, 2732),
}

SOURCE_ORDER = [
    ("1-recipe.png", "Recipe generation"),
    ("2-cook-mode.png", "Cook mode"),
    ("3-pantry.png", "Pantry & fridge scan"),
    ("4-profile.png", "Profile & progress"),
]


def flatten_and_fit(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    if img.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", img.size, FLATTEN_RGB)
        if img.mode == "P":
            img = img.convert("RGBA")
        bg.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")

    w, h = img.size
    if (w, h) == (target_w, target_h):
        return img

    # Center-crop to target aspect, then resize (for near-matching sources).
    target_ratio = target_w / target_h
    src_ratio = w / h
    if abs(src_ratio - target_ratio) > 0.02:
        if src_ratio > target_ratio:
            new_w = int(h * target_ratio)
            left = (w - new_w) // 2
            img = img.crop((left, 0, left + new_w, h))
        else:
            new_h = int(w / target_ratio)
            top = (h - new_h) // 2
            img = img.crop((0, top, w, top + new_h))

    return img.resize((target_w, target_h), Image.Resampling.LANCZOS)


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    report: dict = {"sources": [], "outputs": [], "missing_slots": list(OPTIONAL_SLOTS.keys())}

    if not SRC_DIR.is_dir():
        print(f"Missing {SRC_DIR}", file=sys.stderr)
        return 1

    for index, (filename, label) in enumerate(SOURCE_ORDER, start=1):
        path = SRC_DIR / filename
        entry = {"file": str(path.relative_to(ROOT)), "label": label}
        if not path.is_file():
            entry["error"] = "not found"
            report["sources"].append(entry)
            continue

        with Image.open(path) as im:
            has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
            entry["size"] = [im.size[0], im.size[1]]
            entry["had_alpha"] = has_alpha
            base = im.copy()
            for slot_name, (tw, th) in SCREENSHOT_SLOTS.items():
                out_im = flatten_and_fit(base.copy(), tw, th)
                out_name = f'{slot_name}-{index:02d}.png'
                out_path = OUT_DIR / out_name
                out_im.save(out_path, format="PNG", optimize=True)
                report["outputs"].append({"path": str(out_path.relative_to(ROOT)), "device": slot_name, "index": index})

        entry["outputs"] = [o["path"] for o in report["outputs"] if o["index"] == index]
        report["sources"].append(entry)

    print(json.dumps(report, indent=2))
    print(f"\nWrote {len(report['outputs'])} screenshots to {OUT_DIR.relative_to(ROOT)}/")
    if report["missing_slots"]:
        print("Not generated (provide art or run again after adding sources):")
        for name in report["missing_slots"]:
            w, h = OPTIONAL_SLOTS[name]
            print(f"  - {name} ({w}×{h})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())