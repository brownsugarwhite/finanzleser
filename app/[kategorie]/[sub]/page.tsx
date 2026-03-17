export default function SubkategoriePage({ params }: { params: { kategorie: string; sub: string } }) {
  return <main>Subkategorie: {params.kategorie}/{params.sub}</main>;
}
