#!/usr/bin/env python3
"""
App Store Connect product-page marketing assets (Header + Search Results).

Source: store-assets/feature-graphic.png, scaled onto brand cream background.
Outputs PNG, no alpha (App Store-friendly).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "store-assets" / "feature-graphic.png"
OUT_DIR = ROOT / "store-assets" / "asc-marketing"

BG_TOP = (255, 252, 246)
BG_BOTTOM = (255, 235, 200)
ACCENT = (255, 210, 120)

OUTPUTS = {
    "asc-header-3840x1646.png": (3840, 1646),
    "asc-header-5244x2950.png": (5244, 2950),
    "asc-search-3840x2560.png": (3840, 2560),
    "asc-search-1920x1280.png": (1920, 1280),
}


def gradient_canvas(w: int, h: int) -> Image.Image:
    base = Image.new("RGB", (w, h), BG_TOP)
    overlay = Image.new("RGB", (w, h), BG_BOTTOM)
    mask = Image.linear_gradient("L").resize((w, h))
    mask = mask.filter(ImageFilter.GaussianBlur(radius=max(w, h) // 16))
    blended = Image.composite(overlay, base, mask)
    # soft blobs (match feature graphic warmth)
    for cx, cy, r, color in [
        (int(w * 0.72), int(h * 0.35), int(min(w, h) * 0.55), ACCENT),
        (int(w * 0.15), int(h * 0.2), int(min(w, h) * 0.35), (255, 248, 230)),
    ]:
        blob = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        bd = ImageDraw.Draw(blob)
        bd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, 85))
        blob = blob.filter(ImageFilter.GaussianBlur(radius=r // 3))
        blended = Image.alpha_composite(blended.convert("RGBA"), blob).convert("RGB")
    return blended


def flatten_rgb(img: Image.Image) -> Image.Image:
    if img.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", img.size, BG_TOP)
        if img.mode == "P":
            img = img.convert("RGBA")
        bg.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
        return bg
    return img.convert("RGB")


def paste_feature(canvas: Image.Image, feature: Image.Image, *, vertical: str = "center") -> Image.Image:
    w, h = canvas.size
    fw, fh = feature.size
    # Use most of the width on wide headers; slightly less on tall search assets.
    target_w = int(w * (0.88 if w / h > 1.8 else 0.78))
    scale = target_w / fw
    target_h = int(fh * scale)
    if target_h > int(h * 0.72):
        scale = (h * 0.72) / fh
        target_w, target_h = int(fw * scale), int(fh * scale)
    resized = feature.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = (w - target_w) // 2
    if vertical == "upper":
        y = int(h * 0.12)
    else:
        y = (h - target_h) // 2
    out = canvas.copy()
    out.paste(resized, (x, y))
    return out


def main() -> int:
    if not SRC.is_file():
        print(f"Missing {SRC}", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with Image.open(SRC) as raw:
        feature = flatten_rgb(raw.copy())

    report = []
    for name, (w, h) in OUTPUTS.items():
        canvas = gradient_canvas(w, h)
        vertical = "upper" if h / w > 0.55 else "center"
        out = paste_feature(canvas, feature, vertical=vertical)
        path = OUT_DIR / name
        out.save(path, format="PNG", optimize=True)
        report.append({"file": str(path.relative_to(ROOT)), "size": [w, h]})

    print(json.dumps(report, indent=2))
    print(f"\nWrote {len(report)} files to {OUT_DIR.relative_to(ROOT)}/")
    print("Header (ASC): asc-header-3840x1646.png or asc-header-5244x2950.png")
    print("Search: asc-search-3840x2560.png or asc-search-1920x1280.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())