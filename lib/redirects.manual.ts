// Manuell kuratierte Redirects aus der GSC-Arbeitsliste (Nicole, 2026-08-06).
// Wird in next.config.ts VOR redirects.generated gespreadet — korrigiert dort
// u. a. 17 Eintraege, die bisher nur auf die Tool-UEBERSICHT zeigten.
// Quellen lowercase (Next matcht case-insensitiv); Gross-Varianten wie /Datenschutz
// loest der Root-Resolver per Lowercase-Redirect (Loop-Falle in redirects()!).
export const manualRedirects = [
  { source: "/ruv-versicherung-kuendigen", destination: "/anbieter", permanent: true },
  { source: "/ovag-versicherung", destination: "/anbieter", permanent: true },
  { source: "/abfindungsrechner", destination: "/finanztools/rechner/abfindung", permanent: true },
  { source: "/about", destination: "/impressum", permanent: true },
  { source: "/allianz-hausratversicherung", destination: "/allianz-versicherung-kontakt", permanent: true },
  { source: "/anbieter/versicherungen-kontakt", destination: "/anbieter", permanent: true },
  { source: "/anwaltskostenrechner", destination: "/finanztools/rechner/gerichtskosten", permanent: true },
  { source: "/arbeitslosengeldrechner", destination: "/finanztools/rechner/alg1", permanent: true },
  { source: "/barmenia-unfallversicherung-kuendigen", destination: "/barmenia-versicherung-kontakt", permanent: true },
  { source: "/basler-hausratversicherung", destination: "/basler-versicherung-kontakt", permanent: true },
  { source: "/betriebliche-riesterrente", destination: "/versicherungen/altersvorsorge/riester-rente", permanent: true },
  { source: "/bgv-haftpflichtversicherung", destination: "/bgv-versicherung-kontakt", permanent: true },
  { source: "/brutto-netto-gehaltsrechner", destination: "/finanztools/rechner/brutto-netto", permanent: true },
  { source: "/checkliste-laufende-kosten-eines-e-bikes", destination: "/finanztools/checklisten/e-bike-versicherung", permanent: true },
  { source: "/cosmos-direkt-unfallversicherung", destination: "/cosmos-direkt-versicherung-kontakt", permanent: true },
  { source: "/devk-hausratversicherung", destination: "/devk-versicherung-kontakt", permanent: true },
  { source: "/dienstunfaehigkeitsversicherung-beamte", destination: "/versicherungen/berufsunfaehigkeit", permanent: true },
  { source: "/dokumente-formulare", destination: "/dokumente", permanent: true },
  { source: "/ehegattenunterhaltrechner", destination: "/finanztools/rechner/unterhalt", permanent: true },
  { source: "/festgeld-rechner", destination: "/finanztools/vergleiche/festgeldvergleich", permanent: true },
  { source: "/finanzvergleich/versicherungsvergleich", destination: "/versicherungen", permanent: true },
  { source: "/foerdermittel-neubau-und-sanierung", destination: "/finanzen/kredite-bauen/kfw-foerderung", permanent: true },
  { source: "/gebaeude-energie-gesetz-geg-2024", destination: "/finanzen/energiekosten", permanent: true },
  { source: "/gehaltsrechner", destination: "/finanztools/rechner/brutto-netto", permanent: true },
  { source: "/gehaltsrechner-2026.html", destination: "/finanztools/rechner/brutto-netto", permanent: true },
  { source: "/generali-versicherung-kontakt/%20hannover", destination: "/generali-versicherung-kontakt", permanent: true },
  { source: "/grundbuch", destination: "/finanzen/kredite-bauen", permanent: true },
  { source: "/grundrente", destination: "/dokumente/grundrente", permanent: true },
  { source: "/gvo-rechtsschutzversicherung", destination: "/gvo-versicherung-kontakt", permanent: true },
  { source: "/hausratversicherung-wechseln", destination: "/versicherungen/sachversicherungen/hausratversicherung", permanent: true },
  { source: "/hdi-haftpflichtversicherung", destination: "/hdi-versicherung-kontakt", permanent: true },
  { source: "/kfz-versicherung-rechner", destination: "/finanztools/vergleiche/kfz-versicherung-vergleich", permanent: true },
  { source: "/kindesunterhaltrechner", destination: "/finanztools/rechner/unterhalt", permanent: true },
  { source: "/krankengeld-rechner", destination: "/finanztools/rechner/krankengeld", permanent: true },
  { source: "/leasingrechner", destination: "/finanztools/rechner/leasing", permanent: true },
  { source: "/lebensversicherung-rechner", destination: "/finanztools/vergleiche/lebensversicherung-vergleich", permanent: true },
  { source: "/lohnsteuer-rechner", destination: "/finanztools/rechner/brutto-netto", permanent: true },
  { source: "/midijob", destination: "/finanztools/rechner/gleitzone", permanent: true },
  { source: "/mietkaution-rechner", destination: "/finanztools/vergleiche/mietkaution-rechner", permanent: true },
  { source: "/minijob-rechner", destination: "/finanztools/rechner/minijob", permanent: true },
  { source: "/mutterschaftsgeldrechner", destination: "/finanztools/rechner/mutterschutz", permanent: true },
  { source: "/newsletter", destination: "/", permanent: true },
  { source: "/notarkosten-grundbuchkosten", destination: "/finanzen/kredite-bauen", permanent: true },
  { source: "/pendlerpauschale-rechner", destination: "/finanztools/rechner/pendlerpauschale", permanent: true },
  { source: "/pensionsfonds", destination: "/versicherungen/altersvorsorge", permanent: true },
  { source: "/pensionskasse", destination: "/versicherungen/altersvorsorge", permanent: true },
  { source: "/pensionszusage", destination: "/versicherungen/altersvorsorge", permanent: true },
  { source: "/pflegetagegeld-vergleich", destination: "/versicherungen/pflegeversicherung", permanent: true },
  { source: "/private-krankenversicherung-rechner", destination: "/finanztools/vergleiche/private-krankenversicherung-vergleich", permanent: true },
  { source: "/prozesskostenrechner", destination: "/finanztools/rechner/gerichtskosten", permanent: true },
  { source: "/ratgeber/ratgeber-krankenversicherung", destination: "/versicherungen/krankenversicherung", permanent: true },
  { source: "/ratgeber/ratgeber-versicherungen/ratgeber-berufsunfaehigkeitsversicherung", destination: "/versicherungen/berufsunfaehigkeit", permanent: true },
  { source: "/ratgeber/ratgeber-versicherungen/ratgeber-tierversicherungen", destination: "/versicherungen/tierversicherungen", permanent: true },
  { source: "/rentenbesteuerungsrechner", destination: "/finanztools/rechner/rentenbesteuerung", permanent: true },
  { source: "/rentenlueckenrechner", destination: "/finanztools/vergleiche/rentenlueckenrechner", permanent: true },
  { source: "/steuererklaerung-frist", destination: "/steuern/steuerarten/steuererklaerung", permanent: true },
  { source: "/steuererstattung-steuererklaerung", destination: "/finanztools/rechner/steuererstattung", permanent: true },
  { source: "/steuerfreibetraege-pdf-2024", destination: "/dokumente", permanent: true },
  { source: "/steuern-deutschland", destination: "/steuern", permanent: true },
  { source: "/teilzeitrechner", destination: "/finanztools/rechner/teilzeit", permanent: true },
  { source: "/unterhaltsrechner", destination: "/finanztools/rechner/unterhalt", permanent: true },
  { source: "/versicherungen-vermieter-verwalter", destination: "/versicherungen/sachversicherungen", permanent: true },
  { source: "/versicherungskammer-bayern-haftpflichtversicherung-kuendigen", destination: "/versicherungskammer-bayern-versicherung-kontakt", permanent: true },
  { source: "/vhv-haftpflichtversicherung", destination: "/vhv-versicherung-kontakt", permanent: true },
  { source: "/wohnungsbaupraemie", destination: "/finanzen/kredite-bauen", permanent: true },
  { source: "/zinsrechner", destination: "/finanztools/rechner/zinseszins", permanent: true },

  // ── GSC-Auswertung 2026-08-20 ────────────────────────────────────────────
  // Quelle: Search-Console-Export „Nicht gefunden (404)" (12 Monate) gekreuzt mit
  // dem Leistungsbericht. 59 alte Flach-URLs mit zusammen 35.242 Impressionen, die
  // live 404 lieferten. Muster durchgehend: /<versicherer>-<sparte> bzw.
  // /<versicherer>-<sparte>-kuendigen → die Kontaktseite DESSELBEN Versicherers.
  //
  // Warum die Anbieterseite und nicht /versicherungen: Wer „Debeka Unfallversicherung
  // kuendigen" sucht, braucht die Kontaktdaten der Debeka — die Suchabsicht wird also
  // erfuellt. Eine Weiterleitung auf die Kategorie-Uebersicht wertet Google dagegen als
  // Soft-404 und uebertraegt KEINE Signale.
  //
  // Alle 35 Ziele wurden am 2026-08-20 einzeln auf HTTP 200 geprueft.
  // Wo es fuer einen Versicherer mehrere Kontaktseiten gibt, gewinnt die allgemeinste
  // (z. B. /signal-iduna-kontakt vor /signal-iduna-lebensversicherung-kontakt).
  { source: "/allianz-haftpflichtversicherung-kuendigen", destination: "/allianz-versicherung-kontakt", permanent: true }, // 908 Impr.
  { source: "/alte-leipziger-lebensversicherung-kuendigen", destination: "/alte-leipziger-versicherung-kontakt", permanent: true }, // 44 Impr.
  { source: "/alte-leipziger-unfallversicherung", destination: "/alte-leipziger-versicherung-kontakt", permanent: true }, // 9 Impr.
  { source: "/alte-leipziger-versicherung-kuendigen", destination: "/alte-leipziger-versicherung-kontakt", permanent: true }, // 44 Impr.
  { source: "/arag-versicherung-kuendigen", destination: "/arag-versicherung-kontakt", permanent: true }, // 501 Impr.
  { source: "/basler-unfallversicherung-kuendigen", destination: "/basler-versicherung-kontakt", permanent: true }, // 9 Impr.
  { source: "/concordia-rechtsschutzversicherung", destination: "/concordia-versicherung-kontakt", permanent: true }, // 971 Impr.
  { source: "/concordia-risikolebensversicherung", destination: "/concordia-versicherung-kontakt", permanent: true }, // 75 Impr.
  { source: "/cosmos-direkt-hausratversicherung", destination: "/cosmos-direkt-versicherung-kontakt", permanent: true }, // 60 Impr.
  { source: "/debeka-rechtsschutzversicherung", destination: "/debeka-krankenversicherung-kontakt", permanent: true }, // 249 Impr.
  { source: "/debeka-unfallversicherung", destination: "/debeka-krankenversicherung-kontakt", permanent: true }, // 2419 Impr.
  { source: "/deutsche-aerzteversicherung-kuendigen", destination: "/deutsche-aerzteversicherung-kontakt", permanent: true }, // 32 Impr.
  { source: "/devk-rentenversicherung", destination: "/devk-versicherung-kontakt", permanent: true }, // 1080 Impr.
  { source: "/devk-unfallversicherung-kuendigen", destination: "/devk-versicherung-kontakt", permanent: true }, // 66 Impr.
  { source: "/dialog-haftpflichtversicherung-kuendigen", destination: "/dialog-versicherung-kontakt", permanent: true }, // 52 Impr.
  { source: "/dialog-hausratversicherung", destination: "/dialog-versicherung-kontakt", permanent: true }, // 494 Impr.
  { source: "/generali-haftpflichtversicherung", destination: "/generali-versicherung-kontakt", permanent: true }, // 382 Impr.
  { source: "/generali-versicherung-kuendigen", destination: "/generali-versicherung-kontakt", permanent: true }, // 319 Impr.
  { source: "/gev-haftpflichtversicherung", destination: "/gev-versicherung-kontakt", permanent: true }, // 172 Impr.
  { source: "/gev-haftpflichtversicherung-kuendigen", destination: "/gev-versicherung-kontakt", permanent: true }, // 306 Impr.
  { source: "/gev-unfallversicherung", destination: "/gev-versicherung-kontakt", permanent: true }, // 164 Impr.
  { source: "/gev-versicherung-kuendigen", destination: "/gev-versicherung-kontakt", permanent: true }, // 5 Impr.
  { source: "/gothaer-haftpflichtversicherung", destination: "/gothaer-versicherung-kontakt", permanent: true }, // 36 Impr.
  { source: "/gothaer-versicherung-kuendigen", destination: "/gothaer-versicherung-kontakt", permanent: true }, // 185 Impr.
  { source: "/gvv-direkt-wohngebaeudeversicherung", destination: "/gvv-direkt-versicherung-kontakt", permanent: true }, // 48 Impr.
  { source: "/hannoversche-lebensversicherung-kuendigen", destination: "/hannoversche-lebensversicherung-kontakt", permanent: true }, // 71 Impr.
  { source: "/hansemerkur-krankenversicherung-kuendigen", destination: "/hansemerkur-krankenversicherung-kontakt", permanent: true }, // 1402 Impr.
  { source: "/helvetia-versicherung-kuendigen", destination: "/helvetia-versicherung-kontakt", permanent: true }, // 146 Impr.
  { source: "/hiscox-haftpflichtversicherung-kuendigen", destination: "/hiscox-versicherung-kontakt", permanent: true }, // 36 Impr.
  { source: "/huk-coburg-lebensversicherung-kuendigen", destination: "/huk-coburg-versicherung-kontakt", permanent: true }, // 5 Impr.
  { source: "/huk-coburg-rechtsschutzversicherung", destination: "/huk-coburg-versicherung-kontakt", permanent: true }, // 399 Impr.
  { source: "/huk-coburg-risikolebensversicherung", destination: "/huk-coburg-versicherung-kontakt", permanent: true }, // 1154 Impr.
  { source: "/huk24-unfallversicherung", destination: "/huk24-versicherung-kontakt", permanent: true }, // 13637 Impr.
  { source: "/lvm-rechtsschutzversicherung", destination: "/lvm-versicherung-kontakt", permanent: true }, // 44 Impr.
  { source: "/mannheimer-unfallversicherung", destination: "/mannheimer-versicherung-kontakt", permanent: true }, // 89 Impr.
  { source: "/mecklenburgische-rechtsschutzversicherung", destination: "/mecklenburgische-versicherung-kontakt", permanent: true }, // 142 Impr.
  { source: "/muenchener-verein-wohngebaeudeversicherung", destination: "/muenchener-verein-versicherung-kontakt", permanent: true }, // 69 Impr.
  { source: "/rheinland-versicherung-kuendigen", destination: "/rheinland-versicherung-kontakt", permanent: true }, // 152 Impr.
  { source: "/signal-iduna-krankenversicherung-kuendigen", destination: "/signal-iduna-kontakt", permanent: true }, // 15 Impr.
  { source: "/signal-iduna-lebensversicherung", destination: "/signal-iduna-kontakt", permanent: true }, // 653 Impr.
  { source: "/signal-iduna-pflegezusatzversicherung", destination: "/signal-iduna-kontakt", permanent: true }, // 651 Impr.
  { source: "/signal-iduna-rechtsschutzversicherung", destination: "/signal-iduna-kontakt", permanent: true }, // 465 Impr.
  { source: "/signal-iduna-tierversicherung", destination: "/signal-iduna-kontakt", permanent: true }, // 3144 Impr.
  { source: "/sparkassen-direktversicherung-kuendigen", destination: "/sparkassen-direktversicherung-kontakt", permanent: true }, // 392 Impr.
  { source: "/versicherungskammer-bayern-haftpflichtversicherung", destination: "/versicherungskammer-bayern-versicherung-kontakt", permanent: true }, // 46 Impr.
  { source: "/vpv-unfallversicherung", destination: "/vpv-lebensversicherung-kontakt", permanent: true }, // 553 Impr.
  { source: "/waldenburger-unfallversicherung", destination: "/waldenburger-versicherung-kontakt", permanent: true }, // 67 Impr.
  { source: "/wertgarantie-versicherung-kuendigen", destination: "/wertgarantie-versicherung-kontakt", permanent: true }, // 104 Impr.
  { source: "/wgv-hausratversicherung-kuendigen", destination: "/wgv-versicherung-kontakt", permanent: true }, // 722 Impr.
  { source: "/wgv-rechtsschutzversicherung", destination: "/wgv-versicherung-kontakt", permanent: true }, // 106 Impr.
  { source: "/wgv-risikolebensversicherung", destination: "/wgv-versicherung-kontakt", permanent: true }, // 79 Impr.
  { source: "/wgv-wohngebaeudeversicherung", destination: "/wgv-versicherung-kontakt", permanent: true }, // 429 Impr.
  { source: "/wuerttembergische-hausratversicherung-kuendigen", destination: "/wuerttembergische-versicherung-kontakt", permanent: true }, // 29 Impr.
  { source: "/wwk-basisrente", destination: "/wwk-versicherung-kontakt", permanent: true }, // 228 Impr.
  { source: "/zurich-kfz-versicherung", destination: "/zurich-versicherung-kontakt", permanent: true }, // 487 Impr.
  { source: "/zurich-lebensversicherung-kuendigen", destination: "/zurich-versicherung-kontakt", permanent: true }, // 222 Impr.
  { source: "/zurich-rechtsschutzversicherung", destination: "/zurich-versicherung-kontakt", permanent: true }, // 600 Impr.
  { source: "/zurich-rechtsschutzversicherung-kuendigen", destination: "/zurich-versicherung-kontakt", permanent: true }, // 103 Impr.
  { source: "/zurich-wohngebaeudeversicherung", destination: "/zurich-versicherung-kontakt", permanent: true }, // 171 Impr.
];
