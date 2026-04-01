import Footer from "@/components/layout/Footer";
import Link from "next/link";

const RECHNER = [
  { slug: "brutto-netto", title: "Brutto-Netto-Rechner", beschreibung: "Berechnen Sie Ihr Nettoeinkommen basierend auf Steuerklasse und Bundesland." },
  { slug: "kredit", title: "Kreditrechner", beschreibung: "Berechnen Sie Ihre Monatsrate und Gesamtzinsen für Kredite." },
  { slug: "mehrwertsteuer", title: "Mehrwertsteuer-Rechner", beschreibung: "Konvertieren Sie zwischen Brutto- und Nettobetrag mit MwSt.-Sätzen." },
  { slug: "inflation", title: "Inflationsrechner", beschreibung: "Berechnen Sie den Kaufkraftverlust durch Inflation über die Zeit." },
  { slug: "zinseszins", title: "Zinseszins-Rechner", beschreibung: "Sehen Sie, wie Ihr Geld durch Zinseszins wächst." },
  { slug: "stundenlohn", title: "Stundenlohn-Rechner", beschreibung: "Berechnen Sie Wochen- und Monatseinkommen aus Stundenlohn." },
  { slug: "kindergeld", title: "Kindergeld-Rechner", beschreibung: "Ermitteln Sie monatliches und jährliches Kindergeld pro Kind." },
  { slug: "wohngeld", title: "Wohngeld-Rechner", beschreibung: "Berechnen Sie Ihren Wohngeldanspruch vereinfacht." },
  { slug: "tilgung", title: "Tilgungsrechner", beschreibung: "Berechnen Sie Monatsrate und Gesamtzinsen für Darlehen." },
  { slug: "einkommensteuer", title: "Einkommensteuer-Rechner", beschreibung: "Berechnen Sie Einkommensteuer auf zusätzliches Einkommen." },
  { slug: "rente", title: "Renten-Rechner", beschreibung: "Berechnen Sie Ihre monatliche und jährliche Rente." },
  { slug: "erbschaftsteuer", title: "Erbschaftsteuer-Rechner", beschreibung: "Berechnen Sie die Erbschaftsteuer basierend auf Verwandtschaftsverhältnis." },
  { slug: "unterhalt", title: "Unterhalts-Rechner", beschreibung: "Berechnen Sie Unterhaltsleistungen nach der Düsseldorf-Tabelle." },
  { slug: "elterngeld", title: "Elterngeld-Rechner", beschreibung: "Ermitteln Sie Ihre Elterngeldansprüche." },
  { slug: "kfz-steuer", title: "KFZ-Steuer-Rechner", beschreibung: "Berechnen Sie die KFZ-Steuer basierend auf Hubraum und CO₂." },
  { slug: "abfindung", title: "Abfindungs-Rechner", beschreibung: "Berechnen Sie die Netto-Abfindung mit Steuern." },
  { slug: "kurzarbeitsgeld", title: "Kurzarbeitsgeld-Rechner", beschreibung: "Berechnen Sie Ihr Kurzarbeitsgeld bei Stundenausfällen." },
  // Neue Rechner
  { slug: "alg1", title: "Arbeitslosengeld I Rechner", beschreibung: "Berechnen Sie Ihren ALG1-Anspruch und die tägliche Leistung." },
  { slug: "mindestlohn", title: "Mindestlohn-Rechner", beschreibung: "Berechnen Sie Ihr Monatseinkommen basierend auf Mindestlohn." },
  { slug: "kirchensteuer", title: "Kirchensteuer-Rechner", beschreibung: "Berechnen Sie die Kirchensteuer auf Ihr Einkommen nach Bundesland." },
  { slug: "minijob", title: "Minijob & Midijob Rechner", beschreibung: "Berechnen Sie Netto und Arbeitgeberkosten für Mini- und Midijobs." },
  { slug: "pendlerpauschale", title: "Pendlerpauschale-Rechner", beschreibung: "Berechnen Sie Ihre Werbungskosten für die Fahrt zur Arbeit." },
  { slug: "mutterschutz", title: "Mutterschutz-Rechner", beschreibung: "Berechnen Sie Mutterschaftsgeld und Schutzfristen." },
  { slug: "altersteilzeit", title: "Altersteilzeit-Rechner", beschreibung: "Berechnen Sie Ihr Netto in Altersteilzeit mit Aufstockung." },
  { slug: "annuitaet", title: "Annuitätenrechner", beschreibung: "Berechnen Sie Monatsrate und Tilgungsplan für Darlehen." },
  { slug: "bafoeg", title: "BAföG-Rechner", beschreibung: "Ermitteln Sie Ihren monatlichen BAföG-Anspruch." },
  { slug: "buergergeld", title: "Bürgergeld-Rechner", beschreibung: "Berechnen Sie Ihren Bürgergeldanspruch (Arbeitslosengeld II)." },
  { slug: "elternzeit", title: "Elternzeit-Rechner", beschreibung: "Planen Sie Ihre Elternzeitdauer bis zum 3. Geburtstag." },
  { slug: "flexrente", title: "Flexrenten-Rechner", beschreibung: "Berechnen Sie Ihre Rente mit Abschlägen oder Zuschlägen." },
  { slug: "gerichtskosten", title: "Gerichtskosten-Rechner", beschreibung: "Schätzen Sie die Gerichtsgebühren basierend auf Streitwert." },
  { slug: "gleitzone", title: "Gleitzone-Rechner", beschreibung: "Prüfen Sie, in welche Kategorie Ihr Einkommen fällt." },
  { slug: "gruendungszuschuss", title: "Gründungszuschuss-Rechner", beschreibung: "Berechnen Sie Ihren möglichen Gründungszuschuss von der Agentur." },
  { slug: "grundsicherung", title: "Grundsicherung-Rechner", beschreibung: "Berechnen Sie Ihren Anspruch auf Grundsicherung im Alter." },
  { slug: "haushaltsrechner", title: "Haushalts-Rechner", beschreibung: "Tracken Sie Ihre monatlichen Einnahmen und Ausgaben." },
  { slug: "hinzuverdienst", title: "Hinzuverdienst-Rechner", beschreibung: "Berechnen Sie, wie Hinzuverdienst Ihr ALG1 beeinflusst." },
  { slug: "kalteprogression", title: "Kalte Progression-Rechner", beschreibung: "Sehen Sie den Steuervorteil durch Gehaltserhöhungen." },
  { slug: "kinderkrankengeld", title: "Kinderkrankengeld-Rechner", beschreibung: "Berechnen Sie Leistungen bei Krankheit Ihrer Kinder." },
  { slug: "krankengeld", title: "Krankengeld-Rechner", beschreibung: "Berechnen Sie Ihre Leistung bei Arbeitsunfähigkeit." },
  { slug: "leasing", title: "Leasing-Rechner", beschreibung: "Vergleichen Sie Leasing-Raten mit Kaufpreisen." },
  { slug: "paypal", title: "PayPal-Gebühren-Rechner", beschreibung: "Berechnen Sie die Gebühren für Ihre PayPal-Transaktionen." },
  { slug: "pfaendung", title: "Pfändung-Rechner", beschreibung: "Ermitteln Sie den pfändbaren Betrag Ihres Einkommens." },
  { slug: "rentenabschlag", title: "Rentenabschlag-Rechner", beschreibung: "Berechnen Sie Ihre Rente mit lebenslangem Abschlag." },
  { slug: "rentenbeginn", title: "Rentenbeginn-Rechner", beschreibung: "Planen Sie Ihren optimalen Renteneintritt." },
  { slug: "rentenbesteuerung", title: "Rentenbesteuerung-Rechner", beschreibung: "Berechnen Sie die Besteuerung Ihrer Renteneinkünfte." },
  { slug: "rentenschaetzer", title: "Rentenschätzer", beschreibung: "Schätzen Sie Ihre voraussichtliche monatliche Rente." },
  { slug: "steuererstattung", title: "Steuererstatung-Rechner", beschreibung: "Schätzen Sie Ihre mögliche Steuererstatung." },
  { slug: "steuerklassen", title: "Steuerklassen-Rechner", beschreibung: "Vergleichen Sie Ihre Netto-Einkünfte nach Steuerklasse." },
  { slug: "teilzeit", title: "Teilzeit-Rechner", beschreibung: "Berechnen Sie Ihr neues Einkommen bei Stundenreduzierung." },
  { slug: "uebergangsgeld", title: "Übergangsgeld-Rechner", beschreibung: "Berechnen Sie Übergangsgeld bei Maßnahmen zur Rehabilitation." },
  { slug: "urlaubsanspruch", title: "Urlaubsanspruch-Rechner", beschreibung: "Ermitteln Sie Ihren jährlichen Urlaubsanspruch." },
  { slug: "verletztengeld", title: "Verletztengeld-Rechner", beschreibung: "Berechnen Sie Leistungen bei Arbeitsunfällen." },
  { slug: "witwenrente", title: "Witwenrente-Rechner", beschreibung: "Berechnen Sie die Witwenrente für Hinterbliebene." },
];

export const metadata = {
  title: "Alle Finanzrechner – finanzleser.de",
  description: "Übersicht aller 52 Finanzrechner: Brutto-Netto, Kredite, Steuern, Versicherungen, Rentenschätzung und mehr.",
};

export default function RechnerUebersichtPage() {
  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-4">Alle Finanzrechner</h1>
          <p className="text-lg text-gray-600 mb-12">
            52 praktische Rechner für schnelle finanzielle Berechnungen. Alle Rechner sind Schätzungen
            und können keine professionelle Beratung ersetzen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RECHNER.map((rechner) => (
              <Link
                key={rechner.slug}
                href={`/finanztools/rechner/${rechner.slug}`}
                className="group block p-6 border border-gray-200 rounded-lg hover:shadow-lg hover:border-green-400 transition-all"
              >
                <h3 className="text-lg font-bold mb-2 group-hover:text-green-600 transition">
                  {rechner.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {rechner.beschreibung}
                </p>
                <span className="text-green-600 font-semibold text-sm flex items-center">
                  Öffnen
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
