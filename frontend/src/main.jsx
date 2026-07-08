import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { VidyutProvider } from './VidyutContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VidyutProvider>
      <App />
    </VidyutProvider>
  </StrictMode>,
)
