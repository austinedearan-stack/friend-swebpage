// Tiny hash router: #/friends, #/checkin/mood, #/announcements.
// Hash routes work on GitHub Pages with no server config. Other hashes the site
// already uses (#admin, #theme=…, Supabase login tokens) simply aren't routes.
import { useEffect, useState } from 'react'
import { PAGE_IDS } from './content.js'

export const STEPS = ['hello', 'mood', 'tomorrow', 'extras', 'game']
const ROUTE_RE = /^#\/([a-z-]*)(?:\/([a-z-]+))?/

export function parseHash(hash = window.location.hash) {
  const m = ROUTE_RE.exec(hash)
  if (!m) return { page: null, step: null }
  return { page: PAGE_IDS.includes(m[1]) ? m[1] : null, step: STEPS.includes(m[2]) ? m[2] : null }
}

export const routeHash = (page, step) => `#/${page}${step && step !== 'hello' ? `/${step}` : ''}`

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash())
  useEffect(() => {
    const on = () => setRoute(parseHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function navigate(page, step) {
  const h = routeHash(page, step)
  if (window.location.hash !== h) window.location.hash = h
}
