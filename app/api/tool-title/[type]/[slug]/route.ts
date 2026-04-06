import { NextRequest, NextResponse } from "next/server";
import { getRechnerBySlug, getChecklisteBySlug } from "@/lib/wordpress";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  const { type, slug } = await params;

  if (type === "rechner") {
    const rechner = await getRechnerBySlug(slug);
    const excerpt = rechner?.rechnerFelder?.beschreibung || rechner?.excerpt || "";
    return NextResponse.json({ title: rechner?.title || "", excerpt });
  }

  if (type === "checkliste") {
    const checkliste = await getChecklisteBySlug(slug);
    return NextResponse.json({ title: checkliste?.title || "" });
  }

  return NextResponse.json({ title: "" });
}
