import Link from "next/link";

type QuickItem = { label: string; href: string; icon: string };

const ITEMS: QuickItem[] = [
  { label: "Finanzen", href: "/finanzen", icon: "/icons/icon_finanzen.svg" },
  { label: "Versicherungen", href: "/versicherungen", icon: "/icons/icon_versicherungen.svg" },
  { label: "Steuern", href: "/steuern", icon: "/icons/icon_steuer.svg" },
  { label: "Recht", href: "/recht", icon: "/icons/icon_recht.svg" },
  { label: "Rechner", href: "/finanztools/rechner", icon: "/icons/iconRechner.svg" },
  { label: "Vergleiche", href: "/finanztools/vergleiche", icon: "/icons/iconVergleich.svg" },
  { label: "Checklisten", href: "/finanztools/checklisten", icon: "/icons/iconCheckliste.svg" },
  { label: "Anbieter", href: "/anbieter", icon: "/icons/icon_anbieter.svg" },
  { label: "Dokumente", href: "/finanztools/dokumente", icon: "/icons/iconDokumente.svg" },
];

export default function QuickAccessButtons() {
  return (
    <nav className="quick-access" aria-label="Schnellzugriff">
      {ITEMS.map((item) => (
        <Link key={item.href} href={item.href} className="quick-access__item">
          <span
            className="quick-access__icon"
            aria-hidden
            style={{ "--icon-url": `url(${item.icon})` } as React.CSSProperties}
          />
          <span className="quick-access__label">{item.label}</span>
        </Link>
      ))}

      <style>{`
        .quick-access {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: clamp(8px, 1.4vw, 18px);
          margin: 32px auto 0;
          max-width: 1100px;
          padding: 0 16px;
        }
        .quick-access__item {
          flex: 0 0 96px;
          width: 96px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: var(--color-text-primary);
          text-decoration: none;
          padding: 8px 4px;
          transition: color 0.2s ease;
        }
        .quick-access__icon {
          display: block;
          width: 32px;
          height: 32px;
          background-color: var(--color-text-primary);
          mask-image: var(--icon-url);
          mask-size: contain;
          mask-repeat: no-repeat;
          mask-position: center;
          -webkit-mask-image: var(--icon-url);
          -webkit-mask-size: contain;
          -webkit-mask-repeat: no-repeat;
          -webkit-mask-position: center;
          transition: background-color 0.2s ease;
        }
        .quick-access__label {
          font-family: var(--font-heading, "Merriweather", serif);
          font-size: 14px;
          font-style: italic;
          line-height: 1.2;
          color: var(--color-text-primary);
          transition: color 0.2s ease;
        }
        .quick-access__item:hover .quick-access__icon {
          background-color: var(--color-brand-secondary);
        }
        .quick-access__item:hover .quick-access__label {
          color: var(--color-brand-secondary);
        }
      `}</style>
    </nav>
  );
}
