import Footer from "./Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PageAds from "./PageAds";
import AdSlot from "@/components/ui/AdSlot";
import { splitAnbieterTitle } from "@/lib/anbieter-utils";
import { getSiteSettings } from "@/lib/wordpress";

type AnbieterLayoutProps = {
  title: string;
  content: string;
};

export default async function AnbieterLayout({ title, content }: AnbieterLayoutProps) {
  const { name, kicker } = splitAnbieterTitle(title);

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

              {/* Header-Bild bleibt (Platzhalter). */}
              <div className="mb-8 bg-gray-200" style={{ height: 230 }} aria-hidden="true" />

              {kicker && (
                <span
                  className="mb-2 inline-block"
                  style={{
                    color: "var(--color-brand-secondary)",
                    fontFamily: "Merriweather, serif",
                    fontSize: "23px",
                    fontStyle: "italic",
                  }}
                >
                  {kicker}
                </span>
              )}

              <h1 className="font-bold mb-6" style={{ fontSize: "42px", lineHeight: "1.3em" }}>
                {name}
              </h1>
            </>
          }
        >
          <div
            className="anbieter-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Mid-Werbung (nach dem Inhalt) — nur wenn geschaltet. */}
          {settings.ads.anbieter.mid && (
            <div className="page-ad-mid">
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
