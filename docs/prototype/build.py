#!/usr/bin/env python3
"""
Setzt den Klick-Prototyp aus den Teildateien in src/ zusammen und bettet die
SVG-Assets der Seite als Data-URIs ein.

    python3 docs/prototype/build.py
    → docs/prototype/leo-faden.html            (vollständiges Dokument, lokal nutzbar)
    → <scratch>/leo-faden-artifact.html        (ohne Dokument-Hülle, für den Artifact-Upload;
                                                Pfad per Umgebungsvariable ARTIFACT_OUT)
"""
import base64, os, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = pathlib.Path(__file__).parent / "src"
ASSETS = {
    "__LEO__": "public/assets/leo.svg",
    "__LOGO__": "public/icons/fl_logo.svg",
    "__FINCONEXT__": "public/icons/finconext_logo.svg",
    "__ICON_FINANZEN__": "public/icons/icon_finanzen.svg",
    "__ICON_VERSICHERUNGEN__": "public/icons/icon_versicherungen.svg",
    "__ICON_STEUER__": "public/icons/icon_steuer.svg",
    "__ICON_RECHT__": "public/icons/icon_recht.svg",
    "__ICON_UHR__": "public/icons/time_icon.svg",
    "__ICON_STARBURST__": "public/icons/fazit-starburst.svg",
    "__LOGO_ICON__": "public/icons/fl-logo-icon.svg",
    "__AD_LB1__": "docs/prototype/assets/lb-kontora.svg",
    "__AD_LB2__": "docs/prototype/assets/lb-steuerfuchs.svg",
    "__AD_MR1__": "docs/prototype/assets/mr-pfotenschutz.svg",
    "__AD_MR2__": "docs/prototype/assets/mr-nordlicht.svg",
    "__AD_HP1__": "docs/prototype/assets/hp-baufix.svg",
    "__AD_HP2__": "docs/prototype/assets/hp-nordlicht.svg",
    "__AD_SK1__": "docs/prototype/assets/sk-kontora.svg",
    "__AD_SQ1__": "docs/prototype/assets/sq-steuerfuchs.svg",
    "__AD_SQ2__": "docs/prototype/assets/sq-nordlicht.svg",
    "__AD_MO1__": "docs/prototype/assets/mo-pfotenschutz.svg",
    "__AD_MO2__": "docs/prototype/assets/mo-steuerfuchs.svg",
}


def uri(rel):
    return "data:image/svg+xml;base64," + base64.b64encode((ROOT / rel).read_bytes()).decode()


html = "".join((SRC / n).read_text(encoding="utf-8") for n in sorted(os.listdir(SRC)))
for platzhalter, rel in ASSETS.items():
    html = html.replace(platzhalter, uri(rel))
rest = [p for p in ASSETS if p in html]
assert not rest, f"Platzhalter nicht ersetzt: {rest}"

kopf, rumpf = html.split("</style>", 1)
voll = ('<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n' + kopf + "</style>\n</head>\n<body>" + rumpf + "\n</body>\n</html>\n")
out = pathlib.Path(__file__).parent / "leo-faden.html"
out.write_text(voll, encoding="utf-8")
print(f"{out.relative_to(ROOT)}: {len(voll) // 1024} KB")

artifact = os.environ.get("ARTIFACT_OUT")
if artifact:
    pathlib.Path(artifact).write_text(html, encoding="utf-8")
    print(f"Artifact-Variante: {artifact}")
