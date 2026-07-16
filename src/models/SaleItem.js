export class SaleItem {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.saleId = data.saleId ?? null
    this.productId = data.productId ?? null
    this.productCode = data.productCode ?? ''
    this.productName = data.productName ?? ''
    this.quantity = data.quantity ?? 1
    this.unitPrice = data.unitPrice ?? 0
    this.subtotal = data.subtotal ?? 0
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new SaleItem(data)
  }

  validate() {
    const errors = []
    if (!this.productId) errors.push('El producto es requerido')
    if (this.quantity <= 0) errors.push('La cantidad debe ser mayor a cero')
    if (this.unitPrice < 0) errors.push('El precio unitario no puede ser negativo')
    return { valid: errors.length === 0, errors }
  }
}
