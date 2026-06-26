import os
from pathlib import Path
from PIL import Image
import shutil

input_dir = Path('img/separar')
output_dir = Path('img')

name_map = {
    'Cardeais': 'cardeal',
    'Cavaleiros_Draconianos': 'cavaleiro_draconiano',
    'Cientistas': 'cientista',
    'Divas': 'diva',
    'Elementalistas': 'elementalista',
    'Engenheiros': 'engenheiro',
    'Executores': 'executor',
    'Falcões_do_Vento': 'falcao_do_vento',
    'Guardiões_Imperiais': 'guardiao_imperial',
    'Inquisidores': 'inquisidor',
    'Maestros': 'maestro',
    'Magus': 'magus',
    'Mandraques': 'mandraque'
}

print("Iniciando processamento das imagens...")

for p in sorted(input_dir.iterdir()):
    if not p.is_file() or p.suffix.lower() not in ('.png', '.jpg', '.jpeg'):
        continue
    
    if p.name.endswith('partyicn.png'):
        base = p.name.replace('partyicn.png', '')
        t = 'emblem'
    elif p.name.endswith('sprite.png'):
        base = p.name.replace('sprite.png', '')
        t = 'sprite'
    else:
        continue
        
    mapped_base = name_map.get(base, base.lower())
    
    if t == 'emblem':
        out_path = output_dir / f"emblema_{mapped_base}.png"
        shutil.copy2(p, out_path)
        print(f"Copiado emblema: {p.name} -> {out_path.name}")
    else:
        with Image.open(p) as img:
            img = img.convert('RGBA')
            w, h = img.size
            
            def content_ratio(im):
                a = im.split()[3]
                data = a.getdata()
                cnt = sum(1 for v in data if v > 10)
                return cnt / (im.size[0]*im.size[1])

            half = w // 2
            left = img.crop((0, 0, half, h))
            right = img.crop((half, 0, w, h))
            
            lr = content_ratio(left)
            rr = content_ratio(right)
            
            if mapped_base in ['diva', 'maestro']:
                if mapped_base == 'diva':
                    out_f = output_dir / f"{mapped_base}_f.png"
                    img.save(out_f)
                    print(f"Salvo sprite feminino inteiro: {p.name} -> {out_f.name}")
                else:
                    out_m = output_dir / f"{mapped_base}_m.png"
                    img.save(out_m)
                    print(f"Salvo sprite masculino inteiro: {p.name} -> {out_m.name}")
            else:
                if lr > 0.015 and rr > 0.015:
                    out_m = output_dir / f"{mapped_base}_m.png"
                    out_f = output_dir / f"{mapped_base}_f.png"
                    left.save(out_m)
                    right.save(out_f)
                    print(f"Dividido sprite: {p.name} -> {out_m.name} e {out_f.name}")
                elif lr > 0.015:
                    out_m = output_dir / f"{mapped_base}_m.png"
                    left.save(out_m)
                    print(f"Salvo sprite masculino: {p.name} -> {out_m.name}")
                elif rr > 0.015:
                    out_f = output_dir / f"{mapped_base}_f.png"
                    right.save(out_f)
                    print(f"Salvo sprite feminino: {p.name} -> {out_f.name}")
                else:
                    print(f"Ignorado {p.name} - sem conteúdo suficiente")

print("Processamento concluído!")
