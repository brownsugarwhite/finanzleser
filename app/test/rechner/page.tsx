import BruttoNettoRechner from "@/components/rechner/BruttoNettoRechner";

export default function TestRechnerPage() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginBottom: "40px", color: "var(--color-text-primary)" }}>
        Rechner Test
      </h1>
      <BruttoNettoRechner />
    </div>
  );
}
