#!/bin/bash

# =============================================================================
# WP-CLI Seed Script für alle 52 Finanzrechner (Vereinfachte Version)
# =============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CREATED=0
SKIPPED=0
FAILED=0

# ============================================================================
# Rechner-Daten als einzelne Variablen
# Format: create_rechner "slug" "title" "typ" "description"
# ============================================================================

create_rechner() {
  local slug="$1"
  local title="$2"
  local typ="$3"
  local beschreibung="$4"

  echo -e "${YELLOW}[Processing] ${slug}${NC}"

  # Prüfe ob Post bereits existiert
  existing=$(wp post list --post_type=rechner --name="$slug" --field=ID --allow-root 2>/dev/null | head -1)

  if [ -z "$existing" ]; then
    # Post erstellen
    post_id=$(wp post create \
      --post_type=rechner \
      --post_title="$title" \
      --post_name="$slug" \
      --post_status=publish \
      --post_excerpt="$beschreibung" \
      --allow-root 2>&1)

    if [[ "$post_id" =~ ^[0-9]+$ ]]; then
      echo -e "${GREEN}[Created] Post ID $post_id${NC}"
      wp post meta update "$post_id" rechner_typ "$typ" --allow-root >/dev/null 2>&1
      wp post meta update "$post_id" rechner_beschreibung "$beschreibung" --allow-root >/dev/null 2>&1
      ((CREATED++))
    else
      echo -e "${RED}[Error] $post_id${NC}"
      ((FAILED++))
    fi
  else
    echo -e "${YELLOW}[Skipped] Post $existing exists${NC}"
    ((SKIPPED++))
  fi
}

# ============================================================================
# STEUER & LOHN
# ============================================================================

create_rechner "brutto-netto" "Brutto-Netto-Rechner" "steuer" "Der Brutto-Netto-Rechner zeigt Ihnen, was von Ihrem Gehalt nach Abzug aller Steuern und Sozialabgaben tatsächlich übrig bleibt. Geben Sie Ihr Bruttogehalt ein und erhalten Sie eine detaillierte Aufschlüsselung aller Abzüge. Der Rechner berücksichtigt Steuerklasse, Kirchensteuer, Kranken-, Pflege-, Renten- und Arbeitslosenversicherung. Alle Werte basieren auf den aktuellen gesetzlichen Regelungen für 2026."

create_rechner "mehrwertsteuer" "Mehrwertsteuer-Rechner" "steuer" "Mit dem Mehrwertsteuer-Rechner können Sie schnell und einfach die Mehrwertsteuer aus einem Nettobetrag hinzurechnen oder aus einem Bruttobetrag herausrechnen. Ideal für Selbstständige und Unternehmer, die regelmäßig mit Nettopreisen arbeiten müssen. Der Rechner berücksichtigt den Standard-Steuersatz von 19% sowie den ermäßigten Satz von 7%. Geben Sie einen Betrag ein und wählen Sie aus, ob Sie die MwSt. addieren oder entfernen möchten."

create_rechner "einkommensteuer" "Einkommensteuer-Rechner" "steuer" "Der Einkommensteuer-Rechner berechnet die Einkommensteuer für Ihr zu versteuerndes Einkommen nach dem aktuellen Steuertarif. Tragen Sie Ihr Einkommen für das Jahr 2026 ein und erhalten Sie sofort eine genaue Steuerschuld. Der Rechner berücksichtigt Freibeträge, Sonderausgaben und außergewöhnliche Belastungen. Für Ehepaare können Sie die Günstigerprüfung durchführen und beide Veranlagungsarten vergleichen."

create_rechner "kirchensteuer" "Kirchensteuer-Rechner" "steuer" "Die Kirchensteuer wird als Zuschlag auf die Lohn- oder Einkommensteuer erhoben und variiert je nach Bundesland und Konfession. Mit unserem Rechner ermitteln Sie einfach, wie viel Kirchensteuer Sie zahlen müssen. Geben Sie Ihr Bruttoeinkommen, Ihre Steuerklasse, den Bundesland und Ihre Konfession ein. Der Rechner zeigt Ihnen die jährliche und monatliche Kirchensteuer."

create_rechner "kfz-steuer" "KFZ-Steuer-Rechner" "steuer" "Die KFZ-Steuer hängt vom Hubraum, der Schadstoffklasse und dem Erstzulassungsdatum ab. Mit unserem Rechner können Sie die jährliche Steuerlast für Ihr Fahrzeug schnell berechnen. Geben Sie die Motorisierung in Kubikzentimeter (ccm), die Schadstoffklasse und das Zulassungsjahr an. Nutzen Sie den Rechner auch zum Vergleich zwischen verschiedenen Fahrzeugen."

create_rechner "erbschaftsteuer" "Erbschaftsteuer-Rechner" "steuer" "Der Erbschaftsteuer-Rechner berechnet die anfallende Steuer, wenn Sie eine Erbschaft oder Schenkung erhalten. Die Steuer hängt vom verwandtschaftlichen Verhältnis, der Steuerklasse und dem Erbschaftsbetrag ab. Es gibt je nach Steuerklasse unterschiedliche Freibeträge und Steuersätze von 7% bis 30%. Der Rechner berücksichtigt die aktuelle Gesetzeslage und zeigt auch die Freibeträge an."

create_rechner "kalteprogression" "Kalte Progression-Rechner" "steuer" "Die kalte Progression beschreibt das Phänomen, dass durch Inflation steigende nominale Einkommen zu einer höheren Steuerlast führen, obwohl die reale Kaufkraft sinkt. Mit unserem Rechner können Sie den Effekt visualisieren und berechnen. Geben Sie Ihr aktuelles Einkommen, die erwartete Inflationsrate und den Zeitraum ein. Der Rechner zeigt den realen Kaufkraftverlust und die zusätzliche Steuerlast."

create_rechner "steuererstattung" "Steuererstattung-Rechner" "steuer" "Viele Arbeitnehmer erhalten jedes Jahr eine Steuererstattung durch die Steuererklärung. Mit unserem Rechner können Sie abschätzen, ob Sie mit einer Rückerstattung oder einer Nachzahlung rechnen müssen. Berücksichtigen Sie Werbungskosten, Sonderausgaben und außergewöhnliche Belastungen. Der Rechner zeigt eine Prognose basierend auf Ihren Eingaben."

create_rechner "steuerklassen" "Steuerklassen-Rechner" "steuer" "Ehepaare und Lebenspartner können zwischen Steuerklassenkombinationen wählen. Unser Rechner vergleicht die Kombinationen und zeigt Ihnen die günstigste Variante auf. Die Wahl der Steuerklasse hat erhebliche Auswirkungen auf die monatliche Steuerbelastung und die Jahressteuererklärung. Nutzen Sie den Rechner, um die optimale Kombination für Ihre Situation zu finden."

create_rechner "pendlerpauschale" "Pendlerpauschale-Rechner" "steuer" "Berufspendler können ihre Fahrtkosten über die Pendlerpauschale in der Steuererklärung geltend machen. Der Rechner berechnet Ihre maximale Entlastung basierend auf Tagen im Homeoffice und Arbeitstagen im Büro. Die Pendlerpauschale ist pauschal pro Kilometer der einfachen Fahrtentfernung abzugsfähig. Mit dem Rechner sehen Sie sofort, wie viel Steuern Sie sparen können."

create_rechner "stundenlohn" "Stundenlohn-Rechner" "steuer" "Der Stundenlohn-Rechner konvertiert zwischen Stundenlohn, Monatsgehalt und Jahresgehalt. Das ist praktisch, wenn Sie eine Stelle mit Stundenlohn in Betracht ziehen und das Jahresgehalt vergleichen möchten. Geben Sie einen Betrag ein und wählen Sie, in welche Zeiteinheit umgerechnet werden soll. Der Rechner berücksichtigt arbeitsfreie Tage und Feiertage automatisch."

create_rechner "abfindung" "Abfindungs-Rechner" "steuer" "Eine Abfindung kann erhebliche Steuerersparnisse bringen durch die sogenannte Fünftelregelung. Mit unserem Rechner berechnen Sie die genaue Steuerbelastung Ihrer Abfindung. Geben Sie die Abfindungssumme ein und der Rechner zeigt die Steuerschuld mit und ohne Fünftelregelung. Sie sehen sofort, wie viel Steuern Sie sparen können."

# ============================================================================
# SOZIALES & ARBEIT
# ============================================================================

create_rechner "kindergeld" "Kindergeld-Rechner" "soziales" "Das Kindergeld ist eine Leistung des Staates für Familien mit Kindern. Mit unserem Rechner ermitteln Sie schnell, wie viel Kindergeld Ihnen zusteht. Geben Sie die Anzahl und das Alter Ihrer Kinder ein und erhalten Sie die monatliche und jährliche Leistung. Der Rechner berücksichtigt unterschiedliche Sätze für das erste, zweite und dritte Kind sowie Mehrlingszuschläge."

create_rechner "elterngeld" "Elterngeld-Rechner" "soziales" "Das Elterngeld soll Eltern in den ersten Lebensmonaten des Kindes unterstützen. Der Rechner berechnet das Elterngeld (Basiselterngeld) sowie das ElterngeldPlus basierend auf Ihrem Nettoeinkommen vor der Geburt. Sie können verschiedene Szenarien durchspielen, z.B. wie sich unterschiedliche Rückkehrszenarien auswirken. Der Rechner zeigt auch die maximalen Leistungen an."

create_rechner "elternzeit" "Elternzeit-Rechner" "soziales" "Mit der Elternzeit können Sie sich Zeit für Ihre Familie nehmen, während Ihr Arbeitsplatz geschützt ist. Der Rechner hilft Ihnen zu planen, wie Sie die Elternzeit optimal zwischen Eltern aufteilen und kombinieren können. Berücksichtigen Sie Elterngeld und Einkommensverlust in Ihrer Planung. Der Rechner zeigt die verschiedenen Varianten und deren finanzielle Auswirkungen."

create_rechner "mutterschutz" "Mutterschutz-Rechner" "soziales" "Der Mutterschutz schützt Arbeitnehmerinnen vor Kündigung und regelt Beschäftigungsverbote vor und nach der Geburt. Mit unserem Rechner berechnen Sie das Mutterschaftsgeld und den Mutterschutzlohn. Geben Sie Ihr Durchschnittseinkommen der letzten drei Monate vor Beginn des Mutterschutzes ein. Der Rechner zeigt auch die Dauer des Mutterschutzes und die Leistungen der Krankenkasse."

create_rechner "wohngeld" "Wohngeld-Rechner" "soziales" "Das Wohngeld ist eine Leistung für Personen mit kleinerem Einkommen zur Unterstützung der Wohnkosten. Der Rechner ermittelt Ihren Wohngeldanspruch basierend auf Haushaltsgröße, Einkommen und Miete. Geben Sie Ihren monatlichen Bruttolohn, die Haushaltsgröße und die Kaltmiete ein. Der Rechner zeigt sofort, ob Sie Anspruch auf Wohngeld haben und in welcher Höhe."

create_rechner "buergergeld" "Bürgergeld-Rechner" "soziales" "Das Bürgergeld ist die Grundsicherung für arbeitsuchende Personen und Sozialhilfe für nicht erwerbsfähige Personen. Mit unserem Rechner können Sie Ihren Bürgergeld-Anspruch überprüfen. Berücksichtigen Sie Ihr Einkommen, Vermögen und die Haushaltsgröße. Der Rechner zeigt auch die Hinzuverdienstmöglichkeiten und wie viel Sie dazuverdienen können."

create_rechner "grundsicherung" "Grundsicherung-Rechner" "soziales" "Die Grundsicherung im Alter und bei Erwerbsminderung hilft Menschen, die nicht genug Rente erhalten. Mit unserem Rechner können Sie schnell feststellen, ob Sie Anspruch auf Grundsicherung haben. Geben Sie Ihre monatliche Rente, Betriebsrente und Ihr Einkommen ein. Der Rechner berücksichtigt Freibeträge und zeigt den Grundsicherungsbetrag."

create_rechner "alg1" "Arbeitslosengeld I-Rechner" "soziales" "Das Arbeitslosengeld I (ALG I) ist eine Versicherungsleistung für Arbeitslose mit ausreichenden Versicherungszeiten. Der Rechner berechnet die Leistungshöhe basierend auf Ihrem letzten Nettoentgelt. Sie müssen mindestens 12 Monate in den letzten 3 Jahren versichert gewesen sein. Der Rechner zeigt auch die maximale Anspruchsdauer je nach Alter und Versicherungszeiten."

create_rechner "kurzarbeitsgeld" "Kurzarbeitsgeld-Rechner" "soziales" "Das Kurzarbeitergeld ersetzt Lohnausfälle bei vorübergehender Arbeitsausfallzeit. Der Rechner berechnet das Kurzarbeitergeld basierend auf dem ausgefallenen Arbeitszeit und Ihrem Bruttolohn. Geben Sie Ihr monatliches Bruttogehalt und den Prozentsatz der Arbeitszeitreduktion ein. Der Rechner zeigt die monatliche Leistung und den Gesamtbetrag für den gewünschten Zeitraum."

create_rechner "krankengeld" "Krankengeld-Rechner" "soziales" "Das Krankengeld ersetzt das Einkommen ab dem 43. Tag der Erkrankung bis zum Ende der Arbeitsunfähigkeit. Mit unserem Rechner berechnen Sie das tägliche und monatliche Krankengeld. Geben Sie Ihren durchschnittlichen Bruttotagesverdienst der letzten 13 Wochen ein. Der Rechner zeigt auch die maximale Dauer des Krankengeldes an."

create_rechner "kinderkrankengeld" "Kinderkrankengeld-Rechner" "soziales" "Eltern erhalten Kinderkrankengeld, wenn sie wegen der Erkrankung eines Kindes arbeitsunfähig sind. Der Rechner berechnet das tägliche Kinderkrankengeld basierend auf Ihrem Durchschnittseinkommen. Die Höhe entspricht etwa 90% Ihres Nettoentgelts. Der Rechner zeigt auch die Anspruchsdauer pro Kind und Jahr."

create_rechner "pfaendung" "Pfändung-Rechner" "soziales" "Bei Schulden wird oft Lohn gepfändet. Mit unserem Rechner können Sie berechnen, wie viel Ihres Einkommens pfändbar ist. Es gibt pfändungsfreie Freigrenzen, die monatlich neu berechnet werden. Geben Sie Ihr monatliches Nettoeinkommen ein und der Rechner zeigt die pfändungsfreie Grenze und den pfändbaren Betrag."

create_rechner "urlaubsanspruch" "Urlaubsanspruch-Rechner" "soziales" "Der Urlaubsanspruch ist abhängig von der Arbeitswochenstundenzahl und der Dauer der Betriebszugehörigkeit. Der Rechner berechnet Ihren Urlaub exakt nach deutschem Recht. Berücksichtigen Sie unterschiedliche Arbeitstage pro Woche und Zeiträume der Betriebszugehörigkeit. Der Rechner zeigt auch verfallende Urlaubstage und Resturlaub."

create_rechner "minijob" "Minijob & Midijob-Rechner" "soziales" "Minijobs haben eine Verdienstgrenze von 538€ monatlich, Midijobs von 538€ bis 1076€. Mit unserem Rechner berechnen Sie korrekt für diese Beschäftigungsformen. Geben Sie das monatliche Einkommen ein und der Rechner zeigt die Arbeitgeber- und Arbeitnehmer-Beiträge. Sie sehen auch die Unterschiede in der Sozialversicherung zwischen den Formen."

create_rechner "mindestlohn" "Mindestlohn-Rechner" "soziales" "Der gesetzliche Mindestlohn garantiert einen Mindeststundenlohn für alle Arbeitnehmer. Mit unserem Rechner berechnen Sie, wie viel Sie bei der gesetzlich vorgesehenen Stundenzahl verdienen. Geben Sie die wöchentliche Arbeitszeit ein und sehen Sie sofort Monats- und Jahresgehalt. Der Rechner berücksichtigt aktuelle Mindestlohnsätze."

create_rechner "gleitzone" "Gleitzone-Rechner" "soziales" "Die Gleitzone (Übergangsbereich) betrifft Beschäftigte mit Einkommen von etwa 538€ bis 1076€ monatlich. Hier gelten besondere Regelungen für Steuern und Versicherungsbeiträge. Mit unserem Rechner berechnen Sie Ihr genaues Nettoeinkommen in der Gleitzone. Geben Sie das Bruttoeinkommen ein und sehen die reduzierten Arbeitnehmeranteile."

create_rechner "teilzeit" "Teilzeit-Rechner" "soziales" "Wenn Sie von Vollzeit zu Teilzeit wechseln oder umgekehrt, müssen Sie berechnen, wie sich dies auf Ihr Einkommen auswirkt. Unser Rechner zeigt Ihnen sofort das neue Gehalt. Geben Sie Ihr aktuelles Gehalt und die neue Wochenarbeitszeit ein. Der Rechner berechnet proportional und zeigt den Unterschied auf."

create_rechner "hinzuverdienst" "Hinzuverdienst-Rechner" "soziales" "Wer eine Altersrente bezieht, kann unbegrenzt hinzuverdienen. Bei Erwerbstätigenrenten und ALG I gibt es jedoch Hinzuverdienstgrenzen. Mit unserem Rechner prüfen Sie, ob Ihr geplanter Hinzuverdienst die Grenzen überschreitet. Geben Sie Renteneinkommen und Hinzuverdienst ein und sehen sofort, wie sich das auswirkt."

create_rechner "gruendungszuschuss" "Gründungszuschuss-Rechner" "soziales" "Der Gründungszuschuss der Agentur für Arbeit unterstützt Arbeitlose bei der Aufnahme einer selbstständigen Tätigkeit. Mit unserem Rechner berechnen Sie die mögliche Förderung basierend auf ALG I. Der Gründungszuschuss beträgt in der Regel 50% oder 300€ monatlich plus Sozialversicherungsbeiträge. Der Rechner zeigt die mögliche Gesamtförderung."

create_rechner "uebergangsgeld" "Übergangsgeld-Rechner" "soziales" "Das Übergangsgeld wird gezahlt, wenn Sie an einer Rehabilitationsmaßnahme teilnehmen. Mit unserem Rechner berechnen Sie das Übergangsgeld basierend auf Ihrem Bruttoeinkommen. Geben Sie das durchschnittliche Bruttoeinkommen der letzten 3 Monate ein. Der Rechner zeigt die tägliche und monatliche Leistung."

create_rechner "verletztengeld" "Verletztengeld-Rechner" "soziales" "Das Verletztengeld der Berufsgenossenschaft ersetzt das Einkommen bei Arbeitsunfällen und Berufskrankheiten. Der Rechner berechnet die tägliche Entschädigung ab dem ersten Tag der Arbeitsunfähigkeit. Geben Sie Ihren durchschnittlichen Bruttoverdienst ein. Der Rechner zeigt auch die maximale Dauer der Leistung."

create_rechner "gerichtskosten" "Gerichtskosten-Rechner" "soziales" "Bei Rechtsstreitigkeiten fallen Gerichtskosten und oft auch Anwaltsgebühren an. Mit unserem Rechner können Sie diese Kosten abschätzen. Geben Sie den Streitwert der Auseinandersetzung ein. Der Rechner berechnet Gerichtsgebühren nach der Gebührenordnung und Anwaltsgebühren nach dem RVG."

# ============================================================================
# RENTE & ALTERSVORSORGE
# ============================================================================

create_rechner "rente" "Renten-Rechner" "rente" "Die Gesetzliche Rentenversicherung berechnet die Rente aus Rentenpunkten, die Sie durch Einzahlungen erworben haben. Mit unserem Rechner können Sie Ihre voraussichtliche Rente berechnen. Geben Sie Ihre Rentenpunkte und das Renteneintrittsalter ein. Der Rechner zeigt die monatliche und jährliche Rente und berücksichtigt alle aktuellen Rentenwerte."

create_rechner "rentenabschlag" "Rentenabschlag-Rechner" "rente" "Wer vor der Regelaltersgrenze in Rente geht, muss mit Rentenzuschlägen rechnen. Mit unserem Rechner berechnen Sie die genauen Abzüge. Geben Sie das geplante Renteneintrittsalter und die Regelaltersgrenze ein. Der Rechner zeigt die prozentuale Kürzung pro Monat vorzeitiger Rentenbezug und die finanzielle Auswirkung."

create_rechner "rentenbeginn" "Rentenbeginn-Rechner" "rente" "Nicht alle Erwerbstätigen haben dieselbe Regelaltersgrenze für die Rente. Mit unserem Rechner können Sie Ihre persönliche Regelaltersgrenze und mögliche Renteneintrittstage berechnen. Geben Sie Ihren Geburtstag und die versichertengruppe ein. Der Rechner zeigt wann Sie frühestens und regulär in Rente gehen können."

create_rechner "rentenbesteuerung" "Rentenbesteuerung-Rechner" "rente" "Nicht die gesamte Rente ist steuerpflichtig – es gibt einen Rentenfreibetrag. Mit unserem Rechner berechnen Sie den steuerpflichtigen Anteil Ihrer Rente. Geben Sie Ihren Renteneintritt und die Rentenhöhe ein. Der Rechner berücksichtigt die progressiven Regelungen und zeigt den steuerpflichtigen Anteil und Freibetrag."

create_rechner "rentenschaetzer" "Rentenschätzer" "rente" "Wenn Sie noch nicht alle Rentenpunkte haben, können Sie Ihre künftige Rente schätzen. Mit unserem Rechner projizieren Sie Ihren Rentenanspruch basierend auf bisherigen Beitragsjahren. Geben Sie Ihre derzeitigen Rentenpunkte und erwartete zukünftige Beitragsjahre ein. Der Rechner zeigt die voraussichtliche Rente bei verschiedenen Renteneintrittsvarianten."

create_rechner "flexrente" "Flexrenten-Rechner" "rente" "Die Flexrente ermöglicht unbegrenzten Hinzuverdienst nach Renteneintritt ab 60 Jahren. Mit unserem Rechner können Sie durchspielen, wie viel Sie hinzuverdienen können. Berechnen Sie die Kombination aus Teilrente und Hinzuverdienst. Der Rechner zeigt auch die Steuerauswirkungen und Rentenversicherungsbeiträge."

create_rechner "altersteilzeit" "Altersteilzeit-Rechner" "rente" "Die Altersteilzeit ermöglicht ab 55 Jahren eine Reduzierung der Arbeitszeit mit Lohnausgleich. Der Rechner berechnet Ihren Nettolohn im Blockmodell oder Teilzeitmodell. Geben Sie Ihr aktuelles Bruttogehalt ein. Der Rechner zeigt, wie das Einkommen im Altersteilzeit-Modell verteilt wird und wie sich das auf Ihre Gesamteinkommen auswirkt."

create_rechner "witwenrente" "Witwenrente-Rechner" "rente" "Wenn ein Versicherter verstorben ist, können der überlebende Ehepartner oder Lebenspartner Witwenrente erhalten. Mit unserem Rechner berechnen Sie die voraussichtliche Witwenrente. Geben Sie die Rentenpunkte des Verstorbenen und Ihr Alter bei Renteneintritt ein. Der Rechner zeigt die Kleine und Große Witwenrente mit oder ohne Hinzuverdienst."

# ============================================================================
# KREDIT & FINANZEN
# ============================================================================

create_rechner "kredit" "Kreditrechner" "kredit" "Mit unserem Kreditrechner können Sie monatliche Raten, Gesamtzinsen und Kreditkosten berechnen. Geben Sie die Kreditsumme, den Zinssatz und die Kreditlaufzeit ein. Der Rechner zeigt die monatliche Rate, die Gesamtkosten des Kredits und wie viel Zinsen Sie zahlen. Sie können verschiedene Szenarien durchspielen und vergleichen."

create_rechner "zinseszins" "Zinseszins-Rechner" "kredit" "Der Zinseszins-Effekt zeigt, wie Ihr Kapital mit Zinsen und Zinseszinsen wächst. Mit unserem Rechner können Sie langfristige Sparanlagen berechnen. Geben Sie das Startkapital, den jährlichen Zinssatz und die Anlagedauer ein. Der Rechner zeigt das Endkapital und verdeutlicht die Macht des Zinseszins-Effekts."

create_rechner "inflation" "Inflationsrechner" "kredit" "Die Inflation vermindert die Kaufkraft Ihres Geldes über Zeit. Mit unserem Rechner können Sie berechnen, was Ihr Geld in Zukunft noch wert ist. Geben Sie einen Betrag, die erwartete Inflationsrate und den Zeitraum ein. Der Rechner zeigt den zukünftigen Wert und den Kaufkraftverlust in Euro und Prozent."

create_rechner "tilgung" "Tilgungsrechner" "kredit" "Der Tilgungsrechner erstellt einen detaillierten Tilgungsplan für Immobilienkredite. Geben Sie Darlehenssumme, Zinssatz und Tilgungssatz ein. Der Rechner zeigt Monat für Monat die Raten, Zinsen und Tilgung sowie die Restschuld. Sie sehen auch, nach wie vielen Jahren das Darlehen vollständig getilgt ist."

create_rechner "annuitaet" "Annuitätenrechner" "kredit" "Beim Annuitätendarlehen sind Zinsen und Tilgung zusammengefasst in einer Annuität (konstante Rate). Mit unserem Rechner berechnen Sie Annuitätendarlehen mit vollständigem Tilgungsplan. Der Rechner zeigt wie sich Zinsen und Tilgung über die Laufzeit entwickeln. Sie sehen auch die Gesamtzinsen und die Restschuld nach jedem Zeitraum."

create_rechner "leasing" "Leasing-Rechner" "kredit" "Leasing ist eine Alternative zum Autokauf mit Finanzierung oder Barkauf. Mit unserem Rechner können Sie die Gesamtkosten von Leasing mit Kauf vergleichen. Geben Sie Fahrzeugpreis, Leasingrate, Zinssatz für Finanzierung ein. Der Rechner zeigt die Gesamtkosten aller Varianten über die komplette Zeitspanne."

create_rechner "haushaltsrechner" "Haushalts-Rechner" "kredit" "Der Haushaltsrechner hilft Ihnen, Ihr monatliches Budget zu planen und zu überprüfen. Erfassen Sie alle regelmäßigen Einnahmen und Ausgaben. Der Rechner zeigt Ihren monatlichen Überschuss oder Fehlbetrag und hilft Ihnen, Sparquoten oder Sparquoten zu identifizieren. Eine Visualisierung zeigt die Ausgabenaufteilung."

create_rechner "paypal" "PayPal-Gebühren-Rechner" "kredit" "PayPal berechnet Gebühren für gewerbliche Transaktionen, die je nach Transaktionsart und Zielland variieren. Mit unserem Rechner berechnen Sie die genauen Gebühren. Geben Sie den Zahlungsbetrag ein und wählen Sie die Zahlungsart (Freunde, Waren, International). Der Rechner zeigt die Gebühren und den ausbezahlten Betrag."

create_rechner "bafoeg" "BAföG-Rechner" "kredit" "Das BAföG ist eine finanzielle Unterstützung für Schüler und Studenten mit kleinerem Einkommen. Mit unserem Rechner können Sie Ihren BAföG-Anspruch überprüfen. Geben Sie Ihr und das Einkommen Ihrer Eltern sowie das Vermögen ein. Der Rechner zeigt sofort, ob Sie anspruchsberechtigt sind und in welcher Höhe."

# ============================================================================
# Summary
# ============================================================================

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Summary:${NC}"
echo -e "${GREEN}Created: $CREATED${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED${NC}"
echo -e "${RED}Failed:  $FAILED${NC}"
echo -e "${GREEN}Total:   $((CREATED + SKIPPED + FAILED)) / 52${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
