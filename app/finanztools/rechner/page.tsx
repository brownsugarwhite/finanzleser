import Link from "next/link";
import Footer from "@/components/layout/Footer";

// Alle 56 Rechner – Kategorien wie im Original (Nicole's Repo)
const KATEGORIEN = {
  "Steuern": [
    { slug: "brutto-netto", title: "Brutto-Netto-Rechner" },
    { slug: "einkommensteuer", title: "Einkommensteuerrechner" },
    { slug: "erbschaftsteuer", title: "Erbschaftsteuerrechner" },
    { slug: "kalteprogression", title: "Kalte-Progression-Rechner" },
    { slug: "kirchensteuer", title: "Kirchensteuerrechner" },
    { slug: "mehrwertsteuer", title: "Mehrwertsteuer-Rechner" },
    { slug: "pendlerpauschale", title: "Pendlerpauschale-Rechner" },
    { slug: "steuererstattung", title: "Steuererstattungsrechner" },
    { slug: "steuerklassen", title: "Steuerklassenrechner" },
  ],
  "Altersvorsorge": [
    { slug: "flexrente", title: "Flexrentenrechner" },
    { slug: "hinzuverdienst", title: "Hinzuverdienstrechner" },
    { slug: "rentenabschlag", title: "Rentenabschlag-Rechner" },
    { slug: "rentenbeginn", title: "Rentenbeginn-Rechner" },
    { slug: "rentenbesteuerung", title: "Rentenbesteuerungsrechner" },
    { slug: "rente", title: "Rentenrechner" },
    { slug: "rentenschaetzer", title: "Rentenschätzer" },
    { slug: "witwenrente", title: "Witwenrentenrechner" },
  ],
  "Arbeit": [
    { slug: "altersteilzeit", title: "Altersteilzeit-Rechner" },
    { slug: "gleitzone", title: "Gleitzonenrechner (Midijob)" },
    { slug: "gruendungszuschuss", title: "Gründungszuschussrechner" },
    { slug: "mindestlohn", title: "Mindestlohnrechner" },
    { slug: "minijob", title: "Minijob- & Midijob-Rechner" },
    { slug: "stundenlohn", title: "Stundenlohnrechner" },
    { slug: "teilzeit", title: "Teilzeitrechner" },
    { slug: "urlaubsanspruch", title: "Urlaubsanspruch-Rechner" },
  ],
  "Arbeit & Gehalt": [
    { slug: "kurzarbeitsgeld", title: "Kurzarbeitsgeldrechner" },
  ],
  "Arbeitsrecht": [
    { slug: "abfindung", title: "Abfindungsrechner" },
  ],
  "Fahrzeug & Verkehr": [
    { slug: "kfz-steuer", title: "Kfz-Steuer-Rechner" },
  ],
  "Familie & Soziales": [
    { slug: "kindergeld", title: "Kindergeldrechner" },
  ],
  "Finanzen": [
    { slug: "haushaltsrechner", title: "Haushaltsrechner" },
    { slug: "heizkosten", title: "Heizkostenrechner" },
    { slug: "inflation", title: "Inflationsrechner" },
    { slug: "paypal", title: "PayPal-Gebührenrechner" },
    { slug: "pv-foerderung", title: "PV-Anlage Wirtschaftlichkeit" },
  ],
  "Kredit & Finanzierung": [
    { slug: "annuitaet", title: "Annuitätenrechner" },
    { slug: "kfw-studienkredit", title: "KfW-Studienkreditrechner" },
    { slug: "kredit", title: "Kreditrechner" },
    { slug: "leasing", title: "Leasingrechner" },
    { slug: "tilgung", title: "Tilgungsrechner" },
  ],
  "Recht & Familie": [
    { slug: "bafoeg", title: "BAföG-Rechner" },
    { slug: "elterngeld", title: "Elterngeldrechner" },
    { slug: "elternzeit", title: "Elternzeit-Rechner" },
    { slug: "gerichtskosten", title: "Gerichts- & Anwaltskostenrechner" },
    { slug: "mutterschutz", title: "Mutterschutzrechner" },
    { slug: "pfaendung", title: "Pfändungsrechner" },
    { slug: "scheidungskosten", title: "Scheidungskostenrechner" },
    { slug: "unterhalt", title: "Unterhaltsrechner" },
  ],
  "Sozialleistungen": [
    { slug: "alg1", title: "Arbeitslosengeld-1-Rechner" },
    { slug: "buergergeld", title: "Bürgergeld-Rechner" },
    { slug: "grundsicherung", title: "Grundsicherungsrechner" },
    { slug: "kinderkrankengeld", title: "Kinderkrankengeldrechner" },
    { slug: "krankengeld", title: "Krankengeldrechner" },
    { slug: "uebergangsgeld", title: "Übergangsgeldrechner" },
    { slug: "verletztengeld", title: "Verletztengeldrechner" },
    { slug: "wohngeld", title: "Wohngeldrechner" },
  ],
  "Sparen & Geldanlage": [
    { slug: "zinseszins", title: "Zinseszinsrechner" },
  ],
};

export default function RechnerPage() {
  return (
    <>
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
