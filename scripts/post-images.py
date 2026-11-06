"""
Prepara as imagens dos posts do blog (PERF-PLAN A9).

Para cada imagem de post (em blog-cms/static/images/posts e em
public/blog-data/images/posts):
  1. cria uma versão menor ao lado dela, "<nome>-800w.jpg" (800px de largura,
     até ~200 KB), usada no srcset para celulares;
  2. anota largura e altura em blog-cms/data/post-images.json.

O render hook do Hugo (blog-cms/layouts/_default/_markup/render-image.html)
lê esse arquivo para escrever width/height (evita o "pulo" da página, CLS)
e o srcset.

Quando usar: depois de adicionar ou trocar imagens de um post.
    python3 scripts/post-images.py

Precisa do Pillow (pip install pillow). Não é usado no build/CI: o
resultado (variantes + JSON) é versionado.
"""

import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
FOLDERS = [
    ROOT / "blog-cms/static/images/posts",
    ROOT / "public/blog-data/images/posts",
]
MANIFEST = ROOT / "blog-cms/data/post-images.json"
SMALL_WIDTH = 800
MAX_SMALL_BYTES = 200_000
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def save_small(image: Image.Image, target: Path) -> None:
    """Salva a versão de 800px baixando a qualidade até caber em ~200 KB."""
    height = round(image.height * SMALL_WIDTH / image.width)
    small = image.convert("RGB").resize((SMALL_WIDTH, height), Image.LANCZOS)
    for quality in (82, 76, 70, 64, 58):
        small.save(target, "JPEG", quality=quality, optimize=True, progressive=True)
        if target.stat().st_size <= MAX_SMALL_BYTES:
            break


def main() -> None:
    manifest = {}

    for folder in FOLDERS:
        for path in sorted(folder.rglob("*")):
            if path.suffix.lower() not in EXTENSIONS or path.stem.endswith("-800w"):
                continue

            # Caminho como aparece nos posts: /blog/images/posts/...
            post_path = "/blog/images/posts/" + path.relative_to(folder).as_posix()
            # As de blog-cms/static também aparecem copiadas em public/blog-data
            # (saída do Hugo): processa só a primeira
            if post_path in manifest:
                continue

            with Image.open(path) as opened:
                image = ImageOps.exif_transpose(opened)  # respeita a rotação da câmera
                entry = {"width": image.width, "height": image.height}

                if image.width > SMALL_WIDTH:
                    small_path = path.with_name(f"{path.stem}-800w.jpg")
                    if not small_path.exists():
                        save_small(image, small_path)
                    with Image.open(small_path) as small:
                        entry["small"] = {
                            "src": post_path.rsplit("/", 1)[0] + "/" + small_path.name,
                            "width": small.width,
                            "height": small.height,
                        }

            manifest[post_path] = entry
            print(post_path, entry["width"], "x", entry["height"])

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"\n{len(manifest)} imagens em {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
