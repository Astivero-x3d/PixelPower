// Importamos el módulo 'path' para trabajar con rutas de archivos y directorios
import path from 'path';
// Importa una función para obtener la URL del archivo actual en módulos ES
import { fileURLToPath } from 'url';

// Importamos Express, necesario para usar el enrutador (router)
import express from 'express';

// Importamos nodemailer, que permite enviar correos electrónicos desde el servidor
import nodemailer from 'nodemailer';

// Importamos multer, que se utiliza para gestionar la subida de archivos
import multer from 'multer';

// Importamos la función para obtener la conexión a la base de datos
import getConnection from '../config/dbConnection.js';

// Importamos una función personalizada para generar tickets en PDF
import { generatePDF } from '../utils/Ticket_PDF.js';

// Convertimos la URL del archivo actual en una ruta de archivo absoluta
const __filename = fileURLToPath(import.meta.url);

// Obtenemos el directorio actual del archivo (equivalente a __dirname en CommonJS)
const __dirname = path.dirname(__filename);

// Creamos una instancia del enrutador de Express, donde se definirán todas las rutas de la aplicación
const router = express.Router();

// Configuramos el almacenamiento de imágenes de perfil de administradores
const FotoAdministrador = multer.diskStorage({
    // Definimos el directorio donde se guardarán las imágenes
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/img/Foto_De_Perfil_Administrador'));
    },
    // Definimos el nombre del archivo: le añade un timestamp antes del nombre original
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Middleware de multer para subir imágenes de administradores usando la configuración anterior
const SubirFotoAdministrador = multer({ storage: FotoAdministrador });

// Middleware de multer para subir imágenes de productos
const SubirImagenProductos = multer({
    storage: multer.diskStorage({
        // Definimos el directorio para guardar las imágenes de productos
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '../public/img/Productos'));
        },
        // Definimos el nombre del archivo con un timestamp para evitar duplicados
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
        }
    })
});

// Configuramos el almacenamiento de imágenes de perfil de clientes
const FotoCliente = multer.diskStorage({
    //Carpeta de destino para las fotos de cliente
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/img/Foto_De_Perfil_Cliente'));
    },
    //Nombre del archivo generado con timestamp + nombre original
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
})

// Middleware de multer para subir imágenes de clientes
const SubirFotoCliente = multer({ storage: FotoCliente });

// Ruta principal (página de inicio)
// Cuando un usuario accede a la raíz del sitio ('/'), se renderiza la vista 'index.ejs'
// Se le pasa un título para la pestaña y un nombre identificador de la página
router.get('/', (req, res) => {
    res.render("index", { title: 'PixelPower | Inicio', NombreDeLaPagina: 'Inicio' } );
});

// Ruta para la página de noticias
// Renderiza la vista 'Paginas/noticias.ejs' con el título y nombre de página correspondientes
router.get('/noticias', (req, res) => {
    res.render("Paginas/noticias", { title: 'PixelPower | Noticias', NombreDeLaPagina: 'Noticias' } );
});

// Ruta para la página "Sobre Nosotros"
// Renderiza la vista 'Paginas/sobrenosotros.ejs' con su título y nombre identificador
router.get('/sobrenosotros', (req, res) => {
    res.render("Paginas/sobrenosotros", { title: 'PixelPower | Sobre Nosotros', NombreDeLaPagina: 'Sobre Nosotros' });
});

// Ruta GET para mostrar el formulario de contacto
router.get('/contacto', (req, res) => {
    // Obtenemos el mensaje almacenado en sesión, si existe
    const mensaje = req.session.mensaje || '';
    // Limpiamos el mensaje para evitar que se repita
    req.session.mensaje = null;

    // Renderizamos la vista del formulario de contacto y pasar el mensaje si existe
    res.render("Paginas/contacto", {
        title: 'PixelPower | Contacto',
        mensaje: mensaje,
        NombreDeLaPagina: 'Contacto'
    });
});

// Ruta POST para procesar el envío del formulario de contacto
router.post('/contacto', (req, res) => {
    // Extraemos los datos del formulario
    const { nombre, email, mensaje } = req.body;

    // Obtenemos la conexión a la base de datos
    const db = getConnection();

    // Consultamos SQL para insertar el mensaje en la base de datos
    const sql = 'INSERT INTO Contacto (Nombre, Correo, Mensaje) VALUES (?, ?, ?)';
    console.log('Datos a insertar:', [nombre, email, mensaje]);

    // Ejecutar la consulta para insertar los datos del formulario en la base de datos
    // Incluimos 'result' aunque no se utilice para evitar errores al definir la función callback
    db.query(sql, [nombre, email, mensaje], (err, result) => {
        if (err) {
            console.error('Error al insertar en la base de datos:', err);
            req.session.mensaje = 'Error al guardar el mensaje. Inténtalo de nuevo.';
            // Redirigimos con mensaje de error
            return res.redirect('/contacto');
        }

        //Creamos el transporte de nodemailer con cuenta de Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // Configuramos del correo que se enviará al cliente
        const mailOptions = {
            from: 'PixelPower <ismaelast2005@gmail.com>',
            to: email,
            subject: '¡Gracias por contactarnos!',
            html: `
                <!DOCTYPE html>
                <html lang='es'>
                <head><meta charset='UTF-8'></head>
                <body style='font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;'>
                    <div style='background: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
                        <header style='background-color: #343a40; padding: 15px; border-radius: 10px 10px 0 0; text-align: center;'>
                            <img src="cid:logoPixelPower" width="80" alt="PixelPower Logo">
                            <h2 style='color: white; margin: 10px 0;'>Contacto</h2>
                        </header>
                        <div style='padding: 20px;'>
                            <h3 style='color: #007bff;'>¡Hola ${nombre}!</h3>
                            <p>Gracias por tu mensaje. Nos pondremos en contacto contigo lo antes posible.</p>
                            <p style='background: #f8f9fa; padding: 15px; border-radius: 5px;'><strong>Tu mensaje:</strong><br>${mensaje}</p>
                            <p style='font-size: 14px; color: #666;'>Correo de contacto: <strong>ismaelast2005@gmail.com</strong></p>
                        </div>
                        <footer style='background-color: #343a40; padding: 10px; color: white; border-radius: 0 0 10px 10px; text-align: center;'>
                            <p style='margin: 0;'>© 2025 PixelPower. Todos los derechos reservados.</p>
                        </footer>
                    </div>
                </body>
                </html>
            `,
            attachments: [
                {
                    filename: 'LogoPixelPower.png',
                    path: path.join(__dirname, '../public/img/LogoPixelPower.png'),
                    // ID para usar como imagen embebida en el correo
                    cid: 'logoPixelPower'
                }
            ]
        };

        // Enviamos el correo electrónico
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar el correo:', error);
                req.session.mensaje = 'Error al enviar el mensaje. Inténtalo de nuevo.';
            } else {
                console.log('Correo enviado:', info.response);
                req.session.mensaje = '¡Mensaje enviado y guardado correctamente!';
            }
            // Redirigimos al formulario con mensaje de estado
            res.redirect('/contacto');
        });
    });
});

// Ruta GET para mostrar el formulario de registro de administrador
router.get('/Administrador/RegistrarSesionAdministrador', (req, res) => {
    res.render('Administrador/RegistrarSesionAdministrador', { title: 'PixelPower | Registrar Sesion Administrador', NombreDeLaPagina: 'Registrar Sesion Administrador' });
});

// Ruta POST para procesar el formulario de registro de administrador
router.post('/Administrador/RegistrarSesionAdministrador', SubirFotoAdministrador.single('foto_perfil'), (req, res) => {
    // Extraemos los datos del formulario
    const {
        nombre,
        apellidos,
        genero,
        fecha_nacimiento,
        usuario,
        contrasena,
        correo,
        telefono,
        ciudad
    } = req.body;

    // Si se subió una foto, construimos la ruta; si no, dejamos null
    const fotoPerfilNombre = req.file ? `/img/Foto_De_Perfil_Administrador/${req.file.filename}` : null;

    // Obtenemos la conexión a la base de datos
    const db = getConnection();

    // Consulta SQL para insertar un nuevo administrador
    const sql = `
        INSERT INTO Administrador
        (Nombre, Apellidos, Genero, Fecha_de_nacimiento, Foto_De_Perfil, Nombre_de_usuario, Contraseña, Correo, Telefono, Ciudad)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
        nombre,
        apellidos,
        genero,
        fecha_nacimiento,
        fotoPerfilNombre,
        usuario,
        contrasena,
        correo,
        telefono,
        ciudad
    ];

    // Ejecutamos la inserción en la base de datos
    db.query(sql, valores, (err, resultado) => {
        if (err) {
            console.error('Error al registrar al administrador:', err);
            return res.render('Administrador/RegistrarSesionAdministrador', {
                title: 'PixelPower | Registrar Sesión Administrador',
                NombreDeLaPagina: 'Registrar Sesión Administrador',
                error: 'Ocurrió un error al registrar. Intenta de nuevo.'
            });
        }

        // Configuración del servicio de envío de correos
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // Configuramos del correo que se enviará al nuevo administrador
        const mailOptions = {
            from: 'PixelPower <ismaelast2005@gmail.com>',
            to: correo,
            subject: `Bienvenido ${nombre}, has sido registrado correctamente como administrador`,
            html: `
                <!DOCTYPE html>
                <html lang='es'>
                <head>
                  <meta charset='UTF-8'>
                </head>
                <body style='font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;'>
                  <div style='background: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
                    <header style='background-color: #343a40; padding: 15px; border-radius: 10px 10px 0 0; text-align: center;'>
                      <img src="cid:logoPixelPower" width="80" alt="PixelPower Logo">
                      <h2 style='color: white; margin: 10px 0;'>Registro de Administrador en PixelPower</h2>
                    </header>
                    <img src="cid:SaludoAdministrador" alt="Bienvenido" style="width: 100%; border-radius: 0 0 10px 10px; margin-top: 10px;">
                    <div style='padding: 20px;'>
                      <h3 style='color: #007bff;'>¡Hola ${nombre}!</h3>
                      <p>¡Gracias por registrarte como administrador en <strong>PixelPower</strong>! Estamos encantados de tenerte con nosotros.</p>
                      <h4 style="margin-top: 25px;">📝 Resumen de tu registro:</h4>
                      <ul style="list-style: none; padding: 0; font-size: 15px;">
                        <li><strong>Nombre:</strong> ${nombre} ${apellidos}</li>
                        <li><strong>Nombre de usuario:</strong> ${usuario}</li>
                        <li><strong>Correo:</strong> ${correo}</li>
                        <li><strong>Teléfono:</strong> ${telefono}</li>
                        <li><strong>Ciudad:</strong> ${ciudad}</li>
                      </ul>
                      <p style='margin-top: 20px;'>Si necesitas ayuda o tienes alguna pregunta, no dudes en contactarnos:</p>
                      <p style='font-size: 13px; color: #888;'>✉️ <a href='mailto:ismaelast2005@gmail.com'>ismaelast2005@gmail.com</a></p>
                    </div>
                    <footer style='background-color: #343a40; padding: 10px; color: white; border-radius: 0 0 10px 10px; text-align: center;'>
                      <p style='margin: 0;'>&copy; 2025 PixelPower. Todos los derechos reservados.</p>
                    </footer>
                  </div>
                </body>
                </html>
              `,
                attachments: [
                    {
                        filename: 'LogoPixelPower.png',
                        path: path.join(__dirname, '../public/img/LogoPixelPower.png'),
                        cid: 'logoPixelPower'
                    },
                    {
                        filename: 'SaludoAdministrador.png',
                        path: path.join(__dirname, '../public/img/SaludoAdministrador.png'),
                        cid: 'SaludoAdministrador'
                    }
                ]
            };

        // Enviamos el correo
        transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error al enviar el correo:', error);
                    return res.render('Administrador/RegistrarSesionAdministrador', {
                        title: 'PixelPower | Registrar Sesión Administrador',
                        NombreDeLaPagina: 'Registrar Sesión Administrador',
                        error: 'Registro exitoso, pero hubo un problema al enviar el correo.'
                    });
                } else {
                    console.log('Correo enviado:', info.response);
                    // Redireccionamos a inicio de sesión
                    res.redirect('/Administrador/IniciarSesionAdministrador');
                }
            });
    });
});

// Ruta GET para mostrar el formulario de inicio de sesión del administrador
router.get('/Administrador/IniciarSesionAdministrador', (req, res) => {
    res.render('Administrador/IniciarSesionAdministrador', {title: 'PixelPower | Inicio Sesion Administrador', NombreDeLaPagina: 'Iniciar Sesion Administrador' });
});

// Ruta POST para procesar el formulario de inicio de sesión del administrador
router.post('/Administrador/IniciarSesionAdministrador', async (req, res) => {
    // Extraemos los datos enviados desde el formulario
    const { correo, contrasena } = req.body;

    // Obtenemos la conexión a la base de datos
    const db = getConnection();

    // Ejecutamos una consulta para comprobar si existe un administrador con ese correo y contraseña
    db.query(
        'SELECT * FROM Administrador WHERE correo = ? AND contraseña = ?',
        [correo, contrasena],
        (error, results) => {
            if (error) {
                console.error('Error en la consulta:', error);
                return res.status(500).send('Error interno del servidor');
            }

            if (results.length > 0) {
                // Si hay resultados, se guarda la sesión del administrador
                req.session.admin = {
                    id: results[0].id,
                    nombre_de_persona: results[0].Nombre,
                    apellidos: results[0].Apellidos,
                    genero: results[0].Genero,
                    La_fecha_de_nacimiento: new Intl.DateTimeFormat('es-ES').format(new Date(results[0].Fecha_de_nacimiento)),
                    nombre_de_usuario: results[0].Nombre_de_usuario,
                    correo: results[0].Correo,
                    foto: results[0].Foto_De_Perfil,
                    ciudad: results[0].Ciudad,
                };
                // Redirige al panel principal
                res.redirect('/Administrador/MenuPrincipalAdministrador');
            } else {
                // Si no se encuentra el administrador, muestra mensaje de error
                res.render('Administrador/IniciarSesionAdministrador', {
                    title: 'PixelPower | Inicio Sesion Administrador',
                    NombreDeLaPagina: 'Iniciar Sesion Administrador',
                    error: 'Correo o contraseña incorrectos.'
                });
            }
        }
    );
});

function verificarSesionAdmin(req, res, next) {
    if (req.session.admin) {
        // Si la sesión está activa, continúa con la siguiente función
        next();
    } else {
        // Si no, redirige al login
        res.redirect('/Administrador/IniciarSesionAdministrador');
    }
}

router.get('/Administrador/MenuPrincipalAdministrador', verificarSesionAdmin, (req, res) => {
    res.render('Administrador/MenuPrincipalAdministrador', {
        title: 'PixelPower | Menu Principal Administrador',
        NombreDeLaPagina: 'Menu Principal Administrador',
        // Se pasa la información del administrador a la vista
        admin: req.session.admin
    });
});

// Ruta: /Administrador/TuCuenta
// Esta ruta muestra la página de perfil del administrador
router.get('/Administrador/TuCuenta', (req, res) => {

    // Si no hay sesión de administrador iniciada, redirige al login
    if(!req.session.admin){
        return res.redirect('/Administrador/IniciarSesionAdministrador');
    }

    // Si hay sesión iniciada, renderiza la vista 'TuCuenta.ejs'
    // Le pasa el título, el nombre de la página y los datos del admin desde la sesión
    res.render('Administrador/TuCuenta', {title: 'PixelPower | Tu Cuenta', NombreDeLaPagina: 'Tu Cuenta', admin: req.session.admin });
});

// Ruta GET para mostrar el listado paginado de clientes en el área de administrador.
// Incluye verificación de sesión para que solo los admins puedan acceder.
router.get('/Administrador/ListadoDeLosClientes', verificarSesionAdmin, async (req, res) => {

    // Si no hay sesión activa de admin, redirige al login del admin
    if(!req.session.admin){
        return res.redirect('/Administrador/IniciarSesionAdministrador');
    }

    try {
        // Obtenemos conexión a la base de datos
        const db = getConnection();

        // Parámetros de paginación con valores por defecto (página 1, 2 clientes por página)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        const offset = (page - 1) * limit;

        // Parámetros de filtro y ordenación desde la querystring, con valores por defecto
        const generoFiltro = req.query.genero || 'Todos';
        const orden = req.query.orden || 'nombre_asc'; // Valor por defecto

        // Consulta base para obtener clientes y contar total
        let query = 'SELECT * FROM Cliente';
        let countQuery = 'SELECT COUNT(*) as total FROM Cliente';
        const queryParams = [];
        const countParams = [];

        // Aplicamos filtro por género si no es 'Todos'
        if (generoFiltro !== 'Todos') {
            query += ' WHERE Genero = ?';
            countQuery += ' WHERE Genero = ?';
            queryParams.push(generoFiltro);
            countParams.push(generoFiltro);
        }

        // Definimos ordenación en función del parámetro recibido
        let orderBy = '';
        switch(orden) {
            case 'id_asc':
                orderBy = 'ORDER BY ID ASC';
                break;
            case 'id_desc':
                orderBy = 'ORDER BY ID DESC';
                break;
            case 'nombre_asc':
                orderBy = 'ORDER BY Nombre ASC';
                break;
            case 'nombre_desc':
                orderBy = 'ORDER BY Nombre DESC';
                break;
            case 'apellidos_asc':
                orderBy = 'ORDER BY Apellidos ASC';
                break;
            case 'apellidos_desc':
                orderBy = 'ORDER BY Apellidos DESC';
                break;
            default:
                orderBy = 'ORDER BY Nombre ASC';
        }

        // Ejecutamos consulta para obtener el total de clientes que cumplen filtro
        const [[{ total }]] = await db.promise().query(countQuery, countParams);

        // Añadimos ordenación, límite y offset para paginación en consulta principal
        query += ` ${orderBy} LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        // Ejecutamos consulta para obtener los clientes paginados
        const [clientes] = await db.promise().query(query, queryParams);

        // Calculamos total de páginas para la paginación
        const totalPages = Math.ceil(total / limit);

        // Renderizamos la vista con los datos, pasando clientes y parámetros de paginación
        res.render('Administrador/ListadoDeLosClientes', {
            title: 'PixelPower | Listado de Clientes',
            NombreDeLaPagina: 'Listado de Clientes',
            admin: req.session.admin,
            clientes,
            generoSeleccionado: generoFiltro,
            ordenSeleccionado: orden,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1
            }
        });
    } catch (error) {
        console.error('Error al obtener clientes:', error);

        // Si ocurre un error al obtener los clientes, respondemos con un error 500 y un mensaje simple
        res.status(500).send('Error al obtener clientes');
    }
});

// Ruta para que el administrador cierre sesión
router.get('/Administrador/CerrarSesion', (req, res) => {
    // Destruye la sesión actual del usuario
    req.session.destroy((err) => {
        if (err) {
            // Si ocurre un error al cerrar sesión, se muestra por consola
            console.error('Error al cerrar sesión:', err);
        }
        // Después de destruir la sesión (o en caso de error), redirige al usuario a la página principal
        res.redirect('/');
    });
});

// Ruta GET para mostrar el formulario de añadir productos
router.get('/Administrador/AnadirProductos', verificarSesionAdmin, (req, res) => {

    // Verificamos si el administrador está logueado
    if(!req.session.admin){
        return res.redirect('/Administrador/IniciarSesionAdministrador');
    }

    // Obtenemos mensaje de éxito si existe (para mostrar confirmación de producto añadido)
    const mensajeExito = req.session.mensajeExito || null;

    //Limpiamos el mensaje despues de usarlo
    req.session.mensajeExito = null;

    //Renderizamos la vista con los datos necesarios
    res.render('Administrador/AnadirProductos', {title: 'PixelPower | Añadir Productos', NombreDeLaPagina: 'Añadir Productos', admin: req.session.admin, mensajeExito });

});

// Ruta POST para procesar el formulario de añadir productos
router.post('/Administrador/AnadirProductos', verificarSesionAdmin, SubirImagenProductos.single('imagen'), (req, res) => {
    const db = getConnection();
    // Extraemos todos los campos del formulario
    const {
        tipo,
        nombre,
        precio,

        // Campos específicos para Consola
        modelo, // Cambiado de modulo a modelo
        colorConsola,
        almacenamiento,
        fabricanteConsola,

        // Campos específicos para Juego
        pegi,
        plataforma,
        jugadoresMinimo,
        jugadoresMaximo,

        // Campos específicos para Mando
        conexion,
        colorMando,
        fabricanteMando
    } = req.body;

    // Validamos que se haya subido una imagen
    if (!req.file) {
        return res.send("Debes subir una imagen del producto.");
    }
    const imagen = '/img/Productos/' + req.file.filename;

    // Validación básica de campos obligatorios
    if (!nombre || !precio || !tipo) {
        return res.send("Faltan campos obligatorios.");
    }

    // Log de los datos recibidos para depuración
    console.log('Datos recibidos:', {
        tipo, nombre, precio,
        modelo, colorConsola, almacenamiento, fabricanteConsola,
        pegi, plataforma, jugadoresMinimo, jugadoresMaximo,
        conexion, colorMando, fabricanteMando
    });

    // Insertamos datos básicos del producto en la tabla Producto
    const ProductoBaseDeDatos = `INSERT INTO Producto (Tipo, Nombre, Precio, Imagen) VALUES (?, ?, ?, ?)`;
    db.query(ProductoBaseDeDatos, [tipo, nombre, precio, imagen], (err, result) => {
        if (err) {
            console.error("Error al insertar producto:", err);
            return res.send("Error al añadir producto: " + err.message);
        }

        const productoId = result.insertId; // Obtenemos el ID del producto insertado
        console.log(`Producto base guardado - ID: ${productoId}, Nombre: ${nombre}, Tipo: ${tipo}`);

        // Manejamos cada tipo de producto específico
        switch (tipo) {
            case 'Consola':
                // Validamos campos obligatorios para consola
                if (!modelo || !colorConsola || !almacenamiento || !fabricanteConsola) {
                    return res.send("Todos los campos de consola son obligatorios.");
                }
                const consolaQuery = `
                    INSERT INTO DetallesConsola (ProductoID, Modelo, Color, Almacenamiento, Fabricante)
                    VALUES (?, ?, ?, ?, ?)`;
                db.query(consolaQuery,
                    [productoId, modelo, colorConsola, almacenamiento, fabricanteConsola],
                    (err2) => {
                        if (err2) {
                            console.error("Error en consola:", err2);
                            return res.send("Error al guardar detalles de consola: " + err2.message);
                        }
                        console.log(`[Consola] ID: ${productoId} | Modelo: "${modelo}" | Color: ${colorConsola} | Almacenamiento: ${almacenamiento} | Fabricante: ${fabricanteConsola}`);
                        req.session.mensajeExito = "Consola añadida correctamente";
                        return res.redirect('/Administrador/AnadirProductos');
                    });
                break;

            case 'Juego':
                // Validamos campos obligatorios para juego
                if (!pegi || !plataforma || !jugadoresMinimo) {
                    return res.send("Los campos PEGI, Plataforma y Jugadores mínimo son obligatorios.");
                }
                const juegoQuery = `
                    INSERT INTO DetallesJuego (ProductoID, Pegi, Plataforma, Jugadores_Minimo, Jugadores_Maximo)
                    VALUES (?, ?, ?, ?, ?)`;
                db.query(juegoQuery,
                    [productoId, pegi, plataforma, jugadoresMinimo, jugadoresMaximo || null],
                    (err3) => {
                        if (err3) {
                            console.error("Error en juego:", err3);
                            return res.send("Error al guardar detalles de juego: " + err3.message);
                        }
                        console.log(`[Juego] ID: ${productoId} | PEGI: ${pegi}+ | Plataforma: ${plataforma} | Jugadores: ${jugadoresMinimo}-${jugadoresMaximo || '?'}`);
                        req.session.mensajeExito = "Juego añadido correctamente";
                        return res.redirect('/Administrador/AnadirProductos');
                    });
                break;

            case 'Mando':
                // Validamos campos obligatorios para mando
                if (!conexion || !colorMando || !fabricanteMando) {
                    return res.send("Todos los campos de mando son obligatorios.");
                }
                const mandoQuery = `
                    INSERT INTO DetallesMando (ProductoID, Conexion, Color, Fabricante)
                    VALUES (?, ?, ?, ?)`;
                db.query(mandoQuery,
                    [productoId, conexion, colorMando, fabricanteMando],
                    (err4) => {
                        if (err4) {
                            console.error("Error en mando:", err4);
                            return res.send("Error al guardar detalles de mando: " + err4.message);
                        }
                        console.log(`[Mando] ID: ${productoId} | Conexión: ${conexion === 'inalambrica' ? 'Inalámbrico' : 'Alámbrico'} | Color: ${colorMando} | Fabricante: ${fabricanteMando}`);
                        req.session.mensajeExito = "Mando añadido correctamente";
                        return res.redirect('/Administrador/AnadirProductos');
                    });
                break;

            case 'Accesorio':
                // Los accesorios no tienen campos adicionales
                console.log(`[Accesorio] ID: ${productoId} | Tipo: ${tipo} | Nombre: "${nombre}"`);
                req.session.mensajeExito = "Accesorio añadido correctamente";
                return res.redirect('/Administrador/AnadirProductos');
        }
    });
});

// Ruta GET para mostrar la página de eliminación de productos
router.get('/Administrador/EliminarProductos', verificarSesionAdmin, async (req, res) => {
    // Verificamos si el administrador está logueado
    if(!req.session.admin){
        return res.redirect('/Administrador/IniciarSesionAdministrador');
    }

    // Manejamos mensajes de éxito (como confirmación de eliminación)
    const mensajeExito = req.session.mensajeExito || null;
    req.session.mensajeExito = null;

    try {
        const db = getConnection();

        // Configuración de paginación
        // page: página actual, por defecto 1
        // limit: productos por página, por defecto 10
        // offset: desplazamiento para la consulta SQL
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Obtenemos parámetros de filtrado y ordenación
        // tipoFiltro: filtra por tipo de producto (Consola, Juego, etc.)
        // orden: criterio de ordenación (nombre, precio, ascendente/descendente)
        const tipoFiltro = req.query.tipo || 'Todos';
        const orden = req.query.orden || 'nombre_asc'; // Valor por defecto

        // Construimos la consulta base para obtener productos
        let query = 'SELECT * FROM Producto';
        // Consultamos para contar el total de productos (para paginación)
        let countQuery = 'SELECT COUNT(*) as total FROM Producto';
        const queryParams = [];
        const countParams = [];

        // Aplicamos filtro por tipo si no es 'Todos'
        if (tipoFiltro !== 'Todos') {
            query += ' WHERE Tipo = ?';
            countQuery += ' WHERE Tipo = ?';
            queryParams.push(tipoFiltro);
            countParams.push(tipoFiltro);
        }

        // Aplicamos ordenación según el criterio seleccionado
        let orderBy = '';
        switch(orden) {
            case 'nombre_asc':
                orderBy = 'ORDER BY Nombre ASC';
                break;
            case 'nombre_desc':
                orderBy = 'ORDER BY Nombre DESC';
                break;
            case 'precio_asc':
                orderBy = 'ORDER BY Precio ASC';
                break;
            case 'precio_desc':
                orderBy = 'ORDER BY Precio DESC';
                break;
            default:
                orderBy = 'ORDER BY Nombre ASC';
        }

        // Consultamos para obtener el total de productos (con filtro aplicado)
        const [[{ total }]] = await db.promise().query(countQuery, countParams);

        // Consultamos para obtener los productos paginados (con filtro y ordenación)
        query += ` ${orderBy} LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);
        const [productos] = await db.promise().query(query, queryParams);

        // Calculamos total de páginas para la paginación
        const totalPages = Math.ceil(total / limit);

        // Renderizamos la vista con todos los datos necesarios
        res.render('Administrador/EliminarProductos', {
            title: 'PixelPower | Eliminar Productos',
            NombreDeLaPagina: 'Eliminar Productos',
            admin: req.session.admin,
            mensajeExito,
            productos,
            tiposProducto: ['Todos', 'Consola', 'Juego', 'Mando', 'Accesorio'], // Tipos disponibles para filtrar
            tipoSeleccionado: tipoFiltro,
            ordenSeleccionado: orden,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1
            }
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).send('Error al obtener productos');
    }
});

// Ruta POST para procesar la eliminación de productos
router.post('/Administrador/EliminarProductos', verificarSesionAdmin, async (req, res) => {
    // Verificamos sesión de administrador
    if(!req.session.admin){
        return res.redirect('/Administrador/IniciarSesionAdministrador');
    }

    // Obtenemos ID del producto a eliminar
    const { productoId } = req.body;

    // Validamos que se proporcionó un ID
    if (!productoId) {
        return res.status(400).send('ID de producto no proporcionado');
    }

    const db = getConnection();
    try {
        // Iniciamos transacción para asegurar la integridad de los datos
        await db.promise().beginTransaction();

        // Obtenemos el tipo de producto para eliminar también sus detalles específicos
        const [producto] = await db.promise().query('SELECT Tipo FROM Producto WHERE ID = ?', [productoId]);

        // Verificamos que el producto existe
        if (producto.length === 0) {
            await db.promise().rollback();
            return res.status(404).send('Producto no encontrado');
        }

        const tipo = producto[0].Tipo;

        // Eliminamos de las tablas de detalles específicos según el tipo de producto
        switch(tipo) {
            case 'Consola':
                await db.promise().query('DELETE FROM DetallesConsola WHERE ProductoID = ?', [productoId]);
                break;
            case 'Juego':
                await db.promise().query('DELETE FROM DetallesJuego WHERE ProductoID = ?', [productoId]);
                break;
            case 'Mando':
                await db.promise().query('DELETE FROM DetallesMando WHERE ProductoID = ?', [productoId]);
                break;
        }

        // Eliminamos referencias en DetallePedido (relación muchos a muchos)
        await db.promise().query('DELETE FROM DetallePedido WHERE ProductoID = ?', [productoId]);

        // Finalmente, eliminar el producto de la tabla principal
        await db.promise().query('DELETE FROM Producto WHERE ID = ?', [productoId]);

        // Confirmamos transacción si todo salió bien
        await db.promise().commit();

        // Establecemos mensaje de éxito y redirigir
        req.session.mensajeExito = 'Producto eliminado correctamente';
        res.redirect('/Administrador/EliminarProductos');
    } catch (error) {
        // Revertimos transacción en caso de error
        await db.promise().rollback();
        console.error('Error al eliminar producto:', error);
        res.status(500).send('Error al eliminar el producto');
    }
});

// Ruta para mostrar la página de actualización de productos
router.get('/Administrador/ActualizarProductos', verificarSesionAdmin, async (req, res) => {
    // Verificamos si el administrador tiene sesión activa
    if(!req.session.admin){
        return res.redirect('/Administrador/IniciarSesionAdministrador');
    }

    try {
        // Obtenemos la conexión a la base de datos
        const db = getConnection();
        // Consultamos todos los productos disponibles
        const [productos] = await db.promise().query('SELECT * FROM Producto');

        // Recuperamos mensajes de éxito, error y producto seleccionado de la sesión si existen
        const mensajeExito = req.session.mensajeExito || null;
        const error = req.session.error || null;
        const productoSeleccionado = req.session.productoSeleccionado || null;

        // Limpiamos los mensajes de la sesión para que no persistan
        req.session.mensajeExito = null;
        req.session.error = null;
        req.session.productoSeleccionado = null;

        // Renderizamos la vista con todos los datos necesarios
        res.render('Administrador/ActualizarProductos', {
            title: 'PixelPower | Actualizar Productos',
            NombreDeLaPagina: 'Actualizar Productos',
            admin: req.session.admin,
            productos,
            productoSeleccionado,
            mensajeExito,
            error
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para manejar la selección de un producto específico
router.post('/Administrador/ActualizarProductos/select', verificarSesionAdmin, async (req, res) => {
    try {
        // Obtenemos el ID del producto seleccionado
        const { productoId } = req.body;
        const db = getConnection();

        // Consultamos la información básica del producto
        const [producto] = await db.promise().query('SELECT * FROM Producto WHERE ID = ?', [productoId]);

        // Verificamos si el producto existe
        if (producto.length === 0) {
            req.session.error = 'Producto no encontrado';
            return res.redirect('/Administrador/ActualizarProductos');
        }

        const productoSeleccionado = producto[0];
        let detalles = null;

        // Según el tipo de producto, consultamos sus detalles específicos
        switch(productoSeleccionado.Tipo) {
            case 'Consola':
                // Para consolas, obtenemos detalles de la tabla DetallesConsola
                const [consolaDetalles] = await db.promise().query('SELECT * FROM DetallesConsola WHERE ProductoID = ?', [productoId]);
                detalles = consolaDetalles[0];
                break;
            case 'Juego':
                // Para juegos, obtenemos detalles de la tabla DetallesJuego
                const [juegoDetalles] = await db.promise().query('SELECT * FROM DetallesJuego WHERE ProductoID = ?', [productoId]);
                detalles = juegoDetalles[0];
                break;
            case 'Mando':
                // Para mandos, obtenemos detalles de la tabla DetallesMando
                const [mandoDetalles] = await db.promise().query('SELECT * FROM DetallesMando WHERE ProductoID = ?', [productoId]);
                detalles = mandoDetalles[0];
                break;
        }

        // Asignamos los detalles al producto seleccionado
        productoSeleccionado.detalles = detalles;
        // Guardamos el producto seleccionado en la sesión
        req.session.productoSeleccionado = productoSeleccionado;

        // Redirigimos de vuelta a la página de actualización
        res.redirect('/Administrador/ActualizarProductos');
    } catch (error) {
        console.error('Error al seleccionar producto:', error);
        req.session.error = 'Error al seleccionar el producto';
        res.redirect('/Administrador/ActualizarProductos');
    }
});

// Ruta para manejar la actualización del producto
router.post('/Administrador/ActualizarProductos/update', verificarSesionAdmin, SubirImagenProductos.single('imagen'), async (req, res) => {
    try {
        // Validamos el archivo de imagen si se subió uno
        if (req.file) {
            const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.gif'];
            const extension = path.extname(req.file.originalname).toLowerCase();

            if (!extensionesPermitidas.includes(extension)) {
                req.session.error = 'Solo se permiten imágenes (JPEG, JPG, PNG, GIF)';
                return res.redirect('/Administrador/ActualizarProductos');
            }
        }

        // Obtenemos todos los datos del formulario
        const { productoId, nombre, precio,
            modelo, colorConsola, almacenamiento, fabricanteConsola,
            pegi, plataforma, jugadoresMinimo, jugadoresMaximo,
            conexion, colorMando, fabricanteMando } = req.body;

        const db = getConnection();

        // Iniciamos una transacción para asegurar la integridad de los datos
        await db.promise().beginTransaction();

        // Preparamos la consulta para actualizar el producto base
        let updateProductoQuery = 'UPDATE Producto SET Nombre = ?, Precio = ?';
        const updateProductoParams = [nombre, precio];

        // Si hay una nueva imagen, la incluimos en la actualización
        if (req.file) {
            updateProductoQuery += ', Imagen = ?';
            updateProductoParams.push('/img/Productos/' + req.file.filename);
        }

        updateProductoQuery += ' WHERE ID = ?';
        updateProductoParams.push(productoId);

        // Ejecutamos la actualización del producto base
        await db.promise().query(updateProductoQuery, updateProductoParams);

        // Consultamos el tipo de producto para actualizar sus detalles específicos
        const [producto] = await db.promise().query('SELECT Tipo FROM Producto WHERE ID = ?', [productoId]);
        const tipo = producto[0].Tipo;

        // Actualizamos los detalles según el tipo de producto
        switch(tipo) {
            case 'Consola':
                await db.promise().query(
                    'UPDATE DetallesConsola SET Modelo = ?, Color = ?, Almacenamiento = ?, Fabricante = ? WHERE ProductoID = ?',
                    [modelo, colorConsola, almacenamiento, fabricanteConsola, productoId]
                );
                break;
            case 'Juego':
                await db.promise().query(
                    'UPDATE DetallesJuego SET Pegi = ?, Plataforma = ?, Jugadores_Minimo = ?, Jugadores_Maximo = ? WHERE ProductoID = ?',
                    [pegi, plataforma, jugadoresMinimo, jugadoresMaximo || null, productoId]
                );
                break;
            case 'Mando':
                await db.promise().query(
                    'UPDATE DetallesMando SET Conexion = ?, Color = ?, Fabricante = ? WHERE ProductoID = ?',
                    [conexion, colorMando, fabricanteMando, productoId]
                );
                break;
        }

        // Confirmamos la transacción si todo salió bien
        await db.promise().commit();

        // Mostramos mensaje de éxito y redirigimos
        req.session.mensajeExito = 'Producto actualizado correctamente';
        res.redirect('/Administrador/ActualizarProductos');
    } catch (error) {
        // Si hay error, hacemos rollback de la transacción
        await db.promise().rollback();
        console.error('Error al actualizar producto:', error);
        req.session.error = 'Error al actualizar el producto';
        res.redirect('/Administrador/ActualizarProductos');
    }
});

// routers/index.js:

// Ruta para mostrar el listado de productos para el administrador
router.get('/Administrador/ListadoDeLosProductos', verificarSesionAdmin, async (req, res) => {
    // Primero verifico si el administrador tiene sesión activa
    if(!req.session.admin){
        return res.redirect('/Administrador/IniciarSesionAdministrador');
    }

    try {
        // Obtengo la conexión a la base de datos
        const db = getConnection();

        // Configuro la paginación:
        // - Página actual (si no viene en la URL, uso la 1 por defecto)
        // - Límite de items por página (10 por defecto)
        // - Calculo el offset para la consulta SQL
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Obtengo los parámetros de filtrado y ordenación:
        // - tipoFiltro: para filtrar por categoría (Todos por defecto)
        // - orden: criterio de ordenación (nombre ascendente por defecto)
        const tipoFiltro = req.query.tipo || 'Todos';
        const orden = req.query.orden || 'nombre_asc';

        // Preparo las consultas SQL base:
        // - Una para obtener los productos
        // - Otra para contar el total (necesario para la paginación)
        let query = 'SELECT * FROM Producto';
        let countQuery = 'SELECT COUNT(*) as total FROM Producto';
        const queryParams = [];
        const countParams = [];

        // Si el filtro no es 'Todos', agrego la condición WHERE a ambas consultas
        if (tipoFiltro !== 'Todos') {
            query += ' WHERE Tipo = ?';
            countQuery += ' WHERE Tipo = ?';
            queryParams.push(tipoFiltro);
            countParams.push(tipoFiltro);
        }

        // Configuro el ordenamiento según lo que haya seleccionado el usuario
        let orderBy = '';
        switch(orden) {
            case 'nombre_asc':
                orderBy = 'ORDER BY Nombre ASC';  // Ordeno por nombre A-Z
                break;
            case 'nombre_desc':
                orderBy = 'ORDER BY Nombre DESC';  // Ordeno por nombre Z-A
                break;
            case 'precio_asc':
                orderBy = 'ORDER BY Precio ASC';  // Ordeno por precio menor a mayor
                break;
            case 'precio_desc':
                orderBy = 'ORDER BY Precio DESC';  // Ordeno por precio mayor a menor
                break;
            default:
                orderBy = 'ORDER BY Nombre ASC';  // Por defecto ordeno por nombre A-Z
        }

        // Ejecuto la consulta para contar el total de productos (con filtros aplicados)
        const [[{ total }]] = await db.promise().query(countQuery, countParams);

        // Completo y ejecuto la consulta principal:
        // - Agrego el ordenamiento
        // - Agrego los límites para la paginación
        query += ` ${orderBy} LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);
        const [productos] = await db.promise().query(query, queryParams);

        // Calculo el total de páginas necesarias
        const totalPages = Math.ceil(total / limit);

        // Renderizo la vista y le paso todos los datos necesarios:
        // - Información de la página
        // - Datos del admin en sesión
        // - Productos obtenidos
        // - Opciones de filtrado y ordenación
        // - Datos para la paginación
        res.render('Administrador/ListadoDeLosProductos', {
            title: 'PixelPower | Listado de los Productos',
            NombreDeLaPagina: 'Listado de los Productos',
            admin: req.session.admin,
            productos,
            tiposProducto: ['Todos', 'Consola', 'Juego', 'Mando', 'Accesorio'],
            tipoSeleccionado: tipoFiltro,
            ordenSeleccionado: orden,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1
            }
        });
    } catch (error) {
        // Si ocurre algún error, lo muestro en consola y envío mensaje al cliente
        console.error('Error al obtener productos:', error);
        res.status(500).send('Error al obtener productos');
    }
});


// Ruta GET para mostrar el formulario de registro de cliente
router.get('/Cliente/RegistrarSesionCliente', (req, res) => {
    // Renderizamos la vista RegistrarSesionCliente con el título y nombre de la página
    res.render('Cliente/RegistrarSesionCliente', {
        title: 'PixelPower | Registro Sesion Cliente',
        NombreDeLaPagina: 'Registrar Sesion Cliente'
    });
});

// Ruta POST para procesar el formulario de registro de cliente
router.post('/Cliente/RegistrarSesionCliente', SubirFotoCliente.single('foto_perfil'), (req, res) => {
    // Extraemos los datos del formulario del cuerpo de la solicitud
    const {
        nombre,
        apellidos,
        genero,
        fecha_nacimiento,
        usuario,
        contrasena,
        correo,
        telefono,
        ciudad
    } = req.body;

    // Procesamos la foto de perfil: si existe, guardamos la ruta, si no, null
    const fotoPerfilNombre = req.file ? `/img/Foto_De_Perfil_Cliente/${req.file.filename}` : null;

    // Obtenemos la conexión a la base de datos
    const db = getConnection();

    // Preparamos la consulta SQL para insertar el nuevo cliente
    const sql = `INSERT INTO Cliente (Nombre, Apellidos, Genero, Fecha_de_nacimiento, Foto_De_Perfil, Nombre_de_usuario, Contrasena, Correo, Telefono, Ciudad)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // Creamos el array de valores para la consulta SQL
    const valores = [
        nombre,
        apellidos,
        genero,
        fecha_nacimiento,
        fotoPerfilNombre,
        usuario,
        contrasena,
        correo,
        telefono,
        ciudad
    ];

    // Ejecutamos la consulta SQL para insertar el cliente
    db.query(sql, valores, (err, resultado) => {
        if(err){
            // Si hay un error, lo mostramos en consola y volvemos a renderizar el formulario con mensaje de error
            console.error('Error al registrar al cliente:', err);
            return res.render('Cliente/RegistrarSesionCliente', {
                title: 'PixelPower | Registrar Sesión Cliente',
                NombreDeLaPagina: 'Registrar Sesión Cliente',
                error: 'Ocurrió un error al registrar. Intenta de nuevo.'
            });
        }

        // Configuramos el transporter para enviar el correo de bienvenida
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // Preparamos las opciones del correo electrónico
        const mailOptions = {
            from: 'PixelPower <ismaelast2005@gmail.com>',
            to: correo,
            subject: `Bienvenido ${nombre}, has sido registrado correctamente como cliente`,
            html: `
                <!DOCTYPE html>
                <html lang='es'>
                <head>
                  <meta charset='UTF-8'>
                </head>
                <body style='font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;'>
                  <div style='background: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
                    <header style='background-color: #343a40; padding: 15px; border-radius: 10px 10px 0 0; text-align: center;'>
                      <img src="cid:logoPixelPower" width="80" alt="PixelPower Logo">
                      <h2 style='color: white; margin: 10px 0;'>Registro de Cliente en PixelPower</h2>
                    </header>
                    <img src="cid:SaludoCliente" alt="Bienvenido" style="width: 100%; border-radius: 0 0 10px 10px; margin-top: 10px;">
                    <div style='padding: 20px;'>
                      <h3 style='color: #007bff;'>¡Hola ${nombre}!</h3>
                      <p>¡Gracias por registrarte como cliente en <strong>PixelPower</strong>! Estamos encantados de tenerte con nosotros.</p>
                      <h4 style="margin-top: 25px;">📝 Resumen de tu registro:</h4>
                      <ul style="list-style: none; padding: 0; font-size: 15px;">
                        <li><strong>Nombre:</strong> ${nombre} ${apellidos}</li>
                        <li><strong>Nombre de usuario:</strong> ${usuario}</li>
                        <li><strong>Correo:</strong> ${correo}</li>
                        <li><strong>Teléfono:</strong> ${telefono}</li>
                        <li><strong>Ciudad:</strong> ${ciudad}</li>
                      </ul>
                      <p style='margin-top: 20px;'>Si necesitas ayuda o tienes alguna pregunta, no dudes en contactarnos:</p>
                      <p style='font-size: 13px; color: #888;'>✉️ <a href='mailto:ismaelast2005@gmail.com'>ismaelast2005@gmail.com</a></p>
                    </div>
                    <footer style='background-color: #343a40; padding: 10px; color: white; border-radiu s: 0 0 10px 10px; text-align: center;'>
                      <p style='margin: 0;'>&copy; 2025 PixelPower. Todos los derechos reservados.</p>
                    </footer>
                  </div>
                </body>
                </html>
            `,
            attachments: [
                {
                    filename: 'LogoPixelPower.png',
                    path: path.join(__dirname, '../public/img/LogoPixelPower.png'),
                    cid: 'logoPixelPower'
                },
                {
                    filename: 'SaludoCliente.png',
                    path: path.join(__dirname, '../public/img/SaludoCliente.png'),
                    cid: 'SaludoCliente'
                }
            ]
        };

        // Enviamos el correo electrónico
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                // Si hay error al enviar el correo, lo mostramos pero el registro fue exitoso
                console.error('Error al enviar el correo:', error);
                return res.render('Administrador/RegistrarSesionCliente', {
                    title: 'PixelPower | Registrar Sesión Cliente',
                    NombreDeLaPagina: 'Registrar Sesión Cliente',
                    error: 'Registro exitoso, pero hubo un problema al enviar el correo.'
                });
            } else {
                // Si todo sale bien, mostramos confirmación y redirigimos a login
                console.log('Correo enviado:', info.response);
                res.redirect('/Cliente/IniciarSesionCliente');
            }
        });
    });
});

// Ruta GET para mostrar el formulario de inicio de sesión del cliente
router.get('/Cliente/IniciarSesionCliente', (req, res) => {
    // Renderizamos la vista de inicio de sesión del cliente y le pasamos el título y el nombre de la página
    res.render('Cliente/IniciarSesionCliente', {
        title: 'PixelPower | Inicio Sesion Cliente',
        NombreDeLaPagina: 'Iniciar Sesion Cliente'
    });
});

// Ruta POST para procesar el inicio de sesión del cliente
router.post('/Cliente/IniciarSesionCliente', async (req, res) => {
    // Obtenemos el correo y la contraseña que el cliente escribió en el formulario
    const {correo, contrasena} = req.body;

    // Obtenemos la conexión a la base de datos
    const db = getConnection();

    // Consultamos si hay un cliente con ese correo y contraseña
    db.query(
        'SELECT * FROM Cliente WHERE correo = ? AND contrasena = ?',
        [correo, contrasena], (error, results) => {
            if (error) {
                // Si hay un error en la consulta, lo mostramos por consola y devolvemos error 500
                console.error('Error en la consulta:', error);
                return res.status(500).send('Error interno del servidor');
            }

            // Si encontramos al menos un cliente con esos datos...
            if(results.length > 0){
                // Guardamos los datos del cliente en la sesión
                req.session.cliente = {
                    id: results[0].ID,
                    nombre_de_persona: results[0].Nombre,
                    apellidos: results[0].Apellidos,
                    genero: results[0].Genero,
                    La_fecha_de_nacimiento: results[0].Fecha_de_nacimiento,
                    nombre_de_usuario: results[0].Nombre_de_usuario,
                    la_contrasena: results[0].Contrasena,
                    correo: results[0].Correo,
                    foto: results[0].Foto_De_Perfil,
                    el_telefono: results[0].Telefono,
                    ciudad: results[0].Ciudad,
                };
                // Redirigimos al menú principal del cliente
                res.redirect('/Cliente/MenuPrincipalCliente');
            } else {
                // Si no se encontró ningún cliente, volvemos a renderizar el formulario con un mensaje de error
                res.render('Cliente/IniciarSesionCliente', {
                    title: 'PixelPower | Inicio Sesion Cliente',
                    NombreDeLaPagina: 'Iniciar Sesion Cliente',
                    error: 'Correo o contraseña incorrectos.'
                });
            }
        }
    );
});


// Creamos una función para verificar si el cliente ha iniciado sesión
function verificarSesionCliente(req, res, next){
    // Comprobamos si existe una sesión activa de cliente
    if(req.session.cliente){
        // Si hay sesión, dejamos que continúe con la siguiente función
        next();
    } else{
        // Si no hay sesión, redirigimos al cliente a la página de inicio de sesión
        res.redirect('/Cliente/IniciarSesionCliente');
    }
}


// Ruta protegida: solo los clientes con sesión iniciada pueden acceder
router.get('/Cliente/MenuPrincipalCliente', verificarSesionCliente, (req, res) => {
    // Renderizamos la vista del panel principal del cliente
    res.render('Cliente/MenuPrincipalCliente', {
        title: 'PixelPower | Menu Principal Cliente', // Título de la pestaña
        NombreDeLaPagina: 'Menu Principal Cliente',    // Nombre que se muestra en el encabezado
        cliente: req.session.cliente                   // Enviamos los datos del cliente desde la sesión
    });
});


// Ruta para cerrar sesión del cliente
router.get('/Cliente/CerrarSesion', (req, res) => {
    // Destruimos la sesión actual del usuario
    req.session.destroy((err) => {
        if (err) {
            // Si ocurre un error al cerrar sesión, lo mostramos por consola
            console.error('Error al cerrar sesión:', err);
        }
        // Redirigimos al usuario a la página principal
        res.redirect('/');
    });
});


// Ruta para acceder a la cuenta del cliente
router.get('/Cliente/TuCuenta', (req, res) => {
    // Comprobamos si hay sesión iniciada, si no la hay, redirigimos a la misma página (esto se puede ajustar para redirigir al login si se desea)
    if(!req.session.cliente){
        return res.redirect('Cliente/TuCuenta');
    }

    // Renderizamos la vista 'TuCuenta' pasando los datos del cliente desde la sesión
    res.render('Cliente/TuCuenta', {
        title: 'PixelPower | Tu Cuenta',
        NombreDeLaPagina: 'Tu Cuenta',
        cliente: req.session.cliente
    });
});

// Ruta GET para mostrar el formulario de actualización de cuenta del cliente
router.get('/Cliente/ActualizarTuCuenta', (req, res) => {
    // Primero verifico si el cliente está logueado
    if(!req.session.cliente) {
        return res.redirect('/Cliente/IniciarSesionCliente');
    }

    // Obtengo los mensajes de éxito o error de la sesión si existen
    const { mensajeExito, error } = req.session;

    // Limpio los mensajes después de mostrarlos para que no persistan
    delete req.session.mensajeExito;
    delete req.session.error;

    // Renderizo la vista de actualización con los datos necesarios
    res.render('Cliente/ActualizarTuCuenta', {
        title: 'PixelPower | Actualizar Cuenta',
        NombreDeLaPagina: 'Actualiza Tu Cuenta',
        cliente: req.session.cliente,  // Paso los datos del cliente desde la sesión
        mensajeExito,  // Mensaje de éxito si existe
        error  // Mensaje de error si existe
    });
});

// Ruta POST para procesar la actualización de datos del cliente
router.post('/Cliente/ActualizarTuCuenta', SubirFotoCliente.single('Foto_De_Perfil'), async (req, res) => {
    // Verifico nuevamente la sesión del cliente
    if (!req.session.cliente) {
        return res.redirect('/Cliente/IniciarSesionCliente');
    }

    // Obtengo la conexión a la base de datos y el ID del cliente de la sesión
    const db = getConnection();
    const idCliente = req.session.cliente.id;

    try {
        // Extraigo todos los datos del formulario
        const {
            Nombre,
            Apellidos,
            Genero,
            Fecha_de_nacimiento = req.session.cliente.La_fecha_de_nacimiento,  // Uso la fecha actual si no se proporciona una nueva
            Nombre_de_usuario,
            Correo,
            Telefono,
            Ciudad
        } = req.body;

        // Valido que la fecha de nacimiento sea correcta
        if (!Fecha_de_nacimiento || isNaN(new Date(Fecha_de_nacimiento).getTime())) {
            req.session.error = 'Fecha de nacimiento no válida';
            return res.redirect('/Cliente/ActualizarTuCuenta');
        }

        // Preparo la consulta SQL base para actualizar los datos
        let sql = `
            UPDATE Cliente SET 
                Nombre = ?, 
                Apellidos = ?, 
                Genero = ?, 
                Fecha_de_nacimiento = ?, 
                Nombre_de_usuario = ?, 
                Correo = ?, 
                Telefono = ?, 
                Ciudad = ?
        `;

        // Creo el array de parámetros para la consulta SQL
        const params = [
            Nombre,
            Apellidos,
            Genero,
            Fecha_de_nacimiento,  // MySQL acepta directamente el formato 'YYYY-MM-DD'
            Nombre_de_usuario,
            Correo,
            Telefono,
            Ciudad
        ];

        // Si el cliente subió una nueva foto, la incluimos en la actualización
        if (req.file) {
            // Modifico la consulta SQL para incluir la foto
            sql = sql.replace('Ciudad = ?', 'Ciudad = ?, Foto_De_Perfil = ?');
            // Agrego la ruta de la nueva foto a los parámetros
            params.push('/img/Foto_De_Perfil_Cliente/' + req.file.filename);
        }

        // Completo la consulta SQL con el WHERE para actualizar solo este cliente
        sql += ' WHERE ID = ?';
        params.push(idCliente);

        // Ejecuto la consulta SQL para actualizar los datos en la base de datos
        await db.promise().query(sql, params);

        // Actualizo los datos en la sesión del cliente
        req.session.cliente = {
            ...req.session.cliente,
            nombre_de_persona: Nombre,
            apellidos: Apellidos,
            genero: Genero,
            La_fecha_de_nacimiento: Fecha_de_nacimiento,
            nombre_de_usuario: Nombre_de_usuario,
            correo: Correo,
            el_telefono: Telefono,
            ciudad: Ciudad,
            ...(req.file && { foto: '/img/Foto_De_Perfil_Cliente/' + req.file.filename })  // Solo actualizo la foto si se subió una nueva
        };

        // Establezco un mensaje de éxito y redirijo al formulario
        req.session.mensajeExito = 'Datos actualizados correctamente';
        return res.redirect('/Cliente/ActualizarTuCuenta');
    } catch (error) {
        // Si hay algún error, lo muestro en consola y establezco un mensaje de error
        console.error('Error al actualizar cliente:', error);
        req.session.error = 'Error al actualizar los datos';
        return res.redirect('/Cliente/ActualizarTuCuenta');
    }
});

// Ruta GET para mostrar la página de eliminación de cuenta
router.get('/Cliente/EliminarCuenta', verificarSesionCliente, (req, res) => {
    // Renderizo la vista 'Cliente/EliminarCuenta' con los datos necesarios
    res.render('Cliente/EliminarCuenta', {
        title: 'PixelPower | Elimina Tu Cuenta',
        NombreDeLaPagina: 'Eliminar cuenta',
        cliente: req.session.cliente
    });
});

// Ruta POST para procesar la eliminación de cuenta
router.post('/Cliente/EliminarCuenta', verificarSesionCliente, (req, res) => {
    // Obtengo la conexión a la base de datos
    const db = getConnection();

    // Obtengo los datos del cliente de la sesión
    const cliente = req.session.cliente;

    // Verifico si hay una sesión activa de cliente
    if (!cliente || !cliente.id) {
        // Si no hay sesión, redirijo al usuario a la página de login
        return res.redirect('/Cliente/IniciarSesionCliente');
    }

    // Extraigo los datos importantes del cliente
    const clienteId = cliente.id;
    const correoCliente = cliente.correo;
    const nombreCliente = cliente.nombre_de_persona;

    // Preparo la consulta SQL para eliminar al cliente de la base de datos
    const sqlEliminar = `DELETE FROM Cliente WHERE ID = ?`;

    // Ejecuto la consulta SQL para eliminar al cliente
    db.query(sqlEliminar, [clienteId], (err, resultado) => {
        if (err) {
            // Si hay un error, muestro un mensaje en la vista
            console.error('Error al eliminar cliente:', err);
            return res.render('Cliente/EliminarCuenta', {
                title: 'PixelPower | Elimina Tu Cuenta',
                NombreDeLaPagina: 'Eliminar cuenta',
                cliente,
                error: 'Hubo un error al eliminar la cuenta. Intenta de nuevo.'
            });
        }

        // Configuro el transporte de nodemailer para enviar el correo
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // Preparo las opciones del correo electrónico
        const mailOptions = {
            from: 'PixelPower <ismaelast2005@gmail.com>',
            to: correoCliente,
            subject: 'Cuenta eliminada en PixelPower',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
                  <h2 style="color: #dc3545;">Cuenta eliminada</h2>
                  <p>Hola <strong>${nombreCliente}</strong>,</p>
                  <p>Tu cuenta en <strong>PixelPower</strong> ha sido eliminada correctamente. Lamentamos verte partir.</p>
                  <p>Si fue un error o deseas volver, siempre te esperamos.</p>
                  <hr>
                  <p style="font-size: 12px; color: #888;">Este es un correo automático, por favor no respondas.</p>
                </div>
            `
        };

        // Envío el correo de confirmación de eliminación
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                // Si falla el envío del correo, lo registro pero continúo el proceso
                console.error('Error al enviar correo de eliminación:', error);
            } else {
                console.log('Correo de eliminación enviado:', info.response);
            }

            // Destruyo la sesión del usuario
            req.session.destroy((error) => {
                if (error) {
                    // Si hay error al cerrar sesión, lo registro pero igual redirijo
                    console.error('Error al cerrar sesión tras eliminar cuenta:', error);
                }
                // Redirijo al usuario a la página principal
                res.redirect('/');
            });
        });
    });
});

// Ruta para mostrar la página de compra de productos para clientes
router.get('/Cliente/Comprar', verificarSesionCliente, async (req, res) => {
    try {
        // Obtenemos conexión a la base de datos
        const db = getConnection();

        // Definimos los tipos de productos que se mostrarán
        const tiposProducto = ['Consola', 'Juego', 'Mando', 'Accesorio'];

        // Objetos para almacenar productos y información de paginación
        const productosPorTipo = {};
        const infoPaginacion = {}; // Renombrado de paginationInfo a infoPaginacion

        // Iteramos sobre cada tipo de producto
        for (const tipo of tiposProducto) {
            // Obtenemos número de página desde query params (por defecto 1)
            const pagina = parseInt(req.query[`page_${tipo.toLowerCase()}`]) || 1; // Renombrado de page a pagina

            // Límite de productos por página
            const limite = 8; // Renombrado de limit a limite

            // Cálculo para paginación
            const desplazamiento = (pagina - 1) * limite; // Renombrado de offset a desplazamiento

            // Consultamos SQL para obtener el total de productos de este tipo
            const [[{ total }]] = await db.promise().query(
                'SELECT COUNT(*) as total FROM Producto WHERE Tipo = ?',
                [tipo]
            );

            // Consultamos SQL para obtener los productos paginados
            const [productos] = await db.promise().query(
                'SELECT * FROM Producto WHERE Tipo = ? LIMIT ? OFFSET ?',
                [tipo, limite, desplazamiento]
            );

            // Calculamos total de páginas necesarias
            const totalPaginas = Math.ceil(total / limite); // Renombrado de totalPages a totalPaginas

            // Almacenamos productos y datos de paginación
            productosPorTipo[tipo] = productos;
            infoPaginacion[tipo] = { // Renombrado de paginationInfo a infoPaginacion
                // Página actual
                pagina,
                // Límite por página
                limite,
                // Total de productos
                total,
                // Total de páginas
                totalPaginas,
                // Comprobamos si hay página siguiente
                tienePaginaSiguiente: pagina < totalPaginas, // Renombrado de hasNextPage a tienePaginaSiguiente
                // Comprobamos si hay página anterior
                tienePaginaAnterior: pagina > 1, // Renombrado de hasPreviousPage a tienePaginaAnterior
                // Comprobamos si hay número página siguiente
                paginaSiguiente: pagina + 1, // Renombrado de nextPage a paginaSiguiente
                // Comprobamos si hay número página anterior
                paginaAnterior: pagina - 1 // Renombrado de previousPage a paginaAnterior
            };
        }

        console.log('Carrito de sesión:', req.session.cart); // Traducido

        // Obtenemos los detalles completos de los productos en el carrito
        let itemsCarrito = []; // Renombrado de carritoItems a itemsCarrito
        if (req.session.cart && req.session.cart.length > 0) {
            const idsProducto = req.session.cart.map(item => item.productId); // Renombrado de productIds a idsProducto
            const [productosDB] = await db.promise().query( // Renombrado de products a productosDB
                'SELECT * FROM Producto WHERE ID IN (?)',
                [idsProducto]
            );

            console.log('Productos de la base de datos:', productosDB); // Traducido

            itemsCarrito = req.session.cart.map(itemCarrito => { // Renombrado de carritoItems a itemsCarrito
                const producto = productosDB.find(p => p.ID === itemCarrito.productId); // Renombrado de product a producto
                return {
                    ...itemCarrito,
                    producto: producto
                };
            });
        }

        // Renderizamos la vista con todos los datos
        res.render('Cliente/Comprar', {
            // Título de la página
            title: 'PixelPower | Comprar',
            // Nombre de la página
            NombreDeLaPagina: 'Comprar',
            // Datos del cliente en sesión
            cliente: req.session.cliente,
            // Productos organizados por tipo
            productosPorTipo,
            // Información de paginación
            infoPaginacion, // Renombrado
            // Lista de tipos de producto
            tiposProducto,
            //Enviamos los items del carrito a la vista
            carritoItems: itemsCarrito // Renombrado
        });
    } catch (error) {
        // Manejo de errores
        console.error('Error al obtener productos:', error);
        res.status(500).send('Error al obtener productos');
    }
});

// Ruta para obtener la cantidad total de items en el carrito
router.get('/Cliente/ObtenerCantidadCarrito', verificarSesionCliente, (req, res) => {
    // Calculamos cantidad total sumando las cantidades de cada item
    const contadorCarrito = req.session.cart // Renombrado de cartCount a contadorCarrito
        // Si no hay carrito, devolvemos 0
        ? req.session.cart.reduce((total, item) => total + item.quantity, 0)
        : 0;

    // Respondemos con JSON conteniendo el conteo
    res.json({ contadorCarrito }); // Renombrado
});

router.post('/Cliente/AgregarAlCarrito', verificarSesionCliente, async (req, res) => {
    try {
        // Primero muestro en consola la sesión actual para depuración
        console.log('Agregando al carrito. Sesión actual:', req.session);

        // Verifico si el carrito existe en la sesión, si no, lo inicializo como array vacío
        if (!req.session.cart) {
            req.session.cart = [];
        }

        // Obtengo el ID del producto desde el cuerpo de la petición y lo convierto a número
        const idProducto = parseInt(req.body.productId);
        console.log('ID de producto a agregar:', idProducto);

        // Busco si el producto ya existe en el carrito
        const itemExistente = req.session.cart.find(item => item.productId === idProducto);

        if (itemExistente) {
            console.log('Producto ya en el carrito');
            // Si el producto ya está en el carrito, respondo con un mensaje y el estado actual
            return res.json({
                success: false,
                message: 'Este producto ya está en el carrito.',
                contadorCarrito: req.session.cart.reduce((total, item) => total + item.quantity, 0),
                contenidoCarrito: req.session.cart // Envío el contenido actual para que el frontend pueda mostrarlo
            });
        }

        // Si el producto no está en el carrito, lo agrego con cantidad 1
        req.session.cart.push({
            productId: idProducto,
            quantity: 1
        });

        console.log('Carrito después de agregar:', req.session.cart);

        // Guardo los cambios en la sesión de forma asíncrona
        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) {
                    console.error('Error al guardar la sesión:', err);
                    reject(err);
                } else {
                    console.log('Sesión guardada exitosamente');
                    resolve();
                }
            });
        });

        // Respondo con éxito y la información actualizada del carrito
        return res.json({
            success: true,
            message: 'Producto añadido al carrito correctamente.',
            contadorCarrito: req.session.cart.reduce((total, item) => total + item.quantity, 0),
            contenidoCarrito: req.session.cart // Envío el contenido actualizado
        });
    } catch (error) {
        // Si ocurre algún error, lo muestro en consola y respondo con error 500
        console.error('Error al agregar al carrito:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Ruta para actualizar la cantidad de un producto en el carrito
router.post('/Cliente/ActualizarCantidadCarrito', verificarSesionCliente, (req, res) => {
    // Obtenemos el ID del producto y la nueva cantidad del cuerpo de la solicitud
    const { productId, quantity } = req.body;

    // Verificamos si el carrito existe en la sesión
    if (!req.session.cart) {
        return res.json({ success: false, message: 'Carrito no existe' });
    }

    // Buscamos el índice del producto en el carrito
    const indiceItem = req.session.cart.findIndex(item => item.productId === parseInt(productId));

    // Si no encontramos el producto, devolvemos un mensaje de error
    if (indiceItem === -1) {
        return res.json({ success: false, message: 'Producto no encontrado en el carrito' });
    }

    // Actualizamos la cantidad del producto en el carrito
    req.session.cart[indiceItem].quantity = parseInt(quantity);

    // Devolvemos una respuesta exitosa con el nuevo conteo total de productos en el carrito
    res.json({
        success: true,
        contadorCarrito: req.session.cart.reduce((total, item) => total + item.quantity, 0)
    });
});

// Ruta para obtener los items del carrito con detalles completos
router.get('/Cliente/ObtenerCarrito', verificarSesionCliente, async (req, res) => {
    try {
        // Inicializamos un array vacío para almacenar los items del carrito
        let itemsCarrito = []; // Renombrado de carritoItems a itemsCarrito

        // Verificamos si existe un carrito en la sesión y si tiene items
        if (req.session.cart && req.session.cart.length > 0) {
            // Obtenemos la conexión a la base de datos
            const db = getConnection();

            // Extraemos los IDs de los productos del carrito de sesión
            const idsProducto = req.session.cart.map(item => item.productId); // Renombrado de productIds a idsProducto

            // Consultamos la base de datos para obtener información completa de los productos
            const [productosDB] = await db.promise().query( // Renombrado de products a productosDB
                'SELECT * FROM Producto WHERE ID IN (?)',
                [idsProducto]
            );

            // Mapeamos los items del carrito para agregar la información completa del producto
            itemsCarrito = req.session.cart.map(itemCarrito => { // Renombrado de carritoItems a itemsCarrito
                // Buscamos el producto correspondiente en los resultados de la DB
                const producto = productosDB.find(p => p.ID === itemCarrito.productId); // Renombrado de product a producto

                // Retornamos el item del carrito con los datos del producto incluidos
                return {
                    ...itemCarrito,
                    producto: producto
                };
            });
        }

        // Enviamos la respuesta con los items del carrito procesados
        res.json({ success: true, itemsCarrito }); // Renombrado
    } catch (error) {
        // Manejamos cualquier error que ocurra durante el proceso
        console.error('Error al obtener carrito:', error);
        res.status(500).json({ success: false, message: 'Error al obtener carrito' });
    }
});

// Ruta para eliminar un producto del carrito
router.post('/Cliente/EliminarDelCarrito', verificarSesionCliente, (req, res) => {
    // Obtenemos el ID del producto a eliminar desde el cuerpo de la solicitud
    const { productId } = req.body;

    // Verificamos si el carrito existe en la sesión
    if (!req.session.cart) {
        return res.json({ success: false, message: 'Carrito no existe' });
    }

    // Guardamos la longitud inicial del carrito para comparar después
    const longitudInicial = req.session.cart.length; // Renombrado de initialLength a longitudInicial

    // Filtramos el carrito para remover el producto con el ID especificado
    req.session.cart = req.session.cart.filter(item => item.productId !== parseInt(productId));

    // Comprobamos si el producto estaba en el carrito
    if (req.session.cart.length === longitudInicial) {
        return res.json({ success: false, message: 'Producto no encontrado en el carrito' });
    }

    // Respondemos con éxito y actualizamos el contador del carrito
    res.json({
        success: true,
        contadorCarrito: req.session.cart.reduce((total, item) => total + item.quantity, 0) // Renombrado
    });
});

// Ruta para mostrar la página completa del carrito
router.get('/Cliente/Carrito', verificarSesionCliente, async (req, res) => {
    try {
        // Primero obtengo la conexión a la base de datos
        const db = getConnection();
        let itemsCarrito = [];

        // Verifico si hay items en el carrito almacenado en la sesión
        if (req.session.cart && req.session.cart.length > 0) {
            // Extraigo los IDs de los productos del carrito
            const idsProducto = req.session.cart.map(item => item.productId);

            // Consulto la base de datos para obtener información completa de los productos
            const [productosDB] = await db.promise().query(
                'SELECT * FROM Producto WHERE ID IN (?)',
                [idsProducto]
            );

            // Combino la información del carrito con los detalles del producto
            itemsCarrito = req.session.cart.map(itemCarrito => {
                const producto = productosDB.find(p => p.ID === itemCarrito.productId);
                return {
                    ...itemCarrito,
                    producto: producto
                };
            });
        }

        // Renderizo la vista del carrito con los datos obtenidos
        res.render('Cliente/Carrito', {
            title: 'PixelPower | Carrito de Compras',
            NombreDeLaPagina: 'Carrito',
            cliente: req.session.cliente,
            carritoItems: itemsCarrito,
        });
    } catch (error) {
        // Manejo cualquier error que pueda ocurrir
        console.error('Error al obtener el carrito:', error);
        res.status(500).send('Error al obtener el carrito');
    }
});

// Ruta para mostrar la página de checkout
router.get('/Cliente/Checkout', verificarSesionCliente, async (req, res) => {
    try {
        // Obtenemos la conexión a la base de datos
        const db = getConnection();
        let itemsCarrito = [];

        // Verificamos si hay productos en el carrito de la sesión
        if (req.session.cart && req.session.cart.length > 0) {
            // Extraemos los IDs de los productos del carrito
            const idsProducto = req.session.cart.map(item => item.productId);

            // Consultamos la base de datos para obtener información de los productos
            const [productosDB] = await db.promise().query(
                'SELECT * FROM Producto WHERE ID IN (?)',
                [idsProducto]
            );

            // Mapeamos los items del carrito para combinar con la info de la base de datos
            itemsCarrito = req.session.cart.map(itemCarrito => {
                const producto = productosDB.find(p => p.ID === itemCarrito.productId);
                return {
                    ...itemCarrito,
                    producto: producto
                };
            });
        }

        // Renderizamos la vista de checkout con los datos necesarios
        res.render('Cliente/Checkout', {
            title: 'PixelPower | Finalizar Compra',
            NombreDeLaPagina: 'Checkout',
            cliente: req.session.cliente,
            carritoItems: itemsCarrito,
            // Calculamos el total sumando los precios de todos los productos
            total: itemsCarrito.reduce((total, item) =>
                total + (item.producto ? item.producto.Precio * item.quantity : 0), 0)
        });
    } catch (error) {
        console.error('Error al cargar checkout:', error);
        res.status(500).send('Error al cargar la página de checkout');
    }
});

// Ruta para procesar el pedido
router.post('/Cliente/ProcesarPedido', verificarSesionCliente, async (req, res) => {
    try {
        // Primero verifico la sesión del cliente para depuración
        console.log('Cliente ID:', req.session.cliente?.ID); // Usamos ?. por si cliente es undefined
        console.log('Session completa:', req.session.cliente);

        console.log('ID del cliente en sesión (ProcesarPedido):', req.session.cliente.id);

        console.log('Datos de sesión del cliente:', req.session.cliente); // Agrega esto para depuración

        // Obtengo la conexión a la base de datos
        const db = getConnection();

        // Manejo ambos casos posibles para el ID del cliente (ID o id)
        const clienteId = req.session.cliente.ID || req.session.cliente.id; // Maneja ambos casos

        // Verifico que tengamos un ID de cliente válido
        if (!clienteId) {
            return res.status(400).json({
                success: false,
                message: 'No se pudo identificar al cliente'
            });
        }

        // Verifico que el carrito no esté vacío
        if (!req.session.cart || req.session.cart.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El carrito está vacío'
            });
        }

        // Obtengo los IDs de los productos en el carrito para buscar sus detalles
        const idsProducto = req.session.cart.map(item => item.productId);
        const [productosDB] = await db.promise().query(
            'SELECT * FROM Producto WHERE ID IN (?)',
            [idsProducto]
        );

        // Calculo el total del pedido sumando cada producto con su cantidad
        const total = req.session.cart.reduce((sum, item) => {
            const producto = productosDB.find(p => p.ID === item.productId);
            return sum + (producto ? producto.Precio * item.quantity : 0);
        }, 0);

        // Obtengo información adicional del cliente para el correo electrónico
        const [clienteInfo] = await db.promise().query(
            'SELECT * FROM Cliente WHERE ID = ?',
            [clienteId]
        );

        // Verifico que exista información del cliente
        if (clienteInfo.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se encontró información del cliente'
            });
        }

        const cliente = clienteInfo[0];

        // Inicio una transacción para asegurar la integridad de los datos
        await db.promise().beginTransaction();

        try {
            // Primero inserto el pedido principal en la tabla Pedido

            // Uso CURDATE() de SQL:
            // Lo utilizo para insertar automáticamente la fecha actual del servidor de base de datos
            // cuando se crea un nuevo pedido. Es más confiable que usar la fecha del servidor Node.js
            // porque siempre usará la hora correcta del servidor MySQL.
            const [resultPedido] = await db.promise().query(
                'INSERT INTO Pedido (ClienteID, Fecha, Total) VALUES (?, CURDATE(), ?)',
                [clienteId, total]
            );

            const pedidoId = resultPedido.insertId;

            console.log('Pedido creado con ID:', pedidoId);

            // Luego inserto cada producto del carrito como detalle del pedido
            for (const item of req.session.cart) {
                await db.promise().query(
                    'INSERT INTO DetallePedido (PedidoID, ProductoID, Cantidad) VALUES (?, ?, ?)',
                    [pedidoId, item.productId, item.quantity]
                );
            }

            // Obtengo los detalles completos del pedido para generar el PDF y el correo

            // El p. en la consulta SQL:
            // Cuando hago JOIN con la tabla Producto (alias 'p'), uso p.Nombre y p.Precio
            // para especificar que esos campos vienen de la tabla Producto y no de DetallePedido.
            // Esto evita ambigüedades cuando hay campos con el mismo nombre en diferentes tablas.
            const [detalles] = await db.promise().query(`
                SELECT dp.*, p.Nombre, p.Precio 
                FROM DetallePedido dp 
                JOIN Producto p ON dp.ProductoID = p.ID 
                WHERE dp.PedidoID = ?
            `, [pedidoId]);

            // Generar PDF (ruta absoluta al directorio público)
            const pdfFileName = `pedido_${pedidoId}.pdf`;
            // path.join() de Node.js:
            // Lo uso para crear rutas de archivos compatibles con cualquier sistema operativo.
            // Une segmentos de ruta usando el separador correcto (/ en Linux/Mac, \ en Windows).
            // __dirname es la carpeta actual del archivo JavaScript.
            // Aquí creo la ruta completa para guardar el PDF del ticket:
            const pdfPath = path.join(__dirname, '../public/tickets', pdfFileName);
            // Esto evita problemas con las diferencias en rutas entre sistemas operativos
            await generatePDF({ID: pedidoId, Total: total, Fecha: new Date()}, cliente, detalles, pdfPath);

            // Configuro el transporte de correo electrónico con nodemailer
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS,
                },
            });

            // Preparo el contenido del correo electrónico con HTML
            const mailOptions = {
                from: 'PixelPower <ismaelast2005@gmail.com>',
                to: cliente.Correo,
                subject: `Confirmación de pedido #${pedidoId} en PixelPower`,
                html: `
                    <!DOCTYPE html>
                    <html lang='es'>
                    <head>
                      <meta charset='UTF-8'>
                    </head>
                    <body style='font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;'>
                      <div style='background: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
                        <header style='background-color: #343a40; padding: 15px; border-radius: 10px 10px 0 0; text-align: center;'>
                          <img src="cid:logoPixelPower" width="80" alt="PixelPower Logo">
                          <h2 style='color: white; margin: 10px 0;'>Confirmación de Pedido</h2>
                        </header>
                        <div style='padding: 20px;'>
                          <h3 style='color: #007bff;'>¡Hola ${cliente.Nombre}!</h3>
                          <p>Gracias por tu compra en <strong>PixelPower</strong>. Tu pedido ha sido procesado con éxito.</p>
                          
                          <h4 style="margin-top: 25px;">📝 Resumen de tu pedido:</h4>
                          <ul style="list-style: none; padding: 0; font-size: 15px;">
                            <li><strong>Número de pedido:</strong> #${pedidoId}</li>
                            <li><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</li>
                            <li><strong>Total:</strong> $${total.toFixed(2)}</li>
                          </ul>
                          
                          <p>Si necesitas ayuda o tienes alguna pregunta, no dudes en contactarnos:</p>
                          <p style='font-size: 13px; color: #888;'>✉️ <a href='mailto:ismaelast2005@gmail.com'>ismaelast2005@gmail.com</a></p>
                        </div>
                        <footer style='background-color: #343a40; padding: 10px; color: white; border-radius: 0 0 10px 10px; text-align: center;'>
                          <p style='margin: 0;'>&copy; 2025 PixelPower. Todos los derechos reservados.</p>
                        </footer>
                      </div>
                    </body>
                    </html>
                `,
                attachments: [
                    {
                        filename: 'LogoPixelPower.png',
                        path: path.join(__dirname, '../public/img/LogoPixelPower.png'),
                        cid: 'logoPixelPower'
                    }
                ]
            };

            // Envío el correo electrónico de confirmación
            await transporter.sendMail(mailOptions);
            console.log('Correo de confirmación enviado');

            // Confirmo la transacción ya que todo salió bien
            await db.promise().commit();

            // Limpio el carrito de compras después de una compra exitosa
            req.session.cart = [];
            await new Promise((resolve, reject) => {
                req.session.save(err => err ? reject(err) : resolve());
            });

            // Envío la respuesta exitosa al cliente
            res.json({
                success: true,
                message: 'Pedido realizado con éxito',
                pedidoId: pedidoId
            });
        } catch (error) {
            // Si hay algún error, revierto la transacción
            await db.promise().rollback();
            console.error('Error detallado en transacción:', error);
            throw error;
        }
    } catch (error) {
        // Manejo cualquier error que ocurra durante el proceso
        console.error('Error al procesar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar el pedido',
            error: error.message
        });
    }
});

// Ruta para mostrar la confirmación del pedido
router.get('/Cliente/ConfirmacionPedido/:id', verificarSesionCliente, async (req, res) => {
    try {
        // Primero obtengo la conexión a la base de datos
        const db = getConnection();
        // Extraigo el ID del pedido de los parámetros de la URL
        const pedidoId = req.params.id;

        // Verifico que el pedido exista y pertenezca al cliente actual
        const [pedido] = await db.promise().query('SELECT * FROM Pedido WHERE ID = ? AND ClienteID = ?', [pedidoId, req.session.cliente.id]);
        // Si no encuentro el pedido, devuelvo un error 404
        if (pedido.length === 0) {
            return res.status(404).send('Pedido no encontrado'); // ¡Usa return aquí!
        }

        // Obtengo los detalles del pedido junto con información del producto
        const [detalles] = await db.promise().query(`
            SELECT dp.*, p.Nombre, p.Precio 
            FROM DetallePedido dp 
            JOIN Producto p ON dp.ProductoID = p.ID 
            WHERE dp.PedidoID = ?
        `, [pedidoId]);

        // Genero el PDF del ticket con los datos del pedido
        const pdfFileName = `pedido_${pedidoId}.pdf`;
        const pdfPath = path.join(__dirname, '../public/tickets', pdfFileName);
        await generatePDF(pedido[0], req.session.cliente, detalles, pdfPath);

        // Finalmente renderizo la vista de confirmación con todos los datos necesarios
        res.render('Cliente/ConfirmacionPedido', {
            title: 'Confirmación de Pedido',
            NombreDeLaPagina: 'Confirmacion de Pedido',
            cliente: req.session.cliente,
            pedido: pedido[0],
            detalles: detalles,
            pdfPath: `/tickets/${pdfFileName}` // Esta es la ruta pública donde quedó guardado el PDF
        });

    } catch (error) {
        // Si ocurre algún error durante el proceso, lo muestro en consola y devuelvo error 500
        console.error('Error al cargar confirmación de pedido:', error);
        res.status(500).send('Error al generar el PDF');
    }
});

// Ruta para ver el historial de compras
router.get('/Cliente/HistorialDeCompras', verificarSesionCliente, async (req, res) => {
    // Primero verifico si el cliente tiene una sesión activa
    if(!req.session.cliente){
        return res.redirect('/Cliente/IniciarSesionCliente');
    }

    try {
        // Obtengo la conexión a la base de datos
        const db = getConnection();
        const clienteId = req.session.cliente.id;

        // Configuro la paginación con valores por defecto si no vienen en la query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        // Manejo el parámetro de ordenación
        const sort = req.query.sort || 'fecha_desc';

        // Defino las opciones de ordenación disponibles
        const sortOptions = {
            'fecha_asc': 'p.Fecha ASC',
            'fecha_desc': 'p.Fecha DESC',
            'precio_asc': 'p.Total ASC',
            'precio_desc': 'p.Total DESC',
            'id_asc': 'p.ID ASC',
            'id_desc': 'p.ID DESC'
        };

        // Selecciono el orden basado en el parámetro recibido o uso el por defecto
        const orderBy = sortOptions[sort] || 'p.Fecha DESC';

        // Cuento el total de pedidos del cliente para la paginación
        const [[{ total }]] = await db.promise().query(
            'SELECT COUNT(*) as total FROM Pedido WHERE ClienteID = ?',
            [clienteId]
        );

        // Obtengo los pedidos del cliente con paginación y ordenación
        const [pedidos] = await db.promise().query(`
            SELECT p.ID, p.Fecha, p.Total
            FROM Pedido p
            WHERE p.ClienteID = ?
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `, [clienteId, limit, offset]);

        // Para cada pedido, obtengo sus productos asociados
        for (const pedido of pedidos) {
            const [productos] = await db.promise().query(`
                SELECT pr.ID, pr.Nombre, pr.Precio, dp.Cantidad
                FROM DetallePedido dp
                JOIN Producto pr ON dp.ProductoID = pr.ID
                WHERE dp.PedidoID = ?
            `, [pedido.ID]);

            // Agrego los productos al objeto del pedido
            pedido.Productos = productos;
        }

        // Calculo el total de páginas para la paginación
        const totalPages = Math.ceil(total / limit);

        // Renderizo la vista con todos los datos necesarios
        res.render('Cliente/HistorialDeCompras', {
            title: 'PixelPower | Historial de compras',
            NombreDeLaPagina: 'Historial de compras',
            cliente: req.session.cliente,
            pedidos,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1
            },
            sort: req.query.sort || 'fecha_asc'
        });
    } catch (error) {
        // Manejo cualquier error que pueda ocurrir
        console.error('Error al obtener historial de compras:', error);
        res.status(500).send('Error al obtener historial de compras');
    }
});

// Ruta para vender un producto
router.post('/Cliente/VenderProducto', verificarSesionCliente, async (req, res) => {

    // Primero verifico si el cliente está autenticado
    if (!req.session.cliente) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    // Obtengo la conexión a la base de datos y los datos del request
    const db = getConnection();
    const { productoId, pedidoId } = req.body;
    const clienteId = req.session.cliente.id;

    try {

        // Inicio una transacción para asegurar la integridad de los datos
        await db.promise().beginTransaction();

        // Verifico si el producto pertenece al cliente y existe en el pedido
        const [verificacion] = await db.promise().query(`
            SELECT dp.ID, dp.Cantidad, pr.Precio
            FROM DetallePedido dp
            JOIN Pedido p ON dp.PedidoID = p.ID
            JOIN Producto pr ON dp.ProductoID = pr.ID
            WHERE dp.ProductoID = ? AND p.ClienteID = ? AND dp.PedidoID = ?
        `, [productoId, clienteId, pedidoId]);

        // Si no encuentra el producto, hago rollback y devuelvo error
        if (verificacion.length === 0) {
            await db.promise().rollback();
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para vender este producto o no existe'
            });
        }

        // Calculo el subtotal del producto a vender
        const { Cantidad, Precio } = verificacion[0];
        const subtotal = Cantidad * Precio;

        // Actualizo el total del pedido restando el subtotal del producto
        await db.promise().query(`
            UPDATE Pedido
            SET Total = Total - ?
            WHERE ID = ?
        `, [subtotal, pedidoId]);

        // Elimino el producto del detalle del pedido
        await db.promise().query(`
            DELETE FROM DetallePedido
            WHERE ProductoID = ? AND PedidoID = ?
        `, [productoId, pedidoId]);

        // Verifico si el pedido queda vacío después de eliminar el producto
        const [detallesRestantes] = await db.promise().query(`
            SELECT COUNT(*) as count FROM DetallePedido WHERE PedidoID = ?
        `, [pedidoId]);

        // Si no quedan productos en el pedido, lo elimino completamente
        if (detallesRestantes[0].count === 0) {
            await db.promise().query(`
                DELETE FROM Pedido WHERE ID = ?
            `, [pedidoId]);
        }

        // Si todo salió bien, hago commit de la transacción
        await db.promise().commit();

        // Devuelvo la respuesta exitosa al cliente
        res.json({
            success: true,
            message: 'Producto vendido exitosamente',
            pedidoEliminado: detallesRestantes[0].count === 0
        });

    } catch (error) {
        // Si ocurre algún error, hago rollback y devuelvo el error
        await db.promise().rollback();
        console.error('Error al vender producto:', error);
        res.status(500).json({ success: false, message: 'Error al vender producto', error: error.message });
    }
});

/*

    He estado utilizando el await porque lo uso para esperar a que se complete una operación asíncrona antes de continuar
    con la ejecución del código. Esto es esencial para manejar correctamente las promesas.

    También he utilizado el db.promise porque convierto las operaciones de la base de datos a usar promesas, lo que me permite
    usar async/await para un código más limpio y legible que los callbacks tradicionales.

    Uso el res.status() para que establezca el código de estado HTTP de la respuesta. Por ejemplo:
    - 401 para no autorizado
    - 403 para prohibido
    - 500 para errores internos del servidor
    Esto ayuda al cliente a entender qué tipo de respuesta está recibiendo.

    El res.json() envía la respuesta al cliente en formato JSON, que es el formato estándar
    para APIs REST. Incluyo siempre un campo 'success' para indicar si la operación fue exitosa,
    un 'message' descriptivo y, cuando es necesario, los datos relevantes o detalles de error.

*/

export default router;