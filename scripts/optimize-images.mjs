// One-off: crops + compresses the photos in images/ into small WebP files in
// src/assets/photos/ using the headless Chromium that Playwright already ships.
// Usage: node scripts/optimize-images.mjs
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

// crop boxes are in source pixels: [x, y, width, height]
const JOBS = [
  { out: 'neon-red', src: 'pexels-igor-sanches-42711317-11850741.jpg', crop: [0, 900, 2004, 1400], width: 1600 },
  { out: 'neon-teal', src: 'pexels-dreamcatchlight-29373551.jpg', crop: [0, 1500, 3631, 2300], width: 1200 },
  { out: 'too-late', src: 'pexels-mitya-parker-331487344-28510942.jpg', crop: [300, 1150, 2200, 1800], width: 1000 },
  { out: 'eclipse', src: 'pexels-connorscottmcmanus-14559247.jpg', crop: [0, 1500, 5152, 4500], width: 1200 },
  { out: 'balcony', src: 'pexels-iamirinaax-64831523-8331006.jpg', crop: [0, 2400, 4000, 3200], width: 1200 },
]

mkdirSync('src/assets/photos', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
for (const j of JOBS) {
  const dataUrl = `data:image/jpeg;base64,${readFileSync(`images/${j.src}`).toString('base64')}`
  const webp = await page.evaluate(async ({ dataUrl, crop, width }) => {
    const img = new Image()
    img.src = dataUrl
    await img.decode()
    const [x, y, w, h] = crop
    const c = document.createElement('canvas')
    c.width = width
    c.height = Math.round((h / w) * width)
    c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, c.width, c.height)
    return c.toDataURL('image/webp', 0.74)
  }, { dataUrl, crop: j.crop, width: j.width })
  const buf = Buffer.from(webp.split(',')[1], 'base64')
  writeFileSync(`src/assets/photos/${j.out}.webp`, buf)
  console.log(`${j.out}.webp  ${(buf.length / 1024).toFixed(0)} KB`)
}
await browser.close()
