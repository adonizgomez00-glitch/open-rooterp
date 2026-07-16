const REQUIRED_FIELDS = ['code', 'name', 'type']
const VALID_TYPES = ['asset', 'liability', 'equity', 'income', 'expense']

export class Account {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.code = data.code ?? ''
    this.name = data.name ?? ''
    this.type = data.type ?? ''
    this.description = data.description ?? ''
    this.active = data.active ?? true
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Account(data)
  }

  validate() {
    const errors = []
    for (const field of REQUIRED_FIELDS) {
      if (!this[field]?.toString().trim()) {
        errors.push(`El campo ${field} es requerido`)
      }
    }
    if (this.code && !/^\d{4}$/.test(this.code)) {
      errors.push('El código debe tener 4 dígitos numéricos')
    }
    if (this.type && !VALID_TYPES.includes(this.type)) {
      errors.push(`Tipo inválido: debe ser uno de ${VALID_TYPES.join(', ')}`)
    }
    return { valid: errors.length === 0, errors }
  }
}
