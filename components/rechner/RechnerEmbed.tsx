import dynamic from "next/dynamic";
import RechnerPlaceholder from "@/components/ui/RechnerPlaceholder";

// Old 17 calculators
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

// New 35 calculators
const Alg1Rechner = dynamic(() => import("./Alg1Rechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const AltersteilzeitRechner = dynamic(() => import("./AltersteilzeitRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const AnnuitaetRechner = dynamic(() => import("./AnnuitaetRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const BafoegRechner = dynamic(() => import("./BafoegRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const BuergergelRechner = dynamic(() => import("./BuergergelRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const ElternzeitRechner = dynamic(() => import("./ElternzeitRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const FlexrenteRechner = dynamic(() => import("./FlexrenteRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const GerichtsKostenRechner = dynamic(() => import("./GerichtsKostenRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const GleitzoneRechner = dynamic(() => import("./GleitzoneRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const GruendungszuschussRechner = dynamic(() => import("./GruendungszuschussRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const GrundsicherungRechner = dynamic(() => import("./GrundsicherungRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const HaushaltsrechnerRechner = dynamic(() => import("./HaushaltsrechnerRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const HinzuverdienstRechner = dynamic(() => import("./HinzuverdienstRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const KalteprogressionRechner = dynamic(() => import("./KalteprogressionRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const KinderkrangengeldRechner = dynamic(() => import("./KinderkrangengeldRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const KirchensteuerRechner = dynamic(() => import("./KirchensteuerRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const KrankengeldRechner = dynamic(() => import("./KrankengeldRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const LeasingRechner = dynamic(() => import("./LeasingRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const MindestlohnRechner = dynamic(() => import("./MindestlohnRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const MinijobRechner = dynamic(() => import("./MinijobRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const MutterschutzRechner = dynamic(() => import("./MutterschutzRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const PaypalRechner = dynamic(() => import("./PaypalRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const PendlerpauschaleRechner = dynamic(() => import("./PendlerpauschaleRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const PfaendungRechner = dynamic(() => import("./PfaendungRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const RentenabschlagRechner = dynamic(() => import("./RentenabschlagRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const RentenbeginRechner = dynamic(() => import("./RentenbeginRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const RentenbesteuerungRechner = dynamic(() => import("./RentenbesteuerungRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const RentenschaetzerRechner = dynamic(() => import("./RentenschaetzerRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const SteuererstattungRechner = dynamic(() => import("./SteuererstattungRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const SteuerklassenRechner = dynamic(() => import("./SteuerklassenRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const TeilzeitRechner = dynamic(() => import("./TeilzeitRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const UebergangsgeldRechner = dynamic(() => import("./UebergangsgeldRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const UrlaubsanspruchRechner = dynamic(() => import("./UrlaubsanspruchRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const VerletztensgeldRechner = dynamic(() => import("./VerletztensgeldRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const WitwenrenteRechner = dynamic(() => import("./WitwenrenteRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

// 4 additional calculators
const HeizkostenRechner = dynamic(() => import("./HeizkostenRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const KfwStudienkreditRechner = dynamic(() => import("./KfwStudienkreditRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const PvFoerderungRechner = dynamic(() => import("./PvFoerderungRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});
const ScheidungskostenRechner = dynamic(() => import("./ScheidungskostenRechner"), {
  loading: () => <div className="rechner-loading">Rechner wird geladen...</div>,
});

interface RechnerEmbedProps {
  slug: string;
}

export default function RechnerEmbed({ slug }: RechnerEmbedProps) {
  const rechner = getRechnerComponent(slug);
  if (!rechner) return null;

  return (
    <div className="rechner-layout">
      <div className="rechner-visual">
        <RechnerPlaceholder />
      </div>
      <div className="rechner-form-col">
        {rechner}
      </div>
    </div>
  );
}

function getRechnerComponent(slug: string) {
  switch (slug) {
    // Old 17 calculators
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

    // New 35 calculators
    case "alg1":
      return <Alg1Rechner />;
    case "altersteilzeit":
      return <AltersteilzeitRechner />;
    case "annuitaet":
      return <AnnuitaetRechner />;
    case "bafoeg":
      return <BafoegRechner />;
    case "buergergeld":
      return <BuergergelRechner />;
    case "elternzeit":
      return <ElternzeitRechner />;
    case "flexrente":
      return <FlexrenteRechner />;
    case "gerichtskosten":
      return <GerichtsKostenRechner />;
    case "gleitzone":
      return <GleitzoneRechner />;
    case "gruendungszuschuss":
      return <GruendungszuschussRechner />;
    case "grundsicherung":
      return <GrundsicherungRechner />;
    case "haushaltsrechner":
      return <HaushaltsrechnerRechner />;
    case "hinzuverdienst":
      return <HinzuverdienstRechner />;
    case "kalteprogression":
      return <KalteprogressionRechner />;
    case "kinderkrankengeld":
      return <KinderkrangengeldRechner />;
    case "kirchensteuer":
      return <KirchensteuerRechner />;
    case "krankengeld":
      return <KrankengeldRechner />;
    case "leasing":
      return <LeasingRechner />;
    case "mindestlohn":
      return <MindestlohnRechner />;
    case "minijob":
      return <MinijobRechner />;
    case "mutterschutz":
      return <MutterschutzRechner />;
    case "paypal":
      return <PaypalRechner />;
    case "pendlerpauschale":
      return <PendlerpauschaleRechner />;
    case "pfaendung":
      return <PfaendungRechner />;
    case "rentenabschlag":
      return <RentenabschlagRechner />;
    case "rentenbeginn":
      return <RentenbeginRechner />;
    case "rentenbesteuerung":
      return <RentenbesteuerungRechner />;
    case "rentenschaetzer":
      return <RentenschaetzerRechner />;
    case "steuererstattung":
      return <SteuererstattungRechner />;
    case "steuerklassen":
      return <SteuerklassenRechner />;
    case "teilzeit":
      return <TeilzeitRechner />;
    case "uebergangsgeld":
      return <UebergangsgeldRechner />;
    case "urlaubsanspruch":
      return <UrlaubsanspruchRechner />;
    case "verletztengeld":
      return <VerletztensgeldRechner />;
    case "witwenrente":
      return <WitwenrenteRechner />;

    // 4 additional calculators
    case "heizkosten":
      return <HeizkostenRechner />;
    case "kfw-studienkredit":
      return <KfwStudienkreditRechner />;
    case "pv-foerderung":
      return <PvFoerderungRechner />;
    case "scheidungskosten":
      return <ScheidungskostenRechner />;

    default:
      return null;
  }
}
