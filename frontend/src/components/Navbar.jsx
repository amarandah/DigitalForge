import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate();
  
  // Estado para el idioma
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferred-language') || 'es';
  });
  
  // Mapeo de categorías entre idiomas - para mantener consistencia en las URLs
  const categoryMap = {
    es: {
      '3D': '3D',
      '2D': '2D',
      'Add-ons': 'Add-ons',
      'Audio': 'Audio',
      'Video': 'Video'
    },
    en: {
      '3D': '3D', 
      '2D': '2D',
      'Add-ons': 'Add-ons',
      'Audio': 'Audio',
      'Video': 'Video'
    }
  };
  
  // Mapeo inverso para traducir URLs a nombres de categorías
  const inverseCategoryMap = {
    '3D': '3D',
    '2D': '2D',
    'Add-ons': 'Add-ons',
    'Audio': 'Audio',
    'Video': 'Video'
  };
  
  // Traducciones para las categorías y etiquetas
  const translations = {
    es: {
      home: 'Inicio',
      categories: {
        '3D': '3D',
        '2D': '2D',
        'Add-ons': 'Add-ons',
        'Audio': 'Audio',
        'Video': 'Video'
      },
      tags: {
        '3D': ['Personajes', 'Animaciones', 'Entorno', 'Iluminación'],
        '2D': ['Personajes', 'Fondos de pantalla', 'Concept Art'],
        'Add-ons': ['Machine learning', 'Servicios'],
        'Audio': ['Canciones', 'Ambiente', 'Efectos de sonido'],
        'Video': ['Tutorial', 'Animación', 'Grabaciones', 'VFX']
      }
    },
    en: {
      home: 'Home',
      categories: {
        '3D': '3D',
        '2D': '2D',
        'Add-ons': 'Add-ons',
        'Audio': 'Audio',
        'Video': 'Video'
      },
      tags: {
        '3D': ['Characters', 'Animations', 'Environment', 'Lighting'],
        '2D': ['Characters', 'Wallpapers', 'Concept Art'],
        'Add-ons': ['Machine learning', 'Services'],
        'Audio': ['Songs', 'Ambience', 'Sound Effects'],
        'Video': ['Tutorial', 'Animation', 'Footage', 'VFX']
      }
    }
  };
  
  // Mapeo de etiquetas entre idiomas
  const tagMappings = {
    // 3D
    'Personajes': 'Characters',
    'Characters': 'Personajes',
    'Animaciones': 'Animations',
    'Animations': 'Animaciones',
    'Entorno': 'Environment',
    'Environment': 'Entorno',
    'Iluminación': 'Lighting',
    'Lighting': 'Iluminación',
    
    // 2D
    'Fondos de pantalla': 'Wallpapers',
    'Wallpapers': 'Fondos de pantalla',
    'Concept Art': 'Concept Art',
    
    // Add-ons
    'Machine learning': 'Machine learning',
    'Servicios': 'Services',
    'Services': 'Servicios',
    
    // Audio
    'Canciones': 'Songs',
    'Songs': 'Canciones',
    'Ambiente': 'Ambience',
    'Ambience': 'Ambiente',
    'Efectos de sonido': 'Sound Effects',
    'Sound Effects': 'Efectos de sonido',
    
    // Video
    'Tutorial': 'Tutorial',
    'Animación': 'Animation',
    'Animation': 'Animación',
    'Grabaciones': 'Footage',
    'Footage': 'Grabaciones',
    'VFX': 'VFX'
  };

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

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleMouseEnter = (category) => {
    setActiveCategory(category);
  };

  const handleMouseLeave = () => {
    setActiveCategory(null);
  };

  const handleTagClick = (tag) => {
    // Convertir la etiqueta al idioma del backend (español)
    const backendTag = language === 'en' ? tagMappings[tag] || tag : tag;
    
    // La categoría siempre debe ser la versión estandarizada
    const standardCategory = activeCategory; // Ya estamos usando las claves estandarizadas
    
    navigate(`/category/${standardCategory}/tag/${encodeURIComponent(backendTag)}`);
    setActiveCategory(null);
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <button className="navbar__toggle" onClick={toggleMenu}>
        ☰
      </button>

      <ul className={`navbar__list ${menuOpen ? 'open' : ''}`}>
        <li>
          <NavLink to="/" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
            {translations[language].home}
          </NavLink>
        </li>
        {Object.keys(translations[language].tags).map((category) => (
          <li key={category} className="category-item" onMouseEnter={() => handleMouseEnter(category)} onMouseLeave={handleMouseLeave}>
            <NavLink 
              to={`/category/${category}`} 
              onClick={() => setMenuOpen(false)} 
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {translations[language].categories[category]}
            </NavLink>
            
            {activeCategory === category && (
              <div className="tags-dropdown">
                <div className="tags-dropdown-content">
                  <ul className="tags-list">
                    {translations[language].tags[category].map((tag) => (
                      <li key={tag}>
                        <button 
                          className="tag-button" 
                          onClick={(e) => {
                            e.preventDefault();
                            handleTagClick(tag);
                          }}
                        >
                          {tag}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;