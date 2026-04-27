import Footer from "./Footer";
import Spacer from "@/components/ui/Spacer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import StickySparkHeading from "@/components/ui/StickySparkHeading";
import { decodeHtmlEntities } from "@/lib/html-utils";

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  content: string;
  visualPlaceholder?: boolean;
  headingVariant?: "split" | "spark";
};

export default function LegalPageLayout({
  eyebrow,
  title,
  content,
  visualPlaceholder = true,
  headingVariant = "split",
}: LegalPageLayoutProps) {
  const decodedTitle = decodeHtmlEntities(title);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: decodedTitle, href: "#" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div style={{ maxWidth: 1200 }} className="mx-auto px-6 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {headingVariant === "spark" ? (
          <>
            {visualPlaceholder && (
              <div style={{ maxWidth: 1200, marginBottom: 40 }} className="mx-auto px-6">
                <div
                  style={{
                    width: "100%",
                    height: 250,
                    background: "rgba(0, 0, 0, 0.05)",
                  }}
                  aria-hidden="true"
                />
              </div>
            )}
            <StickySparkHeading title={decodedTitle} as="h1" />
            <div style={{ maxWidth: 1200 }} className="mx-auto px-6 pb-12">
              <div className="legal-page__body" style={{ marginTop: 40 }}>
                <div
                  className="prose prose-lg legal-prose"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          </>
        ) : (
          <div style={{ maxWidth: 1200 }} className="mx-auto px-6 pb-12">
            <div className="legal-hero">
              <div className="legal-hero__text">
                <span className="legal-hero__eyebrow">{eyebrow}</span>
                <h1 className="legal-hero__title font-bold">{decodedTitle}</h1>
              </div>
              {visualPlaceholder && (
                <div
                  className="legal-hero__visual"
                  aria-hidden="true"
                  title="Visual-Platzhalter"
                />
              )}
            </div>

            <Spacer maxWidth="100%" noMargin />

            <div className="legal-page__body">
              <div
                className="prose prose-lg legal-prose"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />

      <style>{`
        .legal-hero {
          display: flex;
          gap: 36px;
          align-items: stretch;
          margin: 24px 0 40px;
        }
        .legal-hero__text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-end;
          text-align: right;
          padding: 16px 0;
        }
        .legal-hero__eyebrow {
          color: var(--color-brand-secondary);
          font-family: Merriweather, serif;
          font-size: 23px;
          font-style: italic;
          line-height: 1.3em;
          margin-bottom: 8px;
          display: inline-block;
        }
        .legal-hero__title {
          font-size: 42px;
          line-height: 1.3em;
          margin: 0;
          color: var(--color-text-primary);
        }
        .legal-hero__visual {
          flex-shrink: 0;
          width: 50%;
          min-height: 240px;
          background: rgba(0, 0, 0, 0.05);
        }
        .legal-page__body {
          max-width: 760px;
          margin: 0 auto;
          padding: 40px 8px 0;
        }
        .legal-prose {
          color: var(--color-text-primary);
          font-family: var(--font-body);
          font-size: 16px;
        }
        .legal-prose h1 { display: none; }
        .legal-prose h2 {
          font-family: var(--font-heading, "Merriweather", serif);
          color: var(--color-text-primary);
        }
        .legal-prose h3 {
          font-family: var(--font-heading, "Merriweather", serif);
          font-size: 20px !important;
          font-weight: 600 !important;
          color: var(--color-text-primary);
        }
        .legal-prose a {
          color: var(--color-brand-secondary);
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 3px;
          transition: color 0.15s ease;
        }
        .legal-prose a:hover { color: var(--color-brand); }
        .legal-prose hr.wp-block-separator {
          border: 0;
          height: 1px;
          background: var(--color-border-default);
          margin: 2.5em 0;
        }
        .legal-prose strong { color: var(--color-text-primary); }

        @media (max-width: 768px) {
          .legal-hero {
            flex-direction: column;
            gap: 24px;
          }
          .legal-hero__text {
            align-items: flex-start;
            text-align: left;
            padding: 0;
          }
          .legal-hero__visual {
            width: 100%;
            min-height: 180px;
            order: -1;
          }
          .legal-hero__title { font-size: 32px; }
        }
      `}</style>
    </>
  );
}
