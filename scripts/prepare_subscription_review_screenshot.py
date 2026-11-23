#!/usr/bin/env python3
"""
App Store Connect subscription *review* screenshot: 1290×2796 JPEG (iPhone 6.7").

Not the 1024×1024 promotional image. Edit PRICES below to match App Store Connect.

Usage: python3 scripts/prepare_subscription_review_screenshot.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "store-assets" / "subscription-review-1290x2796.jpg"
W, H = 1290, 2796
BG = (255, 250, 240)
CARD = (255, 249, 232)
INK = (42, 31, 10)
SOFT = (107, 90, 46)
YELLOW = (255, 190, 11)
YELLOW_SOFT = (255, 243, 205)

# Match your ASC subscription prices:
YEARLY = "$49.99"
MONTHLY = "$6.99"


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if p.is_file():
            return ImageFont.truetype(str(p), size=size)
    return ImageFont.load_default()


def rounded_rect(draw: ImageDraw.ImageDraw, xy: tuple, radius: int, fill: tuple) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # soft gradient blobs
    for cx, cy, r, color in [(W * 0.85, H * 0.08, 420, (255, 233, 168)), (W * 0.05, H * 0.25, 360, (255, 243, 205))]:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)

    cw, ch = 560, 680
    x0, y0 = (W - cw) // 2, (H - ch) // 2
    rounded_rect(draw, (x0, y0, x0 + cw, y0 + ch), 32, CARD)

    title = load_font(44, bold=True)
    body = load_font(24, bold=True)
    btn = load_font(26, bold=True)
    small = load_font(18, bold=True)

    lines = [
        ("Cook with Gio Pro", title, INK, 80),
        ("30× recipes, chats, meal plans & fridge scans every month.", body, SOFT, 140),
    ]
    ty = y0 + 100
    for text, font, color, spacing in lines:
        bbox = draw.multiline_textbbox((0, 0), text, font=font, spacing=6, align="center")
        tw = bbox[2] - bbox[0]
        draw.multiline_text(((W - tw) // 2, ty), text, font=font, fill=color, spacing=6, align="center")
        ty += spacing + (bbox[3] - bbox[1])

    by1 = y0 + 320
    rounded_rect(draw, (x0 + 40, by1, x0 + cw - 40, by1 + 72), 22, (255, 221, 102))
    yearly = f"Yearly — {YEARLY}"
    bb = draw.textbbox((0, 0), yearly, font=btn)
    draw.text((W // 2 - (bb[2] - bb[0]) // 2, by1 + 18), yearly, font=btn, fill=INK)

    by2 = by1 + 94
    rounded_rect(draw, (x0 + 40, by2, x0 + cw - 40, by2 + 68), 22, YELLOW_SOFT)
    monthly = f"Monthly — {MONTHLY}"
    bb = draw.textbbox((0, 0), monthly, font=btn)
    draw.text((W // 2 - (bb[2] - bb[0]) // 2, by2 + 16), monthly, font=btn, fill=INK)

    restore = "Restore purchases"
    bb = draw.textbbox((0, 0), restore, font=small)
    draw.text((W // 2 - (bb[2] - bb[0]) // 2, by2 + 110), restore, font=small, fill=SOFT)

    legal = "Auto-renewing subscription.\nCancel in Settings → Apple ID → Subscriptions."
    draw.multiline_text((x0 + 50, by2 + 160), legal, font=small, fill=SOFT, spacing=4, align="center")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, format="JPEG", quality=92, optimize=True)
    print(f"Wrote {OUT} ({W}×{H} JPEG)")
    print("Upload: App Store Connect → Subscription → Review Information → Screenshot")


if __name__ == "__main__":
    main()