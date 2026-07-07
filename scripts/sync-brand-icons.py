#!/usr/bin/env python3
"""Regenerate favicons + logos from src/assets/logo-new.png."""
from pathlib import Path
import shutil

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Pillow required: pip install pillow")

root = Path(__file__).resolve().parent.parent
src = root / "src/assets/logo-new.png"
if not src.exists():
    print("sync-brand-icons: logo-new.png missing, skip")
    raise SystemExit(0)

public = root / "public"
runner_public = root / "runner-3d/frontend/public"
runner_public.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")
w, h = img.size
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
img = img.crop((left, top, left + side, top + side))

sizes = [16, 32, 48, 64, 128, 192, 512]
for s in sizes:
    img.resize((s, s), Image.Resampling.LANCZOS).save(
        public / f"favicon-{s}.png", "PNG", optimize=True
    )

icons_ico = [img.resize((s, s), Image.Resampling.LANCZOS) for s in (16, 32, 48, 64, 128, 256)]
icons_ico[0].save(
    public / "favicon.ico",
    format="ICO",
    sizes=[(s, s) for s in (16, 32, 48, 64, 128, 256)],
)

img.resize((192, 192), Image.Resampling.LANCZOS).save(public / "icon-192.png", "PNG", optimize=True)
img.resize((512, 512), Image.Resampling.LANCZOS).save(public / "icon-512.png", "PNG", optimize=True)
img.resize((72, 72), Image.Resampling.LANCZOS).save(public / "logo-nav.png", "PNG", optimize=True)
img.resize((512, 512), Image.Resampling.LANCZOS).save(public / "logo.png", "PNG", optimize=True)

for name in ["logo.png", "favicon.ico", "icon-192.png", "icon-512.png"] + [
    f"favicon-{s}.png" for s in sizes
]:
    shutil.copy(public / name, runner_public / name)

print("Brand icons synced.")
