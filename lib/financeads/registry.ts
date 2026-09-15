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
import type { ApiProdukt, Kategorie, KategorieDef, KennWert, ParamDef, SpalteDef } from "./typen.ts";
import { pfad, zahl, text, haken, klartext, erstes, maxWert, eintragMit, nurWerte } from "./lesehilfen.ts";

// ─── wiederkehrende Bausteine ─────────────────────────────────────────────────────────

const P = {
  anlage: (standard: number, presets: number[]): ParamDef => ({ key: "average_balance", label: "Anlagebetrag", typ: "zahl", standard, einheit: "€", min: 500, max: 1000000, schritt: 500, presets }),
  monate: (standard: number, presets: number[]): ParamDef => ({ key: "months", label: "Laufzeit", typ: "wahl", standard, einheit: "Monate", optionen: presets.map((m) => ({ wert: String(m), label: m === 1 ? "1 Monat" : `${m} Monate` })), presets }),
};

const S = {
  sicherung: { key: "sicherung", label: "Einlagensicherung", kurz: "Sicherung", art: "text", schmal: true } satisfies SpalteDef,
};

function sicherung(p: ApiProdukt): string | null {
  const iso = text(pfad(p.details, "deposit_protection.country_iso"));
  const name = text(pfad(p.details, "deposit_protection.name"));
  if (!iso) return name;
  return iso === "DE" ? "Deutschland" : LAND[iso] || iso;
}
const LAND: Record<string, string> = { AT: "Österreich", NL: "Niederlande", FR: "Frankreich", ES: "Spanien", IT: "Italien", MT: "Malta", LU: "Luxemburg", SE: "Schweden", LV: "Lettland", LT: "Litauen", EE: "Estland", PT: "Portugal", BE: "Belgien", IE: "Irland", CZ: "Tschechien", PL: "Polen", HR: "Kroatien", SK: "Slowakei", BG: "Bulgarien", CY: "Zypern", GB: "Großbritannien" };

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
    kategorie, version: "v1", klasse: "B", titel, einzahl: "Tarif", mehrzahl: "Tarife",
    params: [], spalten: [], sortierung: [], suchwoerter, lesen: leer, ...extra,
  };
}

// ─── die Kategorien ───────────────────────────────────────────────────────────────────

const KATEGORIEN: KategorieDef[] = [
  {
    kategorie: "savingsaccounts", version: "v1", klasse: "A",
    titel: "Tagesgeld", einzahl: "Tagesgeldkonto", mehrzahl: "Konten",
    params: [P.anlage(10000, [5000, 10000, 25000, 50000]), P.monate(12, [3, 6, 12, 24])],
    spalten: [
      { key: "zins", label: "Zins p. a.", kurz: "Zins", art: "prozent", richtung: "hoch" },
      { key: "ertrag", label: "Ertrag im Zeitraum", kurz: "Ertrag", art: "geld", richtung: "hoch" },
      S.sicherung,
    ],
    bestwert: { key: "ertrag", richtung: "hoch" },
    sortierung: [{ key: "ertrag", label: "Ertrag" }, { key: "zins", label: "Zins" }],
    totalLabel: "Ertrag",
    suchwoerter: ["tagesgeld", "tagesgeldkonto", "zinsen", "sparen", "sparkonto", "geld parken", "notgroschen"],
    lesen: zinsKennzahlen,
    begruendung: (p) => p.kennzahlen.sicherung === "Deutschland" ? "höchster Ertrag mit deutscher Einlagensicherung" : "höchster Ertrag im gewählten Zeitraum",
  },
  {
    kategorie: "fixedsavingsaccounts", version: "v1", klasse: "A",
    titel: "Festgeld", einzahl: "Festgeldkonto", mehrzahl: "Konten",
    params: [P.anlage(20000, [5000, 10000, 20000, 50000]), P.monate(12, [6, 12, 24, 36, 60])],
    spalten: [
      { key: "zins", label: "Zins p. a.", kurz: "Zins", art: "prozent", richtung: "hoch" },
      { key: "ertrag", label: "Ertrag über die Laufzeit", kurz: "Ertrag", art: "geld", richtung: "hoch" },
      S.sicherung,
    ],
    bestwert: { key: "ertrag", richtung: "hoch" },
    sortierung: [{ key: "ertrag", label: "Ertrag" }, { key: "zins", label: "Zins" }],
    totalLabel: "Ertrag",
    suchwoerter: ["festgeld", "festgeldkonto", "termingeld", "zinsen", "laufzeit", "sparbrief"],
    lesen: zinsKennzahlen,
    begruendung: (p) => p.kennzahlen.sicherung === "Deutschland" ? "höchster Ertrag mit deutscher Einlagensicherung" : "höchster Ertrag über die Laufzeit",
  },
  {
    kategorie: "currentaccounts", version: "v1.02", klasse: "A",
    titel: "Girokonto", einzahl: "Girokonto", mehrzahl: "Konten",
    params: [
      { key: "incoming_monthly", label: "Geldeingang / Monat", typ: "zahl", standard: 1200, einheit: "€", min: 0, max: 20000, schritt: 100, presets: [0, 1200, 2500] },
      { key: "average_balance", label: "Durchschnittlicher Kontostand", typ: "zahl", standard: 1000, einheit: "€", min: 0, max: 100000, schritt: 100 },
      { key: "target_group", label: "Zielgruppe", typ: "wahl", standard: "", fest: true, optionen: [{ wert: "", label: "alle" }, { wert: "student", label: "Studierende" }, { wert: "pupil", label: "Schüler" }, { wert: "apprentice", label: "Azubis" }, { wert: "employee", label: "Angestellte" }] },
      { key: "free_accounts", label: "Nur kostenlose Konten", typ: "wahl", standard: "", fest: true, optionen: [{ wert: "", label: "alle" }, { wert: "1", label: "nur kostenlose" }] },
    ],
    spalten: [
      { key: "kontofuehrung", label: "Kontoführung / Jahr", kurz: "Kontoführung", art: "geld", richtung: "runter" },
      { key: "dispozins", label: "Dispozins", kurz: "Dispo", art: "prozent", richtung: "runter", schmal: true },
      { key: "karte", label: "Karte", art: "text", schmal: true },
      { key: "kosten", label: "Kosten / Jahr gesamt", kurz: "Kosten / Jahr", art: "saldo", richtung: "runter" },
    ],
    bestwert: { key: "kosten", richtung: "runter" },
    sortierung: [{ key: "kosten", label: "Kosten" }, { key: "kontofuehrung", label: "Kontoführung" }, { key: "dispozins", label: "Dispozins" }],
    totalLabel: "Kosten / Jahr",
    suchwoerter: ["girokonto", "konto", "kontoführung", "kontowechsel", "gehaltskonto", "dispo", "kostenloses konto", "studentenkonto", "schülerkonto", "kinderkonto"],
    lesen: kontoKennzahlen,
    begruendung: (p) => (p.kennzahlen.kosten as number) <= 0 ? "keine Kontoführungsgebühr bei Ihrem Geldeingang" : "niedrigste Jahreskosten bei Ihrem Geldeingang",
  },
  {
    kategorie: "businessaccounts", version: "v1", klasse: "A",
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
    sortierung: [{ key: "kosten", label: "Kosten" }, { key: "kontofuehrung", label: "Kontoführung" }],
    totalLabel: "Kosten / Jahr",
    suchwoerter: ["geschäftskonto", "firmenkonto", "selbstständig", "freiberufler", "gmbh", "unternehmen", "gewerbe"],
    lesen: (p) => nurWerte({ ...kontoKennzahlen(p), buchung: zahl(pfad(eintragMit(pfad(p.conditions, "transaction"), "type", "online"), "value")) }),
    begruendung: () => "niedrigste Jahreskosten bei Ihrer Buchungszahl",
  },
  {
    kategorie: "creditcards", version: "v1.02", klasse: "A",
    titel: "Kreditkarte", einzahl: "Kreditkarte", mehrzahl: "Karten",
    params: [
      { key: "transaction_eu", label: "Umsatz / Jahr in Europa", typ: "zahl", standard: 2500, einheit: "€", min: 0, max: 100000, schritt: 500 },
      { key: "travel_creditcard", label: "Reisekreditkarte", typ: "wahl", standard: "", fest: true, optionen: [{ wert: "", label: "alle" }, { wert: "1", label: "nur Reisekarten" }] },
      { key: "free_products", label: "Nur kostenlose Karten", typ: "wahl", standard: "", fest: true, optionen: [{ wert: "", label: "alle" }, { wert: "1", label: "nur kostenlose" }] },
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
    titel: "Depot", einzahl: "Depot", mehrzahl: "Depots",
    params: [
      { key: "depot_volume", label: "Depotvolumen", typ: "zahl", standard: 20000, einheit: "€", min: 1000, max: 1000000, schritt: 1000, presets: [5000, 20000, 50000] },
      { key: "order_count_pa", label: "Orders / Jahr", typ: "zahl", standard: 12, min: 1, max: 500, schritt: 1, presets: [4, 12, 50] },
      { key: "order_volume", label: "Ordervolumen", typ: "zahl", standard: 1000, einheit: "€", min: 100, max: 100000, schritt: 100 },
    ],
    spalten: [
      { key: "depotgebuehr", label: "Depotgebühr / Jahr", kurz: "Depotgebühr", art: "geld", richtung: "runter" },
      { key: "order", label: "Ordergebühr", art: "text", schmal: true },
      { key: "orderkosten", label: "Orderkosten / Jahr", kurz: "Orders / Jahr", art: "geld", richtung: "runter", schmal: true },
      { key: "kosten", label: "Kosten / Jahr gesamt", kurz: "Kosten / Jahr", art: "geld", richtung: "runter" },
    ],
    bestwert: { key: "kosten", richtung: "runter" },
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
    titel: "Ratenkredit", einzahl: "Kredit", mehrzahl: "Angebote",
    params: [
      { key: "loan", label: "Kreditsumme", typ: "zahl", standard: 10000, einheit: "€", min: 500, max: 100000, schritt: 500, presets: [5000, 10000, 20000, 50000] },
      // Zahl statt Auswahl: Minikredite laufen 1–6 Monate, Ratenkredite 12–120 — eine feste
      // Optionsliste würde die eine oder die andere Seite auf null Angebote klemmen (gemessen 15.09.2026).
      { key: "duration_months", label: "Laufzeit", typ: "zahl", standard: 60, einheit: "Monate", min: 1, max: 120, schritt: 1, presets: [24, 36, 48, 60, 84] },
      // Kein Standard: `usage=FREE` filtert Minikredite weg; ohne den Parameter kommen dieselben 14 Ratenkredite.
      { key: "usage", label: "Verwendung", typ: "wahl", standard: "", fest: true, optionen: [{ wert: "", label: "alle" }, { wert: "CAR", label: "Auto" }, { wert: "MODERNIZATION", label: "Modernisierung" }] },
      { key: "type", label: "Kreditart", typ: "wahl", standard: "", fest: true, optionen: [{ wert: "", label: "alle" }, { wert: "INSTALLMENT_LOAN", label: "Ratenkredit" }, { wert: "MINI_LOAN", label: "Minikredit" }, { wert: "CAR", label: "Autokredit" }] },
    ],
    spalten: [
      { key: "effzins", label: "Effektiver Jahreszins", kurz: "eff. Zins", art: "prozent", richtung: "runter", ab: true },
      { key: "sollzins", label: "Sollzins", art: "prozent", richtung: "runter", schmal: true, ab: true },
      { key: "laufzeit", label: "Laufzeit", art: "monate", schmal: true },
      { key: "rate", label: "Monatsrate", kurz: "Rate / Monat", art: "geld", richtung: "runter", ab: true },
    ],
    bestwert: { key: "effzins", richtung: "runter" },
    sortierung: [{ key: "effzins", label: "Effektivzins" }, { key: "rate", label: "Rate" }],
    totalLabel: "Rate / Monat",
    suchwoerter: ["ratenkredit", "kredit", "darlehen", "autokredit", "minikredit", "sofortkredit", "umschuldung", "effektivzins", "kreditvergleich"],
    hinweis: "Die Konditionen sind bonitätsabhängig; „ab“ bezeichnet den günstigsten Zins des Anbieters. Die Angaben nach § 6a PAngV mit repräsentativem Beispiel stehen bei jedem Angebot unter „Pflichtangaben“.",
    lesen: (p) => nurWerte({
      effzins: zahl(pfad(p.conditions, "interest_effective.value")),
      effzins_bis: zahl(pfad(p.conditions, "interest_effective.value_highest")),
      sollzins: zahl(pfad(p.conditions, "interest_nominal.value")),
      laufzeit: zahl(pfad(p.conditions, "duration.value")),
      rate: zahl(pfad(p.conditions, "installments.value")),
      pflicht: klartext(pfad(p.details, "mandatory_information")),
    }),
    begruendung: () => "günstigster Effektivzins bei Ihrer Kreditsumme und Laufzeit",
  },
  {
    kategorie: "mortgages", version: "v1.02", klasse: "A",
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
    titel: "Robo-Advisor", einzahl: "Robo-Advisor", mehrzahl: "Anbieter",
    params: [
      { key: "one_time_investment", label: "Einmalanlage", typ: "zahl", standard: 10000, einheit: "€", min: 0, max: 1000000, schritt: 500, presets: [1000, 10000, 50000] },
      { key: "monthly_savings_contribution", label: "Sparrate / Monat", typ: "zahl", standard: 100, einheit: "€", min: 0, max: 10000, schritt: 25, presets: [0, 100, 500] },
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
    titel: "Krypto-Börse", einzahl: "Anbieter", mehrzahl: "Anbieter",
    params: [
      { key: "coin_symbol", label: "Kryptowährung", typ: "wahl", standard: "BTC", optionen: [{ wert: "BTC", label: "Bitcoin" }, { wert: "ETH", label: "Ethereum" }, { wert: "XRP", label: "XRP" }, { wert: "SOL", label: "Solana" }, { wert: "BNB", label: "BNB" }, { wert: "USDT", label: "Tether" }], presets: ["BTC", "ETH", "SOL"] },
      { key: "order_volume", label: "Ordervolumen", typ: "zahl", standard: 500, einheit: "€", min: 10, max: 100000, schritt: 10, presets: [100, 500, 2000] },
    ],
    spalten: [
      { key: "coins", label: "Handelbare Coins", kurz: "Coins", art: "zahl", richtung: "hoch", schmal: true },
      { key: "sparplan", label: "Sparplan", art: "haken", schmal: true },
      { key: "staking", label: "Staking", art: "haken", schmal: true },
      { key: "gebuehren", label: "Gebühren je Order", kurz: "Gebühren", art: "geld", richtung: "runter" },
    ],
    bestwert: { key: "gebuehren", richtung: "runter" },
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
    titel: "Crowdinvesting", einzahl: "Projekt", mehrzahl: "Projekte",
    params: [],
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
    titel: "Steuersoftware", einzahl: "Programm", mehrzahl: "Programme",
    params: [],
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
    titel: "Mietkaution", einzahl: "Bürgschaft", mehrzahl: "Angebote",
    params: [
      { key: "rental_deposit", label: "Kautionshöhe", typ: "zahl", standard: 900, einheit: "€", min: 100, max: 20000, schritt: 50, presets: [500, 900, 1500, 3000] },
      { key: "duration", label: "Laufzeit", typ: "wahl", standard: 3, einheit: "Jahre", optionen: [1, 2, 3, 5].map((j) => ({ wert: String(j), label: `${j} ${j === 1 ? "Jahr" : "Jahre"}` })) },
      { key: "usage", label: "Nutzung", typ: "wahl", standard: "PRIVATE", optionen: [{ wert: "PRIVATE", label: "privat" }, { wert: "FIRMA", label: "Firma" }, { wert: "STARTUP", label: "Start-up" }] },
    ],
    spalten: [
      { key: "praemie", label: "Beitrag / Jahr", art: "geld", richtung: "runter" },
      { key: "online", label: "Online-Abschluss", kurz: "Online", art: "haken", schmal: true },
      { key: "wartezeit", label: "Ohne Wartezeit", kurz: "Sofort", art: "haken", schmal: true },
      { key: "mieterschutz", label: "Mieterschutz", art: "haken", schmal: true },
    ],
    bestwert: { key: "praemie", richtung: "runter" },
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
    titel: "Tierkrankenversicherung", einzahl: "Tarif", mehrzahl: "Tarife",
    params: [
      { key: "animal_type", label: "Tier", typ: "wahl", standard: "DOG", fest: true, optionen: [{ wert: "DOG", label: "Hund" }, { wert: "CAT", label: "Katze" }] },
      { key: "age", label: "Alter des Tieres", typ: "wahl", standard: 2, einheit: "Jahre", optionen: [0, 1, 2, 3, 5, 7, 9].map((a) => ({ wert: String(a), label: a === 0 ? "unter 1 Jahr" : `${a} Jahre` })), presets: [0, 2, 5, 8] },
      { key: "excess", label: "Selbstbeteiligung", typ: "wahl", standard: 0, einheit: "€", optionen: [0, 150, 250, 350, 500].map((e) => ({ wert: String(e), label: e === 0 ? "keine" : `${e} €` })) },
      { key: "coverage", label: "Schutz", typ: "wahl", standard: "OP", optionen: [{ wert: "OP", label: "OP-Schutz" }, { wert: "FULL", label: "Vollschutz" }] },
      { key: "risky_group", label: "Rassegruppe", typ: "wahl", standard: "RG1", optionen: [{ wert: "RG1", label: "Gruppe 1" }, { wert: "RG2", label: "Gruppe 2" }, { wert: "RG3", label: "Gruppe 3" }] },
    ],
    spalten: [
      { key: "beitrag", label: "Beitrag / Monat", art: "geld", richtung: "runter" },
      { key: "op_summe", label: "OP-Summe / Jahr", kurz: "OP-Summe", art: "text" },
      { key: "erstattung", label: "Erstattung (GOT-Satz)", kurz: "Erstattung", art: "text", schmal: true },
      { key: "tierarztwahl", label: "Freie Tierarztwahl", kurz: "Tierarztwahl", art: "haken", schmal: true },
    ],
    bestwert: { key: "beitrag", richtung: "runter" },
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
    titel: "Zahnzusatzversicherung", einzahl: "Tarif", mehrzahl: "Tarife",
    params: [{ key: "age", label: "Alter", typ: "wahl", standard: 40, einheit: "Jahre", optionen: [20, 30, 40, 50, 60, 70].map((a) => ({ wert: String(a), label: `${a} Jahre` })), presets: [25, 40, 55] }],
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
  // ── Klasse B: nur Anbieterlisten ──
  versicherung("liabilityinsurances", "Privathaftpflicht", ["privathaftpflicht", "haftpflichtversicherung", "haftpflicht", "schadensersatz", "deckungssumme", "schlüsselverlust"]),
  versicherung("homeinsurances", "Hausratversicherung", ["hausratversicherung", "hausrat", "einbruch", "wohnungsbrand", "leitungswasser", "fahrraddiebstahl"]),
  versicherung("legalprotectioninsurances", "Rechtsschutzversicherung", ["rechtsschutzversicherung", "rechtsschutz", "anwalt", "gerichtskosten", "verkehrsrechtsschutz", "arbeitsrecht"]),
  versicherung("termlifeinsurances", "Risikolebensversicherung", ["risikolebensversicherung", "risikoleben", "lebensversicherung", "hinterbliebene", "todesfall", "familie absichern"]),
  versicherung("funeralexpenseinsurances", "Sterbegeldversicherung", ["sterbegeldversicherung", "sterbegeld", "bestattung", "beerdigung", "bestattungskosten"]),
  versicherung("dogliabilityinsurances", "Hundehaftpflicht", ["hundehaftpflicht", "hundehalterhaftpflicht", "hund", "tierhalterhaftpflicht"]),
  versicherung("horseliabilityinsurances", "Pferdehaftpflicht", ["pferdehaftpflicht", "pferd", "reiten", "tierhalterhaftpflicht pferd"]),
  versicherung("deviceinsurances", "Geräteversicherung", ["geräteversicherung", "handyversicherung", "elektronikversicherung", "smartphone", "laptop", "displayschaden"]),
  versicherung("travelhealthinsurances", "Auslandskrankenversicherung", ["auslandskrankenversicherung", "reisekrankenversicherung", "reise", "urlaub", "rücktransport"], { defekt: true }),
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
