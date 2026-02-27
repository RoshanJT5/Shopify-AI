import { useState } from 'react'
import './PromptInput.css'

export default function PromptInput({ onSubmit, loading }) {
    const [prompt, setPrompt] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (prompt.trim() && !loading) {
            onSubmit(prompt.trim())
        }
    }

    const suggestions = [
        'Create a product called "Summer Collection Tee" priced at $29.99',
        'Improve all product descriptions for a luxury tone',
        'Increase all product prices by 10%',
        'Create an About Us page for my brand',
        'Generate SEO metadata for all products',
    ]

    return (
        <div className="prompt-section card card-accent">
            <div className="prompt-header">
                <h2 className="prompt-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    AI Command Center
                </h2>
                <span className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                    Describe what you want to do with your store
                </span>
            </div>

            <form onSubmit={handleSubmit}>
                <textarea
                    className="textarea prompt-textarea"
                    placeholder="e.g., Create 3 new summer products with descriptions and prices..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={loading}
                    rows={4}
                />

                <div className="prompt-footer">
                    <div className="prompt-suggestions">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                type="button"
                                className="prompt-suggestion"
                                onClick={() => setPrompt(s)}
                                disabled={loading}
                            >
                                {s.length > 45 ? s.substring(0, 45) + '...' : s}
                            </button>
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg prompt-submit"
                        disabled={loading || !prompt.trim()}
                    >
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                                Execute
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
