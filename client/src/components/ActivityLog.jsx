import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './ActivityLog.css'

export default function ActivityLog({ refreshTrigger }) {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [undoing, setUndoing] = useState(null)

    const fetchHistory = async () => {
        try {
            setLoading(true)
            const data = await api.getHistory(20, 0)
            setEntries(data.entries || [])
        } catch (err) {
            console.error('Failed to fetch history:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [refreshTrigger])

    const handleUndo = async (id) => {
        try {
            setUndoing(id)
            await api.undoAction(id)
            fetchHistory()
        } catch (err) {
            console.error('Undo failed:', err)
        } finally {
            setUndoing(null)
        }
    }

    const handleRedo = async (id) => {
        try {
            setUndoing(id)
            await api.redoAction(id)
            fetchHistory()
        } catch (err) {
            console.error('Redo failed:', err)
        } finally {
            setUndoing(null)
        }
    }

    const formatTime = (ts) => {
        const d = new Date(ts)
        const now = new Date()
        const diff = now - d
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
        return d.toLocaleDateString()
    }

    return (
        <div className="activity-log card">
            <div className="activity-header">
                <h3>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Activity Log
                </h3>
                <button className="btn btn-icon" onClick={fetchHistory} title="Refresh">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                </button>
            </div>

            <div className="activity-list">
                {loading ? (
                    <div className="activity-empty">
                        <div className="spinner"></div>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="activity-empty">
                        <p className="text-muted">No activity yet</p>
                        <p className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>Execute a prompt to see actions here</p>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id} className="activity-item animate-fade-in">
                            <div className="activity-item-header">
                                <span className={`badge ${entry.status === 'executed' ? 'badge-success' : entry.status === 'undone' ? 'badge-warning' : 'badge-info'}`}>
                                    {entry.status}
                                </span>
                                <span className="activity-time">{formatTime(entry.timestamp)}</span>
                            </div>

                            <p className="activity-prompt">{entry.prompt}</p>
                            <p className="activity-summary text-muted">{entry.summary}</p>

                            <div className="activity-actions-count">
                                {entry.actions.length} action{entry.actions.length !== 1 ? 's' : ''}
                            </div>

                            <div className="activity-controls">
                                {entry.status === 'executed' && (
                                    <button
                                        className="btn btn-icon"
                                        onClick={() => handleUndo(entry.id)}
                                        disabled={undoing === entry.id}
                                        title="Undo"
                                    >
                                        {undoing === entry.id ? (
                                            <div className="spinner" style={{ width: 12, height: 12 }}></div>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="1 4 1 10 7 10" />
                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                                {entry.status === 'undone' && (
                                    <button
                                        className="btn btn-icon"
                                        onClick={() => handleRedo(entry.id)}
                                        disabled={undoing === entry.id}
                                        title="Redo"
                                    >
                                        {undoing === entry.id ? (
                                            <div className="spinner" style={{ width: 12, height: 12 }}></div>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="23 4 23 10 17 10" />
                                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
