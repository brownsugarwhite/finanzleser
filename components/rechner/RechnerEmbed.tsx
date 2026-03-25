import dynamic from "next/dynamic";

// Lazy load calculators
const BruttoNettoRechner = dynamic(() => import("./BruttoNettoRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

interface RechnerEmbedProps {
  slug: string;
}

export default function RechnerEmbed({ slug }: RechnerEmbedProps) {
  switch (slug) {
    case "brutto-netto":
      return <BruttoNettoRechner />;

    // More calculators will be added here
    // case "kredit":
    //   return <KreditRechner />;
    // case "einkommensteuer":
    //   return <EinkommensteuerRechner />;
    // ... etc

    default:
      return null;
  }
}
