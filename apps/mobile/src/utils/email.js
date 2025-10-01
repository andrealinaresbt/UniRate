export function isUnimetEmail(email = '') {
  const e = email.trim().toLowerCase();
  return e.endsWith('@unimet.edu.ve') || e.endsWith('@correo.unimet.edu.ve');
}
