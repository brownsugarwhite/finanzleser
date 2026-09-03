"""Formatvorlage fuer finanzleser-Dokumente.

Baut aus pandocs Standard-reference.docx eine Vorlage mit den Markenschriften
(Merriweather fuer Ueberschriften, Open Sans fuer Text) und den Markenfarben
(#45A117 gruen, #D3005E magenta).
"""
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

GRUEN = RGBColor(0x45, 0xA1, 0x17)
MAGENTA = RGBColor(0xD3, 0x00, 0x5E)
DUNKEL = RGBColor(0x1A, 0x1A, 0x1A)
GRAU = RGBColor(0x5A, 0x5A, 0x5A)
HELLGRAU = RGBColor(0x8A, 0x8A, 0x8A)

SERIF = "Merriweather"
SANS = "Open Sans"
MONO = "Menlo"


def schrift(style, name):
    """Setzt die Schrift inkl. der ostasiatischen Variante, sonst ignoriert Word sie."""
    style.font.name = name
    rpr = style.element.get_or_add_rPr()
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts")
        rpr.append(rf)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(attr), name)


def rand(style, kante, farbe, groesse=6, abstand=8):
    """Zeichnet eine Linie an eine Kante des Absatzes."""
    ppr = style.element.get_or_add_pPr()
    pbdr = ppr.find(qn("w:pBdr"))
    if pbdr is None:
        pbdr = OxmlElement("w:pBdr")
        ppr.append(pbdr)
    el = OxmlElement(f"w:{kante}")
    el.set(qn("w:val"), "single")
    el.set(qn("w:sz"), str(groesse))
    el.set(qn("w:space"), str(abstand))
    el.set(qn("w:color"), farbe)
    pbdr.append(el)


def abstand(style, vor=0, nach=0, zeilen=None):
    pf = style.paragraph_format
    pf.space_before = Pt(vor)
    pf.space_after = Pt(nach)
    if zeilen:
        pf.line_spacing = zeilen
    pf.keep_with_next = style.name.startswith("Heading")


d = Document("reference.docx")
S = d.styles

# ── Grundtext ────────────────────────────────────────────────────────────────
n = S["Normal"]
schrift(n, SANS)
n.font.size = Pt(10)
n.font.color.rgb = DUNKEL
abstand(n, nach=7, zeilen=1.35)

for name in ("Body Text", "First Paragraph", "Compact"):
    s = S[name]
    schrift(s, SANS)
    s.font.size = Pt(10)
    s.font.color.rgb = DUNKEL
    abstand(s, nach=7, zeilen=1.35)

# ── Titelseite ───────────────────────────────────────────────────────────────
t = S["Title"]
schrift(t, SERIF)
t.font.size = Pt(27)
t.font.bold = True
t.font.color.rgb = DUNKEL
abstand(t, vor=90, nach=6)

st = S["Subtitle"]
schrift(st, SANS)
st.font.size = Pt(14)
st.font.italic = False
st.font.color.rgb = GRUEN
abstand(st, nach=22)
rand(st, "bottom", "45A117", groesse=12, abstand=10)

for name in ("Author", "Date"):
    s = S[name]
    schrift(s, SANS)
    s.font.size = Pt(10)
    s.font.color.rgb = GRAU
    abstand(s, nach=2)

# ── Ueberschriften ───────────────────────────────────────────────────────────
h1 = S["Heading 1"]
schrift(h1, SERIF)
h1.font.size = Pt(17)
h1.font.bold = True
h1.font.color.rgb = GRUEN
abstand(h1, vor=26, nach=9)
rand(h1, "bottom", "DCEFD0", groesse=8, abstand=6)

h2 = S["Heading 2"]
schrift(h2, SERIF)
h2.font.size = Pt(12.5)
h2.font.bold = True
h2.font.color.rgb = DUNKEL
abstand(h2, vor=17, nach=6)

h3 = S["Heading 3"]
schrift(h3, SANS)
h3.font.size = Pt(10.5)
h3.font.bold = True
h3.font.color.rgb = MAGENTA
abstand(h3, vor=12, nach=4)

# ── Zitat / Merksatz — linke Linie in Markengruen ────────────────────────────
for name in ("Block Text", "Definition"):
    s = S[name]
    schrift(s, SANS)
    s.font.size = Pt(10)
    s.font.color.rgb = DUNKEL
    s.font.italic = False
    abstand(s, vor=8, nach=10, zeilen=1.3)
    s.paragraph_format.left_indent = Cm(0.55)
    rand(s, "left", "45A117", groesse=18, abstand=12)

# ── Code / Diagramme ─────────────────────────────────────────────────────────
sc = S["Verbatim Char"]
schrift(sc, MONO)
sc.font.size = Pt(9)
sc.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

# ── Bildunterschriften ───────────────────────────────────────────────────────
# "Image Caption" bewusst nicht: python-docx findet den Style nur ueber die
# style_id und warnt dabei — "Caption" deckt den Fall bereits ab.
for name in ("Caption",):
    s = S[name]
    schrift(s, SANS)
    s.font.size = Pt(8.5)
    s.font.color.rgb = HELLGRAU
    s.font.italic = False
    abstand(s, nach=10)

# ── Inhaltsverzeichnis ───────────────────────────────────────────────────────
toc = S["TOC Heading"]
schrift(toc, SERIF)
toc.font.size = Pt(13)
toc.font.bold = True
toc.font.color.rgb = DUNKEL
abstand(toc, vor=0, nach=10)

# ── Links ────────────────────────────────────────────────────────────────────
hl = S["Hyperlink"]
hl.font.color.rgb = GRUEN
hl.font.underline = False

# ── Tabellen: Kopfzeile getoent, nur waagerechte Linien ──────────────────────
tbl = S["Table"]
schrift(tbl, SANS)
tbl.font.size = Pt(9)
tbl.font.color.rgb = DUNKEL

tblpr = tbl.element.find(qn("w:tblPr"))
if tblpr is None:
    tblpr = OxmlElement("w:tblPr")
    tbl.element.append(tblpr)
for alt in tblpr.findall(qn("w:tblBorders")):
    tblpr.remove(alt)

borders = OxmlElement("w:tblBorders")
for kante, farbe, sz in (
    ("top", "45A117", "12"),
    ("bottom", "45A117", "12"),
    ("insideH", "D8D8D8", "4"),
):
    e = OxmlElement(f"w:{kante}")
    e.set(qn("w:val"), "single")
    e.set(qn("w:sz"), sz)
    e.set(qn("w:space"), "0")
    e.set(qn("w:color"), farbe)
    borders.append(e)
for kante in ("left", "right", "insideV"):
    e = OxmlElement(f"w:{kante}")
    e.set(qn("w:val"), "none")
    e.set(qn("w:sz"), "0")
    e.set(qn("w:space"), "0")
    borders.append(e)
tblpr.append(borders)

# Zellinnenabstand — Standard klebt am Text
marg = OxmlElement("w:tblCellMar")
for kante, w in (("top", "80"), ("bottom", "80"), ("left", "100"), ("right", "100")):
    e = OxmlElement(f"w:{kante}")
    e.set(qn("w:w"), w)
    e.set(qn("w:type"), "dxa")
    marg.append(e)
tblpr.append(marg)

# Kopfzeile: gruen getoent, fett
cond = OxmlElement("w:tblStylePr")
cond.set(qn("w:type"), "firstRow")
crpr = OxmlElement("w:rPr")
b = OxmlElement("w:b")
crpr.append(b)
cond.append(crpr)
ctcpr = OxmlElement("w:tcPr")
shd = OxmlElement("w:shd")
shd.set(qn("w:val"), "clear")
shd.set(qn("w:color"), "auto")
shd.set(qn("w:fill"), "EDF6E7")
ctcpr.append(shd)
cond.append(ctcpr)
tbl.element.append(cond)

# ── Inhaltsverzeichnis beim Oeffnen berechnen lassen ─────────────────────────
# pandoc legt das Verzeichnis als Word-FELD an, das erst berechnet wird, wenn Word
# die Felder aktualisiert. Ohne diesen Schalter sieht der Empfaenger unter "Inhalt"
# eine leere Seite und haelt das Dokument fuer kaputt.
settings = d.settings.element
for alt in settings.findall(qn("w:updateFields")):
    settings.remove(alt)
uf = OxmlElement("w:updateFields")
uf.set(qn("w:val"), "true")
settings.append(uf)

# ── Seitenraender ────────────────────────────────────────────────────────────
for sec in d.sections:
    sec.top_margin = Cm(2.4)
    sec.bottom_margin = Cm(2.2)
    sec.left_margin = Cm(2.6)
    sec.right_margin = Cm(2.6)

d.save("finanzleser-reference.docx")
print("finanzleser-reference.docx geschrieben")
