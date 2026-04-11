import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
  async redirects() {
    return [
      // 301 Redirects für zusammengefasste Beiträge (42)
      { source: "/aktienfonds", destination: "/versicherungen/altersvorsorge/fondsgebundene-lebensversicherung", permanent: true },
      { source: "/annuitaetendarlehen", destination: "/finanzen/kredite-und-bauen/kredite", permanent: true },
      { source: "/beitragsbemessungsgrenze", destination: "/versicherungen/sozialversicherung/beitragsbemessungsgrenzen", permanent: true },
      { source: "/beitragsbemessungsgrenze-krankenversicherung", destination: "/versicherungen/sozialversicherung/beitragsbemessungsgrenzen", permanent: true },
      { source: "/beitragsbemessungsgrenze-rentenversicherung", destination: "/versicherungen/sozialversicherung/beitragsbemessungsgrenzen", permanent: true },
      { source: "/beitragssaetze", destination: "/versicherungen/sozialversicherung/beitragsbemessungsgrenzen", permanent: true },
      { source: "/berufskleidung-von-der-steuer-absetzen", destination: "/steuern/steuererklaerung/arbeitskleidung-von-der-steuer-absetzen", permanent: true },
      { source: "/berufsunfaehigkeitsversicherung-fuer-auszubildende", destination: "/versicherungen/berufsunfaehigkeit/berufsunfaehigkeitsversicherung", permanent: true },
      { source: "/berufsunfaehigkeitsversicherung-fuer-beamte", destination: "/versicherungen/berufsunfaehigkeit/berufsunfaehigkeitsversicherung", permanent: true },
      { source: "/berufsunfaehigkeitsversicherung-fuer-studenten", destination: "/versicherungen/berufsunfaehigkeit/berufsunfaehigkeitsversicherung", permanent: true },
      { source: "/berufsunfaehigkeitsversicherung-mit-vorerkrankungen", destination: "/versicherungen/berufsunfaehigkeit/berufsunfaehigkeitsversicherung", permanent: true },
      { source: "/betriebsrente", destination: "/versicherungen/altersvorsorge/betriebliche-altersversorgung", permanent: true },
      { source: "/computer-von-der-steuer-absetzen", destination: "/steuern/steuererklaerung/arbeitsmittel", permanent: true },
      { source: "/darlehen", destination: "/finanzen/kredite-und-bauen/kredite", permanent: true },
      { source: "/erwerbsunfaehigkeitsrente", destination: "/versicherungen/berufsunfaehigkeit/erwerbsminderungsrente", permanent: true },
      { source: "/investmentfonds", destination: "/versicherungen/altersvorsorge/fondsgebundene-lebensversicherung", permanent: true },
      { source: "/krankengeld-fuer-selbststaendige", destination: "/versicherungen/krankenversicherung/krankengeld", permanent: true },
      { source: "/krankenkassenbeitrag", destination: "/versicherungen/krankenversicherung/krankenversicherungsbeitraege", permanent: true },
      { source: "/kredit-sondertilgung", destination: "/finanzen/kredite-und-bauen/kredite", permanent: true },
      { source: "/kuendigung-gesetzliche-krankenkasse", destination: "/versicherungen/krankenversicherung/kuendigung-krankenversicherung", permanent: true },
      { source: "/kuendigung-private-krankenversicherung", destination: "/versicherungen/krankenversicherung/kuendigung-krankenversicherung", permanent: true },
      { source: "/lebensversicherung-beitragsfrei", destination: "/versicherungen/altersvorsorge/lebensversicherung", permanent: true },
      { source: "/lebensversicherung-kuendigen", destination: "/versicherungen/altersvorsorge/lebensversicherung", permanent: true },
      { source: "/lebensversicherung-verkaufen", destination: "/versicherungen/altersvorsorge/lebensversicherung", permanent: true },
      { source: "/mischfonds", destination: "/versicherungen/altersvorsorge/fondsgebundene-lebensversicherung", permanent: true },
      { source: "/perde-op-versicherung", destination: "/versicherungen/tierversicherungen/pferdeversicherung", permanent: true },
      { source: "/pferdekrankenversicherung-vergleich", destination: "/versicherungen/tierversicherungen/pferdeversicherung", permanent: true },
      { source: "/pflegeversicherung-krankenkasse", destination: "/versicherungen/krankenversicherung/pflegeversicherung", permanent: true },
      { source: "/private-krankenversicherung-arbeitslose", destination: "/versicherungen/krankenversicherung/private-krankenversicherung", permanent: true },
      { source: "/private-krankenversicherung-beamte", destination: "/versicherungen/krankenversicherung/private-krankenversicherung", permanent: true },
      { source: "/private-krankenversicherung-kinder", destination: "/versicherungen/krankenversicherung/private-krankenversicherung", permanent: true },
      { source: "/private-krankenversicherung-rentner", destination: "/versicherungen/krankenversicherung/private-krankenversicherung", permanent: true },
      { source: "/private-rentenversicherung", destination: "/versicherungen/altersvorsorge/rentenversicherung", permanent: true },
      { source: "/ratenkredit", destination: "/finanzen/kredite-und-bauen/kredite", permanent: true },
      { source: "/reiseruecktrittsversicherung", destination: "/versicherungen/sachversicherungen/reiseversicherung", permanent: true },
      { source: "/rentenfonds", destination: "/versicherungen/altersvorsorge/fondsgebundene-lebensversicherung", permanent: true },
      { source: "/steuererklaerung-2025", destination: "/steuern/steuererklaerung/steuererklaerung", permanent: true },
      { source: "/steuerformulare-2025", destination: "/steuern/steuererklaerung/steuerformulare-2024", permanent: true },
      { source: "/steuerformulare", destination: "/steuern/steuererklaerung/steuerformulare-2024", permanent: true },
      { source: "/steuerklassenwahl", destination: "/steuern/steuererklaerung/steuerklassen", permanent: true },
      { source: "/steuerklassenwechsel", destination: "/steuern/steuererklaerung/steuerklassen", permanent: true },
      { source: "/steuersoftware-steuererklaerung", destination: "/steuern/steuererklaerung/elster", permanent: true },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "finanzleser.local",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "www.finanzleser.de",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
