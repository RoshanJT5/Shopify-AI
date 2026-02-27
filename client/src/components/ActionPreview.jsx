import './ActionPreview.css'

const ACTION_ICONS = {
    create_product: '📦',
    update_product: '✏️',
    create_page: '📄',
    update_page: '📝',
    create_collection: '📁',
    adjust_price: '💰',
    generate_seo: '🔍',
}

const ACTION_LABELS = {
    create_product: 'Create Product',
    update_product: 'Update Product',
    create_page: 'Create Page',
    update_page: 'Update Page',
    create_collection: 'Create Collection',
    adjust_price: 'Adjust Price',
    generate_seo: 'Generate SEO',
}

export default function ActionPreview({ data, onConfirm, onCancel, loading }) {
    if (!data) return null

    const { actions, summary, valid, validationErrors, model, storeContext } = data

    return (
        <div className="action-preview animate-slide-up">
            {/* Summary */}
            <div className="card preview-summary">
                <div className="preview-summary-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Action Preview
                    </h3>
                    <span className="badge badge-info">{actions.length} action{actions.length !== 1 ? 's' : ''}</span>
                </div>

                <p className="preview-ai-summary">{summary}</p>

                <div className="preview-meta">
                    <span className="text-muted">Model: {model}</span>
                    <span className="text-muted">Store: {storeContext?.productCount || 0} products, {storeContext?.pageCount || 0} pages</span>
                </div>
            </div>

            {/* Validation Errors */}
            {validationErrors && validationErrors.length > 0 && (
                <div className="card preview-errors">
                    <h4 className="text-error" style={{ marginBottom: 'var(--space-2)' }}>
                        ⚠️ Validation Issues
                    </h4>
                    <ul>
                        {validationErrors.map((err, i) => (
                            <li key={i} className="text-error" style={{ fontSize: 'var(--fs-sm)' }}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action Cards */}
            <div className="preview-actions">
                {actions.map((action, index) => (
                    <div key={index} className="card preview-action-card animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                        <div className="preview-action-header">
                            <span className="preview-action-icon">{ACTION_ICONS[action.type] || '⚡'}</span>
                            <span className="preview-action-type">{ACTION_LABELS[action.type] || action.type}</span>
                        </div>
                        <div className="preview-action-details">
                            {Object.entries(action)
                                .filter(([key]) => key !== 'type')
                                .map(([key, value]) => (
                                    <div key={key} className="preview-action-field">
                                        <span className="preview-field-key">{key}:</span>
                                        <span className="preview-field-value">
                                            {typeof value === 'string' && value.length > 150
                                                ? value.substring(0, 150) + '...'
                                                : String(value)}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="preview-buttons">
                <button
                    className="btn btn-secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    className="btn btn-success btn-lg"
                    onClick={onConfirm}
                    disabled={loading || !valid || actions.length === 0}
                >
                    {loading ? (
                        <>
                            <div className="spinner"></div>
                            Applying...
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Confirm & Apply ({actions.length} action{actions.length !== 1 ? 's' : ''})
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
