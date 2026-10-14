const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Por favor añade un nombre de usuario'],
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Por favor añade tu nombre y apellidos']
    },
    email: {
        type: String,
        required: [true, 'Por favor añade un email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Por favor añade una contraseña']
    },
    profileImage: {
        type: String,
        default: '' // URL de la imagen de perfil
    },
    birthday: {
        type: Date,
        required: false
    },
    country: {
        type: String,
        required: false
    }
},
{
    timestamps: true
})

module.exports = mongoose.model('User', userSchema)