#!/usr/bin/env python3
"""
Erzeugt die acht Wireframes W1–W8 fuer das Konzept „finanzleser.de ist das
Gespraech mit Leo" als SVG (1600×1000). Bewusst einfache Skizzen: Graustufen-
Boxen, Markenfarben nur fuer Leo (Gruen) und Hervorhebungen (Magenta).

    python3 docs/konzept-visuals/wireframes.py
    → docs/konzept-visuals/W1.svg … W8.svg

PNG danach mit macOS-Bordmitteln:
    for f in docs/konzept-visuals/W*.svg; do qlmanage -t -s 2000 -o docs/konzept-visuals "$f"; done
"""
from pathlib import Path
from xml.sax.saxutils import escape

W, H = 1600, 1000
GREEN, MAGENTA = "#45A117", "#D3005E"
INK, MUTE, LINE, BOX, BOX2, PAPER = "#1F2937", "#6B7280", "#C7CCD4", "#F3F4F6", "#E5E7EB", "#FFFFFF"
FONT = "Open Sans, Helvetica Neue, Helvetica, Arial, sans-serif"
SERIF = "Merriweather, Georgia, serif"

OUT = Path(__file__).parent


class Svg:
    def __init__(self, title, subtitle):
        self.parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{FONT}">',
            f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
        ]
        self.text(40, 46, title, size=22, weight="700", color=INK)
        self.text(40, 74, subtitle, size=15, color=MUTE)
        self.line(40, 92, W - 40, 92, color=LINE)

    # --- Grundformen -------------------------------------------------------
    def rect(self, x, y, w, h, fill=BOX, stroke=LINE, r=8, sw=1.5, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')

    def line(self, x1, y1, x2, y2, color=LINE, sw=1.5, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{sw}"{d}/>')

    def text(self, x, y, s, size=14, color=INK, weight="400", anchor="start", family=None, italic=False):
        fam = f' font-family="{family}"' if family else ""
        st = ' font-style="italic"' if italic else ""
        self.parts.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}"{fam}{st}>{escape(s)}</text>')

    def lines(self, x, y, rows, size=13, color=INK, lh=None, weight="400"):
        lh = lh or size * 1.45
        for i, r in enumerate(rows):
            self.text(x, y + i * lh, r, size=size, color=color, weight=weight)

    def circle(self, cx, cy, r, fill=BOX2, stroke=LINE):
        self.parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')

    def arrow(self, x1, y1, x2, y2, color=MUTE, sw=2):
        self.parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{sw}" marker-end="url(#ah)"/>')

    def gray_lines(self, x, y, w, n=3, gap=10, color=BOX2, h=6):
        """Platzhalter-Fliesstext."""
        for i in range(n):
            ww = w if i < n - 1 else int(w * 0.6)
            self.parts.append(f'<rect x="{x}" y="{y + i * (h + gap)}" width="{ww}" height="{h}" rx="3" fill="{color}"/>')

    # --- Bausteine ---------------------------------------------------------
    def leo(self, cx, cy, r=16, label=None):
        """Leo-Avatar: gruener Kreis, Augen, Krawatte."""
        self.circle(cx, cy, r, fill=GREEN, stroke=GREEN)
        e = r * 0.28
        self.parts.append(f'<circle cx="{cx - e}" cy="{cy - e * 0.6}" r="{r * 0.16}" fill="white"/>')
        self.parts.append(f'<circle cx="{cx + e}" cy="{cy - e * 0.6}" r="{r * 0.16}" fill="white"/>')
        self.parts.append(f'<path d="M{cx - r * 0.4} {cy + r * 0.25} Q{cx} {cy + r * 0.6} {cx + r * 0.4} {cy + r * 0.25}" stroke="white" stroke-width="{max(1.5, r * 0.09)}" fill="none"/>')
        if label:
            self.text(cx + r + 8, cy + 5, label, size=13, color=GREEN, weight="700")

    def browser(self, x, y, w, h, url, title=None):
        self.rect(x, y, w, h, fill=PAPER, stroke=INK, r=10, sw=1.5)
        self.rect(x, y, w, 34, fill=BOX2, stroke=INK, r=10, sw=1.5)
        self.parts.append(f'<rect x="{x}" y="{y + 20}" width="{w}" height="14" fill="{BOX2}"/>')
        for i, c in enumerate(("#FCA5A5", "#FCD34D", "#86EFAC")):
            self.circle(x + 16 + i * 16, y + 17, 5, fill=c, stroke=c)
        self.rect(x + 70, y + 8, w - 84, 18, fill=PAPER, stroke=LINE, r=9, sw=1)
        self.text(x + 80, y + 21, url, size=11, color=MUTE)
        if title:
            self.text(x + w / 2, y - 12, title, size=14, weight="700", anchor="middle")

    def phone(self, x, y, w, h, title=None):
        self.rect(x, y, w, h, fill=PAPER, stroke=INK, r=28, sw=2)
        self.rect(x + w / 2 - 40, y + 10, 80, 8, fill=INK, stroke=INK, r=4)
        if title:
            self.text(x + w / 2, y - 12, title, size=14, weight="700", anchor="middle")

    def chip(self, x, y, s, w=None, fill=PAPER, stroke=GREEN, color=GREEN, size=12):
        w = w or (len(s) * size * 0.56 + 24)
        self.rect(x, y, w, 26, fill=fill, stroke=stroke, r=13, sw=1.2)
        self.text(x + w / 2, y + 17, s, size=size, color=color, anchor="middle", weight="600")
        return w

    def button(self, x, y, s, w=None, primary=True, size=12):
        w = w or (len(s) * size * 0.6 + 28)
        if primary:
            self.rect(x, y, w, 30, fill=GREEN, stroke=GREEN, r=15)
            self.text(x + w / 2, y + 19, s, size=size, color="white", anchor="middle", weight="700")
        else:
            self.rect(x, y, w, 30, fill=PAPER, stroke=INK, r=15, sw=1.2)
            self.text(x + w / 2, y + 19, s, size=size, color=INK, anchor="middle", weight="600")
        return w

    def card(self, x, y, w, h, kind, title, body_fn=None, footer=True, reason=None, accent=GREEN):
        """Chat-Karte: Typstreifen links, Typlabel, Titel (Serif), Body, Fusszeile."""
        self.rect(x, y, w, h, fill=PAPER, stroke=LINE, r=12, sw=1.5)
        self.parts.append(f'<rect x="{x}" y="{y}" width="6" height="{h}" rx="3" fill="{accent}"/>')
        self.text(x + 18, y + 22, kind.upper(), size=10, color=accent, weight="700")
        self.text(x + 18, y + 46, title, size=15, weight="700", family=SERIF)
        if body_fn:
            body_fn(x + 18, y + 62, w - 36, h - (110 if footer else 80))
        if footer:
            fy = y + h - 30
            self.line(x + 12, fy - 8, x + w - 12, fy - 8, color=BOX2)
            self.text(x + 18, fy + 10, "Teilen", size=11, color=GREEN, weight="700")
            self.text(x + 80, fy + 10, "In den Aktenkoffer", size=11, color=MUTE)
            self.text(x + 212, fy + 10, "Vorlesen", size=11, color=MUTE)
        if reason:
            self.text(x + 18, y - 8, reason, size=11, color=GREEN, italic=True)

    def bubble(self, x, y, w, rows, who="leo", size=13):
        h = 18 + len(rows) * size * 1.5
        if who == "leo":
            self.leo(x + 16, y + 16)
            self.rect(x + 40, y, w - 40, h, fill=PAPER, stroke=LINE, r=14)
            self.lines(x + 54, y + 22, rows, size=size)
        else:
            self.rect(x + 120, y, w - 120, h, fill=BOX2, stroke=BOX2, r=14)
            self.lines(x + 134, y + 22, rows, size=size)
        return h

    def note(self, x, y, w, rows, size=12):
        h = 16 + len(rows) * size * 1.5
        self.rect(x, y, w, h, fill="#FFF8E1", stroke="#F59E0B", r=6, sw=1)
        self.lines(x + 10, y + 18, rows, size=size, color="#7C5A00")
        return h

    def legend(self, items):
        x = 40
        y = H - 30
        for color, label in items:
            self.rect(x, y - 12, 14, 14, fill=color, stroke=color, r=3)
            self.text(x + 20, y, label, size=12, color=MUTE)
            x += 20 + len(label) * 7 + 30

    def save(self, name):
        defs = ('<defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">'
                f'<path d="M0,0 L10,5 L0,10 z" fill="{MUTE}"/></marker></defs>')
        self.parts.insert(2, defs)
        self.parts.append("</svg>")
        (OUT / name).write_text("\n".join(self.parts), encoding="utf-8")
        print("  ", name)


# ---------------------------------------------------------------------------
def w1():
    s = Svg("W1 · Startseite: Scroll-Intro in vier Beats, dann das Gespräch",
            "Erstbesuch: vier kurze Bilder beim Scrollen, das Intro kollabiert in die Eingabe. Wiederbesuch: nur Beat 4.")
    beats = [
        ("Beat 1 · Das Problem", "Versicherungsbedingungen", "haben 80 Seiten.", "Leo lugt unten ins Bild."),
        ("Beat 2 · Der Beweis", "Leo hat sie alle gelesen.", "Zähler läuft hoch:", "12.480 Dokumente"),
        ("Beat 3 · Die Einladung", "Fragen Sie ihn.", "Beispielfragen fliegen", "als Chips ein."),
        ("Beat 4 · Das Gespräch", "Eingabe groß in der Mitte,", "Vorschläge, erste Karten,", "Magazin-Menü oben."),
    ]
    for i, (lab, a, b, c) in enumerate(beats):
        x = 40 + i * 385
        y = 150
        s.browser(x, y, 350, 560, "finanzleser.de", title=lab)
        if i == 0:
            s.text(x + 175, y + 220, "Versicherungs-", size=26, weight="700", anchor="middle", family=SERIF)
            s.text(x + 175, y + 256, "bedingungen haben", size=26, weight="700", anchor="middle", family=SERIF)
            s.text(x + 175, y + 292, "80 Seiten.", size=26, weight="700", anchor="middle", family=SERIF)
            s.leo(x + 175, y + 500, r=36)
            s.text(x + 175, y + 400, "↓ scrollen", size=13, color=MUTE, anchor="middle")
        elif i == 1:
            s.text(x + 175, y + 130, "Leo hat sie alle gelesen.", size=22, weight="700", anchor="middle", family=SERIF)
            for k in range(6):
                s.rect(x + 60 + k * 10, y + 300 - k * 12, 150, 90, fill=PAPER, stroke=INK, r=4, sw=1)
            s.leo(x + 260, y + 330, r=44)
            s.text(x + 175, y + 470, "12.480 Dokumente", size=24, weight="700", anchor="middle", color=GREEN)
            s.text(x + 175, y + 495, "Zähler animiert", size=12, color=MUTE, anchor="middle")
        elif i == 2:
            s.text(x + 175, y + 130, "Fragen Sie ihn.", size=24, weight="700", anchor="middle", family=SERIF)
            s.leo(x + 175, y + 220, r=40)
            for k, q in enumerate(["Zahlt die Haftpflicht bei Schlüsselverlust?", "Was ist die Düsseldorfer Tabelle?",
                                   "Wie viel Unterhalt steht mir zu?", "Lohnt sich eine Hundekrankenversicherung?"]):
                s.chip(x + 30, y + 300 + k * 44, q, w=290)
        else:
            s.rect(x + 12, y + 44, 326, 30, fill=BOX, stroke=BOX, r=6)
            s.text(x + 22, y + 63, "Finanzen  Versicherungen  Steuern  Recht  Finanztools", size=10, color=MUTE)
            s.leo(x + 175, y + 130, r=30)
            s.text(x + 175, y + 190, "Hallo, ich bin Leo. Womit kann ich", size=13, anchor="middle")
            s.text(x + 175, y + 208, "Ihnen heute helfen?", size=13, anchor="middle")
            s.rect(x + 25, y + 240, 300, 54, fill=PAPER, stroke=GREEN, r=27, sw=2)
            s.text(x + 45, y + 272, "Ihre Frage …", size=14, color=MUTE)
            s.circle(x + 298, y + 267, 18, fill=GREEN, stroke=GREEN)
            s.text(x + 298, y + 272, "➤", size=14, color="white", anchor="middle")
            s.chip(x + 25, y + 310, "Schlüsselverlust", w=130)
            s.chip(x + 165, y + 310, "Unterhalt 2026", w=130)
            s.chip(x + 25, y + 344, "Finanzfrage des Tages", w=150, stroke=MAGENTA, color=MAGENTA)
            s.text(x + 25, y + 400, "Neu im Magazin", size=11, color=MUTE, weight="700")
            for k in range(3):
                s.rect(x + 25 + k * 102, y + 412, 96, 110, fill=BOX, stroke=LINE, r=8)
                s.rect(x + 25 + k * 102, y + 412, 96, 56, fill=BOX2, stroke=BOX2, r=8)
                s.gray_lines(x + 33 + k * 102, y + 480, 80, n=2, gap=6, h=5)
    s.arrow(60, 760, 1540, 760)
    s.text(800, 790, "Scroll-Richtung · Gesamtdauer etwa 12 Sekunden · Assets: Leo-Lottie, Dokumentenstapel, Zähler, Video optional", size=13, color=MUTE, anchor="middle")
    s.note(40, 820, 1520, [
        "Regeln: Intro ist überspringbar (Klick/Tipp), respektiert „Bewegung reduzieren“, wird nach dem ersten Besuch gemerkt (localStorage) und dann auf Beat 4 verkürzt.",
        "Beat 4 ist zugleich der Zustand, in dem ein Wiederbesucher und ein Suchmaschinen-Bot die Startseite sehen: Eingabe, Vorschläge, neue Karten, Magazin-Menü.",
    ])
    s.legend([(GREEN, "Leo / Aktion"), (MAGENTA, "Spiel / Hervorhebung"), (BOX2, "Platzhalter")])
    s.save("W1.svg")


def w2():
    s = Svg("W2 · Der Faden (Desktop): Verlauf links, Karten in der Mitte, Eingabe fest unten",
            "Jede Karte ist eine echte Seite mit eigener URL. Leo streut höchstens zwei Ergänzungen je Karte ein.")
    x, y, w, h = 40, 120, 1520, 810
    s.browser(x, y, w, h, "www.finanzleser.de/versicherungen/haftpflicht/schluesselverlust/")
    # Kopfleiste
    s.rect(x + 1, y + 34, w - 2, 48, fill=PAPER, stroke=PAPER, r=0)
    s.text(x + 24, y + 64, "finanzleser", size=18, weight="700", family=SERIF, color=GREEN)
    s.text(x + 200, y + 64, "Finanzen   Versicherungen   Steuern   Recht   Finanztools   Anbieter", size=13, color=INK)
    s.text(x + 200, y + 78, "Register: ein Tipp legt die Übersichtskarte in den Faden", size=9, color=GREEN, italic=True)
    s.button(x + w - 290, y + 44, "Wochenbrief · Do.", w=130, primary=True)
    s.button(x + w - 150, y + 44, "Plus · Anmelden", w=130, primary=False)
    s.line(x + 1, y + 82, x + w - 1, y + 82, color=BOX2)
    # Verlauf links
    rx = x + 1
    s.rect(rx, y + 83, 260, h - 84, fill=BOX, stroke=BOX, r=0)
    s.text(rx + 20, y + 112, "Verlauf", size=13, weight="700", color=MUTE)
    s.text(rx + 20, y + 140, "Heute", size=11, color=MUTE)
    items = ["Schlüsselverlust: zahlt die Haftpflicht?", "Unterhaltsrechner 2026", "Hundekrankenversicherung"]
    for k, it in enumerate(items):
        s.rect(rx + 14, y + 150 + k * 40, 232, 32, fill=PAPER if k else "#E8F5E1", stroke=LINE if k else GREEN, r=8, sw=1)
        s.text(rx + 24, y + 170 + k * 40, it, size=11)
    s.text(rx + 20, y + 290, "Gestern", size=11, color=MUTE)
    for k, it in enumerate(["Düsseldorfer Tabelle", "Steuerformulare 2026"]):
        s.rect(rx + 14, y + 300 + k * 40, 232, 32, fill=PAPER, stroke=LINE, r=8, sw=1)
        s.text(rx + 24, y + 320 + k * 40, it, size=11)
    s.line(rx + 14, y + 400, rx + 246, y + 400, color=LINE)
    s.text(rx + 20, y + 428, "Aktenkoffer (3)", size=12, weight="700")
    s.text(rx + 20, y + 458, "Wächter (2 aktiv)", size=12, weight="700")
    s.rect(rx + 14, y + 490, 232, 70, fill="#FFF0F6", stroke=MAGENTA, r=10, sw=1)
    s.text(rx + 24, y + 512, "Finanzfrage des Tages", size=12, weight="700", color=MAGENTA)
    s.text(rx + 24, y + 532, "🔥 Serie: 6 Tage · 340 Punkte", size=11, color=INK)
    s.text(rx + 24, y + 550, "Sammelalbum 4/12", size=11, color=MUTE)
    s.rect(rx + 14, y + 575, 232, 88, fill="#E8F5E1", stroke=GREEN, r=10, sw=1)
    s.text(rx + 24, y + 597, "Leos Wochenbrief", size=12, weight="700", color=GREEN)
    s.text(rx + 24, y + 616, "Ausgabe 143 · Do., 10. September", size=11, color=INK)
    s.rect(rx + 24, y + 626, 212, 26, fill=PAPER, stroke=GREEN, r=13, sw=1)
    s.text(rx + 36, y + 643, "ihre@adresse.de · Eintragen", size=10, color=MUTE)
    s.text(rx + 20, y + h - 60, "Was Suchmaschinen sehen", size=11, color=MUTE)
    # Kartenstrom
    cx = x + 300
    cw = 760
    s.bubble(cx, y + 100, cw, ["Sie lesen gerade den Ratgeber zum Schlüsselverlust. Soll ich das Wichtigste", "zusammenfassen oder haben Sie eine konkrete Frage?"])
    s.bubble(cx, y + 170, cw, ["Zahlt meine Haftpflicht, wenn ich den Schlüssel der Mietwohnung verliere?"], who="user")
    s.bubble(cx, y + 220, cw, ["Ja, wenn „Schlüsselverlust“ mitversichert ist. Das gilt bei 9 von 10 Tarifen unserer Partner,",
                               "meist bis 30.000 €. Quelle: AVB Ammerländer Privathaftpflicht, § 4 Abs. 2, S. 12."])

    def body_ratgeber(bx, by, bw, bh):
        s.text(bx, by - 2, "Versicherungen › Haftpflicht", size=10, color=MUTE)
        s.rect(bx, by + 8, 150, 82, fill=BOX2, stroke=BOX2, r=6)
        s.gray_lines(bx + 165, by + 12, bw - 170, n=4, gap=8)
        s.chip(bx + 165, by + 62, "Ganz lesen", w=90, size=10)
        s.chip(bx + 262, by + 62, "Kurzfassung von Leo", w=140, size=10)
        s.text(bx + 415, by + 79, "Inhalt: 4 Abschnitte", size=10, color=MUTE)
    s.card(cx, y + 300, cw, 190, "Ratgeber · Kopfkarte", "Schlüsselverlust: Wann die Haftpflicht zahlt", body_ratgeber)

    def body_stat(bx, by, bw, bh):
        vals = [(0.9, "Schlüssel"), (0.8, "Hausrat"), (0.6, "Hund"), (0.5, "Fahrrad")]
        for k, (v, lab) in enumerate(vals):
            s.rect(bx + k * 90, by + 70 - int(v * 60), 60, int(v * 60), fill=GREEN, stroke=GREEN, r=3)
            s.text(bx + 30 + k * 90, by + 88, lab, size=10, anchor="middle", color=MUTE)
    s.card(cx, y + 520, 360, 170, "Statistik", "9 von 10 Tarifen decken Schlüsselverlust", body_stat, footer=False,
           reason="Leo wirft ein: passt zu Ihrer Frage")

    def body_finconext(bx, by, bw, bh):
        s.lines(bx, by + 14, ["Privathaftpflicht mit Schlüsselverlust", "ab 3,90 €/Monat · Ammerländer, Haftpflichtkasse"], size=11)
        s.button(bx, by + 44, "Angebot berechnen bei Finconext", w=230)
    s.card(cx + 400, y + 520, 360, 170, "Anbieter", "Passende Tarife der Finconext-Partner", body_finconext, footer=False, accent=MAGENTA,
           reason="Leo wirft ein: Angebot in 90 Sekunden")
    # Eingabe
    s.rect(cx, y + h - 90, cw, 54, fill=PAPER, stroke=GREEN, r=27, sw=2)
    s.text(cx + 22, y + h - 57, "Fragen Sie Leo …", size=14, color=MUTE)
    s.circle(cx + cw - 28, y + h - 63, 18, fill=GREEN, stroke=GREEN)
    s.text(cx + cw - 28, y + h - 58, "➤", size=14, color="white", anchor="middle")
    s.text(cx + cw - 70, y + h - 58, "🎤", size=14, anchor="middle")
    s.chip(cx, y + h - 30 + 2, "Was kostet das?", w=130)
    s.chip(cx + 140, y + h - 30 + 2, "Checkliste Schlüsselverlust", w=190)
    s.chip(cx + 340, y + h - 30 + 2, "Vorlesen", w=90, stroke=LINE, color=MUTE)
    # rechte Spalte
    rr = x + 1090
    s.text(rr, y + 112, "Leo schlägt vor", size=13, weight="700", color=MUTE)
    for k, (t, kind) in enumerate([("Checkliste: Nach dem Schlüsselverlust", "Checkliste"), ("Rechner: Selbstbeteiligung lohnt?", "Rechner"), ("Mythos oder Fakt: Nachschlüssel", "Spiel")]):
        s.rect(rr, y + 126 + k * 74, 410, 62, fill=PAPER, stroke=LINE, r=10)
        s.parts.append(f'<rect x="{rr}" y="{y + 126 + k * 74}" width="5" height="62" rx="2" fill="{MAGENTA if kind == "Spiel" else GREEN}"/>')
        s.text(rr + 16, y + 146 + k * 74, kind.upper(), size=9, color=MUTE, weight="700")
        s.text(rr + 16, y + 168 + k * 74, t, size=12, weight="600")
    s.note(rr, y + 370, 410, ["Rechte Spalte nur auf breiten Bildschirmen.", "Auf Mobilgeräten werden Vorschläge zu", "Chips über der Eingabe."])
    s.note(rr, y + 460, 410, ["Ältere Karten falten sich beim Weiterscrollen", "zu einer Kopfzeile zusammen und bleiben", "im Verlauf links erreichbar."])
    s.legend([(GREEN, "Leo / Aktion"), (MAGENTA, "Finconext / Spiel"), (BOX, "Verlauf")])
    s.save("W2.svg")


def w3():
    s = Svg("W3 · Der Faden (Mobil): Karten stapeln sich, Eingabe bleibt unten, Karte öffnet sich im Faden",
            "Links der Faden, rechts eine geöffnete Rechner-Karte. Kein Seitenwechsel, ein Wisch zurück reicht.")
    # Phone 1
    px, py, pw, ph = 120, 140, 390, 800
    s.phone(px, py, pw, ph, title="Faden")
    s.leo(px + 40, py + 60, r=16)
    s.text(px + 66, py + 66, "Leo", size=14, weight="700", color=GREEN)
    s.text(px + pw - 40, py + 66, "☰", size=20, anchor="middle")
    s.text(px + pw - 80, py + 66, "Verlauf", size=11, color=MUTE, anchor="middle")
    s.line(px + 20, py + 84, px + pw - 20, py + 84, color=BOX2)
    s.bubble(px + 20, py + 100, pw - 40, ["Womit kann ich helfen?"], size=12)
    s.rect(px + 100, py + 150, pw - 120, 40, fill=BOX2, stroke=BOX2, r=14)
    s.text(px + 114, py + 174, "Wie viel Unterhalt für 2 Kinder?", size=12)
    s.bubble(px + 20, py + 200, pw - 40, ["Das hängt vom Nettoeinkommen und Alter", "der Kinder ab. Rechnen wir es aus:"], size=12)

    def body_calc(bx, by, bw, bh):
        s.rect(bx, by + 6, bw, 28, fill=BOX, stroke=LINE, r=6, sw=1)
        s.text(bx + 10, by + 24, "Nettoeinkommen  3.200 €", size=11)
        s.rect(bx, by + 42, bw, 28, fill=BOX, stroke=LINE, r=6, sw=1)
        s.text(bx + 10, by + 60, "Kinder  2 · 6 und 9 Jahre", size=11)
        s.text(bx, by + 96, "Ergebnis: 1.096 €/Monat", size=13, weight="700", color=GREEN)
    s.card(px + 20, py + 280, pw - 40, 210, "Rechner", "Unterhaltsrechner 2026", body_calc)

    def body_game(bx, by, bw, bh):
        s.text(bx, by + 16, "„Unterhalt endet automatisch mit 18.“", size=11, italic=True)
        s.chip(bx, by + 30, "Mythos", w=90, stroke=MAGENTA, color=MAGENTA)
        s.chip(bx + 100, by + 30, "Fakt", w=90, stroke=MAGENTA, color=MAGENTA)
    s.card(px + 20, py + 520, pw - 40, 120, "Spiel", "Mythos oder Fakt?", body_game, footer=False, accent=MAGENTA,
           reason="Leo: 30 Sekunden, 20 Punkte")
    s.rect(px + 20, py + ph - 100, pw - 40, 44, fill=PAPER, stroke=GREEN, r=22, sw=2)
    s.text(px + 36, py + ph - 72, "Fragen Sie Leo …", size=12, color=MUTE)
    s.circle(px + pw - 42, py + ph - 78, 15, fill=GREEN, stroke=GREEN)
    s.chip(px + 20, py + ph - 48, "Düsseldorfer Tabelle", w=140, size=11)
    s.chip(px + 170, py + ph - 48, "Checkliste Trennung", w=140, size=11)
    s.text(px + pw - 40, py + ph - 30, "›", size=16, color=MUTE, anchor="middle")
    # Phone 2
    qx = 700
    s.phone(qx, py, pw, ph, title="Karte ausgeklappt (im Faden)")
    s.text(qx + 30, py + 66, "‹ Einklappen", size=12, color=GREEN, weight="700")
    s.text(qx + pw - 30, py + 66, "⋯", size=18, anchor="middle")
    s.line(qx + 20, py + 84, qx + pw - 20, py + 84, color=BOX2)
    s.parts.append(f'<rect x="{qx + 20}" y="{py + 100}" width="6" height="560" rx="3" fill="{GREEN}"/>')
    s.text(qx + 40, py + 120, "RECHNER", size=10, color=GREEN, weight="700")
    s.text(qx + 40, py + 148, "Unterhaltsrechner 2026", size=17, weight="700", family=SERIF)
    s.gray_lines(qx + 40, py + 170, pw - 80, n=3, gap=8)
    for k, lab in enumerate(["Nettoeinkommen", "Anzahl Kinder", "Alter Kind 1", "Alter Kind 2"]):
        s.text(qx + 40, py + 232 + k * 58, lab, size=11, color=MUTE)
        s.rect(qx + 40, py + 240 + k * 58, pw - 80, 34, fill=BOX, stroke=LINE, r=8, sw=1)
    s.rect(qx + 40, py + 480, pw - 80, 70, fill="#E8F5E1", stroke=GREEN, r=10)
    s.text(qx + 56, py + 508, "Unterhalt gesamt", size=11, color=MUTE)
    s.text(qx + 56, py + 536, "1.096 € / Monat", size=20, weight="700", color=GREEN)
    s.button(qx + 40, py + 570, "In den Aktenkoffer", w=150, primary=False)
    s.button(qx + 200, py + 570, "Teilen", w=150, primary=False)
    s.leo(qx + 56, py + 640, r=14)
    s.text(qx + 80, py + 645, "Wollen Sie wissen, was bei Jobverlust passiert?", size=11, color=INK)
    s.rect(qx + 20, py + ph - 100, pw - 40, 44, fill=PAPER, stroke=GREEN, r=22, sw=2)
    s.text(qx + 36, py + ph - 72, "Frage zu diesem Rechner …", size=12, color=MUTE)
    s.circle(qx + pw - 42, py + ph - 78, 15, fill=GREEN, stroke=GREEN)
    s.arrow(px + pw + 20, py + 380, qx - 20, py + 380)
    s.text((px + pw + qx) / 2, py + 370, "Tipp auf Karte", size=12, color=MUTE, anchor="middle")
    s.note(1130, 160, 400, ["Bedienregeln für die ältere Zielgruppe:", "· Schrift mindestens 16 px, Zeilenhöhe 1,5", "· Vorschläge als Chips, Tippen statt Schreiben", "· Mikrofon- und Vorlesen-Taste in der Eingabe", "· Keine versteckten Gesten: alles auch per Taste", "· „Zurück“ heißt immer: zurück ins Gespräch"])
    s.note(1130, 330, 400, ["Verlauf öffnet sich als Schublade von links.", "Magazin-Menü über ☰: Kategorien, Finanztools,", "Anbieter, Anmelden."])
    s.note(1130, 430, 400, ["Karten laden erst, wenn sie ins Bild kommen.", "Rechner rechnen sofort, ohne Neuladen."])
    s.legend([(GREEN, "Leo / Aktion"), (MAGENTA, "Spiel"), (BOX, "Eingabefeld")])
    s.save("W3.svg")


def w4():
    s = Svg("W4 · Anatomie einer Karte und die acht Kartentypen",
            "Jede Karte hat denselben Rahmen. Der Typ bestimmt Farbe, Inhalt und was Leo daran anschließt.")
    # Anatomie links
    x, y, w, h = 60, 140, 560, 420
    s.card(x, y, w, h, "Rechner", "Unterhaltsrechner 2026",
           lambda bx, by, bw, bh: (s.rect(bx, by + 10, bw, 34, fill=BOX, stroke=LINE, r=8, sw=1),
                                   s.rect(bx, by + 54, bw, 34, fill=BOX, stroke=LINE, r=8, sw=1),
                                   s.rect(bx, by + 110, bw, 60, fill="#E8F5E1", stroke=GREEN, r=10),
                                   s.text(bx + 14, by + 146, "1.096 € / Monat", size=18, weight="700", color=GREEN),
                                   s.leo(bx + 14, by + 210, r=12),
                                   s.text(bx + 34, by + 215, "Leo: Was passiert bei Jobverlust?", size=11, color=INK)),
           reason="Leo: Passt zu Ihrer Frage, weil Sie nach Unterhalt gefragt haben")
    ann = [
        (x - 20, y + 20, "① Typstreifen + Typname (Farbe je Typ)"),
        (x - 20, y + 50, "② Titel in Merriweather, wie im Magazin"),
        (x - 20, y + 150, "③ Inhalt: interaktiv, ohne Seitenwechsel"),
        (x - 20, y + 320, "④ Leos Anschlussfrage (höchstens eine)"),
        (x - 20, y + h - 2, "⑤ Fußzeile: Teilen · Aktenkoffer · Vorlesen (keine „Seite öffnen“-Taste)"),
        (x - 20, y - 26, "⓪ Leos Begründung (Transparenz)"),
    ]
    for k, (ax, ay, t) in enumerate(ann):
        s.circle(ax, ay, 4, fill=MAGENTA, stroke=MAGENTA)
        s.line(ax, ay, x + w + 30, ay, color=MAGENTA, sw=1, dash="4 4")
        s.text(x + w + 40, ay + 4, t, size=12, color=INK)
    s.note(60, 600, 560, ["„Teilen“ kopiert die Adresse der Karte. Wer sie öffnet, landet im Faden mit dieser Karte.",
                          "Die Adresse selbst sehen nur Suchmaschinen. Ein Mensch verlässt den Faden nie."])
    # Typen rechts
    types = [
        ("Ratgeber", GREEN, "Kartenkette: Kopfkarte, Abschnitte, FAQ, Fazit."),
        ("Rechner", GREEN, "56 Rechner; rechnen in der Karte, Ergebnis speicherbar."),
        ("Vergleich", GREEN, "43 Vergleiche, teils Affiliate; Leo nennt Kriterien."),
        ("Checkliste", GREEN, "207 Checklisten; abhakbar, als PDF in den Koffer."),
        ("Dokument", GREEN, "Formulare, Vorlagen; Download ohne Umweg."),
        ("Anbieter", MAGENTA, "147 Kontaktseiten + Finconext-Partner mit Angebot."),
        ("Spiel", MAGENTA, "Mythos/Fakt, Quiz, Schätzen, Rubbellos, Karte, Gewusst."),
        ("Statistik", GREEN, "Animierte Zahl, Balken, Kreis; Quelle immer dabei."),
    ]
    gx, gy = 1000, 140
    for k, (name, col, desc) in enumerate(types):
        cx = gx + (k % 2) * 290
        cy = gy + (k // 2) * 170
        s.rect(cx, cy, 270, 150, fill=PAPER, stroke=LINE, r=12, sw=1.5)
        s.parts.append(f'<rect x="{cx}" y="{cy}" width="6" height="150" rx="3" fill="{col}"/>')
        s.text(cx + 18, cy + 24, name.upper(), size=10, color=col, weight="700")
        s.text(cx + 18, cy + 50, name, size=15, weight="700", family=SERIF)
        s.gray_lines(cx + 18, cy + 64, 230, n=2, gap=6, h=5)
        # Beschreibung umbrechen
        words = desc.split()
        rows, cur = [], ""
        for wd in words:
            if len(cur + " " + wd) > 34:
                rows.append(cur.strip()); cur = wd
            else:
                cur += " " + wd
        rows.append(cur.strip())
        s.lines(cx + 18, cy + 104, rows, size=11, color=MUTE)
    s.text(gx, gy - 16, "Acht Kartentypen · Zahlen = heutiger Bestand", size=13, weight="700", color=MUTE)
    s.note(gx, gy + 700, 560, ["Einwurf-Regeln für Leo: höchstens zwei Karten je Antwort, nie eine Anbieter-Karte", "vor einer Antwort, immer mit Grund („weil …“). Spiele nur, wenn die Frage beantwortet ist."])
    s.legend([(GREEN, "Inhalt / Werkzeug"), (MAGENTA, "Finconext / Spiel")])
    s.save("W4.svg")


def w5():
    s = Svg("W5 · Deep-Link: Vom Newsletter direkt ins Gespräch, ohne Umweg",
            "Der Link zeigt auf die normale Ratgeber-URL. Der Server liefert die Seite, der Browser legt den Faden darum.")
    steps = [
        ("1 · Newsletter / WhatsApp", None),
        ("2 · Server liefert Magazinseite", "finanzleser.de/versicherungen/haftpflicht/schluesselverlust/"),
        ("3 · Faden legt sich um die Seite", "finanzleser.de/versicherungen/haftpflicht/schluesselverlust/"),
        ("4 · Leo ergänzt, Nutzer fragt weiter", "…/schluesselverlust/  (URL unverändert)"),
    ]
    fw, fh = 340, 560
    for i, (lab, url) in enumerate(steps):
        x = 40 + i * 385
        y = 150
        if i == 0:
            s.rect(x, y, fw, fh, fill=PAPER, stroke=INK, r=10)
            s.text(x + fw / 2, y - 12, lab, size=14, weight="700", anchor="middle")
            s.rect(x + 20, y + 20, fw - 40, 60, fill=BOX, stroke=LINE, r=8)
            s.text(x + 34, y + 44, "Leos Wochenbrief", size=13, weight="700")
            s.text(x + 34, y + 64, "Donnerstag, 3. September", size=11, color=MUTE)
            s.gray_lines(x + 20, y + 110, fw - 40, n=4, gap=10)
            s.rect(x + 20, y + 190, fw - 40, 80, fill="#E8F5E1", stroke=GREEN, r=8)
            s.text(x + 34, y + 216, "Schlüssel weg: Zahlt die", size=13, weight="700")
            s.text(x + 34, y + 236, "Haftpflicht?", size=13, weight="700")
            s.text(x + 34, y + 258, "→ Mit Leo lesen", size=12, color=GREEN, weight="700")
            s.gray_lines(x + 20, y + 300, fw - 40, n=6, gap=10)
            s.rect(x + 20, y + 420, fw - 40, 110, fill="#DCFCE7", stroke="#16A34A", r=14)
            s.text(x + 34, y + 446, "WhatsApp · Wächter", size=12, weight="700", color="#166534")
            s.text(x + 34, y + 470, "Ihre Kfz-Frist endet am 30.11.", size=11)
            s.text(x + 34, y + 490, "Leo hat 3 Angebote geprüft.", size=11)
            s.text(x + 34, y + 512, "→ finanzleser.de/…/kfz-wechsel/", size=11, color=GREEN)
        else:
            s.browser(x, y, fw, fh, url, title=lab)
            if i == 1:
                s.rect(x + 12, y + 44, fw - 24, 26, fill=BOX, stroke=BOX, r=4)
                s.text(x + 20, y + 61, "finanzleser   Finanzen  Versicherungen  Steuern", size=9, color=MUTE)
                s.text(x + 20, y + 100, "Schlüsselverlust: Wann die", size=16, weight="700", family=SERIF)
                s.text(x + 20, y + 122, "Haftpflicht zahlt", size=16, weight="700", family=SERIF)
                s.rect(x + 20, y + 140, fw - 40, 100, fill=BOX2, stroke=BOX2, r=6)
                s.gray_lines(x + 20, y + 260, fw - 40, n=8, gap=9)
                s.rect(x + 20, y + 400, fw - 40, 60, fill=BOX, stroke=LINE, r=8, dash="4 4")
                s.text(x + 30, y + 434, "[Rechner-Einbettung, serverseitig]", size=11, color=MUTE)
                s.gray_lines(x + 20, y + 480, fw - 40, n=4, gap=9)
                s.text(x + 20, y + 545, "Volltext · Metadata · JSON-LD · Canonical", size=10, color=GREEN, weight="700")
            elif i == 2:
                s.rect(x + 12, y + 44, fw - 24, 26, fill=BOX, stroke=BOX, r=4)
                s.text(x + 20, y + 61, "finanzleser   Finanzen  Versicherungen  Steuern", size=9, color=MUTE)
                s.leo(x + 34, y + 96, r=13)
                s.rect(x + 54, y + 82, fw - 74, 46, fill=PAPER, stroke=LINE, r=12)
                s.text(x + 64, y + 100, "Willkommen zurück. Sie haben den", size=10)
                s.text(x + 64, y + 116, "Wochenbrief-Artikel geöffnet:", size=10)
                s.card(x + 20, y + 150, fw - 40, 320, "Ratgeber", "Schlüsselverlust: Wann die …",
                       lambda bx, by, bw, bh: (s.rect(bx, by + 6, bw, 70, fill=BOX2, stroke=BOX2, r=6), s.gray_lines(bx, by + 90, bw, n=9, gap=9)))
                s.rect(x + 20, y + 490, fw - 40, 40, fill=PAPER, stroke=GREEN, r=20, sw=2)
                s.text(x + 34, y + 515, "Fragen Sie Leo …", size=11, color=MUTE)
                s.text(x + 20, y + 550, "Gleicher Inhalt, jetzt als erste Karte", size=10, color=GREEN, weight="700")
            else:
                s.rect(x + 20, y + 50, fw - 40, 40, fill=PAPER, stroke=LINE, r=10)
                s.text(x + 30, y + 74, "▸ Schlüsselverlust: Wann die Haftpflicht …", size=10, color=MUTE)
                s.card(x + 20, y + 110, fw - 40, 130, "Statistik", "9 von 10 Tarifen decken es",
                       lambda bx, by, bw, bh: [s.rect(bx + k * 62, by + 50 - int(v * 40), 44, int(v * 40), fill=GREEN, stroke=GREEN, r=3) for k, v in enumerate([0.9, 0.8, 0.6, 0.5])],
                       footer=False, reason="Leo wirft ein")
                s.card(x + 20, y + 270, fw - 40, 120, "Anbieter", "Tarife der Finconext-Partner",
                       lambda bx, by, bw, bh: s.button(bx, by + 10, "Angebot berechnen", w=160), footer=False, accent=MAGENTA, reason="Leo wirft ein")
                s.rect(x + 100, y + 410, fw - 120, 36, fill=BOX2, stroke=BOX2, r=12)
                s.text(x + 112, y + 432, "Und bei einem Tresorschlüssel?", size=10)
                s.leo(x + 34, y + 480, r=13)
                s.rect(x + 54, y + 466, fw - 74, 40, fill=PAPER, stroke=LINE, r=12)
                s.text(x + 64, y + 484, "Das ist ein Sonderfall. Laut AVB …", size=10)
                s.rect(x + 20, y + 515, fw - 40, 34, fill=PAPER, stroke=GREEN, r=17, sw=2)
        if i < 3:
            s.arrow(x + fw + 8, y + fh / 2, x + fw + 40, y + fh / 2)
    s.note(40, 760, 740, ["Was der Server tut: dieselbe Seite wie heute (aus dem Cache, keine neue WordPress-Abfrage).",
                          "Was der Browser tut: Faden-Rahmen, Verlauf, Leo-Begrüßung, Einwürfe. Fällt das aus, bleibt die Seite lesbar.",
                          "Zurück-Taste: schließt die zuletzt geöffnete Karte, nicht das Gespräch. Teilen-Link = kanonische URL."])
    s.note(820, 760, 740, ["Der Wächter (WhatsApp/E-Mail) verlinkt genauso: normale URL, Faden im Browser.",
                           "Deshalb funktionieren alle heutigen Links, Google-Treffer und Lesezeichen weiter.",
                           "Kein „App öffnen“, kein zweites System."])
    s.legend([(GREEN, "Leo / Aktion"), (MAGENTA, "Finconext"), (BOX2, "Platzhalter")])
    s.save("W5.svg")


def w6():
    s = Svg("W6 · Zwei Gesichter einer URL: Was Suchmaschinen sehen, was Menschen erleben",
            "Dieselbe Adresse, derselbe Inhalt, zwei Darstellungen. Der Faden ist eine Schicht über der Seite, kein Ersatz.")
    url = "www.finanzleser.de/finanztools/rechner/unterhaltsrechner/"
    s.rect(400, 120, 800, 44, fill="#E8F5E1", stroke=GREEN, r=22, sw=2)
    s.text(800, 148, url, size=16, weight="700", anchor="middle", color=GREEN)
    s.arrow(600, 168, 470, 198)
    s.arrow(1000, 168, 1130, 198)
    # links Crawler
    s.text(420, 222, "Crawler, KI-Suche, Nutzer ohne JavaScript", size=14, weight="700", anchor="middle")
    s.browser(80, 230, 680, 520, url)
    x, y = 80, 230
    s.rect(x + 12, y + 44, 656, 26, fill=BOX, stroke=BOX, r=4)
    s.text(x + 20, y + 61, "finanzleser   Finanzen  Versicherungen  Steuern  Recht  Finanztools", size=10, color=MUTE)
    s.text(x + 24, y + 110, "Unterhaltsrechner 2026", size=22, weight="700", family=SERIF)
    s.text(x + 24, y + 134, "Düsseldorfer Tabelle · Stand 1. Januar 2026", size=12, color=MUTE)
    s.gray_lines(x + 24, y + 160, 400, n=5, gap=10)
    s.rect(x + 24, y + 250, 400, 120, fill=BOX, stroke=LINE, r=8, dash="4 4")
    s.text(x + 36, y + 300, "[Rechner: Formular im HTML, Ergebnis nach Eingabe]", size=11, color=MUTE)
    s.text(x + 24, y + 400, "Häufige Fragen", size=14, weight="700", family=SERIF)
    s.gray_lines(x + 24, y + 416, 400, n=4, gap=10)
    for k, b in enumerate(["Title + Description", "Canonical", "JSON-LD Article/FAQ", "Sitemap-Eintrag", "Volltext im HTML"]):
        s.rect(x + 460, y + 100 + k * 46, 190, 34, fill="#E8F5E1", stroke=GREEN, r=8)
        s.text(x + 555, y + 122 + k * 46, "✓ " + b, size=11, anchor="middle", color="#166534", weight="600")
    s.text(x + 460, y + 350, "Kein Faden, keine Leo-Einwürfe.", size=11, color=MUTE)
    s.text(x + 460, y + 368, "Genau die Seite von heute.", size=11, color=MUTE)
    # rechts Nutzer
    s.text(1180, 222, "Mensch im Browser (nach dem Laden)", size=14, weight="700", anchor="middle")
    s.browser(840, 230, 680, 520, url)
    x = 840
    s.rect(x + 12, y + 44, 656, 26, fill=BOX, stroke=BOX, r=4)
    s.text(x + 20, y + 61, "finanzleser   Finanzen  Versicherungen  Steuern  Recht  Finanztools   Plus", size=10, color=MUTE)
    s.rect(x + 1, y + 70, 150, 449, fill=BOX, stroke=BOX, r=0)
    s.text(x + 14, y + 92, "Verlauf", size=10, weight="700", color=MUTE)
    for k in range(4):
        s.rect(x + 10, y + 102 + k * 30, 132, 22, fill=PAPER, stroke=LINE, r=6, sw=1)
    s.leo(x + 180, y + 96, r=13)
    s.rect(x + 200, y + 82, 300, 40, fill=PAPER, stroke=LINE, r=12)
    s.text(x + 210, y + 100, "Ich habe den Rechner geöffnet.", size=10)
    s.text(x + 210, y + 114, "Nettoeinkommen eintragen?", size=10)
    s.card(x + 165, y + 135, 340, 240, "Rechner", "Unterhaltsrechner 2026",
           lambda bx, by, bw, bh: (s.rect(bx, by + 8, bw, 28, fill=BOX, stroke=LINE, r=6, sw=1), s.rect(bx, by + 44, bw, 28, fill=BOX, stroke=LINE, r=6, sw=1),
                                   s.rect(bx, by + 84, bw, 44, fill="#E8F5E1", stroke=GREEN, r=8), s.text(bx + 12, by + 112, "1.096 € / Monat", size=15, weight="700", color=GREEN)))
    s.card(x + 515, y + 135, 150, 120, "Statistik", "Ø Unterhalt", lambda bx, by, bw, bh: s.gray_lines(bx, by + 8, bw, n=3), footer=False, reason="Leo")
    s.card(x + 515, y + 270, 150, 105, "Spiel", "Schätzfrage", lambda bx, by, bw, bh: s.gray_lines(bx, by + 8, bw, n=2), footer=False, accent=MAGENTA, reason="Leo")
    s.rect(x + 165, y + 400, 500, 40, fill=PAPER, stroke=GREEN, r=20, sw=2)
    s.text(x + 180, y + 425, "Fragen Sie Leo …", size=11, color=MUTE)
    s.text(x + 165, y + 470, "Derselbe Rechner, derselbe Text. Dazu: Verlauf, Leo, Einwürfe.", size=11, color=GREEN, weight="700")
    # Tabelle unten
    ty = 790
    rows = [("Text, Titel, Metadaten, JSON-LD, Canonical", "identisch", "identisch"),
            ("Rechner, Checkliste, Vergleich", "im HTML enthalten", "in der Karte bedienbar"),
            ("Leo-Begrüßung, Einwürfe, Verlauf, Aktenkoffer", "nicht vorhanden", "nur im Browser, nach dem Laden"),
            ("Kosten beim Aufruf", "eine gecachte Seite", "dieselbe Seite, keine weitere WordPress-Abfrage")]
    s.text(80, ty, "Merkmal", size=12, weight="700", color=MUTE)
    s.text(600, ty, "Suchmaschine", size=12, weight="700", color=MUTE)
    s.text(1000, ty, "Mensch", size=12, weight="700", color=MUTE)
    s.line(80, ty + 8, 1520, ty + 8, color=LINE)
    for k, (a, b, c) in enumerate(rows):
        yy = ty + 32 + k * 26
        s.text(80, yy, a, size=12)
        s.text(600, yy, b, size=12, color=INK)
        s.text(1000, yy, c, size=12, color=INK)
    s.legend([(GREEN, "SEO-Bausteine / Leo"), (MAGENTA, "Spiel"), (BOX, "Verlauf")])
    s.save("W6.svg")


def w7():
    s = Svg("W7 · Finanzleser Plus: Erst der Nutzen, dann die Sicherungsfrage, dann das Konto",
            "Kein Login-Zwang. Der Aktenkoffer funktioniert anonym; ab drei Einträgen fragt Leo, ob er sichern soll.")
    fw, fh = 460, 600
    y = 150
    # Frame 1
    x = 40
    s.browser(x, y, fw, fh, "…/rechner/unterhaltsrechner/", title="1 · Nutzen ohne Konto")
    s.card(x + 20, y + 60, fw - 40, 250, "Rechner", "Unterhaltsrechner 2026",
           lambda bx, by, bw, bh: (s.rect(bx, by + 8, bw, 30, fill=BOX, stroke=LINE, r=6, sw=1), s.rect(bx, by + 48, bw, 30, fill=BOX, stroke=LINE, r=6, sw=1),
                                   s.rect(bx, by + 92, bw, 50, fill="#E8F5E1", stroke=GREEN, r=8), s.text(bx + 12, by + 124, "1.096 € / Monat", size=16, weight="700", color=GREEN)))
    s.button(x + 40, y + 330, "In den Aktenkoffer legen", w=220, primary=False)
    s.button(x + 270, y + 330, "Teilen", w=100, primary=False)
    s.text(x + 40, y + 390, "Aktenkoffer (anonym, in diesem Browser)", size=12, weight="700", color=MUTE)
    for k, it in enumerate(["Unterhaltsrechner · 1.096 €", "Checkliste Trennung · 4/12 erledigt", "Vergleich Hundekranken · gemerkt"]):
        s.rect(x + 40, y + 404 + k * 40, fw - 80, 32, fill=PAPER, stroke=LINE, r=8, sw=1)
        s.text(x + 52, y + 425 + k * 40, it, size=11)
    s.text(x + 40, y + 560, "3 Einträge → Leo stellt die Sicherungsfrage", size=11, color=GREEN, weight="700")
    # Frame 2
    x = 570
    s.browser(x, y, fw, fh, "…/rechner/unterhaltsrechner/", title="2 · Die Sicherungsfrage")
    s.leo(x + 40, y + 100, r=18)
    s.rect(x + 66, y + 76, fw - 96, 150, fill=PAPER, stroke=LINE, r=14)
    s.lines(x + 80, y + 100, ["Ihr Aktenkoffer hat jetzt drei Einträge. Soll ich", "ihn sichern, damit er auch auf dem Handy und", "nach dem Browserwechsel da ist?", "", "Eine E-Mail-Adresse genügt. Kein Passwort."], size=12)
    s.rect(x + 40, y + 250, fw - 80, 44, fill=PAPER, stroke=GREEN, r=22, sw=2)
    s.text(x + 56, y + 277, "ihre@adresse.de", size=13, color=MUTE)
    s.button(x + 40, y + 310, "Link zum Anmelden schicken", w=230)
    s.text(x + 40, y + 370, "oder", size=11, color=MUTE)
    s.button(x + 40, y + 385, "Mit Passkey (Face ID / Fingerabdruck)", w=290, primary=False)
    s.text(x + 40, y + 450, "Später", size=12, color=MUTE)
    s.note(x + 40, y + 480, fw - 80, ["Magic-Link + Passkey statt Passwort:", "nichts zu merken, nichts zu vergessen.", "Daten liegen nicht im WordPress."], size=11)
    # Frame 3
    x = 1100
    s.browser(x, y, fw, fh, "finanzleser.de/plus/", title="3 · Mein Bereich (Plus)")
    s.text(x + 24, y + 66, "Guten Tag, Frau Berger", size=15, weight="700", family=SERIF)
    s.text(x + 24, y + 86, "Serie 6 Tage · 340 Punkte · Level 2 „Kenner“", size=11, color=MAGENTA)
    sections = [("Aktenkoffer (3)", ["Unterhaltsrechner · 1.096 €", "Checkliste Trennung", "Vergleich Hundekranken"]),
                ("Wächter", ["● Kfz-Wechselfrist 30.11. · WhatsApp", "● Kindergeld ändert sich · E-Mail", "○ Grundfreibetrag ändert sich"]),
                ("Wochenbrief", ["Themen: Familie, Steuern, Tiere", "Donnerstags · pausieren"]),
                ("Kassensturz", ["Letzter: 3. März · Nächster: September", "→ Jetzt wiederholen (8 Fragen)"])]
    yy = y + 104
    for title, its in sections:
        s.text(x + 24, yy, title, size=12, weight="700", color=MUTE)
        for k, it in enumerate(its):
            s.rect(x + 24, yy + 8 + k * 28, fw - 48, 24, fill=PAPER, stroke=LINE, r=6, sw=1)
            s.text(x + 34, yy + 24 + k * 28, it, size=11)
        yy += 16 + len(its) * 28 + 14
    s.text(x + 24, y + fh - 20, "Profil · Interessen · Daten löschen", size=11, color=MUTE)
    s.arrow(500, y + 300, 560, y + 300)
    s.arrow(1030, y + 300, 1090, y + 300)
    s.note(40, 790, 1520, ["Plus ist kostenlos. Es schaltet frei: gesicherter Aktenkoffer, Wächter per E-Mail oder WhatsApp, gespeicherte Leo-Gespräche, Kassensturz-Wiederholung,",
                           "Sammelalbum und Belohnungen (Versicherungs-Check bei Finconext, PDF-Guides, Akademie-Vorteile). Interessen steuern den Wochenbrief und Leos Vorschläge."])
    s.legend([(GREEN, "Leo / Aktion"), (MAGENTA, "Spiel / Punkte"), (BOX, "Eingabe")])
    s.save("W7.svg")


def w8():
    s = Svg("W8 · Die Spiel-Schleife: tägliches Ritual, Punkte, Sammelalbum, Belohnung bei Finconext",
            "Was Menschen ohnehin gern spielen (Rätsel, Quiz, Schätzen), übersetzt in 30 Sekunden Finanzwissen pro Tag.")
    cx, cy, r = 500, 490, 265
    nodes = [
        (cx, cy - r, "Tägliches Ritual", ["Finanzfrage des Tages", "Schätzen oder Mythos/Fakt", "30 Sekunden, teilbar"], MAGENTA),
        (cx + r, cy, "Punkte + Serie", ["+20 Punkte je Antwort", "Serie zählt Tage", "Serien-Schutz 1× pro Woche"], MAGENTA),
        (cx, cy + r, "Sammelalbum + Level", ["12 Themen-Wappen", "Level: Einsteiger → Kenner → Lotse", "Fortschritt sichtbar"], MAGENTA),
        (cx - r, cy, "Belohnung", ["Versicherungs-Check bei Finconext", "PDF-Guide, Akademie-Vorteil", "Wochenbrief erinnert"], GREEN),
    ]
    for (nx, ny, t, rows, col) in nodes:
        s.rect(nx - 130, ny - 60, 260, 120, fill=PAPER, stroke=col, r=14, sw=2)
        s.text(nx, ny - 30, t, size=15, weight="700", anchor="middle", family=SERIF)
        for k, rr in enumerate(rows):
            s.text(nx, ny - 6 + k * 18, rr, size=11, anchor="middle", color=MUTE)
    import math
    for k in range(4):
        a1 = -math.pi / 2 + k * math.pi / 2 + 0.42
        a2 = -math.pi / 2 + (k + 1) * math.pi / 2 - 0.42
        x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
        x2, y2 = cx + r * math.cos(a2), cy + r * math.sin(a2)
        s.parts.append(f'<path d="M{x1:.0f},{y1:.0f} A{r},{r} 0 0 1 {x2:.0f},{y2:.0f}" fill="none" stroke="{MUTE}" stroke-width="2" marker-end="url(#ah)"/>')
    s.leo(cx, cy, r=40)
    s.text(cx, cy + 62, "Leo moderiert", size=12, anchor="middle", color=GREEN, weight="700")
    # rechts: Formate
    rx = 940
    s.text(rx, 150, "Bestehende Formate (bleiben, bekommen Punkte)", size=13, weight="700", color=MUTE)
    for k, (t, d) in enumerate([("Mythos oder Fakt", "Ticket-Frage, Auflösung schiebt sich ein"), ("Quiz", "Mehrfachauswahl, richtig/falsch"), ("Schätzfrage", "Zahl oder Schieberegler gegen Referenz"),
                                ("Rubbellos", "Freirubbeln mit Münz-Cursor"), ("Selbsttest", "Kurzer Test, aufklappbar"), ("Gewusst?", "Aha-Kasten")]):
        s.rect(rx, 162 + k * 46, 600, 38, fill=PAPER, stroke=LINE, r=8)
        s.parts.append(f'<rect x="{rx}" y="{162 + k * 46}" width="5" height="38" rx="2" fill="{MAGENTA}"/>')
        s.text(rx + 16, 186 + k * 46, t, size=12, weight="700")
        s.text(rx + 190, 186 + k * 46, d, size=11, color=MUTE)
    s.text(rx, 470, "Neue Formate (aus der Recherche)", size=13, weight="700", color=MUTE)
    for k, (t, d) in enumerate([("Finanzfrage des Tages", "Ein Rätsel täglich, Teilen-Raster wie bei Wordle"), ("Zahlen-Wordle", "Schätze den Wert in 5 Versuchen (z. B. Grundfreibetrag)"),
                                ("Wochen-Quiz", "5 Fragen aus den Artikeln der Woche, Rangliste freiwillig"), ("Sammelalbum", "Wappen je Thema: Haftpflicht, Hausrat, Hund, Steuer …"),
                                ("Kassensturz", "Selbsttest in 8 Fragen, Ergebnis sofort, Wiederholung in 6 Monaten")]):
        s.rect(rx, 482 + k * 46, 600, 38, fill=PAPER, stroke=MAGENTA, r=8, sw=1.2)
        s.text(rx + 16, 506 + k * 46, t, size=12, weight="700", color=MAGENTA)
        s.text(rx + 190, 506 + k * 46, d, size=11, color=MUTE)
    # Share-Grid
    s.text(rx, 750, "Teilen-Raster (Beispiel)", size=12, weight="700", color=MUTE)
    for k, row in enumerate(["🟩⬜⬜", "🟩🟩⬜", "🟩🟩🟩"]):
        s.text(rx, 775 + k * 22, row, size=14)
    s.text(rx + 90, 775, "Finanzfrage #143 · 3/5", size=12)
    s.text(rx + 90, 797, "Serie: 6 Tage", size=12)
    s.text(rx + 90, 819, "finanzleser.de/spiele/finanzfrage-143", size=12, color=GREEN)
    s.note(40, 860, 1520, ["Belohnungen zahlen aufs Maklergeschäft ein: Der „Versicherungs-Check“ ist ein Beratungstermin bei Finconext, freigeschaltet ab Level 2. Punkte sind nie Geld.",
                           "Jedes Spiel hat eine eigene Seite (/spiele/…), erscheint als Karte im Faden und kann in Ratgebern eingebettet bleiben."])
    s.legend([(MAGENTA, "Spiel / Punkte"), (GREEN, "Finconext / Leo")])
    s.save("W8.svg")


def w5b():
    """Ersetzt w5 (Feinschliff 03.09.): Der Server liefert den Faden mit der Kartenkette, keine Magazinseite."""
    s = Svg("W5 · Deep-Link: Vom Wochenbrief direkt in den Faden, ohne Umweg",
            "Der Link zeigt auf die normale Adresse. Der Server liefert den Faden mit der Kartenkette, Leo kommt im Browser dazu.")
    fw, fh = 340, 560
    y = 150
    # 1 Wochenbrief
    x = 40
    s.rect(x, y, fw, fh, fill=PAPER, stroke=INK, r=10)
    s.text(x + fw / 2, y - 12, "1 · Wochenbrief / WhatsApp", size=14, weight="700", anchor="middle")
    s.rect(x + 20, y + 20, fw - 40, 60, fill="#E8F5E1", stroke=GREEN, r=8)
    s.text(x + 34, y + 44, "Leos Wochenbrief · Ausgabe 143", size=13, weight="700")
    s.text(x + 34, y + 64, "Donnerstag, 10. September", size=11, color=MUTE)
    s.gray_lines(x + 20, y + 110, fw - 40, n=3, gap=10)
    s.rect(x + 20, y + 170, fw - 40, 80, fill=PAPER, stroke=GREEN, r=8)
    s.text(x + 34, y + 196, "Schlüssel weg: Zahlt die", size=13, weight="700")
    s.text(x + 34, y + 216, "Haftpflicht?", size=13, weight="700")
    s.text(x + 34, y + 238, "→ Mit Leo lesen", size=12, color=GREEN, weight="700")
    s.gray_lines(x + 20, y + 280, fw - 40, n=6, gap=10)
    s.rect(x + 20, y + 400, fw - 40, 110, fill="#DCFCE7", stroke="#16A34A", r=14)
    s.text(x + 34, y + 426, "WhatsApp · Wächter", size=12, weight="700", color="#166534")
    s.text(x + 34, y + 450, "Ihre Kfz-Frist endet am 30.11.", size=11)
    s.text(x + 34, y + 470, "Leo hat 3 Angebote geprüft.", size=11)
    s.text(x + 34, y + 492, "→ finanzleser.de/…/kfz-wechsel/", size=11, color=GREEN)
    # 2 Server
    x = 425
    s.browser(x, y, fw, fh, "finanzleser.de/versicherungen/haftpflicht/schluesselverlust/", title="2 · Server liefert den Faden")
    s.rect(x + 12, y + 44, fw - 24, 26, fill=BOX, stroke=BOX, r=4)
    s.text(x + 20, y + 61, "finanzleser   Finanzen  Versicherungen  Steuern  Recht", size=9, color=MUTE)
    s.card(x + 20, y + 90, fw - 40, 150, "Ratgeber · Kopfkarte", "Schlüsselverlust: Wann die …",
           lambda bx, by, bw, bh: (s.text(bx, by - 2, "Versicherungen › Haftpflicht", size=9, color=MUTE), s.rect(bx, by + 8, 70, 50, fill=BOX2, stroke=BOX2, r=4), s.gray_lines(bx + 80, by + 12, bw - 80, n=3, gap=7, h=5)), footer=False)
    s.card(x + 20, y + 252, fw - 40, 120, "Abschnitt 1", "Was mitversichert ist", lambda bx, by, bw, bh: s.gray_lines(bx, by + 6, bw, n=4, gap=7, h=5), footer=False)
    s.card(x + 20, y + 384, fw - 40, 100, "Abschnitt 2", "Berufliche Schlüssel", lambda bx, by, bw, bh: s.gray_lines(bx, by + 6, bw, n=3, gap=7, h=5), footer=False)
    s.text(x + 20, y + 510, "… FAQ · Fazit · Wochenbrief-Karte", size=10, color=MUTE)
    s.text(x + 20, y + 545, "Volltext im HTML · Metadata · JSON-LD · Canonical", size=10, color=GREEN, weight="700")
    # 3 Leo kommt dazu
    x = 810
    s.browser(x, y, fw, fh, "finanzleser.de/versicherungen/haftpflicht/schluesselverlust/", title="3 · Leo und Verlauf kommen dazu")
    s.rect(x + 12, y + 44, fw - 24, 26, fill=BOX, stroke=BOX, r=4)
    s.text(x + 20, y + 61, "finanzleser   Finanzen  Versicherungen  Steuern  Recht", size=9, color=MUTE)
    s.leo(x + 34, y + 96, r=13)
    s.rect(x + 54, y + 82, fw - 74, 46, fill=PAPER, stroke=LINE, r=12)
    s.text(x + 64, y + 100, "Willkommen zurück. Sie haben den", size=10)
    s.text(x + 64, y + 116, "Wochenbrief-Artikel geöffnet:", size=10)
    s.card(x + 20, y + 150, fw - 40, 150, "Ratgeber · Kopfkarte", "Schlüsselverlust: Wann die …",
           lambda bx, by, bw, bh: (s.text(bx, by - 2, "Versicherungen › Haftpflicht", size=9, color=MUTE), s.rect(bx, by + 8, 70, 50, fill=BOX2, stroke=BOX2, r=4), s.gray_lines(bx + 80, by + 12, bw - 80, n=3, gap=7, h=5)))
    s.card(x + 20, y + 312, fw - 40, 120, "Abschnitt 1", "Was mitversichert ist", lambda bx, by, bw, bh: s.gray_lines(bx, by + 6, bw, n=4, gap=7, h=5), footer=False)
    s.rect(x + 20, y + 490, fw - 40, 40, fill=PAPER, stroke=GREEN, r=20, sw=2)
    s.text(x + 34, y + 515, "Fragen Sie Leo …", size=11, color=MUTE)
    s.text(x + 20, y + 550, "Gleicher Inhalt, dazu Leo, Verlauf, Sprungleiste", size=10, color=GREEN, weight="700")
    # 4 Einwuerfe
    x = 1195
    s.browser(x, y, fw, fh, "…/schluesselverlust/  (URL unverändert)", title="4 · Leo ergänzt, Nutzer fragt weiter")
    s.rect(x + 20, y + 50, fw - 40, 40, fill=PAPER, stroke=LINE, r=10)
    s.text(x + 30, y + 74, "▸ Schlüsselverlust: Wann die Haftpflicht …", size=10, color=MUTE)
    s.card(x + 20, y + 110, fw - 40, 130, "Statistik", "9 von 10 Tarifen decken es",
           lambda bx, by, bw, bh: [s.rect(bx + k * 62, by + 50 - int(v * 40), 44, int(v * 40), fill=GREEN, stroke=GREEN, r=3) for k, v in enumerate([0.9, 0.8, 0.6, 0.5])],
           footer=False, reason="Leo wirft ein")
    s.card(x + 20, y + 270, fw - 40, 120, "Anbieter", "Tarife der Finconext-Partner",
           lambda bx, by, bw, bh: s.button(bx, by + 10, "Angebot berechnen", w=160), footer=False, accent=MAGENTA, reason="Leo wirft ein")
    s.rect(x + 100, y + 410, fw - 120, 36, fill=BOX2, stroke=BOX2, r=12)
    s.text(x + 112, y + 432, "Und bei einem Tresorschlüssel?", size=10)
    s.leo(x + 34, y + 480, r=13)
    s.rect(x + 54, y + 466, fw - 74, 40, fill=PAPER, stroke=LINE, r=12)
    s.text(x + 64, y + 484, "Das ist ein Sonderfall. Laut AVB …", size=10)
    s.rect(x + 20, y + 515, fw - 40, 34, fill=PAPER, stroke=GREEN, r=17, sw=2)
    for xx in (40, 425, 810):
        s.arrow(xx + fw + 8, y + fh / 2, xx + fw + 40, y + fh / 2)
    s.note(40, 760, 740, ["Es gibt keine separate Magazinseite mehr. Die Adresse liefert den Faden mit der Kartenkette, vollständig im HTML.",
                          "Ein Mensch sieht deshalb nie eine andere Seite als den Faden. Der Zurück-Knopf schließt die zuletzt geöffnete Karte.",
                          "Teilen-Link = dieselbe Adresse; „Abschnitt teilen“ hängt die Stelle an (…/schluesselverlust/#sofort-tun)."])
    s.note(820, 760, 740, ["Der Wächter (WhatsApp/E-Mail) verlinkt genauso. Alle heutigen Links, Google-Treffer und Lesezeichen funktionieren weiter.",
                           "Suchmaschinen und KI-Suche lesen dieselbe Adresse: Kopfkarte, Abschnitte, FAQ, Fazit als semantischer Artikel.",
                           "Kein „App öffnen“, kein zweites System."])
    s.legend([(GREEN, "Leo / Aktion"), (MAGENTA, "Finconext"), (BOX2, "Platzhalter")])
    s.save("W5.svg")


def w6b():
    """Ersetzt w6: Eine Adresse, ein Inhalt. Suchmaschine bekommt den Faden ohne Leo, der Mensch mit Leo."""
    s = Svg("W6 · Eine Adresse, ein Inhalt: Was der Server schickt und was der Mensch sieht",
            "Die Seite ist der Faden. Suchmaschinen bekommen ihn ohne Leo, Menschen mit Leo. Keine zweite Ansicht, nichts zum Wechseln.")
    url = "www.finanzleser.de/finanztools/rechner/unterhaltsrechner/"
    s.rect(400, 120, 800, 44, fill="#E8F5E1", stroke=GREEN, r=22, sw=2)
    s.text(800, 148, url, size=16, weight="700", anchor="middle", color=GREEN)
    s.arrow(600, 168, 470, 198)
    s.arrow(1000, 168, 1130, 198)
    s.text(420, 222, "Was der Server schickt (Suchmaschine, KI-Suche, ohne JavaScript)", size=14, weight="700", anchor="middle")
    s.browser(80, 230, 680, 520, url)
    x, y = 80, 230
    s.rect(x + 12, y + 44, 656, 26, fill=BOX, stroke=BOX, r=4)
    s.text(x + 20, y + 61, "finanzleser   Finanzen  Versicherungen  Steuern  Recht  Finanztools  Anbieter", size=10, color=MUTE)
    s.rect(x + 1, y + 70, 150, 449, fill=BOX, stroke=BOX, r=0)
    s.text(x + 14, y + 92, "Verlauf (leer)", size=10, weight="700", color=MUTE)
    s.card(x + 165, y + 90, 300, 240, "Rechner", "Unterhaltsrechner 2026",
           lambda bx, by, bw, bh: (s.text(bx, by - 2, "Finanztools › Rechner", size=9, color=MUTE), s.rect(bx, by + 10, bw, 26, fill=BOX, stroke=LINE, r=6, sw=1), s.rect(bx, by + 44, bw, 26, fill=BOX, stroke=LINE, r=6, sw=1),
                                   s.rect(bx, by + 82, bw, 40, fill="#E8F5E1", stroke=GREEN, r=8), s.text(bx + 12, by + 108, "Ergebnis nach Eingabe", size=12, color=GREEN, weight="700")))
    s.card(x + 165, y + 345, 300, 150, "Häufige Fragen", "So funktioniert die Tabelle", lambda bx, by, bw, bh: s.gray_lines(bx, by + 6, bw, n=5, gap=8, h=5), footer=False)
    for k, b in enumerate(["Title + Description", "Canonical", "JSON-LD WebApplication/FAQ", "Sitemap-Eintrag", "Volltext im HTML"]):
        s.rect(x + 480, y + 100 + k * 46, 180, 34, fill="#E8F5E1", stroke=GREEN, r=8)
        s.text(x + 570, y + 122 + k * 46, "✓ " + b, size=11, anchor="middle", color="#166534", weight="600")
    s.text(x + 480, y + 350, "Kein Leo, keine Einwürfe.", size=11, color=MUTE)
    s.text(x + 480, y + 368, "Derselbe Faden, still.", size=11, color=MUTE)
    s.text(1180, 222, "Was der Mensch sieht (nach dem Laden)", size=14, weight="700", anchor="middle")
    s.browser(840, 230, 680, 520, url)
    x = 840
    s.rect(x + 12, y + 44, 656, 26, fill=BOX, stroke=BOX, r=4)
    s.text(x + 20, y + 61, "finanzleser   Finanzen  Versicherungen  Steuern  Recht  Finanztools   Wochenbrief   Plus", size=10, color=MUTE)
    s.rect(x + 1, y + 70, 150, 449, fill=BOX, stroke=BOX, r=0)
    s.text(x + 14, y + 92, "Verlauf", size=10, weight="700", color=MUTE)
    for k in range(4):
        s.rect(x + 10, y + 102 + k * 30, 132, 22, fill=PAPER, stroke=LINE, r=6, sw=1)
    s.leo(x + 180, y + 96, r=13)
    s.rect(x + 200, y + 82, 300, 40, fill=PAPER, stroke=LINE, r=12)
    s.text(x + 210, y + 100, "Ich habe den Rechner geöffnet.", size=10)
    s.text(x + 210, y + 114, "Nettoeinkommen eintragen?", size=10)
    s.card(x + 165, y + 135, 300, 240, "Rechner", "Unterhaltsrechner 2026",
           lambda bx, by, bw, bh: (s.text(bx, by - 2, "Finanztools › Rechner", size=9, color=MUTE), s.rect(bx, by + 10, bw, 26, fill=BOX, stroke=LINE, r=6, sw=1), s.rect(bx, by + 44, bw, 26, fill=BOX, stroke=LINE, r=6, sw=1),
                                   s.rect(bx, by + 82, bw, 40, fill="#E8F5E1", stroke=GREEN, r=8), s.text(bx + 12, by + 108, "1.096 € / Monat", size=14, weight="700", color=GREEN)))
    s.card(x + 480, y + 135, 180, 120, "Statistik", "Ø Unterhalt", lambda bx, by, bw, bh: s.gray_lines(bx, by + 8, bw, n=3), footer=False, reason="Leo")
    s.card(x + 480, y + 270, 180, 105, "Spiel", "Schätzfrage", lambda bx, by, bw, bh: s.gray_lines(bx, by + 8, bw, n=2), footer=False, accent=MAGENTA, reason="Leo")
    s.rect(x + 165, y + 400, 495, 40, fill=PAPER, stroke=GREEN, r=20, sw=2)
    s.text(x + 180, y + 425, "Fragen Sie Leo oder springen Sie: „unter…“", size=11, color=MUTE)
    s.text(x + 165, y + 470, "Derselbe Rechner, derselbe Text. Dazu: Leo, Verlauf, Einwürfe, Sprungleiste.", size=11, color=GREEN, weight="700")
    ty = 790
    rows = [("Text, Titel, Metadaten, JSON-LD, Canonical", "identisch", "identisch"),
            ("Kartenkette, Rechner, Checkliste, Vergleich", "vollständig im HTML", "bedienbar, mit Ergebnis"),
            ("Leo-Begrüßung, Einwürfe, Verlauf, Aktenkoffer, Sprungleiste", "nicht vorhanden", "kommen im Browser dazu"),
            ("Eine zweite „Magazin-Ansicht“", "gibt es nicht", "gibt es nicht")]
    s.text(80, ty, "Merkmal", size=12, weight="700", color=MUTE)
    s.text(600, ty, "Suchmaschine", size=12, weight="700", color=MUTE)
    s.text(1000, ty, "Mensch", size=12, weight="700", color=MUTE)
    s.line(80, ty + 8, 1520, ty + 8, color=LINE)
    for k, (a, b, c) in enumerate(rows):
        yy = ty + 32 + k * 26
        s.text(80, yy, a, size=12)
        s.text(600, yy, b, size=12, color=INK)
        s.text(1000, yy, c, size=12, color=INK)
    s.legend([(GREEN, "SEO-Bausteine / Leo"), (MAGENTA, "Spiel"), (BOX, "Verlauf")])
    s.save("W6.svg")


def w9():
    s = Svg("W9 · Navigation: Das Menü antwortet in den Faden",
            "Drei Wege, ein Ort: Register oben, Übersichtskarte im Faden, Sprungleiste in der Eingabe. Jeder Ratgeber in höchstens drei Tipps.")
    # Register
    x, y, w = 40, 130, 1020
    s.rect(x, y, w, 50, fill=PAPER, stroke=INK, r=10)
    s.text(x + 18, y + 31, "finanzleser", size=15, weight="700", family=SERIF, color=GREEN)
    reg = ["Finanzen", "Versicherungen", "Steuern", "Recht", "Finanztools", "Anbieter"]
    xx = x + 150
    for r in reg:
        wdt = len(r) * 8 + 24
        if r == "Versicherungen":
            s.rect(xx, y + 10, wdt, 30, fill="#E8F5E1", stroke=GREEN, r=8, sw=1.5)
            s.text(xx + wdt / 2, y + 30, r, size=13, weight="700", anchor="middle", color=GREEN)
        else:
            s.text(xx + wdt / 2, y + 30, r, size=13, weight="600", anchor="middle")
        xx += wdt + 10
    s.button(x + w - 240, y + 10, "Wochenbrief · Do.", w=120, primary=True)
    s.button(x + w - 110, y + 10, "Plus", w=100, primary=False)
    s.text(x, y - 12, "① Register (oben, immer sichtbar)", size=13, weight="700", color=MUTE)
    s.arrow(x + 930, y + 52, x + 930, y + 84)
    s.text(x + 480, y + 72, "Ein Tipp legt die Übersichtskarte ans Ende des Fadens. Kein Seitenwechsel.", size=11, color=GREEN, italic=True)
    # Uebersichtskarte
    cy = y + 100
    s.text(x, cy - 12, "② Übersichtskarte „Versicherungen“ (die Rubrikseite als Karte)", size=13, weight="700", color=MUTE)
    s.leo(x + 16, cy + 16)
    s.rect(x + 40, cy, 500, 40, fill=PAPER, stroke=LINE, r=14)
    s.text(x + 54, cy + 25, "Versicherungen: 6 Themen, 84 Ratgeber. Wonach suchen Sie?", size=12)

    def body_ue(bx, by, bw, bh):
        s.text(bx, by - 2, "Versicherungen", size=10, color=MUTE)
        cx2 = bx
        for t in ["Haftpflicht", "Hausrat", "Kfz", "Tier", "Rechtsschutz", "Unfall", "Wohngebäude"]:
            wdt = len(t) * 7 + 22
            s.chip(cx2, by + 8, t, w=wdt, size=11)
            cx2 += wdt + 8
        s.text(bx, by + 60, "Neu und meistgelesen", size=10, color=MUTE, weight="700")
        for k, (t, m) in enumerate([("Schlüsselverlust: Wann die Haftpflicht zahlt", "4 Min."), ("Hundekranken: OP-Schutz oder Vollschutz?", "6 Min."), ("Hausrat: Was bei Einbruch zählt", "5 Min.")]):
            s.rect(bx + k * 240, by + 70, 228, 120, fill=BOX, stroke=LINE, r=10)
            s.rect(bx + k * 240, by + 70, 228, 56, fill=BOX2, stroke=BOX2, r=10)
            s.text(bx + 10 + k * 240, by + 146, t[:34] + ("…" if len(t) > 34 else ""), size=11, weight="700")
            s.text(bx + 10 + k * 240, by + 166, "Ratgeber · " + m, size=10, color=MUTE)
        s.text(bx + 730, by + 140, "›", size=28, color=MUTE)
        s.rect(bx, by + 206, 300, 30, fill=PAPER, stroke=LINE, r=15, sw=1)
        s.text(bx + 14, by + 226, "Alle 84 Ratgeber filtern …", size=11, color=MUTE)
        s.chip(bx + 320, by + 208, "Alle anzeigen", w=110, size=11, stroke=LINE, color=MUTE)
    s.card(x + 40, cy + 60, w - 40, 340, "Übersicht", "Versicherungen", body_ue)
    s.text(x + 40, cy + 420, "▸ Versicherungen › Haftpflicht", size=11, color=MUTE)
    s.text(x + 260, cy + 420, "← Nach dem Tipp auf ein Thema faltet sich die Übersicht zu dieser Zeile und bleibt im Verlauf.", size=11, color=GREEN, italic=True)
    # Sprungleiste
    sy = cy + 450
    s.text(x, sy - 12, "③ Sprungleiste: die Eingabe springt, bevor sie fragt", size=13, weight="700", color=MUTE)
    s.rect(x + 40, sy + 130, w - 40, 54, fill=PAPER, stroke=GREEN, r=27, sw=2)
    s.text(x + 62, sy + 163, "unter|", size=15)
    s.circle(x + w - 28, sy + 157, 18, fill=GREEN, stroke=GREEN)
    s.rect(x + 40, sy, w - 40, 124, fill=PAPER, stroke=LINE, r=12)
    vorschl = [("Rechner", GREEN, "Unterhaltsrechner 2026"), ("Ratgeber", GREEN, "Unterhaltsvorschuss: Wer ihn bekommt"), ("Ratgeber", GREEN, "Düsseldorfer Tabelle 2026"), ("Checkliste", GREEN, "Trennung mit Kindern"), ("Leo fragen", MAGENTA, "„unter…“ als Frage an Leo")]
    for k, (t, c, v) in enumerate(vorschl):
        yy = sy + 22 + k * 20
        s.rect(x + 56, yy - 8, 8, 8, fill=c, stroke=c, r=2)
        s.text(x + 72, yy, t, size=10, color=MUTE, weight="700")
        s.text(x + 170, yy, v, size=12)
    s.text(x + 60, sy + 205, "Vorschläge aus einem lokalen Index, ohne Wartezeit. Enter ohne Auswahl = Frage an Leo. Sprache: „Unterhaltsrechner“ genügt.", size=11, color=MUTE)
    # rechte Spalte
    rx = 1060
    s.note(rx, 130, 500, ["Warum das schnell ist:", "· Register → Thema → Teaser: jeder Ratgeber in drei Tipps", "· Ein Wort in die Sprungleiste: ein Tipp", "· Brotkrumen in jeder Kopfkarte führen zurück zur Übersicht", "· Verlauf links = alles, was heute offen war", "· Nichts verlässt den Faden, nichts lädt neu"])
    s.note(rx, 290, 500, ["Übersichtskarten gibt es für:", "· 4 Rubriken (Finanzen, Versicherungen, Steuern, Recht)", "· jedes Thema (Subkategorie), z. B. Haftpflicht", "· Finanztools mit Reitern Rechner · Checklisten · Vergleiche", "· Anbieter (147) und Dokumente, mit Filterfeld", "Jede Übersichtskarte ist zugleich die Adresse der heutigen Übersichtsseite."])
    s.note(rx, 450, 500, ["Für die ältere Zielgruppe:", "· keine Aufklapp-Menüs, keine Hover-Zustände", "· große Chips, immer sichtbare Eingabe", "· Leo sagt bei jeder Übersicht in einem Satz, was drin ist", "· Vorlesen und Sprechen an derselben Stelle"])
    s.note(rx, 590, 500, ["Mobil: Register als wischbare Chip-Reihe unter dem Logo,", "Übersichtskarte mit Teaser-Strip zum Wischen,", "Sprungleiste öffnet über der Eingabe nach oben."])
    # Mini-Mobil
    px, py, pw, ph = rx + 20, 720, 200, 230
    s.phone(px, py, pw, ph)
    s.text(px + 16, py + 40, "finanzleser", size=11, weight="700", family=SERIF, color=GREEN)
    cx2 = px + 12
    for t in ["Finanzen", "Versich…", "Steuern", "Recht"]:
        wdt = len(t) * 6 + 14
        s.chip(cx2, py + 52, t, w=wdt, size=9, stroke=LINE, color=INK)
        cx2 += wdt + 6
    s.rect(px + 12, py + 90, pw - 24, 70, fill=PAPER, stroke=LINE, r=8)
    s.parts.append(f'<rect x="{px + 12}" y="{py + 90}" width="4" height="70" rx="2" fill="{GREEN}"/>')
    s.text(px + 24, py + 108, "ÜBERSICHT", size=7, color=GREEN, weight="700")
    s.text(px + 24, py + 124, "Versicherungen", size=10, weight="700", family=SERIF)
    s.gray_lines(px + 24, py + 134, pw - 50, n=2, gap=5, h=4)
    s.rect(px + 12, py + ph - 40, pw - 24, 28, fill=PAPER, stroke=GREEN, r=14, sw=1.5)
    s.text(px + 24, py + ph - 22, "Fragen oder springen …", size=8, color=MUTE)
    s.text(px + pw + 16, py + 120, "Register als", size=11, color=MUTE)
    s.text(px + pw + 16, py + 138, "Chip-Reihe", size=11, color=MUTE)
    s.legend([(GREEN, "Leo / Aktion"), (MAGENTA, "Frage an Leo"), (BOX, "Platzhalter")])
    s.save("W9.svg")


def w10():
    s = Svg("W10 · Der Ratgeber als Kartenkette: Kopfkarte, Abschnitte, Fragen an Leo, Wochenbrief",
            "Der ganze Artikel steht immer ausgerollt im Faden. Die Kopfkarte zeigt Kurzfassung und Inhalt, die Chips springen zu den Abschnitten.")
    x, y, w = 60, 130, 700
    s.text(x, y - 12, "Versicherungen › Haftpflicht  (Brotkrumen: Tipp führt zur Übersichtskarte)", size=11, color=MUTE)

    def kopf(bx, by, bw, bh):
        s.rect(bx, by + 6, 170, 100, fill=BOX2, stroke=BOX2, r=6)
        s.text(bx + 185, by + 24, "Kurzfassung in drei Sätzen. Was der Artikel", size=11)
        s.text(bx + 185, by + 42, "klärt, für wen er gilt, was am Ende steht.", size=11)
        s.text(bx + 185, by + 66, "4 Min. · Redaktion · aktualisiert 1. Sept. 2026", size=10, color=MUTE)
        s.text(bx, by + 128, "Inhalt", size=10, color=MUTE, weight="700")
        cx2 = bx
        for t in ["Was mitversichert ist", "Berufliche Schlüssel", "Sofort tun", "Häufige Fragen"]:
            wdt = len(t) * 6.5 + 22
            s.chip(cx2, by + 136, t, w=int(wdt), size=10, stroke=LINE, color=INK)
            cx2 += wdt + 8
        s.button(bx, by + 176, "Kurzfassung von Leo", w=170, primary=False)
        s.text(bx + 185, by + 195, "Die Kette ist immer ganz ausgerollt. Die Inhalt-Chips springen zum Abschnitt.", size=10.5, color=MUTE)
    s.card(x, y, w, 285, "Ratgeber · Kopfkarte", "Schlüsselverlust: Wann die Haftpflicht zahlt", kopf)
    s.card(x, y + 300, w, 130, "Abschnitt 1 von 4", "Was „Schlüsselverlust“ in den Bedingungen bedeutet",
           lambda bx, by, bw, bh: (s.gray_lines(bx, by + 6, bw, n=3, gap=8, h=5), s.chip(bx, by + 52, "Leo: Und bei grober Fahrlässigkeit?", w=250, size=10)), footer=False)
    s.text(x + w - 130, y + 322, "Abschnitt teilen", size=10, color=MUTE)
    s.card(x, y + 445, w, 210, "Abschnitt 2 von 4", "Berufliche Schlüssel und Tresorschlüssel",
           lambda bx, by, bw, bh: (s.gray_lines(bx, by + 6, bw, n=2, gap=8, h=5),
                                   s.rect(bx, by + 40, bw, 80, fill=PAPER, stroke=LINE, r=10),
                                   s.parts.append(f'<rect x="{bx}" y="{by + 40}" width="5" height="80" rx="2" fill="{GREEN}"/>'),
                                   s.text(bx + 16, by + 58, "RECHNER · eingebettet in der Kette", size=9, color=GREEN, weight="700"),
                                   s.text(bx + 16, by + 80, "Lohnt sich die Selbstbeteiligung?", size=12, weight="700", family=SERIF),
                                   s.rect(bx + 16, by + 90, 200, 20, fill=BOX, stroke=LINE, r=5, sw=1),
                                   s.chip(bx, by + 132, "Leo: Was gilt bei Dienstschlüsseln?", w=250, size=10)), footer=False)
    s.text(x + w - 130, y + 467, "Abschnitt teilen", size=10, color=MUTE)
    s.text(x, y + 678, "… Abschnitt 3 · Häufige Fragen · Fazit", size=11, color=MUTE)
    s.card(x, y + 690, w, 105, "Leos Wochenbrief", "Die Antworten der Woche, donnerstags",
           lambda bx, by, bw, bh: (s.chip(bx, by + 2, "Kfz-Wechsel bis 30.11.", w=150, size=10), s.chip(bx + 160, by + 2, "Kindergeld 2026", w=120, size=10), s.chip(bx + 290, by + 2, "Hundekranken", w=110, size=10),
                                   s.rect(bx + 420, by + 2, 150, 26, fill=PAPER, stroke=GREEN, r=13, sw=1.5), s.text(bx + 432, by + 19, "ihre@adresse.de", size=10, color=MUTE), s.button(bx + 580, by, "Eintragen", w=84, size=11)), footer=False, accent=GREEN)
    # rechte Spalte
    rx = 820
    s.note(rx, 130, 740, ["Aufbau der Kette (aus dem heutigen Artikel automatisch ableitbar):", "· Kopfkarte: Brotkrumen, Titel, Bild, Kurzfassung, Lesezeit, Inhalt als Sprung-Chips, „Kurzfassung von Leo“", "· Abschnittskarten je Zwischenüberschrift, immer ausgerollt; Rechner, Checklisten, Vergleiche, Spiele stehen als Kästen in der Kette", "· nach jedem Abschnitt eine Frage an Leo („Weiterlesen mit Leo“), nie ein Pop-up", "· FAQ-Karte, Fazit-Karte, dann Wochenbrief-Karte und „Dazu passt“ (zwei Teaser)"])
    s.note(rx, 290, 740, ["Teilen:", "· „Teilen“ kopiert die Adresse des Ratgebers. Wer sie öffnet, landet im Faden, Kette ausgerollt.", "· „Abschnitt teilen“ hängt die Stelle an: …/schluesselverlust/#sofort-tun. Der Faden springt dorthin.", "· Die Adresse selbst ist ein Baustein für Suchmaschinen und KI-Suche. Ein Mensch sieht sie nur als Faden."])
    s.note(rx, 420, 740, ["Lesen ohne Überforderung:", "· Die Kette ist immer ganz da, wie ein Zeitungsartikel. Die Kopfkarte ist der Vorspann, die Chips das Inhaltsverzeichnis", "· Wer aus dem Wochenbrief oder von Google kommt, landet an der richtigen Stelle", "· „Kurzfassung von Leo“: drei Sätze mit Quelle, dann die Frage, ob er vorlesen soll", "· Ältere Kapitel im Faden falten sich zur Kopfzeile, das offene Kapitel bleibt ruhig"])
    s.note(rx, 550, 740, ["Wochenbrief als Ausgabe des Fadens:", "· Donnerstags legt Leo die Ausgabe (3 Themen, die Finanzfrage der Woche) als Karte in den Faden", "· Wer eingetragen ist, bekommt sie zusätzlich per E-Mail; jeder Link führt in den Faden", "· Eintragen an drei Stellen: Register-Knopf, Verlauf, Ende jeder Kette. Ein Feld, kein Formular."])
    s.rect(rx, 690, 740, 150, fill=PAPER, stroke=LINE, r=12)
    s.text(rx + 16, 714, "Verlauf (links) nach dem Lesen", size=11, weight="700", color=MUTE)
    for k, t in enumerate(["▸ Versicherungen", "▸ Versicherungen › Haftpflicht", "● Schlüsselverlust: Wann die Haftpflicht zahlt", "  Aktenkoffer (1) · Wochenbrief: eingetragen"]):
        s.text(rx + 16, 740 + k * 22, t, size=11, color=INK if k == 2 else MUTE, weight="700" if k == 2 else "400")
    s.legend([(GREEN, "Leo / Aktion / Wochenbrief"), (BOX2, "Platzhalter")])
    s.save("W10.svg")


RULE = "#D9D6CC"
NEWS = "#F7F6F1"


def masthead(s, x, y, w, pfad=None, aktiv=None):
    """Zeitungskopf: Logo, Datum, doppelte Linie, Ressort-Zeile (Register)."""
    s.rect(x, y, w, 96, fill=NEWS, stroke=NEWS, r=0)
    s.text(x + 24, y + 40, "finanzleser", size=26, weight="900", family=SERIF, color=INK)
    s.text(x + 200, y + 40, "Donnerstag, 3. September 2026 · Ausgabe 143 des Fadens", size=11, color=MUTE)
    s.button(x + w - 250, y + 16, "Wochenbrief", w=110, primary=True)
    s.button(x + w - 130, y + 16, "Plus", w=90, primary=False)
    s.line(x, y + 58, x + w, y + 58, color=INK, sw=2)
    s.line(x, y + 62, x + w, y + 62, color=INK, sw=0.8)
    xx = x + 24
    for r in ["Finanzen", "Versicherungen", "Steuern", "Recht", "Finanztools", "Anbieter"]:
        wdt = len(r) * 8 + 8
        if r == aktiv:
            s.rect(xx - 6, y + 68, wdt + 12, 24, fill=PAPER, stroke=INK, r=0, sw=1)
            s.text(xx + wdt / 2, y + 85, r, size=13, weight="700", anchor="middle")
        else:
            s.text(xx + wdt / 2, y + 85, r, size=13, weight="600", anchor="middle", color=INK)
        xx += wdt + 22
    if pfad:
        s.text(x + w - 24, y + 85, "Sie lesen: " + pfad, size=11, color=MUTE, anchor="end")
    s.line(x, y + 96, x + w, y + 96, color=RULE, sw=1)


def kasten(s, x, y, w, h, kicker, titel, body_fn=None, accent=INK):
    """Zeitungs-Kasten: duenne Linie, Kicker in Kapitaelchen, Serif-Titel. Kein Schatten, keine Rundung."""
    s.rect(x, y, w, h, fill=PAPER, stroke=RULE, r=2, sw=1)
    s.text(x + 16, y + 22, kicker.upper(), size=9.5, color=accent, weight="700")
    s.text(x + 16, y + 46, titel, size=15, weight="700", family=SERIF)
    if body_fn:
        body_fn(x + 16, y + 60, w - 32, h - 76)


def w2b():
    s = Svg("W2 · Der Faden im Zeitungsstil: Register oben, Kapitel unten, Eingabe fest",
            "Kein Chat-Look: Papier, dünne Linien, Serif-Titel. Ältere Kapitel falten sich zu einer Zeile. Das Menü lebt oben, nicht im Faden.")
    x, y, w, h = 40, 120, 1520, 810
    s.browser(x, y, w, h, "www.finanzleser.de/versicherungen/haftpflicht/schluesselverlust/")
    masthead(s, x + 1, y + 34, w - 2, pfad="Versicherungen › Haftpflicht", aktiv="Versicherungen")
    # Verlauf links
    rx = x + 1
    top = y + 132
    s.text(rx + 24, top + 20, "HEUTE IM FADEN", size=10, weight="700", color=MUTE)
    for k, (t, offen) in enumerate([("1 · Unterhaltsrechner 2026", False), ("2 · Hundekrankenversicherung", False), ("3 · Schlüsselverlust und Haftpflicht", True)]):
        s.text(rx + 24, top + 48 + k * 26, ("● " if offen else "○ ") + t, size=11, color=INK if offen else MUTE, weight="700" if offen else "400")
    s.line(rx + 24, top + 130, rx + 236, top + 130, color=RULE)
    for k, (a, b) in enumerate([("Aktenkoffer", "3"), ("Wächter", "2 aktiv"), ("Punkte", "340")]):
        s.text(rx + 24, top + 156 + k * 24, a, size=12, weight="700"); s.text(rx + 236, top + 156 + k * 24, b, size=12, color=MUTE, anchor="end")
    s.line(rx + 24, top + 236, rx + 236, top + 236, color=RULE)
    s.text(rx + 24, top + 262, "LEOS WOCHENBRIEF", size=10, weight="700", color=GREEN)
    s.text(rx + 24, top + 282, "Ausgabe 143 · Do., 10. September", size=11)
    s.rect(rx + 24, top + 292, 212, 26, fill=PAPER, stroke=RULE, r=2, sw=1)
    s.text(rx + 34, top + 309, "ihre@adresse.de · Eintragen", size=10, color=MUTE)
    s.text(rx + 24, top + 348, "FINANZFRAGE DES TAGES", size=10, weight="700", color=MAGENTA)
    s.text(rx + 24, top + 368, "🔥 Serie 6 Tage · Sammelalbum 4/12", size=11)
    s.text(rx + 24, y + h - 60, "Was Suchmaschinen sehen", size=11, color=MUTE)
    s.line(rx + 260, top, rx + 260, y + h - 1, color=RULE)
    # Kapitel gefaltet
    cx = x + 300; cw = 720
    s.line(cx, top + 10, cx + cw, top + 10, color=RULE)
    s.text(cx, top + 30, "KAPITEL 1 · FINANZTOOLS › RECHNER · 14:02", size=9.5, weight="700", color=MUTE)
    s.text(cx, top + 52, "Unterhaltsrechner 2026 · 1.096 € / Monat", size=15, weight="700", family=SERIF)
    s.text(cx + cw, top + 52, "aufklappen ▾", size=11, color=MUTE, anchor="end")
    s.line(cx, top + 68, cx + cw, top + 68, color=RULE)
    s.text(cx, top + 88, "KAPITEL 2 · VERSICHERUNGEN › TIER · 14:18", size=9.5, weight="700", color=MUTE)
    s.text(cx, top + 110, "Hundekrankenversicherung: OP-Schutz oder Vollschutz?", size=15, weight="700", family=SERIF)
    s.text(cx + cw, top + 110, "aufklappen ▾", size=11, color=MUTE, anchor="end")
    s.line(cx, top + 126, cx + cw, top + 126, color=RULE)
    # Kapitel 3 offen
    s.text(cx, top + 148, "KAPITEL 3 · VERSICHERUNGEN › HAFTPFLICHT · 14:32", size=9.5, weight="700", color=MUTE)
    s.rect(cx, top + 160, cw, 40, fill=NEWS, stroke=NEWS, r=0)
    s.text(cx + 12, top + 176, "IHRE FRAGE", size=9.5, weight="700", color=MUTE)
    s.text(cx + 12, top + 193, "Zahlt meine Haftpflicht, wenn ich den Schlüssel der Mietwohnung verliere?", size=13, family=SERIF, italic=True)
    s.leo(cx + 14, top + 226, r=12)
    s.text(cx + 34, top + 231, "LEO", size=9.5, weight="700", color=GREEN)
    s.lines(cx, top + 254, ["Ja, wenn „Schlüsselverlust“ mitversichert ist. Das gilt bei 9 von 10 Tarifen unserer Partner, meist bis 30.000 €.",
                            "Quelle: AVB Ammerländer Privathaftpflicht, § 4 Abs. 2, Seite 12. Der Ratgeber dazu, ganz ausgerollt:"], size=12.5, lh=19)
    s.line(cx, top + 300, cx + cw, top + 300, color=RULE)
    s.text(cx, top + 320, "RATGEBER · VERSICHERUNGEN › HAFTPFLICHT · 4 MIN.", size=9.5, weight="700", color=GREEN)
    s.text(cx, top + 350, "Schlüsselverlust: Wann die Haftpflicht zahlt", size=24, weight="900", family=SERIF)
    s.text(cx, top + 372, "Ein verlorener fremder Schlüssel kann eine ganze Schließanlage kosten. Was die Bedingungen dazu sagen.", size=12.5, color=MUTE, italic=True)
    s.rect(cx, top + 386, 220, 90, fill=BOX2, stroke=BOX2, r=0)
    s.gray_lines(cx + 236, top + 392, cw - 236, n=5, gap=9, h=5)
    s.text(cx + 236, top + 472, "Inhalt: Was mitversichert ist · Berufliche Schlüssel · Sofort tun · Häufige Fragen", size=10.5, color=MUTE)
    s.text(cx, top + 508, "Was „Schlüsselverlust“ in den Bedingungen bedeutet", size=16, weight="700", family=SERIF)
    s.gray_lines(cx, top + 520, cw, n=3, gap=9, h=5)
    s.text(cx, top + 574, "Leo: Und bei grober Fahrlässigkeit?  ·  Abschnitt teilen", size=11, color=GREEN, weight="700")
    s.text(cx, top + 596, "… Abschnitt 2 mit Statistik-Kasten · Abschnitt 3 mit Checkliste · Häufige Fragen · Fazit · Wochenbrief · Dazu passt", size=10.5, color=MUTE)
    # Eingabe
    s.rect(cx, y + h - 74, cw, 46, fill=PAPER, stroke=INK, r=2, sw=1.2)
    s.text(cx + 16, y + h - 46, "Fragen Sie Leo … oder springen Sie: „Unterhalt“", size=13, color=MUTE)
    s.text(cx + cw - 16, y + h - 46, "🎤   ➤", size=14, anchor="end")
    s.text(cx, y + h - 14, "Was kostet das?   ·   Checkliste Schlüsselverlust   ·   Vorlesen", size=11, color=GREEN, weight="700")
    # rechte Spalte
    rr = x + 1060
    s.line(rr - 20, top, rr - 20, y + h - 1, color=RULE)
    s.text(rr, top + 20, "LEO SCHLÄGT VOR", size=10, weight="700", color=MUTE)
    for k, (kk, t) in enumerate([("Checkliste", "Nach dem Schlüsselverlust"), ("Rechner", "Selbstbeteiligung lohnt?"), ("Spiel", "Mythos oder Fakt: Nachschlüssel")]):
        s.text(rr, top + 48 + k * 50, kk.upper(), size=9, weight="700", color=MAGENTA if kk == "Spiel" else GREEN)
        s.text(rr, top + 66 + k * 50, t, size=12.5, weight="700", family=SERIF)
        s.line(rr, top + 76 + k * 50, rr + 430, top + 76 + k * 50, color=RULE)
    s.note(rr, top + 220, 430, ["Was den Zeitungsstil ausmacht:", "· Papier statt Blasen: Leo und Leserfrage als Absätze mit Kicker", "· dünne Linien statt Schatten, keine gerundeten Kästen", "· Serif-Titel in drei Größen, Kicker in Kapitälchen", "· Farbe nur für Aktionen (Grün) und Spiele (Magenta)", "· eine Textspalte von 64 Zeichen, Kästen für Werkzeuge"])
    s.note(rr, top + 380, 430, ["Kapitel statt Chat-Verlauf:", "· jede Frage oder Auswahl eröffnet ein Kapitel", "· beim nächsten Kapitel faltet sich das vorige zur Kopfzeile", "· „aufklappen“ holt es zurück; links die Kapitelliste", "· das Menü erscheint nie im Faden, nur sein Ergebnis"])
    s.legend([(GREEN, "Leo / Aktion"), (MAGENTA, "Spiel"), (RULE, "Linien statt Kästen")])
    s.save("W2.svg")


def w9b():
    s = Svg("W9 · Navigation: Oben wird geblättert, unten wird gelesen",
            "Das Register klappt als Registerblatt unter der Kopfzeile auf. Die Auswahl legt nur den Inhalt in den Faden, das Blatt klappt wieder ein.")
    x, y, w = 40, 130, 1020
    s.text(x, y - 12, "① Register mit aufgeklapptem Registerblatt „Versicherungen“", size=13, weight="700", color=MUTE)
    masthead(s, x, y, w, aktiv="Versicherungen")
    # Registerblatt
    by = y + 97
    s.rect(x, by, w, 330, fill=NEWS, stroke=RULE, r=0, sw=1)
    s.line(x, by + 330, x + w, by + 330, color=INK, sw=1.5)
    s.text(x + 24, by + 28, "THEMEN", size=10, weight="700", color=MUTE)
    for k, t in enumerate(["Haftpflicht", "Hausrat", "Kfz", "Tier", "Rechtsschutz", "Unfall", "Wohngebäude", "Alle 84 Ratgeber"]):
        s.text(x + 24, by + 56 + k * 26, ("› " if k == 0 else "   ") + t, size=13, weight="700" if k == 0 else "400", color=INK if k < 7 else MUTE)
    s.line(x + 220, by + 16, x + 220, by + 314, color=RULE)
    s.text(x + 244, by + 28, "HAFTPFLICHT · NEU UND MEISTGELESEN", size=10, weight="700", color=MUTE)
    for k, (t, m) in enumerate([("Schlüsselverlust: Wann die Haftpflicht zahlt", "Ratgeber · 4 Min."), ("Mietsachschäden: Was der Vermieter verlangen darf", "Ratgeber · 5 Min."), ("Deliktunfähige Kinder: Wer haftet?", "Ratgeber · 4 Min."), ("Gefälligkeitsschäden beim Umzug", "Ratgeber · 3 Min."), ("Privathaftpflicht-Vergleich", "Vergleich · 6 Partner")]):
        s.text(x + 244, by + 60 + k * 50, t, size=14, weight="700", family=SERIF)
        s.text(x + 244, by + 78 + k * 50, m, size=10.5, color=MUTE)
        s.line(x + 244, by + 88 + k * 50, x + 700, by + 88 + k * 50, color=RULE, sw=0.8)
    s.line(x + 724, by + 16, x + 724, by + 314, color=RULE)
    s.text(x + 748, by + 28, "WERKZEUGE ZUM THEMA", size=10, weight="700", color=MUTE)
    for k, t in enumerate(["Rechner: Selbstbeteiligung lohnt?", "Checkliste: Nach dem Schlüsselverlust", "Vergleich: Privathaftpflicht", "Spiel: Mythos oder Fakt"]):
        s.text(x + 748, by + 60 + k * 30, t, size=12, color=INK)
    s.rect(x + 748, by + 200, 250, 30, fill=PAPER, stroke=RULE, r=2, sw=1)
    s.text(x + 760, by + 220, "Im Thema filtern …", size=11, color=MUTE)
    s.text(x + 748, by + 262, "Anbieter im Thema: Ammerländer, Haftpflichtkasse, VHV", size=10.5, color=MUTE)
    s.text(x + w - 24, by + 12, "Esc · außerhalb tippen · schließen ✕", size=10, color=MUTE, anchor="end")
    # Faden darunter
    fy = by + 372
    s.text(x, fy - 12, "② Der Faden bleibt, wie er war: nur der gewählte Ratgeber kommt dazu, als neues Kapitel", size=13, weight="700", color=MUTE)
    s.line(x, fy, x + w, fy, color=RULE)
    s.text(x, fy + 20, "KAPITEL 2 · VERSICHERUNGEN › TIER · 14:18", size=9.5, weight="700", color=MUTE)
    s.text(x, fy + 42, "Hundekrankenversicherung: OP-Schutz oder Vollschutz?", size=15, weight="700", family=SERIF)
    s.text(x + w, fy + 42, "aufklappen ▾", size=11, color=MUTE, anchor="end")
    s.line(x, fy + 58, x + w, fy + 58, color=RULE)
    s.text(x, fy + 80, "KAPITEL 3 · VERSICHERUNGEN › HAFTPFLICHT · 14:32", size=9.5, weight="700", color=MUTE)
    s.leo(x + 14, fy + 104, r=12)
    s.text(x + 34, fy + 109, "LEO", size=9.5, weight="700", color=GREEN)
    s.text(x, fy + 132, "Hier ist der Ratgeber, ganz ausgerollt. Fragen Sie mich zu jedem Abschnitt.", size=12.5)
    s.text(x, fy + 162, "RATGEBER · 4 MIN.", size=9.5, weight="700", color=GREEN)
    s.text(x, fy + 188, "Schlüsselverlust: Wann die Haftpflicht zahlt", size=20, weight="900", family=SERIF)
    s.gray_lines(x, fy + 202, 640, n=2, gap=9, h=5)
    # Sprungleiste rechts unten
    sx = x + 700
    s.text(sx, fy + 96, "③ Sprungleiste in der Eingabe", size=13, weight="700", color=MUTE)
    s.rect(sx, fy + 106, 320, 96, fill=PAPER, stroke=RULE, r=2, sw=1)
    for k, (t, v) in enumerate([("Rechner", "Unterhaltsrechner 2026"), ("Ratgeber", "Düsseldorfer Tabelle 2026"), ("Leo fragen", "„unter…“")]):
        s.text(sx + 12, fy + 128 + k * 24, t.upper(), size=9, weight="700", color=MAGENTA if t == "Leo fragen" else MUTE)
        s.text(sx + 100, fy + 128 + k * 24, v, size=12)
    s.rect(sx, fy + 210, 320, 36, fill=PAPER, stroke=INK, r=2, sw=1.2)
    s.text(sx + 12, fy + 233, "unter|", size=13)
    # rechte Spalte
    rx = 1100
    s.note(rx, 130, 460, ["Warum das den Verlauf sauber hält:", "· Das Blatt ist Teil der Kopfzeile, nicht des Fadens", "· Auswahl → Blatt klappt ein, Inhalt kommt als Kapitel", "· Register merkt sich den Ort: „Sie lesen: Versicherungen › Haftpflicht“", "· Erneutes Tippen auf das Ressort öffnet das Blatt wieder", "· Kein Rubrik-Sprung erzeugt jemals eine Karte im Faden"])
    s.note(rx, 300, 460, ["Aufbau des Registerblatts (drei Spalten):", "· links Themen der Rubrik, „Alle 84 Ratgeber“ als Liste mit Filter", "· Mitte: Neu und meistgelesen des gewählten Themas, als Zeitungsliste", "· rechts: Werkzeuge zum Thema (Rechner, Checkliste, Vergleich, Spiel) und Anbieter", "· Finanztools: links die drei Reiter, Mitte die Liste, rechts Filter", "· Mobil: Blatt fährt als Vollbild von oben ein, Themen als Reihe, Liste darunter"])
    s.note(rx, 490, 460, ["Adresse: Das Blatt „Versicherungen“ ist zugleich die heutige Übersichtsseite", "/versicherungen/. Suchmaschinen bekommen sie als Faden mit offenem Blatt.", "Für Menschen ist sie nur ein Zustand der Kopfzeile."])
    s.note(rx, 600, 460, ["Bedienung für Ältere:", "· ein Tipp öffnet, ein Tipp schließt, Esc schließt", "· keine Hover-Zustände, große Zeilen, klare Linien", "· Leo sagt beim Öffnen nichts (kein Geplapper), erst bei der Auswahl", "· Vorlesen: liest die Liste des Themas vor"])
    # Mini-Mobil
    px, py, pw, ph = rx + 20, 760, 180, 200
    s.phone(px, py, pw, ph)
    s.text(px + 14, py + 36, "finanzleser", size=10, weight="900", family=SERIF)
    s.line(px + 14, py + 44, px + pw - 14, py + 44, color=INK, sw=1)
    s.text(px + 14, py + 62, "Finanzen  Versich…  Steuern  Recht", size=8, weight="700")
    s.rect(px + 8, py + 70, pw - 16, 110, fill=NEWS, stroke=RULE, r=0, sw=1)
    s.text(px + 16, py + 88, "THEMEN", size=7, weight="700", color=MUTE)
    s.text(px + 16, py + 104, "Haftpflicht · Hausrat · Kfz · Tier", size=8)
    s.text(px + 16, py + 124, "NEU UND MEISTGELESEN", size=7, weight="700", color=MUTE)
    s.gray_lines(px + 16, py + 132, pw - 40, n=3, gap=6, h=4)
    s.text(px + pw + 14, py + 100, "Blatt fährt", size=11, color=MUTE)
    s.text(px + pw + 14, py + 118, "von oben ein", size=11, color=MUTE)
    s.legend([(GREEN, "Leo / Aktion"), (MAGENTA, "Frage an Leo / Spiel"), (NEWS, "Registerblatt")])
    s.save("W9.svg")


def w11():
    s = Svg("W11 · Mein Bereich: Aktenkoffer und Wächter als Plus-Blatt",
            "Der Plus-Knopf klappt wie das Register ein Blatt auf: links die Mappe, in der Mitte die Wächter, rechts das Profil. Gelesen wird weiter im Faden.")
    x, y, w = 40, 130, 1020
    masthead(s, x, y, w, pfad="Mein Bereich", aktiv=None)
    by = y + 97
    s.rect(x, by, w, 400, fill=NEWS, stroke=RULE, r=0, sw=1)
    s.line(x, by + 400, x + w, by + 400, color=INK, sw=1.5)
    s.text(x + 24, by + 28, "GUTEN TAG, FRAU BERGER · PLUS SEIT MÄRZ · LEVEL 2 „KENNER“", size=10, weight="700", color=MUTE)
    s.text(x + w - 24, by + 12, "Esc · außerhalb tippen · schließen ✕", size=10, color=MUTE, anchor="end")
    # Spalte 1: Aktenkoffer (Mappe mit Belegen)
    cx = x + 24
    s.text(cx, by + 60, "AKTENKOFFER · 5 BELEGE", size=10, weight="700", color=GREEN)
    s.text(cx, by + 80, "Ergebnisse · Checklisten · Vergleiche · Gespräche", size=10, color=MUTE)
    belege = [("Unterhaltsrechner 2026", "1.096 € / Monat", "3. Sept."), ("Checkliste Schlüsselverlust", "4 von 6 erledigt", "3. Sept."), ("Vergleich Hundekranken", "OP-Schutz gemerkt", "2. Sept."), ("Gespräch: Tresorschlüssel", "Leo, 3 Antworten", "1. Sept."), ("Steuerformulare 2025", "PDF, 2 Seiten", "28. Aug.")]
    for k, (t, v, d) in enumerate(belege):
        yy = by + 96 + k * 52
        s.rect(cx, yy, 290, 44, fill=PAPER, stroke=RULE, r=2, sw=1)
        s.line(cx + 8, yy + 6, cx + 8, yy + 38, color=RULE, sw=1, dash="2 2")
        s.text(cx + 18, yy + 18, t, size=12, weight="700", family=SERIF)
        s.text(cx + 18, yy + 34, v + "  ·  " + d, size=10, color=MUTE)
        s.text(cx + 282, yy + 18, "↗", size=11, color=GREEN, anchor="end")
    s.text(cx, by + 372, "„Öffnen“ legt den Beleg als Kapitel ab · ✓ gesichert, alle Geräte", size=9.5, color=MUTE)
    s.line(x + 340, by + 50, x + 340, by + 384, color=RULE)
    # Spalte 2: Waechter
    wx = x + 364
    s.text(wx, by + 60, "WÄCHTER · 3 REGELN", size=10, weight="700", color=GREEN)
    regeln = [("Kfz-Wechselfrist", "Wenn der 1. November naht → 3 geprüfte Angebote per WhatsApp", "in 58 Tagen", True), ("Düsseldorfer Tabelle", "Wenn sich die Tabelle ändert → Unterhaltsergebnis neu prüfen, E-Mail", "Jahreswechsel", True), ("Grundfreibetrag", "Wenn sich der Wert ändert → Hinweis im Faden", "Jahreswechsel", False)]
    for k, (t, r, n, an) in enumerate(regeln):
        yy = by + 84 + k * 74
        s.rect(wx, yy, 300, 62, fill=PAPER, stroke=RULE, r=2, sw=1)
        s.rect(wx + 254, yy + 8, 36, 18, fill=GREEN if an else RULE, stroke=GREEN if an else RULE, r=9)
        s.circle(wx + 254 + (27 if an else 9), yy + 17, 7, fill=PAPER, stroke=PAPER)
        s.text(wx + 12, yy + 20, t, size=12, weight="700", family=SERIF)
        s.text(wx + 12, yy + 36, r[:58] + ("…" if len(r) > 58 else ""), size=9.5, color=INK)
        s.text(wx + 12, yy + 52, "Nächster Termin: " + n, size=9.5, color=MUTE)
    # Jahresleiste
    jy = by + 318
    s.text(wx, jy, "JAHRESLEISTE", size=9.5, weight="700", color=MUTE)
    s.line(wx, jy + 22, wx + 300, jy + 22, color=INK, sw=1)
    for k, m in enumerate("JFMAMJJASOND"):
        s.text(wx + 4 + k * 25, jy + 40, m, size=9, color=MUTE)
    s.circle(wx + 4 + 8 * 25 + 4, jy + 22, 5, fill=INK, stroke=INK)
    s.circle(wx + 4 + 10 * 25 + 4, jy + 22, 5, fill=GREEN, stroke=GREEN)
    s.circle(wx + 4 + 4, jy + 22, 5, fill=PAPER, stroke=GREEN)
    s.text(wx, jy + 60, "● heute   ● Kfz-Frist   ○ Jahreswechsel", size=9, color=MUTE)
    s.line(x + 690, by + 50, x + 690, by + 384, color=RULE)
    # Spalte 3: Profil
    px = x + 714
    s.text(px, by + 60, "PROFIL", size=10, weight="700", color=GREEN)
    s.lines(px, by + 84, ["Frau Berger · berger@mail.de", "Passkey eingerichtet · kein Passwort", "Interessen: Familie · Steuern · Hund", "Wochenbrief: donnerstags · eingetragen", "Punkte 340 · Serie 6 Tage · Album 4/12"], size=11, lh=20)
    s.text(px, by + 200, "BELOHNUNGEN", size=9.5, weight="700", color=MAGENTA)
    s.lines(px, by + 220, ["✓ PDF-Guide „Trennung“ (Level 1)", "○ Versicherungs-Check bei Finconext", "   ab Level 2 · noch 60 Punkte"], size=11, lh=18)
    s.text(px, by + 300, "Daten herunterladen · Konto löschen", size=10, color=MUTE)
    s.text(px, by + 340, "Zustellung: E-Mail ✓  WhatsApp ✓", size=10, color=MUTE)
    # Faden darunter
    fy = by + 430
    s.line(x, fy, x + w, fy, color=RULE)
    s.text(x, fy + 20, "KAPITEL 1 · HEUTE · 14:02", size=9.5, weight="700", color=MUTE)
    s.rect(x, fy + 30, w, 40, fill=PAPER, stroke=RULE, r=2, sw=1)
    s.text(x + 12, fy + 46, "WÄCHTER MELDET", size=9.5, weight="700", color=GREEN)
    s.text(x + 12, fy + 62, "Ihre Kfz-Wechselfrist endet in 58 Tagen. Am 1. November bringe ich drei geprüfte Angebote. ", size=11)
    s.text(x + w - 12, fy + 62, "Regel ändern · Stumm", size=10, color=MUTE, anchor="end")
    s.text(x, fy + 96, "KAPITEL 2 · AKTENKOFFER › BELEG · 14:05", size=9.5, weight="700", color=MUTE)
    s.text(x, fy + 118, "Unterhaltsrechner 2026 · 1.096 € / Monat", size=15, weight="700", family=SERIF)
    s.text(x, fy + 136, "Beleg vom 3. September, Nettoeinkommen 3.200 €, Kinder 6 und 9. Leo: „Soll ich mit dem Wert von Januar vergleichen?“", size=11, color=MUTE)
    # rechte Spalte
    rx = 1100
    s.note(rx, 130, 460, ["Aktenkoffer als Mappe mit Belegen:", "· jeder Beleg: Titel, Wert oder Stand, Datum, Öffnen-Pfeil", "· kommt aus jedem Kasten und jeder Kette („In den Aktenkoffer“)", "· Reiter: Ergebnisse · Checklisten · Vergleiche · Gespräche", "· ohne Konto im Browser, mit Konto gesichert (Stempel „gesichert“)", "· Öffnen legt den Beleg als Kapitel in den Faden, Leo vergleicht mit früher"])
    s.note(rx, 300, 460, ["Wächter als Regeln „Wenn … dann …“:", "· Schalter je Regel, Kanal (E-Mail, WhatsApp, nur im Faden), nächster Termin", "· Jahresleiste zeigt alle Termine auf einen Blick", "· entsteht aus jedem Kasten („Wächter setzen“) oder von Leo vorgeschlagen", "· meldet sich im Faden als eigene Zeile „Wächter meldet“, nie als Pop-up", "· Zustellung nur, wenn etwas passiert; jede Meldung hat „Stumm“"])
    s.note(rx, 470, 460, ["Warum ein Blatt und kein eigener Bereich:", "· Verwalten oben (Blatt), Lesen unten (Faden), wie beim Register", "· nichts davon verlässt den Faden, kein zweites Layout", "· abgemeldet zeigt das Blatt die Sicherungsfrage (E-Mail oder Passkey)", "· mobil: Blatt als Vollbild mit drei Reitern"])
    s.note(rx, 620, 460, ["Verspielte, schlichte Details:", "· gestrichelte Lochkante an jedem Beleg, Stempel „gesichert“", "· Jahresleiste mit Punkten, Serie mit Flamme", "· Kicker in Kapitälchen, dünne Linien, kein Schatten"])
    s.legend([(GREEN, "Leo / Aktion / Wächter aktiv"), (MAGENTA, "Belohnungen / Spiel"), (NEWS, "Plus-Blatt")])
    s.save("W11.svg")


def w12():
    s = Svg("W12 · Werbeplätze im Zeitungslayout: wo Anzeigen hindürfen und wo nie",
            "Nach AdSense-Richtlinien, Better Ads Standards und deutschem Kennzeichnungsrecht. Jede Fläche trägt das Wort „Anzeige“.")
    x, y, w, h = 40, 130, 1020, 700
    s.browser(x, y, w, h, "www.finanzleser.de/versicherungen/haftpflicht/schluesselverlust/")
    masthead(s, x + 1, y + 34, w - 2, pfad="Versicherungen › Haftpflicht", aktiv="Versicherungen")
    top = y + 132
    # Spalten
    s.line(x + 200, top, x + 200, y + h - 1, color=RULE)
    s.line(x + 780, top, x + 780, y + h - 1, color=RULE)
    # links
    s.text(x + 20, top + 20, "HEUTE IM FADEN", size=9.5, weight="700", color=MUTE)
    s.gray_lines(x + 20, top + 30, 160, n=3, gap=8, h=5)
    s.text(x + 20, top + 96, "WOCHENBRIEF · TAGESFRAGE", size=9.5, weight="700", color=MUTE)
    s.gray_lines(x + 20, top + 106, 160, n=2, gap=8, h=5)
    s.rect(x + 20, top + 150, 160, 380, fill="#E5E7EB", stroke="#E5E7EB", r=0)
    s.rect(x + 20, top + 150, 26, 26, fill=INK, stroke=INK, r=0)
    s.text(x + 33, top + 167, "AD", size=8, color=PAPER, weight="700", anchor="middle")
    s.text(x + 20, top + 144, "ANZEIGE", size=8, weight="700", color=MUTE)
    s.text(x + 100, top + 345, "160 × 600", size=11, color=MUTE, anchor="middle")
    s.text(x + 100, top + 362, "nur ab 1500 px Breite", size=9, color=MUTE, anchor="middle")
    # Mitte
    cx = x + 220; cw = 540
    s.text(cx, top + 20, "KAPITEL 3 · VERSICHERUNGEN › HAFTPFLICHT", size=9.5, weight="700", color=MUTE)
    s.text(cx, top + 44, "Schlüsselverlust: Wann die Haftpflicht zahlt", size=17, weight="900", family=SERIF)
    s.gray_lines(cx, top + 58, cw, n=3, gap=8, h=5)
    s.text(cx, top + 108, "Abschnitt 1", size=12, weight="700", family=SERIF)
    s.gray_lines(cx, top + 118, cw, n=3, gap=8, h=5)
    s.text(cx, top + 168, "Abschnitt 2", size=12, weight="700", family=SERIF)
    s.gray_lines(cx, top + 178, cw, n=3, gap=8, h=5)
    s.text(cx + 120, top + 228, "ANZEIGE", size=8, weight="700", color=MUTE)
    s.rect(cx + 120, top + 234, 300, 120, fill="#E5E7EB", stroke="#E5E7EB", r=0)
    s.rect(cx + 120, top + 234, 26, 26, fill=INK, stroke=INK, r=0)
    s.text(cx + 133, top + 251, "AD", size=8, color=PAPER, weight="700", anchor="middle")
    s.text(cx + 270, top + 298, "300 × 250 · In-Article", size=11, color=MUTE, anchor="middle")
    s.text(cx + 270, top + 314, "erst nach dem 2. Abschnitt · mobil 320 × 100", size=9, color=MUTE, anchor="middle")
    s.text(cx, top + 384, "Abschnitt 3 · Häufige Fragen · Fazit · Wochenbrief", size=12, weight="700", family=SERIF)
    s.gray_lines(cx, top + 394, cw, n=2, gap=8, h=5)
    s.leo(cx + 12, top + 440, r=10)
    s.text(cx + 28, top + 444, "LEO", size=9, weight="700", color=GREEN)
    s.gray_lines(cx, top + 456, cw, n=2, gap=8, h=5)
    s.rect(cx, top + 478, cw, 20, fill="#FFF0F6", stroke=MAGENTA, r=0, sw=1, dash="4 3")
    s.text(cx + cw / 2, top + 492, "NIE direkt unter Leos Antwort", size=9, weight="700", color=MAGENTA, anchor="middle")
    s.line(cx, top + 516, cx + cw, top + 516, color=RULE)
    s.text(cx, top + 534, "ANZEIGE", size=8, weight="700", color=MUTE)
    s.rect(cx, top + 540, cw, 44, fill="#E5E7EB", stroke="#E5E7EB", r=0)
    s.rect(cx, top + 540, 26, 26, fill=INK, stroke=INK, r=0)
    s.text(cx + 13, top + 557, "AD", size=8, color=PAPER, weight="700", anchor="middle")
    s.text(cx + cw / 2, top + 566, "728 × 90 · In-Feed, höchstens eine je zwei Kapitel", size=11, color=MUTE, anchor="middle")
    s.text(cx, top + 604, "KAPITEL 4 · …", size=9.5, weight="700", color=MUTE)
    # rechts
    rx = x + 800
    s.text(rx, top + 20, "LEO SCHLÄGT VOR", size=9.5, weight="700", color=MUTE)
    s.gray_lines(rx, top + 30, 200, n=3, gap=8, h=5)
    s.text(rx, top + 90, "ANZEIGE", size=8, weight="700", color=MUTE)
    s.rect(rx, top + 96, 200, 200, fill="#E5E7EB", stroke="#E5E7EB", r=0)
    s.rect(rx, top + 96, 26, 26, fill=INK, stroke=INK, r=0)
    s.text(rx + 13, top + 113, "AD", size=8, color=PAPER, weight="700", anchor="middle")
    s.text(rx + 100, top + 200, "300 × 600", size=11, color=MUTE, anchor="middle")
    s.text(rx + 100, top + 216, "nicht sticky (zu groß)", size=9, color=MUTE, anchor="middle")
    s.text(rx, top + 326, "MEISTGELESEN HEUTE", size=9.5, weight="700", color=MUTE)
    s.gray_lines(rx, top + 336, 200, n=3, gap=8, h=5)
    s.rect(rx, top + 390, 200, 70, fill=PAPER, stroke=RULE, r=2, sw=1)
    s.text(rx + 10, top + 408, "ANZEIGE IN EIGENER SACHE", size=8, weight="700", color=MAGENTA)
    s.text(rx + 10, top + 426, "Finconext: Versicherungs-Check", size=10.5, weight="700", family=SERIF)
    s.text(rx + 10, top + 444, "mit einem echten Berater", size=10, color=MUTE)
    s.text(rx, top + 484, "ANZEIGE", size=8, weight="700", color=MUTE)
    s.rect(rx, top + 490, 200, 90, fill="#E5E7EB", stroke="#E5E7EB", r=0)
    s.rect(rx, top + 490, 26, 26, fill=INK, stroke=INK, r=0)
    s.text(rx + 13, top + 507, "AD", size=8, color=PAPER, weight="700", anchor="middle")
    s.text(rx + 100, top + 540, "300 × 250 · sticky", size=11, color=MUTE, anchor="middle")
    s.text(rx + 100, top + 556, "≤ 30 % des Bildschirms", size=9, color=MUTE, anchor="middle")
    # rechte Erklaerspalte
    ex = 1100
    s.note(ex, 130, 460, ["Erlaubt, mit Regel:", "· rechte Spalte: ein 300×600 in der Fläche, dazu ein 300×250 sticky (≤ 30 % Bildschirm)", "· linke Spalte: 160×600 nur ab 1500 px, sonst leer", "· im Ratgeber: 300×250 (mobil 320×100) erst nach dem 2. Abschnitt, 500–800 Wörter Abstand", "· zwischen Kapiteln: 728×90 In-Feed, höchstens eine je zwei Kapitel", "· mobil unten: nur Googles eigenes Anchor-Format, Gesamtdichte ≤ 30 %"])
    s.note(ex, 300, 460, ["Nie:", "· im Registerblatt oder Plus-Blatt (Navigationsfläche, kaum Inhalt)", "· direkt unter oder in Leos Antwort (Richtlinie „private Kommunikation“, Lage unklar)", "· im Intro und auf der Startseite ohne Text (Anzeige-zu-Inhalt-Verhältnis)", "· als Pop-up, Autoplay mit Ton, Countdown"])
    s.note(ex, 440, 460, ["Kennzeichnung:", "· AdSense-Flächen nur „Anzeige“ oder „Werbung“, nie „Empfehlung“", "· Partnerlinks: „Anzeige · Vergleich mit Partnerlinks“ im Kicker, vor dem Klick (OLG München 2025)", "· Finconext-Kästen: „Anzeige in eigener Sache“, optisch abgesetzt (Magenta-Kante)", "· § 5a UWG, § 6 DDG, Pressekodex Ziffer 7"])
    s.note(ex, 600, 460, ["Bestand heute übernommen:", "· Klassennamen adblocker-neutral (kein „ad“, „banner“, „sponsor“)", "· Platzhalter-Optik mit AD-Marke oben links", "· IAB-Maße aus lib/ads.ts, Consent-Gating bleibt", "· Anzeigen laden erst, wenn das Kapitel im Bild ist"])
    s.legend([("#E5E7EB", "Anzeigenfläche"), (MAGENTA, "Eigenwerbung / Verbot"), (RULE, "Linien statt Kästen")])
    s.save("W12.svg")


if __name__ == "__main__":
    print("Wireframes:")
    for fn in (w1, w2b, w3, w4, w5b, w6b, w7, w8, w9b, w10, w11, w12):
        fn()
