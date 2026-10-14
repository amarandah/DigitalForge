import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import './UploadAsset.css';
import api from '../utils/api';

const UploadAsset = () => {
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
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { user } = useSelector((state) => state.auth);

    // Language state
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('preferred-language') || 'en';
    });

    // Translations
    const translations = {
        en: {
            uploadAsset: 'Upload a new asset',
            coverImage: 'Cover Image',
            clickToUpload: 'Click to upload cover',
            name: 'Name',
            description: 'Description',
            category: 'Category',
            selectCategory: '-- Select category --',
            tags: 'Tags',
            optionalTags: 'Select tags that best describe your asset (optional)',
            downloadableFile: 'Downloadable File',
            dragDropFile: 'Drag a file here or click to select one',
            selectedFile: 'Selected file:',
            fileSize: 'File size:',
            additionalImages: 'Add asset images',
            dragDropImages: 'Drag images here or click to select them',
            additionalPreviews: 'Additional Previews',
            uploading: 'Uploading...',
            completed: 'Completed!',
            processing: 'Processing asset...',
            submit: 'Submit',
            uploadingFiles: 'Uploading files...',
            fileHelp: 'Upload the file users can download (optional)',
            fileFormats: 'Accepted formats:',
            selectCoverImage: 'Select a cover image',
            selectCategoryError: 'Select a category',
            successMessage: 'Asset uploaded successfully',
            errorMessage: 'Error uploading the asset',
        },
        es: {
            uploadAsset: 'Sube un nuevo asset',
            coverImage: 'Foto portada',
            clickToUpload: 'Haz click para subir portada',
            name: 'Nombre',
            description: 'Descripción',
            category: 'Categoría',
            selectCategory: '-- Selecciona categoría --',
            tags: 'Etiquetas',
            optionalTags: 'Selecciona las etiquetas que mejor describan tu asset (opcional)',
            downloadableFile: 'Archivo descargable',
            dragDropFile: 'Arrastra un archivo aquí o haz clic para seleccionarlo',
            selectedFile: 'Archivo seleccionado:',
            fileSize: 'Tamaño del archivo:',
            additionalImages: 'Añadir imágenes del asset',
            dragDropImages: 'Arrastra imágenes aquí o haz clic para seleccionarlas',
            additionalPreviews: 'Vistas previas adicionales',
            uploading: 'Subiendo...',
            completed: '¡Completado!',
            processing: 'Procesando asset...',
            submit: 'Subir',
            uploadingFiles: 'Subiendo archivos...',
            fileHelp: 'Sube el archivo que los usuarios podrán descargar (opcional)',
            fileFormats: 'Formatos aceptados:',
            selectCoverImage: 'Selecciona una imagen de portada',
            selectCategoryError: 'Selecciona una categoría',
            successMessage: 'Asset subido con éxito',
            errorMessage: 'Error al subir el asset',
        },
    };


    const CATEGORY_TAGS = { '3D': ['Personajes', 'Animaciones', 'Entorno', 'Iluminación'], '2D': ['Personajes', 'Fondos de pantalla', 'Concept Art'], 'Add-ons': ['Machine learning', 'Servicios'], 'Audio': ['Canciones', 'Ambiente', 'Efectos de sonido'], 'Video': ['Tutorial', 'Animation', 'Footage', 'VFX'] }; const FILE_TYPE_HELP = { '2D': 'Formatos aceptados: JPG, PNG, SVG, GIF, WebP, AI, EPS, PSD', '3D': 'Formatos aceptados: FBX, BLEND, OBJ, STL, GLTF, GLB, 3DS, MAX, C4D, WRML, DAE', 'Audio': 'Formatos aceptados: MP3, OGG, WAV, AAC, FLAC, M4A, WMA, AIFF', 'Video': 'Formatos aceptados: MP4, WEBM, OGG, AVI, MOV, MKV, FLV, WMV', 'Add-ons': 'Formatos aceptados: ZIP, TAR, GZ, 7Z, RAR, JS, PY, HTML, CSS, JSON, TXT' };

    // Update available tags when category changes
    useEffect(() => {
        if (category) {
            setAvailableTags(CATEGORY_TAGS[category] || []);
            setTags([]); // Reset tags when category changes
        } else {
            setAvailableTags([]);
        }
    }, [category]);

    // Handle language changes
    useEffect(() => {
        const handleLanguageChange = (e) => {
            const newLang = e.detail.language;
            setLanguage(newLang);
        };

        window.addEventListener('languageChange', handleLanguageChange);

        return () => {
            window.removeEventListener('languageChange', handleLanguageChange);
        };
    }, []);

    // Handle tag selection
    const handleTagChange = (tag) => {
        if (tags.includes(tag)) {
            setTags(tags.filter((t) => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    // Handle cover image change
    const handleCoverImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setCoverImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    // Handle additional images change
    const handleAdditionalImagesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length) {
            setAdditionalImages((prev) => [...prev, ...files]);
            Promise.all(
                files.map(
                    (f) =>
                        new Promise((res) => {
                            const r = new FileReader();
                            r.onloadend = () => res(r.result);
                            r.readAsDataURL(f);
                        })
                )
            ).then((imgs) =>
                setAdditionalImagePreviews((prev) => [...prev, ...imgs])
            );
        }
    };

    const removeAdditionalImage = (i) => {
        setAdditionalImages((prev) => prev.filter((_, idx) => idx !== i));
        setAdditionalImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
    };

    // Handle downloadable file change
    const handleDownloadFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDownloadFile(file);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!coverImage) return toast.error(translations[language].selectCoverImage);
        if (!category) return toast.error(translations[language].selectCategoryError);

        try {
            setLoading(true);
            setUploadProgress(0);

            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('tags', JSON.stringify(tags));
            formData.append('coverImage', coverImage);
            additionalImages.forEach((img) => formData.append('additionalImages', img));

            if (downloadFile) {
                formData.append('downloadFile', downloadFile);
            }

            const simulateProgress = () => {
                setUploadProgress((prev) => {
                    if (prev < 20) return prev + 1;
                    if (prev < 70) return prev + 0.5;
                    return prev;
                });
            };

            const progressInterval = setInterval(simulateProgress, 100);

            await api.post('/api/assets', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(Math.min(percentCompleted * 0.75, 75));
                },
            });

            clearInterval(progressInterval);
            setUploadProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 500));

            toast.success(translations[language].successMessage);
            navigate('/my-assets');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || translations[language].errorMessage);
        } finally {
            setLoading(false);
            if (!uploadProgress) {
                setUploadProgress(0);
            }
        }
    };

    return (
        <div className="upload-asset">
            <h1>{translations[language].uploadAsset}</h1>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="cover-group">
                        <label>{translations[language].coverImage}</label>
                        <label
                            className="cover-input-wrapper"
                            aria-label={translations[language].clickToUpload}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverImageChange}
                                required
                                aria-label={translations[language].clickToUpload}
                            />
                            {coverImagePreview ? (
                                <img
                                    src={coverImagePreview}
                                    alt={`Preview: ${name || 'Unnamed Asset'}`}
                                />
                            ) : (
                                <div className="cover-placeholder">
                                    {translations[language].clickToUpload}
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
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{translations[language].description}</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{translations[language].category}</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
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
                                    {availableTags.map((tag) => (
                                        <div
                                            key={tag}
                                            className={`tag-checkbox ${
                                                tags.includes(tag) ? 'selected' : ''
                                            }`}
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
                                <p className="tags-help">
                                    {translations[language].optionalTags}
                                </p>
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
                            aria-label={translations[language].dragDropFile}
                        />
                        {!downloadFile && (
                            <p className="drag-drop-text">
                                {translations[language].dragDropFile}
                            </p>
                        )}
                        {downloadFile && (
                            <div className="selected-file">
                                <p>
                                    <strong>{translations[language].selectedFile}</strong>{' '}
                                    {downloadFile.name}{' '}
                                    <span className="file-size">
                                        ({(downloadFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                    <p className="file-help">
                        {translations[language].fileHelp}
                        {category && (
                            <span className="file-types-allowed">
                                <br />
                                {translations[language].fileFormats}{' '}
                                {FILE_TYPE_HELP[category]}
                            </span>
                        )}
                    </p>
                </div>

                <div className="form-group full-width">
                    <label>{translations[language].additionalImages}</label>
                    <div className="additional-images-input">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            id="additionalImages"
                            onChange={handleAdditionalImagesChange}
                            className="additional-images-file"
                            aria-label={translations[language].dragDropImages}
                        />
                        <label
                            htmlFor="additionalImages"
                            className="additional-images-label"
                        >
                            <div
                                className="upload-icon"
                                role="img"
                                aria-label="Add image icon"
                            >
                                +
                            </div>
                            <p>{translations[language].dragDropImages}</p>
                        </label>
                    </div>
                </div>

                {additionalImagePreviews.length > 0 && (
                    <div className="additional-images-preview">
                        {additionalImagePreviews.map((src, i) => (
                            <div key={i} className="preview-item">
                                <img
                                    src={src}
                                    alt={`Preview ${i + 1} for ${name || 'asset'}`}
                                />
                                <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={() => removeAdditionalImage(i)}
                                    aria-label={`Remove image ${i + 1}`}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="progress-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                        <div className="progress-text">
                            {uploadProgress < 75
                                ? `${Math.round(uploadProgress)}% ${translations[language].uploadingFiles}`
                                : uploadProgress === 100
                                ? translations[language].completed
                                : translations[language].processing}
                        </div>
                    </div>
                )}
                <button
                    type="submit"
                    className="btn btn-primary submit-btn"
                    disabled={loading}
                >
                    {loading ? translations[language].uploading : translations[language].submit}
                </button>
            </form>
        </div>
    );
};

export default UploadAsset;