"""Builds index.html (one self-contained page) from src/, plus tree.html and the offline service worker sw.js.
Usage: python3 build.py            -> index.html for GitHub Pages / any web host
       python3 build.py --fragment -> claude-artifact.html (body only, for publishing as a Claude artifact)
"""
import base64, hashlib, pathlib, sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"

def b64(name):
    return base64.b64encode((ROOT / "media" / name).read_bytes()).decode()

def build_fragment():
    page = (SRC / "player.template.html").read_text(encoding="utf-8")
    for marker, file in [("ENGINE", "pose-engine.js"), ("POSES", "poses.js"), ("GENERATOR", "generator.js"),
                         ("BLOCKS", "blocks.js"), ("COMPOSER", "composer.js"), ("PROFILE", "profile.js"),
                         ("I18N", "i18n.js")]:
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
<title>Mat Cat Yoga</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/favicon-64.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Mat Cat">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.4 system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
"""

def build_tree():
    page = (SRC / "tree.template.html").read_text(encoding="utf-8")
    for marker, file in [("ENGINE", "pose-engine.js"), ("POSES", "poses.js"), ("GENERATOR", "generator.js"),
                         ("BLOCKS", "blocks.js"), ("COMPOSER", "composer.js"), ("PROFILE", "profile.js")]:
        page = page.replace(f"/*{marker}*/", (SRC / file).read_text(encoding="utf-8"))
    return page

# Registers the service worker so the app also opens without internet (GitHub Pages or any https host).
SW_REGISTER = """<script>
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
</script>
"""

if __name__ == "__main__":
    (ROOT / "tree.html").write_text(HEAD.replace("<title>Mat Cat Yoga</title>", "<title>Animal Tree · Mat Cat Yoga</title>") + build_tree() + "\n</body>\n</html>\n", encoding="utf-8")
    print("wrote tree.html")
    frag = build_fragment()
    if "--fragment" in sys.argv:
        (ROOT / "claude-artifact.html").write_text(frag, encoding="utf-8")
        print("wrote claude-artifact.html")
    else:
        (ROOT / "index.html").write_text(HEAD + frag + "\n" + SW_REGISTER + "</body>\n</html>\n", encoding="utf-8")
        print("wrote index.html")
    # new version id whenever the app changes, so phones pick up the update and drop the old copy
    h = hashlib.sha256()
    for f in ["index.html", "tree.html", "manifest.webmanifest"]:
        h.update((ROOT / f).read_bytes())
    (ROOT / "sw.js").write_text((ROOT / "sw.template.js").read_text(encoding="utf-8").replace("__VERSION__", h.hexdigest()[:10]), encoding="utf-8")
    print("wrote sw.js")
