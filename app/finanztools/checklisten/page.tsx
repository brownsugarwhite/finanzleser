import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ChecklistenPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-6">Checklisten</h1>
          <p className="text-lg text-gray-600 mb-12">
            Unsere praktischen Checklisten unterstützen Sie bei wichtigen Aufgaben.
          </p>
          <div className="text-gray-500">
            <p>Checklisten werden hier angezeigt...</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
