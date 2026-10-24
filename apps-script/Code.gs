/**
 * Caminocrew — backend del formulario de reserva sobre Google Workspace.
 *
 * Despliega este script como Web App (ver README.md) enlazado a una Google
 * Sheet. Cada envío del formulario:
 *   1. Añade una fila a la hoja "Reservas".
 *   2. Envía un aviso por Gmail a NOTIFICATION_EMAIL, con los datos en una
 *      tabla HTML con la identidad visual de Caminocrew.
 *   3. Envía un correo de confirmación a quien reservó, también en HTML.
 *
 * Filtro antibots: como la URL del Web App es pública, cualquiera puede
 * enviarle peticiones directamente sin pasar por el formulario de la web.
 * Por eso las mismas comprobaciones que hace el JS del navegador (honeypot
 * y tiempo mínimo) se repiten aquí: si no se cumplen, se ignora la petición
 * en silencio (no se guarda fila ni se envían correos) devolviendo "ok" para
 * no darle pistas al bot.
 */

const SHEET_NAME = 'Reservas';
const NOTIFICATION_EMAIL = 'info@xeracion.org';
const MIN_SUBMIT_SECONDS = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doPost(e) {
  const data = (e && e.parameter) || {};

  if (isLikelyBot(data)) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const row = {
    fecha_envio: new Date(),
    nombre: data.nombre || '',
    email: data.email || '',
    telefono: data.telefono || '',
    personas: data.personas || '',
    fecha_preferida: data.fecha || '',
    experiencia: data.experiencia || '',
    mensaje: data.mensaje || '',
  };

  appendToSheet(row);
  notifyOwner(row);
  if (row.email) {
    notifyCustomer(row);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function isLikelyBot(data) {
  // Honeypot: campo invisible en el formulario real; si llega con contenido,
  // quien envió no pasó por el formulario visible para personas.
  if ((data.website || '').trim() !== '') {
    return true;
  }

  // Un envío que dice haberse cargado hace menos de MIN_SUBMIT_SECONDS, o que
  // no manda ese dato en absoluto, es casi siempre un script y no una persona.
  const loadedAt = Number(data.loadedAt);
  if (!loadedAt) {
    return true;
  }
  const elapsedSeconds = (Date.now() - loadedAt) / 1000;
  if (elapsedSeconds < MIN_SUBMIT_SECONDS) {
    return true;
  }

  // Validación mínima de los campos obligatorios reales.
  if (!data.nombre || !EMAIL_PATTERN.test(data.email || '')) {
    return true;
  }

  return false;
}

function appendToSheet(row) {
  const sheet = getOrCreateSheet();
  sheet.appendRow([
    row.fecha_envio,
    row.nombre,
    row.email,
    row.telefono,
    row.personas,
    row.fecha_preferida,
    row.experiencia,
    row.mensaje,
  ]);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Fecha de envío',
      'Nombre',
      'Email',
      'Teléfono',
      'Personas',
      'Fecha preferida',
      'Experiencia previa',
      'Mensaje',
    ]);
  }
  return sheet;
}

function notifyOwner(row) {
  const subject = `Nueva reserva Caminocrew — ${row.nombre}`;

  const plainBody = [
    'Nueva solicitud de reserva desde caminocrew.com:',
    '',
    `Nombre: ${row.nombre}`,
    `Email: ${row.email}`,
    `Teléfono: ${row.telefono}`,
    `Personas: ${row.personas}`,
    `Fecha preferida: ${row.fecha_preferida}`,
    `Experiencia previa: ${row.experiencia}`,
    `Mensaje: ${row.mensaje}`,
  ].join('\n');

  const fields = [
    ['Nombre', row.nombre],
    ['Email', row.email],
    ['Teléfono', row.telefono],
    ['Personas', row.personas],
    ['Fecha preferida', row.fecha_preferida],
    ['Experiencia previa', row.experiencia === 'si' ? 'Sí' : 'No'],
    ['Mensaje', row.mensaje || '—'],
  ];

  const htmlBody = buildEmailHtml(
    'Nueva reserva',
    `Solicitud de ${row.nombre || 'un peregrino'} desde caminocrew.com`,
    fields
  );

  GmailApp.sendEmail(NOTIFICATION_EMAIL, subject, plainBody, { htmlBody });
}

function notifyCustomer(row) {
  const subject = 'Hemos recibido tu solicitud de reserva — Caminocrew';

  const plainBody = [
    `¡Hola ${row.nombre || ''}!`,
    '',
    'Gracias por tu interés en Caminocrew. Hemos recibido tu solicitud de reserva',
    'para el Camino Inglés y nuestro equipo te contactará en menos de 48 horas',
    'para confirmar fecha y disponibilidad.',
    '',
    'Resumen de tu solicitud:',
    `- Personas: ${row.personas}`,
    `- Fecha preferida: ${row.fecha_preferida}`,
    '',
    'Un saludo,',
    'El equipo de Caminocrew',
  ].join('\n');

  const fields = [
    ['Personas', row.personas],
    ['Fecha preferida', row.fecha_preferida],
  ];

  const intro = `
    <p style="margin:0 0 16px;">¡Hola ${escapeHtml(row.nombre || '')}!</p>
    <p style="margin:0 0 16px;">Gracias por tu interés en Caminocrew. Hemos recibido tu solicitud de
    reserva para el Camino Inglés y nuestro equipo te contactará en menos de 48 horas
    para confirmar fecha y disponibilidad.</p>
  `;

  const htmlBody = buildEmailHtml(
    'Solicitud recibida',
    'Resumen de tu reserva',
    fields,
    intro,
    '<p style="margin:20px 0 0;">Un saludo,<br>El equipo de Caminocrew</p>'
  );

  GmailApp.sendEmail(row.email, subject, plainBody, { htmlBody });
}

/**
 * Construye un email HTML sencillo con la identidad de Caminocrew
 * (cabecera oscura, acento amarillo camino) y una tabla de campo/valor.
 */
function buildEmailHtml(eyebrow, title, fields, introHtml, outroHtml) {
  const rowsHtml = fields
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e5e0;font-weight:600;color:#4a4a46;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e5e0;color:#0b0c0e;">${escapeHtml(String(value || '—')).replace(/\n/g, '<br>')}</td>
      </tr>
    `)
    .join('');

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e0;border-radius:12px;overflow:hidden;">
      <div style="background:#0b0c0e;padding:24px 28px;">
        <p style="margin:0 0 6px;color:#fdc500;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${escapeHtml(title)}</h1>
      </div>
      <div style="padding:24px 28px;">
        ${introHtml || ''}
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
          ${rowsHtml}
        </table>
        ${outroHtml || ''}
      </div>
      <div style="background:#f4f3ee;padding:16px 28px;">
        <p style="margin:0;font-size:12px;color:#4a4a46;">Caminocrew · Camino Inglés en grupo</p>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
