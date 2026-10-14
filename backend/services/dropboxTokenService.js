// Actualizar para asegurar que siempre tenemos un token válido

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Ruta donde se guardará el token
const tokenFilePath = path.join(__dirname, '..', 'data', 'dropbox_token.json');

// Crear el directorio si no existe
const ensureDirectoryExists = () => {
  const dir = path.dirname(tokenFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Cargar token existente
const loadToken = () => {
  ensureDirectoryExists();
  
  try {
    if (fs.existsSync(tokenFilePath)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
      return tokenData;
    }
  } catch (error) {
    console.error('Error al cargar token:', error);
  }
  
  // Si no existe o hay error, devolver token inicial del .env
  return {
    access_token: process.env.DROPBOX_ACCESS_TOKEN,
    refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
    expires_at: Date.now() // Expira ahora para forzar un refresh
  };
};

// Guardar token actualizado
const saveToken = (tokenData) => {
  ensureDirectoryExists();
  
  try {
    fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData, null, 2));
    console.log('✅ Token guardado correctamente');
  } catch (error) {
    console.error('❌ Error al guardar token:', error);
  }
};

// Obtener un nuevo access token usando el refresh token
const refreshAccessToken = async () => {
  try {
    console.log('🔄 Generando nuevo token de Dropbox...');
    
    // Si falta el refresh_token en .env, usar el almacenado
    let refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
    if (!refreshToken || refreshToken === 'undefined') {
      const currentToken = loadToken();
      refreshToken = currentToken.refresh_token;
      
      // Si aún no hay refresh token, no podemos continuar
      if (!refreshToken) {
        throw new Error('No se encontró refresh_token para generar un nuevo access_token');
      }
    }
    
    const response = await axios.post('https://api.dropboxapi.com/oauth2/token', 
      new URLSearchParams({
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken,
        'client_id': process.env.DROPBOX_APP_KEY,
        'client_secret': process.env.DROPBOX_APP_SECRET
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    
    if (response.data && response.data.access_token) {
      // Calcular expiración (típicamente 4 horas)
      const expiresIn = response.data.expires_in || 14400; // 4 horas por defecto
      
      const tokenData = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshToken, // Usar nuevo refresh_token si viene, sino mantener el anterior
        expires_at: Date.now() + (expiresIn * 1000) - 300000 // 5 minutos antes para renovar con margen
      };
      
      // Guardar el nuevo token
      saveToken(tokenData);
      
      console.log('✅ Token generado correctamente');
      return tokenData.access_token;
    } else {
      throw new Error('No se pudo obtener un nuevo token');
    }
  } catch (error) {
    console.error('❌ Error al refrescar el token:', error.response?.data || error.message);
    throw error;
  }
};

// Obtener token actual o refrescarlo si está por expirar
const getValidToken = async (force = false) => {
  const tokenData = loadToken();
  
  // Si force=true o el token está por expirar/expirado, refrescar
  if (force || !tokenData.access_token || !tokenData.expires_at || Date.now() >= tokenData.expires_at) {
    try {
      return await refreshAccessToken();
    } catch (error) {
      console.error('Error al refrescar token, intentando usar el token existente:', error);
      return tokenData.access_token; // Usar el token existente como fallback
    }
  }
  
  return tokenData.access_token;
};

module.exports = {
  getValidToken,
  refreshAccessToken
};