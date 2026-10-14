import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css';
import api from '../utils/api';
// Importa los íconos
import { FaDownload, FaHeart, FaClock} from 'react-icons/fa';

function Dashboard() {
  const [assets, setAssets] = useState([])
  const [recentAssets, setRecentAssets] = useState([])
  const [mostLikedAssets, setMostLikedAssets] = useState([])
  const [mostDownloadedAssets, setMostDownloadedAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Estado para controlar el carrusel
  const [currentPage, setCurrentPage] = useState(0)
  const assetsPerPage = 10
  
  // Inicializar idioma desde localStorage o default a español
const [language, setLanguage] = useState(() => {
  return localStorage.getItem('preferred-language') || 'es';
});
   
  // Objeto con traducciones
  const translations = {
    es: {
      mostLiked: 'Los assets más gustados',
      mostDownloaded: 'Los assets más descargados',
      recentAssets: 'Assets recientes',
      loading: 'Cargando assets...',
      error: 'Error:',
      noAssets: 'No hay assets disponibles.',
      toggleLanguage: 'English'
    },
    en: {
      mostLiked: 'Most liked assets',
      mostDownloaded: 'Most downloaded assets',
      recentAssets: 'Recent assets',
      loading: 'Loading assets...',
      error: 'Error:',
      noAssets: 'No assets available.',
      toggleLanguage: 'Español'
    }
  };

  // Efecto para establecer el idioma del documento al cargar
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
    const fetchAssets = async () => {
      try {
        console.log('Fetching assets...');
        const response = await api.get('/api/assets');
        console.log('API response:', response);

        let assetsData = [];
        if (Array.isArray(response.data)) {
          assetsData = response.data;
        } else {
          assetsData = response.data.assets || [];
        }
        
        // Ordenar por fecha de creación (más recientes primero)
        const sortedByDate = [...assetsData].sort((a, b) => {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        
        setAssets(sortedByDate);
        setRecentAssets(sortedByDate);
        
        // Ordenar por likes y obtener los 5 más gustados
        const sortedByLikes = [...assetsData].sort((a, b) => 
          (b.likesCount || 0) - (a.likesCount || 0)
        ).slice(0, 5);
        
        setMostLikedAssets(sortedByLikes);
        
        // Ordenar por descargas y obtener los 5 más descargados
        const sortedByDownloads = [...assetsData].sort((a, b) => {
          const downloadsA = a.downloadsCount || (a.downloadedBy ? a.downloadedBy.length : 0);
          const downloadsB = b.downloadsCount || (b.downloadedBy ? b.downloadedBy.length : 0);
          return downloadsB - downloadsA;
        }).slice(0, 5);
        
        setMostDownloadedAssets(sortedByDownloads);
        
        console.log('Recent assets:', sortedByDate);
        console.log('Most liked assets:', sortedByLikes);
        console.log('Most downloaded assets:', sortedByDownloads);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  // Cambiar directamente a una página específica
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };



  // Obtener los assets de la página actual
  const getCurrentPageAssets = () => {
    const startIndex = currentPage * assetsPerPage;
    const endIndex = startIndex + assetsPerPage;
    return recentAssets.slice(startIndex, endIndex);
  };

  // Función para obtener una clase CSS válida de la categoría
  const getCategoryClass = (category) => {
    if (!category) return '';
    // Reemplazar espacios y convertir a minúsculas
    return category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  // Componente para mostrar un asset
  const AssetCard = ({ asset }) => (
    <div className="asset-card">
      <Link 
        to={`/assets/${asset._id}`} 
        state={{ from: '/' }}
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
          <span className="asset-card__likes-icon">❤️ </span>
          <span className="asset-card__likes-count">{asset.likesCount || 0}</span>
        </div>
        <div className="asset-card__downloads">
          <span className="asset-card__downloads-icon"><FaDownload /></span>
          <span className="asset-card__downloads-count">{asset.downloadsCount || 
            (asset.downloadedBy ? asset.downloadedBy.length : 0)}</span>
        </div>
      </div>
    </div>
  );

  if (loading) return <p>{translations[language].loading}</p>
  if (error) return <p className="text-red-500">{translations[language].error} {error}</p>
  if (assets.length === 0) return <p>{translations[language].noAssets}</p>

  // Calcular el número total de páginas
  const totalPages = Math.ceil(recentAssets.length / assetsPerPage);

  // Crear botones de paginación
  const renderPaginationButtons = () => {
    const buttons = [];
    // Limitamos el número de botones para evitar sobrecarga visual
    const maxButtonsToShow = 5;

    if (totalPages <= maxButtonsToShow) {
      // Mostrar todos los botones si hay pocos
      for (let i = 0; i < totalPages; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => goToPage(i)}
            className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
            aria-label={`Ir a la página ${i + 1}`}
          >
            {i + 1}
          </button>
        );
      }
    } else {
      // Mostrar botones limitados con elipsis si hay muchos
      const startPage = Math.max(0, Math.min(currentPage - Math.floor(maxButtonsToShow / 2), totalPages - maxButtonsToShow));
      
      // Añadir primer botón si no comenzamos desde el principio
      if (startPage > 0) {
        buttons.push(
          <button
            key={0}
            onClick={() => goToPage(0)}
            className="pagination-btn"
            aria-label="Ir a la primera página"
          >
            1
          </button>
        );
        
        // Añadir elipsis si hay un salto
        if (startPage > 1) {
          buttons.push(
            <span key="ellipsis-start" className="pagination-ellipsis" aria-hidden="true">...</span>
          );
        }
      }
      
      // Añadir botones intermedios
      for (let i = startPage; i < Math.min(startPage + maxButtonsToShow, totalPages); i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => goToPage(i)}
            className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
            aria-label={`Ir a la página ${i + 1}`}
            aria-current={currentPage === i ? "page" : undefined}
          >
            {i + 1}
          </button>
        );
      }
      
      // Añadir elipsis final y último botón si no llegamos al final
      if (startPage + maxButtonsToShow < totalPages) {
        if (startPage + maxButtonsToShow < totalPages - 1) {
          buttons.push(
            <span key="ellipsis-end" className="pagination-ellipsis" aria-hidden="true">...</span>
          );
        }
        
        buttons.push(
          <button
            key={totalPages - 1}
            onClick={() => goToPage(totalPages - 1)}
            className={`pagination-btn ${currentPage === totalPages - 1 ? 'active' : ''}`}
            aria-label={`Ir a la última página (${totalPages})`}
          >
            {totalPages}
          </button>
        );
      }
    }

    return buttons;
  };

  return (
    <div className="dashboard">
  
      
      {/* Sección de los assets más gustados - PRIMERO */}
      <div className="most-liked-section first-section">
        <h2 className="section-title">
          <FaHeart className="heart-icon" /> {translations[language].mostLiked}
        </h2>
        <div className="most-liked-grid">
          {mostLikedAssets.map(asset => (
            <AssetCard key={`liked-${asset._id}`} asset={asset} />
          ))}
        </div>
      </div>
      
      {/* Sección de los assets más descargados - AHORA SEGUNDO */}
      <div className="most-downloaded-section">
        <h2 className="section-title-downloaded">
          <FaDownload className="download-icon" /> {translations[language].mostDownloaded}
        </h2>
        <div className="most-downloaded-grid">
          {mostDownloadedAssets.map(asset => (
            <AssetCard key={`downloaded-${asset._id}`} asset={asset} />
          ))}
        </div>
      </div>
      
      {/* Sección de todos los assets disponibles - AHORA TERCERO */}
      <div className="recent-assets-section">
        <h2 className="dashboard-title">
          <FaClock className="clock-icon" /> {translations[language].recentAssets}
        </h2>
        
        <div className="asset-grid">
          {getCurrentPageAssets().map(asset => (
            <AssetCard key={asset._id} asset={asset} />
          ))}
        </div>
        
        {/* Paginación con botones numéricos */}
        <div className="pagination-container">
          {renderPaginationButtons()}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;