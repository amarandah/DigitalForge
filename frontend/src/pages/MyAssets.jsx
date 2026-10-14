import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaDownload, FaUpload } from 'react-icons/fa';
import Spinner from '../components/Spinner';
import api from '../utils/api';
import './Dashboard.css'; // Importamos los estilos de Dashboard donde están los badges

function MyAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Estado para el idioma
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferred-language') || 'es';
  });
  
  // Traducciones
  const translations = useMemo(() => ({
    es: {
      loginRequired: 'Debes iniciar sesión para ver tus assets',
      errorLoading: 'Error al cargar tus assets',
      uploadAsset: 'Subir Asset',
      noAssets: 'No has subido ningún asset todavía.',
      uploadFirst: 'Subir tu primer asset',
      imageNotAvailable: 'Imagen no disponible',
      error: 'Error:',
      loading: 'Cargando...'
    },
    en: {
      loginRequired: 'You must be logged in to view your assets',
      errorLoading: 'Error loading your assets',
      uploadAsset: 'Upload Asset',
      noAssets: 'You haven\'t uploaded any assets yet.',
      uploadFirst: 'Upload your first asset',
      imageNotAvailable: 'Image not available',
      error: 'Error:',
      loading: 'Loading...'
    }
  }), []);
  
  // Efecto para detectar cambios de idioma
  useEffect(() => {
    // Función para manejar cambios desde el localStorage (para otras pestañas)
    const handleStorageChange = () => {
      const currentLang = localStorage.getItem('preferred-language') || 'es';
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    };
    
    // Función para manejar el evento personalizado (para la misma pestaña)
    const handleLanguageChange = (e) => {
      const newLang = e.detail.language;
      setLanguage(newLang);
    };
    
    // Escuchar cambios en localStorage (para otras pestañas)
    window.addEventListener('storage', handleStorageChange);
    
    // Escuchar el evento personalizado (para la misma pestaña)
    window.addEventListener('languageChange', handleLanguageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, [language]);

  useEffect(() => {
    // Redireccionar si no hay usuario autenticado
    if (!user) {
      navigate('/login');
      toast.error(translations[language].loginRequired);
      return;
    }

    const fetchMyAssets = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        
        const response = await api.get('/api/assets/my-assets', config);
        
        if (Array.isArray(response.data)) {
          setAssets(response.data);
        } else {
          setAssets(response.data.assets || []);
        }
      } catch (err) {
        console.error('Error al obtener mis assets:', err);
        setError(err.response?.data?.message || err.message);
        toast.error(translations[language].errorLoading);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMyAssets();
  }, [user, navigate, language, translations]);

  // Función para obtener una clase CSS válida de la categoría
  const getCategoryClass = (category) => {
    if (!category) return '';
    // Reemplazar espacios y convertir a minúsculas
    return category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  if (loading) return <Spinner />;
  if (error) return <div className="error-message">{translations[language].error} {error}</div>;

  return (
    <div className="dashboard">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        width: '100%', 
        marginBottom: '1.5rem'
      }}>
        
        {/* Botón Subir Asset en la esquina superior derecha */}
        <Link to="/upload-asset" className="btn" style={{ 
          marginLeft: 'auto',
          marginRight: '1.35em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaUpload /> {translations[language].uploadAsset}
        </Link>
      </div>
      
      {assets.length === 0 ? (
        <div className="no-assets" style={{ textAlign: 'center', margin: '3rem auto' }}>
          <p style={{ marginBottom: '1.5rem' }}>{translations[language].noAssets}</p>
          <Link to="/upload-asset" className="btn">
            <FaUpload /> {translations[language].uploadFirst}
          </Link>
        </div>
      ) : (
        <div className="asset-grid">
        {assets.map(asset => (
          <div key={asset._id} className="asset-card">
            <Link 
              to={`/assets/${asset._id}`}
              state={{ from: '/my-assets' }}
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
                      e.target.alt = translations[language].imageNotAvailable;
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

export default MyAssets;