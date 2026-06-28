'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import SlideArticleCard, { CARD_MIN_WIDTH, CARD_MAX_WIDTH } from '@/components/ui/SlideArticleCard';
import SliderEdgeSpark from '@/components/ui/SliderEdgeSpark';
import SliderHoverBox from '@/components/ui/SliderHoverBox';
import DokumenteBookmark from '@/components/ui/DokumenteBookmark';
import { useSliderHoverBox } from '@/lib/hooks/useSliderHoverBox';
import { getArticleSliderPos, setArticleSliderPos, isBackNavigation } from '@/lib/landingState';
import type { Post } from '@/lib/types';

const ART_SLIDE_WIDTH = CARD_MIN_WIDTH;
const ART_GAP = 70;
// Breathing-Puffer für die fit-Prüfung (damit Slider nicht direkt bei
// 100% Content-Breite greift).
const ART_FIT_BUFFER = 40;
// Progressive Mount: bei vielen Posts (50+) blockiert ein Full-Mount aller
// SlideArticleCards den Frame nach Category-Switch (Stutter). Stattdessen
// erst N sichtbare Cards mounten, Rest in Batches via requestIdleCallback.
const INITIAL_MOUNT_COUNT = 8;
const MOUNT_BATCH_SIZE = 6;
// Höhe muss zur tatsächlichen Card-Höhe passen, sonst springt der via
// ResizeObserver gemessene articleHeight-Spacer beim Nachmounten.
const PLACEHOLDER_HEIGHT = 340;

interface ArticleSliderProps {
  posts: Post[];
  onNavReady: (nav: { current: number; total: number; onPrev: () => void; onNext: () => void; onGoTo: (i: number) => void }) => void;
  onCanScrollChange?: (canScroll: boolean) => void;
  phase1Visible?: boolean;
  phase2Visible?: boolean;
  categoryTransition?: 'idle' | 'out' | 'in';
  /** Key (category slug) zum Merken/Wiederherstellen der Embla-Scroll-Position bei Zurück. */
  persistKey?: string;
}

const SPARK_DURATION = 0.3;

export default function ArticleSlider({ posts, onNavReady, onCanScrollChange, phase1Visible = true, phase2Visible = true, categoryTransition = 'idle', persistKey }: ArticleSliderProps) {
  // Mount-flip: beim ersten Mount rendert die Komponente mit mounted=false, sodass
  // das Visual bei scale(0) startet. Ein rAF flippt auf true → CSS-Transition zu
  // scale(1) läuft parallel zur Spacer-Höhe-Animation. Sonst würde das Visual auf
  // dem ersten Frame bereits bei scale(1) stehen und beim Öffnen "springen".
  // Bei Zurück (Back-Restore) sofort mounted=true → Card-Visuals stehen direkt bei
  // scale(1) (kein Scale-in-Pop, Morph landet auf stabiler Card). Sonst scale(0)→1.
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined' && isBackNavigation());
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Progressive Mount: erste N Cards sofort, Rest in Batches per Idle-Callback.
  // Reduziert den initial-Mount-Cost beim Category-Switch dramatisch (50 Cards
  // gleichzeitig mounten = sichtbarer Stutter; 8 + Batches = unsichtbar).
  const [mountedCount, setMountedCount] = useState(() =>
    Math.min(INITIAL_MOUNT_COUNT, posts.length)
  );
  useEffect(() => {
    if (mountedCount >= posts.length) return;
    // Ein Frame zwischen Batches — Browser kann painten, aber alles ist
    // nach wenigen Frames durch. Click-Frame bleibt unblockiert (das ist
    // der eigentliche Stutter-Fix); Staggering selbst ist unsichtbar weil
    // off-screen.
    const raf = requestAnimationFrame(() => {
      setMountedCount((c) => Math.min(c + MOUNT_BATCH_SIZE, posts.length));
    });
    return () => cancelAnimationFrame(raf);
  }, [mountedCount, posts.length]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  // Hover-Kasten nur auf Desktop (echtes Hover) — Mobile-Tap bleibt Navigation.
  // Außerdem erst NACH dem Eintritts-Morph: solange der Slider noch reinmorpht
  // (phase2 noch nicht da oder Category-Transition läuft), ist die Card-Höhe nicht
  // final → der Kasten würde sie falsch erfassen. hoverReady greift erst, wenn
  // alles steht (Phase 2 sichtbar, idle) + kurzer Settle-Puffer.
  const [hoverReady, setHoverReady] = useState(false);
  useEffect(() => {
    if (!mounted || !phase2Visible || categoryTransition !== 'idle') {
      setHoverReady(false);
      return;
    }
    const t = setTimeout(() => setHoverReady(true), 350);
    return () => clearTimeout(t);
  }, [mounted, phase2Visible, categoryTransition]);
  const hoverEnabled = !isMobile && hoverReady;
  // Beim Hover wird die Card (und ihre flankierenden Deko-Sparks/Linien) auf
  // volle Opacity/Scale gezogen — auch wenn sie in der Edge-Fade-Zone liegt —
  // damit der Kasten immer an einer voll sichtbaren Card sauber andockt.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoverBox = useSliderHoverBox({
    cardSelector: '.slide-article-card',
    enabled: hoverEnabled,
    // Card/Deko erst zurück-faden, wenn der Kasten fertig zurückgefahren ist.
    onBoxClosed: (i) => setHoveredIndex((h) => (h === i ? null : h)),
  });

  const effectivePhase1 = mounted && phase1Visible;
  // Sparks + Linien: Timing an Phase 2 gekoppelt (Button-Breite ändert sich).
  // Card-Visuals bleiben weiter an Phase 1.
  const effectivePhase2 = mounted && phase2Visible;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slideStyles, setSlideStyles] = useState<{ opacity: number; scale: number; origin: 'left' | 'right' | 'center' }[]>([]);

  // Bei Zurück die zuvor gescrollte Position wiederherstellen. Embla-EIGENEN Snap-Index
  // (selectedScrollSnap) persistieren — round-trippt korrekt (inkl. Leading-Spacer),
  // anders als ein manuell aus scrollProgress gerundeter Index (führte zu Off-by-one →
  // Ziel-Card außerhalb Viewport → kein Morph). Ziel EINMAL beim Render erfassen.
  const restoreIndexRef = useRef<number>(
    typeof window !== 'undefined' && isBackNavigation() && persistKey ? getArticleSliderPos(persistKey) : 0
  );
  // Back-Restore: Card-Breite (flex-grow) OHNE Transition → sofort final, damit der
  // Rückwärts-Morph beim Messen die korrekte (breite) Größe erfasst statt MIN→MAX zu
  // animieren. Einmal beim Mount erfasst.
  const isBackRestoreRef = useRef(typeof window !== 'undefined' && isBackNavigation());
  // Aktuelle Embla-Snap-Position merken (für die nächste Zurück-Navigation).
  useEffect(() => {
    if (!emblaApi || !persistKey) return;
    const save = () => setArticleSliderPos(persistKey, emblaApi.selectedScrollSnap());
    emblaApi.on('select', save);
    emblaApi.on('settle', save);
    save();
    return () => { emblaApi.off('select', save); emblaApi.off('settle', save); };
  }, [emblaApi, persistKey]);
  // Wiederherstellen SYNCHRON vor Paint (useLayoutEffect) — damit die Card schon an
  // der richtigen Position steht, BEVOR der Morph-Poll (rAF, nach Paint) misst (sonst
  // misst er die Scroll-0-Position). Zusätzlich nach jedem reInit (Fit-Check) erneut
  // anwenden, da reInit die Position zurücksetzen kann.
  useLayoutEffect(() => {
    if (!emblaApi || restoreIndexRef.current <= 0) return;
    const apply = () => emblaApi.scrollTo(restoreIndexRef.current, true);
    apply();
    emblaApi.on('reInit', apply);
    const t = setTimeout(() => emblaApi.off('reInit', apply), 400);
    return () => { clearTimeout(t); emblaApi.off('reInit', apply); };
  }, [emblaApi]);

  // Wenn alle Cards (bei Minimum-Breite) in den Viewport passen, Slider
  // deaktivieren. Cards werden dann zentriert und wachsen bis CARD_MAX_WIDTH,
  // um die Breite auszunutzen.
  const [canScroll, setCanScroll] = useState(true);
  // useLayoutEffect: Card-Breite (fit → MIN/MAX) muss VOR dem Paint final stehen,
  // damit der Rückwärts-Morph beim Messen die korrekte Breite erfasst (sonst misst
  // er MIN und springt auf MAX).
  useLayoutEffect(() => {
    if (!emblaApi) return;
    const check = () => {
      // Static (kein Slider), sobald die letzte Card noch >40px Abstand zum
      // rechten Rand hat. Maßgeblich ist NUR: Leading-Spacer (5vw) + Leading-Gap
      // + interne Gaps (= n Gaps) + Cards. Der Trailing-Spacer/Gap zählt NICHT
      // mit (wird im Static-Mode ausgeblendet, sonst würde er Overflow erzwingen).
      const spacerBasis = window.innerWidth * 0.05;
      const cards = posts.length * CARD_MIN_WIDTH;
      const gaps = posts.length * ART_GAP;
      const needed = spacerBasis + cards + gaps + ART_FIT_BUFFER;
      const fits = window.innerWidth >= needed;
      setCanScroll(!fits);
      emblaApi.reInit({ watchDrag: !fits });
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [emblaApi, posts.length]);

  useEffect(() => {
    onCanScrollChange?.(canScroll);
  }, [canScroll, onCanScrollChange]);

  // Ref-Spiegel der slideStyles für Change-Detection (siehe SubcategorySlider).
  const slideStylesRef = useRef<typeof slideStyles>([]);
  useEffect(() => {
    if (!emblaApi) return;

    const slideCount = posts.length;
    // Linke Fade-Zone bewusst flach: die erste Card (im Ruhezustand bei
    // ~5vw + Gap + halbe Cardbreite ≈ 245-265px vom Rand) soll NICHT skaliert/
    // gefaded sein. Erst wenn sie beim Scrollen weiter nach links wandert, fadet sie.
    const FADE_LEFT = 245;
    // Mobile: kürzere Right-Fade-Zone — auf Desktop bleibt 320 erhalten.
    const FADE_RIGHT = isMobile ? 200 : 320;
    // Overshoot: Fade-Strecke reicht FADE_OVERSHOOT Pixel über den Viewport-
    // Rand hinaus. Innere Grenze (voll sichtbar / Beginn Ausfaden) bleibt bei
    // FADE_LEFT/RIGHT; am Bildschirmrand ist die Card dadurch noch minimal
    // sichtbar statt komplett weg.
    const FADE_OVERSHOOT = isMobile ? 50 : 80;

    const update = () => {
      const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
      const idx = Math.round(progress * (slideCount - 1));
      const newIdx = Math.max(0, Math.min(slideCount - 1, idx));
      setSelectedIndex(newIdx);

      const rootNode = emblaApi.rootNode();
      const rootRect = rootNode.getBoundingClientRect();
      const slideNodes = emblaApi.slideNodes();

      let changed = false;
      const styles = slideNodes.map((node, i) => {
        const rect = node.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const distFromLeft = slideCenter - rootRect.left;
        const distFromRight = rootRect.right - slideCenter;

        let s: { opacity: number; scale: number; origin: 'left' | 'right' | 'center' };
        if (!isMobile && distFromLeft < FADE_LEFT) {
          const t = Math.max(0, Math.min(1, (distFromLeft + FADE_OVERSHOOT) / (FADE_LEFT + FADE_OVERSHOOT)));
          const eased = t * (2 - t);
          s = { opacity: eased, scale: 0.6 + 0.4 * eased, origin: 'right' };
        } else if (distFromRight < FADE_RIGHT) {
          const t = Math.max(0, Math.min(1, (distFromRight + FADE_OVERSHOOT) / (FADE_RIGHT + FADE_OVERSHOOT)));
          const eased = t * (2 - t);
          s = { opacity: eased, scale: 0.6 + 0.4 * eased, origin: 'left' };
        } else {
          s = { opacity: 1, scale: 1, origin: 'center' };
        }

        // Change-Detection mit kleinen Toleranzen: bei dragFree-Slidern feuert
        // Embla 50-100× pro Sekunde "scroll", aber meistens ändert sich der
        // visuelle Style der einzelnen Cards minimal. Ohne diesen Check würde
        // setSlideStyles bei jedem Tick eine neue Array-Referenz setzen → React
        // re-rendert die ArticleSlider mit allen Cards. Auf Mobile mit vielen
        // Cards = Hauptthread-Backlog → wachsendes Tap-Delay.
        const prev = slideStylesRef.current[i];
        if (!prev || Math.abs(prev.opacity - s.opacity) > 0.01 || Math.abs(prev.scale - s.scale) > 0.005 || prev.origin !== s.origin) {
          changed = true;
        }
        return s;
      });

      if (changed) {
        slideStylesRef.current = styles;
        setSlideStyles(styles);
      }
    };

    emblaApi.on('scroll', update);
    update();

    return () => { emblaApi.off('scroll', update); };
  }, [emblaApi, posts.length, isMobile]);

  // Push nav state up to parent
  useEffect(() => {
    if (!emblaApi) return;
    onNavReady({
      current: selectedIndex,
      total: posts.length,
      onPrev: () => emblaApi.scrollPrev(),
      onNext: () => emblaApi.scrollNext(),
      onGoTo: (i) => emblaApi.scrollTo(i),
    });
  }, [emblaApi, selectedIndex, posts.length, onNavReady]);

  return (
    <>
    <div ref={emblaRef} onMouseLeave={hoverEnabled ? hoverBox.leaveRegion : undefined} style={{ cursor: canScroll ? 'grab' : 'default', marginTop: 30, position: 'relative' }}>
      <div style={{
        display: 'flex',
        gap: `${ART_GAP}px`,
        // Mobile: ~20px Abstand zum linken Rand (Leading-Spacer mobil display:none).
        paddingLeft: isMobile ? 20 : 0,
      }}>
        <div
          aria-hidden
          style={{
            // Beide Spacer fix auf 5vw. Cards absorbieren den Rest über ihre
            // eigene flex-grow bis max 450 — symmetrisch und minimal.
            // Mobile: Leading-Spacer komplett raus (display:none) — flexBasis:0
            // allein ließe den Container-gap VOR der ersten Card stehen.
            display: isMobile ? 'none' : 'block',
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: isMobile ? 0 : '5vw',
            minWidth: 0,
          }}
        />
        {posts.map((post, index) => {
          const isLast = index === posts.length - 1;
          const isMountedCard = index < mountedCount;
          // Gehoverte Card + angrenzende Deko auf voll ziehen (NICHT ausblenden):
          // die echten 70px-Linien + der echte (rotierende) Spark bleiben sichtbar,
          // der Klon zeichnet nur die Verlängerungen + Horizontalen.
          const cardFull = hoverEnabled && hoveredIndex === index;
          const decoFull = hoverEnabled && (hoveredIndex === index || hoveredIndex === index + 1);
          const cardOpacity = cardFull ? 1 : (slideStyles[index + 1]?.opacity ?? 1);
          const cardScale = cardFull ? 1 : (slideStyles[index + 1]?.scale ?? 1);
          const decoScale = decoFull ? 1 : Math.min(slideStyles[index + 1]?.scale ?? 1, slideStyles[index + 2]?.scale ?? 1);
          const decoOpacity = decoFull ? 1 : Math.min(slideStyles[index + 1]?.opacity ?? 1, slideStyles[index + 2]?.opacity ?? 1);
          // Card-Skalierung beim Hover langsam (synchron zum Kasten); Edge-Fade
          // aller anderen Cards beim Scroll bleibt kurz.
          const cardSlow = cardFull && categoryTransition === 'idle';
          return (
            <div
              key={post.id}
              ref={(el) => hoverBox.registerCard(index, el)}
              onMouseEnter={hoverEnabled ? () => { setHoveredIndex(index); hoverBox.onEnter(index); } : undefined}
              onMouseLeave={hoverEnabled ? () => hoverBox.onLeave(index) : undefined}
              style={{
                // Alle Cards gleiche feste Breite (kein Wachsen bei freiem Platz).
                flexGrow: 0,
                flexShrink: 0,
                flexBasis: `${ART_SLIDE_WIDTH}px`,
                maxWidth: CARD_MAX_WIDTH,
                minWidth: 0,
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                opacity: cardOpacity,
                // Mobile: keine CSS-Transition für opacity — Embla feuert
                // Scroll-Events pro Frame; eine 0.1s-Transition würde bei
                // jedem Update einen neuen Tween gegen ein bewegtes Ziel
                // starten → sichtbares Wiggle/Größen-Springen auf iPhone.
                // (Gleiche Logik wie im SubcategorySlider.)
                transition: isBackRestoreRef.current
                  ? 'opacity 0.1s ease' // Back-Restore: flex-grow instant (keine Breiten-Animation)
                  : categoryTransition === 'in'
                  ? 'opacity 0.1s ease'
                  : isMobile
                  ? 'flex-grow 0.3s ease'
                  : `flex-grow 0.3s ease, opacity ${cardSlow ? '0.5s cubic-bezier(0.25,0.46,0.45,0.94)' : '0.1s ease'}`,
              }}
            >
              {isMountedCard ? (
                <div style={{
                  width: '100%',
                  transform: `scale(${cardScale})`,
                  transformOrigin:
                    slideStyles[index + 1]?.origin === 'right' ? 'right center' :
                    slideStyles[index + 1]?.origin === 'left' ? 'left center' :
                    'center center',
                  transition: categoryTransition === 'in' || isMobile ? 'none' : `transform ${cardSlow ? '0.5s cubic-bezier(0.25,0.46,0.45,0.94)' : '0.1s ease'}`,
                }}>
                  <SlideArticleCard post={post} index={index} phase1Visible={effectivePhase1} phase2Visible={effectivePhase2} categoryTransition={categoryTransition} />
                </div>
              ) : (
                // Placeholder bewahrt Slide-Höhe bis die Card via Idle-Callback
                // nachgemountet wird. Höhe muss zur tatsächlichen Card-Höhe
                // passen, sonst springt der ResizeObserver-gemessene
                // articleHeight-Spacer beim Nachmounten.
                <div aria-hidden style={{ width: '100%', height: PLACEHOLDER_HEIGHT, flexShrink: 0 }} />
              )}

              {!isLast && isMountedCard && (
                <SliderEdgeSpark
                  sparkRef={(el) => hoverBox.registerSpark(index, el)}
                  wrapperStyle={{
                    position: 'absolute',
                    right: -ART_GAP / 2 - 6,
                    top: '50%',
                    transform: `translateY(-50%) scale(${decoScale})`,
                    transformOrigin: 'center center',
                    opacity: decoOpacity,
                    transition: isMobile ? 'none' : `opacity ${hoverEnabled && categoryTransition === 'idle' ? '0.2s' : '0.1s'} ease, transform 0.1s ease`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    pointerEvents: 'none',
                  }}
                  topLineStyle={{
                    width: 1,
                    height: effectivePhase2 ? 70 : 0,
                    background: 'var(--fill-0, #334A27)',
                    transformOrigin: 'center bottom',
                    transform: categoryTransition === 'out' ? 'scaleY(0)' : 'scaleY(1)',
                    transition: categoryTransition === 'out'
                      ? 'transform 0.2s ease-in'
                      : categoryTransition === 'in'
                      ? 'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      : `height ${SPARK_DURATION}s ease`,
                  }}
                  sparkStyle={{
                    transform: categoryTransition === 'out'
                      ? 'scale(0) rotate(90deg)'
                      : (categoryTransition === 'in' && !effectivePhase2)
                      ? 'scale(0) rotate(-90deg)'
                      : effectivePhase2 ? 'scale(1)' : 'scale(0)',
                    transformOrigin: 'center',
                    transition: categoryTransition === 'out'
                      ? 'transform 0.2s ease-in'
                      : categoryTransition === 'in'
                      ? 'transform 0.2s ease-out'
                      : `transform ${SPARK_DURATION}s ease`,
                  }}
                  bottomLineStyle={{
                    width: 1,
                    height: effectivePhase2 ? 70 : 0,
                    background: 'var(--fill-0, #334A27)',
                    transformOrigin: 'center top',
                    transform: categoryTransition === 'out' ? 'scaleY(0)' : 'scaleY(1)',
                    transition: categoryTransition === 'out'
                      ? 'transform 0.2s ease-in'
                      : categoryTransition === 'in'
                      ? 'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      : `height ${SPARK_DURATION}s ease`,
                  }}
                />
              )}

              {hoverEnabled && isMountedCard && (
                <SliderHoverBox index={index} gap={ART_GAP} register={hoverBox.registerBox} />
              )}

              {/* Dokumente-Lesezeichen oben links — erscheint NACH dem Zeichnen
                  des Kastens (Delay), einfacher Fade. Position an der Box-Ecke
                  (top/marginLeft sind Feinjustage-Werte). */}
              {hoverEnabled && isMountedCard && post.tools?.includes('dokumente') && (
                <div style={{
                  position: 'absolute',
                  top: -(ART_GAP / 2 - 20) + 12,
                  left: -ART_GAP / 2,
                  marginLeft: -0.5,
                  zIndex: 6,
                  pointerEvents: 'none',
                  opacity: hoveredIndex === index ? 1 : 0,
                  transition: hoveredIndex === index
                    ? 'opacity 0.25s ease 0.5s'
                    : 'opacity 0.12s ease',
                }}>
                  <DokumenteBookmark />
                </div>
              )}
            </div>
          );
        })}
        <div
          aria-hidden
          style={{
            // Im Slider-Mode: fixer 5vw-Puffer rechts. Im Static-Mode (passt
            // komplett) komplett raus (display:none entfernt auch den 70px-Gap
            // davor) — sonst würde 5vw+Gap den geforderten 40px-Rand sprengen
            // und die letzte Card abschneiden.
            display: canScroll ? 'block' : 'none',
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: '5vw',
            minWidth: 0,
          }}
        />
      </div>
    </div>
    </>
  );
}
