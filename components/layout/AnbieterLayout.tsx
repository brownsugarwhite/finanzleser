import Footer from "./Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { splitAnbieterTitle } from "@/lib/anbieter-utils";

type AnbieterLayoutProps = {
  title: string;
  content: string;
};

export default function AnbieterLayout({ title, content }: AnbieterLayoutProps) {
  const { name, kicker } = splitAnbieterTitle(title);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Anbieter", href: "/anbieter" },
    { label: name, href: "#" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div style={{ maxWidth: 1200 }} className="mx-auto px-6 pb-12">
          <Breadcrumb items={breadcrumbItems} />

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

          <div
            className="anbieter-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Hinweis:</strong> Die hier aufgef&uuml;hrten Kontaktdaten wurden zum Zeitpunkt der Recherche von den Webseiten des jeweiligen Anbieters &uuml;bernommen und k&ouml;nnen sich zwischenzeitlich ge&auml;ndert haben.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
