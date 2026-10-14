const asyncHandler = require('express-async-handler');
const Comment = require('../models/commentModel');
const Asset = require('../models/assetModel');
const User = require('../models/userModel');

// @desc    Crear un nuevo comentario
// @route   POST /api/assets/:assetId/comments
// @access  Private
const createComment = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const { assetId } = req.params;
    
    if (!text) {
        res.status(400);
        throw new Error('Por favor escribe un comentario');
    }
    
    // Verificar que el asset existe
    const asset = await Asset.findById(assetId);
    if (!asset) {
        res.status(404);
        throw new Error('Asset no encontrado');
    }
    
    // Crear el comentario
    const comment = await Comment.create({
        user: req.user.id,
        asset: assetId,
        text
    });
    
    // Obtener datos del usuario para la respuesta
    const commentWithUser = await Comment.findById(comment._id).populate({
        path: 'user',
        select: 'username name profileImage'
    });
    
    res.status(201).json(commentWithUser);
});

// @desc    Obtener comentarios de un asset
// @route   GET /api/assets/:assetId/comments
// @access  Public
const getAssetComments = asyncHandler(async (req, res) => {
    const { assetId } = req.params;
    
    // Verificar que el asset existe
    const asset = await Asset.findById(assetId);
    if (!asset) {
        res.status(404);
        throw new Error('Asset no encontrado');
    }
    
    // Obtener comentarios con datos de usuario
    const comments = await Comment.find({ asset: assetId })
        .populate({
            path: 'user',
            select: 'username name profileImage'
        })
        .sort({ createdAt: -1 }); // Más recientes primero
    
    res.status(200).json(comments);
});

module.exports = {
    createComment,
    getAssetComments
};