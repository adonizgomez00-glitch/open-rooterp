export function validateRequired(value) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, errors: ['Este campo es requerido'] }
  }
  return { valid: true, errors: [] }
}

export function validateEmail(value) {
  if (!value) return { valid: true, errors: [] }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(value)) {
    return { valid: false, errors: ['Correo electrónico inválido'] }
  }
  return { valid: true, errors: [] }
}

export function validateUrl(value) {
  if (!value) return { valid: true, errors: [] }
  const re = /^https?:\/\/.+/
  if (!re.test(value)) {
    return { valid: false, errors: ['URL inválida'] }
  }
  return { valid: true, errors: [] }
}

export function validateDocumentId(value) {
  if (!value) return { valid: true, errors: [] }
  const re = /^[A-Za-z0-9-]+$/
  if (!re.test(value)) {
    return { valid: false, errors: ['El documento solo puede contener letras, números y guiones'] }
  }
  return { valid: true, errors: [] }
}

export function validatePhone(value) {
  if (!value) return { valid: true, errors: [] }
  const re = /^[\d\s\-+()]+$/
  if (!re.test(value)) {
    return { valid: false, errors: ['Teléfono inválido'] }
  }
  return { valid: true, errors: [] }
}

export function validatePositiveNumber(value) {
  if (value == null || value === '') return { valid: false, errors: ['El valor es requerido'] }
  const num = Number(value)
  if (Number.isNaN(num) || num < 0) {
    return { valid: false, errors: ['Debe ser un número positivo'] }
  }
  return { valid: true, errors: [] }
}

export function validateInteger(value) {
  if (value == null || value === '') return { valid: false, errors: ['El valor es requerido'] }
  const num = Number(value)
  if (Number.isNaN(num) || !Number.isInteger(num)) {
    return { valid: false, errors: ['Debe ser un número entero'] }
  }
  return { valid: true, errors: [] }
}

export function validateMinMax(value, min, max) {
  if (value == null || value === '') return { valid: true, errors: [] }
  const num = Number(value)
  if (Number.isNaN(num)) return { valid: false, errors: ['Debe ser un número'] }
  if (min !== undefined && num < min) {
    return { valid: false, errors: [`El valor mínimo es ${min}`] }
  }
  if (max !== undefined && num > max) {
    return { valid: false, errors: [`El valor máximo es ${max}`] }
  }
  return { valid: true, errors: [] }
}

export function validateLength(value, min, max) {
  if (!value) return { valid: true, errors: [] }
  const len = value.trim().length
  if (min !== undefined && len < min) {
    return { valid: false, errors: [`Debe tener al menos ${min} caracteres`] }
  }
  if (max !== undefined && len > max) {
    return { valid: false, errors: [`Debe tener máximo ${max} caracteres`] }
  }
  return { valid: true, errors: [] }
}

export function validateEnum(value, allowed) {
  if (!value) return { valid: true, errors: [] }
  if (!allowed.includes(value)) {
    return { valid: false, errors: [`Valor no permitido. Debe ser uno de: ${allowed.join(', ')}`] }
  }
  return { valid: true, errors: [] }
}

export function validateCUI(value) {
  if (!value) return { valid: true, errors: [] }
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length !== 13) {
    return { valid: false, errors: ['CUI/DPI debe tener 13 dígitos'] }
  }
  return { valid: true, errors: [] }
}

export function validateNIT(value) {
  if (!value) return { valid: true, errors: [] }
  const pattern = /^\d{7,8}-\d$/
  if (!pattern.test(value)) {
    return { valid: false, errors: ['NIT debe tener formato 12345678-9'] }
  }
  return { valid: true, errors: [] }
}

export function composeValidators(...validators) {
  return (value) => {
    for (const validator of validators) {
      const result = validator(value)
      if (!result.valid) return result
    }
    return { valid: true, errors: [] }
  }
}
