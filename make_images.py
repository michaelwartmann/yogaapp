"""Packs media/poses/<pose-id>.webp into pose-images.js (window.YogaPoseImages), so the pictures work offline and inside one file."""
import base64, pathlib, sys
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
imgs = sorted((root / "media" / "poses").glob("*.webp"))
lines = [f'  "{p.stem}": "data:image/webp;base64,{base64.b64encode(p.read_bytes()).decode()}",' for p in imgs]
(root / ("src/pose-images.js" if (root / "src").exists() else "pose-images.js")).write_text(
    "// Reference pictures for tricky poses (two views), generated from prompts; one entry per pose id.\n"
    "(function (root) {\n  root.YogaPoseImages = {\n" + "\n".join(lines) + "\n  };\n})(typeof window !== \"undefined\" ? window : globalThis);\n", encoding="utf-8")
print(len(imgs), "pictures")
