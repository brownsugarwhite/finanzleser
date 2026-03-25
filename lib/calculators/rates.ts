/**
 * Zentrale Datendatei für alle Rechner
 * Alle Steuersätze, Grundfreibeträge, Tabellen etc. sind hier definiert
 * Zuletzt aktualisiert: 2026-01-01
 */

export const RATES = {
  sozialversicherung: {
    rentenversicherung: {
      arbeitnehmer_prozent: 9.3,
      arbeitgeber_prozent: 9.3,
    },
    krankenversicherung: {
      allgemeiner_beitrag_an_prozent: 7.3,
      allgemeiner_beitrag_ag_prozent: 7.3,
      durchschnittlicher_zusatzbeitrag_prozent: 2.9,
    },
    pflegeversicherung: {
      arbeitgeber_prozent: 1.7,
      arbeitnehmer_nach_kindern: {
        kinderlos_ueber23: 2.5,
        "1_kind": 1.9,
        "2_kinder": 1.65,
        "3_kinder": 1.4,
        "4_kinder": 1.15,
        "5_oder_mehr_kinder": 0.9,
      },
    },
    arbeitslosenversicherung: {
      arbeitnehmer_prozent: 1.3,
      arbeitgeber_prozent: 1.3,
    },
  },
  beitragsbemessungsgrenzen: {
    kranken_pflege: {
      monatlich: 5812.5,
      jaehrlich: 69750,
    },
    renten_arbeitslosen: {
      monatlich: 8450,
      jaehrlich: 101400,
    },
  },
  lohnsteuer: {
    grundfreibetrag: 12348,
    arbeitnehmer_pauschbetrag: 1230,
    sonderausgaben_pauschbetrag: 36,
    entlastungsbetrag_alleinerziehend: 4260,
  },
  solidaritaetszuschlag: {
    satz_prozent: 5.5,
    freigrenze_einzeln: 20350,
    freigrenze_zusammenveranlagt: 40700,
    milderungszone_faktor_prozent: 11.9,
  },
  kirchensteuer: {
    satz_8_prozent_bundeslaender: ["Bayern", "Baden-Württemberg"],
    satz_9_prozent_bundeslaender: [
      "Berlin",
      "Brandenburg",
      "Bremen",
      "Hamburg",
      "Hessen",
      "Mecklenburg-Vorpommern",
      "Niedersachsen",
      "Nordrhein-Westfalen",
      "Rheinland-Pfalz",
      "Saarland",
      "Sachsen",
      "Sachsen-Anhalt",
      "Schleswig-Holstein",
      "Thüringen",
    ],
  },
  mehrwertsteuer: {
    regelsteuersatz_prozent: 19,
    ermaessigter_steuersatz_prozent: 7,
  },
  mindestlohn: {
    stundensatz: 13.9,
  },
  elterngeld: {
    einkommensgrenze_zu_verst_einkommen: 175000,
    ersatzrate_standard_prozent: 65,
    ersatzrate_erhoehen_prozent: 67,
    netto_grenze_erhoehen_von: 1000,
    netto_grenze_erhoehen_bis: 1200,
    netto_grenze_uebergang: 1240,
    basiselterngeld: {
      min: 300,
      max: 1800,
      berechnungsgrundlage_max: 2770,
    },
    elterngeldplus: {
      min: 150,
      max: 900,
    },
  },
  rente: {
    rentenwert_bis_30jun_2026: 40.79,
    rentenwert_ab_01jul_2026: 42.52,
    durchschnittsentgelt_2026: 51944,
    max_entgeltpunkte_pro_jahr: 1.95,
    regelaltersgrenze_ab_jahrgang_1964: 67,
  },
  erbschaftsteuer: {
    freibetraege: {
      ehegatte_lebenspartner: 500000,
      kinder_stiefkinder: 400000,
      enkel_elternteil_lebt: 200000,
      enkel_elternteil_vorverstorben: 400000,
      eltern_grosseltern_erbschaft: 100000,
      steuerklasse_2: 20000,
      steuerklasse_3: 20000,
    },
    versorgungsfreibetrag: {
      ehegatte: 256000,
      kind_bis_5_jahre: 52000,
      kind_5_10_jahre: 41000,
      kind_10_15_jahre: 30700,
      kind_15_20_jahre: 20500,
      kind_20_27_jahre: 10300,
    },
    steuersaetze_prozent: {
      steuerklasse_1: [
        { bis: 75000, satz: 7 },
        { bis: 300000, satz: 11 },
        { bis: 600000, satz: 15 },
        { bis: 6000000, satz: 19 },
        { bis: 13000000, satz: 23 },
        { bis: 26000000, satz: 27 },
        { bis: 99999999, satz: 30 },
      ],
      steuerklasse_2: [
        { bis: 75000, satz: 15 },
        { bis: 300000, satz: 20 },
        { bis: 600000, satz: 25 },
        { bis: 6000000, satz: 30 },
        { bis: 13000000, satz: 35 },
        { bis: 26000000, satz: 40 },
        { bis: 99999999, satz: 43 },
      ],
      steuerklasse_3: [
        { bis: 6000000, satz: 30 },
        { bis: 99999999, satz: 50 },
      ],
    },
  },
  unterhalt: {
    kindergeld_pro_kind: 259,
    kindergeld_abzug_minderjaehrig: 129.5,
    bedarf_studierende_eigener_haushalt: 990,
    selbstbehalt: {
      erwerbstaetig_minderjaehrige_kinder: 1450,
      nicht_erwerbstaetig_minderjaehrige_kinder: 1200,
      angemessener_eigenbedarf_volljaerige: 1750,
      elternunterhalt_mindestselbstbehalt: 2650,
      ehegatten_selbstbehalt_getrennt_erwerbstaetig: 1600,
      ehegatten_selbstbehalt_getrennt_nicht_erwerbstaetig: 1475,
    },
    tabelle: {
      gruppen: [
        { gr: 1, bisNetto: 2100, prozent: 100, betraege: [486, 558, 653, 698], bkb: 1450 },
        { gr: 2, bisNetto: 2500, prozent: 105, betraege: [511, 586, 686, 733], bkb: 1750 },
        { gr: 3, bisNetto: 2900, prozent: 110, betraege: [535, 614, 719, 768], bkb: 1850 },
        { gr: 4, bisNetto: 3300, prozent: 115, betraege: [559, 642, 751, 803], bkb: 1950 },
        { gr: 5, bisNetto: 3700, prozent: 120, betraege: [584, 670, 784, 838], bkb: 2050 },
        { gr: 6, bisNetto: 4100, prozent: 128, betraege: [623, 715, 836, 894], bkb: 2150 },
        { gr: 7, bisNetto: 4500, prozent: 136, betraege: [661, 759, 889, 950], bkb: 2250 },
        { gr: 8, bisNetto: 4900, prozent: 144, betraege: [700, 804, 941, 1006], bkb: 2350 },
        { gr: 9, bisNetto: 5300, prozent: 152, betraege: [739, 849, 993, 1061], bkb: 2450 },
        { gr: 10, bisNetto: 5700, prozent: 160, betraege: [778, 893, 1045, 1117], bkb: 2550 },
        { gr: 11, bisNetto: 6400, prozent: 168, betraege: [817, 938, 1098, 1173], bkb: 2850 },
        { gr: 12, bisNetto: 7200, prozent: 176, betraege: [856, 983, 1150, 1229], bkb: 3250 },
        { gr: 13, bisNetto: 8200, prozent: 184, betraege: [895, 1027, 1202, 1285], bkb: 3750 },
        { gr: 14, bisNetto: 9700, prozent: 192, betraege: [934, 1072, 1254, 1341], bkb: 4350 },
        { gr: 15, bisNetto: 11200, prozent: 200, betraege: [972, 1116, 1306, 1397], bkb: 5100 },
      ],
    },
  },
} as const;

export type Rates = typeof RATES;
