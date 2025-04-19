// Importamos Express, el framework web
import express from 'express';

// Importamos path para manejar rutas de archivos
import path from 'path';

// Necesario para obtener __dirname en módulos ES (type: "module")
import { fileURLToPath } from 'url';

// Importamos las rutas definidas en el archivo routers/index.js
import router from './routers/index.js';

import dotenv from 'dotenv';

dotenv.config();

// Obtenemos el nombre del archivo actual
const __filename = fileURLToPath(import.meta.url);

// Obtenemos el directorio donde está este archivo
const __dirname = path.dirname(__filename);

// Creamos una instancia de la aplicación Express
const app = express();

// Definimos el puerto en el que se ejecutará el servidor
// Si hay una variable de entorno PORT, la usamos; si no, usamos 4000 por defecto
const port = process.env.PORT || 4000;

// Le indicamos a Express dónde están las vistas (archivos .ejs)
app.set('views', path.join(__dirname, 'views'));

// Le indicamos a Express que usaremos EJS como motor de plantillas
app.set('view engine', 'ejs');

// Servimos archivos estáticos desde la carpeta "public"
// Esto incluye CSS, imágenes, JS del cliente, etc.
app.use(express.static(path.join(__dirname, 'public')));

// Esto debe ir ANTES del router:
app.use(express.urlencoded({ extended: true }));

// Luego ya puedes usar tus rutas
app.use('/', router);

// Iniciamos el servidor y lo ponemos a escuchar en el puerto definido
app.listen(port, () => {
    console.log('Servidor corriendo en el puerto ' + port);
});
