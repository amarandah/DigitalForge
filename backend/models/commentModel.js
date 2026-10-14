const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Asset'
    },
    text: {
        type: String,
        required: [true, 'El comentario no puede estar vacío']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);