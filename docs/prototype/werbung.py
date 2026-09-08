#!/usr/bin/env python3
"""
Erzeugt Platzhalter-Werbemittel für den Prototyp: fiktive Marken in den
IAB-Standardformaten. Sie sehen wie echte Anzeigen aus, bewerben aber nichts.

    python3 docs/prototype/werbung.py   →   docs/prototype/assets/*.svg
"""
import pathlib

OUT = pathlib.Path(__file__).parent / "assets"
OUT.mkdir(exist_ok=True)
FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"


def svg(w, h, body, bg):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="{FONT}">'
            f'<defs>{bg[0]}</defs><rect width="{w}" height="{h}" fill="{bg[1]}"/>{body}</svg>')


def verlauf(id_, a, b, winkel="0"):
    return (f'<linearGradient id="{id_}" x1="0" y1="0" x2="1" y2="{winkel}"><stop offset="0" stop-color="{a}"/>'
            f'<stop offset="1" stop-color="{b}"/></linearGradient>', f"url(#{id_})")


def cta(x, y, w, text, fill, ink="#fff", h=34, size=14):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="{fill}"/>'
            f'<text x="{x + w/2}" y="{y + h/2 + size*0.36}" text-anchor="middle" font-size="{size}" font-weight="700" fill="{ink}">{text}</text>')


def marke_kontora(x, y, s=1, ink="#fff"):
    return (f'<g transform="translate({x},{y}) scale({s})"><rect width="30" height="30" rx="7" fill="{ink}" opacity=".95"/>'
            f'<path d="M8 22V8h4v6l6-6h5l-7 7 7 7h-5l-6-6v6z" fill="#0B2A4A"/>'
            f'<text x="38" y="21" font-size="17" font-weight="800" fill="{ink}" letter-spacing=".02em">Kontora</text></g>')


def marke_pfoten(x, y, s=1, ink="#3A2A12"):
    return (f'<g transform="translate({x},{y}) scale({s})"><circle cx="15" cy="17" r="8" fill="{ink}"/>'
            f'<circle cx="6" cy="9" r="3.6" fill="{ink}"/><circle cx="13" cy="4.5" r="3.6" fill="{ink}"/><circle cx="21" cy="5.5" r="3.6" fill="{ink}"/><circle cx="26" cy="12" r="3.4" fill="{ink}"/>'
            f'<text x="36" y="21" font-size="17" font-weight="800" fill="{ink}">Pfotenschutz</text></g>')


def marke_nordlicht(x, y, s=1, ink="#fff"):
    return (f'<g transform="translate({x},{y}) scale({s})"><path d="M15 2l4 9 9 1-7 6 2 10-8-5-8 5 2-10-7-6 9-1z" fill="{ink}"/>'
            f'<text x="34" y="21" font-size="16" font-weight="800" fill="{ink}">NORDLICHT</text></g>')


def marke_steuerfuchs(x, y, s=1, ink="#fff"):
    return (f'<g transform="translate({x},{y}) scale({s})"><path d="M4 6l8 4h6l8-4-2 12c0 5-4 9-9 9s-9-4-9-9z" fill="{ink}"/>'
            f'<circle cx="11" cy="17" r="1.8" fill="#C74A0A"/><circle cx="19" cy="17" r="1.8" fill="#C74A0A"/>'
            f'<text x="36" y="21" font-size="17" font-weight="800" fill="{ink}">Steuerfuchs</text></g>')


def marke_baufix(x, y, s=1, ink="#fff"):
    return (f'<g transform="translate({x},{y}) scale({s})"><path d="M2 16L15 4l13 12h-4v10H6V16z" fill="{ink}"/>'
            f'<rect x="12" y="18" width="6" height="8" fill="#12305A"/>'
            f'<text x="36" y="21" font-size="17" font-weight="800" fill="{ink}">baufix</text></g>')


def deko_kreise(cx, cy, r, farbe, n=3):
    return "".join(f'<circle cx="{cx}" cy="{cy}" r="{r * (1 + i * .55)}" fill="none" stroke="{farbe}" stroke-opacity="{.35 - i * .1}" stroke-width="{max(1, 4 - i)}"/>' for i in range(n))


BILDER = {}

# 728 × 90 Leaderboard · Kontora Bank (Tagesgeld)
g, fill = verlauf("k1", "#0B2A4A", "#124C7E", "0.2")
BILDER["lb-kontora"] = svg(728, 90, marke_kontora(22, 30) + deko_kreise(690, 45, 30, "#8FD3FF")
    + f'<text x="190" y="40" font-size="24" font-weight="800" fill="#fff">Tagesgeld <tspan fill="#8FD3FF">3,1 % p. a.</tspan></text>'
    + f'<text x="190" y="64" font-size="13" fill="#CFE6FA">Täglich verfügbar · 6 Monate garantiert · Einlagen gesichert</text>'
    + cta(560, 28, 130, "Konto eröffnen", "#8FD3FF", "#0B2A4A"), (g, fill))

# 728 × 90 Leaderboard · Steuerfuchs (Steuer-App)
g, fill = verlauf("s1", "#C74A0A", "#F08A24", "0.6")
BILDER["lb-steuerfuchs"] = svg(728, 90, marke_steuerfuchs(22, 30)
    + f'<text x="205" y="40" font-size="24" font-weight="800" fill="#fff">Steuererklärung in 20 Minuten</text>'
    + f'<text x="205" y="64" font-size="13" fill="#FFE9D6">Ø 1.095 € Erstattung* · direkt ans Finanzamt · ab 34,99 €</text>'
    + cta(568, 28, 132, "Jetzt starten", "#fff", "#C74A0A") + f'<text x="700" y="84" font-size="7" fill="#FFE9D6" text-anchor="end">*Beispielwert</text>', (g, fill))

# 300 × 250 Rectangle · Pfotenschutz (Hunde-OP)
g, fill = verlauf("p1", "#F6D77A", "#F2B441", "1")
BILDER["mr-pfotenschutz"] = svg(300, 250, marke_pfoten(20, 20)
    + f'<text x="20" y="98" font-size="30" font-weight="800" fill="#3A2A12">Hunde-OP-</text><text x="20" y="132" font-size="30" font-weight="800" fill="#3A2A12">Versicherung</text>'
    + f'<text x="20" y="160" font-size="15" fill="#5A4420">ab <tspan font-weight="800">9,90 €</tspan> im Monat · ohne Wartezeit</text>'
    + f'<circle cx="252" cy="110" r="44" fill="#fff" opacity=".55"/><circle cx="252" cy="110" r="30" fill="#3A2A12"/><circle cx="240" cy="98" r="9" fill="#3A2A12"/><circle cx="252" cy="92" r="9" fill="#3A2A12"/><circle cx="264" cy="98" r="9" fill="#3A2A12"/>'
    + cta(20, 190, 180, "Angebot berechnen", "#3A2A12", "#F6D77A", 40, 15), (g, fill))

# 300 × 250 Rectangle · Nordlicht (Hausrat)
g, fill = verlauf("n1", "#1B4B8F", "#2F7BD4", "1")
BILDER["mr-nordlicht"] = svg(300, 250, marke_nordlicht(20, 20) + deko_kreise(250, 60, 26, "#BFE0FF")
    + f'<text x="20" y="104" font-size="28" font-weight="800" fill="#fff">Hausrat mit</text><text x="20" y="136" font-size="28" font-weight="800" fill="#fff">Fahrradschutz</text>'
    + f'<text x="20" y="164" font-size="14" fill="#DDEEFF">Neu: E-Bike-Diebstahl weltweit versichert. Wechsel in 3 Minuten, alte Police kündigen wir.</text>'
    + cta(20, 192, 150, "Jetzt wechseln", "#FFD166", "#1B2C4A", 38, 15), (g, fill))

# 300 × 600 Half Page · Baufix (Baufinanzierung)
g, fill = verlauf("b1", "#12305A", "#1E5A9C", "1")
BILDER["hp-baufix"] = svg(300, 600, marke_baufix(20, 24)
    + f'<text x="20" y="120" font-size="34" font-weight="800" fill="#fff">Bau-</text><text x="20" y="158" font-size="34" font-weight="800" fill="#fff">finanzierung</text>'
    + f'<text x="20" y="200" font-size="16" fill="#CFE0F5">ab</text><text x="20" y="262" font-size="60" font-weight="800" fill="#FFD166">3,4 %</text><text x="20" y="288" font-size="13" fill="#CFE0F5">effektiver Jahreszins · 10 Jahre fest</text>'
    + f'<g transform="translate(20,320)" fill="#CFE0F5" font-size="14"><text y="0">✓ über 400 Banken im Vergleich</text><text y="28">✓ Zusage in 24 Stunden</text><text y="56">✓ kostenlos und unverbindlich</text></g>'
    + f'<rect x="20" y="410" width="260" height="1" fill="#CFE0F5" opacity=".4"/>'
    + f'<text x="20" y="446" font-size="12" fill="#CFE0F5">Beispiel: 300.000 €, 20 % Eigenkapital,</text><text x="20" y="464" font-size="12" fill="#CFE0F5">2 % Tilgung: <tspan font-weight="700" fill="#fff">1.350 € im Monat*</tspan></text>'
    + cta(20, 520, 200, "Kostenlos vergleichen", "#FFD166", "#12305A", 44, 16) + f'<text x="20" y="588" font-size="9" fill="#CFE0F5" opacity=".7">*Beispielrechnung, Bonität vorausgesetzt</text>', (g, fill))

# 300 × 600 Half Page · Nordlicht (Hausrat), zweite Fassung für die linke Leiste
g, fill = verlauf("n2", "#1B4B8F", "#2F7BD4", "1")
BILDER["hp-nordlicht"] = svg(300, 600, marke_nordlicht(20, 24) + deko_kreise(240, 70, 30, "#BFE0FF")
    + f'<text x="20" y="140" font-size="34" font-weight="800" fill="#fff">Hausrat</text><text x="20" y="178" font-size="34" font-weight="800" fill="#fff">mit E-Bike-</text><text x="20" y="216" font-size="34" font-weight="800" fill="#fff">Schutz</text>'
    + f'<text x="20" y="262" font-size="16" fill="#DDEEFF">ab</text><text x="20" y="318" font-size="56" font-weight="800" fill="#FFD166">4,90 €</text><text x="20" y="344" font-size="13" fill="#DDEEFF">im Monat · Diebstahl weltweit</text>'
    + f'<g transform="translate(20,380)" fill="#DDEEFF" font-size="14"><text y="0">✓ Fahrrad und E-Bike bis 5.000 €</text><text y="28">✓ Wechsel in 3 Minuten</text><text y="56">✓ alte Police kündigen wir</text></g>'
    + f'<rect x="20" y="470" width="260" height="1" fill="#DDEEFF" opacity=".4"/>'
    + cta(20, 500, 190, "Jetzt wechseln", "#FFD166", "#1B2C4A", 44, 16) + f'<text x="20" y="580" font-size="9" fill="#DDEEFF" opacity=".7">Beispieltarif, 60 m², Berlin</text>', (g, fill))

# 160 × 600 Skyscraper · Kontora
g, fill = verlauf("k2", "#0B2A4A", "#124C7E", "1")
BILDER["sk-kontora"] = svg(160, 600, marke_kontora(16, 20, 0.85)
    + f'<text x="16" y="110" font-size="20" font-weight="800" fill="#fff">Tagesgeld</text><text x="16" y="170" font-size="44" font-weight="800" fill="#8FD3FF">3,1 %</text><text x="16" y="194" font-size="12" fill="#CFE6FA">p. a. · 6 Monate</text>'
    + f'<g transform="translate(16,240)" fill="#CFE6FA" font-size="12"><text y="0">täglich verfügbar</text><text y="24">kein Mindestbetrag</text><text y="48">Einlagen gesichert</text></g>'
    + deko_kreise(80, 400, 28, "#8FD3FF") + cta(16, 520, 128, "Konto eröffnen", "#8FD3FF", "#0B2A4A", 38, 13), (g, fill))

# 320 × 100 Mobile · Pfotenschutz / Steuerfuchs
g, fill = verlauf("p2", "#F6D77A", "#F2B441", "0.3")
BILDER["mo-pfotenschutz"] = svg(320, 100, marke_pfoten(14, 12, 0.8)
    + f'<text x="14" y="62" font-size="17" font-weight="800" fill="#3A2A12">Hunde-OP ab 9,90 €/Monat</text><text x="14" y="82" font-size="11" fill="#5A4420">ohne Wartezeit · freie Tierarztwahl</text>'
    + cta(222, 32, 86, "Berechnen", "#3A2A12", "#F6D77A", 32, 12), (g, fill))
g, fill = verlauf("s2", "#C74A0A", "#F08A24", "0.3")
BILDER["mo-steuerfuchs"] = svg(320, 100, marke_steuerfuchs(14, 12, 0.8)
    + f'<text x="14" y="62" font-size="17" font-weight="800" fill="#fff">Steuer in 20 Minuten</text><text x="14" y="82" font-size="11" fill="#FFE9D6">Ø 1.095 € zurück* · ab 34,99 €</text>'
    + cta(222, 32, 86, "Starten", "#fff", "#C74A0A", 32, 12), (g, fill))

# 200 × 200 Small Square · Steuerfuchs / Nordlicht (linke Leiste auf normalen Bildschirmhöhen)
g, fill = verlauf("s3", "#C74A0A", "#F08A24", "0.6")
BILDER["sq-steuerfuchs"] = svg(200, 200, marke_steuerfuchs(16, 16, 0.85)
    + f'<text x="16" y="96" font-size="22" font-weight="800" fill="#fff">Steuer in</text><text x="16" y="122" font-size="22" font-weight="800" fill="#fff">20 Minuten</text>'
    + f'<text x="16" y="146" font-size="11.5" fill="#FFE9D6">Ø 1.095 € zurück* · ab 34,99 €</text>'
    + cta(16, 158, 110, "Starten", "#fff", "#C74A0A", 30, 12) + f'<text x="190" y="192" font-size="7" fill="#FFE9D6" text-anchor="end">*Beispielwert</text>', (g, fill))
g, fill = verlauf("n3", "#1B4B8F", "#2F7BD4", "1")
BILDER["sq-nordlicht"] = svg(200, 200, marke_nordlicht(16, 16, 0.85) + deko_kreise(166, 40, 18, "#BFE0FF")
    + f'<text x="16" y="98" font-size="21" font-weight="800" fill="#fff">Hausrat mit</text><text x="16" y="123" font-size="21" font-weight="800" fill="#fff">E-Bike-Schutz</text>'
    + f'<text x="16" y="146" font-size="11.5" fill="#DDEEFF">Wechsel in 3 Minuten</text>'
    + cta(16, 158, 120, "Jetzt wechseln", "#FFD166", "#1B2C4A", 30, 12), (g, fill))

for name, inhalt in BILDER.items():
    (OUT / f"{name}.svg").write_text(inhalt, encoding="utf-8")
print(f"{len(BILDER)} Werbemittel → {OUT.relative_to(pathlib.Path(__file__).resolve().parents[2])}/")
