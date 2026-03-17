export default function BeitragPage({ params }: { params: { kategorie: string; sub: string; slug: string } }) {
  return <main>Beitrag: {params.kategorie}/{params.sub}/{params.slug}</main>;
}
