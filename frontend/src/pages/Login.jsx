import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { login, reset } from '../features/auth/authSlice'
import Spinner from '../components/Spinner'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Estado para el idioma
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferred-language') || 'es';
  });
  
  // Traducciones
  const translations = useMemo(() => ({
    es: {
      title: 'Iniciar sesión',
      subtitle: 'Introduce los datos de tu cuenta',
      email: 'Email',
      emailPlaceholder: 'Escribe tu email',
      password: 'Contraseña',
      passwordPlaceholder: 'Escribe tu contraseña',
      loginButton: 'Iniciar Sesión',
    },
    en: {
      title: 'Log in',
      subtitle: 'Enter your account details',
      email: 'Email',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      loginButton: 'Log In',
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

  const { email, password } = formData

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
    console.log('Login submit');

    const userData = {
      email,
      password
    }

    dispatch(login(userData))
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
              <label>{translations[language].email}</label>
              <input 
                type='email' 
                className='form-control' 
                id='email' 
                name='email' 
                value={email} 
                placeholder={translations[language].emailPlaceholder} 
                onChange={onChange} 
              />
            </div>
            
            <div className='form-group'>
              <label>{translations[language].password}</label>
              <input 
                type='password' 
                className='form-control' 
                id='password' 
                name='password' 
                value={password} 
                placeholder={translations[language].passwordPlaceholder} 
                onChange={onChange} 
              />
            </div>

            <div className='form-group'>
              <button type='submit' className='btn btn-block'>{translations[language].loginButton}</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Login