import dynamic from "next/dynamic";

// Lazy load calculators
const BruttoNettoRechner = dynamic(() => import("./BruttoNettoRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const KreditRechner = dynamic(() => import("./KreditRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const MehrwertsteuerRechner = dynamic(() => import("./MehrwertsteuerRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const InflationRechner = dynamic(() => import("./InflationRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

interface RechnerEmbedProps {
  slug: string;
}

export default function RechnerEmbed({ slug }: RechnerEmbedProps) {
  switch (slug) {
    case "brutto-netto":
      return <BruttoNettoRechner />;
    case "kredit":
      return <KreditRechner />;
    case "mehrwertsteuer":
      return <MehrwertsteuerRechner />;
    case "inflation":
      return <InflationRechner />;

    // More calculators will be added here
    // case "einkommensteuer":
    //   return <EinkommensteuerRechner />;
    // ... etc

    default:
      return null;
  }
}
