import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function VergleichePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-6">Finanzvergleiche</h1>
          <p className="text-lg text-gray-600 mb-12">
            Vergleichen Sie Angebote und treffen Sie die beste Entscheidung.
          </p>
          <div className="text-gray-500">
            <p>Vergleiche werden hier angezeigt...</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
