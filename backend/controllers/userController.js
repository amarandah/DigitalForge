const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const { Dropbox } = require('dropbox')
const fs = require('fs')
const path = require('path')
const dropboxTokenService = require('../services/dropboxTokenService')

// Función para obtener una instancia de Dropbox con un token válido
const getDropboxClient = async () => {
    const validToken = await dropboxTokenService.getValidToken();
    return new Dropbox({ accessToken: validToken });
};

// Función para preparar la carpeta del usuario en Dropbox
const setupUserFolder = async (userId, username) => {
    try {
        const dbx = await getDropboxClient();
        
        // Crear la carpeta base /users si no existe
        try {
            await dbx.filesGetMetadata({ path: '/users' });
            console.log('✅ Carpeta base /users encontrada');
        } catch (error) {
            if (error.status === 409 || (error.error && error.error.path && error.error.path['.tag'] === 'not_found')) {
                console.log('📁 Creando carpeta base /users');
                await dbx.filesCreateFolderV2({ path: '/users' });
                console.log('✅ Carpeta base /users creada correctamente');
            } else {
                throw error;
            }
        }
        
        // Sanitizar el nombre de usuario para usarlo como nombre de carpeta
        const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
        const userFolderPath = `/users/${sanitizedUsername}_${userId}`;
        
        // Crear carpeta del usuario
        try {
            await dbx.filesGetMetadata({ path: userFolderPath });
            console.log(`✅ Carpeta ${userFolderPath} encontrada`);
        } catch (error) {
            if (error.status === 409 || (error.error && error.error.path && error.error.path['.tag'] === 'not_found')) {
                console.log(`📁 Creando carpeta ${userFolderPath}`);
                await dbx.filesCreateFolderV2({ path: userFolderPath });
                console.log(`✅ Carpeta ${userFolderPath} creada correctamente`);
            } else {
                throw error;
            }
        }
        
        // Copiar imagen por defecto a la carpeta del usuario
        const defaultImagePath = path.join(__dirname, '../data/default_profile.png');
        if (fs.existsSync(defaultImagePath)) {
            const fileContent = fs.readFileSync(defaultImagePath);
            const profileImagePath = `${userFolderPath}/profile.png`;
            
            console.log(`📤 Copiando imagen de perfil por defecto a: ${profileImagePath}`);
            const uploadResult = await dbx.filesUpload({
                path: profileImagePath,
                contents: fileContent,
                mode: { '.tag': 'overwrite' }
            });
            
            // Crear un enlace compartido
            const sharedLink = await dbx.sharingCreateSharedLinkWithSettings({
                path: profileImagePath
            });
            
            // Modificar la URL para acceso directo
            const directLink = sharedLink.result.url.replace('dl=0', 'dl=1');
            
            console.log('✅ Imagen de perfil subida:', directLink);
            return directLink;
        } else {
            console.error('❌ No se encontró la imagen por defecto');
            return '';
        }
    } catch (error) {
        console.error('❌ Error configurando carpeta de usuario en Dropbox:', error);
        return '';
    }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const {username, name, email, password} = req.body

    if(!username || !name || !email || !password){
        res.status(400)
        throw new Error('Por favor rellena todos los campos')
    }

    // Check if user exists by email
    const userExistsByEmail = await User.findOne({email})
    if(userExistsByEmail){
        res.status(400)
        throw new Error('Este email ya está registrado')
    }

    // Check if username is already taken
    const userExistsByUsername = await User.findOne({username})
    if(userExistsByUsername){
        res.status(400)
        throw new Error('Este nombre de usuario ya está en uso')
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user (sin imagen de perfil todavía)
    const user = await User.create({
        username,
        name,
        email,
        password: hashedPassword
    })

    if (user) {
        // Configurar carpeta del usuario y obtener URL de la imagen de perfil
        const profileImageUrl = await setupUserFolder(user._id, username);
        
        // Actualizar el usuario con la URL de la imagen de perfil
        if (profileImageUrl) {
            user.profileImage = profileImageUrl;
            await user.save();
        }

        // Enviar respuesta
        res.status(201).json({
            _id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage,
            token: generateToken(user._id),
        })
    } else {
        res.status(400)
        throw new Error('Datos de usuario no válidos')
    }
})

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body

    //Check for user email
    const user = await User.findOne({email})

    if(user && (await bcrypt.compare(password, user.password))){
        res.json({
            _id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage,
            token: generateToken(user._id),
        })
    }else {
        res.status(400)
        throw new Error('Datos de usuario no válidos')
    }
})

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    res.status(200).json({
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        birthday: user.birthday,
        country: user.country
    });
})


// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)

    if (!user) {
        res.status(404)
        throw new Error('Usuario no encontrado')
    }

    // Verificar la contraseña actual
    const { confirmPassword } = req.body;
    if (!confirmPassword) {
        res.status(400)
        throw new Error('Se requiere la contraseña actual para confirmar los cambios')
    }

    // Verificar que la contraseña actual sea correcta
    const isMatch = await bcrypt.compare(confirmPassword, user.password);
    if (!isMatch) {
        res.status(401)
        throw new Error('Contraseña incorrecta')
    }

    // Check if username already exists if username is being changed
    if (req.body.username && req.body.username !== user.username) {
        const usernameExists = await User.findOne({ username: req.body.username })
        if (usernameExists) {
            res.status(400)
            throw new Error('Este nombre de usuario ya está en uso')
        }
    }

    // Check if email already exists if email is being changed
    if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email })
        if (emailExists) {
            res.status(400)
            throw new Error('Este email ya está registrado')
        }
    }

   
      // Update the user data
    user.username = req.body.username || user.username
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email
    
    // Actualizar los campos adicionales
    if (req.body.birthday) {
        user.birthday = new Date(req.body.birthday);
    }
    user.country = req.body.country || user.country;



    if (req.body.password) {
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(req.body.password, salt)
    }

    const updatedUser = await user.save()

     res.status(200).json({
        _id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        birthday: updatedUser.birthday,
        country: updatedUser.country,  
        token: generateToken(updatedUser._id)
    })
})

// @desc    Update user profile image
// @route   PUT /api/users/profile-image
// @access  Private
const updateProfileImage = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }
    
    if (!req.file) {
        res.status(400);
        throw new Error('No se ha subido ninguna imagen');
    }
    
    try {
        const dbx = await getDropboxClient();
        
        // Sanitizar el nombre de usuario para usarlo como nombre de carpeta
        const sanitizedUsername = user.username.replace(/[^a-zA-Z0-9_-]/g, '_');
        const userFolderPath = `/users/${sanitizedUsername}_${user._id}`;
        
        // Verificar que existe la carpeta del usuario
        try {
            await dbx.filesGetMetadata({ path: userFolderPath });
        } catch (error) {
            if (error.status === 409 || (error.error && error.error.path && error.error.path['.tag'] === 'not_found')) {
                await dbx.filesCreateFolderV2({ path: userFolderPath });
            } else {
                throw error;
            }
        }
        
        // Generar un nombre único para evitar conflictos
        const timestamp = Date.now();
        const profileImagePath = `${userFolderPath}/profile_${timestamp}.png`;
        
        // Subir la nueva imagen de perfil
        const fileContent = fs.readFileSync(req.file.path);
        
        await dbx.filesUpload({
            path: profileImagePath,
            contents: fileContent,
            mode: { '.tag': 'overwrite' }
        });
        
        // Crear un enlace compartido con manejo de error si ya existe
        let directLink;
        try {
            const sharedLink = await dbx.sharingCreateSharedLinkWithSettings({
                path: profileImagePath
            });
            directLink = sharedLink.result.url.replace('dl=0', 'dl=1');
        } catch (error) {
            // Si el error es porque ya existe un enlace compartido
            if (error.status === 409 && error.error && error.error['.tag'] === 'shared_link_already_exists') {
                // Obtener los enlaces compartidos existentes
                const links = await dbx.sharingListSharedLinks({
                    path: profileImagePath,
                    direct_only: true
                });
                
                if (links.result.links && links.result.links.length > 0) {
                    directLink = links.result.links[0].url.replace('dl=0', 'dl=1');
                } else {
                    throw new Error('No se pudo obtener el enlace compartido');
                }
            } else {
                throw error;
            }
        }
        
        // Actualizar la URL de la imagen de perfil en el usuario
        user.profileImage = directLink;
        await user.save();
        
        // Eliminar el archivo temporal
        fs.unlinkSync(req.file.path);
        
        res.status(200).json({
            profileImage: directLink
        });
    } catch (error) {
        console.error('❌ Error actualizando imagen de perfil:', error);
        res.status(500);
        throw new Error('Error al actualizar la imagen de perfil');
    }
});

// @desc    Obtener datos básicos de un usuario por ID
// @route   GET /api/users/:id
// @access  Public
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('name username profileImage email birthday country');
    
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }
    
    res.status(200).json(user);
});

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    updateProfileImage,
    getUserById
}