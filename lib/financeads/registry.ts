/**
 * Die Registry: alles, was wir über eine financeads-Kategorie wissen — Endpunkt und
 * API-Version, Parameter der Parameterzeile, Spalten mit Formatierung, Bestwert-Regel,
 * Suchwörter für Leo und die Lesefunktion, die aus dem Rohprodukt unsere Kennzahlen zieht.
 *
 * Quelle jeder Zeile: die am 15.09.2026 gemessenen Antworten (Scratchpad `fa/*.json`).
 * Ändert financeads eine Antwortform, ändert sich hier genau eine `lesen`-Funktion.
 *
 * 🚨 Klasse B (neun Versicherungskategorien) hat KEINE Kennzahlen — die API liefert dort nur
 * Name, Versicherer, Logo, Siegel, Link. Keine Spalten erfinden.
 *
 * 🚨 Der Editor braucht dieselben Kategorien und Parameter (Block `vergleich-quelle`). Das
 * Plugin hat keinen Build-Schritt; `tools/financeads-registry-export.mjs` schreibt den
 * Zwilling `financeads-registry.js`. Wer hier Parameter ändert, lässt den Export laufen.
 */
import type { ApiProdukt, DefLite, Gruppe, Kategorie, KategorieDef, KennWert, ParamDef, SpalteDef } from "./typen.ts";
import { pfad, zahl, text, haken, klartext, erstes, maxWert, eintragMit, nurWerte, zweiDrittelZins, giltFuer, spanneText, kreditgeber, zinszahlung, schutzGrenze } from "./lesehilfen.ts";

// ─── wiederkehrende Bausteine ─────────────────────────────────────────────────────────

const P = {
  anlage: (standard: number, presets: number[]): ParamDef => ({ key: "average_balance", label: "Anlagebetrag", typ: "zahl", standard, einheit: "€", min: 500, max: 1000000, schritt: 500, presets }),
  monate: (standard: number, presets: number[]): ParamDef => ({ key: "months", label: "Anlagedauer", typ: "wahl", standard, einheit: "Monate", optionen: presets.map((m) => ({ wert: String(m), label: dauerLabel(m) })), presets }),
};

/** „3 Monate“, „1 Jahr“, „5 Jahre“ — ab zwölf Monaten zählt man in Jahren (F:221). */
function dauerLabel(m: number): string {
  if (m < 12) return m === 1 ? "1 Monat" : `${m} Monate`;
  if (m % 12) return `${m} Monate`;
  return m === 12 ? "1 Jahr" : `${m / 12} Jahre`;
}

const S = {
  sicherung: { key: "sicherung", label: "Einlagensicherung", kurz: "Sicherung", art: "text", schmal: true } satisfies SpalteDef,
};

/**
 * Sitz der Einlagensicherung — ein nativer Filter von financeads, kein selbstgebauter.
 *
 * 🚨 Gemessen 16.09.2026: `deposit_protection_country_iso=DE` schneidet Festgeld von 31
 * auf 18 und Tagesgeld von 41 auf 19. Ohne diesen Parameter konnten wir nur nachträglich
 * in einer Liste filtern, die der Partner schon vorgefiltert hatte.
 */
/**
 * 🚨 Nicht übernommen, weil gemessen wirkungslos: `broker` (Tagesgeld 41 und Festgeld 31
 * liefern mit 0 UND mit 1 exakt dieselben Produkte, zweimal nachgemessen am 16.09.2026)
 * und die vier Roboadvisor-Schlüssel `calculator`/`advertising_space`/`search_default`/
 * `enabled` — das sind interne Größen des Gateways, keine Angaben eines Lesers.
 * (`availability` bei der Steuersoftware stand hier auch einmal. Zu Unrecht — siehe dort.)
 */
const P_LAND: ParamDef = {
  key: "deposit_protection_country_iso", label: "Sitz der Bank", typ: "wahl", standard: "",
  optionen: [
    { wert: "", label: "alle Länder" },
    { wert: "DE", label: "nur Deutschland" },
    { wert: "AT", label: "nur Österreich" },
    { wert: "NL", label: "nur Niederlande" },
    { wert: "FR", label: "nur Frankreich" },
  ],
};

/**
 * Länderbonität, wie financeads sie führt.
 *
 * 🚨 Das ist der wichtigste Fund der Gegenprüfung vom 16.09.2026: Ohne diesen Parameter
 * setzt die API von sich aus `AA` — unsere Festgeldliste zeigte 28 statt 31 Angeboten,
 * und unter den drei stillschweigend fehlenden war mit Multitude Bank (3,40 %, Malta)
 * eines der besten. Gemessen: AAA → 21 · AA → 28 · A/0 → 31. Andere Werte (BBB, BB, B)
 * liefern null Produkte, sind also keine Stufen, sondern ungültig.
 *
 * Voreinstellung ist deshalb `0` — die vollständige Liste. Wer strenger will, wählt.
 */
const P_BONITAET: ParamDef = {
  key: "country_rating", label: "Länderbonität", typ: "wahl", standard: "0",
  optionen: [
    { wert: "0", label: "alle Länder" },
    { wert: "AA", label: "mindestens AA" },
    { wert: "AAA", label: "nur AAA" },
  ],
};

function sicherung(p: ApiProdukt): string | null {
  const iso = text(pfad(p.details, "deposit_protection.country_iso"));
  const name = text(pfad(p.details, "deposit_protection.name"));
  if (!iso) return name;
  return iso === "DE" ? "Deutschland" : LAND[iso] || iso;
}
const LAND: Record<string, string> = { AT: "Österreich", NL: "Niederlande", FR: "Frankreich", ES: "Spanien", IT: "Italien", MT: "Malta", LU: "Luxemburg", SE: "Schweden", LV: "Lettland", LT: "Litauen", EE: "Estland", PT: "Portugal", BE: "Belgien", IE: "Irland", CZ: "Tschechien", LI: "Liechtenstein", PL: "Polen", HR: "Kroatien", SK: "Slowakei", BG: "Bulgarien", CY: "Zypern", GB: "Großbritannien" };

/** Zinsstaffel mit Neukunden-Aktion? (ein Satz gilt nur für die ersten n Monate) */
function aktionMonate(liste: unknown): number | null {
  if (!Array.isArray(liste)) return null;
  let m: number | null = null;
  for (const e of liste) { const bis = zahl(pfad(e, "requirements.months_to")); if (bis !== null && bis < 99 && (m === null || bis > m)) m = bis; }
  return m;
}

function kontoKennzahlen(p: ApiProdukt): Record<string, KennWert> {
  const konto = zahl(pfad(erstes(pfad(p.conditions, "account")), "value"));
  const total = p.calculated_conditions?.total;
  const saldo = total && total.sum !== null && total.sum !== undefined ? (total.type === "benefit" ? -total.sum : total.sum) : null;
  const karte = erstes(pfad(p.details, "available_cards"));
  const anbieter = text(pfad(karte, "provider"));
  const art = text(pfad(karte, "creditcard_type"));
  const karteText = anbieter ? `${anbieter[0].toUpperCase()}${anbieter.slice(1)}${art ? ` ${art[0].toUpperCase()}${art.slice(1)}` : ""}` : (text(pfad(karte, "card_type")) === "banking_card" ? "Girocard" : null);
  return nurWerte({
    kontofuehrung: konto,
    guthabenzins: zahl(pfad(erstes(pfad(p.conditions, "credit_interest")), "value")),
    dispozins: zahl(pfad(p.conditions, "overdraft.arranged.value")) ?? zahl(pfad(p.conditions, "overdraft.unarranged.value")),
    karte: karteText,
    sicherung: sicherung(p),
    kosten: saldo,
  });
}

function zinsKennzahlen(p: ApiProdukt): Record<string, KennWert> {
  const staffel = pfad(p.conditions, "interest_rate");
  return nurWerte({
    zins: zahl(pfad(p.conditions, "yield.value")) ?? maxWert(staffel),
    zins_max: maxWert(staffel),
    aktion: aktionMonate(staffel),
    ertrag: zahl(pfad(p.calculated_conditions, "total.sum")),
    sicherung: sicherung(p),
  });
}

/** Klasse B: keine Kennzahlen, nur die Anbieterliste. */
function leer(): Record<string, KennWert> { return {}; }

function versicherung(kategorie: Kategorie, titel: string, suchwoerter: string[], extra: Partial<KategorieDef> = {}): KategorieDef {
  return {
    kategorie, version: "v1", klasse: "B", gruppe: "versicherung", titel, einzahl: "Tarif", mehrzahl: "Tarife",
    params: [], spalten: [], sortierung: [], suchwoerter, lesen: leer, ...extra,
  };
}

// ─── die Kategorien ───────────────────────────────────────────────────────────────────

const KATEGORIEN: KategorieDef[] = [
  {
    kategorie: "savingsaccounts", version: "v1", klasse: "A",
    gruppe: "anlegen",
    titel: "Tagesgeld", einzahl: "Tagesgeldkonto", mehrzahl: "Konten",
    params: [P.anlage(10000, [5000, 10000, 25000, 50000]), P.monate(12, [3, 6, 12, 24]), P_LAND],
    spalten: [
      { key: "zins", label: "Zins p. a.", kurz: "Zins", art: "prozent", richtung: "hoch" },
      { key: "ertrag", label: "Ertrag im Zeitraum", kurz: "Ertrag", art: "geld", richtung: "hoch" },
      S.sicherung,
    ],
    bestwert: { key: "ertrag", richtung: "hoch" },
    filter: [{ key: "sicherung", label: "nur deutsche Einlagensicherung", wert: "Deutschland" }],
    sortierung: [{ key: "ertrag", label: "Ertrag" }, { key: "zins", label: "Zins" }],
    totalLabel: "Ertrag",
    suchwoerter: ["tagesgeld", "tagesgeldkonto", "zinsen", "sparen", "sparkonto", "geld parken", "notgroschen"],
    lesen: zinsKennzahlen,
    begruendung: (p) => p.kennzahlen.sicherung === "Deutschland" ? "höchster Ertrag mit deutscher Einlagensicherung" : "höchster Ertrag im gewählten Zeitraum",
  },
  {
    kategorie: "fixedsavingsaccounts", version: "v1", klasse: "A",
    gruppe: "anlegen",
    titel: "Festgeld", einzahl: "Festgeldkonto", mehrzahl: "Konten",
    // Sieben Laufzeiten statt fünf, Voreinstellung 36 Monate (F:199, F:224). Sie tragen
    // zugleich die Zinskurve: jede ist eine Variante im Snapshot, aus der sich der beste
    // und der durchschnittliche Zins je Laufzeit rechnen lässt.
    params: [P.anlage(20000, [5000, 10000, 20000, 50000]), P.monate(36, [3, 6, 12, 24, 36, 48, 60]), P_BONITAET, P_LAND],
    // Reihenfolge = Satzreihenfolge: Ertrag ordnet die Liste, der Zins kennzeichnet das
    // Angebot, Endbetrag und Zinszahlung stehen beim Gewinner unter der Punktführung,
    // das Land in der dritten Listenspalte.
    spalten: [
      { key: "ertrag", label: "Zinsertrag", kurz: "Ertrag", art: "geld", richtung: "hoch" },
      { key: "zins", label: "Zinsen p. a.", kurz: "Zins p. a.", art: "prozent", richtung: "hoch" },
      { key: "endbetrag", label: "Endbetrag", art: "geld", richtung: "hoch", schmal: true, nurDetails: true },
      { key: "zahlung", label: "Zinszahlung", art: "text", schmal: true, nurDetails: true },
      // `nurDetails` heißt „nicht in der Spaltenreihe" — das Land holt sich der Kursblatt-
      // Satz gezielt als dritte Spalte, die alte Liste bleibt bei Zins und Sicherung.
      { key: "land", label: "Land", art: "text", schmal: true, nurDetails: true },
      S.sicherung,
      { key: "schutz_max", label: "Gesichert", art: "text", schmal: true, nurDetails: true },
    ],
    bestwert: { key: "ertrag", richtung: "hoch" },
    kennzahlen: [
      { key: "best", label: "Zinsertrag mit dem Bestwert", unter: "über die gewählte Anlagedauer", art: "geld", ton: "werkzeug", formel: { art: "best", key: "ertrag" } },
      // `{differenz}` setzt `kennzahlenBauen` ein — wie `{zins}` weiter unten.
      { key: "schnitt", label: "Ø aller Angebote", unter: "Bestwert bringt {differenz} mehr", art: "geld", ton: "grau", formel: { art: "schnitt", key: "ertrag" } },
      {
        // 🚨 `{zins}` setzt `kennzahlenBauen` ein. Die Registry importiert `marktdaten.ts`
        // bewusst NICHT: sie wird von `tools/financeads-registry-export.mjs` mit dem nackten
        // Node-Loader gelesen, der den `@/`-Alias nicht kennt — der Export bräche.
        key: "real", label: "Nach Inflation ({zins} p. a.) bleibt real",
        unter: "echter Kaufkraftgewinn", art: "geld", ton: "gruen", gross: true,
        formel: { art: "real", key: "ertrag", jahreAus: "months" },
        negativ: { unter: "Kaufkraft sinkt trotz Zinsen" },
      },
    ],
    // Nur ein Gewinner: beim Festgeld ist der zweitbeste Ertrag keine Auszeichnung wert
    // („Finanzleser Festgeld & Eingaben - Kursblatt.dc.html“:99, „Das beste Angebot").
    kursblatt: {
      band: "kurve", podest: 1, stempel: "Höchster Ertrag",
      kennwert: "zins", dritteSpalte: { key: "land" },
      ohne: { key: "zins", ist: 0, text: "mit 0 % Zinsen" },
    },
    sortierung: [{ key: "ertrag", label: "Ertrag" }, { key: "zins", label: "Zins" }],
    totalLabel: "Ertrag",
    suchwoerter: ["festgeld", "festgeldkonto", "termingeld", "zinsen", "laufzeit", "sparbrief"],
    lesen: (p, params) => {
      const werte = zinsKennzahlen(p);
      const ertrag = typeof werte.ertrag === "number" ? werte.ertrag : null;
      const betrag = Number(params.average_balance);
      const iso = text(pfad(p.details, "deposit_protection.country_iso"));
      return nurWerte({
        ...werte,
        endbetrag: ertrag !== null && Number.isFinite(betrag) ? betrag + ertrag : null,
        zahlung: zinszahlung(pfad(p.conditions, "interest_rate")),
        land: iso,
        schutz_max: schutzGrenze(pfad(p.details, "deposit_protection.protected_max")),
      });
    },
    begruendung: (p) => p.kennzahlen.sicherung === "Deutschland" ? "höchster Ertrag mit deutscher Einlagensicherung" : "höchster Ertrag über die Laufzeit",
  },
  {
    kategorie: "currentaccounts", version: "v1.02", klasse: "A",
    gruppe: "konto",
    titel: "Girokonto", einzahl: "Girokonto", mehrzahl: "Konten",
    params: [
      { key: "incoming_monthly", label: "Geldeingang / Monat", typ: "zahl", standard: 1200, einheit: "€", min: 0, max: 20000, schritt: 100, presets: [0, 1200, 2500] },
      { key: "average_balance", label: "Durchschnittlicher Kontostand", typ: "zahl", standard: 1000, einheit: "€", min: 0, max: 100000, schritt: 100 },
      // Gemessen 16.09.2026: ab einer Buchung je Monat kommen zwei Konten dazu (37 → 39).
      { key: "transaction", label: "Buchungen / Monat", typ: "zahl", standard: 0, min: 0, max: 200, schritt: 1 },
      // Zielgruppe als Umschalter im Rechner (wie im financeads-Rechner), keine eigenen Seiten je Gruppe.
      // Nur das Studentenkonto hat eine eigene URL — die gab es schon vorher, und financeads führt sie selbst.
      { key: "target_group", label: "Zielgruppe", typ: "wahl", standard: "", presets: ["", "student", "pupil", "apprentice"], optionen: [{ wert: "", label: "alle" }, { wert: "student", label: "Studierende" }, { wert: "pupil", label: "Schüler" }, { wert: "apprentice", label: "Azubis" }, { wert: "employee", label: "Angestellte" }] },
      /**
       * Kreditkarte zum Konto — gemessen 16.09.2026 in unserer Version v1.02: von 37
       * Konten führen 28 eine.
       *
       * 🚨 Nur „ja" ist ein Filter. `credit_card=0` liefert wieder alle 37, ist also kein
       * „nur ohne Kreditkarte", sondern gar kein Filter — in v1 trennt derselbe Parameter
       * noch in beide Richtungen (9 ohne / 29 mit). Eine Option, die vorgibt zu filtern
       * und alles zeigt, steht deshalb nicht in der Liste.
       */
      { key: "credit_card", label: "Kreditkarte", typ: "wahl", standard: "", optionen: [{ wert: "", label: "egal" }, { wert: "1", label: "nur mit Kreditkarte" }] },
    ],
    spalten: [
      { key: "kontofuehrung", label: "Kontoführung / Jahr", kurz: "Kontoführung", art: "geld", richtung: "runter" },
      { key: "dispozins", label: "Dispozins", kurz: "Dispo", art: "prozent", richtung: "runter", schmal: true },
      { key: "karte", label: "Karte", art: "text", schmal: true },
      { key: "kosten", label: "Kosten / Jahr gesamt", kurz: "Kosten / Jahr", art: "saldo", richtung: "runter" },
    ],
    bestwert: { key: "kosten", richtung: "runter" },
    filter: [{ key: "kontofuehrung", label: "nur ohne Kontoführungsgebühr", wert: 0 }],
    sortierung: [{ key: "kosten", label: "Kosten" }, { key: "kontofuehrung", label: "Kontoführung" }, { key: "dispozins", label: "Dispozins" }],
    totalLabel: "Kosten / Jahr",
    suchwoerter: ["girokonto", "konto", "kontoführung", "kontowechsel", "gehaltskonto", "dispo", "kostenloses konto", "studentenkonto", "schülerkonto", "kinderkonto"],
    lesen: kontoKennzahlen,
    begruendung: (p) => (p.kennzahlen.kosten as number) <= 0 ? "keine Kontoführungsgebühr bei Ihrem Geldeingang" : "niedrigste Jahreskosten bei Ihrem Geldeingang",
  },
  {
    kategorie: "businessaccounts", version: "v1", klasse: "A",
    gruppe: "konto",
    titel: "Geschäftskonto", einzahl: "Geschäftskonto", mehrzahl: "Konten",
    params: [
      { key: "transaction", label: "Buchungen / Monat", typ: "zahl", standard: 10, min: 0, max: 1000, schritt: 5, presets: [10, 50, 100] },
      { key: "transaction_documented", label: "Beleghafte Buchungen / Monat", typ: "zahl", standard: 0, min: 0, max: 500, schritt: 1 },
    ],
    spalten: [
      { key: "kontofuehrung", label: "Kontoführung / Jahr", kurz: "Kontoführung", art: "geld", richtung: "runter" },
      { key: "buchung", label: "Preis je Buchung", kurz: "je Buchung", art: "geld", richtung: "runter", schmal: true },
      S.sicherung,
      { key: "kosten", label: "Kosten / Jahr gesamt", kurz: "Kosten / Jahr", art: "saldo", richtung: "runter" },
    ],
    bestwert: { key: "kosten", richtung: "runter" },
    filter: [{ key: "kontofuehrung", label: "nur ohne Kontoführungsgebühr", wert: 0 }],
    sortierung: [{ key: "kosten", label: "Kosten" }, { key: "kontofuehrung", label: "Kontoführung" }],
    totalLabel: "Kosten / Jahr",
    suchwoerter: ["geschäftskonto", "firmenkonto", "selbstständig", "freiberufler", "gmbh", "unternehmen", "gewerbe"],
    lesen: (p) => nurWerte({ ...kontoKennzahlen(p), buchung: zahl(pfad(eintragMit(pfad(p.conditions, "transaction"), "type", "online"), "value")) }),
    begruendung: () => "niedrigste Jahreskosten bei Ihrer Buchungszahl",
  },
  {
    kategorie: "creditcards", version: "v1.02", klasse: "A",
    gruppe: "konto",
    titel: "Kreditkarte", einzahl: "Kreditkarte", mehrzahl: "Karten",
    params: [
      { key: "transaction_eu", label: "Umsatz / Jahr in Europa", typ: "zahl", standard: 2500, einheit: "€", min: 0, max: 100000, schritt: 500 },
      // Der Gegenpart: Umsatz außerhalb Europas. Ändert die Trefferzahl nicht, aber genau
      // hier schlägt die Fremdwährungsgebühr zu — ohne ihn rechnete die API still mit 0.
      { key: "transaction_not_eu", label: "Umsatz / Jahr außerhalb Europas", typ: "zahl", standard: 0, einheit: "€", min: 0, max: 100000, schritt: 500 },
      // 🚨 Hier standen bis zum 16.09.2026 drei Angaben aus der Girokonto-Welt
      // (`average_balance`, `incoming_monthly`, `transaction`) mit der Begründung, sie
      // gingen zwar nicht in die Trefferzahl, wohl aber in `calculated_conditions` ein.
      // Nachgerechnet stimmt das nicht: mit 50.000 € Kontostand, 8.000 € Geldeingang oder
      // 150 Buchungen kommt Produkt für Produkt **dasselbe Ergebnis** heraus. Es waren
      // drei Bedienelemente ohne Wirkung, zwei davon Lineale über die volle Satzbreite.
      // Die API echot sie in `filter_settings`, weil sie eigene Vorgaben dafür hat — ein
      // Echo ist kein Beweis für Wirkung.
      // Beide Filter als Umschalter im Rechner (Chips), keine eigenen Seiten „Reisekreditkarte"/„kostenlose Kreditkarte".
      { key: "travel_creditcard", label: "Reisekreditkarte", typ: "wahl", standard: "", presets: ["", "1"], optionen: [{ wert: "", label: "alle Karten" }, { wert: "1", label: "nur Reisekarten" }] },
      { key: "free_products", label: "Jahresgebühr", typ: "wahl", standard: "", presets: ["", "1"], optionen: [{ wert: "", label: "alle Karten" }, { wert: "1", label: "nur ohne Jahresgebühr" }] },
      /**
       * Kartengesellschaft und Abrechnungsart — zwei native Filter, die uns gefehlt haben.
       *
       * 🚨 Die gültigen Werte stehen nicht in einer Liste, sondern im Produkt selbst:
       * `details.provider[]` und `details.payment_method`. Genau die Vokabeln, die unsere
       * `lesen`-Funktion längst übersetzte (charge/credit/debit/prepaid), nimmt auch der
       * Filter. Gemessen 16.09.2026 an 49 Karten (v1.02): Kredit 31 · Charge 10 · Prepaid 5
       * · Debit 3 — eine saubere Aufteilung, alle 49 sind vertreten. Visa 18,
       * Mastercard 23; American Express, Diners und JCB weist die API als ungültig
       * zurück, obwohl `list/creditcards/providers` sie führt — bei diesem Werbeplatz
       * gibt es sie nicht, und eine Option, die eine Fehlermeldung auslöst, gehört nicht
       * in die Liste.
       */
      { key: "provider", label: "Kartengesellschaft", typ: "wahl", standard: "", optionen: [{ wert: "", label: "alle" }, { wert: "visa", label: "Visa" }, { wert: "mastercard", label: "Mastercard" }] },
      { key: "payment_methods", label: "Abrechnung", typ: "wahl", standard: "", optionen: [{ wert: "", label: "alle" }, { wert: "credit", label: "Kredit (Teilzahlung)" }, { wert: "charge", label: "Charge (monatlich)" }, { wert: "debit", label: "Debit (sofort)" }, { wert: "prepaid", label: "Prepaid (Guthaben)" }] },
      // 🚨 Nicht übernommen: `card_status[]` — 32 Kandidaten durchprobiert (credit, debit,
      // prepaid, charge, classic, gold, platinum, business, 0–3, STANDARD…, main,
      // additional, active …), jeder einzelne „The selected card status is invalid.".
      // Es gibt keinen Listenendpunkt dafür und kein Feld im Produkt, aus dem sich die
      // Vokabel ableiten ließe. Und `target_group[]` kennt die API zwar (employee,
      // student, pupil, minor, apprentice, retired, freelancer, independent, unemployed),
      // filtert damit aber nichts: alle neun liefern dieselben 49 Karten.
    ],
    spalten: [
      { key: "jahresgebuehr", label: "Jahresgebühr", art: "geld", richtung: "runter" },
      { key: "auslandsgebuehr", label: "Fremdwährungsgebühr", kurz: "Fremdwährung", art: "prozent", richtung: "runter", schmal: true },
      { key: "abhebung", label: "Bargeld im Inland", kurz: "Bargeld", art: "text", schmal: true },
      { key: "zahlungsart", label: "Kartenart", art: "text" },
    ],
    bestwert: { key: "jahresgebuehr", richtung: "runter" },
    sortierung: [{ key: "jahresgebuehr", label: "Jahresgebühr" }, { key: "auslandsgebuehr", label: "Fremdwährung" }],
    totalLabel: "Jahresgebühr",
    suchwoerter: ["kreditkarte", "visa", "mastercard", "amex", "kostenlose kreditkarte", "reisekreditkarte", "fremdwährung", "bargeld abheben"],
    lesen: (p) => {
      const international = eintragMit(pfad(p.conditions, "transaction"), "region", "international");
      const abhebung = eintragMit(pfad(p.conditions, "withdrawal"), "region", "de");
      const abProzent = zahl(pfad(abhebung, "value")); const abMin = zahl(pfad(abhebung, "minimum_charge"));
      const art = text(pfad(p.details, "payment_method"));
      const ARTEN: Record<string, string> = { charge: "Charge", credit: "Kredit", debit: "Debit", prepaid: "Prepaid" };
      return nurWerte({
        jahresgebuehr: zahl(pfad(erstes(pfad(p.conditions, "account")), "value")),
        auslandsgebuehr: zahl(pfad(international, "value")),
        abhebung: abProzent === null ? null : abProzent === 0 && !abMin ? "kostenlos" : `${String(abProzent).replace(".", ",")} %${abMin ? `, mind. ${abMin} €` : ""}`,
        zahlungsart: art ? ARTEN[art] || art : null,
      });
    },
    begruendung: (p) => p.kennzahlen.jahresgebuehr === 0 ? "keine Jahresgebühr" : "niedrigste Jahresgebühr",
  },
  {
    kategorie: "brokerageaccounts", version: "v1", klasse: "A",
    gruppe: "anlegen",
    titel: "Depot", einzahl: "Depot", mehrzahl: "Depots",
    params: [
      { key: "depot_volume", label: "Depotvolumen", typ: "zahl", standard: 20000, einheit: "€", min: 1000, max: 1000000, schritt: 1000, presets: [5000, 20000, 50000] },
      { key: "order_count_pa", label: "Orders / Jahr", typ: "zahl", standard: 12, min: 1, max: 500, schritt: 1, presets: [4, 12, 50] },
      { key: "order_volume", label: "Ordervolumen", typ: "zahl", standard: 1000, einheit: "€", min: 100, max: 100000, schritt: 100 },
      /**
       * Handelsplatz — und zugleich der zweite Fund vom Schlage `country_rating`.
       *
       * 🚨 OHNE diesen Parameter liefert die API 28 Depots, MIT ihm 35 — und die sieben,
       * die nur mit Handelsplatz auftauchen, sind ausgerechnet die günstigen Neobroker:
       * finanzen.net zero (+ Kinderdepot), justTRADE, flatex (Depot + Neukundendepot),
       * comdirect Pure Depot, Alchemy Markets. Gemessen 16.09.2026; die 28 sind eine
       * echte Teilmenge der 35, es geht also nichts verloren.
       *
       * Offenbar rechnet der Partner die Ordergebühr erst, wenn der Handelsplatz
       * feststeht — wer keinen nennt, sieht nur Depots mit Pauschalpreis. Voreinstellung
       * ist deshalb „Alle großen Börsen" (`allbig`), nicht „kein Parameter".
       *
       * Was die einzelnen Plätze tun (gemessen): allbig/xetra/getex/otc je 35,
       * deutsch_xetra 25, Frankfurt 22, NYSE 12, Hamburg 10.
       */
      { key: "stock_exchanges", label: "Handelsplatz", typ: "wahl", standard: "allbig", optionen: [{ wert: "allbig", label: "alle großen Börsen" }, { wert: "xetra", label: "XETRA" }, { wert: "getex", label: "Gettex" }, { wert: "frankfurt", label: "Frankfurt" }, { wert: "hamburg", label: "Hamburg" }, { wert: "nyse", label: "NYSE" }, { wert: "otc", label: "außerbörslich" }] },
      // Gemessen 16.09.2026: 0 und 1 liefern dieselben 28 Depots und dieselbe
      // Gebührenrechnung — die Ordergebühren stehen ohnehin je Weg in `orders.internet`.
      // Draußen, bis der Partner dort unterscheidet.
    ],
    spalten: [
      { key: "depotgebuehr", label: "Depotgebühr / Jahr", kurz: "Depotgebühr", art: "geld", richtung: "runter" },
      { key: "order", label: "Ordergebühr", art: "text", schmal: true },
      { key: "orderkosten", label: "Orderkosten / Jahr", kurz: "Orders / Jahr", art: "geld", richtung: "runter", schmal: true },
      { key: "kosten", label: "Kosten / Jahr gesamt", kurz: "Kosten / Jahr", art: "geld", richtung: "runter" },
    ],
    bestwert: { key: "kosten", richtung: "runter" },
    filter: [{ key: "depotgebuehr", label: "nur ohne Depotgebühr", wert: 0 }],
    sortierung: [{ key: "kosten", label: "Kosten" }, { key: "depotgebuehr", label: "Depotgebühr" }],
    totalLabel: "Kosten / Jahr",
    suchwoerter: ["depot", "wertpapierdepot", "etf", "aktien", "broker", "ordergebühr", "sparplan", "wertpapiere"],
    lesen: (p) => {
      const online = erstes(pfad(p.conditions, "orders.internet"));
      const fix = zahl(pfad(online, "fix.value")); const variabel = zahl(pfad(online, "variabel.value"));
      const order = fix === null && variabel === null ? null : `${fix !== null ? `${String(fix).replace(".", ",")} €` : ""}${fix !== null && variabel ? " + " : ""}${variabel ? `${String(variabel).replace(".", ",")} %` : ""}`;
      return nurWerte({
        depotgebuehr: zahl(pfad(p.calculated_conditions, "components.account.fix.sum")),
        order,
        orderkosten: zahl(pfad(p.calculated_conditions, "components.orders.online.total.sum")),
        kosten: zahl(pfad(p.calculated_conditions, "total.sum")),
      });
    },
    begruendung: () => "niedrigste Gesamtkosten bei Ihrem Depotvolumen und Ihrer Orderzahl",
  },
  {
    kategorie: "loans", version: "v1", klasse: "A",
    gruppe: "kredit",
    titel: "Ratenkredit", einzahl: "Kredit", mehrzahl: "Angebote",
    params: [
      { key: "loan", label: "Kreditsumme", typ: "zahl", standard: 10000, einheit: "€", min: 500, max: 100000, schritt: 500, presets: [5000, 10000, 20000, 50000] },
      // Zahl statt Auswahl: Minikredite laufen 1–6 Monate, Ratenkredite 12–120 — eine feste
      // Optionsliste würde die eine oder die andere Seite auf null Angebote klemmen (gemessen 15.09.2026).
      { key: "duration_months", label: "Laufzeit", typ: "zahl", standard: 60, einheit: "Monate", min: 1, max: 120, schritt: 1, presets: [24, 36, 48, 60, 84] },
      /**
       * Verwendung und Kreditart sind Angaben des Lesers, kein Redaktionsgeheimnis — wo
       * die Quelle sie nicht festlegt (Ratenkredit), stehen sie als Umschalter da; wo sie
       * es tut (Autokredit pinnt `usage=CAR`), bleiben sie verborgen. Kein Standard:
       * `usage=FREE` filtert Minikredite weg, ohne den Parameter kommen dieselben 14.
       *
       * 🚨 Die drei Werte der Übergabe („Neuwagen", „Gebrauchtwagen", „Umschuldung")
       * gibt es nicht. Gemessen 16.09.2026: `NEW_CAR`, `USED_CAR`, `RESCHEDULING`,
       * `DEBT_RESCHEDULING`, `FURNITURE`, `TRAVEL` antworten alle mit „The selected usage
       * is invalid". Gültig sind genau drei: CAR, MODERNIZATION, FREE.
       */
      { key: "usage", label: "Verwendung", typ: "wahl", standard: "", optionen: [{ wert: "", label: "alle" }, { wert: "CAR", label: "Auto" }, { wert: "MODERNIZATION", label: "Modernisierung" }, { wert: "FREE", label: "freie Verwendung" }] },
      /**
       * 🚨 `MINI_LOAN` ist nicht dabei, obwohl die API den Wert kennt. Gemessen über das
       * ganze Parameterfeld: er liefert AUSSCHLIESSLICH bei 500–1.000 € über 1–2 Monate
       * Ergebnisse (dieselben zwei, die auch ohne ihn kommen) und sonst überall null —
       * 1.000 €/12 Monate → 0, 3.000 €/24 → 0, ohne Betrag → 0.
       *
       * Die Minikredit-Seite hatte ihn fest gesetzt. Wer dort die Laufzeit über sechs
       * Monate zog, sah eine leere Liste, ohne zu erfahren warum. Ein Filter, der über
       * neun Zehntel seines eigenen Wertebereichs alles wegschneidet, ist keiner. Ohne
       * ihn zeigt die Seite bei ihrer Voreinstellung dieselben zwei Angebote (Cashper,
       * Vexcash) und beim Weiterziehen das, was dann wirklich gilt.
       */
      { key: "type", label: "Kreditart", typ: "wahl", standard: "", optionen: [{ wert: "", label: "alle" }, { wert: "INSTALLMENT_LOAN", label: "Ratenkredit" }, { wert: "CAR", label: "Autokredit" }] },
    ],
    spalten: [
      { key: "effzins", label: "Effektiver Jahreszins", kurz: "eff. Zins", art: "prozent", richtung: "runter", ab: true },
      { key: "sollzins", label: "Sollzins", art: "prozent", richtung: "runter", schmal: true, ab: true },
      { key: "laufzeit", label: "Laufzeit", art: "monate", schmal: true },
      { key: "rate", label: "Monatsrate", kurz: "Rate / Monat", art: "geld", richtung: "runter", ab: true },
      // Die folgenden fünf stehen nur in den Details des Kursblatts — echte Felder
      // anstelle der fünf Merkmale, die der Handoff annahm und die financeads nicht hat
      // (Sondertilgung, Sofortzusage, Ratenpause, Auszahlung, Mindestalter).
      { key: "effzins_bis", label: "Zins bis", art: "prozent", schmal: true, nurDetails: true },
      { key: "rate_bis", label: "Rate bis", art: "geld", schmal: true, nurDetails: true },
      { key: "zwei_drittel", label: "⅔ der Kunden erhalten", art: "prozent", schmal: true, nurDetails: true },
      { key: "bearbeitung", label: "Bearbeitungsgebühr", art: "prozent", schmal: true, nurDetails: true },
      { key: "grenzen", label: "Zins gilt für", art: "text", schmal: true, nurDetails: true },
      { key: "bonitaetsfrei", label: "Zins unabhängig von der Bonität", art: "haken", schmal: true, nurDetails: true },
      { key: "kreditgeber", label: "Kreditgeber", art: "text", schmal: true, nurDetails: true },
    ],
    bestwert: { key: "effzins", richtung: "runter" },
    // 🚨 Drei echte Umschalter statt der drei erfundenen des Handoffs. Der erste ist der
    // wertvollste: bei 20.000 € über 60 Monate gelten 6 von 20 Angeboten gar nicht.
    filter: [
      { key: "gilt", label: "Gilt für Ihre Angaben", wert: true },
      { key: "bearbeitung", label: "ohne Bearbeitungsgebühr", wert: 0 },
      { key: "bonitaetsfrei", label: "Zins ohne Bonitätsaufschlag", wert: true },
    ],
    kennzahlen: [
      { key: "best", label: "Beste Rate im Monat", art: "geld", ton: "werkzeug", formel: { art: "best", key: "rate" } },
      { key: "schnitt", label: "Durchschnittliche Rate", art: "geld", ton: "grau", formel: { art: "schnitt", key: "rate" } },
      { key: "erspar", label: "Ersparnis mit dem Bestwert", unter: "gegenüber dem Durchschnitt", art: "geld", ton: "gruen", gross: true, formel: { art: "differenz", key: "rate", mal: "duration_months" } },
    ],
    kursblatt: { band: "streuung", podest: 3, stempel: "Bestwert", mehrkosten: { key: "rate", mal: "duration_months", label: "Mehrkosten zum Bestwert" } },
    sortierung: [{ key: "effzins", label: "Zins" }, { key: "rate", label: "Rate" }],
    totalLabel: "Rate / Monat",
    suchwoerter: ["ratenkredit", "kredit", "darlehen", "autokredit", "minikredit", "sofortkredit", "umschuldung", "effektivzins", "kreditvergleich"],
    hinweis: "Die Konditionen sind bonitätsabhängig; „ab“ bezeichnet den günstigsten Zins des Anbieters. Die Angaben nach § 6a PAngV mit repräsentativem Beispiel stehen bei jedem Angebot unter „Pflichtangaben“.",
    lesen: (p, params) => {
      const anforderung = pfad(p.conditions, "interest_effective.requirements");
      return nurWerte({
        effzins: zahl(pfad(p.conditions, "interest_effective.value")),
        effzins_bis: zahl(pfad(p.conditions, "interest_effective.value_highest")),
        sollzins: zahl(pfad(p.conditions, "interest_nominal.value")),
        sollzins_bis: zahl(pfad(p.conditions, "interest_nominal.value_highest")),
        laufzeit: zahl(pfad(p.conditions, "duration.value")),
        rate: zahl(pfad(p.conditions, "installments.value")),
        rate_bis: zahl(pfad(p.conditions, "installments.value_highest")),
        zwei_drittel: zweiDrittelZins(klartext(pfad(p.details, "representative_example.de"))),
        bearbeitung: zahl(pfad(p.conditions, "processing.value")),
        // Nennt der Anbieter nur EINEN Zins, gilt er für alle — kein Aufschlag nach Bonität.
        bonitaetsfrei:
          zahl(pfad(p.conditions, "interest_effective.value")) !== null &&
          zahl(pfad(p.conditions, "interest_effective.value")) === zahl(pfad(p.conditions, "interest_effective.value_highest")),
        kreditgeber: kreditgeber(pfad(p.details, "loan_provider")),
        gilt: giltFuer(anforderung, params),
        grenzen: spanneText(anforderung),
        pflicht: klartext(pfad(p.details, "mandatory_information")),
      });
    },
    begruendung: () => "günstigster Effektivzins bei Ihrer Kreditsumme und Laufzeit",
  },
  {
    kategorie: "mortgages", version: "v1.02", klasse: "A",
    gruppe: "kredit",
    titel: "Baufinanzierung", einzahl: "Angebot", mehrzahl: "Angebote",
    params: [
      { key: "loan", label: "Darlehenssumme", typ: "zahl", standard: 300000, einheit: "€", min: 50000, max: 2000000, schritt: 10000, presets: [200000, 300000, 400000, 500000] },
      { key: "duration", label: "Zinsbindung", typ: "wahl", standard: 10, einheit: "Jahre", optionen: [5, 10, 15, 20].map((j) => ({ wert: String(j), label: `${j} Jahre` })), presets: [5, 10, 15, 20] },
      { key: "redemption", label: "Anfängliche Tilgung", typ: "wahl", standard: "0.02", einheit: "%", optionen: [{ wert: "0.01", label: "1 %" }, { wert: "0.02", label: "2 %" }, { wert: "0.03", label: "3 %" }, { wert: "0.04", label: "4 %" }] },
      { key: "loan_to_value_limit", label: "Beleihungsauslauf", typ: "wahl", standard: 80, einheit: "%", optionen: [{ wert: "60", label: "bis 60 %" }, { wert: "80", label: "bis 80 %" }, { wert: "90", label: "bis 90 %" }, { wert: "100", label: "bis 100 %" }] },
      { key: "postal_code", label: "Postleitzahl", typ: "zahl", standard: 60311, min: 1000, max: 99999, schritt: 1 },
    ],
    spalten: [
      { key: "sollzins", label: "Sollzins p. a.", kurz: "Sollzins", art: "prozent", richtung: "runter" },
      { key: "effzins", label: "Effektiver Jahreszins", kurz: "eff. Zins", art: "prozent", richtung: "runter" },
      { key: "restschuld", label: "Restschuld am Ende der Bindung", kurz: "Restschuld", art: "geld", richtung: "runter", schmal: true },
      { key: "rate", label: "Monatsrate", kurz: "Rate / Monat", art: "geld", richtung: "runter" },
    ],
    bestwert: { key: "effzins", richtung: "runter" },
    sortierung: [{ key: "effzins", label: "Effektivzins" }, { key: "rate", label: "Rate" }, { key: "restschuld", label: "Restschuld" }],
    totalLabel: "Rate / Monat",
    suchwoerter: ["baufinanzierung", "immobilienkredit", "hauskauf", "hypothek", "zinsbindung", "tilgung", "anschlussfinanzierung", "forward-darlehen", "bauzinsen"],
    hinweis: "Die Zinssätze gelten für die gewählte Zinsbindung, Tilgung und den Beleihungsauslauf; regionale Anbieter richten sich nach der Postleitzahl. Verbindlich ist nur ein individuelles Angebot.",
    lesen: (p) => {
      const z = erstes(pfad(p.conditions, "interests"));
      return nurWerte({
        sollzins: zahl(pfad(z, "value.nominal")),
        effzins: zahl(pfad(z, "value.effective")),
        rate: zahl(pfad(p.calculated_conditions, "components.monthly_rate.sum")),
        restschuld: zahl(pfad(p.calculated_conditions, "components.residual_debt.sum")),
      });
    },
    begruendung: () => "günstigster Effektivzins bei Ihrer Zinsbindung und Tilgung",
  },
  {
    kategorie: "buildingsavings", version: "v1", klasse: "A",
    gruppe: "kredit",
    titel: "Bausparen", einzahl: "Bausparvertrag", mehrzahl: "Tarife",
    params: [{ key: "usage", label: "Ziel", typ: "wahl", standard: "LOAN", fest: true, optionen: [{ wert: "LOAN", label: "Darlehen" }, { wert: "SAVING", label: "Sparen" }] }],
    spalten: [
      { key: "guthabenzins", label: "Guthabenzins", art: "prozent", richtung: "hoch" },
      { key: "darlehenszins", label: "Darlehenszins eff.", kurz: "Darlehenszins", art: "text" },
      { key: "abschlussgebuehr", label: "Abschlussgebühr", art: "text", schmal: true },
      { key: "kontogebuehr", label: "Kontogebühr / Jahr", kurz: "Kontogebühr", art: "geld", richtung: "runter", schmal: true },
    ],
    bestwert: { key: "darlehenszins_von", richtung: "runter" },
    sortierung: [{ key: "darlehenszins_von", label: "Darlehenszins" }, { key: "guthabenzins", label: "Guthabenzins" }],
    suchwoerter: ["bausparen", "bausparvertrag", "bausparkasse", "wohnungsbauprämie", "eigenheim"],
    lesen: (p) => {
      const d = erstes(pfad(p.conditions, "loan_interest_effective"));
      const von = zahl(pfad(d, "value.from")) ?? zahl(pfad(d, "value")); const bis = zahl(pfad(d, "value.to"));
      const gebuehr = zahl(pfad(p.conditions, "closing_fee.value")) ?? zahl(pfad(p.conditions, "loan_fee.value"));
      const gebuehrEinheit = text(pfad(p.conditions, "closing_fee.unit")) ?? text(pfad(p.conditions, "loan_fee.unit")) ?? "%";
      return nurWerte({
        guthabenzins: zahl(pfad(p.conditions, "credit_interest.value")),
        darlehenszins_von: von,
        darlehenszins: von === null ? null : bis !== null && bis !== von ? `${String(von).replace(".", ",")}–${String(bis).replace(".", ",")} %` : `${String(von).replace(".", ",")} %`,
        abschlussgebuehr: gebuehr === null ? null : gebuehr === 0 ? "keine" : `${String(gebuehr).replace(".", ",")} ${gebuehrEinheit.replace("%%", "%")}`,
        kontogebuehr: zahl(pfad(p.conditions, "account.value")),
      });
    },
    begruendung: () => "günstigster Darlehenszins",
  },
  {
    kategorie: "roboadvisor", version: "v1", klasse: "A",
    gruppe: "anlegen",
    titel: "Robo-Advisor", einzahl: "Robo-Advisor", mehrzahl: "Anbieter",
    params: [
      // financeads verlangt beide Werte > 0 („must be greater than 0", gemessen 15.09.2026).
      { key: "one_time_investment", label: "Einmalanlage", typ: "zahl", standard: 10000, einheit: "€", min: 1, max: 1000000, schritt: 500, presets: [1000, 10000, 50000] },
      { key: "monthly_savings_contribution", label: "Sparrate / Monat", typ: "zahl", standard: 100, einheit: "€", min: 1, max: 10000, schritt: 25, presets: [50, 100, 500] },
    ],
    spalten: [
      { key: "servicegebuehr", label: "Servicegebühr p. a.", kurz: "Service", art: "prozent", richtung: "runter" },
      { key: "fondskosten", label: "Fondskosten p. a.", kurz: "Fonds", art: "prozent", richtung: "runter", schmal: true },
      { key: "mindestanlage", label: "Mindestanlage", art: "geld", richtung: "runter", schmal: true },
      { key: "gesamtkosten", label: "Gesamtkosten p. a.", kurz: "Gesamt p. a.", art: "prozent", richtung: "runter" },
    ],
    bestwert: { key: "gesamtkosten", richtung: "runter" },
    sortierung: [{ key: "gesamtkosten", label: "Gesamtkosten" }, { key: "servicegebuehr", label: "Servicegebühr" }],
    totalLabel: "Kosten p. a.",
    suchwoerter: ["robo-advisor", "roboadvisor", "digitale vermögensverwaltung", "etf-portfolio", "geldanlage automatisch", "vermögensverwaltung"],
    lesen: (p) => nurWerte({
      servicegebuehr: zahl(pfad(p.conditions, "service_variable.value")),
      fondskosten: zahl(pfad(p.conditions, "funds_fixed.value")),
      mindestanlage: zahl(pfad(p.conditions, "minimum_initial_investment")),
      gesamtkosten: zahl(pfad(p.calculated_conditions, "total.sum")),
    }),
    begruendung: () => "niedrigste Gesamtkosten im Jahr",
  },
  {
    kategorie: "cryptos", version: "v1", klasse: "A",
    gruppe: "anlegen",
    titel: "Krypto-Börse", einzahl: "Anbieter", mehrzahl: "Anbieter",
    params: [
      { key: "coin_symbol", label: "Kryptowährung", typ: "wahl", standard: "BTC", optionen: [{ wert: "BTC", label: "Bitcoin" }, { wert: "ETH", label: "Ethereum" }, { wert: "XRP", label: "XRP" }, { wert: "SOL", label: "Solana" }, { wert: "BNB", label: "BNB" }, { wert: "USDT", label: "Tether" }], presets: ["BTC", "ETH", "SOL"] },
      { key: "order_volume", label: "Ordervolumen", typ: "zahl", standard: 500, einheit: "€", min: 10, max: 100000, schritt: 10, presets: [100, 500, 2000] },
      // Ändert die Trefferzahl nicht, geht aber in die Gebührenrechnung ein.
      { key: "order_count_pa", label: "Orders / Jahr", typ: "zahl", standard: 12, min: 1, max: 500, schritt: 1 },
    ],
    spalten: [
      { key: "coins", label: "Handelbare Coins", kurz: "Coins", art: "zahl", richtung: "hoch", schmal: true },
      { key: "sparplan", label: "Sparplan", art: "haken", schmal: true },
      { key: "staking", label: "Staking", art: "haken", schmal: true },
      { key: "gebuehren", label: "Gebühren je Order", kurz: "Gebühren", art: "geld", richtung: "runter" },
    ],
    bestwert: { key: "gebuehren", richtung: "runter" },
    filter: [{ key: "sparplan", label: "nur mit Sparplan", wert: true }],
    sortierung: [{ key: "gebuehren", label: "Gebühren" }, { key: "coins", label: "Auswahl" }],
    totalLabel: "Gebühren je Order",
    suchwoerter: ["krypto", "bitcoin", "ethereum", "kryptobörse", "kryptowährung", "coins", "wallet", "staking"],
    hinweis: "Kryptowährungen sind hochvolatil. Der Wert kann stark schwanken, bis hin zum vollständigen Verlust des eingesetzten Kapitals.",
    lesen: (p) => nurWerte({
      coins: zahl(pfad(p.details, "number_of_tradable_cryptocurrencies")),
      sparplan: haken(pfad(p.details, "savings_plan_available")),
      staking: haken(pfad(p.details, "staking_available")),
      steuerreport: haken(pfad(p.details, "tax_report_available")),
      gebuehren: zahl(pfad(p.calculated_conditions, "total.sum")),
    }),
    begruendung: () => "niedrigste Gebühren bei Ihrem Ordervolumen",
  },
  {
    kategorie: "crowdinvesting", version: "v1", klasse: "A",
    gruppe: "anlegen",
    titel: "Crowdinvesting", einzahl: "Projekt", mehrzahl: "Projekte",
    // Zwei native Filter, die bisher fehlten (gemessen 16.09.2026 an 5 Projekten):
    // `location` trennt Deutschland (2) von EU ohne Deutschland (2) — eines der fünf
    // führt gar kein Land. `duration_to` ist die Höchstlaufzeit: bis 36 Monate bleiben 2,
    // bis 60 Monate 3 Projekte. `duration_from` kennt die API zwar, filtert aber nichts
    // (12, 36 und 60 liefern alle fünf) — deshalb steht hier nur die Obergrenze.
    params: [
      { key: "location", label: "Wo investiert wird", typ: "wahl", standard: "0", optionen: [{ wert: "0", label: "alle Länder" }, { wert: "2", label: "nur Deutschland" }, { wert: "1", label: "EU ohne Deutschland" }] },
      { key: "duration_to", label: "Laufzeit höchstens", typ: "wahl", standard: "", einheit: "Monate", optionen: [{ wert: "", label: "egal" }, { wert: "24", label: "24 Monate" }, { wert: "36", label: "36 Monate" }, { wert: "60", label: "60 Monate" }, { wert: "120", label: "120 Monate" }] },
    ],
    spalten: [
      { key: "zins", label: "Zins p. a.", kurz: "Zins", art: "prozent", richtung: "hoch" },
      { key: "laufzeit", label: "Laufzeit", art: "monate", schmal: true },
      { key: "anlageklasse", label: "Anlageklasse", art: "text", schmal: true },
      { key: "mindestanlage", label: "Mindestanlage", art: "geld", richtung: "runter" },
    ],
    bestwert: { key: "zins", richtung: "hoch" },
    sortierung: [{ key: "zins", label: "Zins" }, { key: "mindestanlage", label: "Mindestanlage" }],
    suchwoerter: ["crowdinvesting", "crowdfunding", "schwarmfinanzierung", "nachrangdarlehen", "immobilien crowdinvesting"],
    hinweis: "Crowdinvesting ist eine Risikoanlage: Nachrangdarlehen und Beteiligungen können bis zum Totalverlust führen. Der genannte Zins ist ein Zielwert, keine Garantie.",
    lesen: (p) => nurWerte({
      zins: zahl(pfad(p.conditions, "fixed_interest.value")),
      laufzeit: zahl(pfad(p.conditions, "investment_duration.value")),
      mindestanlage: zahl(pfad(p.conditions, "minimum_investment.value")),
      anlageklasse: text(pfad(p.details, "asset_class.value")),
      region: text(pfad(p.details, "investment_country.value")),
    }),
    begruendung: () => "höchster Zielzins",
  },
  {
    kategorie: "taxsoftware", version: "v1", klasse: "A",
    gruppe: "konto",
    titel: "Steuersoftware", einzahl: "Programm", mehrzahl: "Programme",
    /**
     * 🚨 Zwei Korrekturen vom 16.09.2026, beide aus derselben Wurzel: ich hatte die
     * Vokabeln geraten statt sie im Produkt nachzulesen.
     *
     * `availability` hielt ich für tot, weil ONLINE/OFFLINE/APP/DESKTOP jedes Mal null
     * Programme lieferten. Die gültigen Werte stehen aber im Produkt selbst, in
     * `details.available_platforms`: `desktop.Windows/MacOS/Linux`, `smartphone.Android/
     * iOS`, `web.Browser`. Kleingeschrieben nimmt der Filter genau diese — `browser`,
     * `android`, `ios` liefern beide Programme, `windows`, `macos` und `linux` null
     * (beide Programme laufen nur im Browser und als App). Die drei Desktop-Werte stehen
     * deshalb NICHT in der Liste: eine Auswahl, die immer leer ausgeht, ist die Falle,
     * die uns beim Minikredit schon einmal untergekommen ist.
     *
     * `target_group` stand mit EMPLOYEE/SELF_EMPLOYED/PENSIONER/STUDENT hier — dieselbe
     * Falle: nur „employee" trägt Programme, die drei anderen leeren die Liste. (Die
     * Schreibweise ist der API egal, die Auswahl nicht: `list/taxsoftware/targetgroups`
     * führt acht Gruppen, sieben davon ohne ein einziges Programm.) Beide Programme sind
     * Allzweckprogramme — die Frage „für wen" hat hier keine Antwort und ist raus.
     */
    params: [
      { key: "availability", label: "Läuft auf", typ: "wahl", standard: "", optionen: [{ wert: "", label: "egal" }, { wert: "browser", label: "im Browser" }, { wert: "android", label: "Android" }, { wert: "ios", label: "iPhone / iPad" }] },
      { key: "tax_returns_per_year", label: "Steuererklärungen / Jahr", typ: "zahl", standard: 1, min: 1, max: 20, schritt: 1 },
      { key: "duration_of_use", label: "Nutzungsdauer", typ: "wahl", standard: 1, einheit: "Jahre", optionen: [1, 2, 3, 5].map((j) => ({ wert: String(j), label: `${j} ${j === 1 ? "Jahr" : "Jahre"}` })) },
    ],
    spalten: [
      { key: "preis", label: "Kaufpreis", art: "geld", richtung: "runter" },
      { key: "gebuehr", label: "Gebühr je Steuererklärung", kurz: "je Erklärung", art: "geld", richtung: "runter" },
      { key: "plattformen", label: "Plattformen", art: "text", schmal: true },
    ],
    bestwert: { key: "gesamt", richtung: "runter" },
    sortierung: [{ key: "gesamt", label: "Kosten" }, { key: "preis", label: "Kaufpreis" }],
    totalLabel: "Kosten",
    suchwoerter: ["steuersoftware", "steuererklärung", "elster", "steuerprogramm", "steuer-app"],
    lesen: (p) => {
      const pl = pfad(p.details, "available_platforms") as Record<string, Record<string, boolean>> | null;
      const liste: string[] = [];
      if (pl) {
        if (Object.values(pl.web || {}).some(Boolean)) liste.push("Web");
        if (Object.values(pl.smartphone || {}).some(Boolean)) liste.push("App");
        if (Object.values(pl.desktop || {}).some(Boolean)) liste.push("Desktop");
      }
      return nurWerte({
        preis: zahl(pfad(p.conditions, "taxsoftware.purchasing_price.value")),
        gebuehr: zahl(pfad(p.conditions, "taxsoftware.tax_filing_fee.value")),
        plattformen: liste.length ? liste.join(", ") : null,
        gesamt: zahl(pfad(p.calculated_conditions, "total.sum")),
      });
    },
    begruendung: () => "niedrigste Kosten",
  },
  {
    kategorie: "rentaldepositinsurances", version: "v1", klasse: "A",
    gruppe: "versicherung",
    titel: "Mietkaution", einzahl: "Bürgschaft", mehrzahl: "Angebote",
    params: [
      { key: "rental_deposit", label: "Kautionshöhe", typ: "zahl", standard: 900, einheit: "€", min: 100, max: 20000, schritt: 50, presets: [500, 900, 1500, 3000] },
      { key: "duration", label: "Laufzeit", typ: "wahl", standard: 3, einheit: "Jahre", optionen: [1, 2, 3, 5].map((j) => ({ wert: String(j), label: `${j} ${j === 1 ? "Jahr" : "Jahre"}` })) },
      { key: "usage", label: "Nutzung", typ: "wahl", standard: "PRIVATE", optionen: [{ wert: "PRIVATE", label: "privat" }, { wert: "FIRMA", label: "Firma" }, { wert: "STARTUP", label: "Start-up" }] },
      // Gemessen 16.09.2026: 0 → 2 Angebote · 1 → 3 · 2 → 5. Der Wert ist eine
      // Höchstanforderung, nicht ein Haken; die Voreinstellung zeigt alles.
      { key: "tenant_protection", label: "Mieterschutz", typ: "wahl", standard: 2, optionen: [{ wert: "2", label: "egal" }, { wert: "1", label: "mit Mieterschutz" }, { wert: "0", label: "ohne Mieterschutz" }] },
    ],
    spalten: [
      { key: "praemie", label: "Beitrag / Jahr", art: "geld", richtung: "runter" },
      { key: "online", label: "Online-Abschluss", kurz: "Online", art: "haken", schmal: true },
      { key: "wartezeit", label: "Ohne Wartezeit", kurz: "Sofort", art: "haken", schmal: true },
      { key: "mieterschutz", label: "Mieterschutz", art: "haken", schmal: true },
    ],
    bestwert: { key: "praemie", richtung: "runter" },
    filter: [{ key: "wartezeit", label: "nur ohne Wartezeit", wert: true }],
    sortierung: [{ key: "praemie", label: "Beitrag" }],
    totalLabel: "Beitrag / Jahr",
    suchwoerter: ["mietkaution", "kautionsbürgschaft", "mietkautionsversicherung", "kaution", "umzug", "mietkautionsbürgschaft"],
    lesen: (p) => nurWerte({
      praemie: zahl(pfad(p.calculated_conditions, "total.sum")) ?? zahl(pfad(erstes(pfad(p.conditions, "surety_premium")), "value")),
      online: haken(pfad(p.details, "online_closing")),
      wartezeit: haken(pfad(p.details, "no_waiting_period")),
      mieterschutz: haken(pfad(p.details, "tenant_protection")),
    }),
    begruendung: () => "niedrigster Jahresbeitrag bei Ihrer Kautionshöhe",
  },
  {
    kategorie: "pethealthinsurances", version: "v1", klasse: "A",
    gruppe: "versicherung",
    titel: "Tierkrankenversicherung", einzahl: "Tarif", mehrzahl: "Tarife",
    params: [
      // Hund/Katze ist ein Umschalter im Rechner — wie bei financeads ein Tierkranken-Vergleich, keine zwei Seiten.
      { key: "animal_type", label: "Tier", typ: "wahl", standard: "DOG", presets: ["DOG", "CAT"], optionen: [{ wert: "DOG", label: "Hund" }, { wert: "CAT", label: "Katze" }] },
      { key: "age", label: "Alter des Tieres", typ: "wahl", standard: 2, einheit: "Jahre", optionen: [0, 1, 2, 3, 5, 7, 9].map((a) => ({ wert: String(a), label: a === 0 ? "unter 1 Jahr" : `${a} Jahre` })), presets: [0, 2, 5, 9] },
      // 🚨 Fünf Stufen standen hier, drei davon leerten die Liste: 150, 350 und 500 €
      // liefern null Tarife (gefunden von `tools/registry-pruefen.mjs --api`, genau die
      // Falle, die uns beim Minikredit schon einmal untergekommen ist). Übrig bleiben
      // die beiden, die der Markt wirklich führt.
      { key: "excess", label: "Selbstbeteiligung", typ: "wahl", standard: 0, einheit: "€", optionen: [0, 250].map((e) => ({ wert: String(e), label: e === 0 ? "keine" : `${e} €` })) },
      /**
       * Leistungsumfang — OP-Schutz oder Vollschutz.
       *
       * 🚨 Diesen Parameter hatte ich einmal als erfunden hinausgeworfen, und das war
       * falsch. Der Trugschluss: `coverage=OP` liefert dieselben 12 Tarife wie gar kein
       * `coverage`, und `filter_settings` echot ihn nicht (weil er keine Voreinstellung
       * hat — die Antwort zeigt nur, was ANGEWANDT wurde). Beides sah nach „kennt die API
       * nicht" aus. Es heißt aber nur: OP-Schutz ist die untere Stufe, die jeder Tarif
       * erfüllt. `coverage=FULL` schneidet die Liste von 12 auf 7 — gemessen 16.09.2026.
       * Die Spezifikation führt ihn ebenfalls.
       */
      { key: "coverage", label: "Leistungsumfang", typ: "wahl", standard: "", optionen: [{ wert: "", label: "OP-Schutz oder mehr" }, { wert: "FULL", label: "nur Vollschutz" }] },
      /**
       * Die Rasse setzt die Risikogruppe — die Zuordnung kommt vom Partner selbst.
       *
       * 🚨 Der Weg dahin war lang und ist eine Lehre wert: Die API kennt keinen Parameter
       * „Rasse", und `filter_settings` verriet nur `risky_group` mit RG1/RG2/RG3. Zwölf
       * geratene Parameternamen und 21 geratene Listenpfade gingen ins Leere. Erst die
       * OpenAPI-Spezifikation (`documentation/v1/affiliate.yaml`, nur mit eingeloggter
       * Browser-Sitzung lesbar) nannte den richtigen Pfad:
       * `list/pethealthinsurance/animalbreeds` — 579 Hunde- und 50 Katzenrassen, jede mit
       * ihrer Gruppe. Mit dem API-Schlüssel allein abrufbar; es fehlte nur der Pfad.
       *
       * Was die Gruppen bedeuten, sagt erst diese Liste: 160 Hunderassen in Gruppe 1,
       * 321 in Gruppe 2, 98 in Gruppe 3, und die Einteilung folgt der Größe — Chihuahua
       * RG1, Mops und Rottweiler RG3. NICHT die Listenhunde, wie ich zuerst vermutet
       * hatte. **Alle 50 Katzenrassen liegen in Gruppe 1.**
       *
       * Gemessen, was das kostet: derselbe Tarif (Getsafe Vollschutz Premium) 75,77 € in
       * Gruppe 1, 101,02 € in Gruppe 2 und 3. Für eine Deutsche Dogge bleiben vier Tarife
       * statt zwölf.
       */
      { key: "risky_group", label: "Rasse", typ: "wahl", standard: "RG1", liste: { name: "{tier}rassen", ausParam: "animal_type" }, optionen: [{ wert: "RG1", label: "Gruppe 1" }, { wert: "RG2", label: "Gruppe 2" }, { wert: "RG3", label: "Gruppe 3" }] },
    ],
    spalten: [
      { key: "beitrag", label: "Beitrag / Monat", art: "geld", richtung: "runter" },
      { key: "op_summe", label: "OP-Summe / Jahr", kurz: "OP-Summe", art: "text" },
      { key: "erstattung", label: "Erstattung (GOT-Satz)", kurz: "Erstattung", art: "text", schmal: true },
      { key: "tierarztwahl", label: "Freie Tierarztwahl", kurz: "Tierarztwahl", art: "haken", schmal: true },
    ],
    bestwert: { key: "beitrag", richtung: "runter" },
    filter: [{ key: "tierarztwahl", label: "nur mit freier Tierarztwahl", wert: true }],
    hinweis: "Die Rassegruppe stammt aus der Einstufung unseres Partners und richtet sich nach der Größe des Hundes; den endgültigen Beitrag bestätigt der Versicherer beim Abschluss. Für Katzen führen alle Rassen dieselbe Gruppe — dort ändert die Eingabe nichts.",
    sortierung: [{ key: "beitrag", label: "Beitrag" }],
    totalLabel: "Beitrag / Monat",
    suchwoerter: ["tierkrankenversicherung", "hundekrankenversicherung", "katzenkrankenversicherung", "op-versicherung hund", "tierarzt", "hund", "katze", "haustier"],
    lesen: (p) => {
      const op = zahl(pfad(p.conditions, "insurance.insured_sum_operations.value"));
      const unbegrenzt = haken(pfad(p.conditions, "insurance.insured_sum_operations.unlimited"));
      const faktor = zahl(pfad(p.details, "coverage_limit"));
      return nurWerte({
        beitrag: zahl(pfad(p.conditions, "insurance.value")),
        op_summe: unbegrenzt ? "unbegrenzt" : op === null ? null : `${Math.round(op).toLocaleString("de-DE")} €`,
        erstattung: faktor === null ? null : `${String(faktor).replace(".", ",")}-fach`,
        tierarztwahl: haken(pfad(p.details, "free_vet_choice")),
        ausland: haken(pfad(p.details, "protection_abroad")),
      });
    },
    begruendung: () => "niedrigster Monatsbeitrag für Ihr Tier",
  },
  {
    kategorie: "supplementarydentalinsurances", version: "v1", klasse: "A",
    gruppe: "versicherung",
    titel: "Zahnzusatzversicherung", einzahl: "Tarif", mehrzahl: "Tarife",
    // 🚨 `coverage` führt die Spezifikation auch hier — anders als bei der Tier-
    // versicherung ist er aber leer: 16 Werte durchprobiert (OP, FULL, 50/70/80/90/100,
    // dentalprosthesis, dental_treatment, prophylaxis, orthodontics, BASIC, PREMIUM,
    // COMFORT …), jeder einzelne leert die Liste von 32 auf 0. Ein Feld, aus dem sich die
    // gültige Vokabel ableiten ließe, gibt es nicht: `details` ist bei allen 32 Tarifen
    // leer. Ein Filter, der immer leer ausgeht, bleibt draußen — was ein Tarif erstattet,
    // steht in den drei Prozentspalten.
    params: [{ key: "age", label: "Alter", typ: "wahl", standard: 40, einheit: "Jahre", optionen: [20, 30, 40, 50, 60, 70].map((a) => ({ wert: String(a), label: `${a} Jahre` })), presets: [20, 40, 60] }],
    spalten: [
      { key: "beitrag", label: "Beitrag / Jahr", art: "geld", richtung: "runter" },
      { key: "zahnersatz", label: "Zahnersatz", art: "prozent", richtung: "hoch" },
      { key: "zahnbehandlung", label: "Zahnbehandlung", art: "prozent", richtung: "hoch", schmal: true },
      { key: "prophylaxe", label: "Prophylaxe", art: "prozent", richtung: "hoch", schmal: true },
    ],
    bestwert: { key: "beitrag", richtung: "runter" },
    sortierung: [{ key: "beitrag", label: "Beitrag" }, { key: "zahnersatz", label: "Zahnersatz" }],
    totalLabel: "Beitrag / Jahr",
    suchwoerter: ["zahnzusatzversicherung", "zahnersatz", "zahnzusatz", "implantat", "zahnreinigung", "krone", "zahnarzt"],
    lesen: (p) => {
      const e = erstes(pfad(p.conditions, "insurance_premium"));
      return nurWerte({
        beitrag: zahl(pfad(e, "value")),
        zahnersatz: zahl(pfad(e, "requirements.dentalprosthesis.coverage_maximum")),
        zahnbehandlung: zahl(pfad(e, "requirements.dental_treatment.coverage_maximum")),
        prophylaxe: zahl(pfad(e, "requirements.prophylaxis.coverage_rate")),
      });
    },
    begruendung: () => "niedrigster Jahresbeitrag in Ihrem Alter",
  },
  {
    /**
     * Auslandskrankenversicherung — am 15.09.2026 als `defekt` eingetragen, weil der
     * Endpunkt parameterunabhängig HTTP 400 warf
     * (`BaseController::getApiIdentifier(): Return value must be of type string, null
     * returned` — ein Serverfehler beim Partner). Die Seite lief seitdem mit Hinweis und
     * `noindex`.
     *
     * 🚨 Am 16.09.2026 nachgeprüft: der Endpunkt antwortet wieder, und zwar mit vollen
     * Konditionen — das ist keine Klasse-B-Anbieterliste mehr, sondern eine Klasse-A-
     * Kategorie mit Beitrag, Reisedauer, Altersspanne und Leistungen. Lehre: einen als
     * kaputt vermerkten Endpunkt bei jeder Gegenprüfung erneut anfassen, sonst bleibt
     * eine Seite für immer stillgelegt, weil sie einmal stillgelegt war.
     *
     * Drei Angaben, die alle drei den Preis bewegen (gemessen an 8 Tarifen):
     *   Alter            bis 64 gleich · ab 65 teurer (Münchener Verein 8,40 → 19,80 €)
     *                    · ab 70 noch einmal (ERGO 19,90 → 34,90 €)
     *   Reisedauer       bis 45 Tage gleich · 56 Tage hebt American Express auf 49,59 €
     *                    · 70 Tage lassen nur noch zwei Tarife übrig · 90 Tage keinen
     *   Wer reist        Single · mit Kind · Paar — jeweils eigene Tarife und Preise
     *
     * 🚨 Und hier steckte dieselbe Falle wie bei `country_rating`: OHNE Angaben rechnet
     * die API still mit **Alter 60 und 45 Reisetagen** (`filter_settings` verrät es).
     * Wer 70 ist, bekam den Preis eines 60-Jährigen zu sehen. Unsere Voreinstellungen
     * stehen deshalb ausdrücklich da.
     */
    kategorie: "travelhealthinsurances", version: "v1", klasse: "A",
    gruppe: "versicherung",
    titel: "Auslandskrankenversicherung", einzahl: "Tarif", mehrzahl: "Tarife",
    params: [
      { key: "age", label: "Alter", typ: "wahl", standard: 40, einheit: "Jahre", optionen: [18, 30, 40, 50, 60, 65, 70].map((a) => ({ wert: String(a), label: `${a} Jahre` })), presets: [30, 40, 65] },
      { key: "travel_duration", label: "Reisedauer", typ: "wahl", standard: 30, einheit: "Tage", optionen: [7, 14, 30, 45, 56, 70].map((t) => ({ wert: String(t), label: `bis ${t} Tage` })) },
      { key: "insured_person", label: "Wer reist", typ: "wahl", standard: "1", optionen: [{ wert: "1", label: "eine Person" }, { wert: "2", label: "mit Kind" }, { wert: "3", label: "Paar" }] },
      // `excess` ist ein Schalter, keine Summe: 0 liefert alle acht Tarife, 1 die zwei
      // mit Selbstbeteiligung (40 € und 91 €). 50/100/250 ändern nichts.
      { key: "excess", label: "Selbstbeteiligung", typ: "wahl", standard: "0", optionen: [{ wert: "0", label: "ohne" }, { wert: "1", label: "mit Selbstbeteiligung" }] },
    ],
    spalten: [
      { key: "beitrag", label: "Beitrag / Jahr", art: "geld", richtung: "runter" },
      { key: "reisedauer", label: "Reisedauer bis", kurz: "Reisedauer", art: "zahl", einheit: "Tage", richtung: "hoch", schmal: true },
      { key: "ruecktransport", label: "Rücktransport", art: "haken", schmal: true },
      { key: "alter", label: "Eintrittsalter", art: "text", schmal: true, nurDetails: true },
      { key: "notfall", label: "Notfallhilfe", art: "haken", schmal: true, nurDetails: true },
      { key: "begleitung", label: "Mitaufnahme Begleitperson", kurz: "Begleitung", art: "haken", schmal: true, nurDetails: true },
    ],
    bestwert: { key: "beitrag", richtung: "runter" },
    filter: [{ key: "ruecktransport", label: "nur mit Rücktransport", wert: true }],
    kursblatt: {
      band: "streuung", podest: 3, stempel: "Günstigster Tarif",
      ohne: { key: "beitrag", ist: 0, text: "ohne ausgewiesenen Beitrag" },
    },
    sortierung: [{ key: "beitrag", label: "Beitrag" }, { key: "reisedauer", label: "Reisedauer" }],
    totalLabel: "Beitrag / Jahr",
    hinweis: "Der Beitrag gilt für ein ganzes Jahr mit beliebig vielen Reisen bis zur genannten Höchstdauer je Reise. Ab 65 Jahren verlangen fast alle Versicherer mehr — das Alter oben ändert die ganze Liste.",
    suchwoerter: ["auslandskrankenversicherung", "reisekrankenversicherung", "reise", "urlaub", "rücktransport", "auslandsreise-krankenversicherung"],
    lesen: (p) => {
      const e = erstes(pfad(p.conditions, "insurance_premium"));
      const ja = (v: unknown) => v === "yes" ? true : v === "no" ? false : null;
      const von = zahl(pfad(e, "age_minimum")); const bis = zahl(pfad(e, "age_maximum"));
      return nurWerte({
        beitrag: zahl(pfad(e, "value")),
        reisedauer: zahl(pfad(e, "travel_time")),
        ruecktransport: ja(pfad(e, "included_services.medical_repatriation")),
        notfall: ja(pfad(e, "included_services.emergency_care")),
        begleitung: ja(pfad(e, "included_services.rooming_in")),
        alter: von === null && bis === null ? null : `${von ?? 0}–${bis ?? "?"} Jahre`,
        selbstbeteiligung: zahl(pfad(e, "deductable")),
      });
    },
    begruendung: () => "günstigster Jahresbeitrag für Ihr Alter und Ihre Reisedauer",
  },
  // ── Klasse B: nur Anbieterlisten ──
  versicherung("liabilityinsurances", "Privathaftpflicht", ["privathaftpflicht", "haftpflichtversicherung", "haftpflicht", "schadensersatz", "deckungssumme", "schlüsselverlust"]),
  versicherung("homeinsurances", "Hausratversicherung", ["hausratversicherung", "hausrat", "einbruch", "wohnungsbrand", "leitungswasser", "fahrraddiebstahl"]),
  versicherung("legalprotectioninsurances", "Rechtsschutzversicherung", ["rechtsschutzversicherung", "rechtsschutz", "anwalt", "gerichtskosten", "verkehrsrechtsschutz", "arbeitsrecht"]),
  versicherung("termlifeinsurances", "Risikolebensversicherung", ["risikolebensversicherung", "risikoleben", "lebensversicherung", "hinterbliebene", "todesfall", "familie absichern"]),
  versicherung("funeralexpenseinsurances", "Sterbegeldversicherung", ["sterbegeldversicherung", "sterbegeld", "bestattung", "beerdigung", "bestattungskosten"]),
  versicherung("dogliabilityinsurances", "Hundehaftpflicht", ["hundehaftpflicht", "hundehalterhaftpflicht", "hund", "tierhalterhaftpflicht"]),
  versicherung("horseliabilityinsurances", "Pferdehaftpflicht", ["pferdehaftpflicht", "pferd", "reiten", "tierhalterhaftpflicht pferd"]),
  versicherung("deviceinsurances", "Geräteversicherung", ["geräteversicherung", "handyversicherung", "elektronikversicherung", "smartphone", "laptop", "displayschaden"]),
];

const INDEX = new Map<Kategorie, KategorieDef>(KATEGORIEN.map((k) => [k.kategorie, k]));

export function kategorieDef(k: string): KategorieDef | null {
  return INDEX.get(k as Kategorie) ?? null;
}

export function alleKategorien(): KategorieDef[] {
  return KATEGORIEN;
}

export function istKategorie(k: string): k is Kategorie {
  return INDEX.has(k as Kategorie);
}

/** Alle Parameterschlüssel einer Kategorie, die an die API dürfen (Allowlist der Route). */
export function erlaubteParams(def: KategorieDef): Set<string> {
  return new Set(def.params.map((p) => p.key));
}

/** Die serialisierbare Sicht für Client und Insel — ohne `lesen`/`begruendung`. */
export function defLite(def: KategorieDef): DefLite {
  const { kategorie, klasse, gruppe, defekt, titel, einzahl, mehrzahl, params, spalten, bestwert, filter, auswahl, kennzahlen, kursblatt, sortierung, totalLabel, hinweis } = def;
  return { kategorie, klasse, gruppe, defekt, titel, einzahl, mehrzahl, params, spalten, bestwert, filter, auswahl, kennzahlen, kursblatt, sortierung, totalLabel, hinweis };
}

export const GRUPPEN_LABEL: Record<Gruppe, string> = { anlegen: "Geld anlegen", konto: "Konto & Karte", kredit: "Kredit & Finanzierung", versicherung: "Versicherungen" };
