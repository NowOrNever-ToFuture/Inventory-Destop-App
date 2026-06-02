import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastProvider } from './components/shared/ToastProvider'
import { AppDataProvider } from './components/shared/AppDataProvider'
import { AuthProvider } from './components/shared/AuthProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <AppDataProvider>
          <App />
        </AppDataProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>
)
