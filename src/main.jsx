// Import data store FIRST to ensure globalThis.__B44_DB__ is initialized
import '@/lib/data-store'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)