import axios from 'axios';

// Determina la URL base según el entorno
const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000'  // 👈 Tu backend local (ajusta el puerto si es otro)
  : 'https://digitalforge-ua-backend.onrender.com'; // 👈 Producción
  
// Crea una instancia de axios con la configuración adecuada
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Esto es importante para cookies de autenticación
});

export default api;