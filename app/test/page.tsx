import { Merriweather, Open_Sans } from "next/font/google";
import TopNavigation from "@/components/ui/TopNavigation";
import LogoAnimation from "@/components/ui/LogoAnimation";
import Spacer from "@/components/ui/Spacer";

const merriweather = Merriweather({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-test-heading",
});

const openSans = Open_Sans({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-test-body",
});

export default function TestPage() {
  return (
    <div className={`${merriweather.variable} ${openSans.variable}`} style={{ background: "#fff" }}>
      {/* Fixed logo container */}
      <div style={{
        position: "fixed",
        top: 36,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 61,
        pointerEvents: "none",
      }}>
        <div style={{
          flex: 1,
          minWidth: 214,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingLeft: 24,
          transform: "translateX(13px)",
        }}>
          <LogoAnimation />
        </div>
        <div style={{ width: 960, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 1 }} />
      </div>

      {/* Top navigation — same 3-column structure so 960px aligns with fixed logo */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ flex: 1, minWidth: 214, paddingLeft: 24, transform: "translateX(13px)" }} />
        <div style={{ width: 960, flexShrink: 0, padding: "0 clamp(20px, 4vw, 40px)" }}>
          <TopNavigation />
        </div>
        <div style={{ flex: 1, minWidth: 1 }} />
      </div>
      <Spacer />
      <div style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 80px) clamp(20px, 4vw, 40px)",
      }}>

        {/* Hero */}
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "14px", color: "#999", marginBottom: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Kategorie · Steuern
        </p>
        <h1 style={{ fontFamily: "var(--font-test-heading)", fontSize: "clamp(28px, 4vw, 48px)", color: "#0f172a", lineHeight: 1.2, marginBottom: "24px" }}>
          Steuerklassen in Deutschland: Alles was Sie wissen müssen
        </h1>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#475569", lineHeight: 1.7, marginBottom: "48px", maxWidth: "720px" }}>
          Die Wahl der richtigen Steuerklasse kann erheblichen Einfluss auf Ihr monatliches Nettogehalt haben. In diesem Ratgeber erklären wir alle sechs Steuerklassen, wer sie wählen kann und wie Sie optimal davon profitieren.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", marginBottom: "48px" }} />

        {/* Abschnitt 1 */}
        <h2 style={{ fontFamily: "var(--font-test-heading)", fontSize: "clamp(22px, 3vw, 32px)", color: "#0f172a", lineHeight: 1.25, marginBottom: "20px" }}>
          Was sind Steuerklassen?
        </h2>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "20px" }}>
          Steuerklassen sind Kategorien im deutschen Steuerrecht, die bestimmen wie viel Lohnsteuer Arbeitgeber von Ihrem Bruttogehalt einbehalten. Sie werden vom Finanzamt zugeteilt und hängen von Ihrem Familienstand sowie der Anzahl Ihrer Jobs ab.
        </p>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "48px" }}>
          Insgesamt gibt es in Deutschland sechs verschiedene Steuerklassen. Jede Klasse hat unterschiedliche Freibeträge und Abzüge, die direkt beeinflussen wie viel Nettolohn Sie monatlich erhalten. Eine falsche Einteilung kann zu einer hohen Steuernachzahlung führen.
        </p>

        {/* Abschnitt 2 */}
        <h2 style={{ fontFamily: "var(--font-test-heading)", fontSize: "clamp(22px, 3vw, 32px)", color: "#0f172a", lineHeight: 1.25, marginBottom: "20px" }}>
          Die sechs Steuerklassen im Überblick
        </h2>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "20px" }}>
          <strong>Steuerklasse I</strong> gilt für ledige, geschiedene oder verwitwete Arbeitnehmer ohne Kinder. Sie ist die häufigste Steuerklasse in Deutschland und hat mittlere Abzüge.
        </p>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "20px" }}>
          <strong>Steuerklasse II</strong> ist für Alleinerziehende gedacht. Sie bietet einen zusätzlichen Entlastungsbetrag von derzeit 4.260 Euro jährlich, was sich spürbar auf das Nettogehalt auswirkt.
        </p>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "20px" }}>
          <strong>Steuerklasse III</strong> gilt für Verheiratete, wenn der Partner in Steuerklasse V ist oder kein Einkommen hat. Sie hat die geringsten Abzüge und ist für den Besserverdiener in der Ehe gedacht.
        </p>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "20px" }}>
          <strong>Steuerklasse IV</strong> gilt für Verheiratete mit ähnlichem Einkommen. Beide Partner zahlen dann ungefähr gleich viel Lohnsteuer. Eine Nachzahlung ist in diesem Fall selten.
        </p>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "20px" }}>
          <strong>Steuerklasse V</strong> ist die Gegenklasse zu III und hat die höchsten Abzüge. Wählen Verheiratete die Kombination III/V, muss am Jahresende eine Steuererklärung abgegeben werden.
        </p>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "48px" }}>
          <strong>Steuerklasse VI</strong> gilt für einen zweiten oder weiteren Nebenjob. Hier gibt es keine Freibeträge – der gesamte Verdienst wird besteuert.
        </p>

        {/* Abschnitt 3 */}
        <h2 style={{ fontFamily: "var(--font-test-heading)", fontSize: "clamp(22px, 3vw, 32px)", color: "#0f172a", lineHeight: 1.25, marginBottom: "20px" }}>
          Steuerklasse wechseln – so geht es
        </h2>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "20px" }}>
          Einen Steuerklassenwechsel können Sie einmal pro Jahr beim zuständigen Finanzamt beantragen. Der Wechsel ist kostenlos und unkompliziert. Verheiratete können zwischen den Kombinationen III/V und IV/IV wählen.
        </p>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "48px" }}>
          Seit 2020 ist der Wechsel auch digital über ELSTER möglich. Der neue Steuerbescheid gilt dann ab dem Folgemonat. Wichtig: Prüfen Sie vor einem Wechsel immer die Auswirkungen auf Ihr Nettogehalt mit einem Brutto-Netto-Rechner.
        </p>

        {/* Abschnitt 4 */}
        <h2 style={{ fontFamily: "var(--font-test-heading)", fontSize: "clamp(22px, 3vw, 32px)", color: "#0f172a", lineHeight: 1.25, marginBottom: "20px" }}>
          Steuerklasse und Elterngeld
        </h2>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "20px" }}>
          Die Steuerklasse hat direkten Einfluss auf die Höhe des Elterngeldes. Da das Elterngeld auf Basis des Nettoeinkommens berechnet wird, lohnt es sich für werdende Eltern, rechtzeitig die günstigere Steuerklasse zu wählen.
        </p>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "48px" }}>
          In der Regel empfiehlt es sich für den Elternteil, der in Elternzeit geht, mindestens 7 Monate vor der Geburt in Steuerklasse III zu wechseln. Das Finanzamt prüft dabei die letzten 12 Monate vor der Geburt.
        </p>

        {/* Abschnitt 5 */}
        <h2 style={{ fontFamily: "var(--font-test-heading)", fontSize: "clamp(22px, 3vw, 32px)", color: "#0f172a", lineHeight: 1.25, marginBottom: "20px" }}>
          Häufig gestellte Fragen
        </h2>

        <h3 style={{ fontFamily: "var(--font-test-heading)", fontSize: "clamp(18px, 2.5vw, 24px)", color: "#0f172a", marginBottom: "12px" }}>
          Kann ich meine Steuerklasse rückwirkend ändern?
        </h3>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "32px" }}>
          Nein, eine rückwirkende Änderung der Steuerklasse ist in der Regel nicht möglich. Der Wechsel gilt immer erst ab dem Folgemonat nach der Antragstellung beim Finanzamt.
        </p>

        <h3 style={{ fontFamily: "var(--font-test-heading)", fontSize: "clamp(18px, 2.5vw, 24px)", color: "#0f172a", marginBottom: "12px" }}>
          Welche Steuerklasse ist nach der Heirat die beste?
        </h3>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "32px" }}>
          Das hängt vom Einkommensunterschied ab. Bei ähnlichem Einkommen ist IV/IV sinnvoll. Bei größerem Unterschied lohnt sich III/V für mehr Netto monatlich – aber Achtung, dann ist eine Steuererklärung Pflicht.
        </p>

        <h3 style={{ fontFamily: "var(--font-test-heading)", fontSize: "clamp(18px, 2.5vw, 24px)", color: "#0f172a", marginBottom: "12px" }}>
          Was passiert bei der Steuerklasse nach Scheidung?
        </h3>
        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "18px", color: "#334155", lineHeight: 1.75, marginBottom: "80px" }}>
          Nach einer Scheidung werden beide Partner automatisch in Steuerklasse I eingestuft, sofern keine Kinder vorhanden sind. Mit Kindern kommt Steuerklasse II in Frage.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", marginBottom: "40px" }} />

        <p style={{ fontFamily: "var(--font-test-body)", fontSize: "14px", color: "#94a3b8", marginBottom: "80px" }}>
          Zuletzt aktualisiert: März 2026 · Lesedauer: ca. 5 Minuten
        </p>

      </div>
    </div>
  );
}
