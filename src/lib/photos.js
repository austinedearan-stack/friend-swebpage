// The announcement page photos (cropped + compressed from images/ by scripts/optimize-images.mjs).
import { useEffect, useState } from 'react'
import neonRed from '../assets/photos/neon-red.webp'
import neonTeal from '../assets/photos/neon-teal.webp'
import tooLate from '../assets/photos/too-late.webp'
import eclipse from '../assets/photos/eclipse.webp'
import balcony from '../assets/photos/balcony.webp'

export const PHOTOS = {
  'neon-red': { src: neonRed, label: 'red neon sign' },
  'neon-teal': { src: neonTeal, label: 'teal neon “SKY”' },
  'too-late': { src: tooLate, label: '“if you’re reading this”' },
  eclipse: { src: eclipse, label: 'maroon eclipse' },
  balcony: { src: balcony, label: 'balcony in the dark' },
}

/** Current time, refreshed every `ms` (for "2 min ago" labels and countdowns). */
export function useNow(ms) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}
