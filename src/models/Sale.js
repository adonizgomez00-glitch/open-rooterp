const VALID_STATUSES = ['draft', 'completed', 'cancelled']

export class Sale {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.customerId = data.customerId ?? null
    this.customerName = data.customerName ?? ''
    this.date = data.date ?? new Date().toISOString()
    this.subtotal = data.subtotal ?? 0
    this.tax = data.tax ?? 0
    this.total = data.total ?? 0
    this.status = data.status ?? 'completed'
    this.notes = data.notes ?? ''
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Sale(data)
  }

  validate() {
    const errors = []
    if (!VALID_STATUSES.includes(this.status)) {
      errors.push(`El estado debe ser uno de: ${VALID_STATUSES.join(', ')}`)
    }
    if (this.subtotal < 0) errors.push('El subtotal no puede ser negativo')
    if (this.tax < 0) errors.push('El impuesto no puede ser negativo')
    if (this.total < 0) errors.push('El total no puede ser negativo')
    return { valid: errors.length === 0, errors }
  }
}
