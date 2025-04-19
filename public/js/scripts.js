document.addEventListener("DOMContentLoaded", () => {
    const mensaje = document.getElementById('mensajeExito');
    if (mensaje) {
        mensaje.classList.add('fade-out'); // animación opcional
        setTimeout(() => mensaje.remove(), 1000); // o 5000 si no usas fade
    }
});
