from pathlib import Path
from PIL import Image
import shutil

input_dir = Path('imagens para preparar')
output_root = Path('imagens_preparadas_fix')
male_dir = output_root / 'male'
female_dir = output_root / 'female'
unico_dir = output_root / 'unico'

# reset output
shutil.rmtree(output_root, ignore_errors=True)
for d in (male_dir, female_dir, unico_dir):
    d.mkdir(parents=True, exist_ok=True)

counts = {'male':0,'female':0,'unico':0,'skipped':0}

for p in sorted(input_dir.iterdir()):
    if not p.is_file():
        continue
    if p.suffix.lower() not in ('.png','.jpg','.jpeg','.gif'):
        counts['skipped'] += 1
        continue
    try:
        with Image.open(p) as img:
            img = img.convert('RGBA')
            w,h = img.size
            half = w // 2
            left = img.crop((0,0,half,h))
            right = img.crop((half,0,w,h))

            def content_ratio(im):
                a = im.split()[3]
                data = a.getdata()
                cnt = sum(1 for v in data if v > 10)
                return cnt / (im.size[0]*im.size[1])

            lr = content_ratio(left)
            rr = content_ratio(right)

            # thresholds: consider content if more than 1.5% of pixels non-transparent
            if lr > 0.015 and rr > 0.015:
                left.save(male_dir / p.name)
                right.save(female_dir / p.name)
                counts['male'] += 1
                counts['female'] += 1
            else:
                # single sprite
                shutil.copy2(p, unico_dir / p.name)
                counts['unico'] += 1
    except Exception as e:
        print('Erro processando', p.name, e)
        counts['skipped'] += 1

print('Processamento concluído.')
print(f"Salvos: male={counts['male']}, female={counts['female']}, unico={counts['unico']}, pulados={counts['skipped']}")
