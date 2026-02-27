import { useState, useEffect } from 'react'
import { api } from './services/api'
import Connect from './pages/Connect'
import Dashboard from './pages/Dashboard'
import Navbar from './components/Navbar'
import './index.css'

function App() {
  const [authStatus, setAuthStatus] = useState({
    connected: false,
    storeDomain: null,
    loading: true,
  })

  const checkAuth = async () => {
    try {
      const status = await api.getAuthStatus()
      setAuthStatus({ ...status, loading: false })
    } catch {
      setAuthStatus({ connected: false, storeDomain: null, loading: false })
    }
  }

  useEffect(() => {
    checkAuth()

    // Check if returning from OAuth callback
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') {
      window.history.replaceState({}, '', '/')
      checkAuth()
    }
  }, [])

  const handleDisconnect = async () => {
    try {
      await api.disconnect()
      setAuthStatus({ connected: false, storeDomain: null, loading: false })
    } catch (err) {
      console.error('Disconnect failed:', err)
    }
  }

  if (authStatus.loading) {
    return (
      <div className="app-layout">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}>
          <div className="spinner spinner-lg"></div>
          <p className="text-muted">Loading Shopify AI Agent...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Navbar
        connected={authStatus.connected}
        storeDomain={authStatus.storeDomain}
        onDisconnect={handleDisconnect}
      />
      <main className="main-content">
        {authStatus.connected ? (
          <Dashboard storeDomain={authStatus.storeDomain} />
        ) : (
          <Connect onConnected={checkAuth} />
        )}
      </main>
    </div>
  )
}

export default App
