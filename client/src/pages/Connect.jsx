import { useState } from 'react'
import { api } from '../services/api'
import './Connect.css'

export default function Connect({ onConnected }) {
    const [storeDomain, setStoreDomain] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleConnect = async (e) => {
        e.preventDefault()
        if (!storeDomain.trim()) {
            setError('Please enter your Shopify store domain')
            return
        }

        setLoading(true)
        setError('')

        try {
            const data = await api.initiateAuth(storeDomain.trim())
            if (data.authUrl) {
                window.location.href = data.authUrl
            }
        } catch (err) {
            setError(err.message || 'Failed to connect. Check your store domain.')
            setLoading(false)
        }
    }

    return (
        <div className="connect-page">
            <div className="connect-hero animate-slide-up">
                <div className="connect-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <rect width="64" height="64" rx="16" fill="url(#icon-grad)" fillOpacity="0.15" />
                        <path d="M20 32L28 40L44 24" stroke="url(#icon-grad-stroke)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        <defs>
                            <linearGradient id="icon-grad" x1="0" y1="0" x2="64" y2="64">
                                <stop stopColor="#6366f1" />
                                <stop offset="1" stopColor="#a78bfa" />
                            </linearGradient>
                            <linearGradient id="icon-grad-stroke" x1="20" y1="24" x2="44" y2="40">
                                <stop stopColor="#6366f1" />
                                <stop offset="1" stopColor="#a78bfa" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <h1 className="connect-title">
                    Connect Your
                    <span className="connect-title-accent"> Shopify Store</span>
                </h1>
                <p className="connect-subtitle">
                    Link your store to start using AI-powered management.
                    Issue commands in natural language and let the AI handle the rest.
                </p>

                <form className="connect-form" onSubmit={handleConnect}>
                    <div className="connect-input-group">
                        <input
                            type="text"
                            className="input connect-input"
                            placeholder="your-store.myshopify.com"
                            value={storeDomain}
                            onChange={(e) => setStoreDomain(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg connect-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner"></div>
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    </svg>
                                    Connect Store
                                </>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="connect-error animate-fade-in">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {error}
                        </div>
                    )}
                </form>

                <div className="connect-features">
                    <div className="connect-feature">
                        <div className="connect-feature-icon">🤖</div>
                        <div>
                            <h3>AI-Powered</h3>
                            <p>Natural language commands to manage your store</p>
                        </div>
                    </div>
                    <div className="connect-feature">
                        <div className="connect-feature-icon">🔒</div>
                        <div>
                            <h3>Secure OAuth</h3>
                            <p>Your credentials never leave the server</p>
                        </div>
                    </div>
                    <div className="connect-feature">
                        <div className="connect-feature-icon">↩️</div>
                        <div>
                            <h3>Undo & Redo</h3>
                            <p>Every change is tracked and reversible</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
