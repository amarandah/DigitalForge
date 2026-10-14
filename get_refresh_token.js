const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

// Tus credenciales de Dropbox
const APP_KEY = 'nr2ktqxnhkocx65';
const APP_SECRET = 'ft6yw1qsx8kmv6o';
const REDIRECT_URI = `http://localhost:${port}/auth/callback`;

// URL para iniciar el flujo de OAuth
const authorizationUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${APP_KEY}&response_type=code&redirect_uri=${REDIRECT_URI}`;

app.get('/', (req, res) => {
  res.send(`
    <h1>Generador de tokens para Dropbox</h1>
    <p>Haz clic en el siguiente enlace para autorizar la aplicación:</p>
    <a href="${authorizationUrl}" target="_blank">Autorizar en Dropbox</a>
  `);
});

app.get('/auth/callback', async (req, res) => {
  try {
    // Obtener el código de autorización
    const code = req.query.code;
    
    if (!code) {
      return res.send('Faltó el código de autorización');
    }
    
    // Intercambiar el código por tokens
    const tokenResponse = await axios.post('https://api.dropboxapi.com/oauth2/token', 
      new URLSearchParams({
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': REDIRECT_URI,
        'client_id': APP_KEY,
        'client_secret': APP_SECRET
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    
    // Mostrar los tokens
    res.send(`
      <h1>Tokens obtenidos:</h1>
      <p><strong>Access Token:</strong> ${tokenResponse.data.access_token}</p>
      <p><strong>Refresh Token:</strong> ${tokenResponse.data.refresh_token}</p>
      <p><strong>Expires In:</strong> ${tokenResponse.data.expires_in} segundos</p>
      <p>Copia estos valores a tu archivo .env:</p>
      <pre>
DROPBOX_ACCESS_TOKEN=${tokenResponse.data.access_token}
DROPBOX_REFRESH_TOKEN=${tokenResponse.data.refresh_token}
      </pre>
    `);
    
    console.log('Tokens obtenidos:');
    console.log('Access Token:', tokenResponse.data.access_token);
    console.log('Refresh Token:', tokenResponse.data.refresh_token);
    console.log('Expires In:', tokenResponse.data.expires_in, 'segundos');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).send('Error al obtener los tokens: ' + (error.response?.data?.error_description || error.message));
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`
=====================================================
  Servidor para obtener tokens iniciado

  1. Abre en tu navegador: http://localhost:${port}
  2. Haz clic en el enlace para autorizar
  3. Inicia sesión en Dropbox si es necesario
  4. Autoriza la aplicación
  5. Se mostrarán los tokens - cópialos a tu .env
=====================================================
  `);
});