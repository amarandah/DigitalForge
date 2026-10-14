import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { register, reset } from '../features/auth/authSlice'
import Spinner from '../components/Spinner'

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    password2: ''
  })

  // Estado para el idioma
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferred-language') || 'es';
  });
  
  // Traducciones
  const translations = useMemo(() => ({
    es: {
      title: 'Registro',
      subtitle: 'Por favor, introduce tus datos',
      username: 'Nombre de usuario',
      fullName: 'Nombre y apellidos',
      email: 'Correo electrónico',
      emailPlaceholder: 'Escribe tu email',
      password: 'Contraseña',
      passwordPlaceholder: 'Escribe tu contraseña',
      confirmPassword: 'Confirma tu contraseña',
      registerButton: 'Crear cuenta',
      passwordMismatch: 'Las contraseñas no coinciden'
    },
    en: {
      title: 'Register',
      subtitle: 'Please enter your information',
      username: 'Username',
      fullName: 'Full name',
      email: 'Email',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      confirmPassword: 'Confirm your password',
      registerButton: 'Create account',
      passwordMismatch: 'Passwords do not match'
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

  const { username, name, email, password, password2 } = formData

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isError) {
      toast.error(message)
    }

    if (isSuccess || user) {
      navigate('/')
    }

    dispatch(reset())

  }, [user, isError, isSuccess, message, navigate, dispatch])

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const onSubmit = (e) => {
    e.preventDefault()

    if (password !== password2) {
      toast.error(translations[language].passwordMismatch)
      return
    } else {
      const userData = {
        username,
        name,
        email,
        password
      }

      dispatch(register(userData))
    }
    console.log('Register submit');
  }

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <section className='heading'>
          <h1>
            <img src='/digital.png' alt={translations[language].title} style={{ height: '200px' }} />
          </h1>
          <p>{translations[language].subtitle}</p>
        </section>

        <section className='form'>
          <form onSubmit={onSubmit}>
            <div className='form-group'>
              <input 
                type='text' 
                className='form-control' 
                id='username' 
                name='username' 
                value={username} 
                placeholder={translations[language].username} 
                onChange={onChange} 
                required
              />
            </div>
            <div className='form-group'>
              <input 
                type='text' 
                className='form-control' 
                id='name' 
                name='name' 
                value={name} 
                placeholder={translations[language].fullName} 
                onChange={onChange} 
                required
              />
            </div>
            <div className='form-group'>
              <input 
                type='email' 
                className='form-control' 
                id='email' 
                name='email' 
                value={email} 
                placeholder={translations[language].emailPlaceholder} 
                onChange={onChange} 
                required
              />
            </div>
            <div className='form-group'>
              <input 
                type='password' 
                className='form-control' 
                id='password' 
                name='password' 
                value={password} 
                placeholder={translations[language].passwordPlaceholder} 
                onChange={onChange} 
                required
              />
            </div>
            <div className='form-group'>
              <input 
                type='password' 
                className='form-control' 
                id='password2' 
                name='password2' 
                value={password2} 
                placeholder={translations[language].confirmPassword} 
                onChange={onChange} 
                required
              />
            </div>

            <div className='form-group'>
              <button type='submit' className='btn btn-block'>{translations[language].registerButton}</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Register