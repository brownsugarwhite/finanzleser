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

const ZinseszinsRechner = dynamic(() => import("./ZinseszinsRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const StundenlohnRechner = dynamic(() => import("./StundenlohnRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const KindergeldRechner = dynamic(() => import("./KindergeldRechner"), {
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
    case "zinseszins":
      return <ZinseszinsRechner />;
    case "stundenlohn":
      return <StundenlohnRechner />;
    case "kindergeld":
      return <KindergeldRechner />;

    // More calculators coming soon:
    // - einkommensteuer
    // - rente
    // - erbschaftsteuer
    // - unterhalt
    // - elterngeld
    // - kfz-steuer
    // - abfindung
    // - wohngeld
    // - kurzarbeitsgeld
    // - tilgung

    default:
      return null;
  }
}
