from pathlib import Path
from PIL import Image

d=Path("imagens para preparar")
print("File, W, H, R")
for p in sorted(d.iterdir()):
    if not p.is_file():
        continue
    if p.suffix.lower() not in (".png",".jpg",".jpeg",".gif"):
        continue
    try:
        with Image.open(p) as img:
            w,h=img.size
        ratio=round(w/max(h,1),2)
        print(f"{p.name}, {w}, {h}, {ratio}")
    except Exception as e:
        print(p.name, "ERROR", e)
