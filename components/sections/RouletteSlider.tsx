'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { initGSAP, ScrollTrigger } from '@/lib/gsapConfig'

interface Card {
  id: string
  label: string
  description: string
  href: string
  color: string
  icon: string // emoji or class name
}

const CARDS: Card[] = [
  {
    id: 'rechner',
    label: 'Rechner',
    description: 'Profitieren Sie von unseren tagesaktuellen Finanzrechnern. Berechnen Sie Zinsen, Steuern und mehr.',
    href: '/finanztools/rechner',
    color: '#ff8282',
    icon: '🧮',
  },
  {
    id: 'vergleiche',
    label: 'Vergleiche',
    description: 'Vergleichen Sie Angebote von Banken und Versicherern. Sparen Sie Zeit und Geld mit unseren Vergleichen.',
    href: '/finanztools/vergleiche',
    color: '#b29898',
    icon: '⚖️',
  },
  {
    id: 'checklisten',
    label: 'Checklisten',
    description: 'Nutzen Sie unsere praktischen Checklisten für Ihre Finanzplanung. Schritt für Schritt zum Ziel.',
    href: '/finanztools/checklisten',
    color: '#88ff82',
    icon: '✓',
  },
]

const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 20,
  mass: 0.9,
}

// Helper to get position styles based on offset
const getPositionStyle = (offset: 0 | 1 | 2) => {
  if (offset === 0) {
    // Active: full width, top
    return { width: '100%', left: '0%', top: 0 }
  } else if (offset === 1) {
    // Next: right side, 48% width
    return { width: '48%', left: '52%', top: 112 }
  } else {
    // Prev: left side, 48% width
    return { width: '48%', left: '0%', top: 112 }
  }
}

export default function RouletteSlider() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isRoulette, setIsRoulette] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const autoRotateTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize GSAP & ScrollTrigger
  useEffect(() => {
    initGSAP()

    if (!sentinelRef.current) return

    const trigger = ScrollTrigger.create({
      trigger: sentinelRef.current,
      start: 'top center',
      onEnter: () => setIsRoulette(true),
      onLeaveBack: () => setIsRoulette(false),
    })

    return () => trigger.kill()
  }, [])

  // Auto-rotation
  useEffect(() => {
    if (!isRoulette || isSpinning || isDragging) {
      if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current)
      return
    }

    autoRotateTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CARDS.length)
    }, 5000)

    return () => {
      if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current)
    }
  }, [isRoulette, isSpinning, isDragging])

  const handleCardOffset = (cardIndex: number) => {
    return (cardIndex - activeIndex + CARDS.length) % CARDS.length
  }

  const handleDragEnd = (
    e: MouseEvent | TouchEvent | PointerEvent,
    info: { velocity: { x: number }; offset: { x: number } }
  ) => {
    setIsDragging(false)

    const velocity = info.velocity.x
    const offset = info.offset.x

    if (Math.abs(velocity) > 600) {
      // Fast swipe → revolver effect
      setIsSpinning(true)
      const direction = velocity > 0 ? -1 : 1 // right swipe = prev, left swipe = next
      setActiveIndex((prev) => (prev + direction + CARDS.length) % CARDS.length)

      setTimeout(() => setIsSpinning(false), 400)
    } else if (Math.abs(offset) > 60) {
      // Slow drag → advance card
      const direction = offset > 0 ? -1 : 1
      setActiveIndex((prev) => (prev + direction + CARDS.length) % CARDS.length)
    }
    // else: snap back, no change
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Sentinel for scroll trigger */}
      <div ref={sentinelRef} className="absolute top-[100vh] left-0 w-full h-1" />

      {/* Sticky wrapper */}
      <div
        className={`${!isRoulette ? 'fixed bottom-0 left-0 right-0 z-40' : 'relative'}`}
        style={{
          transition: !isRoulette ? 'none' : 'position 0.3s ease-out',
        }}
      >
        <AnimatePresence mode="wait">
          {!isRoulette ? (
            // DOCKED STATE
            <DockedState key="docked" cards={CARDS} />
          ) : (
            // ROULETTE STATE
            <RouletteState
              key="roulette"
              cards={CARDS}
              activeIndex={activeIndex}
              isSpinning={isSpinning}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              handleCardOffset={handleCardOffset}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// DOCKED STATE COMPONENT
function DockedState({ cards }: { cards: Card[] }) {
  return (
    <motion.div
      key="docked-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full px-3 py-4 bg-gradient-to-t from-white to-white/95"
    >
      <div className="flex gap-1 justify-center items-center max-w-md mx-auto">
        {cards.map((card, idx) => (
          <motion.div key={card.id} layout layoutId={`card-${card.id}`}>
            <button
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-[27px] bg-[#d9d9d9] hover:bg-[#e5e5e5] transition-colors h-[104px] cursor-pointer active:scale-95"
              style={{ minWidth: '80px' }}
            >
              <div className="text-3xl">{card.icon}</div>
              <p className="text-xs font-medium text-black text-center leading-tight">{card.label}</p>
            </button>
          </motion.div>
        ))}

        {/* Sparks between cards */}
        <motion.div
          layout
          layoutId="spark-left"
          className="text-lg opacity-40 mx-1"
        >
          ✨
        </motion.div>
        <motion.div
          layout
          layoutId="spark-right"
          className="text-lg opacity-40 mx-1"
        >
          ✨
        </motion.div>
      </div>
    </motion.div>
  )
}

// ROULETTE STATE COMPONENT
function RouletteState({
  cards,
  activeIndex,
  isSpinning,
  onDragStart,
  onDragEnd,
  handleCardOffset,
}: {
  cards: Card[]
  activeIndex: number
  isSpinning: boolean
  onDragStart: () => void
  onDragEnd: (e: any, info: any) => void
  handleCardOffset: (idx: number) => number
}) {
  return (
    <motion.div
      key="roulette-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="relative w-full px-4 py-6 bg-white/50 backdrop-blur-sm"
    >
      {/* Drag overlay */}
      <motion.div
        drag="x"
        dragElastic={0.2}
        dragMomentum={true}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="relative w-full h-fit cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
      >
        {/* Cards container */}
        <div className="relative w-full h-fit max-w-lg mx-auto" style={{ minHeight: 320 }}>
          {cards.map((card, idx) => {
            const offset = handleCardOffset(idx) as 0 | 1 | 2
            const isActive = offset === 0
            const posStyle = getPositionStyle(offset)

            return (
              <motion.div
                key={card.id}
                layout
                layoutId={`card-${card.id}`}
                animate={{
                  height: isActive ? 200 : 104,
                  scale: isSpinning ? 0.4 : 1,
                }}
                transition={SPRING_CONFIG}
                className="absolute"
                style={{
                  ...posStyle,
                  overflow: 'hidden',
                  borderRadius: '27px',
                  zIndex: isActive ? 10 : 5,
                } as any}
              >
                <button
                  className="w-full h-full flex flex-col items-start justify-start gap-3 p-5 rounded-[27px] bg-[#d9d9d9] hover:bg-[#e5e5e5] transition-colors cursor-pointer relative"
                  style={{ backgroundColor: '#d9d9d9' }}
                >
                  {/* Icon */}
                  <div className="text-4xl flex-shrink-0">{card.icon}</div>

                  {/* Title */}
                  <h3 className={`font-heading font-bold text-black leading-tight ${isActive ? 'text-lg' : 'text-sm'}`}>
                    {card.label}
                  </h3>

                  {/* Description & CTA (only show in active) */}
                  {isActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                      <p className="text-xs text-[#636a5f] leading-snug line-clamp-3 mb-3">{card.description}</p>
                      <a
                        href={card.href}
                        className="inline-block px-4 py-2 bg-[#919191] text-white text-xs font-medium rounded-[17px] hover:bg-[#a5a5a5] transition-colors"
                      >
                        Zum Tool →
                      </a>
                    </motion.div>
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* Center spark (pivot) */}
        <motion.div
          layout
          layoutId="spark-center"
          className="absolute top-1/2 left-1/2 text-xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          animate={{ scale: isSpinning ? 0.4 : 1, opacity: 0.5 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          ✨
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
