"use client";

/** Knopf auf der Begriffskarte: Begriff in die Glossar-Sitzung rechts legen. */
import { useFaden } from "@/components/faden/FadenProvider";

export default function BegriffMerken({ slug }: { slug: string }) {
  const { begriffMerken, toast } = useFaden();
  return (
    <button type="button" className="chip chip--still" onClick={() => { begriffMerken(slug, true); toast("Rechts unter „Glossar · Aktuelle Sitzung“ gemerkt"); }}>
      ✦ In der Sitzung merken
    </button>
  );
}
