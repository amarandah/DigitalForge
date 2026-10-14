const asyncHandler = require('express-async-handler');
const Asset = require('../models/assetModel');
const User = require('../models/userModel');
const path = require('path');

// @desc    Crear un nuevo asset
// @route   POST /api/assets
// @access  Private
const createAsset = asyncHandler(async (req, res) => {
    const { name, description, category, tags } = req.body;
    
    if (!name || !description || !category) {
        res.status(400);
        throw new Error('Por favor rellena todos los campos');
    }

    const validCategories = ['3D', '2D', 'Add-ons', 'Audio', 'Video'];
    if (!validCategories.includes(category)) {
        res.status(400);
        throw new Error('Categoría inválida');
    }

    if (!req.dropboxFiles || !req.dropboxFiles.coverImage) {
        res.status(400);
        throw new Error('Error en la subida de la imagen de portada a Dropbox');
    }

    console.log('💾 Guardando asset en la base de datos');

    try {
        const coverImageUrl = req.dropboxFiles.coverImage.url;
        const additionalImageUrls = req.dropboxFiles.additionalImages.map(img => img.url);

        let parsedTags = tags;
        if (typeof tags === 'string') {
            try {
                parsedTags = JSON.parse(tags);
            } catch (e) {
                parsedTags = tags.split(',').map(tag => tag.trim());
            }
        }
        
        // Construir el objeto de asset
        const assetData = {
            user: req.user.id,
            name,
            description,
            category,
            coverImage: coverImageUrl,
            additionalImages: additionalImageUrls,
            tags: parsedTags || []
        };
        
        // Añadir el archivo descargable si existe
        if (req.dropboxFiles.downloadFile) {
            console.log('💾 Añadiendo archivo descargable al asset');
            assetData.downloadFile = {
                url: req.dropboxFiles.downloadFile.url,
                name: req.dropboxFiles.downloadFile.name,
                size: req.dropboxFiles.downloadFile.size,
                path: req.dropboxFiles.downloadFile.path
            };
        }
        
        console.log('💾 Datos del asset preparados:', assetData);
        const asset = await Asset.create(assetData);

        console.log('✅ Asset creado:', asset._id);
        res.status(201).json(asset);
    } catch (error) {
        console.error('❌ Error al crear asset en la base de datos:', error);
        res.status(500);
        throw new Error('Error al guardar el asset en la base de datos');
    }
});

// @desc    Obtener assets (todos o filtrados)
// @route   GET /api/assets
// @access  Public
const getAssets = asyncHandler(async (req, res) => {
    const { search, category } = req.query

    let filter = {};
    if (search) {
        filter = {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        };
    }
    if (category) {
        filter.category = category
    }
    const assets = await Asset.find(filter)
    res.status(200).json(assets)
});

// @desc    Obtener los assets del usuario logueado
// @route   GET /api/assets/my-assets
// @access  Private
const getMyAssets = asyncHandler(async (req, res) => {
    const assets = await Asset.find({ user: req.user.id });
    console.log(`📋 Assets del usuario ${req.user.id} encontrados:`, assets.length);
    res.status(200).json(assets);
});

// @desc    Obtener un asset específico por ID
// @route   GET /api/assets/:id
// @access  Public
const getAssetById = asyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id).populate('user', 'username name profileImage');

    if (!asset) {
        res.status(404);
        throw new Error('Asset no encontrado');
    }

    if (!asset.likesCount || asset.likesCount !== asset.likes.length) {
        asset.likesCount = asset.likes.length;
        await asset.save();
    }

    res.status(200).json(asset);
});

// @desc    Dar/quitar like a un asset
// @route   PUT /api/assets/:id/like
// @access  Private
const toggleLike = asyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
        res.status(404);
        throw new Error('Asset no encontrado');
    }

    const alreadyLiked = asset.likes.includes(req.user.id);

    if (alreadyLiked) {
        asset.likes = asset.likes.filter(userId => userId.toString() !== req.user.id.toString());
        asset.likesCount = asset.likes.length;
        await asset.save();

        res.status(200).json({
            liked: false,
            likesCount: asset.likesCount
        });
    } else {
        asset.likes.push(req.user.id);
        asset.likesCount = asset.likes.length;
        await asset.save();

        res.status(200).json({
            liked: true,
            likesCount: asset.likesCount
        });
    }
});

// @desc    Verificar si el usuario ha dado like a un asset
// @route   GET /api/assets/:id/like
// @access  Private
const checkLike = asyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
        res.status(404);
        throw new Error('Asset no encontrado');
    }

    const liked = asset.likes.includes(req.user.id);

    res.status(200).json({
        liked,
        likesCount: asset.likesCount
    });
});

// ✅ NUEVO: Editar un asset existente
// @desc    Actualizar un asset existente
// @route   PUT /api/assets/:id
// @access  Private
const updateAsset = asyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
        res.status(404);
        throw new Error('Asset no encontrado');
    }

    if (asset.user.toString() !== req.user.id) {
        res.status(403);
        throw new Error('No autorizado para editar este asset');
    }

    const { name, description, category, tags } = req.body;

    if (!name || !description || !category) {
        res.status(400);
        throw new Error('Por favor rellena todos los campos obligatorios');
    }

    const validCategories = ['3D', '2D', 'Add-ons', 'Audio', 'Video'];
    if (!validCategories.includes(category)) {
        res.status(400);
        throw new Error('Categoría inválida');
    }

    asset.name = name;
    asset.description = description;
    asset.category = category;

    let parsedTags = tags;
    if (typeof tags === 'string') {
        try {
            parsedTags = JSON.parse(tags);
        } catch (e) {
            parsedTags = tags.split(',').map(tag => tag.trim());
        }
    }
    asset.tags = parsedTags || [];

    if (req.dropboxFiles?.coverImage) {
        asset.coverImage = req.dropboxFiles.coverImage.url;
    }

    if (req.dropboxFiles?.additionalImages?.length > 0) {
        asset.additionalImages = req.dropboxFiles.additionalImages.map(img => img.url);
    }

    if (req.dropboxFiles?.downloadFile) {
        console.log('💾 Actualizando archivo descargable del asset');
        asset.downloadFile = {
            url: req.dropboxFiles.downloadFile.url,
            name: req.dropboxFiles.downloadFile.name,
            size: req.dropboxFiles.downloadFile.size,
            path: req.dropboxFiles.downloadFile.path
        };
    }


    const updated = await asset.save();
    res.status(200).json(updated);
});

// @desc    Eliminar un asset
// @route   DELETE /api/assets/:id
// @access  Private
const deleteAsset = asyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
        res.status(404);
        throw new Error('Asset no encontrado');
    }

    // Verificar que el usuario sea el propietario del asset
    if (asset.user.toString() !== req.user.id) {
        res.status(403);
        throw new Error('No tienes permiso para eliminar este asset');
    }

    // Eliminar comentarios asociados al asset
    const Comment = require('../models/commentModel');
    await Comment.deleteMany({ asset: asset._id });

    try {
        // Obtener el cliente de Dropbox - CORREGIDO AQUÍ
        const dropboxTokenService = require('../services/dropboxTokenService');
        const validToken = await dropboxTokenService.getValidToken();
        const { Dropbox } = require('dropbox');
        const dbx = new Dropbox({ accessToken: validToken });

        // Eliminar la carpeta en Dropbox
        const sanitizedName = asset.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const assetFolderPath = `/assets/${sanitizedName}`;

        try {
            await dbx.filesDeleteV2({ path: assetFolderPath });
            console.log(`✅ Carpeta ${assetFolderPath} eliminada de Dropbox`);
        } catch (error) {
            console.error('❌ Error al eliminar la carpeta de Dropbox:', error);
            // Continuamos con la eliminación del asset incluso si hay un error en Dropbox
        }

        // Eliminar el asset de la base de datos
        await asset.deleteOne();
        console.log(`✅ Asset ${asset._id} eliminado correctamente`);

        res.status(200).json({ id: req.params.id, message: 'Asset eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error al eliminar asset:', error);
        res.status(500);
        throw new Error('Error al eliminar el asset');
    }
});

// Añadir esta nueva función al final (antes del module.exports)

// @desc    Obtener assets por ID de usuario
// @route   GET /api/assets/user/:userId
// @access  Public
const getAssetsByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    // Verificar si el usuario existe
    const userExists = await User.findById(userId);
    if (!userExists) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }
    
    // Buscar assets de ese usuario
    const assets = await Asset.find({ user: userId });
    res.status(200).json(assets);
});



// @desc    Obtener assets descargados por el usuario logueado
// @route   GET /api/assets/downloaded-assets
// @access  Private
const getDownloadedAssets = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user.id);
  
    const downloadedAssets = await Asset.find({ downloadedBy: userId });
  
    res.status(200).json(downloadedAssets);
});



// @desc    Registrar la descarga de un asset por un usuario
// @route   POST /api/assets/:id/download
// @access  Private
const registerDownload = asyncHandler(async (req, res) => {
    const assetId = req.params.id;
    const userId = req.user.id;

    const asset = await Asset.findById(assetId);

    if (!asset) {
        res.status(404);
        throw new Error('Asset no encontrado');
    }

    // Evitar duplicados en el registro de descargas
    if (!asset.downloadedBy.includes(userId)) {
        asset.downloadedBy.push(userId);
        asset.downloadsCount = asset.downloadedBy.length;
        await asset.save();
    }

    res.status(200).json({ message: 'Descarga registrada correctamente' });
});

// Actualizar el module.exports al final del archivo para incluir la nueva función
module.exports = {
    createAsset,
    getAssets,
    getMyAssets,
    getAssetById,
    getAssetsByUserId,
    toggleLike,
    checkLike,
    updateAsset,
    deleteAsset,
    getDownloadedAssets,
    registerDownload
};
