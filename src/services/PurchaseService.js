import { getTaxRate } from '../utils/formatters.js'

export class PurchaseService {
  constructor(db, purchaseRepository, productRepository, supplierRepository, inventoryRepository) {
    this._db = db
    this._purchaseRepo = purchaseRepository
    this._productRepo = productRepository
    this._supplierRepo = supplierRepository
    this._inventoryRepo = inventoryRepository
  }

  async getAll() {
    return this._purchaseRepo.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID de la compra es requerido')
    const purchase = await this._purchaseRepo.findById(id)
    if (!purchase) throw new Error(`Compra con id ${id} no encontrada`)
    return purchase
  }

  async createPurchase(purchaseData, itemsData) {
    if (!itemsData || itemsData.length === 0) {
      throw new Error('La compra debe tener al menos un producto')
    }

    if (purchaseData.supplierId) {
      const supplier = await this._supplierRepo.findById(purchaseData.supplierId)
      if (!supplier) throw new Error('Proveedor no encontrado')
    }

    const resolvedItems = []
    for (const item of itemsData) {
      const product = await this._productRepo.findById(item.productId)
      if (!product) throw new Error(`Producto con id ${item.productId} no encontrado`)

      const quantity = Number(item.quantity)
      if (quantity <= 0) throw new Error(`Cantidad inválida para ${product.name}`)

      const unitPrice = Number(item.unitPrice ?? product.purchasePrice)
      resolvedItems.push({
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice
      })
    }

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0)
    const taxRate = getTaxRate()
    const tax = subtotal * taxRate
    const total = subtotal + tax

    const purchase = await this._db.transaction(
      'rw',
      this._db.purchases,
      this._db.purchaseItems,
      this._db.products,
      this._db.inventoryMovements,
      async () => {
        const newPurchase = await this._purchaseRepo.createWithItems(
          {
            supplierId: purchaseData.supplierId || null,
            supplierName: purchaseData.supplierName || '',
            date: new Date().toISOString(),
            subtotal,
            tax,
            total,
            status: 'completed',
            notes: purchaseData.notes || ''
          },
          resolvedItems
        )

        for (const item of resolvedItems) {
          const product = await this._productRepo.findById(item.productId)
          const currentStock = product.stock
          const newStock = currentStock + item.quantity

          await this._inventoryRepo.create({
            productId: item.productId,
            productName: item.productName,
            type: 'entry',
            quantity: item.quantity,
            stockBefore: currentStock,
            stockAfter: newStock,
            reference: 'purchase',
            referenceId: newPurchase.id,
            notes: `Compra #${newPurchase.id}`,
            date: new Date().toISOString()
          })

          await this._productRepo.update(item.productId, { stock: newStock })
        }

        return newPurchase
      }
    )

    return purchase
  }

  async cancelPurchase(id) {
    const purchase = await this.getById(id)
    if (purchase.status === 'cancelled') throw new Error('La compra ya está anulada')

    const items = purchase.items || []

    await this._db.transaction(
      'rw',
      this._db.purchases,
      this._db.products,
      this._db.inventoryMovements,
      async () => {
        purchase.status = 'cancelled'
        purchase.updatedAt = new Date().toISOString()
        await this._db.purchases.put(purchase.toJSON())

        for (const item of items) {
          const product = await this._productRepo.findById(item.productId)
          const currentStock = product.stock
          const newStock = Math.max(0, currentStock - item.quantity)

          await this._inventoryRepo.create({
            productId: item.productId,
            productName: item.productName,
            type: 'adjustment',
            quantity: -item.quantity,
            stockBefore: currentStock,
            stockAfter: newStock,
            reference: 'cancel_purchase',
            referenceId: purchase.id,
            notes: `Anulación compra #${purchase.id}`,
            date: new Date().toISOString()
          })

          await this._productRepo.update(item.productId, { stock: newStock })
        }
      }
    )

    return this.getById(id)
  }

  async deletePurchase(id) {
    const purchase = await this.getById(id)
    const items = purchase.items || []

    await this._db.transaction(
      'rw',
      this._db.purchases,
      this._db.purchaseItems,
      this._db.products,
      this._db.inventoryMovements,
      async () => {
        for (const item of items) {
          const product = await this._productRepo.findById(item.productId)
          const currentStock = product.stock
          const newStock = Math.max(0, currentStock - item.quantity)
          await this._inventoryRepo.create({
            productId: item.productId,
            productName: item.productName,
            type: 'adjustment',
            quantity: -item.quantity,
            stockBefore: currentStock,
            stockAfter: newStock,
            reference: 'delete_purchase',
            referenceId: purchase.id,
            notes: `Eliminación compra #${purchase.id}`,
            date: new Date().toISOString()
          })
          await this._productRepo.update(item.productId, { stock: newStock })
        }

        await this._db.purchaseItems.where('purchaseId').equals(id).delete()
        await this._db.purchases.delete(id)
      }
    )

    return true
  }
}
