import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaHeart, FaRegHeart, FaDownload, FaEdit, FaTrash } from 'react-icons/fa';
import Spinner from '../components/Spinner';
import './AssetDetails.css';
import api from '../utils/api';

export default function AssetDetails() {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  
  // Estado para el idioma
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferred-language') || 'es';
  });
  
  // Objeto con traducciones usando useMemo para evitar recreación en cada render
  const translations = useMemo(() => ({
    es: {
      deleteConfirm: '¿Estás seguro de que quieres eliminar este asset? Esta acción no se puede deshacer.',
      deleteSuccess: 'Asset eliminado correctamente',
      deleteError: 'Error al eliminar el asset',
      loadError: 'Error al cargar el asset',
      noFile: 'Sin archivo',
      downloadRegistered: 'Descarga registrada',
      downloadError: 'No se pudo registrar la descarga',
      backToHome: 'Volver a Inicio',
      backToMyAssets: 'Volver a Mis Assets',
      category: 'Categoría',
      tags: 'Etiquetas',
      description: 'Descripción',
      download: 'Descargar',
      edit: 'Editar',
      delete: 'Eliminar',
      comments: 'Comentarios',
      commentPlaceholder: 'Escribe tu comentario...',
      sending: 'Enviando…',
      send: 'Enviar',
      loginToComment: 'Inicia sesión para comentar',
      loading: 'Cargando…',
      noComments: 'No hay comentarios',
      additional: 'adicional'
    },
    en: {
      deleteConfirm: 'Are you sure you want to delete this asset? This action cannot be undone.',
      deleteSuccess: 'Asset successfully deleted',
      deleteError: 'Error deleting asset',
      loadError: 'Error loading asset',
      noFile: 'No file available',
      downloadRegistered: 'Download registered',
      downloadError: 'Could not register download',
      backToHome: 'Back to Home',
      backToMyAssets: 'Back to My Assets',
      category: 'Category',
      tags: 'Tags',
      description: 'Description',
      download: 'Download',
      edit: 'Edit',
      delete: 'Delete',
      comments: 'Comments',
      commentPlaceholder: 'Write your comment...',
      sending: 'Sending…',
      send: 'Send',
      loginToComment: 'Login to comment',
      loading: 'Loading…',
      noComments: 'No comments',
      additional: 'additional'
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
  
  const handleDeleteAsset = async () => {
    if (!user) return navigate('/login');

    // Confirmar antes de eliminar
    if (!window.confirm(translations[language].deleteConfirm)) {
      return;
    }

    try {
      await api.delete(`/api/assets/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success(translations[language].deleteSuccess);
      navigate('/'); // O redirige a donde prefieras después de eliminar
    } catch (error) {
      toast.error(translations[language].deleteError);
    }
  };

  // referrer logic (igual que antes)...
  const [referrer] = useState(
    location.state?.from ||
    localStorage.getItem('assetReferrer') ||
    '/'
  );
  useEffect(() => {
    if (location.state?.from)
      localStorage.setItem('assetReferrer', location.state.from);
  }, [location]);

  // fetch asset
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // 1) Cargar datos del asset
        const assetRes = await api.get(`/api/assets/${id}`)
        setAsset(assetRes.data)
        setLikesCount(assetRes.data.likesCount)
  
        // 2) Si hay usuario logueado, preguntar si ya hizo like
        if (user) {
          const config = {
            headers: { Authorization: `Bearer ${user.token}` }
          }
          const likeRes = await api.get(
            `/api/assets/${id}/like`,
            config
          )
          setLiked(likeRes.data.liked)
          setLikesCount(likeRes.data.likesCount)
        }
      } catch (err) {
        toast.error(translations[language].loadError)
      } finally {
        setLoading(false)
      }
    }
  
    load()
  }, [id, user, translations, language])
  
  // fetch comments
  useEffect(() => {
    api.get(`/api/assets/${id}/comments`)
      .then(res => setComments(res.data))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [id]);

  if (loading) return <Spinner />;

  const handleToggleLike = async () => {
    if (!user) return navigate('/login');
    setLikeLoading(true);
    try {
      const { data } = await api.put(
        `/api/assets/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch { }
    setLikeLoading(false);
  };

  const handleDownload = async () => {
    if (!asset.downloadFile?.url) return toast.error(translations[language].noFile);
  
    // Registrar descarga si el usuario está logueado
    if (user) {
      try {
        await api.post(
          `/api/assets/${asset._id}/download`,
          {},
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        toast.success(translations[language].downloadRegistered);
      } catch (err) {
        console.error('Error al registrar descarga:', err.response?.data || err.message);
        toast.warn(translations[language].downloadError);
      }
    }
  
    // Descargar el archivo
    const a = document.createElement('a');
    let downloadUrl = asset.downloadFile.url;
  
    // Convertir URL de Dropbox a descarga directa si hace falta
    if (downloadUrl.includes('www.dropbox.com')) {
      downloadUrl = downloadUrl
        .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
        .replace('?dl=0', '');
    }
  
    a.href = downloadUrl;
    a.download =
      asset.downloadFile.name ||
      `${asset.name}.${downloadUrl.split('.').pop()}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(
        `/api/assets/${id}/comments`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setComments(prev => [data, ...prev]);
      setCommentText('');
    } catch { }
    setSubmitting(false);
  };

  // back link
  let backText = translations[language].backToHome, backPath = '/';
  if (referrer === '/my-assets') {
    backText = translations[language].backToMyAssets;
    backPath = '/my-assets';
  }

  return (
    <>
      {/* Botón volver fuera del contenedor principal */}
      <div className="asset-details__back-outer">
        <Link to={backPath} className="btn">
          <FaArrowLeft /> {backText}
        </Link>
      </div>
      
      <div className="asset-details">
        <h1 className="asset-details__title">
          {asset.name}
        </h1>

        {/* Grid principal */}
        <div className="asset-details__grid">
          {/* 🌄 Izquierda */}
          <div className="asset-details__col asset-details__col--left">
            {/* Portada */}
            {asset.coverImage && (
              <div className="asset-details__main-image">
                <img
                  src={asset.coverImage}
                  alt={asset.name}
                  onError={e => (e.target.src = '/digital.png')}
                />
              </div>
            )}

            {/* Reproductor si hay */}
            {asset.downloadFile?.url &&
              (['Audio','Video'].includes(asset.category) && (
                <div className="asset-details__player">
                  {asset.category === 'Audio' ? (
                    <audio controls src={asset.downloadFile.url} />
                  ) : (
                    <video controls src={asset.downloadFile.url} />
                  )}
                </div>
              ))}

            {/* Imágenes adicionales en vertical */}
            {asset.additionalImages?.map((img, i) => (
              <div key={i} className="asset-details__additional-image-vertical">
                <img
                  src={img}
                  alt={`${asset.name} ${translations[language].additional} ${i+1}`}
                  onError={e => (e.target.src = '/digital.png')}
                />
              </div>
            ))}
          </div>

          {/* 👤 Derecha */}
          <div className="asset-details__col asset-details__col--right">
            {/* Autor - Ahora como Link */}
            {asset.user && (
              <div className="asset-details__author">
                <Link 
                  to={`/user/${asset.user._id}/assets`} 
                  className="author-link" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}
                >
                  {asset.user.profileImage && (
                    <img
                      src={asset.user.profileImage}
                      alt={asset.user.username}
                      className="user-avatar"
                    />
                  )}
                  <span className="asset-details__author-name">
                    {asset.user.username}
                  </span>
                </Link>
              </div>
            )}

            {/* Categoría */}
            {asset.category && (
              <div className="asset-details__category">
                {translations[language].category}: <Link 
                  to={`/category/${encodeURIComponent(asset.category)}`}
                  className="tag-pill"
                >
                  {asset.category}
                </Link>
              </div>
            )}

            {/* Etiquetas */}
            {asset.tags?.length > 0 && (
              <div className="asset-details__tags">
                {translations[language].tags}:{' '}
                {asset.tags.map((t,i) => (
                  <Link 
                    key={i}
                    to={`/category/${encodeURIComponent(asset.category)}/tag/${encodeURIComponent(t)}`}
                    className="tag-pill"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            )}

            {/* Descripción */}
            <div className="asset-details__description">
              <h2>{translations[language].description}</h2>
              <p>{asset.description}</p>
            </div>

            {/* Me gusta y descarga */}
            <div className="asset-details__actions">
              <button
                className={`like-button ${liked?'liked':''}`}
                onClick={handleToggleLike}
                disabled={likeLoading}
              >
                {liked ? <FaHeart/> : <FaRegHeart/>} {likesCount}
              </button>
              {asset.downloadFile?.url && (
                <button
                  className="btn btn-download"
                  onClick={handleDownload}
                >
                  <FaDownload /> {translations[language].download}
                </button>
              )}

              {/* Mostrar botones de editar/eliminar solo si el usuario es el propietario */}
              {user && asset.user && user._id === asset.user._id && (
                <div className="asset-details__owner-actions">
                  <Link 
                    to={`/assets/${asset._id}/edit`}
                    className="btn btn-download"
                  >
                    <FaEdit /> {translations[language].edit}
                  </Link>
                  <button
                    className="btn btn-download"
                    onClick={handleDeleteAsset}
                  >
                    <FaTrash /> {translations[language].delete}
                  </button>
                </div>
              )}
            </div>
            <hr className="separator" />
            {/* Comentarios */}
            <div className="asset-details__comments">
              <h2>{translations[language].comments}</h2>
              {/* Formulario */}
              {user ? (
                <form
                  className="comment-form"
                  onSubmit={handleSubmitComment}
                >
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder={translations[language].commentPlaceholder}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-comment"
                    disabled={submitting}
                  >
                    {submitting ? translations[language].sending : translations[language].send}
                  </button>
                </form>
              ) : (
                <p>{translations[language].loginToComment}</p>
              )}

              {/* Lista */}
              {commentsLoading ? (
                <p>{translations[language].loading}</p>
              ) : comments.length === 0 ? (
                <p>{translations[language].noComments}</p>
              ) : (
                comments.map(c => (
                  <div key={c._id} className="comment">
                    <div className="comment-header">
                      {c.user.profileImage ? (
                        <img
                          src={c.user.profileImage}
                          alt={c.user.username}
                          className="comment-avatar"
                        />
                      ) : (
                        <div className="comment-avatar-placeholder">
                          {c.user.username[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <strong>{c.user.username}</strong>
                        <br />
                        <small>
                          {new Date(c.createdAt).toLocaleDateString(
                            language === 'es' ? 'es-ES' : 'en-US', 
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </small>
                      </div>
                    </div>
                    <p className="comment-text">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}