import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import { logout, reset } from '../features/auth/authSlice';
import './Account.css'
import api from '../utils/api';

function Account() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Estado para el idioma
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferred-language') || 'es';
  });
  
  // Objeto con traducciones
  const translations = useMemo(() => {
     return {
       es:  {
      userNotFound: 'No se encontró el ID del usuario',
      invalidBirthday: 'Fecha de nacimiento inválida',
      loadError: 'Error al cargar los datos del usuario',
      imageSizeError: 'La imagen no puede superar los 5MB',
      uploadError: 'No se pudo actualizar la imagen de perfil, pero se guardarán los demás cambios',
      passwordRequired: 'Debes introducir tu contraseña actual para confirmar los cambios',
      confirmPasswordRequired: 'Debes confirmar tu nueva contraseña',
      noChanges: 'No se han realizado cambios',
      imageError: 'Error al subir la imagen de perfil',
      profileUpdated: 'Perfil actualizado correctamente',
      loginAgain: 'Por favor, inicia sesión nuevamente con tus nuevos datos',
      invalidPassword: 'Contraseña incorrecta. No se pudieron guardar los cambios.',
      profileImageAlt: 'Imagen de perfil',
      imageNotAvailable: 'Imagen no disponible',
      changePhoto: 'Cambiar foto',
      pendingImage: 'Imagen pendiente de guardar',
      username: 'Nombre de usuario',
      fullName: 'Nombre completo',
      email: 'Email',
      birthday: 'Fecha de nacimiento',
      country: 'País',
      enterCountry: 'Ingresa tu país',
      newPassword: 'Nueva contraseña (opcional)',
      leaveBlank: 'Dejar en blanco para mantener la actual',
      confirmWithPassword: 'Confirmar con contraseña actual *',
      enterCurrentPassword: 'Introduce tu contraseña actual para confirmar cambios',
      requiredField: '* Necesario para guardar cualquier cambio',
      saving: 'Guardando...',
      saveChanges: 'Guardar cambios'
    },
    en: {
      userNotFound: 'User ID not found',
      invalidBirthday: 'Invalid birthday date',
      loadError: 'Error loading user data',
      imageSizeError: 'Image cannot exceed 5MB',
      uploadError: 'Profile image could not be updated, but other changes will be saved',
      passwordRequired: 'You must enter your current password to confirm changes',
      confirmPasswordRequired: 'You must confirm your new password',
      noChanges: 'No changes have been made',
      imageError: 'Error uploading profile image',
      profileUpdated: 'Profile updated successfully',
      loginAgain: 'Please log in again with your new credentials',
      invalidPassword: 'Incorrect password. Changes could not be saved.',
      profileImageAlt: 'Profile image',
      imageNotAvailable: 'Image not available',
      changePhoto: 'Change photo',
      pendingImage: 'Pending image to save',
      username: 'Username',
      fullName: 'Full name',
      email: 'Email',
      birthday: 'Date of birth',
      country: 'Country',
      enterCountry: 'Enter your country',
      newPassword: 'New password (optional)',
      leaveBlank: 'Leave blank to keep current password',
      confirmWithPassword: 'Confirm with current password *',
      enterCurrentPassword: 'Enter your current password to confirm changes',
      requiredField: '* Required to save any changes',
      saving: 'Saving...',
      saveChanges: 'Save changes'
    }
    };
   }, []);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    birthday: '',
    country: '',
    password: '',
    confirmPassword: ''
  });
  
  const [originalData, setOriginalData] = useState({
    username: '',
    name: '',
    email: '',
    birthday: '',
    country: ''
  });
  
  const [profileImage, setProfileImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pendingImageUpdate, setPendingImageUpdate] = useState(false);
  const [dataChanged, setDataChanged] = useState(false);
  
  const { username, name, email, birthday, country, password, confirmPassword } = formData;
  
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
      return;
    }
    
    const loadUserData = async () => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          }
        };
        
        // Usar el ID del usuario para obtener sus datos
        if (!user || !user._id) {
          throw new Error(translations[language].userNotFound);
        }
        
        console.log('Objeto usuario completo:', user);
        console.log('Intentando cargar datos del usuario con ID:', user._id);
        
        // Utilizar el endpoint con el ID del usuario
        const response = await api.get(`/api/users/${user._id}`, config);
        console.log('Respuesta completa del servidor:', response);
        
        // Los datos del usuario vienen en response.data
        const userData = response.data;
        console.log('Datos del usuario procesados:', userData);
        
        // Formatear la fecha de nacimiento para el input date si existe
        let formattedBirthday = '';
        if (userData.birthday) {
          // Asegurarse de que la fecha sea un objeto Date válido
          const date = new Date(userData.birthday);
          // Solo formatear si es una fecha válida
          if (!isNaN(date.getTime())) {
            formattedBirthday = date.toISOString().split('T')[0];
            console.log('Fecha formateada:', formattedBirthday);
          } else {
            console.warn(translations[language].invalidBirthday, userData.birthday);
          }
        } else if (user.birthday) {
          // Si no está en userData pero sí en user (estado de Redux)
          const date = new Date(user.birthday);
          if (!isNaN(date.getTime())) {
            formattedBirthday = date.toISOString().split('T')[0];
            console.log('Usando fecha de Redux:', formattedBirthday);
          }
        }
        
        // Preparar datos del formulario con valores predeterminados si no existen
        const formattedUserData = {
          username: userData.username || user.username || '',
          name: userData.name || user.name || '',
          email: userData.email || user.email || '',
          birthday: formattedBirthday,
          country: userData.country || user.country || '', 
          password: '',
          confirmPassword: ''
        };
        
        console.log('Datos formateados para el formulario:', formattedUserData);
        
        // Actualizar el estado del formulario con los datos obtenidos
        setFormData(formattedUserData);
        
        // Guardar los datos originales para comparar cambios
        setOriginalData({
          username: formattedUserData.username,
          name: formattedUserData.name,
          email: formattedUserData.email,
          birthday: formattedBirthday,
          country: formattedUserData.country
        });
        
        // También actualizar la imagen de perfil si existe
        if (userData.profileImage) {
          console.log('Imagen de perfil encontrada:', userData.profileImage);
          setProfileImage(userData.profileImage);
        }
      } catch (error) {
        console.error(translations[language].loadError, error);
        console.error('Detalles del error:', error.response?.data || error.message);
        
        // Si falla la carga desde la API, intentar usar los datos del estado Redux
        if (user) {
          console.log('Usando datos del estado de Redux como respaldo');
          
          // Formatear fecha si existe en el estado
          let formattedBirthday = '';
          if (user.birthday) {
            const date = new Date(user.birthday);
            if (!isNaN(date.getTime())) {
              formattedBirthday = date.toISOString().split('T')[0];
            }
          }
          
          const fallbackUserData = {
            username: user.username || '',
            name: user.name || '',
            email: user.email || '',
            birthday: formattedBirthday,
            country: user.country || '',
            password: '',
            confirmPassword: ''
          };
          
          setFormData(fallbackUserData);
          setOriginalData({
            username: fallbackUserData.username,
            name: fallbackUserData.name,
            email: fallbackUserData.email,
            birthday: fallbackUserData.birthday,
            country: fallbackUserData.country
          });
          
          if (user.profileImage) {
            setProfileImage(user.profileImage);
          }
        } else {
          toast.error(translations[language].loadError);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user, navigate, language, translations]);
  
  // Verificar si se han realizado cambios en los datos del formulario
  useEffect(() => {
    const hasChanges = 
      username !== originalData.username ||
      name !== originalData.name ||
      email !== originalData.email ||
      birthday !== originalData.birthday ||
      country !== originalData.country ||
      password !== '' ||
      imageFile !== null;
    
    setDataChanged(hasChanges);
  }, [formData, imageFile, originalData, username, name, email, birthday, country, password]);
  
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(translations[language].imageSizeError);
        return;
      }
      
      setImageFile(file);
      setPendingImageUpdate(true); // Indicar que hay una imagen pendiente
      
      // Crear un preview de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const uploadImage = async () => {
    if (!imageFile) return null;
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`,
        }
      };
      
      console.log('Subiendo imagen de perfil...');
      const response = await api.put('/api/users/profile-image', formData, config);
      console.log('Imagen subida correctamente:', response.data);
      return response.data.profileImage;
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      // En lugar de lanzar error, retornamos null y mostramos un toast
      toast.error(translations[language].uploadError);
      return null;
    }
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que se haya introducido la contraseña de confirmación
    if (!confirmPassword) {
      toast.error(translations[language].passwordRequired);
      return;
    }
    
    // Si se está cambiando la contraseña, validar que ambos campos estén rellenos
    if (password && !confirmPassword) {
      toast.error(translations[language].confirmPasswordRequired);
      return;
    }
    
    // Verificar si realmente se han hecho cambios
    if (!dataChanged && !imageFile) {
      toast.info(translations[language].noChanges);
      return;
    }
    
    try {
      setSubmitLoading(true);
      
      // Si hay una nueva imagen, subirla primero
      let newProfileImageUrl = null;
      if (imageFile) {
        try {
          newProfileImageUrl = await uploadImage();
        } catch (error) {
          toast.error(translations[language].imageError);
          // Continuamos con la actualización del resto de datos
        }
      }
      
      // Preparar datos para actualizar
      const updateData = {
        username,
        name,
        email,
        birthday: birthday || undefined,
        country: country || '',
        confirmPassword  // Enviar la contraseña de confirmación
      };
      
      // Solo incluir la nueva contraseña si se ha rellenado
      if (password) {
        updateData.password = password;
      }
      
      console.log('Enviando datos de actualización:', updateData);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        }
      };
      
      const response = await api.put('/api/users/profile', updateData, config);
      console.log('Respuesta de actualización:', response.data);
      
      // Actualizar usuario en localStorage y en el estado de Redux
      const updatedUser = {
        ...user,
        username: response.data.username,
        name: response.data.name,
        email: response.data.email,
        birthday: response.data.birthday,
        country: response.data.country,
        token: response.data.token
      };
      
      // Si se subió una nueva imagen, actualizar también ese campo
      if (newProfileImageUrl) {
        updatedUser.profileImage = newProfileImageUrl;
        // Actualizar el estado actual
        setProfileImage(newProfileImageUrl);
      }
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Actualizar los datos originales para reflejar los cambios
      setOriginalData({
        username: username,
        name: name,
        email: email,
        birthday: birthday,
        country: country
      });
      
      // Limpiar campos de contraseña y vista previa después de guardar
      setFormData({
        ...formData,
        password: '',
        confirmPassword: ''
      });
      
      setImageFile(null);
      setImagePreview('');
      setPendingImageUpdate(false); // Limpiar la bandera de imagen pendiente
      
      toast.success(translations[language].profileUpdated);
      
      // Si se cambió el email o la contraseña, hacer logout para que vuelva a iniciar sesión
      if (email !== user.email || password) {
        toast.info(translations[language].loginAgain);
        setTimeout(() => {
          dispatch(logout());
          dispatch(reset());
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      if (error.response?.status === 401) {
        toast.error(translations[language].invalidPassword);
      } else {
        toast.error(error.response?.data?.message || translations[language].loadError);
      }
    } finally {
      setSubmitLoading(false);
    }
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  // Determinar qué imagen mostrar en la vista previa
  const displayedImage = imagePreview || profileImage;
  
  return (
    <div className="account-page">
      <div className="account-container">
        <div className="content-wrapper"></div>
        <section className="content">
          <form onSubmit={onSubmit}>
            {/* Sección de imagen de perfil */}
            <div className="profile-image-container">
              <div className="profile-image">
                {displayedImage ? (
                  <img
                    src={displayedImage}
                    alt={translations[language].profileImageAlt}
                    className="profile-image__img"
                    onError={(e) => {
                      e.target.src = '/digital.png';
                      e.target.alt = translations[language].imageNotAvailable;
                    }}
                  />
                ) : (
                  <div className="profile-image__placeholder">
                    {name ? name.charAt(0).toUpperCase() : username ? username.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
              </div>
              
              <div className="profile-image-upload">
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profile-image" className="btn">
                  {translations[language].changePhoto}
                </label>
                {pendingImageUpdate && (
                  <div className="pending-image-badge">
                    {translations[language].pendingImage}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="username">{translations[language].username}</label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={onChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="name">{translations[language].fullName}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={onChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">{translations[language].email}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="birthday">{translations[language].birthday}</label>
              <input
                type="date"
                id="birthday"
                name="birthday"
                value={birthday}
                onChange={onChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="country">{translations[language].country}</label>
              <input
                type="text"
                id="country"
                name="country"
                value={country}
                onChange={onChange}
                onFocus={() => console.log('País al hacer focus:', country)}
                placeholder={translations[language].enterCountry}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">{translations[language].newPassword}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder={translations[language].leaveBlank}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="required-field">{translations[language].confirmWithPassword}</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                placeholder={translations[language].enterCurrentPassword}
                required
              />
              <small className="form-text">{translations[language].requiredField}</small>
            </div>
            
            <div className="form-buttons">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={submitLoading || (!dataChanged && !imageFile)}
              >
                {submitLoading ? translations[language].saving : translations[language].saveChanges}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Account;