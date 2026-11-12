"""Copy the files served by the browser into the build directory."""

from pathlib import Path
from shutil import copy2, copytree


def main():
    root = Path(__file__).resolve().parent
    dist = root / 'dist'
    css = dist / 'css'
    css.mkdir(parents=True, exist_ok=True)

    for page in root.glob('*.html'):
        copy2(page, dist)
    for stylesheet in ('style.css', 'statistics.css'):
        copy2(root / 'css' / stylesheet, css)
    for folder in ('js', 'assets'):
        copytree(root / folder, dist / folder, dirs_exist_ok=True)


if __name__ == '__main__':
    main()
