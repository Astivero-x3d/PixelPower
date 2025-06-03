// Importamos Express, el framework web
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import getConnection from './config/dbConnection.js';
import router from './routers/index.js';

// Carga las variables de entorno desde el archivo .env
dotenv.config();

// Obtenenemos el nombre del archivo actual
const __filename = fileURLToPath(import.meta.url);

// Obtenenemos el directorio donde está este archivo
const __dirname = path.dirname(__filename);

// Creamos una instancia de la aplicación Express
const app = express();

// Definimos el puerto en el que se ejecutará el servidor
const port = process.env.PORT || 4000;

// Conectamos a la base de datos
const db = getConnection();

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        // Terminamos la ejecución de la app si no se conecta
        process.exit(1);
    }
    console.log('Conexión a la base de datos establecida.');
});

// Configuramos la carpeta donde están las vistas (archivos EJS)
app.set('views', path.join(__dirname, 'views'));

// Configuramos el motor de plantillas a usar: EJS
app.set('view engine', 'ejs');

// Servimos archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear peticiones con cuerpo JSON
app.use(express.json());

// Middleware para el parseo de datos de formularios
app.use(express.urlencoded({ extended: true }));

// Configuración del middleware de sesión con una clave secreta obtenida de las variables de entorno
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Middleware para pasar a las vistas la variable 'admin' con el valor de la sesión (o null si no existe)
app.use((req, res, next) => {
    res.locals.admin = req.session.admin || null;
    next();
});

// Servimos también archivos estáticos dentro de la carpeta pública 'tickets' con ruta /tickets
app.use('/tickets', express.static(path.join(__dirname, 'public/tickets')));


// Usamos las rutas definidas en router
app.use('/', router);

// Iniciamos el servidor y escuchar en el puerto definido
try {
    app.listen(port, () => {
        console.log(`Servidor corriendo en el puerto ${port}`);
    });
} catch (err) {
    console.error('Error al iniciar el servidor:', err);
    // Termina la app si no puede arrancar el servidor
    process.exit(1);
}

// Exportamos la conexión a la base de datos para usarla en otros módulos
export { db };
