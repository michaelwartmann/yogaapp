"""Builds index.html (one self-contained page) from src/.
Usage: python3 build.py            -> index.html for GitHub Pages / any web host
       python3 build.py --fragment -> claude-artifact.html (body only, for publishing as a Claude artifact)
"""
import base64, pathlib, sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"

def b64(name):
    return base64.b64encode((ROOT / "media" / name).read_bytes()).decode()

def build_fragment():
    page = (SRC / "player.template.html").read_text(encoding="utf-8")
    for marker, file in [("ENGINE", "pose-engine.js"), ("POSES", "poses.js"), ("GENERATOR", "generator.js"),
                         ("BLOCKS", "blocks.js"), ("COMPOSER", "composer.js")]:
        page = page.replace(f"/*{marker}*/", (SRC / file).read_text(encoding="utf-8"))
    page = page.replace("__WEBM__", "data:video/webm;base64," + b64("keep-awake.webm"))
    page = page.replace("__MP4__", "data:video/mp4;base64," + b64("keep-awake.mp4"))
    return page

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f1eef4">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.4 system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
"""

if __name__ == "__main__":
    frag = build_fragment()
    if "--fragment" in sys.argv:
        (ROOT / "claude-artifact.html").write_text(frag, encoding="utf-8")
        print("wrote claude-artifact.html")
    else:
        (ROOT / "index.html").write_text(HEAD + frag + "\n</body>\n</html>\n", encoding="utf-8")
        print("wrote index.html")
