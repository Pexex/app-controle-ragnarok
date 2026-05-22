from pathlib import Path
from PIL import Image
import shutil


def main():
    root = Path('.')
    input_dir = root / 'imagens para preparar'
    output_root = root / 'imagens_preparadas'
    male_dir = output_root / 'male'
    female_dir = output_root / 'female'
    unico_dir = output_root / 'unico'

    for d in (male_dir, female_dir, unico_dir):
        d.mkdir(parents=True, exist_ok=True)

    if not input_dir.exists():
        print(f"Pasta de entrada não encontrada: {input_dir.resolve()}")
        return

    counts = {'male': 0, 'female': 0, 'unico': 0, 'skipped': 0}

    for p in sorted(input_dir.iterdir()):
        if not p.is_file():
            continue
        if p.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.gif'):
            counts['skipped'] += 1
            continue

        try:
            with Image.open(p) as img:
                w, h = img.size

                # Heurística: se largura muito maior que a altura, considera-se duas sprites lado a lado
                if w / max(h, 1) >= 1.8:
                    mid = w // 2
                    left = img.crop((0, 0, mid, h))
                    right = img.crop((mid, 0, w, h))

                    left.save(male_dir / p.name)
                    right.save(female_dir / p.name)
                    counts['male'] += 1
                    counts['female'] += 1
                else:
                    # considera única
                    shutil.copy2(p, unico_dir / p.name)
                    counts['unico'] += 1
        except Exception as e:
            print(f"Erro processando {p.name}: {e}")
            counts['skipped'] += 1

    print('Processamento concluído.')
    print(f"Salvos: male={counts['male']}, female={counts['female']}, unico={counts['unico']}, pulados={counts['skipped']}")


if __name__ == '__main__':
    main()
