"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useEmblaCarousel from "embla-carousel-react";
import type { ChecklisteData } from "./types";
import ChecklisteSlide from "./ChecklisteSlide";
import ChecklisteProgress from "./ChecklisteProgress";
import SliderNav from "@/components/ui/SliderNav";
import Button from "@/components/ui/Button";
import InfoHint from "@/components/ui/InfoHint";
import { useChecklisteLayout } from "./ChecklisteLayoutContext";

interface Props {
  data: ChecklisteData;
  pdfUrl: string;
  slug: string;
  checkboxPositions: { page: number; x: number; y: number }[];
}

export default function InteraktiveCheckliste({
  data,
  pdfUrl,
  slug,
  checkboxPositions,
}: Props) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [generating, setGenerating] = useState(false);
  const { actionsContainer } = useChecklisteLayout();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: false,
    containScroll: "trimSnaps",
  });

  const totalPunkte = data.sektionen.reduce(
    (sum, s) => sum + s.punkte.length,
    0
  );
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  const togglePunkt = useCallback((key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  const viewportRef = useRef<HTMLDivElement>(null);

  // Höhe des Viewports an den aktiven Slide anpassen
  const updateHeight = useCallback(() => {
    if (!emblaApi || !viewportRef.current) return;
    const slides = emblaApi.slideNodes();
    const index = emblaApi.selectedScrollSnap();
    const activeSlide = slides[index];
    if (activeSlide) {
      viewportRef.current.style.height = activeSlide.scrollHeight + "px";
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCurrentSlide(emblaApi.selectedScrollSnap());
      updateHeight();
    };
    emblaApi.on("select", onSelect);
    updateHeight(); // Initial
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, updateHeight]);

  // Generiere ausgefüllte PDF mit Häkchen in der Original-PDF
  const handleDownloadChecked = useCallback(async () => {
    setGenerating(true);
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");

      // Original-PDF über API-Route laden (vermeidet CORS)
      const response = await fetch(`/api/checkliste-pdf/${slug}`);
      const pdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Checked-Items als flache Liste (index-basiert)
      const checkedIndices: boolean[] = [];
      let idx = 0;
      for (let si = 0; si < data.sektionen.length; si++) {
        for (let pi = 0; pi < data.sektionen[si].punkte.length; pi++) {
          checkedIndices.push(!!checkedItems[`${si}-${pi}`]);
          idx++;
        }
      }

      // Häkchen in die Checkboxen zeichnen
      const pages = pdfDoc.getPages();
      const checkColor = rgb(0.27, 0.63, 0.09); // #45A117

      for (let i = 0; i < checkboxPositions.length && i < checkedIndices.length; i++) {
        if (!checkedIndices[i]) continue;

        const pos = checkboxPositions[i];
        const pageIdx = pos.page - 1;
        if (pageIdx >= pages.length) continue;

        const page = pages[pageIdx];

        // Häkchen als zwei Linien zeichnen (✓ Form)
        const cx = pos.x;
        const cy = pos.y;
        const lw = 2;
        // Kurzer Strich nach unten-links
        page.drawLine({
          start: { x: cx - 4, y: cy },
          end: { x: cx - 1, y: cy - 4 },
          thickness: lw,
          color: checkColor,
        });
        // Langer Strich nach oben-rechts
        page.drawLine({
          start: { x: cx - 1, y: cy - 4 },
          end: { x: cx + 5, y: cy + 4 },
          thickness: lw,
          color: checkColor,
        });
      }

      // Modified PDF speichern und herunterladen
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Checkliste_${data.titel}_ausgefuellt.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setGenerating(false);
    }
  }, [pdfUrl, checkedItems, data, checkboxPositions]);

  return (
    <div className="checkliste-container">
      {/* Titel + Progress – außerhalb des Sliders, fix */}
      <h3 className="checkliste-slide-titel">
        {currentSlide < data.sektionen.length
          ? data.sektionen[currentSlide]?.titel
          : "Checkliste abschließen"
        }
      </h3>
      <ChecklisteProgress checked={checkedCount} total={totalPunkte} />

      {/* Slider */}
      <div className="checkliste-viewport" ref={(node) => { emblaRef(node); viewportRef.current = node; }}>
        <div className="checkliste-slides">
          {data.sektionen.map((sektion, sektionIndex) => (
            <ChecklisteSlide
              key={sektionIndex}
              sektion={sektion}
              sektionIndex={sektionIndex}
              checkedItems={checkedItems}
              onToggle={togglePunkt}
            />
          ))}
          {/* Letzter Slide: Text → Visual → Download-Button */}
          <div className="checkliste-slide">
            <div className="checkliste-final-slide">
              <h3 className="checkliste-final-title">Ihre ausgefüllte Checkliste</h3>
              <p className="checkliste-final-text">
                {checkedCount > 0
                  ? `Sie haben ${checkedCount} von ${totalPunkte} Punkten abgehakt. Laden Sie Ihre persönliche Checkliste als PDF herunter.`
                  : `Haken Sie die erledigten Punkte ab und laden Sie anschließend Ihre persönliche Checkliste herunter.`
                }
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/general/checkliste_Visual_slide.png"
                alt=""
                className="checkliste-final-visual"
                style={{ width: "100%", maxWidth: 640, height: "auto", margin: "-12px auto 16px", display: "block" }}
              />
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  label={generating ? "Wird erstellt..." : "Herunterladen"}
                  onClick={handleDownloadChecked}
                  disabled={generating || checkedCount === 0}
                  icon="download"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SliderNav
        current={currentSlide}
        total={data.sektionen.length + 1}
        onPrev={scrollPrev}
        onNext={scrollNext}
        onGoTo={scrollTo}
        prevLabel="Vorherige Seite"
        nextLabel="Nächste Seite"
      />

      {/* Download-Button (leere PDF) – via Portal ins Visual */}
      {actionsContainer && createPortal(
        <div className="checkliste-actions">
          <Button
            label="Checkliste herunterladen"
            href={pdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            icon="download"
          />
        </div>,
        actionsContainer
      )}

      <InfoHint style={{ marginTop: 24 }}>
        Hinweis: Diese Checkliste ersetzt keine professionelle Beratung. Für komplexe Fragen empfehlen wir die Unterstützung durch einen Fachmann.
      </InfoHint>
    </div>
  );
}
