import { useState } from 'react'
import { api } from '../services/api'
import PromptInput from '../components/PromptInput'
import ActionPreview from '../components/ActionPreview'
import ActivityLog from '../components/ActivityLog'
import StoreStatus from '../components/StoreStatus'
import './Dashboard.css'

export default function Dashboard({ storeDomain }) {
    const [loading, setLoading] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [previewData, setPreviewData] = useState(null)
    const [currentPrompt, setCurrentPrompt] = useState('')
    const [lastResult, setLastResult] = useState(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handlePromptSubmit = async (prompt) => {
        try {
            setLoading(true)
            setPreviewData(null)
            setLastResult(null)
            setCurrentPrompt(prompt)

            const data = await api.executePrompt(prompt)
            setPreviewData(data)
        } catch (err) {
            setLastResult({
                success: false,
                message: err.message || 'Failed to generate actions',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!previewData?.actions) return

        try {
            setConfirming(true)
            const result = await api.confirmActions(currentPrompt, previewData.actions)
            setLastResult({
                success: true,
                message: `Successfully executed ${result.successCount} action${result.successCount !== 1 ? 's' : ''}${result.failureCount > 0 ? ` (${result.failureCount} failed)` : ''}`,
                details: result,
            })
            setPreviewData(null)
            setRefreshTrigger(prev => prev + 1)
        } catch (err) {
            setLastResult({
                success: false,
                message: err.message || 'Failed to execute actions',
            })
        } finally {
            setConfirming(false)
        }
    }

    const handleCancel = () => {
        setPreviewData(null)
        setLastResult(null)
    }

    return (
        <div>
            <StoreStatus storeDomain={storeDomain} />

            <div className="grid-dashboard">
                <div className="dashboard-main">
                    <PromptInput onSubmit={handlePromptSubmit} loading={loading} />

                    {/* Result Banner */}
                    {lastResult && (
                        <div className={`result-banner card animate-slide-up ${lastResult.success ? 'result-success' : 'result-error'}`}>
                            <div className="result-icon">
                                {lastResult.success ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <p className="result-message">{lastResult.message}</p>
                            </div>
                            <button
                                className="btn btn-icon"
                                onClick={() => setLastResult(null)}
                                style={{ marginLeft: 'auto' }}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Action Preview */}
                    <ActionPreview
                        data={previewData}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                        loading={confirming}
                    />
                </div>

                <aside className="dashboard-sidebar">
                    <ActivityLog refreshTrigger={refreshTrigger} />
                </aside>
            </div>
        </div>
    )
}
