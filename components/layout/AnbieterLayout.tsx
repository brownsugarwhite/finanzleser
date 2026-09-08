import Footer from "./Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PageAds from "./PageAds";
import AdSlot from "@/components/ui/AdSlot";
import { splitAnbieterTitle, injectSectionIcons } from "@/lib/anbieter-utils";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import KartenKapitel from "@/components/faden/KartenKapitel";
import AnbieterKarte from "@/components/faden/karten/AnbieterKarte";
import { buildAnbieterUrl } from "@/lib/urls";
import { getSiteSettings } from "@/lib/wordpress";

type AnbieterLayoutProps = {
  title: string;
  content: string;
  slug?: string;
};

export default async function AnbieterLayout({ title, content, slug }: AnbieterLayoutProps) {
  const { name, kicker } = splitAnbieterTitle(title);
  if (FADEN_AKTIV) {
    return (
      <KartenKapitel schluessel={`anbieter:${slug || name}`} titel={name} titelZusatz={kicker || undefined} kicker="Anbieter" krumen={[{ name: "Service", href: "/anbieter" }, { name: "Anbieter", href: "/anbieter" }]} url={slug ? buildAnbieterUrl(slug) : "/anbieter"}>
        <AnbieterKarte content={content} />
      </KartenKapitel>
    );
  }
  const contentWithIcons = injectSectionIcons(content);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Anbieter", href: "/anbieter" },
    { label: name, href: "#" },
  ];

  const settings = await getSiteSettings();

  return (
    <>
      <main className="min-h-screen bg-white">
        <PageAds
          ads={settings.ads.anbieter}
          contentWidth={850}
          contentClassName="pb-12"
          heading={
            <>
              <Breadcrumb items={breadcrumbItems} />

              {/* Kicker INNERHALB der h1: die Seiten ranken historisch auf „<Firma> Kontakt" —
                  DOM-Reihenfolge Name→Kontakt, visuell via order-first Kicker oben (unverändert). */}
              <h1 className="mb-6 flex flex-col">
                <span className="font-bold" style={{ fontSize: "42px", lineHeight: "1.3em" }}>
                  {name}
                </span>
                {kicker && (
                  <span
                    className="order-first mb-2"
                    style={{
                      color: "var(--color-brand-secondary)",
                      fontFamily: "Merriweather, serif",
                      fontSize: "23px",
                      fontStyle: "italic",
                      fontWeight: "normal",
                    }}
                  >
                    {kicker}
                  </span>
                )}
              </h1>
            </>
          }
        >
          <div
            className="anbieter-content"
            dangerouslySetInnerHTML={{ __html: contentWithIcons }}
          />

          {/* Mid-Werbung (nach dem Inhalt) — nur wenn geschaltet. */}
          {settings.ads.anbieter.mid && (
            <div className="page-shell-mid">
              <AdSlot format="billboard" fullWidth />
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Hinweis:</strong> Die hier aufgef&uuml;hrten Kontaktdaten wurden zum Zeitpunkt der Recherche von den Webseiten des jeweiligen Anbieters &uuml;bernommen und k&ouml;nnen sich zwischenzeitlich ge&auml;ndert haben.
            </p>
          </div>
        </PageAds>
      </main>
      <Footer />
    </>
  );
}
