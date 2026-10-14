const express = require('express')
const router = express.Router()
const multer = require('multer')
const { protect } = require('../middleware/authMiddleware')
const {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    updateProfileImage,
    getUserById
} = require('../controllers/userController')

// Configuración de multer para la subida de imágenes
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'backend/temp/');
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Solo se permiten imágenes'));
        }
        cb(null, true);
    }
});

// Asegurar que existe la carpeta temp
const fs = require('fs');
const path = require('path');
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

router.post('/', registerUser)
router.get('/:id', getUserById)
router.post('/login', loginUser)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)
router.put('/profile-image', protect, upload.single('image'), updateProfileImage)

module.exports = router