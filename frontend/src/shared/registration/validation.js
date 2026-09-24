export function phoneError(value) {
  const phone = value.trim();
  return phone && !/^[0-9+ ()-]{10,20}$/.test(phone)
    ? 'Usa de 10 a 20 caracteres: números, espacios, +, paréntesis o guiones. Ejemplo: 8441234567. Si no tienes teléfono, deja el campo vacío.' : '';
}

export function registrationError(values) {
  return ['nombre', 'descripcion', 'producto_servicio'].some(field => !values[field]?.trim())
    ? 'Completa el nombre del proyecto, el problema y el producto o servicio.' : '';
}
