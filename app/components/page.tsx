import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Spacer from "@/components/ui/Spacer";
import DotSpacer from "@/components/ui/DotSpacer";
import TopBanner from "@/components/ui/TopBanner";
import SubBanner from "@/components/ui/SubBanner";

export default function ComponentsPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 24px 60px" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "36px", fontWeight: 700, marginBottom: "48px", color: "var(--color-text-primary)" }}>
          Komponenten-Bibliothek
        </h1>

        {/* Button */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 600, marginBottom: "16px", color: "var(--color-text-primary)" }}>Button</h2>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Button label="Primary Button" />
            <Button label="Secondary" variant="secondary" />
            <Button label="Large Button" size="lg" />
          </div>
        </section>

        {/* Spacer */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 600, marginBottom: "16px", color: "var(--color-text-primary)" }}>Spacer</h2>
          <Spacer noMargin />
        </section>

        {/* DotSpacer */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 600, marginBottom: "16px", color: "var(--color-text-primary)" }}>DotSpacer</h2>
          <DotSpacer noMargin />
        </section>

        {/* TopBanner */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 600, marginBottom: "16px", color: "var(--color-text-primary)" }}>TopBanner (Marquee)</h2>
        </section>
      </main>

      <TopBanner text="Der neue Finanzleser ist da. Abonnieren Sie jetzt unseren Newsletter!" />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px 60px" }}>
        {/* SubBanner */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 600, marginBottom: "16px", color: "var(--color-text-primary)" }}>SubBanner</h2>
        </section>
      </main>

      <SubBanner text="Mit neu überarbeiteten Rechnern, Vergleichen und Checklisten haben Sie die volle Kontrolle über Ihre Finanzen!" />

      <div style={{ height: "60px" }} />
      <Footer />
    </>
  );
}
