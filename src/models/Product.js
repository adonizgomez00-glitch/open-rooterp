const REQUIRED_FIELDS = ['code', 'name']
const TEXT_FIELDS = ['code', 'name', 'description', 'category']
const NUMERIC_FIELDS = ['purchasePrice', 'salePrice', 'stock', 'stockMin']

export class Product {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.code = data.code ?? ''
    this.name = data.name ?? ''
    this.description = data.description ?? ''
    this.category = data.category ?? ''
    this.purchasePrice = data.purchasePrice ?? 0
    this.salePrice = data.salePrice ?? 0
    this.stock = data.stock ?? 0
    this.stockMin = data.stockMin ?? 0
    this.active = data.active ?? true
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Product(data)
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
    for (const field of NUMERIC_FIELDS) {
      if (typeof this[field] !== 'number' || Number.isNaN(this[field])) {
        errors.push(`El campo ${field} debe ser un número válido`)
      }
    }
    if (this.salePrice < 0) errors.push('El precio de venta no puede ser negativo')
    if (this.purchasePrice < 0) errors.push('El precio de compra no puede ser negativo')
    if (this.stock < 0) errors.push('El stock no puede ser negativo')
    if (this.stockMin < 0) errors.push('El stock mínimo no puede ser negativo')
    return { valid: errors.length === 0, errors }
  }
}
