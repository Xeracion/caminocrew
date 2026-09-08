# Caminocrew

Landing de reservas para viajes grupales por el Camino Inglés (caminocrew.com). Sitio estático, sin build: HTML, CSS y JS puros.

## Estructura

- `index.html` — landing completa: hero, pack, itinerario de 7 días, jornada de convivencia en Das Nest, testimonios, FAQs y formulario de reserva.
- `css/style.css` — estilos (identidad inspirada en bolt.com: fondo oscuro, acento lima, tipografía bold).
- `js/main.js` — menú móvil, acordeón de FAQs y envío del formulario.

## Desarrollo local

No requiere instalación. Basta con abrir `index.html` en el navegador o servir la carpeta:

```bash
python3 -m http.server 8080
```

## Conectar el formulario de reserva

El formulario (`#bookingForm` en `js/main.js`) hoy solo simula el envío (`console.log`). Para recibir reservas reales, conéctalo a un backend de formularios, por ejemplo:

- [Formspree](https://formspree.io/): descomenta el bloque `fetch` en `js/main.js` y sustituye `TU_ID` por tu endpoint.
- [EmailJS](https://www.emailjs.com/): sustituye el bloque por una llamada a `emailjs.send(...)`.
- Un backend propio: cambia la URL del `fetch` por tu API.

## Despliegue

Al ser estático, se puede desplegar directamente en Netlify, Vercel, GitHub Pages o Cloudflare Pages sin configuración adicional.
