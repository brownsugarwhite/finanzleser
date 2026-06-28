/**
 * Generische sticky Werbe-Rails links + rechts neben dem zentrierten Content.
 * Reines CSS (kein TOC-Shift wie bei ArticleAdRails) → server-renderbar.
 * Position über --page-content-w (inline auf .page-ads gesetzt) + die geteilten
 * Vars --ad-rail-w/--ad-rail-gap. Box erbt die pink-Ecke über data-ad-format.
 * <1440px werden die Rails per CSS ausgeblendet.
 */
export default function PageAdRails() {
  return (
    <>
      <div className="page-ad-rail page-ad-rail-left" aria-hidden>
        <div className="page-ad-rail-sticky">
          <div className="page-ad-rail-box" data-ad-format="rail" role="complementary" aria-label="Werbung" />
        </div>
      </div>
      <div className="page-ad-rail page-ad-rail-right" aria-hidden>
        <div className="page-ad-rail-sticky">
          <div className="page-ad-rail-box" data-ad-format="rail" role="complementary" aria-label="Werbung" />
        </div>
      </div>
    </>
  );
}
