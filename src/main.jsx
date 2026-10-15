import { createRoot } from 'react-dom/client'
// Fonts are bundled locally (no Google Fonts request). Browsers only download a
// font file when a theme actually uses it.
import '@fontsource/caveat/latin-500.css'
import '@fontsource/caveat/latin-700.css'
import '@fontsource/patrick-hand/latin-400.css'
import '@fontsource/gaegu/latin-400.css'
import '@fontsource/gaegu/latin-700.css'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-700.css'
import '@fontsource/fraunces/latin-600.css'
import './styles/base.css'
import './styles/sections.css'
import './styles/studio.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
