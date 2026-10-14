// src/pages/Category.jsx
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api';
import { FaDownload } from 'react-icons/fa';
import './Dashboard.css'; // Importar los estilos de Dashboard para los badges

export default function Category() {
  const { category } = useParams()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    api
      .get(`/api/assets?category=${encodeURIComponent(category)}`)
      .then(res => setAssets(Array.isArray(res.data) ? res.data : []))
      .catch(err => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false))
  }, [category])

  // Función para obtener una clase CSS válida de la categoría
  const getCategoryClass = (category) => {
    if (!category) return '';
    // Reemplazar espacios y convertir a minúsculas
    return category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  if (loading) return <p>Cargando categoría…</p>
  if (error) return <p className="text-red-500">Error: {error}</p>

  return (
    <div className="dashboard">
      {assets.length === 0 ? (
        <p>No hay assets en esta categoría.</p>
      ) : (
        <div className="asset-grid">
          {assets.map(asset => (
            <div key={asset._id} className="asset-card">
              <Link 
                to={`/assets/${asset._id}`} 
                state={{ from: `/category/${category}` }} 
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
                  <span className="asset-card__likes-count">{asset.likesCount || 0}</span>
                </div>
                <div className="asset-card__downloads">
                  <span className="asset-card__downloads-icon"><FaDownload /></span>
                  <span className="asset-card__downloads-count">{asset.downloadsCount || 
                    (asset.downloadedBy ? asset.downloadedBy.length : 0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}