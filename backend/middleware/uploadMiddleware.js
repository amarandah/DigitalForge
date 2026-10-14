const multer = require('multer');
const path = require('path');

// Configurar almacenamiento
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Usar una ruta absoluta en lugar de una relativa
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    // Verificar extensión
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Verificar mime type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5000000 } // 5MB máximo
});

module.exports = upload;