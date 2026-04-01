import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import RechnerPlaceholder from "@/components/ui/RechnerPlaceholder";
import RechnerEmbed from "@/components/rechner/RechnerEmbed";
import { getAllRechner, getRechnerBySlug } from "@/lib/wordpress";

// Fallback statische Daten - alle 52 Rechner
const FALLBACK_RECHNER: Record<string, { title: string; type: string; desc: string }> = {
  "brutto-netto": { title: "Brutto-Netto-Rechner", type: "steuer", desc: "Der Brutto-Netto-Rechner zeigt Ihnen, was von Ihrem Gehalt nach Abzug aller Steuern und Sozialabgaben tatsächlich übrig bleibt. Geben Sie Ihr Bruttogehalt ein und erhalten Sie eine detaillierte Aufschlüsselung aller Abzüge." },
  "mehrwertsteuer": { title: "Mehrwertsteuer-Rechner", type: "steuer", desc: "Mit dem Mehrwertsteuer-Rechner können Sie schnell und einfach die Mehrwertsteuer aus einem Nettobetrag hinzurechnen oder aus einem Bruttobetrag herausrechnen." },
  "einkommensteuer": { title: "Einkommensteuer-Rechner", type: "steuer", desc: "Der Einkommensteuer-Rechner berechnet die Einkommensteuer für Ihr zu versteuerndes Einkommen nach dem aktuellen Steuertarif." },
  "kirchensteuer": { title: "Kirchensteuer-Rechner", type: "steuer", desc: "Die Kirchensteuer wird als Zuschlag auf die Lohn- oder Einkommensteuer erhoben und variiert je nach Bundesland und Konfession." },
  "kfz-steuer": { title: "KFZ-Steuer-Rechner", type: "steuer", desc: "Die KFZ-Steuer hängt vom Hubraum, der Schadstoffklasse und dem Erstzulassungsdatum ab." },
  "erbschaftsteuer": { title: "Erbschaftsteuer-Rechner", type: "steuer", desc: "Der Erbschaftsteuer-Rechner berechnet die anfallende Steuer, wenn Sie eine Erbschaft oder Schenkung erhalten." },
  "kalteprogression": { title: "Kalte Progression-Rechner", type: "steuer", desc: "Die kalte Progression beschreibt das Phänomen, dass durch Inflation steigende nominale Einkommen zu einer höheren Steuerlast führen." },
  "steuererstattung": { title: "Steuererstattung-Rechner", type: "steuer", desc: "Viele Arbeitnehmer erhalten jedes Jahr eine Steuererstattung durch die Steuererklärung." },
  "steuerklassen": { title: "Steuerklassen-Rechner", type: "steuer", desc: "Ehepaare und Lebenspartner können zwischen Steuerklassenkombinationen wählen." },
  "pendlerpauschale": { title: "Pendlerpauschale-Rechner", type: "steuer", desc: "Berufspendler können ihre Fahrtkosten über die Pendlerpauschale in der Steuererklärung geltend machen." },
  "stundenlohn": { title: "Stundenlohn-Rechner", type: "steuer", desc: "Der Stundenlohn-Rechner konvertiert zwischen Stundenlohn, Monatsgehalt und Jahresgehalt." },
  "abfindung": { title: "Abfindungs-Rechner", type: "steuer", desc: "Eine Abfindung kann erhebliche Steuerersparnisse bringen durch die sogenannte Fünftelregelung." },
  "kindergeld": { title: "Kindergeld-Rechner", type: "soziales", desc: "Das Kindergeld ist eine Leistung des Staates für Familien mit Kindern." },
  "elterngeld": { title: "Elterngeld-Rechner", type: "soziales", desc: "Das Elterngeld soll Eltern in den ersten Lebensmonaten des Kindes unterstützen." },
  "elternzeit": { title: "Elternzeit-Rechner", type: "soziales", desc: "Mit der Elternzeit können Sie sich Zeit für Ihre Familie nehmen." },
  "mutterschutz": { title: "Mutterschutz-Rechner", type: "soziales", desc: "Der Mutterschutz schützt Arbeitnehmerinnen vor Kündigung und regelt Beschäftigungsverbote." },
  "wohngeld": { title: "Wohngeld-Rechner", type: "soziales", desc: "Das Wohngeld ist eine Leistung für Personen mit kleinerem Einkommen zur Unterstützung der Wohnkosten." },
  "buergergeld": { title: "Bürgergeld-Rechner", type: "soziales", desc: "Das Bürgergeld ist die Grundsicherung für arbeitsuchende Personen." },
  "grundsicherung": { title: "Grundsicherung-Rechner", type: "soziales", desc: "Die Grundsicherung im Alter und bei Erwerbsminderung hilft Menschen, die nicht genug Rente erhalten." },
  "alg1": { title: "Arbeitslosengeld I-Rechner", type: "soziales", desc: "Das Arbeitslosengeld I (ALG I) ist eine Versicherungsleistung für Arbeitslose." },
  "kurzarbeitsgeld": { title: "Kurzarbeitsgeld-Rechner", type: "soziales", desc: "Das Kurzarbeitergeld ersetzt Lohnausfälle bei vorübergehender Arbeitsausfallzeit." },
  "krankengeld": { title: "Krankengeld-Rechner", type: "soziales", desc: "Das Krankengeld ersetzt das Einkommen ab dem 43. Tag der Erkrankung." },
  "kinderkrankengeld": { title: "Kinderkrankengeld-Rechner", type: "soziales", desc: "Eltern erhalten Kinderkrankengeld, wenn sie wegen der Erkrankung eines Kindes arbeitsunfähig sind." },
  "pfaendung": { title: "Pfändung-Rechner", type: "soziales", desc: "Bei Schulden wird oft Lohn gepfändet. Mit unserem Rechner können Sie berechnen, wie viel pfändbar ist." },
  "urlaubsanspruch": { title: "Urlaubsanspruch-Rechner", type: "soziales", desc: "Der Urlaubsanspruch ist abhängig von der Arbeitswochenstundenzahl." },
  "minijob": { title: "Minijob & Midijob-Rechner", type: "soziales", desc: "Minijobs haben eine Verdienstgrenze von 538€ monatlich, Midijobs von 538€ bis 1076€." },
  "mindestlohn": { title: "Mindestlohn-Rechner", type: "soziales", desc: "Der gesetzliche Mindestlohn garantiert einen Mindeststundenlohn." },
  "gleitzone": { title: "Gleitzone-Rechner", type: "soziales", desc: "Die Gleitzone betrifft Beschäftigte mit Einkommen zwischen 538€ und 1076€." },
  "teilzeit": { title: "Teilzeit-Rechner", type: "soziales", desc: "Berechnen Sie, wie sich ein Wechsel von Vollzeit zu Teilzeit auf Ihr Einkommen auswirkt." },
  "hinzuverdienst": { title: "Hinzuverdienst-Rechner", type: "soziales", desc: "Wer eine Altersrente bezieht, kann unbegrenzt hinzuverdienen." },
  "gruendungszuschuss": { title: "Gründungszuschuss-Rechner", type: "soziales", desc: "Der Gründungszuschuss der Agentur für Arbeit unterstützt Arbeitlose." },
  "uebergangsgeld": { title: "Übergangsgeld-Rechner", type: "soziales", desc: "Das Übergangsgeld wird gezahlt, wenn Sie an einer Rehabilitationsmaßnahme teilnehmen." },
  "verletztengeld": { title: "Verletztengeld-Rechner", type: "soziales", desc: "Das Verletztengeld der Berufsgenossenschaft ersetzt das Einkommen bei Arbeitsunfällen." },
  "gerichtskosten": { title: "Gerichtskosten-Rechner", type: "soziales", desc: "Bei Rechtsstreitigkeiten fallen Gerichtskosten und Anwaltsgebühren an." },
  "rente": { title: "Renten-Rechner", type: "rente", desc: "Die Gesetzliche Rentenversicherung berechnet die Rente aus Rentenpunkten." },
  "rentenabschlag": { title: "Rentenabschlag-Rechner", type: "rente", desc: "Wer vor der Regelaltersgrenze in Rente geht, muss mit Rentenzuschlägen rechnen." },
  "rentenbeginn": { title: "Rentenbeginn-Rechner", type: "rente", desc: "Nicht alle Erwerbstätigen haben dieselbe Regelaltersgrenze für die Rente." },
  "rentenbesteuerung": { title: "Rentenbesteuerung-Rechner", type: "rente", desc: "Nicht die gesamte Rente ist steuerpflichtig." },
  "rentenschaetzer": { title: "Rentenschätzer", type: "rente", desc: "Schätzen Sie Ihren Rentenanspruch auf Basis bisheriger Beitragsjahre." },
  "flexrente": { title: "Flexrenten-Rechner", type: "rente", desc: "Die Flexrente ermöglicht unbegrenzten Hinzuverdienst nach Renteneintritt." },
  "altersteilzeit": { title: "Altersteilzeit-Rechner", type: "rente", desc: "Die Altersteilzeit ermöglicht ab 55 Jahren eine Reduzierung der Arbeitszeit." },
  "witwenrente": { title: "Witwenrente-Rechner", type: "rente", desc: "Die Witwenrente für überlebende Ehepartner berechnen." },
  "kredit": { title: "Kreditrechner", type: "kredit", desc: "Mit unserem Kreditrechner können Sie monatliche Raten und Zinsen berechnen." },
  "zinseszins": { title: "Zinseszins-Rechner", type: "kredit", desc: "Der Zinseszins-Effekt zeigt, wie Ihr Kapital mit Zinsen wächst." },
  "inflation": { title: "Inflationsrechner", type: "kredit", desc: "Die Inflation vermindert die Kaufkraft Ihres Geldes über Zeit." },
  "tilgung": { title: "Tilgungsrechner", type: "kredit", desc: "Der Tilgungsrechner erstellt einen detaillierten Tilgungsplan." },
  "annuitaet": { title: "Annuitätenrechner", type: "kredit", desc: "Berechnen Sie Annuitätendarlehen mit vollständigem Tilgungsplan." },
  "leasing": { title: "Leasing-Rechner", type: "kredit", desc: "Leasing ist eine Alternative zum Autokauf mit Finanzierung." },
  "haushaltsrechner": { title: "Haushalts-Rechner", type: "kredit", desc: "Planen Sie Ihr monatliches Budget mit unserem Haushaltsrechner." },
  "paypal": { title: "PayPal-Gebühren-Rechner", type: "kredit", desc: "Berechnen Sie die Gebühren für gewerbliche PayPal-Transaktionen." },
  "bafoeg": { title: "BAföG-Rechner", type: "kredit", desc: "Das BAföG ist eine finanzielle Unterstützung für Schüler und Studenten." },
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
    description: rechner.excerpt || `Nutzen Sie unseren ${rechner.title} für Ihre Finanzberechnungen.`,
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
        <div className="max-w-7xl mx-auto px-6 py-12">
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
          {rechner.excerpt && (
            <p
              className="mb-8 text-gray-600"
              style={{
                fontFamily: "Merriweather, serif",
                fontSize: "18px",
                fontWeight: "400",
              }}
            >
              {rechner.excerpt}
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
