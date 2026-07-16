export class InventoryService {
  constructor(db, productRepository, inventoryRepository) {
    this._db = db
    this._productRepo = productRepository
    this._inventoryRepo = inventoryRepository
  }

  async getStockOverview() {
    const products = await this._productRepo.findAll()
    const overview = []

    for (const product of products) {
      const calculatedStock = await this._inventoryRepo.getStockByProduct(product.id)
      overview.push({
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        stock: calculatedStock,
        stockMin: product.stockMin,
        status: this._getStockStatus(calculatedStock, product.stockMin)
      })
    }

    return overview.sort((a, b) => a.name.localeCompare(b.name))
  }

  _getStockStatus(stock, stockMin) {
    if (stockMin <= 0) return 'ok'
    if (stock <= 0) return 'critical'
    if (stock <= stockMin) return 'low'
    return 'ok'
  }

  async getMovementsByProduct(productId) {
    if (!productId) throw new Error('El ID del producto es requerido')
    const product = await this._productRepo.findById(productId)
    if (!product) throw new Error(`Producto con id ${productId} no encontrado`)
    return this._inventoryRepo.findByProduct(productId)
  }

  async getAllMovements() {
    return this._inventoryRepo.findAll()
  }

  async getProductById(productId) {
    if (!productId) throw new Error('El ID del producto es requerido')
    const product = await this._productRepo.findById(productId)
    if (!product) throw new Error(`Producto con id ${productId} no encontrado`)
    return product
  }

  async _executeAdjustment(data, product, quantity) {
    const currentStock = await this._inventoryRepo.getStockByProduct(data.productId)
    const stockAfter = currentStock + quantity
    if (stockAfter < 0) {
      throw new Error('El stock no puede ser negativo después del ajuste')
    }

    const movement = await this._inventoryRepo.create({
      productId: data.productId,
      productName: product.name,
      type: data.type,
      quantity: quantity,
      stockBefore: currentStock,
      stockAfter: stockAfter,
      reference: data.reference || 'manual',
      notes: data.notes || '',
      date: new Date().toISOString()
    })

    await this._productRepo.update(data.productId, { stock: stockAfter })

    return movement
  }

  async createAdjustment(data) {
    if (!data.productId) throw new Error('El producto es requerido')
    if (!data.type) throw new Error('El tipo de movimiento es requerido')
    if (!data.quantity || data.quantity === 0) throw new Error('La cantidad no puede ser cero')

    const product = await this._productRepo.findById(data.productId)
    if (!product) throw new Error(`Producto con id ${data.productId} no encontrado`)

    let quantity = Number(data.quantity)
    if (data.type === 'exit') {
      quantity = -Math.abs(quantity)
    }

    // Si hay DB real, usar transacción atómica para evitar race conditions
    // entre lectura de stock, creación del movimiento y actualización del producto.
    // Sin transacción, dos ajustes concurrentes leerían el mismo stockBefore.
    if (this._db) {
      return this._db.transaction(
        'rw',
        this._db.inventoryMovements,
        this._db.products,
        async () => this._executeAdjustment(data, product, quantity)
      )
    }

    // Fallback sin transacción para tests (mock repos no usan Dexie)
    return this._executeAdjustment(data, product, quantity)
  }
}
