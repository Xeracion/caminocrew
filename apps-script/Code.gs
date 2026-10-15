/**
 * Caminocrew — backend del formulario de reserva sobre Google Workspace.
 *
 * Despliega este script como Web App (ver README.md) enlazado a una Google
 * Sheet. Cada envío del formulario:
 *   1. Añade una fila a la hoja "Reservas".
 *   2. Envía un aviso por Gmail a NOTIFICATION_EMAIL.
 *   3. Envía un correo de confirmación a quien reservó.
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
  const body = [
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

  GmailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
}

function notifyCustomer(row) {
  const subject = 'Hemos recibido tu solicitud de reserva — Caminocrew';
  const body = [
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

  GmailApp.sendEmail(row.email, subject, body);
}
