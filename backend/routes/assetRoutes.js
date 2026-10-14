const express = require('express');
const router = express.Router();
const { 
    createAsset, 
    getAssets, 
    getMyAssets, 
    getAssetById,
    toggleLike,
    checkLike,
    updateAsset,
    deleteAsset,
    getAssetsByUserId,
    getDownloadedAssets,
    registerDownload
} = require('../controllers/assetController');
const { protect } = require('../middleware/authMiddleware');
const { upload, uploadAny, uploadToDropbox } = require('../middleware/dropboxMiddleware');

// Importar rutas de comentarios
const commentRoutes = require('./commentRoutes');

// Configurar los campos para múltiples imágenes y archivo descargable
const uploadFields = [
  { name: 'coverImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 10 }, // Límite de 10 imágenes adicionales
  { name: 'downloadFile', maxCount: 1 }       // Un solo archivo descargable
];

// Re-enrutar a las rutas de comentarios
router.use('/:assetId/comments', commentRoutes);

// Rutas para likes
router.route('/:id/like')
    .get(protect, checkLike)
    .put(protect, toggleLike);

// Crear asset
router.post('/', protect, uploadAny.fields(uploadFields), uploadToDropbox, createAsset);
router.post('/:id/download', protect, registerDownload);  // registrar descarga del asset

// Obtener assets
router.get('/', getAssets);
router.get('/downloaded-assets', protect, getDownloadedAssets);
router.get('/user/:userId', getAssetsByUserId);
router.get('/my-assets', protect, getMyAssets);
router.get('/:id', getAssetById);

// ✅ Editar asset
router.put('/:id', protect, uploadAny.fields(uploadFields), uploadToDropbox, updateAsset);

// Eliminar asset
router.delete('/:id', protect, deleteAsset);

module.exports = router;