# Caminocrew

Landing de reservas para viajes grupales por el Camino Inglés (caminocrew.com). Sitio estático, sin build: HTML, CSS y JS puros.

## Estructura

- `index.html` — landing completa: hero, pack, itinerario de 7 días, jornada de convivencia en Das Nest, testimonios, FAQs y formulario de reserva.
- `css/style.css` — estilos (identidad inspirada en bolt.com: fondo oscuro, acento amarillo camino, tipografía bold).
- `js/main.js` — menú móvil, acordeón de FAQs, fade-in al hacer scroll y envío del formulario.
- `apps-script/Code.gs` — backend del formulario sobre Google Workspace (Google Sheets + Gmail), pensado para desplegarse como Google Apps Script Web App.

## Desarrollo local

No requiere instalación. Basta con abrir `index.html` en el navegador o servir la carpeta:

```bash
python3 -m http.server 8080
```

## Conectar el formulario a Google Workspace

El formulario de reserva (`#bookingForm` en `js/main.js`) envía los datos a un Google Apps Script Web App que guarda cada reserva en una Google Sheet y envía los avisos por Gmail. Para activarlo:

1. Crea una Google Sheet nueva (por ejemplo, "Caminocrew — Reservas") en la cuenta de Google Workspace desde la que quieras recibir y gestionar las reservas.
2. En la Sheet, ve a **Extensiones → Apps Script**.
3. Borra el contenido de `Code.gs` que se abre por defecto y pega el contenido de `apps-script/Code.gs` de este repositorio.
4. Revisa la constante `NOTIFICATION_EMAIL` al principio del script y ajústala si quieres recibir los avisos en otra dirección distinta a `info@xeracion.org`.
5. Guarda el proyecto y despliega: **Desplegar → Nueva implementación → tipo "Aplicación web"**.
   - Ejecutar como: **Yo (tu cuenta)**.
   - Quién tiene acceso: **Cualquier usuario**.
6. Autoriza los permisos que pida Google (acceso a la Sheet y a Gmail) y copia la URL de la implementación (termina en `/exec`).
7. Pega esa URL en `js/main.js`, en la constante `GAS_ENDPOINT_URL`, sustituyendo `TU_DEPLOYMENT_ID`.
8. Prueba el formulario: cada envío debe crear una fila en la hoja "Reservas" y disparar un correo de aviso al equipo y otro de confirmación a quien reservó.

Si en el futuro cambias la lógica del script, tendrás que crear una **nueva versión** de la implementación (Desplegar → Gestionar implementaciones → editar) para que los cambios se apliquen a la URL ya publicada.

### Protección antibots

Como la URL del Web App es pública (`Cualquier usuario` tiene acceso), con el tiempo te llegarán envíos de bots que la encuentran y la rellenan con datos basura. El formulario incluye dos filtros, repetidos tanto en `js/main.js` como en `apps-script/Code.gs` (los bots que atacan la URL directamente se saltan el JavaScript de la página):

- **Honeypot**: un campo oculto (`website`) que las personas nunca ven ni rellenan, pero que los bots que rastrean formularios sí suelen completar. Si llega con contenido, se descarta en silencio.
- **Tiempo mínimo**: se descartan los envíos que llegan en menos de 3 segundos desde que se cargó la página, algo habitual en bots pero imposible para una persona rellenando el formulario.

Si después de desplegar sigues recibiendo spam, puedes añadir también un CAPTCHA (por ejemplo, [reCAPTCHA v3](https://www.google.com/recaptcha/about/) de Google, invisible para el usuario) verificándolo dentro de `doPost` en `Code.gs` antes de procesar la reserva.

### Alternativas

Si prefieres no usar Google Apps Script, el mismo `fetch` de `js/main.js` puede apuntar a cualquier otro backend de formularios (Formspree, EmailJS, una API propia), enviando `new FormData(bookingForm)` al endpoint que elijas.

## Despliegue

Al ser estático, se puede desplegar directamente en Netlify, Vercel, GitHub Pages o Cloudflare Pages sin configuración adicional.
