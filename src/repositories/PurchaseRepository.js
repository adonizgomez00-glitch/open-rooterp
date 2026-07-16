import { Purchase } from '../models/Purchase.js'
import { PurchaseItem } from '../models/PurchaseItem.js'

export class PurchaseRepository {
  constructor(db) {
    this.db = db
    this.table = db.purchases
    this.itemsTable = db.purchaseItems
  }

  async findAll() {
    const data = await this.table.orderBy('date').reverse().toArray()
    return data.map(Purchase.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    if (!data) return null
    const purchase = Purchase.fromDB(data)
    const items = await this.itemsTable.where('purchaseId').equals(id).toArray()
    purchase.items = items.map(PurchaseItem.fromDB)
    return purchase
  }

  async findBySupplierAndDate(supplierId, date) {
    const endDate = date + '\uffff'
    const data = await this.table
      .where('[supplierId+date]')
      .between([supplierId, date], [supplierId, endDate], true, true)
      .first()
    return data ? Purchase.fromDB(data) : null
  }

  async createWithItems(purchaseData, itemsData) {
    const purchase = new Purchase(purchaseData)
    const purchaseValidation = purchase.validate()
    if (!purchaseValidation.valid) {
      throw new Error(`Datos de compra inválidos: ${purchaseValidation.errors.join(', ')}`)
    }
    for (const itemData of itemsData) {
      const item = new PurchaseItem(itemData)
      const itemValidation = item.validate()
      if (!itemValidation.valid) {
        throw new Error(`Ítem inválido: ${itemValidation.errors.join(', ')}`)
      }
    }

    const { id, ...data } = purchase.toJSON()
    delete data.id

    const newId = await this.db.transaction('rw', this.table, this.itemsTable, async () => {
      const purchaseId = await this.table.add(data)
      for (const itemData of itemsData) {
        await this.itemsTable.add({ ...itemData, purchaseId })
      }
      return purchaseId
    })

    return this.findById(newId)
  }

  async findByDateRange(startDate, endDate) {
    const data = await this.table
      .where('date')
      .between(startDate, endDate + 'T23:59:59.999Z', true, true)
      .reverse()
      .toArray()
    return data.map(Purchase.fromDB)
  }

  async findBySupplier(supplierId) {
    const data = await this.table
      .where('supplierId')
      .equals(supplierId)
      .reverse()
      .toArray()
    return data.map(Purchase.fromDB)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Compra con id ${id} no encontrada`)
    }
    await this.db.transaction('rw', this.table, this.itemsTable, async () => {
      await this.itemsTable.where('purchaseId').equals(id).delete()
      await this.table.delete(id)
    })
    return true
  }

  async count() {
    return this.table.count()
  }
}
