/* GENERIERT von tools/financeads-registry-export.mjs aus lib/financeads/registry.ts — nicht von Hand ändern.
   Kategorien und Parameter der financeads-Vergleiche für den Block finanzleser/vergleich-quelle. */
window.FL_FINANCEADS = {
  "kategorien": [
    {
      "kategorie": "savingsaccounts",
      "titel": "Tagesgeld",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "average_balance",
          "label": "Anlagebetrag",
          "typ": "zahl",
          "standard": 10000,
          "einheit": "€",
          "min": 500,
          "max": 1000000,
          "schritt": 500,
          "optionen": [],
          "presets": [
            5000,
            10000,
            25000,
            50000
          ],
          "fest": false
        },
        {
          "key": "months",
          "label": "Laufzeit",
          "typ": "wahl",
          "standard": 12,
          "einheit": "Monate",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "3",
              "label": "3 Monate"
            },
            {
              "wert": "6",
              "label": "6 Monate"
            },
            {
              "wert": "12",
              "label": "12 Monate"
            },
            {
              "wert": "24",
              "label": "24 Monate"
            }
          ],
          "presets": [
            3,
            6,
            12,
            24
          ],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "zins",
          "label": "Zins p. a."
        },
        {
          "key": "ertrag",
          "label": "Ertrag im Zeitraum"
        },
        {
          "key": "sicherung",
          "label": "Einlagensicherung"
        }
      ],
      "bestwert": "ertrag"
    },
    {
      "kategorie": "fixedsavingsaccounts",
      "titel": "Festgeld",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "average_balance",
          "label": "Anlagebetrag",
          "typ": "zahl",
          "standard": 20000,
          "einheit": "€",
          "min": 500,
          "max": 1000000,
          "schritt": 500,
          "optionen": [],
          "presets": [
            5000,
            10000,
            20000,
            50000
          ],
          "fest": false
        },
        {
          "key": "months",
          "label": "Laufzeit",
          "typ": "wahl",
          "standard": 12,
          "einheit": "Monate",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "6",
              "label": "6 Monate"
            },
            {
              "wert": "12",
              "label": "12 Monate"
            },
            {
              "wert": "24",
              "label": "24 Monate"
            },
            {
              "wert": "36",
              "label": "36 Monate"
            },
            {
              "wert": "60",
              "label": "60 Monate"
            }
          ],
          "presets": [
            6,
            12,
            24,
            36,
            60
          ],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "zins",
          "label": "Zins p. a."
        },
        {
          "key": "ertrag",
          "label": "Ertrag über die Laufzeit"
        },
        {
          "key": "sicherung",
          "label": "Einlagensicherung"
        }
      ],
      "bestwert": "ertrag"
    },
    {
      "kategorie": "currentaccounts",
      "titel": "Girokonto",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "incoming_monthly",
          "label": "Geldeingang / Monat",
          "typ": "zahl",
          "standard": 1200,
          "einheit": "€",
          "min": 0,
          "max": 20000,
          "schritt": 100,
          "optionen": [],
          "presets": [
            0,
            1200,
            2500
          ],
          "fest": false
        },
        {
          "key": "average_balance",
          "label": "Durchschnittlicher Kontostand",
          "typ": "zahl",
          "standard": 1000,
          "einheit": "€",
          "min": 0,
          "max": 100000,
          "schritt": 100,
          "optionen": [],
          "presets": [],
          "fest": false
        },
        {
          "key": "target_group",
          "label": "Zielgruppe",
          "typ": "wahl",
          "standard": "",
          "einheit": "",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "",
              "label": "alle"
            },
            {
              "wert": "student",
              "label": "Studierende"
            },
            {
              "wert": "pupil",
              "label": "Schüler"
            },
            {
              "wert": "apprentice",
              "label": "Azubis"
            },
            {
              "wert": "employee",
              "label": "Angestellte"
            }
          ],
          "presets": [
            "",
            "student",
            "pupil",
            "apprentice"
          ],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "kontofuehrung",
          "label": "Kontoführung / Jahr"
        },
        {
          "key": "dispozins",
          "label": "Dispozins"
        },
        {
          "key": "karte",
          "label": "Karte"
        },
        {
          "key": "kosten",
          "label": "Kosten / Jahr gesamt"
        }
      ],
      "bestwert": "kosten"
    },
    {
      "kategorie": "businessaccounts",
      "titel": "Geschäftskonto",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "transaction",
          "label": "Buchungen / Monat",
          "typ": "zahl",
          "standard": 10,
          "einheit": "",
          "min": 0,
          "max": 1000,
          "schritt": 5,
          "optionen": [],
          "presets": [
            10,
            50,
            100
          ],
          "fest": false
        },
        {
          "key": "transaction_documented",
          "label": "Beleghafte Buchungen / Monat",
          "typ": "zahl",
          "standard": 0,
          "einheit": "",
          "min": 0,
          "max": 500,
          "schritt": 1,
          "optionen": [],
          "presets": [],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "kontofuehrung",
          "label": "Kontoführung / Jahr"
        },
        {
          "key": "buchung",
          "label": "Preis je Buchung"
        },
        {
          "key": "sicherung",
          "label": "Einlagensicherung"
        },
        {
          "key": "kosten",
          "label": "Kosten / Jahr gesamt"
        }
      ],
      "bestwert": "kosten"
    },
    {
      "kategorie": "creditcards",
      "titel": "Kreditkarte",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "transaction_eu",
          "label": "Umsatz / Jahr in Europa",
          "typ": "zahl",
          "standard": 2500,
          "einheit": "€",
          "min": 0,
          "max": 100000,
          "schritt": 500,
          "optionen": [],
          "presets": [],
          "fest": false
        },
        {
          "key": "travel_creditcard",
          "label": "Reisekreditkarte",
          "typ": "wahl",
          "standard": "",
          "einheit": "",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "",
              "label": "alle Karten"
            },
            {
              "wert": "1",
              "label": "nur Reisekarten"
            }
          ],
          "presets": [
            "",
            "1"
          ],
          "fest": false
        },
        {
          "key": "free_products",
          "label": "Jahresgebühr",
          "typ": "wahl",
          "standard": "",
          "einheit": "",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "",
              "label": "alle Karten"
            },
            {
              "wert": "1",
              "label": "nur ohne Jahresgebühr"
            }
          ],
          "presets": [
            "",
            "1"
          ],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "jahresgebuehr",
          "label": "Jahresgebühr"
        },
        {
          "key": "auslandsgebuehr",
          "label": "Fremdwährungsgebühr"
        },
        {
          "key": "abhebung",
          "label": "Bargeld im Inland"
        },
        {
          "key": "zahlungsart",
          "label": "Kartenart"
        }
      ],
      "bestwert": "jahresgebuehr"
    },
    {
      "kategorie": "brokerageaccounts",
      "titel": "Depot",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "depot_volume",
          "label": "Depotvolumen",
          "typ": "zahl",
          "standard": 20000,
          "einheit": "€",
          "min": 1000,
          "max": 1000000,
          "schritt": 1000,
          "optionen": [],
          "presets": [
            5000,
            20000,
            50000
          ],
          "fest": false
        },
        {
          "key": "order_count_pa",
          "label": "Orders / Jahr",
          "typ": "zahl",
          "standard": 12,
          "einheit": "",
          "min": 1,
          "max": 500,
          "schritt": 1,
          "optionen": [],
          "presets": [
            4,
            12,
            50
          ],
          "fest": false
        },
        {
          "key": "order_volume",
          "label": "Ordervolumen",
          "typ": "zahl",
          "standard": 1000,
          "einheit": "€",
          "min": 100,
          "max": 100000,
          "schritt": 100,
          "optionen": [],
          "presets": [],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "depotgebuehr",
          "label": "Depotgebühr / Jahr"
        },
        {
          "key": "order",
          "label": "Ordergebühr"
        },
        {
          "key": "orderkosten",
          "label": "Orderkosten / Jahr"
        },
        {
          "key": "kosten",
          "label": "Kosten / Jahr gesamt"
        }
      ],
      "bestwert": "kosten"
    },
    {
      "kategorie": "loans",
      "titel": "Ratenkredit",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "loan",
          "label": "Kreditsumme",
          "typ": "zahl",
          "standard": 10000,
          "einheit": "€",
          "min": 500,
          "max": 100000,
          "schritt": 500,
          "optionen": [],
          "presets": [
            5000,
            10000,
            20000,
            50000
          ],
          "fest": false
        },
        {
          "key": "duration_months",
          "label": "Laufzeit",
          "typ": "zahl",
          "standard": 60,
          "einheit": "Monate",
          "min": 1,
          "max": 120,
          "schritt": 1,
          "optionen": [],
          "presets": [
            24,
            36,
            48,
            60,
            84
          ],
          "fest": false
        },
        {
          "key": "usage",
          "label": "Verwendung",
          "typ": "wahl",
          "standard": "",
          "einheit": "",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "",
              "label": "alle"
            },
            {
              "wert": "CAR",
              "label": "Auto"
            },
            {
              "wert": "MODERNIZATION",
              "label": "Modernisierung"
            }
          ],
          "presets": [],
          "fest": true
        },
        {
          "key": "type",
          "label": "Kreditart",
          "typ": "wahl",
          "standard": "",
          "einheit": "",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "",
              "label": "alle"
            },
            {
              "wert": "INSTALLMENT_LOAN",
              "label": "Ratenkredit"
            },
            {
              "wert": "MINI_LOAN",
              "label": "Minikredit"
            },
            {
              "wert": "CAR",
              "label": "Autokredit"
            }
          ],
          "presets": [],
          "fest": true
        }
      ],
      "spalten": [
        {
          "key": "effzins",
          "label": "Effektiver Jahreszins"
        },
        {
          "key": "sollzins",
          "label": "Sollzins"
        },
        {
          "key": "laufzeit",
          "label": "Laufzeit"
        },
        {
          "key": "rate",
          "label": "Monatsrate"
        },
        {
          "key": "effzins_bis",
          "label": "Zins bis"
        },
        {
          "key": "rate_bis",
          "label": "Rate bis"
        },
        {
          "key": "zwei_drittel",
          "label": "⅔ der Kunden erhalten"
        },
        {
          "key": "bearbeitung",
          "label": "Bearbeitungsgebühr"
        },
        {
          "key": "grenzen",
          "label": "Zins gilt für"
        },
        {
          "key": "bonitaetsfrei",
          "label": "Zins unabhängig von der Bonität"
        },
        {
          "key": "kreditgeber",
          "label": "Kreditgeber"
        }
      ],
      "bestwert": "effzins"
    },
    {
      "kategorie": "mortgages",
      "titel": "Baufinanzierung",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "loan",
          "label": "Darlehenssumme",
          "typ": "zahl",
          "standard": 300000,
          "einheit": "€",
          "min": 50000,
          "max": 2000000,
          "schritt": 10000,
          "optionen": [],
          "presets": [
            200000,
            300000,
            400000,
            500000
          ],
          "fest": false
        },
        {
          "key": "duration",
          "label": "Zinsbindung",
          "typ": "wahl",
          "standard": 10,
          "einheit": "Jahre",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "5",
              "label": "5 Jahre"
            },
            {
              "wert": "10",
              "label": "10 Jahre"
            },
            {
              "wert": "15",
              "label": "15 Jahre"
            },
            {
              "wert": "20",
              "label": "20 Jahre"
            }
          ],
          "presets": [
            5,
            10,
            15,
            20
          ],
          "fest": false
        },
        {
          "key": "redemption",
          "label": "Anfängliche Tilgung",
          "typ": "wahl",
          "standard": "0.02",
          "einheit": "%",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "0.01",
              "label": "1 %"
            },
            {
              "wert": "0.02",
              "label": "2 %"
            },
            {
              "wert": "0.03",
              "label": "3 %"
            },
            {
              "wert": "0.04",
              "label": "4 %"
            }
          ],
          "presets": [],
          "fest": false
        },
        {
          "key": "loan_to_value_limit",
          "label": "Beleihungsauslauf",
          "typ": "wahl",
          "standard": 80,
          "einheit": "%",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "60",
              "label": "bis 60 %"
            },
            {
              "wert": "80",
              "label": "bis 80 %"
            },
            {
              "wert": "90",
              "label": "bis 90 %"
            },
            {
              "wert": "100",
              "label": "bis 100 %"
            }
          ],
          "presets": [],
          "fest": false
        },
        {
          "key": "postal_code",
          "label": "Postleitzahl",
          "typ": "zahl",
          "standard": 60311,
          "einheit": "",
          "min": 1000,
          "max": 99999,
          "schritt": 1,
          "optionen": [],
          "presets": [],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "sollzins",
          "label": "Sollzins p. a."
        },
        {
          "key": "effzins",
          "label": "Effektiver Jahreszins"
        },
        {
          "key": "restschuld",
          "label": "Restschuld am Ende der Bindung"
        },
        {
          "key": "rate",
          "label": "Monatsrate"
        }
      ],
      "bestwert": "effzins"
    },
    {
      "kategorie": "buildingsavings",
      "titel": "Bausparen",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "usage",
          "label": "Ziel",
          "typ": "wahl",
          "standard": "LOAN",
          "einheit": "",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "LOAN",
              "label": "Darlehen"
            },
            {
              "wert": "SAVING",
              "label": "Sparen"
            }
          ],
          "presets": [],
          "fest": true
        }
      ],
      "spalten": [
        {
          "key": "guthabenzins",
          "label": "Guthabenzins"
        },
        {
          "key": "darlehenszins",
          "label": "Darlehenszins eff."
        },
        {
          "key": "abschlussgebuehr",
          "label": "Abschlussgebühr"
        },
        {
          "key": "kontogebuehr",
          "label": "Kontogebühr / Jahr"
        }
      ],
      "bestwert": "darlehenszins_von"
    },
    {
      "kategorie": "roboadvisor",
      "titel": "Robo-Advisor",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "one_time_investment",
          "label": "Einmalanlage",
          "typ": "zahl",
          "standard": 10000,
          "einheit": "€",
          "min": 1,
          "max": 1000000,
          "schritt": 500,
          "optionen": [],
          "presets": [
            1000,
            10000,
            50000
          ],
          "fest": false
        },
        {
          "key": "monthly_savings_contribution",
          "label": "Sparrate / Monat",
          "typ": "zahl",
          "standard": 100,
          "einheit": "€",
          "min": 1,
          "max": 10000,
          "schritt": 25,
          "optionen": [],
          "presets": [
            50,
            100,
            500
          ],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "servicegebuehr",
          "label": "Servicegebühr p. a."
        },
        {
          "key": "fondskosten",
          "label": "Fondskosten p. a."
        },
        {
          "key": "mindestanlage",
          "label": "Mindestanlage"
        },
        {
          "key": "gesamtkosten",
          "label": "Gesamtkosten p. a."
        }
      ],
      "bestwert": "gesamtkosten"
    },
    {
      "kategorie": "cryptos",
      "titel": "Krypto-Börse",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "coin_symbol",
          "label": "Kryptowährung",
          "typ": "wahl",
          "standard": "BTC",
          "einheit": "",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "BTC",
              "label": "Bitcoin"
            },
            {
              "wert": "ETH",
              "label": "Ethereum"
            },
            {
              "wert": "XRP",
              "label": "XRP"
            },
            {
              "wert": "SOL",
              "label": "Solana"
            },
            {
              "wert": "BNB",
              "label": "BNB"
            },
            {
              "wert": "USDT",
              "label": "Tether"
            }
          ],
          "presets": [
            "BTC",
            "ETH",
            "SOL"
          ],
          "fest": false
        },
        {
          "key": "order_volume",
          "label": "Ordervolumen",
          "typ": "zahl",
          "standard": 500,
          "einheit": "€",
          "min": 10,
          "max": 100000,
          "schritt": 10,
          "optionen": [],
          "presets": [
            100,
            500,
            2000
          ],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "coins",
          "label": "Handelbare Coins"
        },
        {
          "key": "sparplan",
          "label": "Sparplan"
        },
        {
          "key": "staking",
          "label": "Staking"
        },
        {
          "key": "gebuehren",
          "label": "Gebühren je Order"
        }
      ],
      "bestwert": "gebuehren"
    },
    {
      "kategorie": "crowdinvesting",
      "titel": "Crowdinvesting",
      "klasse": "A",
      "defekt": false,
      "params": [],
      "spalten": [
        {
          "key": "zins",
          "label": "Zins p. a."
        },
        {
          "key": "laufzeit",
          "label": "Laufzeit"
        },
        {
          "key": "anlageklasse",
          "label": "Anlageklasse"
        },
        {
          "key": "mindestanlage",
          "label": "Mindestanlage"
        }
      ],
      "bestwert": "zins"
    },
    {
      "kategorie": "taxsoftware",
      "titel": "Steuersoftware",
      "klasse": "A",
      "defekt": false,
      "params": [],
      "spalten": [
        {
          "key": "preis",
          "label": "Kaufpreis"
        },
        {
          "key": "gebuehr",
          "label": "Gebühr je Steuererklärung"
        },
        {
          "key": "plattformen",
          "label": "Plattformen"
        }
      ],
      "bestwert": "gesamt"
    },
    {
      "kategorie": "rentaldepositinsurances",
      "titel": "Mietkaution",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "rental_deposit",
          "label": "Kautionshöhe",
          "typ": "zahl",
          "standard": 900,
          "einheit": "€",
          "min": 100,
          "max": 20000,
          "schritt": 50,
          "optionen": [],
          "presets": [
            500,
            900,
            1500,
            3000
          ],
          "fest": false
        },
        {
          "key": "duration",
          "label": "Laufzeit",
          "typ": "wahl",
          "standard": 3,
          "einheit": "Jahre",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "1",
              "label": "1 Jahr"
            },
            {
              "wert": "2",
              "label": "2 Jahre"
            },
            {
              "wert": "3",
              "label": "3 Jahre"
            },
            {
              "wert": "5",
              "label": "5 Jahre"
            }
          ],
          "presets": [],
          "fest": false
        },
        {
          "key": "usage",
          "label": "Nutzung",
          "typ": "wahl",
          "standard": "PRIVATE",
          "einheit": "",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "PRIVATE",
              "label": "privat"
            },
            {
              "wert": "FIRMA",
              "label": "Firma"
            },
            {
              "wert": "STARTUP",
              "label": "Start-up"
            }
          ],
          "presets": [],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "praemie",
          "label": "Beitrag / Jahr"
        },
        {
          "key": "online",
          "label": "Online-Abschluss"
        },
        {
          "key": "wartezeit",
          "label": "Ohne Wartezeit"
        },
        {
          "key": "mieterschutz",
          "label": "Mieterschutz"
        }
      ],
      "bestwert": "praemie"
    },
    {
      "kategorie": "pethealthinsurances",
      "titel": "Tierkrankenversicherung",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "animal_type",
          "label": "Tier",
          "typ": "wahl",
          "standard": "DOG",
          "einheit": "",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "DOG",
              "label": "Hund"
            },
            {
              "wert": "CAT",
              "label": "Katze"
            }
          ],
          "presets": [
            "DOG",
            "CAT"
          ],
          "fest": false
        },
        {
          "key": "age",
          "label": "Alter des Tieres",
          "typ": "wahl",
          "standard": 2,
          "einheit": "Jahre",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "0",
              "label": "unter 1 Jahr"
            },
            {
              "wert": "1",
              "label": "1 Jahre"
            },
            {
              "wert": "2",
              "label": "2 Jahre"
            },
            {
              "wert": "3",
              "label": "3 Jahre"
            },
            {
              "wert": "5",
              "label": "5 Jahre"
            },
            {
              "wert": "7",
              "label": "7 Jahre"
            },
            {
              "wert": "9",
              "label": "9 Jahre"
            }
          ],
          "presets": [
            0,
            2,
            5,
            8
          ],
          "fest": false
        },
        {
          "key": "excess",
          "label": "Selbstbeteiligung",
          "typ": "wahl",
          "standard": 0,
          "einheit": "€",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "0",
              "label": "keine"
            },
            {
              "wert": "150",
              "label": "150 €"
            },
            {
              "wert": "250",
              "label": "250 €"
            },
            {
              "wert": "350",
              "label": "350 €"
            },
            {
              "wert": "500",
              "label": "500 €"
            }
          ],
          "presets": [],
          "fest": false
        },
        {
          "key": "coverage",
          "label": "Schutz",
          "typ": "wahl",
          "standard": "OP",
          "einheit": "",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "OP",
              "label": "OP-Schutz"
            },
            {
              "wert": "FULL",
              "label": "Vollschutz"
            }
          ],
          "presets": [],
          "fest": false
        },
        {
          "key": "risky_group",
          "label": "Rassegruppe",
          "typ": "wahl",
          "standard": "RG1",
          "einheit": "",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "RG1",
              "label": "Gruppe 1"
            },
            {
              "wert": "RG2",
              "label": "Gruppe 2"
            },
            {
              "wert": "RG3",
              "label": "Gruppe 3"
            }
          ],
          "presets": [],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "beitrag",
          "label": "Beitrag / Monat"
        },
        {
          "key": "op_summe",
          "label": "OP-Summe / Jahr"
        },
        {
          "key": "erstattung",
          "label": "Erstattung (GOT-Satz)"
        },
        {
          "key": "tierarztwahl",
          "label": "Freie Tierarztwahl"
        }
      ],
      "bestwert": "beitrag"
    },
    {
      "kategorie": "supplementarydentalinsurances",
      "titel": "Zahnzusatzversicherung",
      "klasse": "A",
      "defekt": false,
      "params": [
        {
          "key": "age",
          "label": "Alter",
          "typ": "wahl",
          "standard": 40,
          "einheit": "Jahre",
          "min": null,
          "max": null,
          "schritt": null,
          "optionen": [
            {
              "wert": "20",
              "label": "20 Jahre"
            },
            {
              "wert": "30",
              "label": "30 Jahre"
            },
            {
              "wert": "40",
              "label": "40 Jahre"
            },
            {
              "wert": "50",
              "label": "50 Jahre"
            },
            {
              "wert": "60",
              "label": "60 Jahre"
            },
            {
              "wert": "70",
              "label": "70 Jahre"
            }
          ],
          "presets": [
            25,
            40,
            55
          ],
          "fest": false
        }
      ],
      "spalten": [
        {
          "key": "beitrag",
          "label": "Beitrag / Jahr"
        },
        {
          "key": "zahnersatz",
          "label": "Zahnersatz"
        },
        {
          "key": "zahnbehandlung",
          "label": "Zahnbehandlung"
        },
        {
          "key": "prophylaxe",
          "label": "Prophylaxe"
        }
      ],
      "bestwert": "beitrag"
    },
    {
      "kategorie": "liabilityinsurances",
      "titel": "Privathaftpflicht",
      "klasse": "B",
      "defekt": false,
      "params": [],
      "spalten": [],
      "bestwert": ""
    },
    {
      "kategorie": "homeinsurances",
      "titel": "Hausratversicherung",
      "klasse": "B",
      "defekt": false,
      "params": [],
      "spalten": [],
      "bestwert": ""
    },
    {
      "kategorie": "legalprotectioninsurances",
      "titel": "Rechtsschutzversicherung",
      "klasse": "B",
      "defekt": false,
      "params": [],
      "spalten": [],
      "bestwert": ""
    },
    {
      "kategorie": "termlifeinsurances",
      "titel": "Risikolebensversicherung",
      "klasse": "B",
      "defekt": false,
      "params": [],
      "spalten": [],
      "bestwert": ""
    },
    {
      "kategorie": "funeralexpenseinsurances",
      "titel": "Sterbegeldversicherung",
      "klasse": "B",
      "defekt": false,
      "params": [],
      "spalten": [],
      "bestwert": ""
    },
    {
      "kategorie": "dogliabilityinsurances",
      "titel": "Hundehaftpflicht",
      "klasse": "B",
      "defekt": false,
      "params": [],
      "spalten": [],
      "bestwert": ""
    },
    {
      "kategorie": "horseliabilityinsurances",
      "titel": "Pferdehaftpflicht",
      "klasse": "B",
      "defekt": false,
      "params": [],
      "spalten": [],
      "bestwert": ""
    },
    {
      "kategorie": "deviceinsurances",
      "titel": "Geräteversicherung",
      "klasse": "B",
      "defekt": false,
      "params": [],
      "spalten": [],
      "bestwert": ""
    },
    {
      "kategorie": "travelhealthinsurances",
      "titel": "Auslandskrankenversicherung",
      "klasse": "B",
      "defekt": true,
      "params": [],
      "spalten": [],
      "bestwert": ""
    }
  ]
};
