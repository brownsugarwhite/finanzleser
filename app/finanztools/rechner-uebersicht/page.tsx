import Header from "@/components/layout/Header";
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
];

export const metadata = {
  title: "Alle Finanzrechner – finanzleser.de",
  description: "Übersicht aller 17 Finanzrechner: Brutto-Netto, Kredite, Steuern, Versicherungen und mehr.",
};

export default function RechnerUebersichtPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-4">Alle Finanzrechner</h1>
          <p className="text-lg text-gray-600 mb-12">
            17 praktische Rechner für schnelle finanzielle Berechnungen. Alle Rechner sind Schätzungen
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
