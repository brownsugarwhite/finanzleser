// Kurze, SEO-orientierte Beschreibungen je Vergleich (~2 Sätze).
// Quelle der Wahrheit im Code, weil das Vergleich-CPT kein WordPress-Excerpt
// unterstützt (REST ignoriert das Feld). Wird via /api/tool-title unter der
// Tool-Überschrift im Beitrag angezeigt. Slug = Vergleich-CPT-Slug.
export const VERGLEICH_DESCRIPTIONS: Record<string, string> = {
  "private-haftpflichtversicherung-vergleich":
    "Vergleichen Sie private Haftpflichtversicherungen und finden Sie den passenden Schutz vor den finanziellen Folgen selbst verursachter Schäden. Achten Sie auf hohe Deckungssummen, Best-Leistungs-Garantie und faire Beiträge für Singles, Paare und Familien.",
  festgeldvergleich:
    "Vergleichen Sie aktuelle Festgeld-Zinsen verschiedener Banken und sichern Sie sich über die gewählte Laufzeit eine planbare, garantierte Rendite. Finden Sie das beste Angebot mit attraktivem Zinssatz und europäischer Einlagensicherung.",
  tagesgeldvergleich:
    "Vergleichen Sie Tagesgeldkonten und finden Sie die höchsten Zinsen bei voller Flexibilität und täglicher Verfügbarkeit Ihres Guthabens. Ideal, um Rücklagen sicher und verzinst zu parken – inklusive Einlagensicherung.",
  "autokredit-vergleich":
    "Vergleichen Sie Autokredite und finanzieren Sie Ihr neues oder gebrauchtes Fahrzeug zu günstigen Effektivzinsen. Finden Sie die passende Rate und sparen Sie als Barzahler oft beim Kaufpreis im Autohaus.",
  "ratenkredit-vergleich":
    "Vergleichen Sie Ratenkredite verschiedener Banken und sichern Sie sich niedrige Zinsen für Anschaffung, Umschuldung oder Ausgleich des Dispos. Finden Sie die passende Laufzeit und Monatsrate für Ihr Budget.",
  "bausparen-vergleich":
    "Vergleichen Sie Bauspartarife und sichern Sie sich schon heute günstige Zinsen für die spätere Baufinanzierung oder Modernisierung. Finden Sie den passenden Tarif für Vermögensaufbau und staatliche Förderung.",
  "baufinanzierung-vergleich":
    "Vergleichen Sie Baufinanzierungen und sichern Sie sich günstige Zinsen für den Kauf oder Bau Ihrer Immobilie. Finden Sie die optimale Kombination aus Zinsbindung, Tilgung und Monatsrate für Ihr Vorhaben.",
  "private-krankenversicherung-vergleich":
    "Vergleichen Sie private Krankenversicherungen und finden Sie den passenden Tarif mit umfangreichen Leistungen und stabilem Beitrag. Ideal für Selbstständige, Beamte und gut verdienende Angestellte über der Versicherungspflichtgrenze.",
  gaspreisvergleich:
    "Vergleichen Sie Gasanbieter und Tarife in Ihrer Region und senken Sie Ihre jährlichen Heizkosten spürbar. Wechseln Sie schnell und unkompliziert zum günstigsten Gasversorger mit fairer Preisgarantie.",
  strompreisvergleich:
    "Vergleichen Sie Stromanbieter und Tarife in Ihrer Region und sichern Sie sich die niedrigsten Strompreise. Wechseln Sie bequem zum günstigsten Versorger – auf Wunsch mit Ökostrom und Preisgarantie.",
  "risikolebensversicherung-vergleich":
    "Vergleichen Sie Risikolebensversicherungen und sichern Sie Ihre Familie für den Todesfall finanziell ab. Finden Sie hohe Versicherungssummen zu günstigen Beiträgen – besonders wichtig für Familien und Immobilienkredite.",
  "reisekrankenversicherung-vergleich":
    "Vergleichen Sie Auslandsreise-Krankenversicherungen und reisen Sie weltweit mit zuverlässigem Schutz vor hohen Behandlungs- und Rücktransportkosten. Finden Sie günstige Jahres- und Einmaltarife für Familien und Vielreisende.",
  "fahrradversicherung-vergleich":
    "Vergleichen Sie Fahrrad- und E-Bike-Versicherungen und schützen Sie Ihr Rad vor Diebstahl, Vandalismus und Reparaturkosten. Finden Sie den passenden Tarif mit Schutz auch für teure Pedelecs und Zubehör.",
  "haus-und-grundbesitzerhaftpflicht-vergleich":
    "Vergleichen Sie Haus- und Grundbesitzerhaftpflichtversicherungen und sichern Sie sich als Eigentümer gegen Schadenersatzansprüche Dritter ab. Unverzichtbar für vermietete Immobilien und unbebaute Grundstücke.",
  "unfallversicherung-vergleich":
    "Vergleichen Sie private Unfallversicherungen und sichern Sie sich rund um die Uhr gegen die finanziellen Folgen von Unfällen in Beruf und Freizeit ab. Finden Sie passende Invaliditätssummen und Leistungen für die ganze Familie.",
  "gebaeudeversicherung-vergleich":
    "Vergleichen Sie Wohngebäudeversicherungen und schützen Sie Ihr Haus vor den Kosten durch Feuer, Sturm, Hagel und Leitungswasser. Finden Sie den passenden Tarif mit sinnvollen Zusatzbausteinen wie Elementarschadenschutz.",
  "rechtsschutzversicherung-vergleich":
    "Vergleichen Sie Rechtsschutzversicherungen und sichern Sie sich gegen hohe Anwalts-, Gerichts- und Gutachterkosten ab. Finden Sie den passenden Schutz für Privat, Beruf, Verkehr und Wohnen mit kurzen Wartezeiten.",
  "hausratversicherung-vergleich":
    "Vergleichen Sie Hausratversicherungen und schützen Sie Ihr Inventar vor Schäden durch Einbruch, Feuer, Leitungswasser und Sturm. Finden Sie den passenden Tarif mit ausreichender Versicherungssumme und sinnvollen Zusatzleistungen.",
  "kfz-versicherung-vergleich":
    "Vergleichen Sie Kfz-Versicherungen und sparen Sie bei Haftpflicht, Teil- und Vollkasko für Ihr Fahrzeug. Finden Sie den günstigsten Tarif mit den passenden Leistungen und wechseln Sie einfach zum besseren Angebot.",
  "rentenversicherung-vergleich":
    "Vergleichen Sie private Rentenversicherungen und schließen Sie Ihre Versorgungslücke für einen finanziell sicheren Ruhestand. Finden Sie den passenden Tarif mit attraktiver Rendite, Flexibilität und steuerlichen Vorteilen.",
  "lebensversicherung-vergleich":
    "Vergleichen Sie Lebensversicherungen und verbinden Sie Hinterbliebenenschutz mit langfristigem Vermögensaufbau. Finden Sie den passenden Tarif für Ihre Absicherung und Altersvorsorge zu fairen Konditionen.",
  "photovoltaik-versicherung-vergleich":
    "Vergleichen Sie Photovoltaikversicherungen und schützen Sie Ihre Solaranlage vor Schäden durch Sturm, Hagel, Feuer und Diebstahl. Finden Sie den passenden Tarif inklusive Ertragsausfall-Schutz für eine sichere Investition.",
  "bussgeldrechner-vergleich":
    "Prüfen Sie Bußgelder, Punkte und Fahrverbote schnell anhand des aktuellen Bußgeldkatalogs. Verschaffen Sie sich einen Überblick über drohende Konsequenzen bei Verkehrsverstößen wie zu schnellem Fahren oder Abstandsverstößen.",
};
