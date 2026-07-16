import { getTaxRate } from '../utils/formatters.js'

export class SaleService {
  constructor(db, saleRepository, productRepository, customerRepository, inventoryRepository) {
    this._db = db
    this._saleRepo = saleRepository
    this._productRepo = productRepository
    this._customerRepo = customerRepository
    this._inventoryRepo = inventoryRepository
  }

  async getAll() {
    return this._saleRepo.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID de la venta es requerido')
    const sale = await this._saleRepo.findById(id)
    if (!sale) throw new Error(`Venta con id ${id} no encontrada`)
    return sale
  }

  async createSale(saleData, itemsData) {
    if (!itemsData || itemsData.length === 0) {
      throw new Error('La venta debe tener al menos un producto')
    }

    if (saleData.customerId) {
      const customer = await this._customerRepo.findById(saleData.customerId)
      if (!customer) throw new Error('Cliente no encontrado')
    }

    const resolvedItems = []
    for (const item of itemsData) {
      const product = await this._productRepo.findById(item.productId)
      if (!product) throw new Error(`Producto con id ${item.productId} no encontrado`)

      const quantity = Number(item.quantity)
      if (quantity <= 0) throw new Error(`Cantidad inválida para ${product.name}`)

      const currentStock = await this._inventoryRepo.getStockByProduct(product.id)
      if (currentStock < quantity) {
        throw new Error(`Stock insuficiente para ${product.name}: disponible ${currentStock}, requerido ${quantity}`)
      }

      const unitPrice = Number(item.unitPrice ?? product.salePrice)
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

    const sale = await this._db.transaction(
      'rw',
      this._db.sales,
      this._db.saleItems,
      this._db.products,
      this._db.inventoryMovements,
      async () => {
        const newSale = await this._saleRepo.createWithItems(
          {
            customerId: saleData.customerId || null,
            customerName: saleData.customerName || '',
            date: new Date().toISOString(),
            subtotal,
            tax,
            total,
            status: 'completed',
            notes: saleData.notes || ''
          },
          resolvedItems
        )

        for (const item of resolvedItems) {
          const product = await this._productRepo.findById(item.productId)
          const currentStock = product.stock
          const newStock = Math.max(0, currentStock - item.quantity)

          await this._inventoryRepo.create({
            productId: item.productId,
            productName: item.productName,
            type: 'sale',
            quantity: -item.quantity,
            stockBefore: currentStock,
            stockAfter: newStock,
            reference: 'sale',
            referenceId: newSale.id,
            notes: `Venta #${newSale.id}`,
            date: new Date().toISOString()
          })

          await this._productRepo.update(item.productId, { stock: newStock })
        }

        return newSale
      }
    )

    return sale
  }

  async cancelSale(id) {
    const sale = await this.getById(id)
    if (sale.status === 'cancelled') throw new Error('La venta ya está anulada')

    const items = sale.items || []

    await this._db.transaction(
      'rw',
      this._db.sales,
      this._db.products,
      this._db.inventoryMovements,
      async () => {
        sale.status = 'cancelled'
        sale.updatedAt = new Date().toISOString()
        await this._db.sales.put(sale.toJSON())

        for (const item of items) {
          const product = await this._productRepo.findById(item.productId)
          const currentStock = product.stock
          const newStock = currentStock + item.quantity

          await this._inventoryRepo.create({
            productId: item.productId,
            productName: item.productName,
            type: 'adjustment',
            quantity: item.quantity,
            stockBefore: currentStock,
            stockAfter: newStock,
            reference: 'cancel_sale',
            referenceId: sale.id,
            notes: `Anulación venta #${sale.id}`,
            date: new Date().toISOString()
          })

          await this._productRepo.update(item.productId, { stock: newStock })
        }
      }
    )

    return this.getById(id)
  }

  async deleteSale(id) {
    const sale = await this.getById(id)
    const items = sale.items || []

    await this._db.transaction(
      'rw',
      this._db.sales,
      this._db.saleItems,
      this._db.products,
      this._db.inventoryMovements,
      async () => {
        for (const item of items) {
          const product = await this._productRepo.findById(item.productId)
          const currentStock = product.stock
          const newStock = currentStock + item.quantity
          await this._inventoryRepo.create({
            productId: item.productId,
            productName: item.productName,
            type: 'adjustment',
            quantity: item.quantity,
            stockBefore: currentStock,
            stockAfter: newStock,
            reference: 'delete_sale',
            referenceId: sale.id,
            notes: `Eliminación venta #${sale.id}`,
            date: new Date().toISOString()
          })
          await this._productRepo.update(item.productId, { stock: newStock })
        }

        await this._db.saleItems.where('saleId').equals(id).delete()
        await this._db.sales.delete(id)
      }
    )

    return true
  }
}
