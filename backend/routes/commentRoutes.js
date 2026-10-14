const express = require('express');
const router = express.Router({ mergeParams: true }); // Para acceder a los parámetros de la ruta padre
const { createComment, getAssetComments } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getAssetComments)
    .post(protect, createComment);

module.exports = router;