import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './StoreStatus.css'

export default function StoreStatus({ storeDomain }) {
    const [stats, setStats] = useState({ products: 0, pages: 0, collections: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [prodData, pageData, collData] = await Promise.all([
                    api.getProducts().catch(() => ({ products: [] })),
                    api.getPages().catch(() => ({ pages: [] })),
                    api.getCollections().catch(() => ({ collections: [] })),
                ])
                setStats({
                    products: prodData.products?.length || 0,
                    pages: pageData.pages?.length || 0,
                    collections: collData.collections?.length || 0,
                })
            } catch (err) {
                console.error('Failed to fetch store stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [storeDomain])

    return (
        <div className="store-status">
            <div className="store-stat-card card">
                <div className="store-stat-icon">📦</div>
                <div>
                    <div className="store-stat-value">{loading ? '—' : stats.products}</div>
                    <div className="store-stat-label">Products</div>
                </div>
            </div>
            <div className="store-stat-card card">
                <div className="store-stat-icon">📄</div>
                <div>
                    <div className="store-stat-value">{loading ? '—' : stats.pages}</div>
                    <div className="store-stat-label">Pages</div>
                </div>
            </div>
            <div className="store-stat-card card">
                <div className="store-stat-icon">📁</div>
                <div>
                    <div className="store-stat-value">{loading ? '—' : stats.collections}</div>
                    <div className="store-stat-label">Collections</div>
                </div>
            </div>
        </div>
    )
}
