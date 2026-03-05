import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import LoginPage from './pages/LoginPage'
import AppPage   from './pages/AppPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app"   element={<AppPage />} />
        <Route path="*"      element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
