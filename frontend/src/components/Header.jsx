import React, { useState, useRef, useEffect } from 'react';
import { FaSignInAlt, FaUser } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  // Estado para el idioma
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferred-language') || 'es';
  });

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  
  // Objeto con traducciones
  const translations = {
    es: {
      search: 'Buscar',
      login: 'Iniciar sesión',
      register: 'Registrarse',
      myData: 'Mis datos',
      myAssets: 'Mis assets',
      downloadedAssets: 'Assets descargados',
      logout: 'Cerrar sesión'
    },
    en: {
      search: 'Search',
      login: 'Log in',
      register: 'Sign up',
      myData: 'My data',
      myAssets: 'My assets',
      downloadedAssets: 'Downloaded assets',
      logout: 'Log out'
    }
  };

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = e.target.search.value.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setMobileSearchVisible(false);
    }
  };

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleMobileSearch = () => setMobileSearchVisible((prev) => !prev);

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
    function handleClickOutside(e) {
      if (
        menuOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
      if (
        mobileSearchVisible &&
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        !e.target.closest('.search-toggle')
      ) {
        setMobileSearchVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, mobileSearchVisible]);

  return (
    <header className="header">
      <div className="header__top">
        <div className="header__logo">
          <Link to="/">
            <img className="logo-image" alt="DigitalForge Logo" />
          </Link>
        </div>

        <button type="button" className="btn search-toggle" onClick={toggleMobileSearch}>
          {translations[language].search}
        </button>

        <ul className="header__actions" ref={dropdownRef}>
          {user ? (
            <li className="dropdown">
              <button type="button" className="btn user-btn" onClick={toggleMenu}>
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    className="user-avatar"
                  />
                ) : (
                  <FaUser />
                )}
                {user.username}
              </button>
              {menuOpen && (
                <ul className="dropdown__menu">
                  <li><Link to="/account" onClick={() => setMenuOpen(false)}>{translations[language].myData}</Link></li>
                  <li><Link to="/my-assets" onClick={() => setMenuOpen(false)}>{translations[language].myAssets}</Link></li>
                  <li><Link to="/downloaded-assets" onClick={() => setMenuOpen(false)}>{translations[language].downloadedAssets}</Link></li>
                  <li>
                    <button className="dropdown__logout" onClick={() => { setMenuOpen(false); onLogout(); }}>
                      {translations[language].logout}
                    </button>
                  </li>
                </ul>
              )}
            </li>
          ) : (
            <>
              <li><Link to="/login" className="btn"><FaSignInAlt /> {translations[language].login}</Link></li>
              <li><Link to="/register" className="btn"><FaUser /> {translations[language].register}</Link></li>
            </>
          )}
        </ul>
      </div>

      {/* ÚNICA barra de búsqueda */}
      <div
        ref={searchRef}
        className={`search-bar-container ${mobileSearchVisible ? 'visible' : ''}`}
      >
        <form className="search-bar" onSubmit={handleSearch}>
          <input type="text" name="search" placeholder={translations[language].search} />
          <button type="submit" style={{ background: 'none', border: 'none' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              style={{ verticalAlign: 'middle' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}

export default Header;