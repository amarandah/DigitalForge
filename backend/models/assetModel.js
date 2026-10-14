const mongoose = require('mongoose');

const assetSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    name: {
        type: String,
        required: [true, 'Por favor añade un nombre'],
    },
    description: {
        type: String,
        required: [true, 'Por favor añade una descripción'],
    },
    coverImage: {
        type: String, // URL de la imagen de portada
        required: [true, 'Por favor añade una imagen de portada'],
    },
    additionalImages: [{
        type: String, // Array de URLs de imágenes adicionales
    }],
    downloadFile: {
        url: String,
        name: String,
        size: Number,
        path: String
    },
    category: {
        type: String,
        enum: ['3D', '2D', 'Add-ons', 'Audio', 'Video'], // Añadimos 'Video' a las categorías
        required: [true, 'Por favor añade una categoría'],
    },
    tags: [{
        type: String
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likesCount: {
        type: Number,
        default: 0
    },
    downloadedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    downloadsCount: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Asset', assetSchema);