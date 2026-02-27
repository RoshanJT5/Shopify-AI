import './Navbar.css'

export default function Navbar({ connected, storeDomain, onDisconnect }) {
    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <div className="navbar-brand">
                    <div className="navbar-logo">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="7" fill="url(#logo-grad)" />
                            <path d="M8 14L12 18L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <defs>
                                <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
                                    <stop stopColor="#6366f1" />
                                    <stop offset="1" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="navbar-title">Shopify AI Agent</span>
                </div>

                <div className="navbar-right">
                    {connected && (
                        <>
                            <div className="navbar-store">
                                <span className="badge-dot badge-dot-success badge-dot-pulse"></span>
                                <span className="navbar-domain">{storeDomain}</span>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={onDisconnect}>
                                Disconnect
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
