import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { AuthProvider } from './App.jsx' // <-- Добавили AuthProvider
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* <-- Наша новая "обёртка" */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)