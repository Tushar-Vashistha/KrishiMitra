import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/i18n.js'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
