const express = require('express')
const colors = require('colors')
const dotenv = require('dotenv').config()
const path = require('path')
const cors = require('cors')
const{errorHandler} = require('./middleware/errorMiddleware')
const connectDB = require('./config/db')
const dropboxTokenService = require('./services/dropboxTokenService')
const port = process.env.PORT || 5000

// Inicializar Dropbox y obtener token fresco antes de iniciar el servidor
const initializeServer = async () => {
  try {
    console.log('🔑 Inicializando token de Dropbox...')
    // Forzar la generación de un nuevo token antes de iniciar el servidor
    await dropboxTokenService.refreshAccessToken()
    
    // Continuar con el inicio normal del servidor
    connectDB()
    
    const app = express()
    
    // Configuración CORS corregida
    app.use(cors({
      origin: ['https://digitalforgeua.netlify.app', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    app.use(express.json())
    app.use(express.urlencoded({extended: false}))
    
    // Añadir un endpoint simple para verificar que el servidor está funcionando
    app.get('/', (req, res) => {
      res.json({ message: 'API de DigitalForge-UA funcionando correctamente' });
    });
    
    app.use('/api/goals', require('./routes/goalRoutes'))
    app.use('/api/users', require('./routes/userRoutes'))
    app.use('/api/assets', require('./routes/assetRoutes'))
    
    app.use(errorHandler)
    
    app.listen(port, () => {
      console.log(`✅ Servidor corriendo en el puerto ${port}`.yellow.bold)
      console.log(`Entorno: ${process.env.NODE_ENV}`)
    })
  } catch (error) {
    console.error('❌ Error al inicializar el servidor:', error)
    process.exit(1)
  }
}

initializeServer()