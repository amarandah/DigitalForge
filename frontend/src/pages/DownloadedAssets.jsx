import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import api from '../utils/api';
import './DownloadedAssets.css';
import { FaDownload, FaHeart } from 'react-icons/fa';

function DownloadedAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Estado para el idioma
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferred-language') || 'es';
  });
  
  // Objeto con traducciones usando useMemo para evitar recreación en cada render
  const translations = useMemo(() => ({
    es: {
      loginRequired: 'Debes iniciar sesión para ver tus assets descargados',
      loadError: 'Error al cargar los assets descargados',
      noAssets: 'No has descargado ningún asset.',
      pageTitle: 'Aquí tienes los assets que te has descargado',
      imageNotAvailable: 'Imagen no disponible'
    },
    en: {
      loginRequired: 'You must log in to view your downloaded assets',
      loadError: 'Error loading downloaded assets',
      noAssets: 'You have not downloaded any assets.',
      pageTitle: 'Here are the assets you have downloaded',
      imageNotAvailable: 'Image not available'
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
    if (!user) {
      navigate('/login');
      toast.error(translations[language].loginRequired);
      return;
    }

    const fetchDownloadedAssets = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const response = await api.get('/api/assets/downloaded-assets', config);

        // ✅ Verificar que response.data sea un array antes de setear
        if (Array.isArray(response.data)) {
          setAssets(response.data);
        } else {
          console.warn('⚠️ Respuesta inesperada de la API:', response.data);
          setAssets([]);
        }
      } catch (err) {
        console.error('Error al obtener los assets descargados:', err);
        setError(err.response?.data?.message || err.message);
        toast.error(translations[language].loadError);
        setAssets([]); // protección adicional
      } finally {
        setLoading(false);
      }
    };

    fetchDownloadedAssets();
  }, [user, navigate, translations, language]);

  // Función para obtener una clase CSS válida de la categoría
  const getCategoryClass = (category) => {
    if (!category) return '';
    // Reemplazar espacios y convertir a minúsculas
    return category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!Array.isArray(assets) || assets.length === 0) return <p>{translations[language].noAssets}</p>;

  return (
    <div className="downloaded-assets">
      <h1>{translations[language].pageTitle}</h1>
      <div className="asset-grid">
        {assets.map((asset) => (
          <div key={asset._id} className="asset-card">
            <Link to={`/assets/${asset._id}`} className="asset-link">
              <div className="image-container">
                {/* Añadir el badge de categoría con clase CSS válida */}
                {asset.category && (
                  <div className={`category-badge category-${getCategoryClass(asset.category)}`}>
                    {asset.category}
                  </div>
                )}
                <img
                  src={asset.coverImage || '/placeholder.png'}
                  alt={asset.name}
                  className="asset-image"
                  onError={(e) => {
                    console.error('Error loading image:', asset.coverImage);
                    e.target.src = '/digital.png'; 
                    e.target.alt = translations[language].imageNotAvailable;
                  }}
                />
              </div>
              <h2 className="asset-name">{asset.name}</h2>
            </Link>
            
            <div className="asset-stats">
              <div className="asset-likes">
                <span className="asset-likes-icon"><FaHeart /></span>
                <span className="asset-likes-count">{asset.likesCount || 0}</span>
              </div>
              <div className="asset-downloads">
                <span className="asset-downloads-icon"><FaDownload /></span>
                <span className="asset-downloads-count">
                  {asset.downloadsCount || (asset.downloadedBy ? asset.downloadedBy.length : 0)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DownloadedAssets;