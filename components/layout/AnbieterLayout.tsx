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

// Die Abschnitts-„Icons" stehen als Emoji am Anfang der h3 im WP-Content
// (🏢 / 🌐 / 📞). Wir ersetzen sie frontend-seitig durch unsere Inline-SVGs
// (fill: currentColor → exakt die dunkle Überschrift-Textfarbe), ohne alle
// 147 Anbieter-Beiträge anfassen zu müssen.
const SECTION_ICONS: { match: RegExp; svg: string }[] = [
  {
    // Name & Adresse → Home
    match: /(?:&#x1f3e2;|\u{1F3E2})\s*/gu,
    svg: '<svg class="anbieter-h3-icon" viewBox="0 0 268.42 268.42" aria-hidden="true"><path d="M254.18,30.74c-4.6-6.33-10.17-11.9-16.5-16.5C218.09,0,190.13,0,134.21,0S50.33,0,30.74,14.24c-6.33,4.6-11.9,10.17-16.5,16.5C0,50.33,0,78.29,0,134.21s0,83.88,14.24,103.48c4.6,6.33,10.17,11.9,16.5,16.5,19.6,14.24,47.56,14.24,103.47,14.24s83.88,0,103.48-14.24c6.33-4.6,11.9-10.17,16.5-16.5,14.24-19.6,14.24-47.56,14.24-103.48s0-83.88-14.24-103.47ZM219.96,125.61c-1.68,1.56-4.01,2.52-6.4,2.56l-7.67.1v71.87c-.07,2.86-2.05,6.99-5.34,7.01l-44.24.18v-48.76c0-2.98-1.96-5.26-5.06-5.46h-30.3c-3.07.08-5.23,2.36-5.23,5.45v48.76s-44.22-.18-44.22-.18c-3.29-.01-5.28-4.13-5.32-7.01v-71.87s-7.68-.11-7.68-.11c-2.76-.04-5.29-1.18-7.06-3.26-2.02-2.36-2.26-6.1.23-8.4l77.78-71.91c4.16-3.85,10.55-3.77,14.66.1l75.83,71.33c2.87,2.7,2.93,6.9.03,9.59Z"/></svg>',
  },
  {
    // Website & E-Mail → Web
    match: /(?:&#x1f310;|\u{1F310})\s*/gu,
    svg: '<svg class="anbieter-h3-icon" viewBox="0 0 268.42 268.42" aria-hidden="true"><path d="M254.18,30.74c-4.6-6.33-10.17-11.9-16.5-16.5C218.09,0,190.13,0,134.21,0S50.33,0,30.74,14.24c-6.33,4.6-11.9,10.17-16.5,16.5C0,50.33,0,78.29,0,134.21s0,83.88,14.24,103.48c4.6,6.33,10.17,11.9,16.5,16.5,19.6,14.24,47.56,14.24,103.47,14.24s83.88,0,103.48-14.24c6.33-4.6,11.9-10.17,16.5-16.5,14.24-19.6,14.24-47.56,14.24-103.48s0-83.88-14.24-103.47ZM224.05,151.85c-3.7,9.31-8.83,16.6-15.39,21.86-6.56,5.27-14.04,7.9-22.43,7.9-6.03,0-11.49-1.2-16.37-3.61-4.88-2.4-8.7-5.74-11.45-10.02h-1.72c-8.17,9.08-18.09,13.62-29.76,13.62-13.96,0-24.69-4.08-32.16-12.25-7.48-8.16-11.22-19.57-11.22-34.22,0-10.76,2.37-20.28,7.1-28.56,4.73-8.28,11.56-14.65,20.49-19.12,8.93-4.46,19.27-6.7,31.02-6.7,6.18,0,13.03.85,19.65,2.93,10.15,3.17,20.84,11.44,20.26,23.2l-1.45,29.16-.23,10.76c0,6.56,1.87,9.84,5.61,9.84,3.97,0,9.19-3.32,11.67-9.96,2.48-6.64,3.72-15.03,3.72-25.18,0-18.24-6.15-33.32-16.45-43.24-10.3-9.92-25.92-15.88-44.84-15.88-14.5,0-29.11,5.02-39.83,11.04-10.72,6.03-19.91,14.67-25.55,25.93-5.65,11.26-8.47,24.44-8.47,39.55,0,19.46,7.44,35.47,18.31,46.04,10.87,10.57,27.23,16.85,47.07,16.85,8.85,0,18.41-.95,28.67-2.86,4.75-.88,9.45-1.94,14.11-3.16,8.12-2.14,16.05,2.02,16.05,10.42h0c0,5.44-3.41,10.34-8.55,12.1-14.84,5.07-31.06,7.61-48.68,7.61-29.61,0-52.86-7.73-69.77-23.18-16.9-15.45-25.35-36.87-25.35-64.27,0-19.3,4.37-36.61,13.11-51.91,8.74-15.3,20.79-27.09,36.17-35.37,15.38-8.28,32.79-12.42,52.25-12.42,17.86,0,33.63,3.4,47.33,10.19,13.7,6.79,24.23,16.46,31.59,29.02,7.36,12.55,11.05,27.15,11.05,43.78,0,10.76-1.85,20.79-5.55,30.1Z"/><path d="M122.98,113.51c-4.85,5.11-7.27,12.25-7.27,21.4,0,7.63,1.39,13.16,4.18,16.6,2.78,3.43,6.47,5.15,11.04,5.15,5.88,0,10.19-2.36,12.93-7.1,2.75-4.73,4.54-13.12,5.38-25.18l1.14-17.86c-3.05-.46-5.65-.69-7.78-.69-8.24,0-14.79,2.56-19.63,7.67Z"/></svg>',
  },
  {
    // Telefonnummern → Phone
    match: /(?:&#x1f4de;|\u{1F4DE})\s*/gu,
    svg: '<svg class="anbieter-h3-icon" viewBox="0 0 268.42 268.42" aria-hidden="true"><path d="M254.18,30.74c-4.6-6.33-10.17-11.9-16.5-16.5C218.09,0,190.13,0,134.21,0S50.33,0,30.74,14.24c-6.33,4.6-11.9,10.17-16.5,16.5C0,50.33,0,78.29,0,134.21s0,83.88,14.24,103.48c4.6,6.33,10.17,11.9,16.5,16.5,19.6,14.24,47.56,14.24,103.47,14.24s83.88,0,103.48-14.24c6.33-4.6,11.9-10.17,16.5-16.5,14.24-19.6,14.24-47.56,14.24-103.48s0-83.88-14.24-103.47ZM217.54,207.08c-5.57,4.7-12.36,9.35-19.91,10.22-19.44,2.24-38.58-1.78-56.35-9.71-40.15-17.92-73.26-58.27-89.92-98.14-10.2-24.41-2.17-48.11,19.49-61.96,7.82.68,18.28-2.18,21.26,5.32l14.95,37.67c.97,2.45.86,5.57-.69,7.71l-10.56,14.64c-2.06,2.85-2.17,6.05-.66,9.23,11.79,24.76,35.27,42.29,59.66,53.52,3.51,1.62,7.17,1.2,9.89-1.56l14.79-14.95c2.75-2.78,6.45-3.32,9.78-1.65l34.45,17.25c3.21,1.61,4.78,4.56,4.71,8.16-.19,9.34-3.61,18.09-10.89,24.24Z"/></svg>',
  },
];

function injectSectionIcons(html: string): string {
  return SECTION_ICONS.reduce((acc, ic) => acc.replace(ic.match, ic.svg), html);
}

export default async function AnbieterLayout({ title, content }: AnbieterLayoutProps) {
  const { name, kicker } = splitAnbieterTitle(title);
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
            dangerouslySetInnerHTML={{ __html: contentWithIcons }}
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
