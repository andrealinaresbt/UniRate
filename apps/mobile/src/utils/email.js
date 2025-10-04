// src/utils/email.js

export function validateEmailFormat(email) {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validateEmailDomain(email, allowedDomains = []) {
  if (typeof email !== 'string') return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return allowedDomains.map(d => d.toLowerCase()).includes(domain);
}

// Dominio único permitido
export function isUnimetCorreoEmail(email) {
  return validateEmailFormat(email) &&
         validateEmailDomain(email, ['correo.unimet.edu.ve']);
}

