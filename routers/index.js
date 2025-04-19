import express from 'express';

import nodemailer from 'nodemailer';

const router = express.Router();

// routers/index.js
router.get('/', (req, res) => {
    res.render("index", { title: 'PixelPower | Inicio' });
});

router.get('/noticias', (req, res) => {
    res.render("Paginas/noticias", { title: 'PixelPower | Noticias' });
});

router.get('/sobrenosotros', (req, res) => {
    res.render("Paginas/sobrenosotros", { title: 'PixelPower | Sobre Nosotros' });
});

// Contacto (GET con mensaje opcional)
router.get('/contacto', (req, res) => {
    const mensaje = req.query.mensaje || null;
    res.render("Paginas/contacto", { title: "Contacto", mensaje });
});

router.post('/contacto', async (req, res) => {
    const { nombre, email, mensaje } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });


    const mailOptions = {
        from: email,
        to: 'ismaelast2005@gmail.com',
        subject: `PixelPower - Nuevo mensaje de ${nombre}`,
        html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>PixelPower | Contacto</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                        background-color: #f5f5f5;
                    }
                
                    .contact-container {
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        padding: 0;
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                
                    .contact-header {
                        background-color: #343a40;
                        padding: 15px;
                        border-radius: 10px 10px 0 0;
                    }
                
                    .contact-header h2 {
                        color: white;
                        margin: 10px 0;
                    }
                
                    .contact-body {
                        padding: 20px;
                    }
                
                    .contact-body h3 {
                        color: #007bff;
                    }
                
                    .mensaje-recibido {
                        font-size: 16px;
                        color: #333;
                    }
                
                    .mensaje-usuario {
                        background-color: #f8f9fa;
                        padding: 15px;
                        border-radius: 5px;
                        font-size: 16px;
                        color: #555;
                        margin: 20px 0;
                    }
                
                    .correo-contacto {
                        font-size: 14px;
                        color: #666;
                    }
                
                    .contact-footer {
                        background-color: #343a40;
                        padding: 10px;
                        border-radius: 0 0 10px 10px;
                        color: white;
                    }
                
                    .contact-footer p {
                        margin: 0;
                        font-size: 14px;
                    }
                </style>

            </head>
            <body>
                <div class="contact-container">
                    <header class="contact-header">
                        <img src="cid:logo" width="80" alt="PixelPower Logo">
                        <h2>Contacto</h2>
                    </header>
            
                    <div class="contact-body">
                        <h3>¡Hola ${nombre}!</h3>
                        <p class="mensaje-recibido">Hemos recibido tu mensaje. Nos pondremos en contacto contigo lo antes posible.</p>
            
                        <p class="mensaje-usuario">
                            <strong>Tu mensaje:</strong><br>
                            ${mensaje}
                        </p>
            
                        <p class="correo-contacto">Correo de contacto: <strong>${email}</strong></p>
                    </div>
            
                    <footer class="contact-footer">
                        <p>&copy; 2025 PixelPower. Todos los derechos reservados.</p>
                    </footer>
                </div>
            </body>
            </html>
            `,
        attachments: [
            {
                filename: 'logo.png',
                path: './public/img/LogoPixelPower.png',
                cid: 'logo'
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        res.redirect('/contacto?mensaje=¡Correo enviado correctamente!');
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        res.redirect('/contacto?mensaje=Error al enviar el correo');
    }
});





export default router;