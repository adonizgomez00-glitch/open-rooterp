const VALID_TYPES = ['entry', 'exit', 'adjustment', 'sale', 'purchase']

export class InventoryMovement {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.productId = data.productId ?? null
    this.productName = data.productName ?? ''
    this.type = data.type ?? 'adjustment'
    this.quantity = data.quantity ?? 0
    this.stockBefore = data.stockBefore ?? 0
    this.stockAfter = data.stockAfter ?? 0
    this.reference = data.reference ?? ''
    this.referenceId = data.referenceId ?? null
    this.notes = data.notes ?? ''
    this.date = data.date ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new InventoryMovement(data)
  }

  validate() {
    const errors = []
    if (!this.productId) errors.push('El producto es requerido')
    if (!VALID_TYPES.includes(this.type)) {
      errors.push(`El tipo debe ser uno de: ${VALID_TYPES.join(', ')}`)
    }
    if (this.quantity === 0) errors.push('La cantidad no puede ser cero')
    return { valid: errors.length === 0, errors }
  }
}
