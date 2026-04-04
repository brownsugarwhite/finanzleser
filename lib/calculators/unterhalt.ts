/**
 * Unterhalts-Rechner 2026
 * Vollständige Düsseldorfer Tabelle: 15 Einkommensgruppen, 4 Altersstufen,
 * Berufspauschale, Kindergeldabzug, BKB-Prüfung, Selbstbehalt.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

/* ── Params & Result ─────────────────────────────────── */

export interface UnterhaltParams {
  nettoEinkommen: number;        // Netto des Unterhaltspflichtigen
  sonstigeAbzuege: number;       // Berufliche Aufwendungen über 5 % Pauschale hinaus
  kindAlter: number;             // 0-25
  unterhaltsberechtigte: number; // Anzahl Unterhaltsberechtigte gesamt (1-5)
  erwerbstaetig: boolean;
}

export interface UnterhaltResult {
  bereinigteNetto: number;
  basisGruppe: number;           // 1-15 (aus Tabelle)
  korrigierteGruppe: number;     // nach Anpassung für Unterhaltsberechtigte
  altersstufe: number;           // 0-3 (0-5, 6-11, 12-17, 18+)
  tabellenbetrag: number;
  kgAbzug: number;               // Kindergeld-Abzug (halbes KG für Minderjährige)
  zahlbetrag: number;
  selbstbehalt: number;
  verbleibtNachUnterhalt: number;
  leistungsfaehig: boolean;
  bkb: number;                   // Bedarfskontrollbetrag
  bkbEingehalten: boolean;
}

/* ── Berechnung ──────────────────────────────────────── */

export function berechne(
  { nettoEinkommen, sonstigeAbzuege, kindAlter, unterhaltsberechtigte, erwerbstaetig }: UnterhaltParams,
  rates: RatesType = RATES,
): UnterhaltResult {
  const r = rates.unterhalt;
  const gruppen = r.tabelle.gruppen;

  // 1. Bereinigtes Nettoeinkommen
  //    Berufspauschale: 5 % vom Netto, min 50 €, max 150 €
  const berufspauschale = Math.max(50, Math.min(150, rund(nettoEinkommen * 0.05)));
  const bereinigteNetto = rund(nettoEinkommen - berufspauschale - sonstigeAbzuege);

  // 2. Einkommensgruppe bestimmen (1-15)
  let basisGruppe = 1;
  for (let i = 0; i < gruppen.length; i++) {
    if (bereinigteNetto <= gruppen[i].bisNetto) {
      basisGruppe = gruppen[i].gr;
      break;
    }
    if (i === gruppen.length - 1) {
      basisGruppe = gruppen[i].gr; // Höchste Gruppe
    }
  }

  // 3. Korrektur bei Abweichung der Unterhaltsberechtigten-Zahl
  //    Tabelle basiert auf 2 Unterhaltsberechtigten
  //    Weniger → eine Gruppe höher, mehr → eine Gruppe niedriger (je Abweichung)
  const abweichung = unterhaltsberechtigte - 2;
  let korrigierteGruppe = basisGruppe - abweichung; // weniger Berechtigte = höhere Gruppe
  korrigierteGruppe = Math.max(1, Math.min(15, korrigierteGruppe));

  // 4. Altersstufe bestimmen (0-5: Stufe 0, 6-11: Stufe 1, 12-17: Stufe 2, 18+: Stufe 3)
  let altersstufe: number;
  if (kindAlter <= 5) altersstufe = 0;
  else if (kindAlter <= 11) altersstufe = 1;
  else if (kindAlter <= 17) altersstufe = 2;
  else altersstufe = 3;

  // 5. Tabellenbetrag aus korrigierter Gruppe
  const gruppenIndex = korrigierteGruppe - 1;
  const tabellenbetrag = gruppen[gruppenIndex].betraege[altersstufe];
  const bkb = gruppen[gruppenIndex].bkb;

  // 6. Kindergeld-Abzug
  //    Minderjährige: halbes Kindergeld abziehen (129,50 €)
  //    Volljährige: volles Kindergeld abziehen (259 €)
  const istMinderjaehrig = kindAlter < 18;
  const kgAbzug = istMinderjaehrig ? r.kindergeld_abzug_minderjaehrig : r.kindergeld_pro_kind;

  const zahlbetrag = rund(Math.max(0, tabellenbetrag - kgAbzug));

  // 7. Selbstbehalt prüfen
  let selbstbehalt: number;
  if (istMinderjaehrig) {
    selbstbehalt = erwerbstaetig
      ? r.selbstbehalt.erwerbstaetig_minderjaehrige_kinder
      : r.selbstbehalt.nicht_erwerbstaetig_minderjaehrige_kinder;
  } else {
    selbstbehalt = r.selbstbehalt.angemessener_eigenbedarf_volljaerige;
  }

  const verbleibtNachUnterhalt = rund(bereinigteNetto - zahlbetrag);
  const leistungsfaehig = verbleibtNachUnterhalt >= selbstbehalt;

  // 8. BKB-Prüfung: Nach Abzug des Unterhalts muss dem Pflichtigen
  //    mindestens der Bedarfskontrollbetrag verbleiben
  const bkbEingehalten = verbleibtNachUnterhalt >= bkb;

  return {
    bereinigteNetto,
    basisGruppe,
    korrigierteGruppe,
    altersstufe,
    tabellenbetrag,
    kgAbzug,
    zahlbetrag,
    selbstbehalt,
    verbleibtNachUnterhalt,
    leistungsfaehig,
    bkb,
    bkbEingehalten,
  };
}
