import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import RechnerPlaceholder from "@/components/ui/RechnerPlaceholder";
import RechnerEmbed from "@/components/rechner/RechnerEmbed";
import { getAllRechner, getRechnerBySlug } from "@/lib/wordpress";

// Fallback statische Daten - alle 51 Rechner
const FALLBACK_RECHNER: Record<string, { title: string; type: string; desc: string }> = {
  "brutto-netto": { title: "Brutto-Netto-Rechner", type: "steuer", desc: "Mit dem Brutto-Netto-Rechner berechnen Sie, was nach Abzug von Steuern und Sozialabgaben von Ihrem Gehalt übrig bleibt. Ideal für Gehaltsverhandlungen und die monatliche Finanzplanung." },
  "mehrwertsteuer": { title: "Mehrwertsteuer-Rechner", type: "steuer", desc: "Berechnen Sie die Mehrwertsteuer für Brutto- und Nettobeträge mit 19 % oder 7 % Steuersatz. Perfekt für Rechnungsstellung, Vorsteuerabzug und Preiskalkulation." },
  "einkommensteuer": { title: "Einkommensteuer-Rechner", type: "steuer", desc: "Ermitteln Sie Ihre Einkommensteuer nach Grund- oder Splittingtarif inkl. Soli und Kirchensteuer. Der Rechner zeigt Steuerlast, Durchschnitts- und Grenzsteuersatz auf einen Blick." },
  "kirchensteuer": { title: "Kirchensteuer-Rechner", type: "steuer", desc: "Berechnen Sie Ihre Kirchensteuer (8 % oder 9 % je nach Bundesland) auf Basis Ihrer Einkommensteuer. Inklusive Auswirkung als Sonderausgabe und monatlicher Belastung." },
  "kfz-steuer": { title: "KFZ-Steuer-Rechner", type: "steuer", desc: "Berechnen Sie die jährliche Kfz-Steuer anhand von Hubraum, CO₂-Ausstoß und Antriebsart. Ideal beim Autokauf zum Vergleich der laufenden Kosten verschiedener Fahrzeuge." },
  "erbschaftsteuer": { title: "Erbschaftsteuer-Rechner", type: "steuer", desc: "Ermitteln Sie die Erbschaft- oder Schenkungsteuer nach Verwandtschaftsgrad und Freibeträgen. Unverzichtbar für die Nachlassplanung und vorausschauende Vermögensübertragung." },
  "kalteprogression": { title: "Kalte Progression-Rechner", type: "steuer", desc: "Berechnen Sie, wie viel Ihrer Gehaltserhöhung durch die kalte Progression aufgezehrt wird. Der Rechner zeigt den realen Nettoeffekt nach Inflation und Steuerprogression." },
  "steuererstattung": { title: "Steuererstattung-Rechner", type: "steuer", desc: "Schätzen Sie Ihre Steuererstattung vorab ein. Der Rechner berücksichtigt Werbungskosten, Sonderausgaben und Ihre Steuerklasse und zeigt, wie viel Sie vom Finanzamt zurückbekommen." },
  "steuerklassen": { title: "Steuerklassen-Rechner", type: "steuer", desc: "Finden Sie die optimale Steuerklassenkombination für Ehepaare. Vergleichen Sie III/V, IV/IV und Faktorverfahren und ermitteln Sie das höchste gemeinsame Nettoeinkommen." },
  "pendlerpauschale": { title: "Pendlerpauschale-Rechner", type: "steuer", desc: "Berechnen Sie Ihre absetzbare Entfernungspauschale und die daraus resultierende Steuerersparnis. Geben Sie Entfernung und Arbeitstage ein und optimieren Sie Ihre Steuererklärung." },
  "stundenlohn": { title: "Stundenlohn-Rechner", type: "steuer", desc: "Ermitteln Sie Ihren tatsächlichen Brutto- und Nettostundenlohn aus dem Monatsgehalt. Perfekt zum Vergleich von Jobangeboten, Teilzeit vs. Vollzeit und Mindestlohn-Check." },
  "abfindung": { title: "Abfindungs-Rechner", type: "steuer", desc: "Berechnen Sie die Steuer auf Ihre Abfindung mit und ohne Fünftelregelung. Der Rechner zeigt die konkrete Ersparnis und was netto von Ihrer Abfindung übrig bleibt." },
  "kindergeld": { title: "Kindergeld-Rechner", type: "soziales", desc: "Der Kindergeld-Rechner ermittelt Ihren monatlichen Anspruch auf Kindergeld. Geben Sie die Anzahl und das Alter Ihrer Kinder ein und erhalten Sie die exakte Berechnung." },
  "elterngeld": { title: "Elterngeld-Rechner", type: "soziales", desc: "Berechnen Sie Ihren Elterngeldanspruch als Basiselterngeld oder ElterngeldPlus. Der Rechner ermittelt die monatliche Zahlung auf Basis Ihres Nettoeinkommens vor der Geburt." },
  "elternzeit": { title: "Elternzeit-Rechner", type: "soziales", desc: "Planen Sie Ihre Elternzeit mit korrekten Fristen und optimaler Aufteilung zwischen beiden Elternteilen. Inkl. Anmeldefristen, Mutterschutzanrechnung und Teilzeitoptionen." },
  "mutterschutz": { title: "Mutterschutz-Rechner", type: "soziales", desc: "Berechnen Sie Ihre Mutterschutzfristen und das voraussichtliche Mutterschaftsgeld. Geben Sie den Geburtstermin ein und erhalten Sie alle Schutzfristen und Zahlungsansprüche." },
  "wohngeld": { title: "Wohngeld-Rechner", type: "soziales", desc: "Prüfen Sie Ihren Wohngeldanspruch und berechnen Sie den voraussichtlichen Mietzuschuss. Berücksichtigt Einkommen, Haushaltsgröße, Miete und die Mietstufe Ihres Wohnorts." },
  "buergergeld": { title: "Bürgergeld-Rechner", type: "soziales", desc: "Ermitteln Sie Ihren Bürgergeld-Anspruch nach aktuellen Regelsätzen. Der Rechner berechnet Regelbedarf, Unterkunftskosten und Freibeträge bei Erwerbstätigkeit." },
  "grundsicherung": { title: "Grundsicherung-Rechner", type: "soziales", desc: "Berechnen Sie Ihren Anspruch auf Grundsicherung im Alter oder bei Erwerbsminderung. Berücksichtigt Rente, Einkommen, Mietkosten und Freibeträge nach SGB XII." },
  "alg1": { title: "Arbeitslosengeld I-Rechner", type: "soziales", desc: "Berechnen Sie Höhe und Bezugsdauer Ihres Arbeitslosengeldes I. Der Rechner ermittelt den monatlichen Anspruch auf Basis von Gehalt, Steuerklasse und Beschäftigungsdauer." },
  "kurzarbeitsgeld": { title: "Kurzarbeitsgeld-Rechner", type: "soziales", desc: "Ermitteln Sie Ihr Kurzarbeitergeld bei reduzierter Arbeitszeit. Der Rechner berechnet die Nettoentgeltdifferenz und den monatlichen KuG-Anspruch inkl. erhöhter Sätze." },
  "krankengeld": { title: "Krankengeld-Rechner", type: "soziales", desc: "Berechnen Sie Ihr Krankengeld bei längerer Arbeitsunfähigkeit. Der Rechner ermittelt den täglichen und monatlichen Anspruch nach Abzug der Sozialversicherungsbeiträge." },
  "kinderkrankengeld": { title: "Kinderkrankengeld-Rechner", type: "soziales", desc: "Ermitteln Sie Ihren Anspruch auf Kinderkrankengeld: Anspruchstage pro Kind, tägliche Zahlung und den finanziellen Ausgleich bei Betreuung eines kranken Kindes." },
  "pfaendung": { title: "Pfändung-Rechner", type: "soziales", desc: "Ermitteln Sie den pfändbaren und pfändungsfreien Anteil Ihres Einkommens nach aktueller Pfändungstabelle. Berücksichtigt Nettoeinkommen und Unterhaltspflichten." },
  "urlaubsanspruch": { title: "Urlaubsanspruch-Rechner", type: "soziales", desc: "Berechnen Sie Ihren gesetzlichen Urlaubsanspruch nach BUrlG, auch bei Teilzeit, unterjährigem Eintritt oder Schwerbehinderung. Inkl. anteiligem Urlaub und Resturlaub." },
  "minijob": { title: "Minijob & Midijob-Rechner", type: "soziales", desc: "Berechnen Sie Abgaben und Nettoeinkommen für Minijobs (bis 556 Euro) und Midijobs (bis 2.000 Euro). Zeigt Sozialversicherungsbeiträge und optimale Verdienstgrenzen." },
  "mindestlohn": { title: "Mindestlohn-Rechner", type: "soziales", desc: "Prüfen Sie, ob Ihr Gehalt dem gesetzlichen Mindestlohn entspricht. Der Rechner vergleicht Ihren effektiven Stundenlohn mit dem aktuellen Minimum und Branchenmindestlöhnen." },
  "gleitzone": { title: "Gleitzone-Rechner", type: "soziales", desc: "Berechnen Sie die reduzierten Sozialversicherungsbeiträge im Übergangsbereich (556-2.000 Euro). Zeigt die Ersparnis gegenüber vollen Beiträgen bei vollen Rentenansprüchen." },
  "teilzeit": { title: "Teilzeit-Rechner", type: "soziales", desc: "Berechnen Sie die Auswirkungen einer Arbeitszeitreduzierung auf Ihr Nettoeinkommen. Vergleichen Sie Vollzeit und Teilzeit und sehen Sie den tatsächlichen Nettoeffekt." },
  "hinzuverdienst": { title: "Hinzuverdienst-Rechner", type: "soziales", desc: "Berechnen Sie, wie viel Sie neben Rente, Bürgergeld oder ALG I dazuverdienen dürfen. Der Rechner zeigt Freibeträge und Anrechnungen für Ihre Leistungsart." },
  "gruendungszuschuss": { title: "Gründungszuschuss-Rechner", type: "soziales", desc: "Berechnen Sie Höhe und Dauer des Gründungszuschusses aus der Arbeitslosigkeit. Ermitteln Sie die monatliche Förderung und Gesamtsumme für Ihre Existenzgründung." },
  "uebergangsgeld": { title: "Übergangsgeld-Rechner", type: "soziales", desc: "Ermitteln Sie Ihr Übergangsgeld während einer Reha oder Umschulung. Der Rechner berechnet den Anspruch (68-75 % des Nettoentgelts) auf Basis Ihres letzten Gehalts." },
  "verletztengeld": { title: "Verletztengeld-Rechner", type: "soziales", desc: "Berechnen Sie Ihr Verletztengeld nach einem Arbeitsunfall oder bei Berufskrankheit. Der Rechner ermittelt den Anspruch (80 % brutto) über die Berufsgenossenschaft." },
  "gerichtskosten": { title: "Gerichtskosten-Rechner", type: "soziales", desc: "Berechnen Sie Gerichts- und Anwaltskosten auf Basis des Streitwerts nach GKG und RVG. Ermitteln Sie das Prozesskostenrisiko, bevor Sie klagen." },
  "rente": { title: "Renten-Rechner", type: "rente", desc: "Ermitteln Sie Ihre voraussichtliche gesetzliche Rente nach der offiziellen Rentenformel. Der Rechner zeigt Brutto- und Nettorente sowie Ihre persönliche Versorgungslücke." },
  "rentenabschlag": { title: "Rentenabschlag-Rechner", type: "rente", desc: "Berechnen Sie die Rentenkürzung bei vorzeitigem Renteneintritt (0,3 % pro Monat). Vergleichen Sie frühere Rente mit Abschlag gegen regulären Rentenbeginn ohne Kürzung." },
  "rentenbeginn": { title: "Rentenbeginn-Rechner", type: "rente", desc: "Ermitteln Sie Ihren frühestmöglichen und regulären Renteneintritt nach Geburtsjahr und Versicherungszeiten. Zeigt alle Rentenarten mit Zugangsdaten und Abschlägen." },
  "rentenbesteuerung": { title: "Rentenbesteuerung-Rechner", type: "rente", desc: "Ermitteln Sie die Einkommensteuer auf Ihre Rente nach dem Jahr des Rentenbeginns. Berechnet den steuerpflichtigen Anteil und zeigt, ob eine Steuererklärung nötig ist." },
  "rentenschaetzer": { title: "Rentenschätzer", type: "rente", desc: "Schnelle Rentenprognose mit nur wenigen Angaben: Alter, Einkommen und Erwerbsdauer genügen. Ideal für eine erste Einschätzung Ihrer Versorgungslücke im Alter." },
  "flexrente": { title: "Flexrenten-Rechner", type: "rente", desc: "Berechnen Sie das Gesamteinkommen aus Teilrente und Hinzuverdienst mit der Flexirente. Ideal für den gleitenden Übergang vom Berufsleben in den Ruhestand." },
  "altersteilzeit": { title: "Altersteilzeit-Rechner", type: "rente", desc: "Berechnen Sie Einkommen und Rentenansprüche in der Altersteilzeit. Vergleichen Sie Block- und Gleichverteilungsmodell inkl. Aufstockungsbetrag und Renteneffekt." },
  "witwenrente": { title: "Witwenrente-Rechner", type: "rente", desc: "Ermitteln Sie Ihren Anspruch auf Witwen- oder Witwerrente. Der Rechner berechnet große und kleine Witwenrente inkl. Einkommensanrechnung und Sterbevierteljahr." },
  "kredit": { title: "Kreditrechner", type: "kredit", desc: "Berechnen Sie monatliche Rate, Gesamtkosten und Tilgungsplan für Ihren Ratenkredit. Vergleichen Sie verschiedene Kreditangebote anhand des effektiven Jahreszinses." },
  "zinseszins": { title: "Zinseszins-Rechner", type: "kredit", desc: "Erleben Sie die Kraft des Zinseszinseffekts: Berechnen Sie, wie Ihr Kapital mit Sparrate und Reinvestition über die Jahre exponentiell wächst. Ideal für Sparplan-Planung." },
  "inflation": { title: "Inflationsrechner", type: "kredit", desc: "Berechnen Sie den Kaufkraftverlust Ihres Geldes durch Inflation über beliebige Zeiträume. Unverzichtbar für Altersvorsorge, Sparanlagen-Bewertung und Gehaltsverhandlungen." },
  "tilgung": { title: "Tilgungsrechner", type: "kredit", desc: "Erstellen Sie einen detaillierten Tilgungsplan für Ihre Baufinanzierung. Berechnen Sie Monatsrate, Restschuld und Gesamtlaufzeit inkl. Sondertilgungsoptionen." },
  "annuitaet": { title: "Annuitätenrechner", type: "kredit", desc: "Berechnen Sie die gleichbleibende Monatsrate (Annuität) für Ihr Darlehen. Ermitteln Sie Zins- und Tilgungsanteil, Gesamtzinskosten und optimale Laufzeit." },
  "leasing": { title: "Leasing-Rechner", type: "kredit", desc: "Berechnen Sie Leasingrate und Gesamtkosten Ihres Leasingvertrags. Vergleichen Sie Leasing mit Finanzierung und Barkauf anhand von Leasingfaktor und Effektivkosten." },
  "haushaltsrechner": { title: "Haushalts-Rechner", type: "kredit", desc: "Erfassen Sie Einnahmen und Ausgaben und ermitteln Sie Ihr frei verfügbares Einkommen. Der Haushaltsrechner zeigt Einsparpotenziale und hilft bei der Kreditvorbereitung." },
  "paypal": { title: "PayPal-Gebühren-Rechner", type: "kredit", desc: "Berechnen Sie PayPal-Transaktionsgebühren für Verkäufer und Händler. Ermitteln Sie den Nettobetrag oder den nötigen Bruttobetrag für Ihren Wunscherlös." },
  "bafoeg": { title: "BAföG-Rechner", type: "kredit", desc: "Ermitteln Sie Ihren BAföG-Anspruch auf Basis des Elterneinkommens und Ihrer Wohnsituation. Der Rechner berechnet den monatlichen Förderbetrag vor der Antragstellung." },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const rechner = await getAllRechner();
  return rechner.map((r) => ({
    slug: r.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const rechner = await getRechnerBySlug(slug);

  if (!rechner) {
    return {
      title: "Rechner nicht gefunden",
      description: "Der angeforderte Rechner existiert nicht.",
    };
  }

  return {
    title: rechner.title,
    description: rechner.rechnerFelder?.beschreibung || rechner.excerpt || `Nutzen Sie unseren ${rechner.title} für Ihre Finanzberechnungen.`,
  };
}

export default async function RechnerDetailPage({ params }: Props) {
  const { slug } = await params;
  let rechner = await getRechnerBySlug(slug);

  // Fallback zu statischen Daten wenn WordPress nicht verfügbar
  if (!rechner && FALLBACK_RECHNER[slug]) {
    const fallback = FALLBACK_RECHNER[slug];
    rechner = {
      id: slug,
      title: fallback.title,
      slug,
      excerpt: fallback.desc,
      rechnerFelder: {
        rechnerTyp: fallback.type as any,
        rechnerBeschreibung: fallback.desc,
      },
    };
  }

  if (!rechner) {
    return (
      <>
        <main className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-6">Rechner nicht gefunden</h1>
            <p className="text-lg text-gray-600">Der angeforderte Rechner existiert nicht.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const kategorieName =
    rechner.rechnerFelder?.rechnerTyp === "steuer" ? "Steuer & Lohn" :
    rechner.rechnerFelder?.rechnerTyp === "soziales" ? "Soziales & Arbeit" :
    rechner.rechnerFelder?.rechnerTyp === "rente" ? "Rente & Altersvorsorge" :
    rechner.rechnerFelder?.rechnerTyp === "kredit" ? "Kredit & Finanzen" : "Finanztools";

  const breadcrumbItems = [
    { label: "Finanztools", href: "/finanztools" },
    { label: "Rechner", href: "/finanztools/rechner" }
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 pb-12">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} />

          {/* Kategorie - sekundärfarbe, Serif, Italic */}
          <Link
            href="/finanztools/rechner"
            className="mb-2 inline-block transition hover:opacity-80"
            style={{
              color: "var(--color-brand-secondary)",
              fontFamily: "Merriweather, serif",
              fontSize: "23px",
              fontStyle: "italic",
            }}
          >
            {kategorieName}
          </Link>

          {/* Titel */}
          <h1 className="font-bold mb-4" style={{ fontSize: "42px", lineHeight: "1.3em" }}>
            {rechner.title}
          </h1>

          {/* Beschreibung */}
          {(rechner.rechnerFelder?.beschreibung || rechner.excerpt) && (
            <p
              className="mb-8 text-gray-600"
              style={{
                fontFamily: "Merriweather, serif",
                fontSize: "18px",
                fontWeight: "400",
              }}
            >
              {rechner.rechnerFelder?.beschreibung || rechner.excerpt}
            </p>
          )}

          {/* Container: Image (sticky) left + Rechner right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Placeholder SVG (Sticky only on desktop) */}
            <div className="w-full lg:sticky lg:top-[100px] h-fit">
              <div className="flex justify-center">
                <div className="max-w-[600px]">
                  <RechnerPlaceholder />
                </div>
              </div>
            </div>

            {/* Right: Rechner */}
            <div>
              <div className="p-6">
                <RechnerEmbed slug={rechner.slug} />
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Hinweis:</strong> Alle Berechnungen sind unverbindliche Näherungswerte. Dieses Tool kann eine professionelle Steuer-, Finanz- oder Rechtsberatung nicht ersetzen.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
