const REQUIRED_FIELDS = ['documentId', 'name']
const TEXT_FIELDS = ['documentId', 'name', 'email', 'phone', 'address']

export class Customer {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.documentId = data.documentId ?? ''
    this.name = data.name ?? ''
    this.email = data.email ?? ''
    this.phone = data.phone ?? ''
    this.address = data.address ?? ''
    this.active = data.active ?? true
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Customer(data)
  }

  validate() {
    const errors = []
    for (const field of REQUIRED_FIELDS) {
      if (!this[field]?.toString().trim()) {
        errors.push(`El campo ${field} es requerido`)
      }
    }
    for (const field of TEXT_FIELDS) {
      if (typeof this[field] !== 'string') {
        errors.push(`El campo ${field} debe ser texto`)
      }
    }
    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('El email no tiene un formato válido')
    }
    return { valid: errors.length === 0, errors }
  }
}
