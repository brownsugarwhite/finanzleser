import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Alle 52 Rechner mit ihren Kategorien
const KATEGORIEN = {
  "Steuer & Lohn": [
    { slug: "brutto-netto", title: "Brutto-Netto-Rechner" },
    { slug: "mehrwertsteuer", title: "Mehrwertsteuer-Rechner" },
    { slug: "einkommensteuer", title: "Einkommensteuer-Rechner" },
    { slug: "kirchensteuer", title: "Kirchensteuer-Rechner" },
    { slug: "kfz-steuer", title: "KFZ-Steuer-Rechner" },
    { slug: "erbschaftsteuer", title: "Erbschaftsteuer-Rechner" },
    { slug: "kalteprogression", title: "Kalte Progression-Rechner" },
    { slug: "steuererstattung", title: "Steuererstattung-Rechner" },
    { slug: "steuerklassen", title: "Steuerklassen-Rechner" },
    { slug: "pendlerpauschale", title: "Pendlerpauschale-Rechner" },
    { slug: "stundenlohn", title: "Stundenlohn-Rechner" },
    { slug: "abfindung", title: "Abfindungs-Rechner" },
  ],
  "Soziales & Arbeit": [
    { slug: "kindergeld", title: "Kindergeld-Rechner" },
    { slug: "elterngeld", title: "Elterngeld-Rechner" },
    { slug: "elternzeit", title: "Elternzeit-Rechner" },
    { slug: "mutterschutz", title: "Mutterschutz-Rechner" },
    { slug: "wohngeld", title: "Wohngeld-Rechner" },
    { slug: "buergergeld", title: "Bürgergeld-Rechner" },
    { slug: "grundsicherung", title: "Grundsicherung-Rechner" },
    { slug: "alg1", title: "Arbeitslosengeld I-Rechner" },
    { slug: "kurzarbeitsgeld", title: "Kurzarbeitsgeld-Rechner" },
    { slug: "krankengeld", title: "Krankengeld-Rechner" },
    { slug: "kinderkrankengeld", title: "Kinderkrankengeld-Rechner" },
    { slug: "pfaendung", title: "Pfändung-Rechner" },
    { slug: "urlaubsanspruch", title: "Urlaubsanspruch-Rechner" },
    { slug: "minijob", title: "Minijob & Midijob-Rechner" },
    { slug: "mindestlohn", title: "Mindestlohn-Rechner" },
    { slug: "gleitzone", title: "Gleitzone-Rechner" },
    { slug: "teilzeit", title: "Teilzeit-Rechner" },
    { slug: "hinzuverdienst", title: "Hinzuverdienst-Rechner" },
    { slug: "gruendungszuschuss", title: "Gründungszuschuss-Rechner" },
    { slug: "uebergangsgeld", title: "Übergangsgeld-Rechner" },
    { slug: "verletztengeld", title: "Verletztengeld-Rechner" },
    { slug: "gerichtskosten", title: "Gerichtskosten-Rechner" },
  ],
  "Rente & Altersvorsorge": [
    { slug: "rente", title: "Renten-Rechner" },
    { slug: "rentenabschlag", title: "Rentenabschlag-Rechner" },
    { slug: "rentenbeginn", title: "Rentenbeginn-Rechner" },
    { slug: "rentenbesteuerung", title: "Rentenbesteuerung-Rechner" },
    { slug: "rentenschaetzer", title: "Rentenschätzer" },
    { slug: "flexrente", title: "Flexrenten-Rechner" },
    { slug: "altersteilzeit", title: "Altersteilzeit-Rechner" },
    { slug: "witwenrente", title: "Witwenrente-Rechner" },
  ],
  "Kredit & Finanzen": [
    { slug: "kredit", title: "Kreditrechner" },
    { slug: "zinseszins", title: "Zinseszins-Rechner" },
    { slug: "inflation", title: "Inflationsrechner" },
    { slug: "tilgung", title: "Tilgungsrechner" },
    { slug: "annuitaet", title: "Annuitätenrechner" },
    { slug: "leasing", title: "Leasing-Rechner" },
    { slug: "haushaltsrechner", title: "Haushalts-Rechner" },
    { slug: "paypal", title: "PayPal-Gebühren-Rechner" },
    { slug: "bafoeg", title: "BAföG-Rechner" },
  ],
};

export default function RechnerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-6">Finanzrechner</h1>
          <p className="text-lg text-gray-600 mb-12">
            Wählen Sie einen unserer Finanzrechner, um wichtige finanzielle Entscheidungen zu treffen.
          </p>

          {/* Kategorien mit Rechnern */}
          <div className="space-y-16">
            {Object.entries(KATEGORIEN).map(([kategorie, rechner]) => (
              <section key={kategorie}>
                <h2 className="text-2xl font-bold mb-6 pb-3 border-b-2 border-green-600">{kategorie}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rechner.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/finanztools/rechner/${r.slug}`}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-lg hover:border-green-600 transition bg-white"
                    >
                      <h3 className="font-semibold text-gray-900 hover:text-green-600 transition">
                        {r.title}
                      </h3>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
