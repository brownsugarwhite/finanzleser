import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function RechnerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-6">Finanzrechner</h1>
          <p className="text-lg text-gray-600 mb-12">
            Unsere Finanzrechner helfen Ihnen bei wichtigen finanziellen Entscheidungen.
          </p>
          <div className="text-gray-500">
            <p>Rechner werden hier angezeigt...</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
