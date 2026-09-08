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
const bookingForm = document.getElementById('bookingForm');
const formNote = document.getElementById('formNote');
const submitBtn = document.getElementById('submitBtn');

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!bookingForm.checkValidity()) {
    bookingForm.reportValidity();
    return;
  }

  const data = Object.fromEntries(new FormData(bookingForm).entries());

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';
  formNote.textContent = '';
  formNote.className = 'form-note';

  try {
    // Conecta aquí tu backend de formularios (Formspree, EmailJS, propio endpoint, etc.)
    // Ejemplo con Formspree:
    // const response = await fetch('https://formspree.io/f/TU_ID', {
    //   method: 'POST',
    //   headers: { 'Accept': 'application/json' },
    //   body: new FormData(bookingForm),
    // });
    // if (!response.ok) throw new Error('Error al enviar');

    console.log('Solicitud de reserva:', data);

    formNote.textContent = '¡Gracias! Hemos recibido tu solicitud, te contactamos en menos de 48h.';
    formNote.classList.add('success');
    bookingForm.reset();
  } catch (err) {
    formNote.textContent = 'No hemos podido enviar tu solicitud. Escríbenos a info@xeracion.org.';
    formNote.classList.add('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar solicitud de reserva';
  }
});
