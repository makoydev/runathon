import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { applyTheme, loadThemePreference, initPrintThemeReset } from './utils/theme.ts'

// Apply the theme before the first paint to avoid a light-mode flash.
applyTheme(loadThemePreference())
initPrintThemeReset()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
