// src/pages/Search.jsx
import React, { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import api from '../utils/api';
import { FaDownload } from 'react-icons/fa';
import './Dashboard.css'; // Importamos los estilos de Dashboard donde están los badges

function useQuery() {
    return new URLSearchParams(useLocation().search)
}

export default function Search() {
    const query = useQuery().get('q') || ''
    const [assets, setAssets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetch() {
            try {
                setLoading(true)
                const { data } = await api.get(
                    `/api/assets?search=${encodeURIComponent(query)}`
                )
                setAssets(Array.isArray(data) ? data : data.assets || [])
            } catch (err) {
                setError(err.response?.data?.message || err.message)
            } finally {
                setLoading(false)
            }
        }
        if (query) fetch()
        else setLoading(false)
    }, [query])

    // Función para obtener una clase CSS válida de la categoría
    const getCategoryClass = (category) => {
        if (!category) return '';
        // Reemplazar espacios y convertir a minúsculas
        return category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    if (loading) return <p>Cargando resultados…</p>
    if (error) return <p className="text-red-500">Error: {error}</p>

    return (
        <div className="dashboard">
            {/* Cabecera idéntica al Dashboard */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '1rem'
            }}>
                <h2>Resultados para "{query}"</h2>
            </div>

            {assets.length === 0 ? (
                <p>No se han encontrado assets.</p>
            ) : (
                <div className="asset-grid">
                    {assets.map(asset => (
                        <div key={asset._id} className="asset-card">
                            <Link
                                to={`/assets/${asset._id}`}
                                state={{ from: `/search?q=${query}` }}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="image-container">
                                    {/* Añadir el badge de categoría con clase CSS válida */}
                                    {asset.category && (
                                        <div className={`category-badge category-${getCategoryClass(asset.category)}`}>
                                            {asset.category}
                                        </div>
                                    )}
                                    {asset.coverImage && (
                                        <img
                                            src={asset.coverImage}
                                            alt={asset.name}
                                            className="asset-card__thumb"
                                            onError={(e) => {
                                                console.error('Error loading image:', asset.coverImage);
                                                e.target.src = '/digital.png'; 
                                                e.target.alt = 'Imagen no disponible';
                                            }}
                                        />
                                    )}
                                </div>
                                <h2 className="asset-card__name">{asset.name}</h2>
                            </Link>

                            <div className="asset-card__footer">
                                <div className="asset-card__likes">
                                    <span className="asset-card__likes-icon">❤️</span>
                                    <span className="asset-card__likes-count">
                                        {asset.likesCount || 0}
                                    </span>
                                </div>
                                <div className="asset-card__downloads">
                                    <span className="asset-card__downloads-icon"><FaDownload /></span>
                                    <span className="asset-card__downloads-count">
                                        {asset.downloadsCount || 
                                          (asset.downloadedBy ? asset.downloadedBy.length : 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}