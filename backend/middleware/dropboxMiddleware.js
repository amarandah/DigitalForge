const multer = require('multer');
const { Dropbox } = require('dropbox');
const fs = require('fs');
const path = require('path');
const os = require('os');
const dropboxTokenService = require('../services/dropboxTokenService');

let dbx = null; // Inicialmente nulo, se configurará antes de su uso

// Añadir estas constantes al principio del archivo, después de los require
const ALLOWED_FILE_TYPES = {
  '2D': [
    'image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp',
    'application/postscript', 'application/illustrator'
  ],
  '3D': [
    'application/octet-stream', // Para .fbx, .blend, etc.
    'model/obj', 'model/stl', 'model/gltf+json', 'model/gltf-binary',
    'application/x-blender', 'application/x-3ds'
  ],
  'Audio': [
    'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-wav', 
    'audio/webm', 'audio/aac', 'audio/flac', 'audio/x-m4a'
  ],
  'Video': [
    'video/mp4', 'video/webm', 'video/ogg', 'video/x-msvideo',
    'video/quicktime', 'video/x-matroska'
  ],
  'Add-ons': [
    'application/zip', 'application/x-zip-compressed', 'application/x-tar',
    'application/gzip', 'application/x-7z-compressed', 'application/x-rar-compressed',
    'text/plain', 'application/javascript', 'application/json',
    'text/html', 'text/css', 'application/python', 'application/x-python-code'
  ]
};

const ALLOWED_FILE_EXTENSIONS = {
  '2D': ['.jpg', '.jpeg', '.png', '.svg', '.gif', '.webp', '.ai', '.eps', '.psd'],
  '3D': ['.fbx', '.blend', '.obj', '.stl', '.gltf', '.glb', '.3ds', '.max', '.c4d', '.wrml', '.dae', '.mtl'],
  'Audio': ['.mp3', '.ogg', '.wav', '.aac', '.flac', '.m4a', '.wma', '.aiff'],
  'Video': ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv', '.flv', '.wmv'],
  'Add-ons': ['.zip', '.tar', '.gz', '.7z', '.rar', '.js', '.py', '.html', '.css', '.json', '.txt']
};



const refreshDropboxClient = async () => {
  try {
    const validToken = await dropboxTokenService.getValidToken();
    dbx = new Dropbox({ accessToken: validToken });
    return true;
  } catch (error) {
    console.error('Error al actualizar cliente Dropbox:', error);
    return false;
  }
};


const initializeDropboxClient = async () => {
  console.log('Inicializando cliente Dropbox...');
  const success = await refreshDropboxClient();
  
  if (success) {
    try {
      const account = await dbx.usersGetCurrentAccount();
      console.log(`✅ Conectado a Dropbox como: ${account.result.name.display_name}`);
      return true;
    } catch (error) {
      console.error('❌ Error al verificar cuenta de Dropbox:', error.message);
      return false;
    }
  }
  return false;
};


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});



// Función para verificar si el archivo es válido para la categoría
const isValidFileForCategory = (file, category) => {
  if (!category || !file) return false;
  
  // Obtener extensión del archivo
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  // Verificar por tipo MIME
  const validMimeType = ALLOWED_FILE_TYPES[category]?.includes(file.mimetype);
  
  // Verificar por extensión de archivo como respaldo
  const validExtension = ALLOWED_FILE_EXTENSIONS[category]?.includes(fileExt);
  
  console.log(`Verificando archivo: ${file.originalname}`);
  console.log(`Categoría: ${category}, MIME: ${file.mimetype}, Extensión: ${fileExt}`);
  console.log(`MIME válido: ${validMimeType}, Extensión válida: ${validExtension}`);
  
  // Si al menos uno de los criterios es válido, aceptamos el archivo
  // Esto es más flexible ya que los MIME types pueden no ser confiables en todos los casos
  return validMimeType || validExtension;
};

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
  }
};

// Configuración de multer para imágenes
const upload = multer({
  storage,
  fileFilter, // Este filtro solo acepta imágenes
  limits: { fileSize: 10000000 } // 10MB máximo
});

// Configuración de multer para cualquier tipo de archivo
const uploadAny = multer({
  storage,
  limits: { fileSize: 100000000 }// 100MB máximo para archivos descargables
});

const uploadFileToDropbox = async (filePath, dropboxPath) => {
  await refreshDropboxClient();

  try {
    const fileContent = fs.readFileSync(filePath);
    console.log(`📤 Subiendo archivo a: ${dropboxPath}`);
    const uploadResult = await dbx.filesUpload({
      path: dropboxPath,
      contents: fileContent,
      mode: { '.tag': 'overwrite' }
    });

    const sharedLink = await dbx.sharingCreateSharedLinkWithSettings({
      path: dropboxPath
    });

    const directLink = sharedLink.result.url.replace('dl=0', 'dl=1');

    return {
      path: dropboxPath,
      url: directLink
    };
  } catch (error) {
    if (error.status === 401) {
      console.log('⚠️ Token expirado durante la operación, refrescando...');
      await dropboxTokenService.refreshAccessToken();
      await refreshDropboxClient();
      return uploadFileToDropbox(filePath, dropboxPath);
    }
    throw error;
  }
};

// Añadir esta función para eliminar un archivo de Dropbox
const deleteFileFromDropbox = async (dropboxPath) => {
  await refreshDropboxClient();
  
  try {
    console.log(`🗑️ Eliminando archivo: ${dropboxPath}`);
    await dbx.filesDeleteV2({ path: dropboxPath });
    console.log(`✅ Archivo eliminado de Dropbox: ${dropboxPath}`);
    return true;
  } catch (error) {
    // Si el archivo no existe, consideramos que la eliminación fue exitosa
    if (error.status === 409 && error.error && error.error.path && error.error.path['.tag'] === 'not_found') {
      console.log(`ℹ️ El archivo no existía en Dropbox: ${dropboxPath}`);
      return true;
    }
    console.error(`❌ Error al eliminar archivo de Dropbox: ${dropboxPath}`, error);
    return false;
  }
};


// Función auxiliar para subir un archivo descargable a Dropbox
const uploadDownloadFileToDropbox = async (filePath, fileName, dropboxPath) => {
  // Asegurar token válido antes de cada operación
  await refreshDropboxClient();
  
  try {
    // Leer el archivo
    const fileContent = fs.readFileSync(filePath);
    const fileSize = fs.statSync(filePath).size;
    
    // Subir archivo a Dropbox
    console.log(`📤 Subiendo archivo descargable a: ${dropboxPath}`);
    const uploadResult = await dbx.filesUpload({
      path: dropboxPath,
      contents: fileContent,
      mode: { '.tag': 'overwrite' }
    });
    
    // Crear un link compartido
    console.log('🔗 Generando enlace compartido para archivo descargable:', dropboxPath);
    const sharedLink = await dbx.sharingCreateSharedLinkWithSettings({
      path: dropboxPath
    });
    
    // Modificar la URL para acceso directo
    const directLink = sharedLink.result.url.replace('dl=0', 'dl=1');
    
    return {
      path: dropboxPath,
      url: directLink,
      name: fileName,
      size: fileSize
    };
  } catch (error) {
    // Si el error es de autenticación, intentar refrescar el token y reintentar una vez
    if (error.status === 401) {
      console.log('⚠️ Token expirado durante la operación, refrescando...');
      await dropboxTokenService.refreshAccessToken();
      await refreshDropboxClient();
      
      // Reintentar la operación
      return uploadDownloadFileToDropbox(filePath, fileName, dropboxPath);
    }
    
    throw error;
  }
};

// Middleware para subir a Dropbox
const uploadToDropbox = async (req, res, next) => {
  try {
    await refreshDropboxClient();

    const isEditar = req.method === 'PUT';

    const { name, category } = req.body;
    if (!name) {
      throw new Error('El nombre del asset es requerido');
    }
    
    if (!category) {
      throw new Error('La categoría del asset es requerida');
    }

        // Verificar si es una edición (PUT) o creación (POST)
        console.log(`📤 ${isEditar ? 'Actualizando' : 'Procesando'} asset: ${name}, Categoría: ${category}`);



    // Si es una edición, necesitamos obtener el asset actual
    let currentAssetData = null;
    if (isEditar) {
      const Asset = require('../models/assetModel');
      const currentAsset = await Asset.findById(req.params.id);
      if (!currentAsset) {
        throw new Error('Asset no encontrado');
      }
      currentAssetData = currentAsset;
    }

    console.log(`📤 Procesando asset: ${name}, Categoría: ${category}`);

    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
     // Crear o verificar carpeta del asset
     const assetFolderPath = `/assets/${name}`;
     try {
       await dbx.filesGetMetadata({ path: assetFolderPath });
       console.log(`✅ Carpeta ${assetFolderPath} encontrada`);
     } catch (error) {
       if (error.status === 409) {
         await dbx.filesCreateFolderV2({ path: assetFolderPath, autorename: false });
         console.log(`✅ Carpeta ${assetFolderPath} creada correctamente`);
       } else {
         throw error;
       }
     }

    try {
      await dbx.filesGetMetadata({ path: assetFolderPath });
      console.log(`✅ Carpeta ${assetFolderPath} encontrada`);
    } catch (error) {
      if (error.status === 409 || (error.error && error.error.path && error.error.path['.tag'] === 'not_found')) {
        console.log(`📁 Creando carpeta ${assetFolderPath}`);
        await dbx.filesCreateFolderV2({ path: assetFolderPath });
        console.log(`✅ Carpeta ${assetFolderPath} creada correctamente`);
      } else {
        console.error('❌ Error al verificar carpeta de asset:', error);
        throw error;
      }
    }
    
   // Crear o verificar carpeta de descargas
   const downloadsFolderPath = `${assetFolderPath}/downloads`;
   try {
     await dbx.filesGetMetadata({ path: downloadsFolderPath });
     console.log(`✅ Carpeta ${downloadsFolderPath} encontrada`);
   } catch (error) {
     if (error.status === 409) {
       await dbx.filesCreateFolderV2({ path: downloadsFolderPath, autorename: false });
       console.log(`✅ Carpeta ${downloadsFolderPath} creada correctamente`);
     } else {
       throw error;
     }
   }

 
    // Para el archivo descargable, eliminar el anterior si existe
    if (req.files && req.files.downloadFile && req.files.downloadFile.length > 0) {
      const downloadFile = req.files.downloadFile[0];
      
      // Verificar si el archivo es válido para la categoría
      if (!isValidFileForCategory(downloadFile, category)) {
        throw new Error(`El tipo de archivo ${downloadFile.mimetype} no es válido para la categoría ${category}`);
      }
      
      // Si es una edición y ya existía un archivo descargable, eliminarlo primero
      if (isEditar && currentAssetData.downloadFile && currentAssetData.downloadFile.path) {
        console.log('🗑️ Eliminando archivo descargable anterior...');
        await deleteFileFromDropbox(currentAssetData.downloadFile.path);
      }
      
      const downloadFileName = `${Date.now()}_${path.basename(downloadFile.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const downloadFilePath = `${downloadsFolderPath}/${downloadFileName}`;
      
      // Subir nuevo archivo descargable a Dropbox
      const downloadFileResult = await uploadDownloadFileToDropbox(
        downloadFile.path, 
        downloadFile.originalname, 
        downloadFilePath
      );
      console.log('✅ Archivo descargable subido:', downloadFileResult.url);
      
      // Limpiar archivo temporal
      if (downloadFile.path && fs.existsSync(downloadFile.path)) {
        fs.unlinkSync(downloadFile.path);
      }
      
      // Guardar información del archivo descargable
      req.downloadFile = downloadFileResult;
    }
    
    // Crear subcarpeta para imágenes adicionales
    const additionalImagesFolderPath = `${assetFolderPath}/additional_images`;
    try {
      await dbx.filesGetMetadata({ path: additionalImagesFolderPath });
      console.log(`✅ Carpeta ${additionalImagesFolderPath} encontrada`);
    } catch (error) {
      if (error.status === 409 || (error.error && error.error.path && error.error.path['.tag'] === 'not_found')) {
        console.log(`📁 Creando carpeta ${additionalImagesFolderPath}`);
        await dbx.filesCreateFolderV2({ path: additionalImagesFolderPath });
        console.log(`✅ Carpeta ${additionalImagesFolderPath} creada correctamente`);
      } else {
        console.error('❌ Error al verificar carpeta de imágenes adicionales:', error);
        throw error;
      }
    }

    const isEdit = req.method === 'PUT';
    if (!isEdit && (!req.files || !req.files.coverImage)) {
      res.status(400);
      throw new Error('La imagen de portada es obligatoria');
    }

    let coverImageResult = null;
    if (req.files && req.files.coverImage) {
      const coverImage = req.files.coverImage[0];
      const coverImageName = `cover_${Date.now()}_${path.basename(coverImage.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const coverImagePath = `${assetFolderPath}/${coverImageName}`;
      coverImageResult = await uploadFileToDropbox(coverImage.path, coverImagePath);
      console.log('✅ Imagen de portada subida:', coverImageResult.url);
      if (coverImage && coverImage.path && fs.existsSync(coverImage.path)) {
        fs.unlinkSync(coverImage.path);
      }
    }

    const additionalImagesResults = [];
    if (req.files && req.files.additionalImages && req.files.additionalImages.length > 0) {
      console.log(`📤 Subiendo ${req.files.additionalImages.length} imágenes adicionales`);
      for (const additionalImage of req.files.additionalImages) {
        const additionalImageName = `${Date.now()}_${path.basename(additionalImage.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const additionalImagePath = `${additionalImagesFolderPath}/${additionalImageName}`;
        const additionalImageResult = await uploadFileToDropbox(additionalImage.path, additionalImagePath);
        additionalImagesResults.push(additionalImageResult);
        console.log('✅ Imagen adicional subida:', additionalImageResult.url);
      }
    }

    if (req.files?.additionalImages) {
      for (const additionalImage of req.files.additionalImages) {
        if (additionalImage.path && fs.existsSync(additionalImage.path)) {
          fs.unlinkSync(additionalImage.path);
        }
      }
    }

    req.dropboxFiles = {
      coverImage: coverImageResult,
      additionalImages: additionalImagesResults,
      downloadFile: req.downloadFile || null
    };

    console.log('✅ Proceso completado con éxito');
    next();
  } catch (error) {
    // Limpiar archivos temporales en caso de error
    if (req.files) {
      if (req.files.coverImage) {
        for (const file of req.files.coverImage) {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
      
      if (req.files.downloadFile) {
        for (const file of req.files.downloadFile) {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
      
      if (req.files.additionalImages) {
        for (const file of req.files.additionalImages) {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }

    console.error('❌ Error al subir a Dropbox:', error.message);
    res.status(500);
    return next(new Error(`Error al subir a Dropbox: ${error.message}`));
  }
};

// Exportar las funciones
module.exports = { 
  upload, 
  uploadAny, 
  uploadToDropbox,
  deleteFileFromDropbox  // Exportar esta función también
};