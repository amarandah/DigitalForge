import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import './UploadAsset.css';
import api from '../utils/api';

const AssetEdit = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [coverImage, setCoverImage] = useState(null);
    const [coverImagePreview, setCoverImagePreview] = useState(null);
    const [additionalImages, setAdditionalImages] = useState([]);
    const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);
    const [downloadFile, setDownloadFile] = useState(null);
    const [currentDownloadFile, setCurrentDownloadFile] = useState(null);

    // Estado para el idioma
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('preferred-language') || 'es';
    });
    
    // Objeto con traducciones usando useMemo
    const translations = useMemo(() => ({
        es: {
            pageTitle: 'Editar Asset',
            loadError: 'Error al cargar los datos del asset',
            categoryRequired: 'Selecciona una categoría',
            updateSuccess: 'Asset actualizado con éxito',
            updateError: 'Error al actualizar el asset',
            coverPhoto: 'Foto portada',
            uploadCover: 'Haz click para subir portada',
            name: 'Nombre',
            description: 'Descripción',
            category: 'Categoría',
            selectCategory: '-- Selecciona categoría --',
            tags: 'Etiquetas',
            tagsHelp: 'Selecciona las etiquetas que mejor describan tu asset (opcional)',
            downloadableFile: 'Archivo descargable',
            dragDropText: 'Arrastra un archivo aquí o haz clic para seleccionarlo',
            currentFile: 'Archivo actual',
            newFileSelected: 'Nuevo archivo seleccionado',
            replaceFileHint: 'Selecciona un nuevo archivo para reemplazar el actual',
            uploadFiles: 'Subir archivos',
            saveChanges: 'Guardar Cambios',
            mbLabel: 'MB'
        },
        en: {
            pageTitle: 'Edit Asset',
            loadError: 'Error loading asset data',
            categoryRequired: 'Please select a category',
            updateSuccess: 'Asset updated successfully',
            updateError: 'Error updating asset',
            coverPhoto: 'Cover photo',
            uploadCover: 'Click to upload cover',
            name: 'Name',
            description: 'Description',
            category: 'Category',
            selectCategory: '-- Select category --',
            tags: 'Tags',
            tagsHelp: 'Select tags that best describe your asset (optional)',
            downloadableFile: 'Downloadable file',
            dragDropText: 'Drag a file here or click to select',
            currentFile: 'Current file',
            newFileSelected: 'New file selected',
            replaceFileHint: 'Select a new file to replace the current one',
            uploadFiles: 'Upload files',
            saveChanges: 'Save Changes',
            mbLabel: 'MB'
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

    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useSelector((state) => state.auth);

    // Categorías y etiquetas disponibles
    const CATEGORY_TAGS = useMemo(() => ({
        '3D': ['Personajes', 'Animaciones', 'Entorno', 'Iluminación'],
        '2D': ['Personajes', 'Fondos de pantalla', 'Concept Art'],
        'Add-ons': ['Machine learning', 'Servicios'],
        'Audio': ['Canciones', 'Ambiente', 'Efectos de sonido'],
        'Video': ['Tutorial', 'Animation', 'Footage', 'VFX']
    }), []);
    
    // Información de tipos de archivo aceptados
    const FILE_TYPE_HELP = useMemo(() => ({
        '2D': 'Formatos aceptados: JPG, PNG, SVG, GIF, WebP, AI, EPS, PSD',
        '3D': 'Formatos aceptados: FBX, BLEND, OBJ, STL, GLTF, GLB, 3DS, MAX, C4D, WRML, DAE',
        'Audio': 'Formatos aceptados: MP3, OGG, WAV, AAC, FLAC, M4A, WMA, AIFF',
        'Video': 'Formatos aceptados: MP4, WEBM, OGG, AVI, MOV, MKV, FLV, WMV',
        'Add-ons': 'Formatos aceptados: ZIP, TAR, GZ, 7Z, RAR, JS, PY, HTML, CSS, JSON, TXT'
    }), []);

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                const res = await api.get(`/api/assets/${id}`);
                const data = res.data;
                setName(data.name);
                setDescription(data.description);
                setCategory(data.category);
                setTags(data.tags || []);
                setCoverImagePreview(data.coverImage);
                setAdditionalImagePreviews(data.additionalImages || []);
                
                // Cargar información del archivo descargable
                if (data.downloadFile && data.downloadFile.url) {
                    setCurrentDownloadFile(data.downloadFile);
                }
            } catch (err) {
                console.error(err);
                toast.error(translations[language].loadError);
            }
        };
    
        fetchAsset();
    }, [id, translations, language]);
    

    useEffect(() => {
        if (category) {
            setAvailableTags(CATEGORY_TAGS[category] || []);
        } else {
            setAvailableTags([]);
        }
    }, [category, CATEGORY_TAGS]);

    const handleTagChange = (tag) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    const handleCoverImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setCoverImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleDownloadFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDownloadFile(file);
        }
    };

    const handleAdditionalImagesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length) {
            setAdditionalImages((prev) => [...prev, ...files]);
            Promise.all(
                files.map(f =>
                    new Promise(res => {
                        const r = new FileReader();
                        r.onloadend = () => res(r.result);
                        r.readAsDataURL(f);
                    })
                )
            ).then(imgs =>
                setAdditionalImagePreviews((prev) => [...prev, ...imgs])
            );
        }
    };

    const removeAdditionalImage = (i) => {
        setAdditionalImages((prev) => prev.filter((_, idx) => idx !== i));
        setAdditionalImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category) return toast.error(translations[language].categoryRequired);
    
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('tags', JSON.stringify(tags));
            if (coverImage) formData.append('coverImage', coverImage);
            additionalImages.forEach(img => formData.append('additionalImages', img));
            
            // Añadir archivo descargable si se ha seleccionado uno nuevo
            if (downloadFile) {
                formData.append('downloadFile', downloadFile);
            }
    
            await api.put(`/api/assets/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`,
                },
            });
    
            toast.success(translations[language].updateSuccess);
            navigate(`/assets/${id}`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || translations[language].updateError);
        }
    };

    return (
        <div className="upload-asset">
            <h1>{translations[language].pageTitle}</h1>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="cover-group">
                        <label>{translations[language].coverPhoto}</label>
                        <label className="cover-input-wrapper">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverImageChange}
                            />
                            {coverImagePreview ? (
                                <img src={coverImagePreview} alt={translations[language].coverPhoto} />
                            ) : (
                                <div className="cover-placeholder">
                                    {translations[language].uploadCover}
                                </div>
                            )}
                        </label>
                    </div>

                    <div className="fields-group">
                        <div className="form-group">
                            <label>{translations[language].name}</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{translations[language].description}</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{translations[language].category}</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                required
                            >
                                <option value="">{translations[language].selectCategory}</option>
                                <option value="3D">3D</option>
                                <option value="2D">2D</option>
                                <option value="Add-ons">Add-Ons</option>
                                <option value="Audio">Audio</option>
                                <option value="Video">Video</option>
                            </select>
                        </div>

                        {category && availableTags.length > 0 && (
                            <div className="form-group">
                                <label>{translations[language].tags}</label>
                                <div className="tags-container">
                                    {availableTags.map(tag => (
                                        <div 
                                            key={tag} 
                                            className={`tag-checkbox ${tags.includes(tag) ? 'selected' : ''}`}
                                            onClick={() => handleTagChange(tag)}
                                        >
                                            <input
                                                type="checkbox"
                                                id={`tag-${tag}`}
                                                checked={tags.includes(tag)}
                                                onChange={() => {}}
                                                style={{ marginRight: '8px' }}
                                            />
                                            <label htmlFor={`tag-${tag}`}>{tag}</label>
                                        </div>
                                    ))}
                                </div>
                                <p className="tags-help">{translations[language].tagsHelp}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group full-width">
                    <label>{translations[language].downloadableFile}</label>
                    <div className="download-file-input">
                        <input
                            type="file"
                            onChange={handleDownloadFileChange}
                            className="download-file"
                        />
                        {!downloadFile && !currentDownloadFile && (
                            <p className="drag-drop-text">{translations[language].dragDropText}</p>
                        )}
                        {!downloadFile && currentDownloadFile && (
                            <div className="selected-file">
                                <p>
                                    <strong>{translations[language].currentFile}:</strong> {currentDownloadFile.name}
                                    <span className="file-size">
                                        ({(currentDownloadFile.size / 1024 / 1024).toFixed(2)} {translations[language].mbLabel})
                                    </span>
                                </p>
                                <small className="replace-file-hint">{translations[language].replaceFileHint}</small>
                            </div>
                        )}
                        {downloadFile && (
                            <div className="selected-file">
                                <p>
                                    <strong>{translations[language].newFileSelected}:</strong> {downloadFile.name}
                                    <span className="file-size">
                                        ({(downloadFile.size / 1024 / 1024).toFixed(2)} {translations[language].mbLabel})
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="additional-input-wrapper">
                    <label className="additional-label">
                        {translations[language].uploadFiles}
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleAdditionalImagesChange}
                        />
                    </label>
                </div>

                {additionalImagePreviews.length > 0 && (
                    <div className="additional-images-preview">
                        {additionalImagePreviews.map((src, i) => (
                            <div key={i} className="preview-item">
                                <img src={src} alt={`Preview ${i + 1}`} />
                                <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={() => removeAdditionalImage(i)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button type="submit" className="btn btn-primary submit-btn">
                    {translations[language].saveChanges}
                </button>
            </form>
        </div>
    );
};

export default AssetEdit;