import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Register custom service worker for background notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw-custom.js', { scope: '/' })
      console.log('[SW] Custom SW registered:', reg.scope)
    } catch (err) {
      console.error('[SW] Registration failed:', err)
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
