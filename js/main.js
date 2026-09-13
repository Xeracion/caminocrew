document.getElementById('year').textContent = new Date().getFullYear();

// Prevent the privacy-policy link inside the checkbox label from toggling the checkbox
document.querySelectorAll('.checkbox-field a').forEach((link) => {
  link.addEventListener('click', (e) => e.stopPropagation());
});

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// FAQ accordion
document.querySelectorAll('.faq-item').forEach((item) => {
  const question = item.querySelector('.faq-question');
  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach((openItem) => {
      openItem.classList.remove('open');
      openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      question.setAttribute('aria-expanded', 'true');
    }
  });
});

// Fade-in sections on scroll
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
);
document.querySelectorAll('.fade-in').forEach((el) => revealObserver.observe(el));

// Booking form
// Envía la reserva a un Google Apps Script Web App que guarda la fila en Sheets
// y notifica por Gmail. Despliega el script de /apps-script/Code.gs y pega aquí
// su URL de despliegue (ver README.md, sección "Conectar el formulario a Google Workspace").
const GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbx1yTJXbBqW0icMHo9Fdh9nwhVX91FXAia8EnuqDn5VE4iki5Ky3ZwQ0m9RIo30S2Y9/exec';

const bookingForm = document.getElementById('bookingForm');
const formNote = document.getElementById('formNote');
const submitBtn = document.getElementById('submitBtn');

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!bookingForm.checkValidity()) {
    bookingForm.reportValidity();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';
  formNote.textContent = '';
  formNote.className = 'form-note';

  try {
    if (GAS_ENDPOINT_URL.includes('TU_DEPLOYMENT_ID')) {
      throw new Error('Falta configurar GAS_ENDPOINT_URL en js/main.js');
    }

    // El Web App de Apps Script no admite CORS legible desde fetch, así que se
    // envía en modo "no-cors": no podemos leer la respuesta, pero la petición
    // llega igualmente y el script procesa y guarda los datos.
    await fetch(GAS_ENDPOINT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: new FormData(bookingForm),
    });

    formNote.textContent = '¡Gracias! Hemos recibido tu solicitud, te contactamos en menos de 48h.';
    formNote.classList.add('success');
    bookingForm.reset();
  } catch (err) {
    console.error(err);
    formNote.textContent = 'No hemos podido enviar tu solicitud. Escríbenos a info@xeracion.org.';
    formNote.classList.add('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar solicitud de reserva';
  }
});
