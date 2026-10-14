import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import api from '../utils/api';
import { FaDownload,} from 'react-icons/fa';
import './UserAssets.css';

function UserAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAssets = async () => {
      try {
        setLoading(true);
        
        // Obtener datos del usuario
        const userResponse = await api.get(`/api/users/${userId}`);
        setUserData(userResponse.data);
        
        // Obtener assets del usuario
        const assetsResponse = await api.get(`/api/assets/user/${userId}`);
        
        if (Array.isArray(assetsResponse.data)) {
          setAssets(assetsResponse.data);
        } else {
          setAssets(assetsResponse.data.assets || []);
        }
      } catch (err) {
        console.error('Error al obtener assets del usuario:', err);
        setError(err.response?.data?.message || err.message);
        toast.error('Error al cargar los assets del usuario');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAssets();
  }, [userId]);

  // Función para obtener una clase CSS válida de la categoría
  const getCategoryClass = (category) => {
    if (!category) return '';
    // Reemplazar espacios y convertir a minúsculas
    return category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  if (loading) return <Spinner />;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="dashboard">
      <div className="back-button-container">
        <button 
          onClick={() => navigate(-1)} 
          className="btn back-button"
        >
          ← Volver
        </button>
      </div>
      
      {userData && (
        <div className="user-profile-card">
          {userData.profileImage ? (
            <img 
              src={userData.profileImage} 
              alt={userData.username}
              className="profile-avatar"
              onError={(e) => {
                e.target.src = '/digital.png';
                e.target.alt = 'Avatar no disponible';
              }}
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {userData.username.charAt(0).toUpperCase()}
            </div>
          )}
          <h2 className="profile-username">
            {userData.username}
          </h2>
          <p className="profile-stats">
            {assets.length} {assets.length === 1 ? 'asset publicado' : 'assets publicados'}
          </p>
        </div>
      )}
      
      {assets.length === 0 ? (
        <div className="no-assets-message">
          <p>Este usuario no ha publicado ningún asset todavía.</p>
        </div>
      ) : (
        <div className="asset-grid">
          {assets.map(asset => (
            <div key={asset._id} className="asset-card">
              <Link 
                to={`/assets/${asset._id}`}
                state={{ from: `/user/${userId}/assets` }}
                className="asset-link"
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
  );
}

export default UserAssets;