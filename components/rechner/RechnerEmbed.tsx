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

const WohngeldRechner = dynamic(() => import("./WohngeldRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const TilgungRechner = dynamic(() => import("./TilgungRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const EinkommensteuerRechner = dynamic(() => import("./EinkommensteuerRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const RenteRechner = dynamic(() => import("./RenteRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const ErbschaftsteuerRechner = dynamic(() => import("./ErbschaftsteuerRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const UnterhaltRechner = dynamic(() => import("./UnterhaltRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const ElterngeldRechner = dynamic(() => import("./ElterngeldRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const KfzSteuerRechner = dynamic(() => import("./KfzSteuerRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const AbfindungRechner = dynamic(() => import("./AbfindungRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

const KurzarbeitssgeldRechner = dynamic(() => import("./KurzarbeitssgeldRechner"), {
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
    case "wohngeld":
      return <WohngeldRechner />;
    case "tilgung":
      return <TilgungRechner />;
    case "einkommensteuer":
      return <EinkommensteuerRechner />;
    case "rente":
      return <RenteRechner />;
    case "erbschaftsteuer":
      return <ErbschaftsteuerRechner />;
    case "unterhalt":
      return <UnterhaltRechner />;
    case "elterngeld":
      return <ElterngeldRechner />;
    case "kfz-steuer":
      return <KfzSteuerRechner />;
    case "abfindung":
      return <AbfindungRechner />;
    case "kurzarbeitsgeld":
      return <KurzarbeitssgeldRechner />;

    default:
      return null;
  }
}
