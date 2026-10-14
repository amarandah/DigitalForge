import React, { useState, useEffect } from 'react';
import './FloatingButton.css';
import './Sidebar.css';
import { IoAccessibilityOutline } from "react-icons/io5";
import { FaLanguage } from "react-icons/fa";

const DEFAULT_SCALE = 100; // 100% - tamaño normal

const FloatingButton = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fontScale, setFontScale] = useState(() => {
    const saved = localStorage.getItem('fontScale');
    return saved ? parseInt(saved) : DEFAULT_SCALE;
  });
  
  // Estado para el idioma
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferred-language') || 'es';
  });

  // Traducciones para los textos del panel de accesibilidad
  const translations = {
    es: {
      accessibility: 'Accesibilidad',
      themes: 'Temas',
      lightMode: 'Modo claro',
      darkMode: 'Modo oscuro',
      colorblindness: 'Daltonismo',
      deuteranopia: 'Deuteranopia',
      tritanopia: 'Tritanopia',
      textSize: 'Tamaño de texto',
      reset: 'Restablecer',
      language: 'Idioma',
      spanish: 'Español',
      english: 'Inglés'
    },
    en: {
      accessibility: 'Accessibility',
      themes: 'Themes',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      colorblindness: 'Color Blindness',
      deuteranopia: 'Deuteranopia',
      tritanopia: 'Tritanopia',
      textSize: 'Text Size',
      reset: 'Reset',
      language: 'Language',
      spanish: 'Spanish',
      english: 'English'
    }
  };

const changeLanguage = (lang) => {
  setLanguage(lang);
  localStorage.setItem('preferred-language', lang);
  document.documentElement.lang = lang;
  
  // Disparar un evento personalizado que otros componentes pueden escuchar
  const event = new CustomEvent('languageChange', { detail: { language: lang } });
  window.dispatchEvent(event);
};

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const setDarkTheme = () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  };

  const setColorblindThemeGreen = () => {
    document.documentElement.setAttribute('data-theme', 'colorblind-green');
    localStorage.setItem('theme', 'colorblind-green');
  };
  
  const setColorblindBlueTheme = () => {
    document.documentElement.setAttribute('data-theme', 'colorblind-blue');
    localStorage.setItem('theme', 'colorblind-blue');
  };

  const setDefaultTheme = () => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'default');
  };

  const handleFontScaleChange = (e) => {
    const newScale = parseInt(e.target.value);
    setFontScale(newScale);
    localStorage.setItem('fontScale', newScale);
  };

  const resetFontScale = () => {
    setFontScale(DEFAULT_SCALE);
    localStorage.removeItem('fontScale');
  };

  // Aplicar el tema guardado al cargar la página
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      if (savedTheme === 'dark') {
        setDarkTheme();
      } else if (savedTheme === 'colorblind-green') {
        setColorblindThemeGreen();
      } else if (savedTheme === 'colorblind-blue') {
        setColorblindBlueTheme();
      } else {
        setDefaultTheme();
      }
    }
  }, []);

  // Aplicar la escala de fuente
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
  }, [fontScale]);

  // Aplicar el idioma
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <>
      <button className="floating-button" onClick={toggleSidebar} aria-label="Abrir menú de accesibilidad">
        <IoAccessibilityOutline />
      </button>
      <div className={`sidebar ${isSidebarOpen ? '' : 'hidden'}`} aria-hidden={!isSidebarOpen}>
        <button className="close-sidebar" onClick={toggleSidebar} aria-label="Cerrar menú de accesibilidad">
          &times;
        </button>
        <div className="sidebar-content">
          <h2>{translations[language].accessibility}</h2>
          
          <h3>{translations[language].themes}</h3>
          <button className="theme-button" onClick={setDefaultTheme}>
            {translations[language].lightMode}
          </button>
          <button className="theme-button" onClick={setDarkTheme}>
            {translations[language].darkMode}
          </button>
          
          <h3>{translations[language].colorblindness}</h3>
          <button className="theme-button" onClick={setColorblindThemeGreen}>
            {translations[language].deuteranopia}
          </button>
          <button className="theme-button colorblind-blue" onClick={setColorblindBlueTheme}>
            {translations[language].tritanopia}
          </button>
          
          <h3>{translations[language].textSize}</h3>
          <div className="font-slider-container">
            <input
              id="fontSlider"
              type="range"
              min="70"
              max="150"
              step="10"
              value={fontScale}
              onChange={handleFontScaleChange}
              aria-label="Ajustar tamaño de texto"
              aria-valuemin="70"
              aria-valuemax="150"
              aria-valuenow={fontScale}
            />
            <div className="font-size-controls">
              <span className="font-size-indicator">{fontScale}%</span>
              {fontScale !== DEFAULT_SCALE && (
                <button className="reset-button" onClick={resetFontScale}>
                  {translations[language].reset}
                </button>
              )}
            </div>
          </div>
          
          {/* Sección de idioma */}
          <h3>{translations[language].language}</h3>
          <div className="language-buttons">
            <button 
              className={`language-button ${language === 'es' ? 'active' : ''}`}
              onClick={() => changeLanguage('es')}
              aria-pressed={language === 'es'}
            >
              <FaLanguage className="language-icon" />
              {translations[language].spanish}
            </button>
            <button 
              className={`language-button ${language === 'en' ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
              aria-pressed={language === 'en'}
            >
              <FaLanguage className="language-icon" />
              {translations[language].english}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingButton;